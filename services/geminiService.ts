import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";
import { FAQ_DATABASE } from "../data/faq_data";
import { KNOWLEDGE_BASE } from "../data/knowledge_base";
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

let cachedElectricalData: string | null = null;
let cachedSchematicsData: string | null = null;

const getElectricalContext = async (userPrompt: string) => {
    const keywords = [
        // Termos diretos de elétrica
        "ELÉTRICA", "ELETRICA", "ESQUEMA", "FIO", "BORNE", "LIGAÇÃO", "LIGACAO", "DISJUNTOR", "CONTATORA", "CABO", "TENSÃO", "TENSAO", "VOLT", "AMPER", "CORRENTE", "TRIFÁSICO", "TRIFASICO", "MONOFÁSICO", "MONOFASICO", "CONTROLADOR", "AGEON", "FULL GAUGE", "CLP", "PANASONIC",
        // Componentes exclusivos de painel/comando
        "RELÉ", "RELE", "COMANDO", "PAINEL", "QUADRO", "FUSÍVEL", "FUSIVEL",
        // Sintomas característicos de falha elétrica/comando
        "NÃO LIGA", "NAO LIGA", "NÃO PARTE", "NAO PARTE", "NÃO ACIONA", "NAO ACIONA", "DESARMA", "CAINDO", "CURTO", "QUEIMOU"
    ];
    const upper = userPrompt.toUpperCase();
    if (keywords.some(k => upper.includes(k))) {
        // Carrega as bases apenas se necessário (Lazy Loading) com cache
        if (!cachedElectricalData) {
            const { ELECTRICAL_DATABASE } = await import("../data/electrical_data");
            cachedElectricalData = ELECTRICAL_DATABASE;
        }
        if (!cachedSchematicsData) {
            const { SCHEMATICS_DATABASE } = await import("../data/schematics_data");
            cachedSchematicsData = SCHEMATICS_DATABASE;
        }
        return `\n\n⚡ [BASE DE DADOS ELÉTRICA E ESQUEMAS ATIVADA]\nUse as informações abaixo para responder dúvidas técnicas sobre ligações e esquemas:\n${cachedElectricalData}\n\n${cachedSchematicsData}\n`;
    }
    return "";
};

const getFullSystemInstruction = async (toolType: string, userPrompt: string = "", mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO') => {
  const fieldKnowledge = knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);
  const electricalContext = await getElectricalContext(userPrompt);

  let modeInstruction = "";
  if (mode === 'ELEC') {
      modeInstruction = "\n\n🚨 [MODO FOCO EM ELÉTRICA ATIVADO]\nIgnore detalhes do ciclo de refrigeração. Foque 100% em esquemas elétricos, bornes, CLP e componentes de comando. Use a base de dados de esquemas, a seção de [SUPORTE TÉCNICO: PERGUNTAS E RESPOSTAS ELÉTRICAS] e a seção de [DIAGNÓSTICO RÁPIDO: O QUE PODE SER?] imediatamente para responder dúvidas sobre componentes, funções do painel e falhas de funcionamento.";
  } else if (mode === 'REF') {
      modeInstruction = "\n\n🚨 [MODO FOCO EM REFRIGERAÇÃO ATIVADO]\nIgnore detalhes de comando elétrico/CLP. Foque 100% no ciclo frigorífico, pressões, fluido, troca de calor e mecânica do compressor.";
  }

  const faqContext = `\n\n[PACOTE DE CONHECIMENTO DE REFERÊNCIA]\nO conteúdo abaixo são casos frequentes e diagnósticos recomendados pela Ordemilk. Use-os como base de conhecimento e inspiração para suas análises, mas sinta-se livre para adaptar o diagnóstico conforme a situação específica relatada pelo técnico. Não trate como regras rígidas, mas como um guia de experiência acumulada.\n${FAQ_DATABASE}`;

  const structuredKnowledge = `\n\n[BASE DE CONHECIMENTO TÉCNICO ESTRUTURADA EM 4 CAMADAS]\n${KNOWLEDGE_BASE}`;

  const diagnosticGuidance = `
[DIRETRIZES DE RACIOCÍNIO TÉCNICO]
1. NÃO CONCLUA SEM CONFIRMAR: Se o sintoma for genérico, peça contexto antes de afirmar a causa (ex: "A IHM acende?", "Qual o modelo do painel?").
2. ESTRUTURA DE DIAGNÓSTICO: Sempre que possível, estruture sua resposta com: Sintoma, Causa Provável, Causas Possíveis, Ordem de Verificação e Segurança.
3. NÍVEIS DE RESPOSTA: Adapte o tom para o usuário. Se for técnico, use nomes de componentes (DM3, K4, Y5). Se for operador, use termos mais simples.
4. SEGURANÇA PRIMEIRO: Sempre inclua avisos de segurança antes de sugerir testes em painéis energizados.
5. CAUSA RAIZ: Lembre-se que falhas elétricas muitas vezes são causadas por problemas mecânicos/frigoríficos.
`;

  return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}\n${brandManual}\n${electricalContext}\n\n${fieldKnowledge}\n${faqContext}\n${structuredKnowledge}\n${diagnosticGuidance}\n\n${toolPrompt}\n${modeInstruction}`;
};

export const generateTechResponse = async (
  userPrompt: string,
  toolType: keyof typeof TOOL_PROMPTS | "ASSISTANT",
  retries = 2
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = await getFullSystemInstruction(toolType, userPrompt);
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
    onFinished?: (text: string, sources?: {title: string, uri: string}[]) => void,
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

        let systemInstruction = await getFullSystemInstruction("DIAGNOSTIC", fullConversationText, mode);

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