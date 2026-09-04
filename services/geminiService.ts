import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_BASE, TOOL_PROMPTS, TECHNICAL_CONTEXT, EXTERNAL_MANUALS } from "../constants";
import { knowledgeService } from "./knowledgeService";
import { FAQ_DATABASE } from "../data/faq_data";
import { KNOWLEDGE_BASE } from "../data/knowledge_base";
import { ENV } from "../config/env";
import { SupportDiagnosticContext } from "../types";
import { analyzeSupportCase, buildSupportAnalysisInstruction } from "./supportDiagnosticEngine";

const DEFAULT_TEXT_MODEL = ENV.GEMINI_TEXT_MODEL;
const SUPPORT_PRIMARY_MODEL = ENV.GEMINI_SUPPORT_MODEL;
const SUPPORT_FALLBACK_MODEL = ENV.GEMINI_SUPPORT_FALLBACK_MODEL;
const ATTACHMENT_ANALYSIS_MARKER = "[ANEXO_TECNICO_ORDEMILK]";
const EMPTY_RESPONSE_ERROR = "EMPTY_SUPPORT_RESPONSE";

const SUPPORT_FIELD_BRAIN_PACK = `

[PACOTE COMPACTO DE REFRIGERAÇÃO DE CAMPO - USAR DESDE A PRIMEIRA RESPOSTA]
- Superaquecimento (SH) ideal em campo: 7K a 12K.
- Sub-resfriamento (SC) ideal em campo: 4K a 8K.
- SH alto + SC baixo: priorize falta de fluido, vazamento, carga incompleta ou flash gas. Não coloque restrição/filtro/VET como hipótese no mesmo peso nesse padrão sem excluir vazamento/carga/flash gas. Não mande abrir VET primeiro.
- SH alto + SC normal/alto: priorize restrição, filtro secador, VET subalimentando, bulbo/igualador ou coluna líquida com restrição.
- SH baixo: risco de retorno de líquido/golpe; não force compressor.
- Alta pressão/desarme por alta: verifique condensador, ventiladores, obstrução de ar, excesso de fluido e ar no sistema antes de insistir em partida.
- Compressor liga e desliga: pense primeiro em pressostato, alta condensação, baixa sucção, proteção térmica do compressor e ventilação.
- Tanque demora para baixar leite: confirme agitação, carga térmica real, condensador, ventilação, SH/SC, visor, fluido e temperatura ambiente.
- Leite congelando no fundo: pense em baixa carga térmica/agitação ruim, VET aberta demais, sensor mal posicionado ou controle de temperatura descalibrado.
- Primeira resposta deve ser curta, mas tecnicamente útil para o técnico no cliente.
`;

const SUPPORT_ELECTRICAL_FIELD_BRAIN_PACK = `

[PACOTE COMPACTO DE ELÉTRICA DE CAMPO - USAR APENAS EM AUTO/ELEC]
- IHM acende mas contatora não fecha: foque em cadeia de comando, DM/relé térmico, falta de fase, pressostatos, A1/A2 da bobina e saída do controlador/CLP.
- Tanques >= 4000L: arquitetura CLP Panasonic; não sugerir Full Gauge/Ageon.
- Agitador em tanques >= 4000L: puxe sempre o esquema elétrico CLP Panasonic: saída YE -> relé RL6/RL18 -> borne/interligação com painel geral -> contatora do agitador -> DM do agitador -> motor do agitador. Nunca use Ageon/Full Gauge nesse caso.
- Em perguntas elétricas, responda por rota de esquema: família do painel, saída/relé/borne, contatora/DM, força/motor e próximo teste seguro.
`;

