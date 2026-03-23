import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { ENV } from "../config/env";

const handleApiError = (error: any) => {
  // Log seguro: apenas a mensagem, evitando expor o objeto de erro completo que pode conter a chave de API no config
  console.error("Gemini API Error:", error?.message || "Unknown error");
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

const getFullSystemInstruction = (toolType: string, userPrompt: string = "", mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO') => {
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);

  let modeInstruction = "";
  if (mode === 'ELEC') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM ELÉTRICA ATIVADO]\nFoque 100% em esquemas elétricos, bornes, CLP e componentes de comando.";
  } else if (mode === 'REF') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM REFRIGERAÇÃO ATIVADO]\nIgnore detalhes de comando elétrico/CLP. Foque 100% no ciclo frigorífico, pressões, fluido, troca de calor e mecânica do compressor.";
  }

  return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}\n${brandManual}\n\n${toolPrompt}\n${modeInstruction}`;
};

export const generateTechResponse = async (
  userPrompt: string,
  toolType: keyof typeof TOOL_PROMPTS | "ASSISTANT",
  retries = 2
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = getFullSystemInstruction(toolType, userPrompt);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    return response.text || "";
  } catch (error: any) {
    if (retries > 0 && error?.message?.includes("503")) {
      console.warn(`Erro 503 detectado. Tentando novamente em 2s... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateTechResponse(userPrompt, toolType, retries - 1);
    }
    throw new Error(handleApiError(error));
  }
};

export const generateChatResponseStream = async (
  history: { role: string; parts: any[] }[],
  onChunk?: (text: string) => void,
  onFinished?: (text: string, sources?: { title: string, uri: string }[]) => void,
  mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO',
  retries = 2
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = history;

    const fullConversationText = history
      .map(h => h.parts.map(p => p.text).filter(Boolean).join(' '))
      .join(' ');

    let systemInstruction = getFullSystemInstruction("DIAGNOSTIC", fullConversationText, mode);

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
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
    if (retries > 0 && error?.message?.includes("503")) {
      console.warn(`Erro 503 detectado no stream. Tentando novamente em 2s... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateChatResponseStream(history, onChunk, onFinished, mode, retries - 1);
    }
    throw new Error(handleApiError(error));
  }
};

export const analyzePlateImage = async (imageBase64: string, retries = 2): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
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
    if (retries > 0 && error?.message?.includes("503")) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return analyzePlateImage(imageBase64, retries - 1);
    }
    throw new Error(handleApiError(error));
  }
};