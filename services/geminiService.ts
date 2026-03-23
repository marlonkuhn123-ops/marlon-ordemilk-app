import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";
import { FAQ_DATABASE } from "../data/faq_data";
import { KNOWLEDGE_BASE } from "../data/knowledge_base";
import { ENV } from "../config/env";

type AiMode = 'AUTO' | 'REF' | 'ELEC';
type PromptTool = keyof typeof TOOL_PROMPTS | "ASSISTANT";
type RouteCategory =
  | 'support'
  | 'errors'
  | 'refrigeration'
  | 'electrical'
  | 'parts'
  | 'report'
  | 'sizing'
  | 'calculator';

interface DiagnosticMemory {
  models: string[];
  errorCodes: string[];
  fluids: string[];
  voltages: string[];
  currents: string[];
  pressures: string[];
  temperatures: string[];
  components: string[];
  symptoms: string[];
  ihmStatus: 'sim' | 'nao' | 'desconhecido';
  compressorStatus: 'sim' | 'nao' | 'desconhecido';
}

interface ResponseStrategy {
  cadenceInstruction: string;
  maxOutputTokens: number;
}

const ELECTRICAL_KEYWORDS = [
  "ELETRICA", "ESQUEMA", "FIO", "BORNE", "LIGACAO", "DISJUNTOR", "CONTATORA",
  "CABO", "TENSAO", "VOLT", "AMPER", "CORRENTE", "TRIFASICO", "MONOFASICO",
  "CONTROLADOR", "AGEON", "FULL GAUGE", "CLP", "PANASONIC", "RELE", "COMANDO",
  "PAINEL", "QUADRO", "FUSIVEL", "NAO LIGA", "NAO PARTE", "NAO ACIONA",
  "DESARMA", "CAINDO", "CURTO", "QUEIMOU"
];

const REFRIGERATION_KEYWORDS = [
  "PRESSAO", "PSIG", "SUPERAQUECIMENTO", "SUB-RESFRIAMENTO", "SUB RESFRIAMENTO",
  "SUBRESFRIAMENTO", "CONDENSADOR", "EVAPORADOR", "FLUIDO", "GAS", "REFRIGERACAO",
  "COMPRESSOR", "TXV", "CAPILAR", "FILTRO SECADOR", "ALTA", "BAIXA", "GELOU",
  "NAO GELA", "NAO RESFRIA", "TEMPERATURA"
];

const PARTS_KEYWORDS = [
  "BOM", "PECA", "PECAS", "COMPONENTE", "CODIGO DA PECA", "REFERENCIA", "REF."
];

const FLUID_REGEX = /\bR[- ]?(?:22|134A|404A|407C|410A|507A|290)\b/gi;

const COMPONENT_KEYWORDS = [
  "COMPRESSOR", "CONDENSADOR", "EVAPORADOR", "VALVULA", "FILTRO", "CLP", "IHM",
  "PRESSOSTATO", "CONTATORA", "DISJUNTOR", "SENSOR", "VENTILADOR", "AGITADOR"
];

const SYMPTOM_KEYWORDS = [
  "NAO GELA", "NAO LIGA", "NAO PARTE", "DESARMA", "TRAVA", "OSCILA", "CONGELA",
  "VIBRA", "VAZANDO", "ALTA PRESSAO", "BAIXA PRESSAO", "QUEIMOU", "SEM RESFRIAMENTO"
];

const REQUIRED_FIELDS_BY_ROUTE: Record<RouteCategory, string[]> = {
  support: ['modelo', 'sintoma principal', 'IHM acende?', 'compressor parte?'],
  errors: ['modelo', 'codigo de erro', 'IHM acende?'],
  refrigeration: ['modelo', 'pressao', 'temperatura', 'compressor parte?'],
  electrical: ['modelo', 'tensao', 'IHM acende?', 'compressor parte?'],
  parts: ['modelo', 'peca ou referencia'],
  report: ['modelo', 'sintoma principal', 'acao executada'],
  sizing: ['capacidade', 'temperatura inicial/final'],
  calculator: ['fluido', 'pressao', 'temperatura']
};

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error?.message || "Unknown error");
  const msg = error?.message || "";

  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return "\u26A0\uFE0F LIMITE DE USO EXCEDIDO: O sistema atingiu o limite de consultas. Aguarde 60 segundos.";
  }

  return `\u26A0\uFE0F ERRO DE CONEX\u00C3O: ${error?.message || "Verifique internet e chave de API."}`;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const uniqueValues = (values: string[], limit = 6) => Array.from(new Set(values)).slice(0, limit);