const SUPPORT_REFRIGERATION_SYSTEM_PROMPT_BASE = `
VOCÊ É UM ENGENHEIRO ESPECIALISTA EM REFRIGERAÇÃO INDUSTRIAL ORDEMILK PARA RESFRIADORES DE LEITE.

SUA MISSÃO NO MODO REF:
Diagnosticar falhas do ciclo frigorífico de tanques de leite com ligação real ao técnico de campo.
- FASE 1 (primeira resposta): identifique o sintoma frigorífico, levante a hipótese mais provável e faça no máximo 2 perguntas técnicas.
- FASE 2 (continuação): só aprofunde depois de receber medidas de campo.

[ESCOPO EXCLUSIVO DO MODO REF]
- Foque em compressor, condensador, VET/TXV, evaporador Roll-Bond, fluido refrigerante, pressões, SH, SC, visor, vazamento, carga térmica, agitação, retorno de líquido, óleo e troca de calor.
- Não use esquema elétrico, CLP, borne, contatora, relé, A1/A2, IHM ou painel como rota de diagnóstico neste modo.
- Se a frase do técnico tiver "não liga" dentro do modo REF, interprete como "não entra em ciclo frigorífico / não resfria" e peça dados frigoríficos: pressão de sucção/descarga, SH/SC, fluido, visor, condensador e temperatura do leite.
- Não misture com ar-condicionado, chiller ou câmara fria genérica.

[REGRAS DE REFRIGERAÇÃO CRÍTICAS]
- SH ideal em campo: 7K a 12K.
- SC ideal em campo: 4K a 8K.
- R404A: usar dew/vapor para SH e bubble/líquido para SC.
- SH alto + SC baixo: falta de fluido, vazamento, carga incompleta ou flash gas antes de culpar VET/filtro.
- SH alto + SC normal/alto: restrição, filtro secador, VET subalimentando, bulbo/igualador ou coluna líquida com restrição.
- SH baixo: risco de retorno de líquido/golpe; não force compressor.

[POSTURA E TOM]
- Responda em português brasileiro correto, com acentos.
- Seja técnico, cordial, direto e conectado com a realidade do técnico no cliente.
`;

const PORTUGUESE_QUALITY_RULE = `

[QUALIDADE DO PORTUGUÊS - REGRA OBRIGATÓRIA]
- Escreva sempre em português brasileiro correto, com acentos, cedilha e pontuação natural.
- Nunca responda sem acentos em palavras como pressão, tensão, técnico, diagnóstico, ação, conexão, elétrica, refrigeração, líquido, sucção e relé.
- Não deixe marcação solta como _texto_ visível ao técnico; use texto limpo e headings em negrito quando necessário.
`;

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

const isRetryableStreamError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("503") ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("socket")
  );
};
const isQuotaError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("429") || message.includes("quota");
};
const isEmptyResponseError = (error: any) =>
  String(error?.message || "").includes(EMPTY_RESPONSE_ERROR);
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const hasContextValue = (value?: string) => Boolean(value && value.trim());
const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const getSupportFieldBrainPack = (mode: 'AUTO' | 'REF' | 'ELEC') =>
  mode === 'REF'
    ? SUPPORT_FIELD_BRAIN_PACK
    : `${SUPPORT_FIELD_BRAIN_PACK}${SUPPORT_ELECTRICAL_FIELD_BRAIN_PACK}`;

const extractStaticSection = (source: string, startMarker: string, endMarker?: string) => {
  const start = source.indexOf(startMarker);
  if (start === -1) return source;

  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : -1;
  return source.slice(start, end === -1 ? undefined : end).trim();
};

const getSupportSystemPromptBase = (mode: 'AUTO' | 'REF' | 'ELEC') =>
  mode === 'REF' ? SUPPORT_REFRIGERATION_SYSTEM_PROMPT_BASE : SYSTEM_PROMPT_BASE;

const getSupportTechnicalContext = (mode: 'AUTO' | 'REF' | 'ELEC') =>
  mode === 'REF' ? "" : TECHNICAL_CONTEXT;

const getFaqDatabaseForMode = (mode: 'AUTO' | 'REF' | 'ELEC') => {
  if (mode !== 'REF') return FAQ_DATABASE;

  const refrigerationModules = extractStaticSection(
    FAQ_DATABASE,
    "MÓDULO 3: CICLO, FLUIDO E EXPANSÃO",
    "[SUPORTE TÉCNICO: PERGUNTAS E RESPOSTAS ELÉTRICAS]"
  );

  return `[PACOTE DE CONHECIMENTO TÉCNICO: REFERÊNCIA ORDEMILK - REFRIGERAÇÃO]\n${refrigerationModules}`;
};

const getStructuredKnowledgeForMode = (mode: 'AUTO' | 'REF' | 'ELEC') => {
  if (mode !== 'REF') return KNOWLEDGE_BASE;

  return extractStaticSection(
    KNOWLEDGE_BASE,
    "[CAMADA 6: FUNDAMENTOS DO CICLO DE REFRIGERAÇÃO E PRÁTICA DE CAMPO (A CAMADA DE REALIDADE)]"
  );
};

