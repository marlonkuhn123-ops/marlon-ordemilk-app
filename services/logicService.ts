
import { Refrigerant, CalcMode } from '../types';
import { PT_TABLES, PT_TABLE_SOURCE, PtCurveKey } from '../data/pt_tables';

export interface ReportData {
    client: string;
    date: string;
    techName: string;
    model: string;
    serviceMode: string;
    params: { sh: string; sc: string; temp: string };
    procedureText: string;
    obs: string;
}

type PtTablePoint = {
    pressure: number;
    temp: number;
};

type PtLookupResult = {
    satTemp: number | null;
    sourceLabel: string;
    curveLabel: string;
    warning?: string;
};

export interface CalculatorAudit {
    ready: boolean;
    modeShortLabel: 'SH' | 'SC';
    directionLabel: string;
    sourceLabel: string;
    tsatLabel: string;
    resultLabel: string;
    referenceLabel: string;
    classificationLabel: string;
    classification: 'BAIXO' | 'IDEAL' | 'ALTO' | null;
    satTemp: number | null;
    resultKelvin: number | null;
    curveLabel: string;
    actionLabel: string;
    warning?: string;
}

export const CALCULATOR_REFERENCE_RANGES: Record<CalcMode, { min: number; max: number; label: string }> = {
    Superaquecimento: { min: 7, max: 12, label: 'Faixa ideal: 7.0K a 12.0K' },
    'Sub-resfriamento': { min: 4, max: 8, label: 'Faixa ideal: 4.0K a 8.0K' }
};

const getCurveKeyForMode = (fluid: Refrigerant, mode: CalcMode): PtCurveKey => {
    if (fluid === Refrigerant.R404A) {
        return mode === 'Superaquecimento' ? 'dew' : 'bubble';
    }

    return 'single';
};

const getCurveLabel = (fluid: Refrigerant, curveKey: PtCurveKey): string => {
    if (fluid === Refrigerant.R404A && curveKey === 'dew') {
        return 'R404A dew/vapor - correto para SH';
    }

    if (fluid === Refrigerant.R404A && curveKey === 'bubble') {
        return 'R404A bubble/liquido - correto para SC';
    }

    return `${fluid} saturacao unica`;
};

const getSortedPtTablePoints = (fluid: Refrigerant, curveKey: PtCurveKey): PtTablePoint[] => {
    const table = PT_TABLES[fluid]?.[curveKey] || PT_TABLES[fluid]?.single;
    if (!table) return [];

    return Object.entries(table)
        .map(([pressure, temp]) => ({
            pressure: Number(pressure),
            temp
        }))
        .filter(point => Number.isFinite(point.pressure) && Number.isFinite(point.temp))
        .sort((a, b) => a.pressure - b.pressure);
};

const parseNumericInput = (value: string): number => {
    const normalized = value.replace(',', '.').trim();
    return normalized ? parseFloat(normalized) : Number.NaN;
};

const formatPressure = (value: number) => (Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1));
const formatTemperature = (value: number) => `${value.toFixed(1)}\u00b0C`;
const formatSubtractedTemperature = (value: number) =>
    value < 0 ? `(${formatTemperature(value)})` : formatTemperature(value);
const formatKelvin = (value: number) => `${value.toFixed(1)}K`;

const getReferenceRange = (mode: CalcMode) => CALCULATOR_REFERENCE_RANGES[mode];

const classifyCalculation = (resultKelvin: number, mode: CalcMode): 'BAIXO' | 'IDEAL' | 'ALTO' => {
    const range = getReferenceRange(mode);
    if (resultKelvin < range.min) return 'BAIXO';
    if (resultKelvin > range.max) return 'ALTO';
    return 'IDEAL';
};

const getRecommendedAction = (mode: CalcMode, classification: 'BAIXO' | 'IDEAL' | 'ALTO'): string => {
    if (mode === 'Superaquecimento') {
        if (classification === 'BAIXO') {
            return 'SH baixo: risco de retorno de liquido. Verificar VET muito aberta, bulbo solto/mal isolado ou orificio grande antes de fechar/ajustar.';
        }
        if (classification === 'ALTO') {
            return 'SH alto: evaporador recebendo pouco liquido. Cruzar com SC: se SC baixo, procurar falta de fluido/vazamento; se SC normal/alto, procurar restricao, filtro ou VET fechada.';
        }
        return 'SH ideal: nao mexer na VET apenas por este dado. Confirmar SC, pressoes, troca termica e estabilidade do sistema.';
    }

    if (classification === 'BAIXO') {
        return 'SC baixo ou negativo: sem reserva liquida. Verificar carga, vazamento, flash gas, condensacao baixa, filtro/linha liquida e aquecimento da linha antes de adicionar fluido.';
    }
    if (classification === 'ALTO') {
        return 'SC alto: pode haver excesso de fluido ou liquido preso no condensador. Antes de retirar fluido, confirmar condensador limpo, ventilacao, fan e ausencia de nao-condensaveis.';
    }
    return 'SC ideal: nao adicionar nem retirar fluido apenas por este dado. Cruzar com SH, visor, pressoes e carga termica.';
};

