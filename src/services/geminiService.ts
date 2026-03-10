import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";
import { env } from "../config/env";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  files?: { id: string, data: string, mime: string, type: 'image' | 'audio' }[];
  isError?: boolean;
  isStreaming?: boolean;
  sources?: { title: string, uri: string }[];
}

const handleApiError = (error: any) => {
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

const getElectricalContext = async (userPrompt: string, chatContext?: 'AUTO' | 'REFRIGERACAO' | 'ELETRICA') => {
  if (chatContext === 'REFRIGERACAO') return ""; // Ignora elétrica se forocado para refrigeração

  const isForcedElectrical = chatContext === 'ELETRICA';

  const keywords = [
    // Termos diretos de elétrica
    "ELÉTRICA", "ELETRICA", "ESQUEMA", "FIO", "BORNE", "LIGAÇÃO", "LIGACAO", "DISJUNTOR", "CONTATORA", "CABO", "TENSÃO", "TENSAO", "VOLT", "AMPER", "CORRENTE", "TRIFÁSICO", "TRIFASICO", "MONOFÁSICO", "MONOFASICO", "CONTROLADOR", "AGEON", "FULL GAUGE", "CLP", "PANASONIC",
    // Componentes exclusivos de painel/comando
    "RELÉ", "RELE", "COMANDO", "PAINEL", "QUADRO", "FUSÍVEL", "FUSIVEL",
    // Sintomas característicos de falha elétrica/comando
    "NÃO LIGA", "NAO LIGA", "NÃO PARTE", "NAO PARTE", "NÃO ACIONA", "NAO ACIONA", "DESARMA", "CAINDO", "CURTO", "QUEIMOU"
  ];
  const upper = userPrompt.toUpperCase();

  if (isForcedElectrical || keywords.some(k => upper.includes(k))) {
    // Carrega a base apenas se necessário (Lazy Loading)
    const { SCHEMATICS_DATABASE } = await import("../data/electrical_data");
    const prefix = isForcedElectrical
      ? `\n\n⚡ [MODO FORÇADO EXCLUSIVO: DECLARAÇÃO ELÉTRICA]\nO técnico solicitou análise estritamente elétrica do painel. Esqueça termodinâmica por ora. Use os esquemas abaixo:\n`
      : `\n\n⚡ [ESQUEMAS ELÉTRICOS ATIVADOS]\nUse as informações abaixo para responder dúvidas técnicas:\n`;
    return prefix + SCHEMATICS_DATABASE + "\n";
  }
  return "";
};

const getFullSystemInstruction = async (toolType: string, userPrompt: string = "", chatContext: 'AUTO' | 'REFRIGERACAO' | 'ELETRICA' = 'AUTO') => {
  const fieldKnowledge = knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);
  const electricalContext = await getElectricalContext(userPrompt, chatContext);

  let explicitContextPrompt = "";
  if (chatContext === 'REFRIGERACAO') {
    explicitContextPrompt = `\n\n❄️ [MODO FORÇADO EXCLUSIVO: DECLARAÇÃO REFRIGERAÇÃO]\nO técnico atesta que a parte elétrica/comando está perfeita. A falha é puramente frigorífica ou mecânica. Ignore elétrica na análise inicial.\n`;
  }

  return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}\n${brandManual}\n${electricalContext}\n${explicitContextPrompt}\n\n${fieldKnowledge}\n\n${toolPrompt}`;
};

const getApiKeyOrThrow = () => {
  const key = env.geminiApiKey;

  if (!key || key.trim() === "" || key.includes("PLACEHOLDER")) {
    throw new Error(`CHAVE NÃO ENCONTRADA.\nPara adicionar sua chave da API de forma segura no seu próprio dispositivo sem colar no código, digite no chat:\n**/chave AIzaSySuaChaveAqui**`);
  }

  return key;
};

export const generateTechResponse = async (
  userPrompt: string,
  toolType: keyof typeof TOOL_PROMPTS | "ASSISTANT",
  retries = 2
): Promise<string> => {
  const apiKey = getApiKeyOrThrow();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = await getFullSystemInstruction(toolType, userPrompt);
    const useHeavyModel = toolType === "DIAGNOSTIC" || toolType === "ASSISTANT";
    const response = await ai.models.generateContent({
      model: useHeavyModel ? "gemini-3.0-pro" : "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 600,
      },
    });

    return response.text || "";
  } catch (error: any) {
    if (retries > 0 && error?.message?.includes("503")) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateTechResponse(userPrompt, toolType, retries - 1);
    }
    throw new Error(handleApiError(error));
  }
};

export const generateChatResponseStream = async (
  history: { role: string; parts: any[] }[],
  chatContext: 'AUTO' | 'REFRIGERACAO' | 'ELETRICA' = 'AUTO',
  onChunk?: (text: string) => void,
  onFinished?: (text: string, sources?: { title: string, uri: string }[]) => void,
  retries = 2
): Promise<string> => {
  const apiKey = getApiKeyOrThrow();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = history;

    const fullConversationText = history
      .map(h => h.parts.map(p => p.text).filter(Boolean).join(' '))
      .join(' ');

    const systemInstruction = await getFullSystemInstruction("DIAGNOSTIC", fullConversationText, chatContext);

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.0-pro',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 800,
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateChatResponseStream(history, chatContext, onChunk, onFinished, retries - 1);
    }
    throw new Error(handleApiError(error));
  }
};

export const analyzePlateImage = async (imageBase64: string, retries = 2): Promise<string> => {
  const apiKey = getApiKeyOrThrow();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.0-pro',
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