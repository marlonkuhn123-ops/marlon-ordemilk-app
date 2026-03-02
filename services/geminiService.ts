import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const msg = error?.message || "";

  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return "⚠️ LIMITE DE USO EXCEDIDO: O sistema atingiu o limite de consultas. Aguarde 60 segundos.";
  }
  return `⚠️ ERRO DE CONEXÃO: ${error?.message || "Verifique internet e chave de API."}`;
};

const getDynamicBrandContext = (userPrompt: string) => {
  const upper = userPrompt.toUpperCase();
  let manual = "";
  for (const brand of Object.keys(EXTERNAL_MANUALS)) {
    if (upper.includes(brand)) {
      manual += `\n\n🚨 [MANUAL ESPECÍFICO DETECTADO: ${brand}]\n${EXTERNAL_MANUALS[brand]}\n`;
    }
  }
  return manual;
};

const getFullSystemInstruction = (toolType: string, userPrompt: string = "") => {
  const fieldKnowledge = knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);

  return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}\n${brandManual}\n\n${fieldKnowledge}\n\n${toolPrompt}`;
};

const getApiKeyOrThrow = () => {
  let key = "";

  try {
    // @ts-ignore
    key = GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  } catch (e) {
    // @ts-ignore
    key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  }

  if (!key || key === "" || key.includes("PLACEHOLDER")) {
    throw new Error(`CHAVE NÃO ENCONTRADA NO BUILD. Verifique se o nome na Vercel é exatamente GEMINI_API_KEY.`);
  }
  
  return key;
};

export const generateTechResponse = async (
  userPrompt: string,
  toolType: keyof typeof TOOL_PROMPTS | "ASSISTANT"
) => {
  const apiKey = getApiKeyOrThrow();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: userPrompt,
      config: {
        systemInstruction: getFullSystemInstruction(toolType, userPrompt),
        temperature: 0.1,
      },
    });

    return response.text || "";
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const generateChatResponseStream = async (
    history: { role: string; parts: any[] }[],
    onChunk?: (text: string) => void,
    onFinished?: (text: string, sources?: {title: string, uri: string}[]) => void
) => {
    const apiKey = getApiKeyOrThrow();
    const ai = new GoogleGenAI({ apiKey });

    try {
        const contents = history;

        const fullConversationText = history
            .map(h => h.parts.map(p => p.text).filter(Boolean).join(' '))
            .join(' ');

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-flash-latest',
            contents,
            config: {
                systemInstruction: getFullSystemInstruction("DIAGNOSTIC", fullConversationText),
                temperature: 0.2,
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
    const apiKey = getApiKeyOrThrow();
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                { text: "Analise esta placa e retorne APENAS JSON: {volts: number, corrente: number, phase: 'tri'|'bi'|'mono'}." }
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