const getDiagnosticGuidance = (mode: 'AUTO' | 'REF' | 'ELEC') => {
  if (mode === 'REF') {
    return `
[DIRETRIZES DE RACIOCÍNIO TÉCNICO - REFRIGERAÇÃO]
1. NÃO CONCLUA SEM MEDIDA: Se o sintoma for genérico, peça pressão de sucção/descarga, SH, SC, fluido, visor e temperatura do leite.
2. ESTRUTURA DE DIAGNÓSTICO: Sempre que possível, responda com Sintoma, Causa Provável, Causas Possíveis, Ordem de Verificação e Segurança frigorífica.
3. PRIORIDADE: trate primeiro ciclo frigorífico, troca térmica, VET, condensador, evaporador, carga de fluido, retorno de líquido e mecânica do compressor.
4. BLOQUEIO: não puxe esquema elétrico, CLP, bornes, relés, contatoras, A1/A2 ou painel no modo REF.
5. CAMPO: quando o técnico disser que "não gela", traduza para resfriamento lento do leite e confira carga térmica, agitação, condensação e SH/SC.
`;
  }

  return `
[DIRETRIZES DE RACIOCÍNIO TÉCNICO]
1. NÃO CONCLUA SEM CONFIRMAR: Se o sintoma for genérico, peça contexto antes de afirmar a causa (ex: "A IHM acende?", "Qual o modelo do painel?").
2. ESTRUTURA DE DIAGNÓSTICO: Sempre que possível, estruture sua resposta com: Sintoma, Causa Provável, Causas Possíveis, Ordem de Verificação e Segurança.
3. NÍVEIS DE RESPOSTA: Adapte o tom para o usuário. Se for técnico, use nomes de componentes (DM3, K4, Y5). Se for operador, use termos mais simples.
4. SEGURANÇA PRIMEIRO: Sempre inclua avisos de segurança antes de sugerir testes em painéis energizados.
5. CAUSA RAIZ: Lembre-se que falhas elétricas muitas vezes são causadas por problemas mecânicos/frigoríficos.
`;
};
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

const getDiagnosticContextInstruction = (
  diagnosticContext: SupportDiagnosticContext,
  userPrompt: string = "",
  mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO'
) => {
  const lines: string[] = [];

  if (hasContextValue(diagnosticContext.model)) {
    lines.push(`- Modelo/capacidade do tanque informado previamente: ${diagnosticContext.model}`);
  }
  if (mode !== 'REF' && hasContextValue(diagnosticContext.voltage)) {
    lines.push(`- Tensão informada previamente: ${diagnosticContext.voltage}`);
  }
  if (hasContextValue(diagnosticContext.refrigerant)) {
    lines.push(`- Fluido refrigerante informado previamente: ${diagnosticContext.refrigerant}`);
  }
  if (hasContextValue(diagnosticContext.temperature)) {
    lines.push(`- Temperatura atual do leite informada previamente: ${diagnosticContext.temperature}`);
  }

  if (mode === 'REF' && hasContextValue(diagnosticContext.model) && hasContextValue(diagnosticContext.refrigerant) && hasContextValue(diagnosticContext.temperature)) {
    lines.push(`- ATALHO INTELIGENTE ATIVO: modelo, fluido refrigerante e temperatura atual do leite foram preenchidos manualmente pelo técnico e são fatos confirmados.`);
    lines.push(`- REGRA DE CONDUTA: não pergunte novamente modelo, fluido refrigerante ou temperatura atual do leite.`);
    lines.push(`- PRIMEIRA RESPOSTA: use esses dados para elevar a hipótese inicial e pergunte apenas pressão de sucção/descarga, SH/SC, visor, condensador ou agitação se ainda faltar.`);
  } else if (mode !== 'REF' && isBaseEquipmentContextComplete(diagnosticContext)) {
    lines.push(`- ATALHO INTELIGENTE ATIVO: modelo, tensão, fluido refrigerante e temperatura atual do leite foram preenchidos manualmente pelo técnico e são fatos confirmados.`);
    lines.push(`- REGRA DE CONDUTA: não pergunte novamente modelo, tensão, fluido refrigerante ou temperatura atual do leite.`);
    lines.push(`- PRIMEIRA RESPOSTA: use esses 4 dados para elevar a hipótese inicial e pergunte apenas o que ainda falta para fechar o diagnóstico.`);
  }

  const tankCapacity = extractTankCapacityLiters(diagnosticContext.model);
  if (tankCapacity !== null && tankCapacity >= 4000) {
    if (mode === 'REF') {
      lines.push(`- REGRA OPERACIONAL: trate este equipamento como resfriador de leite de grande porte com VET, condensador dimensionado e evaporador Roll-Bond; não use lógica de ar-condicionado, chiller ou tubo capilar pequeno.`);
    } else {
      lines.push(`- REGRA OPERACIONAL: trate este equipamento como tanque >= 4000L com arquitetura CLP Panasonic. Não pergunte sobre Full Gauge, Ageon ou controlador comercial.`);
      const normalizedPrompt = normalizeText(userPrompt);
      if (normalizedPrompt.includes('full gauge') || normalizedPrompt.includes('ageon')) {
        lines.push(`- CORREÇÃO OBRIGATÓRIA NA PRIMEIRA LINHA: o técnico mencionou Full Gauge ou Ageon, o que NÃO existe neste tanque. Comece a resposta corrigindo isso: diga que este tanque usa CLP Panasonic, não Full Gauge nem Ageon.`);
      }
    }
  }

  if (lines.length === 0) return "";
  return `\n\n[CONTEXTO BASE DO EQUIPAMENTO - INFORMADO ANTES DA PERGUNTA]\n${lines.join('\n')}`;
};

