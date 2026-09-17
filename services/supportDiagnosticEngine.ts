import { SupportDiagnosticContext, SupportMode } from '../types';
import { getTypicalPressureWindow, SupportedRefrigerant } from '../data/refrigeration_support_reference';

type LevelStatus = 'baixo' | 'ideal' | 'alto';
type EvidenceClass = 'limite oficial' | 'faixa típica' | 'hipótese diagnóstica' | 'dentro da faixa típica';

export interface ShScDiagnostic {
    shKelvin?: number;
    scKelvin?: number;
    shStatus?: LevelStatus;
    scStatus?: LevelStatus;
    pattern: string;
    hypothesis: string;
    questions: string[];
    action: string;
    guardrails: string[];
    facts: string[];
}

export interface ElectricalDecision {
    symptom: string;
    family: string;
    reference: string;
    outputPath: string;
    hypothesis: string;
    questions: string[];
    action: string;
    decisionTree: string[];
}

export interface RefrigerationPlausibility {
    refrigerant?: SupportedRefrigerant;
    suctionPsig?: number;
    dischargePsig?: number;
    ambientC?: number;
    compressionRatio?: number;
    dischargeTemperatureC?: number;
    condenserTdK?: number;
    startsPerHour?: number;
    voltageImbalancePercent?: number;
    evidenceClass: EvidenceClass;
    isOutlier: boolean;
    hypothesis: string;
    questions: string[];
    action: string;
    guardrails: string[];
    facts: string[];
}

export interface SupportCaseAnalysis {
    shSc?: ShScDiagnostic;
    refrigeration?: RefrigerationPlausibility;
    electrical?: ElectricalDecision;
}

export const hasHealthyRefrigerationMeasurements = (analysis: SupportCaseAnalysis) => Boolean(
    analysis.shSc?.shStatus === 'ideal' &&
    analysis.shSc?.scStatus === 'ideal' &&
    analysis.refrigeration?.evidenceClass === 'dentro da faixa típica' &&
    analysis.refrigeration.suctionPsig !== undefined &&
    analysis.refrigeration.dischargePsig !== undefined &&
    analysis.refrigeration.ambientC !== undefined
);

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

export const buildRequiredSupportOpening = (analysis: SupportCaseAnalysis): string => {
    const refrigeration = analysis.refrigeration;
    if (!refrigeration?.isOutlier) return '';

    if (refrigeration.evidenceClass === 'limite oficial') {
        return `⚠️ LIMITE OFICIAL EXCEDIDO: ${refrigeration.hypothesis}`;
    }

    if (refrigeration.evidenceClass === 'faixa típica') {
        return `⚠️ LEITURA FORA DA FAIXA TÍPICA: ${refrigeration.hypothesis}`;
    }

    return '';
};

export const prependRequiredSupportOpening = (text: string, requiredOpening: string): string => {
    const body = text.trim();
    if (!requiredOpening) return body;
    if (body.startsWith(requiredOpening)) return body;
    return body ? `${requiredOpening}\n\n${body}` : requiredOpening;
};

const hasValue = (value?: string) => Boolean(value && value.trim());
const includesAny = (value: string, keywords: string[]) => keywords.some(keyword => value.includes(keyword));

