import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";
import { FAQ_DATABASE } from "../data/faq_data";
import { KNOWLEDGE_BASE } from "../data/knowledge_base";
import { ENV } from "../config/env";
import { SupportDiagnosticContext } from "../types";

const DEFAULT_TEXT_MODEL = ENV.GEMINI_TEXT_MODEL;
const SUPPORT_PRIMARY_MODEL = ENV.GEMINI_SUPPORT_MODEL;
const SUPPORT_FALLBACK_MODEL = ENV.GEMINI_SUPPORT_FALLBACK_MODEL;

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

const isModelAvailabilityError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("model") &&
    (
      message.includes("not found") ||
      message.includes("not supported") ||
      message.includes("permission") ||
      message.includes("access") ||
      message.includes("unavailable")
    )
  );
};

const isRetryableStreamError = (error: any) => String(error?.message || "").includes("503");
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const hasContextValue = (value?: string) => Boolean(value && value.trim());
const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const isBaseEquipmentContextComplete = (diagnosticContext: SupportDiagnosticContext) =>
  hasContextValue(diagnosticContext.model) &&
  hasContextValue(diagnosticContext.voltage) &&
  hasContextValue(diagnosticContext.refrigerant) &&
  hasContextValue(diagnosticContext.temperature);

const extractTankCapacityLiters = (model?: string): number | null => {
  if (!hasContextValue(model)) return null;

  const normalized = normalizeText(model!);
  const thousandMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(k|mil)\b/);
  if (thousandMatch) {
    const parsed = parseFloat(thousandMatch[1].replace(',', '.'));
    return Number.isFinite(parsed) ? Math.round(parsed * 1000) : null;
  }

  const litersMatch = normalized.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(l|litros?)\b/);
  const rawNumber = litersMatch?.[1] || normalized.match(/\b(\d{4,6})\b/)?.[1];
  if (!rawNumber) return null;

  const parsed = parseFloat(rawNumber.replace(/[.\s]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const getDiagnosticContextInstruction = (diagnosticContext: SupportDiagnosticContext, userPrompt: string = "") => {
  const lines: string[] = [];

  if (hasContextValue(diagnosticContext.model)) {
    lines.push(`- Modelo/capacidade do tanque informado previamente: ${diagnosticContext.model}`);
  }
  if (hasContextValue(diagnosticContext.voltage)) {
    lines.push(`- Tensão informada previamente: ${diagnosticContext.voltage}`);
  }
  if (hasContextValue(diagnosticContext.refrigerant)) {
    lines.push(`- Fluido refrigerante informado previamente: ${diagnosticContext.refrigerant}`);
  }
  if (hasContextValue(diagnosticContext.temperature)) {
    lines.push(`- Temperatura atual do leite informada previamente: ${diagnosticContext.temperature}`);
  }

  if (isBaseEquipmentContextComplete(diagnosticContext)) {
    lines.push(`- ATALHO INTELIGENTE ATIVO: modelo, tensao, fluido refrigerante e temperatura atual do leite foram preenchidos manualmente pelo tecnico e sao fatos confirmados.`);
    lines.push(`- REGRA DE CONDUTA: nao pergunte novamente modelo, tensao, fluido refrigerante ou temperatura atual do leite.`);
    lines.push(`- PRIMEIRA RESPOSTA: use esses 4 dados para elevar a hipotese inicial e pergunte apenas o que ainda falta para fechar o diagnostico.`);
  }

  const tankCapacity = extractTankCapacityLiters(diagnosticContext.model);
  if (tankCapacity !== null && tankCapacity >= 4000) {
    lines.push(`- REGRA OPERACIONAL: trate este equipamento como tanque >= 4000L com arquitetura CLP Panasonic. Nao pergunte sobre Full Gauge, Ageon ou controlador comercial.`);
    const normalizedPrompt = normalizeText(userPrompt);
    if (normalizedPrompt.includes('full gauge') || normalizedPrompt.includes('ageon')) {
      lines.push(`- CORRECAO OBRIGATORIA NA PRIMEIRA LINHA: o tecnico mencionou Full Gauge ou Ageon, o que NAO existe neste tanque. Comece a resposta corrigindo isso: diga que este tanque usa CLP Panasonic, nao Full Gauge nem Ageon.`);
    }
  }

  if (lines.length === 0) return "";
  return `\n\n[CONTEXTO BASE DO EQUIPAMENTO - INFORMADO ANTES DA PERGUNTA]\n${lines.join('\n')}`;
};

const getSupportConfig = (systemInstruction: string, modelName: string, isFirstReply: boolean) => {
  const baseConfig: Record<string, any> = {
    systemInstruction,
    temperature: 0.2,
  };

  if (modelName.startsWith("gemini-3")) {
    baseConfig.thinkingConfig = {
      thinkingLevel: isFirstReply ? "low" : "medium",
    };
  }

  return baseConfig;
};

const getFullSystemInstruction = async (
  toolType: string,
  userPrompt: string = "",
  mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO',
  diagnosticContext: SupportDiagnosticContext = {},
  includeExtendedKnowledge = true
) => {
  const fieldKnowledge = knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);
  const electricalContext = await getElectricalContext(userPrompt);
  const equipmentContext = getDiagnosticContextInstruction(diagnosticContext, userPrompt);

  let modeInstruction = "";
  if (mode === 'ELEC') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM ELÉTRICA ATIVADO]\nIgnore detalhes do ciclo de refrigeração. Foque 100% em esquemas elétricos, bornes, CLP e componentes de comando. Use a base de dados de esquemas, a seção de [SUPORTE TÉCNICO: PERGUNTAS E RESPOSTAS ELÉTRICAS] e a seção de [DIAGNÓSTICO RÁPIDO: O QUE PODE SER?] imediatamente para responder dúvidas sobre componentes, funções do painel e falhas de funcionamento.";
  } else if (mode === 'REF') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM REFRIGERAÇÃO ATIVADO]\nIgnore detalhes de comando elétrico/CLP. Foque 100% no ciclo frigorífico, pressões, fluido, troca de calor e mecânica do compressor.";
  }

  let cadenceInstruction = "";
  if (toolType === "DIAGNOSTIC") {
    cadenceInstruction = `\n\n🚨 [INSTRUÇÃO OBRIGATÓRIA DE CADÊNCIA - UX DE CAMPO]
O técnico está no cliente e precisa de objetividade. Na PRIMEIRA resposta, é proibido entregar texto longo ou diagnóstico completo.
Mantenha o mesmo contexto técnico, a mesma inteligência e o mesmo tom educado e professoral de hoje. Você não deve soar frio, seco ou mal educado. Seja cordial, claro e profissional.

PRIMEIRA RESPOSTA — USE EXATAMENTE ESTE FORMATO:

Olá. Vou te ajudar com um diagnóstico rápido e direto.

**🎯 Hipótese Inicial:** [1 frase curta com a hipótese mais forte no momento]

**❓ Preciso confirmar:**
1. [pergunta objetiva 1]
2. [pergunta objetiva 2]

**⚠️ Faça agora:** [1 ação segura, concreta e imediata]

REGRA DE OURO:
- Mantenha a resposta concisa e focada no formato acima.
- Evite listar todas as causas possíveis ou despejar teoria na primeira interação.
- **Mesmo sendo breve, demonstre seu conhecimento técnico e autoridade no assunto.**
- Aprofunde o diagnóstico e forneça detalhes adicionais SOMENTE depois que o técnico responder com dados reais ou pedir mais informações.

SOMENTE após o técnico responder, você pode entregar:
- causa provável fechada
- causas possíveis
- ordem de verificação
- alertas de segurança
- conclusão técnica completa`;
  }

  const faqContext = includeExtendedKnowledge
    ? `\n\n[PACOTE DE CONHECIMENTO DE REFERÊNCIA]\nO conteúdo abaixo são casos frequentes e diagnósticos recomendados pela Ordemilk. Use-os como base de conhecimento e inspiração para suas análises, mas sinta-se livre para adaptar o diagnóstico conforme a situação específica relatada pelo técnico. Não trate como regras rígidas, mas como um guia de experiência acumulada.\n${FAQ_DATABASE}`
    : "";

  const structuredKnowledge = includeExtendedKnowledge
    ? `\n\n[BASE DE CONHECIMENTO TÉCNICO ESTRUTURADA EM 4 CAMADAS]\n${KNOWLEDGE_BASE}`
    : "";

  const diagnosticGuidance = `
[DIRETRIZES DE RACIOCÍNIO TÉCNICO]
1. NÃO CONCLUA SEM CONFIRMAR: Se o sintoma for genérico, peça contexto antes de afirmar a causa (ex: "A IHM acende?", "Qual o modelo do painel?").
2. ESTRUTURA DE DIAGNÓSTICO: Sempre que possível, estruture sua resposta com: Sintoma, Causa Provável, Causas Possíveis, Ordem de Verificação e Segurança.
3. NÍVEIS DE RESPOSTA: Adapte o tom para o usuário. Se for técnico, use nomes de componentes (DM3, K4, Y5). Se for operador, use termos mais simples.
4. SEGURANÇA PRIMEIRO: Sempre inclua avisos de segurança antes de sugerir testes em painéis energizados.
5. CAUSA RAIZ: Lembre-se que falhas elétricas muitas vezes são causadas por problemas mecânicos/frigoríficos.
`;

  return `${SYSTEM_PROMPT_BASE}\n\n${TECHNICAL_CONTEXT}${equipmentContext}\n${brandManual}\n${electricalContext}\n\n${fieldKnowledge}\n${faqContext}\n${structuredKnowledge}\n${diagnosticGuidance}\n\n${toolPrompt}\n${modeInstruction}${cadenceInstruction}`;
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
      model: DEFAULT_TEXT_MODEL,
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
  diagnosticContext: SupportDiagnosticContext = {},
  retries = 2
): Promise<string> => {
  const userTurnCount = history.filter(item => item.role === 'user').length;
  const isFirstReply = userTurnCount <= 1;
  const primaryModel = isFirstReply ? DEFAULT_TEXT_MODEL : SUPPORT_PRIMARY_MODEL;
  const fallbackModel = primaryModel === SUPPORT_PRIMARY_MODEL ? SUPPORT_FALLBACK_MODEL : SUPPORT_PRIMARY_MODEL;

  const runStream = async (modelName: string): Promise<string> => {
    const apiKey = ENV.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const contents = history;

    const fullConversationText = history
      .map(h => h.parts.map(p => p.text).filter(Boolean).join(' '))
      .join(' ');

    const systemInstruction = await getFullSystemInstruction("DIAGNOSTIC", fullConversationText, mode, diagnosticContext, !isFirstReply);

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: getSupportConfig(systemInstruction, modelName, isFirstReply)
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
  };

  const runStreamWithRetry = async (modelName: string, retriesLeft: number): Promise<string> => {
    try {
      return await runStream(modelName);
    } catch (error: any) {
      if (retriesLeft > 0 && isRetryableStreamError(error)) {
        console.warn(`Erro 503 detectado no stream (${modelName}). Tentando novamente em 2s... (${retriesLeft} tentativas restantes)`);
        await wait(2000);
        return runStreamWithRetry(modelName, retriesLeft - 1);
      }
      throw error;
    }
  };

  try {
    return await runStreamWithRetry(primaryModel, retries);
  } catch (error: any) {
    if (fallbackModel !== primaryModel && isModelAvailabilityError(error)) {
      console.warn(`Modelo de suporte ${primaryModel} indisponivel. Recuando para ${fallbackModel}.`);
      try {
        return await runStreamWithRetry(fallbackModel, retries);
      } catch (fallbackError: any) {
        throw new Error(handleApiError(fallbackError));
      }
    }
    throw new Error(handleApiError(error));
  }
};

export const analyzePlateImage = async (imageBase64: string, retries = 2): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
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