const extractMatches = (text: string, regex: RegExp, limit = 6) => {
  const matches = text.match(regex) || [];
  return uniqueValues(matches.map(match => match.trim()), limit);
};

const extractKeywordMatches = (text: string, keywords: string[], limit = 6) => {
  const normalized = normalizeText(text);
  return uniqueValues(
    keywords.filter(keyword => normalized.includes(keyword)).map(keyword => keyword.trim()),
    limit
  );
};

const getStatusFromPatterns = (
  text: string,
  positivePatterns: string[],
  negativePatterns: string[]
): 'sim' | 'nao' | 'desconhecido' => {
  const normalized = normalizeText(text);
  if (negativePatterns.some(pattern => normalized.includes(pattern))) return 'nao';
  if (positivePatterns.some(pattern => normalized.includes(pattern))) return 'sim';
  return 'desconhecido';
};

const getDynamicBrandContext = (userPrompt: string) => {
  const upper = normalizeText(userPrompt);
  let manual = "";

  for (const brand of Object.keys(EXTERNAL_MANUALS)) {
    if (upper.includes(normalizeText(brand))) {
      manual += `\n\n[MANUAL ESPECIFICO DETECTADO: ${brand}]\n${EXTERNAL_MANUALS[brand]}\n`;
    }
  }

  return manual;
};

let cachedElectricalData: string | null = null;
let cachedSchematicsData: string | null = null;

const inferRoute = (toolType: PromptTool, userPrompt: string, mode: AiMode): RouteCategory => {
  if (toolType === "ERRORS") return 'errors';
  if (toolType === "CALC") return 'calculator';
  if (toolType === "SIZING") return 'sizing';
  if (toolType === "REPORT") return 'report';
  if (mode === 'ELEC') return 'electrical';
  if (mode === 'REF') return 'refrigeration';

  const normalized = normalizeText(userPrompt);

  if (PARTS_KEYWORDS.some(keyword => normalized.includes(keyword))) return 'parts';
  if (ELECTRICAL_KEYWORDS.some(keyword => normalized.includes(keyword))) return 'electrical';
  if (REFRIGERATION_KEYWORDS.some(keyword => normalized.includes(keyword))) return 'refrigeration';

  return 'support';
};

const buildDiagnosticMemory = (text: string): DiagnosticMemory => {
  return {
    models: extractMatches(text, /\b(?:TRG-\d{2,4}|[A-Z]{2,5}-\d{2,4}|\d{3,5}L)\b/gi),
    errorCodes: extractMatches(text, /\b(?:E\d{1,3}|A\d{1,3}|F\d{1,3}|AL\d{1,3}|P\d{1,3})\b/gi),
    fluids: extractMatches(text, FLUID_REGEX),
    voltages: extractMatches(text, /\b\d{2,4}\s?V\b/gi),
    currents: extractMatches(text, /\b\d{1,3}(?:[.,]\d{1,2})?\s?A\b/gi),
    pressures: extractMatches(text, /\b\d{1,3}(?:[.,]\d{1,2})?\s?PSIG\b/gi),
    temperatures: extractMatches(text, /\b-?\d{1,3}(?:[.,]\d{1,2})?\s?(?:°C|C)\b/gi),
    components: extractKeywordMatches(text, COMPONENT_KEYWORDS),
    symptoms: extractKeywordMatches(text, SYMPTOM_KEYWORDS),
    ihmStatus: getStatusFromPatterns(
      text,
      ['IHM ACENDE', 'DISPLAY ACENDE', 'PAINEL ACENDE'],
      ['IHM NAO ACENDE', 'DISPLAY APAGADO', 'PAINEL APAGADO']
    ),
    compressorStatus: getStatusFromPatterns(
      text,
      ['COMPRESSOR PARTE', 'COMPRESSOR LIGA', 'COMPRESSOR ACIONA'],
      ['COMPRESSOR NAO PARTE', 'COMPRESSOR NAO LIGA', 'COMPRESSOR NAO ACIONA']
    )
  };
};