const getAttachmentContextInstruction = (
  userPrompt: string,
  mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO'
) => {
  if (!userPrompt.includes(ATTACHMENT_ANALYSIS_MARKER)) return "";

  if (mode === 'REF') {
    return `

[LEITURA TÉCNICA DE ANEXOS - REFRIGERAÇÃO]
O técnico enviou anexo(s) como evidência de campo. Não trate isso como pergunta vaga.
Antes de diagnosticar, extraia sinais frigoríficos concretos do anexo: modelo do equipamento, fluido, pressões, manifold, visor de líquido, condensador, ventilador, evaporador, gelo, sucção, linha de líquido, óleo, sujeira, vazamento, placa do compressor e temperatura exibida.
Se a imagem não permitir leitura confiável, diga isso objetivamente e peça a foto exata que falta.
Mesmo na primeira resposta, use a evidência visual para formular uma hipótese inicial técnica, mantendo a resposta curta.`;
  }

  return `

[LEITURA TÉCNICA DE ANEXOS - REGRA OBRIGATÓRIA]
O técnico enviou anexo(s) como evidência de campo. Não trate isso como pergunta vaga.
Antes de diagnosticar, extraia sinais concretos do anexo: display/IHM, alarme, placa, modelo, tensão, borneira, painel, CLP, controlador, contatora, disjuntor-motor, pressostato, sensor, compressor, condensador, evaporador, gelo, sujeira, vazamento, oxidação ou ligação irregular.
Se a imagem não permitir leitura confiável, diga isso objetivamente e peça a foto exata que falta.
Mesmo na primeira resposta, use a evidência visual para formular uma hipótese inicial técnica, mantendo a resposta curta.`;
};