const parseNumber = (raw?: string): number | undefined => {
    if (!raw) return undefined;
    const parsed = Number(raw.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
};

const formatNumber = (value: number) => `${value.toFixed(1)}K`;

const classifySh = (value: number): LevelStatus => {
    if (value < 7) return 'baixo';
    if (value > 12) return 'alto';
    return 'ideal';
};

const classifySc = (value: number): LevelStatus => {
    if (value < 4) return 'baixo';
    if (value > 8) return 'alto';
    return 'ideal';
};

const extractTankCapacityLiters = (modelOrPrompt?: string): number | null => {
    if (!hasValue(modelOrPrompt)) return null;

    const text = normalize(modelOrPrompt!);
    const thousandMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|mil)\b/);
    if (thousandMatch) {
        const parsed = parseFloat(thousandMatch[1].replace(',', '.'));
        return Number.isFinite(parsed) ? Math.round(parsed * 1000) : null;
    }

    const litersMatch = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(l|litros?)\b/);
    const rawNumber = litersMatch?.[1] || text.match(/\b(\d{4,6})\b/)?.[1];
    if (!rawNumber) return null;

    const parsed = parseFloat(rawNumber.replace(/[.\s]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const readMeasurement = (text: string, patterns: RegExp[]) => {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        const value = parseNumber(match?.[1]);
        if (value !== undefined) return value;
    }
    return undefined;
};

const readShKelvin = (text: string) =>
    readMeasurement(text, [
        /\bsh\b(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsuper\s*aquecimento\b(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsuperaquecimento\b(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(?:(?!\bsc\b|\bsub\s*-?\s*resfriamento\b|\bsubresfriamento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsh\s*(?:=|:|-)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsuper\s*aquecimento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsuperaquecimento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i
    ]);

const readScKelvin = (text: string) =>
    readMeasurement(text, [
        /\bsc\b(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsub\s*-?\s*resfriamento\b(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsubresfriamento\b(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(?:(?!\bsh\b|\bsuper\s*aquecimento\b|\bsuperaquecimento\b)[^\n])*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsc\s*(?:=|:|-)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsub\s*-?\s*resfriamento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsubresfriamento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i
    ]);

const detectRefrigerant = (prompt: string, context: SupportDiagnosticContext): SupportedRefrigerant | undefined => {
    const combined = normalize([prompt, context.refrigerant].filter(Boolean).join(' '));
    if (combined.includes('404')) return 'R-404A';
    if (/\br\s*-?\s*22\b/.test(combined) || combined.includes('r22')) return 'R-22';
    return undefined;
};

const buildShScDiagnostic = (prompt: string, context: SupportDiagnosticContext): ShScDiagnostic | undefined => {
    const text = normalize(prompt);
    const shKelvin = readShKelvin(text);
    const scKelvin = readScKelvin(text);

    if (shKelvin === undefined && scKelvin === undefined) return undefined;

    const shStatus = shKelvin === undefined ? undefined : classifySh(shKelvin);
    const scStatus = scKelvin === undefined ? undefined : classifySc(scKelvin);
    const facts: string[] = [];
    const guardrails: string[] = [];
    const refrigerant = detectRefrigerant(prompt, context);

    if (refrigerant === 'R-404A') {
        guardrails.push('R404A: usar dew/vapor para SH e bubble/líquido para SC.');
    }
    if (shKelvin !== undefined) facts.push(`SH detectado: ${formatNumber(shKelvin)} (${shStatus}).`);
    if (scKelvin !== undefined) facts.push(`SC detectado: ${formatNumber(scKelvin)} (${scStatus}).`);

    let pattern = 'medição parcial de SH/SC';
    let hypothesis = 'As medidas de SH/SC indicam que o ciclo precisa ser conferido antes de qualquer ajuste.';
    let questions = [
        'Quais são as pressões de sucção e descarga no manifold, em psi ou bar?',
        'O visor de líquido tem bolhas ou há sinal de óleo/vazamento nas conexões?'
    ];
    let action = 'Não ajuste a válvula de expansão nem a carga ainda; confirme pressões, visor e estabilidade do sistema primeiro.';

    if (shStatus === 'alto' && scStatus === 'baixo') {
        pattern = 'SH alto + SC baixo';
        hypothesis = 'SH alto com SC baixo aponta primeiro para falta de fluido, vazamento, carga incompleta ou flash gas; não é padrão para abrir a válvula de expansão primeiro.';
        questions = [
            'O visor de líquido está com bolhas e existe mancha de óleo/vazamento em conexões, evaporador ou condensador?',
            'Quais são as pressões de sucção e descarga com o compressor estabilizado?'
        ];
        action = 'Não abra a válvula de expansão agora; procure vazamento/bolhas e confirme carga antes de adicionar fluido com critério.';
        guardrails.push('Proibido orientar abrir a válvula de expansão como primeira ação neste padrão.');
    } else if (shStatus === 'alto' && (scStatus === 'ideal' || scStatus === 'alto')) {
        pattern = scStatus === 'alto' ? 'SH alto + SC alto' : 'SH alto + SC ideal';
        hypothesis = 'SH alto com SC normal/alto indica evaporador subalimentado por restrição, filtro secador, válvula de expansão, bulbo/igualador ou coluna líquida com perda.';
        questions = [
            'Há queda de temperatura antes/depois do filtro secador ou sinal de congelamento na linha?',
            'O bulbo da válvula de expansão está bem fixado/isolado e o igualador externo está conectado?'
        ];
        action = 'Confira restrição, filtro secador e montagem da válvula de expansão antes de mexer na carga.';
    } else if (shStatus === 'baixo') {
        pattern = scStatus === 'alto' ? 'SH baixo + SC alto' : 'SH baixo';
        hypothesis = 'SH baixo indica risco de retorno de líquido ao compressor, possível excesso de alimentação, baixa carga térmica ou válvula de expansão aberta demais.';
        questions = [
            'O retorno do compressor está suando/congelando ou há ruído de líquido na sucção?',
            'A carga térmica está baixa, com leite já frio ou evaporador muito frio?'
        ];
        action = 'Evite manter o compressor forçado; confirme retorno de líquido antes de qualquer novo teste.';
    } else if (scStatus === 'alto') {
        pattern = 'SC alto';
        hypothesis = 'SC alto sugere excesso de fluido, condensação elevada, ar no sistema ou restrição depois do condensador.';
        questions = [
            'A pressão de descarga está alta e o condensador está limpo com ventilação correta?',
            'Foi adicionada carga recentemente ou houve manutenção no circuito?'
        ];
        action = 'Verifique condensador/ventiladores e histórico de carga antes de retirar fluido.';
    } else if (scStatus === 'baixo') {
        pattern = 'SC baixo';
        hypothesis = 'SC baixo sugere falta de líquido na linha, carga baixa, flash gas ou alimentação instável da válvula de expansão.';
        questions = [
            'O visor de líquido apresenta bolhas depois de estabilizar?',
            'Existe vazamento/óleo em conexões ou queda de pressão na linha de líquido?'
        ];
        action = 'Confirme bolhas, vazamento e pressões antes de completar carga.';
    } else if (shStatus === 'ideal' && scStatus === 'ideal') {
        pattern = 'SH e SC na faixa ideal';
        hypothesis = 'SH e SC estão em faixa de referência e, isoladamente, não indicam falha nem justificam ajuste de carga ou da válvula de expansão.';
        questions = [
            'Existe algum sintoma real mesmo com SH/SC dentro da faixa?',
            'A temperatura do leite está caindo no tempo esperado?'
        ];
        action = 'Não altere carga nem a válvula de expansão; confirme apenas se existe sintoma antes de abrir outra linha de diagnóstico.';
    }

    return {
        shKelvin,
        scKelvin,
        shStatus,
        scStatus,
        pattern,
        hypothesis,
        questions,
        action,
        guardrails,
        facts
    };
};

// Ligacao entre o termo e o numero. Cobre o portugues de campo: "esta em", "esta a",
// "caiu pra", "marcando", "deu", "ta com", alem das formas curtas (= : de em a com).
const MEASUREMENT_LINK =
    '(?:(?:esta|estava|ta|tava|fica|ficou|chegou|caiu|baixou|subiu|marcou|marcando|indicando|deu|dando|registrou|bateu)\\s*(?:em|a|com|pra|para|no|na)?|(?:=|:|de|em|a|com|pra|para))?';

const pressureToPsig = (rawValue?: string, rawUnit?: string): number | undefined => {
    const value = parseNumber(rawValue);
    if (value === undefined) return undefined;
    return rawUnit?.toLowerCase().startsWith('bar') ? Number((value * 14.5038).toFixed(1)) : value;
};

const readPressureForSide = (text: string, side: 'suction' | 'discharge') => {
    const label = side === 'suction'
        ? '(?:pressao\\s+(?:de\\s+)?)?(?:succao|baixa)'
        : '(?:pressao\\s+(?:de\\s+)?)?(?:descarga|alta)';
    const value = '(-?\\d{1,4}(?:[.,]\\d{1,2})?)';
    const unit = '(psig?|bar|libras?)';
    const link = MEASUREMENT_LINK;
    const patterns = [
        new RegExp(`\\b${label}\\b\\s*${link}\\s*${value}\\s*${unit}\\b`, 'i'),
        new RegExp(`\\b${value}\\s*${unit}\\s*(?:na|no|da|do|de|em)?\\s*${label}\\b`, 'i')
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        const pressure = pressureToPsig(match?.[1], match?.[2]);
        if (pressure !== undefined) return pressure;
    }
    return undefined;
};

const readLegacyContextPressure = (pressure?: string) => {
    if (!pressure) return undefined;
    const match = normalize(pressure).match(/^\s*(-?\d{1,4}(?:[.,]\d{1,2})?)\s*(psig?|bar)?\s*$/i);
    return pressureToPsig(match?.[1], match?.[2] || 'psi');
};

const readAmbientC = (text: string) => readMeasurement(text, [
    /\b(?:temperatura\s+)?ambiente\s*(?:=|:|de|em|esta|com)?\s*(-?\d{1,2}(?:[.,]\d{1,2})?)\s*(?:°?\s*c|graus?)\b/i,
    /\bar\s+de\s+entrada\s*(?:=|:|de|em|esta|com)?\s*(-?\d{1,2}(?:[.,]\d{1,2})?)\s*(?:°?\s*c|graus?)\b/i
]);

const readDischargeTemperatureC = (text: string) => {
    const label = '(?:(?:temperatura\\s+(?:da\\s+|de\\s+)?)?descarga|(?:tubo|linha)\\s+de\\s+descarga)';
    // Na ordem invertida ("149 graus na descarga") o termo pode vir sozinho.
    const reverseLabel = '(?:(?:tubo|linha)\\s+(?:de\\s+)?descarga|temperatura\\s+(?:da\\s+|de\\s+)?descarga|descarga)';
    const value = '(-?\\d{1,3}(?:[.,]\\d{1,2})?)';
    const unit = '(?:°?\\s*c|graus?)(?:\\s*celsius)?';
    const link = MEASUREMENT_LINK;

    const patterns = [
        new RegExp(`\\b${label}\\b\\s*${link}\\s*${value}\\s*${unit}\\b`, 'i'),
        new RegExp(`\\b${value}\\s*${unit}\\s*(?:na|no|da|do|de|em)\\s*${reverseLabel}\\b`, 'i')
    ];

    // Numero SEM unidade ("tirei 149 na descarga") so e aceito quando a frase deixa claro
    // que a medida e de TEMPERATURA. Sem essa trava, "149 na descarga" poderia ser
    // pressao de descarga em PSI e viraria um alarme falso de limite de 130 °C.
    if (/\btermometro\b|\btermometria\b|\btemperatura\b|\bgraus?\b|°/i.test(text)) {
        patterns.push(new RegExp(`\\b${value}\\s*(?:na|no|da|do|de|em)\\s*${reverseLabel}\\b`, 'i'));
    }

    return readMeasurement(text, patterns);
};

const readCondenserTdK = (text: string) => readMeasurement(text, [
    /\btd\s+(?:do\s+)?condensador\s*(?:=|:|de|em|esta|com)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
    /\bdiferenca\s+de\s+temperatura\s+(?:do\s+)?condensador\s*(?:=|:|de|em|esta|com)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i
]);

// "por hora" em todas as formas de campo: por hora, /h, na hora, em uma hora, na ultima hora.
const PER_HOUR = '(?:por\\s+hora|\\/\\s*h(?:ora)?|(?:na|em|durante|numa)\\s+(?:a\\s+|uma\\s+|ultima\\s+)?hora)';
// "partidas", "acionamentos", "ligamentos" e tambem "vezes" (so vale com o qualificador de hora junto).
const START_NOUN = '(?:partidas?|acionamentos?|ligamentos?|vezes?)';

const readStartsPerHour = (text: string) => readMeasurement(text, [
    new RegExp(`\\b(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*${START_NOUN}\\s*${PER_HOUR}\\b`, 'i'),
    new RegExp(`\\b${START_NOUN}\\s*${PER_HOUR}\\s*${MEASUREMENT_LINK}\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\b`, 'i'),
    new RegExp(`\\b(?:o\\s+)?compressor\\s+(?:liga|parte|aciona|arranca|faz|fez|teve|registrou)\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*${START_NOUN}\\s*${PER_HOUR}\\b`, 'i'),
    // "liga e desliga 9 vezes na hora", "ciclando 12 vezes por hora" - sem citar o compressor
    new RegExp(`\\b(?:liga\\s+e\\s+desliga|desliga\\s+e\\s+liga|ciclando|ciclou|cicla|liga|parte|aciona)\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*${START_NOUN}\\s*${PER_HOUR}\\b`, 'i'),
    // "contei 20 partidas por hora", "deu 14 partidas em uma hora"
    new RegExp(`\\b(?:contei|contou|deu|deram|foram|tiveram|registrou)\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*${START_NOUN}\\s*${PER_HOUR}\\b`, 'i')
]);

const readVoltageImbalancePercent = (text: string) => readMeasurement(text, [
    /\bdesequilibrio\s+(?:de\s+)?tensao\s*(?:=|:|de|em|esta|com)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i,
    /\bdesequilibrio\s+(?:entre\s+)?fases\s*(?:=|:|de|em|esta|com)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i
]);

const readMilkEntryTemperatureC = (text: string) => readMeasurement(text, [
    /\bleite\s+(?:entra|chega|entrando)\s*(?:no\s+tanque\s*)?(?:=|:|a|com|em)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:°?\s*c|graus?)\b/i,
    /\bentrada\s+(?:do\s+)?leite\s*(?:=|:|a|com|em)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:°?\s*c|graus?)\b/i
]);

const formatPsig = (value: number) => `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} PSIG`;

const buildRefrigerationPlausibility = (
    prompt: string,
    context: SupportDiagnosticContext,
    mode: SupportMode
): RefrigerationPlausibility | undefined => {
    const text = normalize(prompt);
    const refrigerant = detectRefrigerant(prompt, context);
    const suctionPsig = readPressureForSide(text, 'suction') ?? readLegacyContextPressure(context.pressure);
    const dischargePsig = readPressureForSide(text, 'discharge');
    const ambientC = readAmbientC(text);
    const dischargeTemperatureC = readDischargeTemperatureC(text);
    const condenserTdK = readCondenserTdK(text);
    const startsPerHour = readStartsPerHour(text);
    const voltageImbalancePercent = readVoltageImbalancePercent(text);
    const milkEntryTemperatureC = readMilkEntryTemperatureC(text);
    const hasSoftStarter = includesAny(text, ['soft-starter', 'soft starter', 'softstarter', 'soft start']);
    const hasPlatePrecooler = includesAny(text, ['pre-resfriador', 'preresfriador']) && text.includes('placa');
    const agitatorStopped = text.includes('agitador') && includesAny(text, ['parado', 'nao gira', 'nao funciona', 'desligado', 'travado']);
    const tankCapacityLiters = extractTankCapacityLiters(`${context.model || ''} ${prompt}`);
    const hasExplicitMultipleUnits = /\b(?:[2-5]|dois|duas|tres|quatro|cinco)\s+(?:circuitos?|comp(?:ressores?)?)\b/.test(text);
    const comparesTwoUnits = /\b(?:um|1)\s+(?:circuito|compressor)\b[\s\S]{0,160}\b(?:o\s+)?outro\b/.test(text) ||
        (text.includes('circuito 1') && text.includes('circuito 2')) ||
        (text.includes('compressor 1') && text.includes('compressor 2'));
    const largeTankMentionsUnit = (tankCapacityLiters ?? 0) >= 18000 && includesAny(text, ['circuito', 'compressor']);
    const hasMultipleCircuits = text.includes('multicircuito') || hasExplicitMultipleUnits || comparesTwoUnits || largeTankMentionsUnit;
    const hasPressure = suctionPsig !== undefined || dischargePsig !== undefined;
    const hasOperationalEvidence = dischargeTemperatureC !== undefined || condenserTdK !== undefined || startsPerHour !== undefined ||
        voltageImbalancePercent !== undefined || (hasPlatePrecooler && milkEntryTemperatureC !== undefined) || agitatorStopped || hasMultipleCircuits;

    if (!hasPressure && !hasOperationalEvidence) return undefined;
    if (mode === 'ELEC' && !hasPressure && dischargeTemperatureC === undefined && condenserTdK === undefined && milkEntryTemperatureC === undefined) {
        return undefined;
    }

    const facts: string[] = [];
    const guardrails = [
        'Faixas de pressão são referências típicas de triagem, não valores de projeto nem diagnóstico automático.',
        'Antes de agir, confirmar fluido, unidade, circuito, ponto da tomada e sistema estabilizado.'
    ];
    if (suctionPsig !== undefined) facts.push(`Sucção informada: ${formatPsig(suctionPsig)}.`);
    if (dischargePsig !== undefined) facts.push(`Descarga informada: ${formatPsig(dischargePsig)}.`);
    if (ambientC !== undefined) facts.push(`Ar de entrada/ambiente informado: ${ambientC.toFixed(1)}°C.`);
    if (dischargeTemperatureC !== undefined) facts.push(`Temperatura de descarga informada: ${dischargeTemperatureC.toFixed(1)}°C.`);
    if (condenserTdK !== undefined) facts.push(`TD do condensador informado: ${condenserTdK.toFixed(1)}K.`);
    if (startsPerHour !== undefined) facts.push(`Partidas informadas: ${startsPerHour.toFixed(1)} por hora${hasSoftStarter ? ' com soft-starter' : ''}.`);
    if (voltageImbalancePercent !== undefined) facts.push(`Desequilíbrio de tensão informado: ${voltageImbalancePercent.toFixed(1)}%.`);
    if (hasPlatePrecooler && milkEntryTemperatureC !== undefined) facts.push(`Leite entra a ${milkEntryTemperatureC.toFixed(1)}°C com pré-resfriador a placas instalado.`);
    if (agitatorStopped) facts.push('Agitador informado como parado durante o resfriamento.');
    if (hasMultipleCircuits) facts.push('Equipamento informado com múltiplos circuitos frigoríficos.');

    const buildResult = (
        evidenceClass: EvidenceClass,
        isOutlier: boolean,
        hypothesis: string,
        questions: string[],
        action: string,
        compressionRatio?: number
    ): RefrigerationPlausibility => ({
        refrigerant,
        suctionPsig,
        dischargePsig,
        ambientC,
        compressionRatio,
        dischargeTemperatureC,
        condenserTdK,
        startsPerHour,
        voltageImbalancePercent,
        evidenceClass,
        isOutlier,
        hypothesis,
        questions,
        action,
        guardrails,
        facts
    });

    if (dischargeTemperatureC !== undefined && dischargeTemperatureC > 130) {
        guardrails.push('130°C é limite oficial de referência Maneurop MT/MTZ; confirmar modelo e ponto de medição, mas tratar a ultrapassagem como alerta firme.');
        return buildResult(
            'limite oficial',
            true,
            `A temperatura de descarga de ${dischargeTemperatureC.toFixed(1)}°C ultrapassa o limite de referência de 130°C para Maneurop MT/MTZ. É condição de proteção, não apenas faixa típica.`,
            [
                'A temperatura foi medida em qual ponto da linha e com qual instrumento?',
                'Quais são as pressões de sucção/descarga e o Sup.Aque total na entrada do compressor?'
            ],
            'Interrompa a insistência de funcionamento e investigue alta taxa de compressão, sucção superaquecida, condensação e carga antes de religar.'
        );
    }

    const startsLimit = hasSoftStarter ? 6 : 12;
    if (startsPerHour !== undefined && startsPerHour > startsLimit) {
        guardrails.push(`${startsLimit} partidas por hora é limite oficial de referência para esta condição Maneurop MT/MTZ.`);
        return buildResult(
            'limite oficial',
            true,
            `${startsPerHour.toFixed(0)} partidas por hora ultrapassam o limite de ${startsLimit}${hasSoftStarter ? ' com soft-starter' : ''}; a ciclagem ameaça lubrificação e resfriamento do motor.`,
            [
                'A contagem foi feita em uma hora completa e o compressor realmente possui soft-starter?',
                'Qual controle está cortando e retomando: temperatura, baixa, alta ou proteção elétrica?'
            ],
            'Pare de repetir partidas e corrija diferencial, temporização ou proteção que está provocando a ciclagem.'
        );
    }

    if (voltageImbalancePercent !== undefined && voltageImbalancePercent > 2) {
        guardrails.push('2% é limite oficial de referência Danfoss para desequilíbrio entre fases.');
        return buildResult(
            'limite oficial',
            true,
            `O desequilíbrio de ${voltageImbalancePercent.toFixed(1)}% ultrapassa o limite de referência de 2% e pode elevar corrente/temperatura do compressor.`,
            [
                'Quais são as três tensões fase-fase medidas com o compressor em carga?',
                'As correntes das três fases também estão desequilibradas?'
            ],
            'Não force o compressor; confirme a alimentação e corrija a origem do desequilíbrio antes de insistir na partida.'
        );
    }

    if (condenserTdK !== undefined && condenserTdK > 20) {
        guardrails.push('TD de 10K a 20K é faixa típica de triagem, não limite oficial do equipamento.');
        return buildResult(
            'faixa típica',
            true,
            `O TD de ${condenserTdK.toFixed(1)}K está acima da faixa típica de triagem. Isso pede confirmação da conta e investigação do lado de alta; não condena condensador nem carga sozinho.`,
            [
                'Confirma temperatura de condensação pela tabela correta e temperatura do ar entrando no condensador?',
                'A serpentina, os ventiladores e a recirculação de ar foram verificados?'
            ],
            'Repita as duas temperaturas no mesmo circuito estabilizado e só então investigue fluxo de ar, sujeira e carga.'
        );
    }

    if (hasPressure && !refrigerant) {
        return buildResult(
            'hipótese diagnóstica',
            true,
            'A pressão foi informada, mas não pode ser comparada com segurança sem confirmar o fluido refrigerante.',
            [
                'Qual é o fluido confirmado na placa: R-22 ou R-404A?',
                'A leitura é de sucção ou descarga, em qual circuito e com o compressor estabilizado?'
            ],
            'Não ajuste carga nem válvula de expansão até confirmar fluido, lado medido e unidade.'
        );
    }

    const window = refrigerant ? getTypicalPressureWindow(refrigerant, ambientC) : null;
    if (hasPressure && !window) return undefined;

    if (window) facts.push(`Janela típica de sucção para triagem (${window.evaporationC.min}°C a ${window.evaporationC.max}°C): ${window.suctionPsig.min} a ${window.suctionPsig.max} PSIG.`);
    if (window?.dischargePsig && window.condensingC) {
        facts.push(`Janela típica de descarga com ambiente de ${ambientC?.toFixed(1)}°C (${window.condensingC.min.toFixed(1)}°C a ${window.condensingC.max.toFixed(1)}°C de condensação): ${window.dischargePsig.min} a ${window.dischargePsig.max} PSIG.`);
    }
    if (refrigerant === 'R-404A') {
        guardrails.push('R-404A: sucção/evaporação usa dew; descarga/linha líquida usa bubble quando aplicável.');
    }

    const suctionLow = window !== null && suctionPsig !== undefined && suctionPsig < window.suctionPsig.min;
    const suctionVeryLow = window !== null && suctionPsig !== undefined && suctionPsig < window.suctionPsig.min * 0.7;
    const suctionHigh = window !== null && suctionPsig !== undefined && suctionPsig > window.suctionPsig.max;
    const dischargeLow = window !== null && dischargePsig !== undefined && window.dischargePsig !== undefined && dischargePsig < window.dischargePsig.min;
    const dischargeHigh = window !== null && dischargePsig !== undefined && window.dischargePsig !== undefined && dischargePsig > window.dischargePsig.max;
    const compressionRatio = suctionPsig !== undefined && dischargePsig !== undefined && suctionPsig > -14.6
        ? Number(((dischargePsig + 14.7) / (suctionPsig + 14.7)).toFixed(2))
        : undefined;
    if (compressionRatio !== undefined) {
        facts.push(`Taxa de compressão calculada com pressões absolutas: ${compressionRatio.toFixed(2)} (faixa típica de triagem: 3,2 a 5,5).`);
    }
    const ratioOutlier = compressionRatio !== undefined && (compressionRatio < 3.2 || compressionRatio > 5.5);
    const isOutlier = suctionLow || suctionHigh || dischargeLow || dischargeHigh || ratioOutlier;

    let hypothesis = 'As pressões estão dentro da janela típica de triagem, mas isso não comprova que o ciclo está normal; ainda é preciso cruzar temperaturas, Sup.Aque, Sub.Res e carga do tanque.';
    let questions = [
        'As leituras foram feitas no mesmo circuito, com o compressor e o agitador estabilizados?',
        'Quais são o Sup.Aque, o Sub.Res e a temperatura atual do leite?'
    ];
    let action = 'Mantenha o diagnóstico por medições; não altere carga nem válvula de expansão por pressão isolada.';

    if (suctionVeryLow && window) {
        hypothesis = `A sucção de ${formatPsig(suctionPsig!)} está muito abaixo da janela típica de ${window.suctionPsig.min} a ${window.suctionPsig.max} PSIG para ${refrigerant}. Se a leitura for confirmada, priorize vazamento/carga insuficiente, flash gas ou restrição, sem escolher uma causa antes de cruzar o Sub.Res.`;
        questions = [
            'Confirma fluido, unidade, tomada de sucção, circuito e leitura com o compressor estabilizado?',
            'Qual é o Sub.Res e há sinal de óleo/vazamento ou queda de temperatura no filtro secador/solenoide?'
        ];
        action = 'Não complete carga nem ajuste a válvula ainda; confirme a leitura e procure vazamento/restrição com medições cruzadas.';
    } else if (suctionLow) {
        hypothesis = 'A sucção está abaixo da faixa típica e exige investigar baixa carga térmica, carga insuficiente, flash gas ou restrição; a pressão isolada não separa essas causas.';
    } else if (suctionHigh) {
        hypothesis = 'A sucção está acima da faixa típica e exige investigar carga térmica alta, alimentação excessiva ou perda de capacidade do compressor; não condene o compressor sem comparar descarga, corrente e outro circuito.';
    } else if (dischargeHigh) {
        hypothesis = 'A descarga está acima da faixa típica para o ambiente informado; priorize fluxo de ar, sujeira, ventiladores e recirculação antes de avaliar excesso de fluido ou não condensáveis.';
    } else if (dischargeLow) {
        hypothesis = 'A descarga está abaixo da faixa típica para o ambiente informado; investigue carga térmica, carga de fluido, controle de condensação e capacidade de bombeamento.';
    } else if (ratioOutlier && compressionRatio !== undefined) {
        hypothesis = compressionRatio < 3.2
            ? 'A taxa de compressão está baixa para a triagem. Compare corrente, capacidade e outro circuito antes de suspeitar perda de bombeamento do compressor.'
            : 'A taxa de compressão está alta para a triagem. Procure descarga elevada, sucção baixa, restrição ou carga insuficiente antes de insistir na operação.';
    }

    if (dischargePsig !== undefined && ambientC === undefined) {
        questions = [
            'Qual é a temperatura do ar entrando no condensador?',
            'A leitura de descarga é de qual circuito e foi feita com ventiladores e compressor estabilizados?'
        ];
        action = 'Não classifique a pressão de descarga sem medir o ar de entrada e conferir fluxo/recirculação no condensador.';
    }

    if (!isOutlier && hasPlatePrecooler && milkEntryTemperatureC !== undefined && milkEntryTemperatureC > 18) {
        return buildResult(
            'faixa típica',
            true,
            `Com pré-resfriador a placas instalado, leite entrando a ${milkEntryTemperatureC.toFixed(1)}°C está acima da referência de campo de 16°C a 18°C. Confirme condições antes de atribuir toda a demora ao circuito frigorífico.`,
            [
                'Qual é a temperatura da água na entrada e na saída do pré-resfriador?',
                'A placa está limpa, com vazão correta e ligações em contracorrente?'
            ],
            'Verifique vazão, limpeza e sentido das conexões do pré-resfriador antes de alterar carga de fluido.',
            compressionRatio
        );
    }

    if (!isOutlier && agitatorStopped) {
        return buildResult(
            'hipótese diagnóstica',
            true,
            'Agitador parado aponta primeiro para perda de troca térmica, estratificação e congelamento localizado; não prova retorno de líquido automaticamente.',
            [
                'O agitador fica parado durante todo o ciclo ou apenas nos intervalos programados?',
                'Existe crosta/gelo no fundo e a pá está coberta pelo volume de leite?'
            ],
            'Restabeleça a agitação correta e compare a queda de temperatura antes de mexer em carga ou válvula de expansão.',
            compressionRatio
        );
    }

    if (!isOutlier && hasMultipleCircuits) {
        return buildResult(
            'hipótese diagnóstica',
            false,
            'Em tanque multicircuito, uma leitura isolada não representa o conjunto; compare os circuitos sob a mesma carga para separar falha comum de falha individual.',
            [
                'Quais são sucção, descarga e corrente de cada circuito no mesmo momento?',
                'Todos os compressores e ventiladores estão ativos no mesmo estágio do resfriamento?'
            ],
            'Registre as medidas lado a lado e investigue primeiro o circuito que divergir dos demais.',
            compressionRatio
        );
    }

    return buildResult(
        isOutlier ? 'faixa típica' : 'dentro da faixa típica',
        isOutlier,
        hypothesis,
        questions,
        action,
        compressionRatio
    );
};

const detectVoltage = (combinedText: string) => {
    if (combinedText.includes('380')) return '380 V trifásico';
    if (combinedText.includes('220') && includesAny(combinedText, ['mono', 'monofasico', '1~'])) return '220 V monofásico';
    if (combinedText.includes('220')) return '220 V trifásico/confirmar fases';
    return 'tensão não confirmada';
};

const detectCompressorCount = (combinedText: string): number | undefined => {
    const match = combinedText.match(/\b([1-5])\s*(?:comp|compressor|compressores|unidade|unidades)\b/);
    const parsed = parseNumber(match?.[1]);
    return parsed === undefined ? undefined : Math.round(parsed);
};

const detectCompressorNumber = (combinedText: string): number | undefined => {
    const match = combinedText.match(/\bcompressor\s*0?([1-5])\b/);
    const parsed = parseNumber(match?.[1]);
    return parsed === undefined ? undefined : Math.round(parsed);
};

const getClpOutputPath = (compressorNumber?: number) => {
    if (compressorNumber === 1) return 'saída YB -> relé RL15 -> contatora K1';
    if (compressorNumber === 2) return 'saída YC -> relé RL16 -> contatora K2';
    if (compressorNumber === 3) return 'saída YD -> relé RL17 -> contatora K3';
    if (compressorNumber === 4) return 'saída dedicada do compressor 04 -> relé RL31 -> contatora K4';
    if (compressorNumber === 5) return 'referências dedicadas do compressor 05 no esquema PE 5 comp -> contatora K5';
    return 'saídas YB/YC/YD e relés RL15/RL16/RL17/RL31 -> contatoras dos compressores';
};

const getAgitatorOutputPath = (family: { family: string; isLargeTank: boolean }) => {
    if (family.isLargeTank) {
        return 'CLP Panasonic saída YE -> relé RL6 (ou RL18 nos quadros novos) -> borne/interligação com painel geral -> contatora do agitador -> DM do agitador -> motor do agitador';
    }
    if (family.family.includes('Full Gauge')) {
        return 'Full Gauge bornes RA/NA -> comando/força do agitador -> contatora/DM -> motor do agitador';
    }
    return 'Ageon borne A -> circuito de comando do agitador -> contatora/DM -> motor do agitador';
};

const detectElectricalFamily = (prompt: string, context: SupportDiagnosticContext) => {
    const combined = normalize([context.model, context.voltage, prompt].filter(Boolean).join(' '));
    const capacity = extractTankCapacityLiters(`${context.model || ''} ${prompt}`);
    const voltage = detectVoltage(combined);
    const compressorCount = detectCompressorCount(combined);
    const compressorNumber = detectCompressorNumber(combined);
    const hasCip = includesAny(combined, ['cip', 'limpeza', 'robo', 'boumatic', 'lely', 'delaval', 'gea']);
    const isLargeTank = capacity !== null && capacity >= 4000;

    if (isLargeTank) {
        let reference = 'Base local de esquemas: tanques >=4000L com CLP Panasonic FP-X0 L40MR.';
        if ((capacity || 0) >= 18000 && voltage.includes('220') && (compressorCount === 4 || compressorCount === undefined)) {
            reference = 'PDF ativo: PE - TANQUE 20000L LIMPEZA AUTOMÁTICA - TRIFÁSICO 220V.';
        } else if ((capacity || 0) >= 18000 && voltage.includes('380') && (compressorCount === 4 || compressorCount === undefined)) {
            reference = 'PDF ativo: PE - TANQUE 20000L LIMPEZA AUTOMÁTICA - TRIFÁSICO 380V.';
        } else if (voltage.includes('380') && compressorCount === 5) {
            reference = 'PDF ativo: PE - TANQUE 5 COMP LIMPEZA AUTOMÁTICA - TRIFÁSICO 380V - V1.0.';
        } else if (hasCip) {
            reference = 'Base local: painel CIP/limpeza automática com CLP Panasonic, fonte 24Vcc e relés RL.';
        }

        return {
            family: `Tanque >=4000L, arquitetura CLP Panasonic, ${voltage}.`,
            reference,
            outputPath: getClpOutputPath(compressorNumber),
            compressorNumber,
            isLargeTank: true
        };
    }

    if (includesAny(combined, ['mt50', 'full gauge'])) {
        return {
            family: `Tanque menor/MT50 com controlador Full Gauge, ${voltage}.`,
            reference: 'Base local: MT50 trifásico 380V, bornes RU1/SU1/TU1 para resfriador e RA/NA para agitador.',
            outputPath: 'controlador Full Gauge -> bornes RU1/SU1/TU1 -> contatora/resfriador',
            compressorNumber,
            isLargeTank: false
        };
    }

    return {
        family: `Tanque menor ou família ainda não confirmada, ${voltage}.`,
        reference: 'Base local: Ageon MT-516CVT/Full Gauge conforme família; confirmar modelo antes de misturar esquemas.',
        outputPath: 'Ageon borne U ou Full Gauge RU1/SU1/TU1 -> circuito de comando -> contatora',
        compressorNumber,
        isLargeTank: false
    };
};

// Termos eletricos inequivocos: cruzam para o lado eletrico em QUALQUER modo, inclusive
// REF, porque indicam claramente causa/efeito de comando (nao isolar as disciplinas).
const STRONG_ELECTRICAL_TERMS = [
    'eletrica',
    'eletrico',
    'contatora',
    'contator',
    'a1',
    'a2',
    'disjuntor',
    'dm',
    'rele',
    'rff',
    'falta de fase',
    'borne',
    'painel',
    'clp',
    'ihm',
    '24v',
    'fonte',
    'metralhando',
    'choque'
];

// Termos ambiguos: em REF, "nao liga/parte/aciona" significa "nao resfria", entao so
// disparam analise eletrica fora do modo REF.
const WEAK_ELECTRICAL_TERMS = ['nao liga', 'nao parte', 'nao aciona'];

const isElectricalSignal = (text: string, mode: SupportMode) =>
    mode === 'ELEC' ||
    includesAny(text, STRONG_ELECTRICAL_TERMS) ||
    (mode !== 'REF' && includesAny(text, WEAK_ELECTRICAL_TERMS));

const hasContactorNoCloseSignal = (text: string) =>
    includesAny(text, ['contatora nao fecha', 'contator nao fecha', 'contatora nao aciona', 'contator nao aciona', 'nao fecha contatora']) ||
    ((text.includes('contatora') || text.includes('contator')) && includesAny(text, ['nao fecha', 'nao aciona', 'nao arma', 'nao atraca']));

const buildElectricalDecision = (prompt: string, mode: SupportMode, context: SupportDiagnosticContext): ElectricalDecision | undefined => {
    const text = normalize(prompt);
    if (!isElectricalSignal(text, mode)) return undefined;

    const family = detectElectricalFamily(prompt, context);
    const compressorNumber = family.compressorNumber;
    const compressorLabel = compressorNumber ? `compressor ${String(compressorNumber).padStart(2, '0')}` : 'compressor';
    const dmLabel = compressorNumber ? `DM${compressorNumber}` : 'DM do compressor';
    const kLabel = compressorNumber ? `K${compressorNumber}` : 'contatora do compressor';
    const agitatorPath = getAgitatorOutputPath(family);

    let symptom = 'falha elétrica/comando';
    let hypothesis = 'A falha mais provável está na cadeia elétrica de comando, permissivos ou proteção.';
    let questions = [
        'Qual tensão foi medida na entrada do painel e na alimentação de comando?',
        'A IHM/CLP está ligada e existe algum alarme de falta de fase, sobrecarga ou pressostato?'
    ];
    let action = 'Siga a sequência segura: alimentação, proteções, permissivos, saída de comando e bobina da contatora.';
    let decisionTree = [
        'Segurança: painel energizado só deve ser medido por técnico habilitado, com EPI e método seguro.',
        `Família aplicada: ${family.family}`,
        `Referência local: ${family.reference}`,
        'Não misturar esquema 220V com 380V nem família de 4 compressores com 5 compressores.'
    ];

    if (hasContactorNoCloseSignal(text)) {
        symptom = 'contatora não fecha';
        hypothesis = 'A contatora não fecha por bobina sem comando, permissivo aberto ou proteção em série aberta; se A1/A2 tiver tensão nominal e não fechar, a própria contatora/bobina vira suspeita.';
        questions = [
            'Quando pede partida, há tensão nominal em A1/A2 da bobina da contatora?',
            'DM/relé térmico/RFF/pressostato/botoeira de emergência estão fechados e sem alarme?'
        ];
        action = `Confira primeiro proteções e permissivos; depois meça A1/A2 e siga ${family.outputPath}.`;
        decisionTree = decisionTree.concat([
            'Se A1/A2 não tem tensão: procurar aberto antes da bobina, como RFF, DM auxiliar, pressostato, emergência, saída CLP/controlador ou relé de interface.',
            'Se A1/A2 tem tensão nominal e não fecha: bobina errada/aberta/queimada, contatora travada ou defeito mecânico.',
            'Se fecha e cai/metralha: queda de tensão na partida, borne frouxo, cabo fino/oxidado ou bobina com tensão incorreta.',
            'Se fecha mas motor não parte: ir para lado de força, contatos principais, DM, fases, soft-starter e compressor.'
        ]);
    } else if (includesAny(text, ['metralhando', 'bate e solta', 'arma e desarma', 'fica batendo'])) {
        symptom = 'contatora metralhando';
        hypothesis = 'Contatora metralhando aponta para queda de tensão na partida, mau contato, cabo subdimensionado/oxidado ou bobina com tensão incorreta.';
        questions = [
            'Quanto cai a tensão em A1/A2 exatamente no momento da partida?',
            'Os bornes de alimentação/comando estão apertados e sem oxidação?'
        ];
        action = 'Meça A1/A2 durante a partida, não apenas em repouso; procure queda forte de tensão antes de condenar a contatora.';
        decisionTree = decisionTree.concat([
            'Tensão nominal parada não basta: medir durante a tentativa de partida.',
            'Se cair muito: revisar rede da fazenda, bitola, emendas, bornes, RFF e alimentação de comando.',
            'Se tensão se mantém nominal: conferir bobina, núcleo da contatora e carga mecânica/elétrica na partida.'
        ]);
    } else if (includesAny(text, ['nenhum compressor', 'compressores nao ligam', 'compressor nenhum liga'])) {
        symptom = 'nenhum compressor liga';
        hypothesis = 'Quando nenhum compressor liga, a prioridade é a cadeia comum: chave geral, disjuntor de comando, RFF/falta de fase, emergência, permissivo automático/manual e CLP/controlador.';
        questions = [
            'Há alarme de falta de fase/RFF, emergência ou disjuntor de comando aberto?',
            'A IHM/CLP mostra demanda de refrigeração e alguma saída de compressor aciona?'
        ];
        action = 'Verifique primeiro o comum a todos: DG/DC1, RFF, emergência e permissivo; depois avance para saídas individuais.';
        decisionTree = decisionTree.concat([
            'Se todos pararam, não comece por uma contatora individual.',
            'Confirmar tensão de entrada, disjuntor de comando, fonte 24Vcc, RFF e emergência.',
            'Depois confirmar demanda na IHM/CLP/controlador e saídas de comando.'
        ]);
    } else if (compressorNumber && includesAny(text, ['nao liga', 'nao parte', 'nao aciona', 'nao fecha'])) {
        symptom = `${compressorLabel} não liga`;
        hypothesis = `${compressorLabel} parado aponta para ${dmLabel} desarmado, ${kLabel} sem energização, saída/permissivo sem comando, pressostato aberto ou alarme elétrico dedicado.`;
        questions = [
            `O ${dmLabel} está armado e sem alarme dedicado na IHM/CIP?`,
            `Quando pede partida, ${kLabel} recebe tensão na bobina e a rota ${family.outputPath} aciona?`
        ];
        action = `Siga ${dmLabel} -> saída/permissivo -> A1/A2 de ${kLabel} -> força do ${compressorLabel}.`;
        decisionTree = decisionTree.concat([
            `Rota prioritária: ${dmLabel} armado, pressostato fechado, RFF ok e comando chegando em ${kLabel}.`,
            `Para tanque com CLP, verificar LED/saída e relé de interface em: ${family.outputPath}.`,
            `Se ${kLabel} fecha e o motor não parte, verificar potência, contatos principais, soft-starter/fases e compressor.`
        ]);
    } else if (includesAny(text, ['ihm apagada', 'display apagado', 'painel morto', 'clp apagado'])) {
        symptom = 'IHM/CLP apagado';
        hypothesis = 'IHM/CLP apagado e falha de alimentação de comando: disjuntor de comando, fusível, fonte 24Vcc, emergência ou perda de alimentação do painel.';
        questions = [
            'Existe tensão na entrada da fonte 24Vcc e 24Vcc na saída da fonte?',
            'O disjuntor de comando/fusível/emergência está fechado e sem mau contato?'
        ];
        action = 'Comece pela alimentação de comando e fonte 24Vcc; não vá para pressão/manifold antes de recuperar IHM/CLP.';
        decisionTree = decisionTree.concat([
            'Sem IHM/CLP, tratar como comando sem alimentação.',
            'Verificar entrada da fonte, saída 24Vcc, disjuntor de comando, fusível, emergência e bornes.',
            'Se 24Vcc existe e IHM não liga, verificar cabo/comunicação/alimentação da própria IHM.'
        ]);
    } else if (includesAny(text, ['clp ligado mas nenhuma saida', 'clp ligado nenhuma saida', 'nenhuma saida atua'])) {
        symptom = 'CLP ligado sem saídas';
        hypothesis = 'CLP ligado sem saídas atuando indica emergência aberta, falta de 0V/referência, permissivo ausente, fonte 24Vcc instável ou lógica bloqueada por alarme.';
        questions = [
            'A emergência, permissivo do painel principal e referência 0V/24Vcc estão corretos?',
            'Existe alarme ativo na IHM bloqueando o ciclo ou a refrigeração?'
        ];
        action = 'Confira emergência, 0V/24Vcc e permissivos antes de condenar o CLP.';
        decisionTree = decisionTree.concat([
            'CLP ligado não garante permissivo de saída.',
            'Verificar emergência, negativo/0V, fonte 24Vcc sob carga e permissivos vindos do painel geral.',
            'Depois conferir LEDs de saída e relés de interface.'
        ]);
    } else if (includesAny(text, ['falta de fase', 'rff', 'fase fantasma'])) {
        symptom = 'falta de fase/RFF';
        hypothesis = 'Alarme de falta de fase pode ser fase real ausente, sequência incorreta, mau contato em borne/cabo ou fase fantasma gerada por motor trifásico.';
        questions = [
            'As três fases foram medidas fase-fase na entrada e depois do disjuntor/RFF?',
            'A corrente dos motores foi medida nas três fases durante a tentativa de partida?'
        ];
        action = 'Meça tensão e corrente por fase; não confie apenas em medição sem carga quando há suspeita de fase fantasma.';
        decisionTree = decisionTree.concat([
            'Medir L1-L2, L2-L3, L1-L3 antes e depois das proteções.',
            'Medir corrente por fase com carga.',
            'Se uma fase some sob carga, procurar borne, cabo, disjuntor, contator ou alimentação da fazenda.'
        ]);
    } else if (includesAny(text, ['bomba de limpeza', 'bomba limpeza', 'bomba cip'])) {
        symptom = 'bomba de limpeza/CIP não aciona';
        hypothesis = 'Na bomba de limpeza, a causa comum é permissivo de nível/RL1, DM da bomba, contatora sem comando, ausência do sinal entre painel geral e CIP ou saída CLP sem atuar.';
        questions = [
            'O relé de nível RL1 reconheceu água/solução suficiente no tanque?',
            'O DM da bomba está armado e a saída/relé do CLP aciona durante a etapa?'
        ];
        action = 'Comece pelo nível/RL1 e DM da bomba antes de condenar a bomba.';
        decisionTree = decisionTree.concat([
            'CIP precisa de permissivo de nível antes de liberar bomba.',
            'Verificar RL1/sensor de nível, DM da bomba, contatora, saída CLP e borne de interligação.',
            'Se comando chega e carga não roda, ir para potência/motor.'
        ]);
    } else if (includesAny(text, ['choque', 'lataria', 'carcaca energizada'])) {
        symptom = 'choque na lataria/carcaça';
        hypothesis = 'Choque na lataria indica fuga para massa e aterramento ausente/ineficiente; é falha de segurança, não simples ajuste de operação.';
        questions = [
            'Existe aterramento medido e DR/DPS em condição correta?',
            'O choque aparece ao ligar qual circuito: principal, agitador, compressor ou limpeza?'
        ];
        action = 'Interrompa operação insegura e isole circuito por circuito até achar onde a fuga aparece.';
        decisionTree = decisionTree.concat([
            'Desligar cargas e religar uma por vez para localizar circuito com fuga.',
            'Verificar aterramento, isolamento dos motores, cabos, resistência de aquecedor e umidade no painel.',
            'Não liberar equipamento com carcaça energizada.'
        ]);
    } else if (text.includes('agitador')) {
        symptom = 'agitador não aciona';
        if (family.isLargeTank) {
            hypothesis = 'Em tanque grande, o agitador deve ser diagnosticado pelo esquema elétrico: CLP Panasonic libera a saída YE, aciona RL6/RL18, passa pela interligação com o painel geral e só depois chega em contatora, DM e motor do agitador.';
            questions = [
                'Na IHM/CLP existe comando de agitador e o LED da saída YE acende quando solicita agitação?',
                'No painel geral, o DM do agitador está armado e chega tensão em A1/A2 da contatora do agitador?'
            ];
            action = `Siga o esquema parte por parte: ${agitatorPath}.`;
            decisionTree = decisionTree.concat([
                'Para tanque >=4000L, use somente a rota CLP Panasonic do esquema elétrico.',
                'Confirmar alimentação de comando/IHM e se há solicitação de agitação no CLP.',
                'Verificar saída YE do CLP; se YE não acende, procurar bloqueio por modo, alarme, emergência ou lógica/CIP.',
                'Se YE acende, verificar relé de interface RL6 ou RL18 e o borne de interligação até o painel geral.',
                'No painel geral, medir A1/A2 da contatora do agitador durante o comando.',
                'Se A1/A2 tem tensão e a contatora não fecha: bobina/contatora. Se fecha e o motor não gira: DM, força, fases/cabos e motor.'
            ]);
        } else {
            hypothesis = 'Agitador é diagnóstico de comando/elétrica: saída do controlador, contatora, DM e motor elétrico.';
            questions = [
                'O comando está em manual, automático ou vindo do controlador?',
                'A saída do controlador aciona a contatora do agitador e o DM está armado?'
            ];
            action = `Siga o esquema parte por parte: ${agitatorPath}.`;
            decisionTree = decisionTree.concat([
                'Não começar girando pás manualmente como diagnóstico principal.',
                `Verificar a rota do esquema: ${agitatorPath}.`,
                'Depois medir tensão/corrente do motor.'
            ]);
        }
    }

    return {
        symptom,
        family: family.family,
        reference: family.reference,
        outputPath: family.outputPath,
        hypothesis,
        questions,
        action,
        decisionTree
    };
};

export const analyzeSupportCase = (
    prompt: string,
    mode: SupportMode,
    context: SupportDiagnosticContext
): SupportCaseAnalysis => ({
    shSc: buildShScDiagnostic(prompt, context),
    refrigeration: buildRefrigerationPlausibility(prompt, context, mode),
    electrical: buildElectricalDecision(prompt, mode, context)
});

export const buildSupportAnalysisInstruction = (analysis: SupportCaseAnalysis) => {
    const blocks: string[] = [];
    const requiredOpening = buildRequiredSupportOpening(analysis);

    if (hasHealthyRefrigerationMeasurements(analysis)) {
        blocks.push([
            '[CONCLUSÃO COMBINADA DAS MEDIÇÕES]',
            '- Pressões, Sup.Aque e Sub.Res estão dentro das faixas típicas informadas.',
            '- O conjunto é compatível com operação normal e não indica falha frigorífica pelos dados fornecidos.',
            '- Não inventar defeito nem orientar ajuste de carga ou válvula sem um sintoma real adicional.'
        ].join('\n'));
    }

    if (analysis.shSc) {
        blocks.push([
            '[PARSER SH/SC LOCAL - RESULTADO DETERMINÍSTICO]',
            ...analysis.shSc.facts.map(fact => `- ${fact}`),
            `- Padrão: ${analysis.shSc.pattern}.`,
            `- Hipótese técnica: ${analysis.shSc.hypothesis}`,
            `- Perguntas prioritárias: 1) ${analysis.shSc.questions[0]} 2) ${analysis.shSc.questions[1]}`,
            `- Ação imediata: ${analysis.shSc.action}`,
            ...analysis.shSc.guardrails.map(rule => `- Regra: ${rule}`)
        ].join('\n'));
    }

    if (analysis.refrigeration) {
        blocks.push([
            '[PLAUSIBILIDADE FRIGORÍFICA LOCAL - RESULTADO DETERMINÍSTICO]',
            ...(requiredOpening ? ['- Regra de saída: a primeira linha deve anunciar esta leitura fora da faixa antes da hipótese.'] : []),
            ...analysis.refrigeration.facts.map(fact => `- ${fact}`),
            `- Classe da evidência: ${analysis.refrigeration.evidenceClass}.`,
            `- Leitura fora da faixa típica: ${analysis.refrigeration.isOutlier ? 'SIM' : 'NÃO'}.`,
            `- Interpretação técnica: ${analysis.refrigeration.hypothesis}`,
            `- Perguntas prioritárias: 1) ${analysis.refrigeration.questions[0]} 2) ${analysis.refrigeration.questions[1]}`,
            `- Ação imediata: ${analysis.refrigeration.action}`,
            ...analysis.refrigeration.guardrails.map(rule => `- Regra: ${rule}`)
        ].join('\n'));
    }

    if (analysis.electrical) {
        blocks.push([
            '[ÁRVORE ELÉTRICA LOCAL - RESULTADO DETERMINÍSTICO]',
            `- Sintoma: ${analysis.electrical.symptom}.`,
            `- Família/esquema usado: ${analysis.electrical.family}`,
            `- Referência local/PDF: ${analysis.electrical.reference}`,
            `- Rota de comando: ${analysis.electrical.outputPath}`,
            `- Hipótese técnica: ${analysis.electrical.hypothesis}`,
            `- Perguntas prioritárias: 1) ${analysis.electrical.questions[0]} 2) ${analysis.electrical.questions[1]}`,
            `- Ação imediata: ${analysis.electrical.action}`,
            '- Sequência de decisão:',
            ...analysis.electrical.decisionTree.map((step, index) => `  ${index + 1}. ${step}`)
        ].join('\n'));
    }

    if (!blocks.length) return '';

    return `\n\n[RESULTADO DO MOTOR TÉCNICO LOCAL - NÃO IGNORAR]\nO app calculou a leitura abaixo antes da resposta. Use como âncora técnica e não contradiga sem pedir medida nova.\n${blocks.join('\n\n')}`;
};