const buildMemorySection = (memory: DiagnosticMemory) => {
  const lines: string[] = [];

  if (memory.models.length > 0) lines.push(`- Modelos citados: ${memory.models.join(', ')}`);
  if (memory.errorCodes.length > 0) lines.push(`- Codigos citados: ${memory.errorCodes.join(', ')}`);
  if (memory.fluids.length > 0) lines.push(`- Fluidos citados: ${memory.fluids.join(', ')}`);
  if (memory.voltages.length > 0) lines.push(`- Tensoes citadas: ${memory.voltages.join(', ')}`);
  if (memory.currents.length > 0) lines.push(`- Correntes citadas: ${memory.currents.join(', ')}`);
  if (memory.pressures.length > 0) lines.push(`- Pressoes citadas: ${memory.pressures.join(', ')}`);
  if (memory.temperatures.length > 0) lines.push(`- Temperaturas citadas: ${memory.temperatures.join(', ')}`);
  if (memory.components.length > 0) lines.push(`- Componentes citados: ${memory.components.join(', ')}`);
  if (memory.symptoms.length > 0) lines.push(`- Sintomas detectados: ${memory.symptoms.join(', ')}`);
  if (memory.ihmStatus !== 'desconhecido') lines.push(`- IHM/Display acende: ${memory.ihmStatus}`);
  if (memory.compressorStatus !== 'desconhecido') lines.push(`- Compressor parte: ${memory.compressorStatus}`);

  if (lines.length === 0) return "";

  return `\n\n[MEMORIA TECNICA ESTRUTURADA DA CONVERSA]\n${lines.join('\n')}`;
};

const getMissingFieldsForRoute = (route: RouteCategory, memory: DiagnosticMemory) => {
  const requiredFields = REQUIRED_FIELDS_BY_ROUTE[route] || [];
  return requiredFields.filter(field => !hasRequiredField(field, memory));
};

const hasRequiredField = (field: string, memory: DiagnosticMemory) => {
  const normalized = normalizeText(field);

  if (normalized.includes('MODELO')) return memory.models.length > 0;
  if (normalized.includes('CODIGO')) return memory.errorCodes.length > 0;
  if (normalized.includes('TENSAO')) return memory.voltages.length > 0;
  if (normalized.includes('PRESSAO')) return memory.pressures.length > 0;
  if (normalized.includes('TEMPERATURA')) return memory.temperatures.length > 0;
  if (normalized.includes('IHM')) return memory.ihmStatus !== 'desconhecido';
  if (normalized.includes('COMPRESSOR')) return memory.compressorStatus !== 'desconhecido';
  if (normalized.includes('PECA') || normalized.includes('REFERENCIA')) return memory.components.length > 0;
  if (normalized.includes('SINTOMA')) return memory.symptoms.length > 0;
  if (normalized.includes('CAPACIDADE')) return memory.models.length > 0 || memory.temperatures.length > 0;
  if (normalized.includes('ACAO EXECUTADA')) return false;
  if (normalized.includes('FLUIDO')) return memory.fluids.length > 0;

  return false;
};

const buildClarificationSection = (route: RouteCategory, memory: DiagnosticMemory) => {
  const missingFields = getMissingFieldsForRoute(route, memory);

  if (missingFields.length === 0) {
    return `\n\n[CHECKLIST DE CONTEXTO]\nOs dados criticos principais desta rota ja foram parcialmente informados. Se ainda houver ambiguidade tecnica, faca no maximo 1 ou 2 perguntas de confirmacao antes de concluir.`;
  }

  return `\n\n[CHECKLIST DE CONTEXTO]\nAntes de concluir o diagnostico, confirme os dados criticos ainda ausentes desta rota: ${missingFields.join(', ')}.\nSe o usuario nao trouxe esses dados, priorize perguntas curtas e objetivas antes de afirmar causa raiz.`;
};