const getSymptomSpecificInstruction = (
  userPrompt: string,
  mode: 'AUTO' | 'REF' | 'ELEC',
  diagnosticContext: SupportDiagnosticContext = {}
) => {
  const normalizedPrompt = normalizeText(userPrompt);
  const lines: string[] = [];
  const tankCapacity = extractTankCapacityLiters(`${diagnosticContext.model || ''} ${userPrompt}`);
  const canUseElectricalRules = mode !== 'REF';

  const hasContactorSymptom =
    canUseElectricalRules &&
    (mode === 'ELEC' || normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) &&
    (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) &&
    (
      normalizedPrompt.includes('nao fecha') ||
      normalizedPrompt.includes('nao aciona') ||
      normalizedPrompt.includes('nao parte') ||
      normalizedPrompt.includes('nao liga')
    );

  if (hasContactorSymptom) {
    lines.push('[REGRA ESPECÍFICA - CONTATORA NÃO FECHA]');
    lines.push('- O técnico já descreveu sintoma elétrico suficiente para iniciar sequência de teste.');
    lines.push('- Na primeira resposta, não gaste pergunta pedindo capacidade/modelo/controlador se ele pediu sequência de teste.');
    lines.push('- As 2 perguntas devem confirmar: tensão A1/A2 da bobina quando pede partida; e se DM/relé térmico/pressostato/relé falta de fase está aberto.');
    lines.push('- A ação imediata deve mandar verificar proteções e medir A1/A2 com segurança antes de forçar partida.');
  }

  const hasLargeTankAgitatorSymptom =
    canUseElectricalRules &&
    (mode === 'ELEC' || normalizedPrompt.includes('agitador')) &&
    normalizedPrompt.includes('agitador') &&
    (tankCapacity !== null && tankCapacity >= 4000) &&
    (
      normalizedPrompt.includes('nao liga') ||
      normalizedPrompt.includes('nao aciona') ||
      normalizedPrompt.includes('nao parte') ||
      normalizedPrompt.includes('parado') ||
      normalizedPrompt.includes('sem comando')
    );

  if (hasLargeTankAgitatorSymptom) {
    lines.push('[REGRA ESPECÍFICA - AGITADOR EM TANQUE GRANDE]');
    lines.push('- Tanque >=4000L usa CLP Panasonic.');
    lines.push('- Responda puxando obrigatoriamente o esquema completo, citando RL6 e RL18: saída YE do CLP -> relé RL6 ou RL18 -> borne/interligação com painel geral -> contatora do agitador -> DM do agitador -> motor do agitador.');
    lines.push('- A primeira ação deve ser seguir essa rota parte por parte, sem pular direto para motor mecânico.');
    lines.push('- As 2 perguntas devem confirmar: se a IHM/CLP solicita agitador e se a saída YE/RL6/RL18 chega até A1/A2 da contatora com DM armado.');
  }

  if (
    (mode === 'REF' || normalizedPrompt.includes('superaquecimento') || normalizedPrompt.includes('subresfriamento')) &&
    (normalizedPrompt.includes('superaquecimento') || normalizedPrompt.includes(' sh ')) &&
    (normalizedPrompt.includes('subresfriamento') || normalizedPrompt.includes('sub-resfriamento') || normalizedPrompt.includes(' sc '))
  ) {
    lines.push('[REGRA ESPECÍFICA - SH/SC INFORMADOS]');
    lines.push('- Se SH está alto e SC está baixo, a primeira hipótese é falta de fluido/vazamento/flash gas.');
    lines.push('- Não classifique como restrição/filtro/VET na primeira conclusão quando o SC está baixo; confirme carga/vazamento/visor/pressões primeiro.');
    lines.push('- Não oriente abrir VET primeiro nesse padrão.');
  }

  return lines.length ? `\n\n${lines.join('\n')}` : "";
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

const getSupportCadenceInstruction = (isFirstReply: boolean) => {
  if (isFirstReply) {
    return `\n\n🚨 [INSTRUÇÃO OBRIGATÓRIA DE CADÊNCIA - UX DE CAMPO]
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
- Exatamente 2 perguntas numeradas. Nunca escreva uma terceira pergunta na primeira resposta.
- Mantenha a resposta concisa e focada no formato acima.
- Evite listar todas as causas possíveis ou despejar teoria na primeira interação.
- **Mesmo sendo breve, demonstre seu conhecimento técnico e autoridade no assunto.**
- Aprofunde o diagnóstico e forneça detalhes adicionais SOMENTE depois que o técnico responder com dados reais ou pedir mais informações.`;
  }

  return `\n\n[CADÊNCIA DE CONTINUIDADE - LIGAÇÃO REAL COM O TÉCNICO]
O técnico já está em atendimento e a conversa recente foi enviada junto. Não reinicie como se fosse o primeiro contato.
Conecte sua resposta diretamente ao que ele acabou de medir, fotografar, ouvir ou responder.
Avance o diagnóstico: diga o que a nova informação indica, qual hipótese ganha força, qual hipótese cai e qual é o próximo teste seguro.
Pode aprofundar causa provável, sequência de verificação e conclusão técnica quando já houver dados suficientes.
Faça no máximo 1 ou 2 perguntas novas, somente se forem necessárias para fechar o diagnóstico.
Regra dura de UX: em continuação, nunca escreva uma terceira pergunta numerada; se houver mais dúvidas, escolha só as 2 mais decisivas.
Não repita saudação inicial nem o bloco rígido de primeira resposta. Responda como supervisor técnico acompanhando o técnico em campo.`;
};

const getFullSystemInstruction = async (
  toolType: string,
  userPrompt: string = "",
  mode: 'AUTO' | 'REF' | 'ELEC' = 'AUTO',
  diagnosticContext: SupportDiagnosticContext = {},
  includeExtendedKnowledge = true,
  isFirstReply = true
) => {
  const supportSystemPromptBase = getSupportSystemPromptBase(mode);
  const technicalContext = getSupportTechnicalContext(mode);
  const supportFieldBrainPack = getSupportFieldBrainPack(mode);
  const faqDatabase = getFaqDatabaseForMode(mode);
  const structuredKnowledgeDatabase = getStructuredKnowledgeForMode(mode);
  const fieldKnowledge = mode === 'REF' ? "" : knowledgeService.getKnowledgeContext();
  const toolPrompt = toolType && toolType in TOOL_PROMPTS ? TOOL_PROMPTS[toolType as keyof typeof TOOL_PROMPTS] : "";
  const brandManual = getDynamicBrandContext(userPrompt);
  const electricalContext = mode === 'REF' ? "" : await getElectricalContext(userPrompt);
  const equipmentContext = getDiagnosticContextInstruction(diagnosticContext, userPrompt, mode);
  const attachmentContext = getAttachmentContextInstruction(userPrompt, mode);
  const symptomSpecificContext = getSymptomSpecificInstruction(userPrompt, mode, diagnosticContext);
  const localAnalysisContext = buildSupportAnalysisInstruction(analyzeSupportCase(userPrompt, mode, diagnosticContext));

  let modeInstruction = "";
  if (mode === 'ELEC') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM ELÉTRICA ATIVADO]\nIgnore detalhes do ciclo de refrigeração. Foque 100% em esquemas elétricos, bornes, CLP e componentes de comando. Use a base de dados de esquemas, a seção de [SUPORTE TÉCNICO: PERGUNTAS E RESPOSTAS ELÉTRICAS] e a seção de [DIAGNÓSTICO RÁPIDO: O QUE PODE SER?] imediatamente para responder dúvidas sobre componentes, funções do painel e falhas de funcionamento.";
  } else if (mode === 'REF') {
    modeInstruction = "\n\n🚨 [MODO FOCO EM REFRIGERAÇÃO ATIVADO]\nIgnore detalhes de comando elétrico/CLP. Não carregue esquema elétrico, CLP, bornes, contatoras ou relés salvo se o técnico mudar para ELÉTRICA. Foque 100% no ciclo frigorífico, pressões, fluido, troca de calor, VET, condensador, evaporador e mecânica do compressor.";
  }

  if (mode === 'ELEC') {
    modeInstruction += "\n\n[SEQUÊNCIA ELÉTRICA DE CAMPO]\nPara IHM acesa e contatora que não fecha, responda com ordem segura: 1) alarme/status na IHM, 2) DM/relé térmico/falta de fase/pressostatos, 3) tensão A1/A2 da bobina, 4) saída do controlador/CLP. Se o compressor não está partindo, não peça pressões de manifold como confirmação principal.";
  } else if (mode === 'REF') {
    modeInstruction += "\n\n[MATRIZ REFRIGERAÇÃO DE CAMPO]\nSe o técnico informar SH/SC, aplique: SH alto + SC baixo = falta de fluido/vazamento/flash gas; SH alto + SC normal/alto = restrição/VET/filtro; SH baixo = risco de retorno de líquido. Não recomende abrir VET quando o SC está baixo sem confirmar carga/vazamento.";
  }

  const cadenceInstruction = toolType === "DIAGNOSTIC"
    ? getSupportCadenceInstruction(isFirstReply)
    : "";

  const faqContext = includeExtendedKnowledge
    ? `\n\n[PACOTE DE CONHECIMENTO DE REFERÊNCIA]\nO conteúdo abaixo são casos frequentes e diagnósticos recomendados pela Ordemilk. Use-os como base de conhecimento e inspiração para suas análises, mas sinta-se livre para adaptar o diagnóstico conforme a situação específica relatada pelo técnico. Não trate como regras rígidas, mas como um guia de experiência acumulada.\n${faqDatabase}`
    : "";

  const structuredKnowledge = includeExtendedKnowledge
    ? `\n\n[BASE DE CONHECIMENTO TÉCNICO ESTRUTURADA EM 4 CAMADAS]\n${structuredKnowledgeDatabase}`
    : "";

  const diagnosticGuidance = getDiagnosticGuidance(mode);

  return `${supportSystemPromptBase}\n\n${technicalContext}${PORTUGUESE_QUALITY_RULE}${supportFieldBrainPack}${localAnalysisContext}${symptomSpecificContext}${equipmentContext}${attachmentContext}\n${brandManual}\n${electricalContext}\n\n${fieldKnowledge}\n${faqContext}\n${structuredKnowledge}\n${diagnosticGuidance}\n\n${toolPrompt}\n${modeInstruction}${cadenceInstruction}`;
};