const getSaturationLookup = (fluid: Refrigerant, pressure: number, mode: CalcMode): PtLookupResult => {
    const curveKey = getCurveKeyForMode(fluid, mode);
    const curveLabel = getCurveLabel(fluid, curveKey);

    if (!Number.isFinite(pressure)) {
        return {
            satTemp: null,
            sourceLabel: PT_TABLE_SOURCE,
            curveLabel,
            warning: 'Pressao invalida. Digite um valor numerico para localizar a Tsat.'
        };
    }

    const points = getSortedPtTablePoints(fluid, curveKey);
    if (points.length === 0) {
        return {
            satTemp: null,
            sourceLabel: PT_TABLE_SOURCE,
            curveLabel,
            warning: `Tabela PT local indisponivel para ${fluid} (${curveLabel}).`
        };
    }

    if (pressure < points[0].pressure || pressure > points[points.length - 1].pressure) {
        return {
            satTemp: null,
            sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}`,
            curveLabel,
            warning: `Pressao fora da faixa da tabela PT local para ${fluid}. Confira o fluido e o manometro antes de agir.`
        };
    }

    const exactPoint = points.find(point => Math.abs(point.pressure - pressure) < 0.0001);
    if (exactPoint) {
        return {
            satTemp: exactPoint.temp,
            sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}; ponto exato em ${formatPressure(exactPoint.pressure)} PSIG`,
            curveLabel
        };
    }

    for (let i = 1; i < points.length; i++) {
        const lower = points[i - 1];
        const upper = points[i];

        if (pressure < lower.pressure || pressure > upper.pressure) continue;

        const span = upper.pressure - lower.pressure;
        if (span === 0) {
            return {
                satTemp: lower.temp,
                sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}; ponto repetido em ${formatPressure(lower.pressure)} PSIG`,
                curveLabel
            };
        }

        const ratio = (pressure - lower.pressure) / span;
        const interpolatedTemp = Number((lower.temp + ((upper.temp - lower.temp) * ratio)).toFixed(1));

        return {
            satTemp: interpolatedTemp,
            sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}; interpolado entre ${formatPressure(lower.pressure)} PSIG (${formatTemperature(lower.temp)}) e ${formatPressure(upper.pressure)} PSIG (${formatTemperature(upper.temp)})`,
            curveLabel
        };
    }

    return {
        satTemp: null,
        sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}`,
        curveLabel,
        warning: `Nao foi possivel localizar a Tsat local para ${fluid} em ${pressure} PSI.`
    };
};

/**
 * Lógica centralizada para evitar erros em produção.
 * Estas funções são puras: mesma entrada sempre gera mesma saída.
 */

export const logicService = {
    // Busca a temperatura de saturação local e interpola quando a pressão cair entre dois pontos conhecidos.
    getSaturationTemp: (fluid: Refrigerant, pressure: number, mode: CalcMode = 'Superaquecimento'): number | null => {
        return getSaturationLookup(fluid, pressure, mode).satTemp;
    },

    getCalculatorAudit: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode): CalculatorAudit => {
        const pressureVal = parseNumericInput(press);
        const tempMeasured = parseNumericInput(temp);
        const modeShortLabel = mode === 'Superaquecimento' ? 'SH' : 'SC';
        const directionLabel = mode === 'Superaquecimento'
            ? 'SH = temperatura do tubo de succao - Tsat'
            : 'SC = Tsat - temperatura da linha de liquido';
        const reference = getReferenceRange(mode);
        const curveLabel = getCurveLabel(fluid, getCurveKeyForMode(fluid, mode));
        const baseAudit: Omit<CalculatorAudit, 'ready' | 'sourceLabel' | 'tsatLabel' | 'resultLabel' | 'satTemp' | 'resultKelvin'> = {
            modeShortLabel,
            directionLabel,
            referenceLabel: reference.label,
            classificationLabel: 'Classificacao local: aguardando dados',
            classification: null,
            curveLabel,
            actionLabel: 'Conduta local: aguardando dados.'
        };

        if (!Number.isFinite(pressureVal) || !Number.isFinite(tempMeasured)) {
            return {
                ...baseAudit,
                ready: false,
                sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}`,
                tsatLabel: 'Tsat = --',
                resultLabel: `${modeShortLabel} = --`,
                satTemp: null,
                resultKelvin: null,
                warning: 'Preencha pressao e temperatura validas para exibir a conta auditavel.'
            };
        }

        const lookup = getSaturationLookup(fluid, pressureVal, mode);
        if (lookup.satTemp === null) {
            return {
                ...baseAudit,
                ready: false,
                sourceLabel: lookup.sourceLabel,
                tsatLabel: 'Tsat = --',
                resultLabel: `${modeShortLabel} = --`,
                satTemp: null,
                resultKelvin: null,
                curveLabel: lookup.curveLabel,
                warning: lookup.warning
            };
        }

        const resultKelvin = Number((mode === 'Superaquecimento'
            ? tempMeasured - lookup.satTemp
            : lookup.satTemp - tempMeasured).toFixed(1));
        const classification = classifyCalculation(resultKelvin, mode);
        const actionLabel = getRecommendedAction(mode, classification);
        const resultLabel = mode === 'Superaquecimento'
            ? `SH = ${formatTemperature(tempMeasured)} - ${formatSubtractedTemperature(lookup.satTemp)} = ${formatKelvin(resultKelvin)}`
            : `SC = ${formatTemperature(lookup.satTemp)} - ${formatSubtractedTemperature(tempMeasured)} = ${formatKelvin(resultKelvin)}`;

        return {
            ...baseAudit,
            ready: true,
            sourceLabel: lookup.sourceLabel,
            tsatLabel: `Tsat = ${formatTemperature(lookup.satTemp)}`,
            resultLabel,
            satTemp: lookup.satTemp,
            resultKelvin,
            curveLabel: lookup.curveLabel,
            actionLabel,
            classification,
            classificationLabel: `Classificacao local: ${classification}`
        };
    },

    // Formata o prompt da calculadora (Coração do diagnóstico de gás)
    formatCalculatorPrompt: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode): string => {
        const audit = logicService.getCalculatorAudit(fluid, press, temp, mode);
        const shRange = getReferenceRange('Superaquecimento');
        const scRange = getReferenceRange('Sub-resfriamento');

        // Se tivermos dados suficientes, passamos o cálculo fechado para a IA já processado.
        const calculationContext = audit.ready
            ? `CALCULO LOCAL REALIZADO (USE ESTE VALOR): ${audit.tsatLabel}. ${audit.resultLabel}. ${audit.classificationLabel}. Curva usada: ${audit.curveLabel}. Conduta local: ${audit.actionLabel}. Fonte: ${audit.sourceLabel}.`
            : `AVISO: ${audit.warning || `Nao foi possivel calcular localmente a temperatura de saturacao para ${fluid} a ${press} PSI.`} Realize o calculo com base em seu conhecimento.`;

        return `
        COMANDO: CALCULAR ${mode === 'Superaquecimento' ? 'Superaquecimento (SH)' : 'Sub-resfriamento (SC)'}.
        DADOS: Fluido ${fluid}, Pressao ${press} PSIG/manifold, Temperatura ${temp} C.
        
        ${calculationContext}

        CONTEXTO DE REFERÊNCIA:
        - Faixa IDEAL para Superaquecimento (SH): ${shRange.min}K a ${shRange.max}K (T.Sucção - T.Evaporação).
        - Faixa IDEAL para Sub-resfriamento (SC): ${scRange.min}K a ${scRange.max}K (T.Condensação - T.Linha de Líquido).
        - Para R404A, use dew/vapor no SH e bubble/liquido no SC. Nao use curva unica para blend.
        - A pressao informada pelo tecnico e PSIG/gauge de manifold, nao pressao absoluta.
        
        INSTRUÇÃO DE SAÍDA:
        NÃO use formatação Markdown ou símbolos especiais.
        1. Apresente o resultado final do cálculo em Kelvin (K). Se o cálculo foi fornecido acima, use-o obrigatoriamente.
        2. Classifique o resultado como ALTO, IDEAL ou BAIXO, comparando com a faixa de referência.
        3. Use a conduta local como trilho tecnico. Nao recomende adicionar fluido, recolher fluido, abrir VET ou fechar VET sem antes citar a confirmacao necessaria.
        `.trim();
    },

    // Formata o laudo técnico (Garante que nenhum dado do cliente suma)
    formatReportPrompt: (data: ReportData): string => {
        return `
        COMANDO: GERAR TEXTO DE LAUDO TÉCNICO (ESTRITO).
        DADOS CADASTRAIS:
        - Cliente: ${data.client || 'NÃO INFORMADO'}
        - Data: ${data.date}
        - Técnico: ${data.techName}
        - Equipamento: ${data.model || 'NÃO INFORMADO'}
        - Tipo: ${data.serviceMode.toUpperCase()}
        
        PARÂMETROS: SH: ${data.params.sh}K, SC: ${data.params.sc}K, Temp: ${data.params.temp}°C.
        
        ${data.procedureText}
        
        OBSERVAÇÕES: "${data.obs}"
        
        INSTRUÇÃO: Gere documento formal, sem saudações, com espaço para assinatura.
        `.trim();
    },

    // Cálculo de Sizing (Dimensionamento)
    calculateCargaTermica: (volume: number): { kcal: number; kw: number } => {
        const massa = volume * 1.03;
        const cargaBase = (massa * 0.93 * 31) / 3;
        const cargaTotalKcal = cargaBase * 0.75;
        return {
            kcal: Math.round(cargaTotalKcal),
            kw: parseFloat((cargaTotalKcal / 860).toFixed(2))
        };
    }
};