const getRouteInstruction = (route: RouteCategory) => {
  const instructions: Record<RouteCategory, string> = {
    support: "[ROTA ATIVA: SUPORTE GERAL] Faça triagem tecnica e puxe o diagnostico para o trilho mais provavel sem perder objetividade.",
    errors: "[ROTA ATIVA: ERROS DO CONTROLADOR] Priorize codigo, modelo, origem do alarme e teste confirmatorio.",
    refrigeration: "[ROTA ATIVA: REFRIGERACAO] Foque no ciclo frigorifico, pressoes, temperaturas, troca de calor e risco ao compressor.",
    electrical: "[ROTA ATIVA: ELETRICA] Foque em comando, bornes, CLP, protecoes, sensores, tensao e componentes de painel.",
    parts: "[ROTA ATIVA: PECAS/BOM] Priorize identificacao correta de modelo, componente e referencia antes de sugerir peca.",
    report: "[ROTA ATIVA: LAUDO] Priorize clareza tecnica, rastreabilidade e fechamento formal sem inventar dados nao informados.",
    sizing: "[ROTA ATIVA: DIMENSIONAMENTO] Priorize dados de capacidade, temperaturas e criterio tecnico de selecao.",
    calculator: "[ROTA ATIVA: CALCULO TECNICO] Priorize fluido, pressao, temperatura e interpretacao do resultado."
  };

  return `\n\n${instructions[route]}`;
};

const getResponseStrategy = (
  route: RouteCategory,
  memory: DiagnosticMemory,
  toolType: PromptTool
): ResponseStrategy => {
  const missingFields = getMissingFieldsForRoute(route, memory);
  const shouldUseShortTriage = toolType !== 'REPORT' && missingFields.length > 0;

  if (shouldUseShortTriage) {
    return {
      cadenceInstruction: `
[CADENCIA DE RESPOSTA OBRIGATORIA]
Como ainda faltam dados criticos, a PRIMEIRA resposta deve ser curta, pratica e operacional.
Formato obrigatorio desta primeira resposta:
1. Informe apenas 1 causa provavel em 1 ou 2 frases curtas.
2. Faca no maximo 3 perguntas objetivas e numeradas.
3. Inclua 1 alerta de seguranca curto se houver risco.
4. Nao entregue lista longa de causas, aula tecnica ou passo a passo completo agora.
5. A analise completa so deve vir depois que o tecnico responder as perguntas ou pedir aprofundamento.
6. Entregue a resposta completa, sem cortar frase no meio.
7. Limite de tamanho: resposta curta, direta e de leitura rapida em campo.
      `.trim(),
      maxOutputTokens: 520
    };
  }

  if (toolType === 'REPORT') {
    return {
      cadenceInstruction: `
[CADENCIA DE RESPOSTA]
Entregue resposta completa, mas ainda priorize clareza e blocos curtos.
      `.trim(),
      maxOutputTokens: 1200
    };
  }

  return {
    cadenceInstruction: `
[CADENCIA DE RESPOSTA]
Mesmo com contexto suficiente, priorize conclusao pratica primeiro e detalhe tecnico depois.
Evite blocos excessivamente longos quando uma resposta mais objetiva resolver.
    `.trim(),
    maxOutputTokens: 900
  };
};

const getModeInstruction = (mode: AiMode) => {
  if (mode === 'ELEC') {
    return "\n\n[MODO FOCO EM ELETRICA ATIVADO]\nIgnore detalhes do ciclo de refrigeracao. Foque em esquemas eletricos, bornes, CLP e componentes de comando.";
  }

  if (mode === 'REF') {
    return "\n\n[MODO FOCO EM REFRIGERACAO ATIVADO]\nIgnore detalhes de comando eletrico/CLP. Foque no ciclo frigorifico, pressoes, fluido, troca de calor e mecanica do compressor.";
  }

  return "";
};

const getReferencePackages = (route: RouteCategory) => {
  switch (route) {
    case 'report':
      return { includeFaq: false, includeKnowledgeBase: false };
    case 'sizing':
      return { includeFaq: false, includeKnowledgeBase: true };
    case 'calculator':
      return { includeFaq: false, includeKnowledgeBase: true };
    default:
      return { includeFaq: true, includeKnowledgeBase: true };
  }
};

const getElectricalContext = async (userPrompt: string, route: RouteCategory) => {
  const normalized = normalizeText(userPrompt);
  const shouldLoadElectricalData =
    route === 'electrical' || ELECTRICAL_KEYWORDS.some(keyword => normalized.includes(keyword));

  if (!shouldLoadElectricalData) return "";

  if (!cachedElectricalData) {
    const { ELECTRICAL_DATABASE } = await import("../data/electrical_data");
    cachedElectricalData = ELECTRICAL_DATABASE;
  }

  if (!cachedSchematicsData) {
    const { SCHEMATICS_DATABASE } = await import("../data/schematics_data");
    cachedSchematicsData = SCHEMATICS_DATABASE;
  }

  return `\n\n[BASE DE DADOS ELETRICA E ESQUEMAS ATIVADA]\nUse as informacoes abaixo para responder duvidas tecnicas sobre ligacoes e esquemas:\n${cachedElectricalData}\n\n${cachedSchematicsData}\n`;
};