const enforceFirstReplyContract = (text: string, isFirstReply: boolean) => {
  const trimmedText = text.trim();
  if (!isFirstReply || !trimmedText) return trimmedText;

  const lines = trimmedText.split('\n');
  let inConfirmBlock = false;
  let questionCount = 0;
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const normalized = normalizeText(line);

    if (normalized.includes('preciso confirmar') || normalized.includes('perguntas')) {
      inConfirmBlock = true;
      questionCount = 0;
      cleanedLines.push(line);
      continue;
    }

    if (
      inConfirmBlock &&
      (
        normalized.includes('faca agora') ||
        normalized.includes('acao segura') ||
        normalized.includes('proxima acao') ||
        normalized.includes('somente apos')
      )
    ) {
      inConfirmBlock = false;
    }

    if (inConfirmBlock && /^\s*\d+[\).\s-]+/.test(line)) {
      questionCount += 1;
      if (questionCount > 2) continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const extractRouteFromAction = (action: string) => {
  const directRoute = action.match(/Siga o esquema parte por parte:\s*(.+?)\.?$/i)?.[1];
  if (directRoute) return directRoute.trim();

  const commandRoute = action.match(/\bsiga\s+(.+?)\.?$/i)?.[1];
  return commandRoute?.trim();
};

const collectRouteTokens = (route: string) => {
  const tokens = route.match(/\b(?:CLP Panasonic|Full Gauge|Ageon|YE|YB|YC|YD|RL\d+|K\d+|DM\d*|A1\/A2|RA\/NA|RU1\/SU1\/TU1)\b/gi) || [];
  return [...new Set(tokens.map(token => normalizeText(token)))];
};

const ensureElectricalSchematicRoute = (
  text: string,
  userPrompt: string,
  mode: 'AUTO' | 'REF' | 'ELEC',
  diagnosticContext: SupportDiagnosticContext
) => {
  if (!text.trim()) return text;
  if (mode === 'REF') return text;

  const analysis = analyzeSupportCase(userPrompt, mode, diagnosticContext).electrical;
  if (!analysis) return text;

  const route = extractRouteFromAction(analysis.action);
  if (!route) return text;

  const normalizedText = normalizeText(text);
  const missingToken = collectRouteTokens(route).some(token => !normalizedText.includes(token));
  if (!missingToken) return text;

  return `${text.trim()}\n\n**Rota do esquema:** ${route}.`;
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
  conversationUserTurnCount?: number,
  retries = 2
): Promise<string> => {
  const userTurnCount = conversationUserTurnCount ?? history.filter(item => item.role === 'user').length;
  const isFirstReply = userTurnCount <= 1;
  const primaryModel = SUPPORT_PRIMARY_MODEL;
  const fallbackModel = primaryModel === SUPPORT_PRIMARY_MODEL ? SUPPORT_FALLBACK_MODEL : SUPPORT_PRIMARY_MODEL;

  const runStream = async (modelName: string): Promise<string> => {
    const apiKey = ENV.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const contents = history;

    const fullConversationText = history
      .map(h => h.parts.map(p => p.text).filter(Boolean).join(' '))
      .join(' ');

    const systemInstruction = await getFullSystemInstruction("DIAGNOSTIC", fullConversationText, mode, diagnosticContext, true, isFirstReply);

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

    const contractedText = enforceFirstReplyContract(fullText, isFirstReply);
    const finalText = ensureElectricalSchematicRoute(contractedText, fullConversationText, mode, diagnosticContext);
    if (!finalText.trim()) throw new Error(EMPTY_RESPONSE_ERROR);

    if (onFinished) onFinished(finalText, sources.length > 0 ? sources : undefined);
    return finalText;
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
    if (fallbackModel !== primaryModel && (isModelAvailabilityError(error) || isQuotaError(error) || isEmptyResponseError(error))) {
      console.warn(`Modelo de suporte ${primaryModel} indisponivel ou sem cota. Recuando para ${fallbackModel}.`);
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
