import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";

const handleApiError = (error: any) => {
    console.error("Gemini API Error:", error);
    const msg = error?.message || "";
    
    if (msg.includes("429") || msg.includes("quota")) {
        return "⚠️ LIMITE DE USO EXCEDIDO: O sistema atingiu o limite de consultas gratuitas. Aguarde 60 segundos.";
    }
    return `⚠️ ERRO DE CONEXÃO: ${error.message || 'Verifique sua internet e a chave de API.'}`;
};

// --- LÓGICA DE INJEÇÃO DINÂMICA DE MANUAL ---
const getDynamicBrandContext = (userPrompt: string) => {
    const upperPrompt = userPrompt.toUpperCase();
    let specificManual = "";

    // Varre as chaves da biblioteca externa (ex: REAFRIO, DELAVAL)
    for (const brand of Object.keys(EXTERNAL_MANUALS)) {
        if (upperPrompt.includes(brand)) {
            specificManual += `\n\n🚨 [ATENÇÃO: MANUAL ESPECÍFICO DETECTADO PARA: ${brand}]\nUse os dados abaixo com prioridade sobre a lógica Ordemilk:\n${EXTERNAL_MANUALS[brand]}\n`;
        }
    }
    return specificManual;
};

const getFullSystemInstruction = (toolType: string, userPrompt: string = "") => {
    const fieldKnowledge = knowledgeService.getKnowledgeContext();
    const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
    
    // Injeção Condicional: Só adiciona o manual se a marca foi citada
    const brandManual = getDynamicBrandContext(userPrompt);

    return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}\n${brandManual}\n\n${fieldKnowledge}\n\n${toolPrompt}`;
};

export const generateTechResponse = async (userPrompt: string, toolType: keyof typeof TOOL_PROMPTS | "ASSISTANT") => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chave não configurada.");
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userPrompt,
            config: {
                systemInstruction: getFullSystemInstruction(toolType, userPrompt),
                temperature: 0.1,
                tools: [{ googleSearch: {} }]
            }
        });

        return response.text || "";
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateChatResponseStream = async (
    history: { role: string; parts: any[] }[],
    newMessage: string,
    fileData?: { mimeType: string, data: string }, // Updated signature to generic file
    onChunk?: (text: string) => void,
    onFinished?: (text: string, sources?: {title: string, uri: string}[]) => void
) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chave não configurada.");
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        const contents = [...history];
        const currentParts: any[] = [{ text: newMessage }];
        
        if (fileData) {
            currentParts.push({
                inlineData: { data: fileData.data, mimeType: fileData.mimeType },
            });
        }
        
        contents.push({ role: 'user', parts: currentParts });

        // Concatena todo o histórico para verificar menções a marcas antigas, 
        // mas prioriza a mensagem atual.
        const fullConversationText = history.map(h => h.parts[0]?.text).join(' ') + " " + newMessage;

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview', // Supports multimodal (audio/image)
            contents: contents,
            config: {
                systemInstruction: getFullSystemInstruction("DIAGNOSTIC", fullConversationText),
                temperature: 0.2,
                tools: [{ googleSearch: {} }]
            }
        });

        let fullText = "";
        let sources: { title: string; uri: string }[] = [];

        for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            fullText += chunkText;
            
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                groundingChunks.forEach((c: any) => {
                    if (c.web) sources.push({ title: c.web.title, uri: c.web.uri });
                });
            }

            if (onChunk) onChunk(fullText);
        }

        if (onFinished) onFinished(fullText, sources.length > 0 ? sources : undefined);
        return fullText;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const analyzePlateImage = async (imageBase64: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chave não configurada.");
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                { text: "Analise esta placa e retorne APENAS JSON: {volts: number, amps: number, phase: 'tri'|'bi'|'mono'}." }
            ],
            config: { temperature: 0.1, responseMimeType: "application/json" }
        });
        
        const rawText = response.text || "{}";
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        return cleanJson;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};