const getFullSystemInstruction = async (
  toolType: PromptTool,
  userPrompt = "",
  mode: AiMode = 'AUTO'
) => {
  const route = inferRoute(toolType, userPrompt, mode);
  const memory = buildDiagnosticMemory(userPrompt);
  const fieldKnowledge = knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);
  const electricalContext = await getElectricalContext(userPrompt, route);
  const modeInstruction = getModeInstruction(mode);
  const memorySection = buildMemorySection(memory);
  const clarificationSection = buildClarificationSection(route, memory);
  const routeInstruction = getRouteInstruction(route);
  const responseStrategy = getResponseStrategy(route, memory, toolType);
  const { includeFaq, includeKnowledgeBase } = getReferencePackages(route);

  const faqContext = includeFaq
    ? `\n\n[PACOTE DE CONHECIMENTO DE REFERENCIA]\nO conteudo abaixo sao casos frequentes e diagnosticos recomendados pela Ordemilk. Use-os como base de conhecimento e inspiracao para suas analises, sem tratar como regra rigida.\n${FAQ_DATABASE}`
    : "";

  const structuredKnowledge = includeKnowledgeBase
    ? `\n\n[BASE DE CONHECIMENTO TECNICO ESTRUTURADA EM 4 CAMADAS]\n${KNOWLEDGE_BASE}`
    : "";

  const diagnosticGuidance = `
[DIRETRIZES DE RACIOCINIO TECNICO]
1. NAO CONCLUA SEM CONFIRMAR: Se o sintoma for generico, peca contexto antes de afirmar a causa.
2. ESTRUTURA DE DIAGNOSTICO: Sempre que possivel, estruture sua resposta com: Sintoma, Causa Provavel, Causas Possiveis, Ordem de Verificacao e Seguranca.
3. NIVEIS DE RESPOSTA: Adapte o tom para o usuario. Se for tecnico, use nomes de componentes. Se for operador, use termos mais simples.
4. SEGURANCA PRIMEIRO: Sempre inclua avisos de seguranca antes de sugerir testes em paineis energizados.
5. CAUSA RAIZ: Falhas eletricas muitas vezes sao consequencia de problemas mecanicos/frigorificos.
6. PERSONA PRESERVADA: Mantenha exatamente o mesmo tom tecnico e a mesma personalidade do assistente atual. Nao altere o estilo de fala.
`;

  const systemInstruction = [
    SYSTEM_PROMPT_BASE,
    TECHNICAL_CONTEXT,
    brandManual,
    electricalContext,
    fieldKnowledge,
    faqContext,
    structuredKnowledge,
    memorySection,
    routeInstruction,
    responseStrategy.cadenceInstruction,
    clarificationSection,
    diagnosticGuidance,
    toolPrompt,
    modeInstruction
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    systemInstruction,
    maxOutputTokens: responseStrategy.maxOutputTokens
  };
};

export const generateTechResponse = async (
  userPrompt: string,
  toolType: PromptTool,
  retries = 2
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { systemInstruction, maxOutputTokens } = await getFullSystemInstruction(toolType, userPrompt);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        maxOutputTokens,
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
  onFinished?: (text: string, sources?: { title: string; uri: string }[]) => void,
  mode: AiMode = 'AUTO',
  retries = 2
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = history;
    const fullConversationText = history
      .map(item => item.parts.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).filter(Boolean).join(' '))
      .join(' ');

    const { systemInstruction, maxOutputTokens } = await getFullSystemInstruction("DIAGNOSTIC", fullConversationText, mode);
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens,
      }
    });

    let fullText = "";
    let sources: { title: string; uri: string }[] = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;

      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((candidate: any) => {
          if (candidate.web) sources.push({ title: candidate.web.title, uri: candidate.web.uri });
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
    return rawText.replace(/```json|```/g, '').trim();
  } catch (error: any) {
    if (retries > 0 && error?.message?.includes("503")) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return analyzePlateImage(imageBase64, retries - 1);
    }

    throw new Error(handleApiError(error));
  }
};
