
import { Refrigerant, CalcMode } from '../types';
import { PT_TABLES } from '../data/pt_tables';

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
    warning?: string;
}

export const CALCULATOR_REFERENCE_RANGES: Record<CalcMode, { min: number; max: number; label: string }> = {
    Superaquecimento: { min: 7, max: 12, label: 'Faixa ideal: 7.0K a 12.0K' },
    'Sub-resfriamento': { min: 4, max: 8, label: 'Faixa ideal: 4.0K a 8.0K' }
};

const getSortedPtTablePoints = (fluid: Refrigerant): PtTablePoint[] => {
    const table = PT_TABLES[fluid];
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
const formatTemperature = (value: number) => `${value.toFixed(1)}°C`;
const formatKelvin = (value: number) => `${value.toFixed(1)}K`;

const getReferenceRange = (mode: CalcMode) => CALCULATOR_REFERENCE_RANGES[mode];

const classifyCalculation = (resultKelvin: number, mode: CalcMode): 'BAIXO' | 'IDEAL' | 'ALTO' => {
    const range = getReferenceRange(mode);
    if (resultKelvin < range.min) return 'BAIXO';
    if (resultKelvin > range.max) return 'ALTO';
    return 'IDEAL';
};

const getSaturationLookup = (fluid: Refrigerant, pressure: number): PtLookupResult => {
    if (!Number.isFinite(pressure)) {
        return {
            satTemp: null,
            sourceLabel: 'Tabela PT local',
            warning: 'Pressao invalida. Digite um valor numerico para localizar a Tsat.'
        };
    }

    const points = getSortedPtTablePoints(fluid);
    if (points.length === 0) {
        return {
            satTemp: null,
            sourceLabel: 'Tabela PT local',
            warning: `Tabela PT local indisponivel para ${fluid}.`
        };
    }

    if (pressure < points[0].pressure || pressure > points[points.length - 1].pressure) {
        return {
            satTemp: null,
            sourceLabel: 'Tabela PT local',
            warning: `Pressao fora da faixa da tabela PT local para ${fluid}. Confira o fluido e o manometro antes de agir.`
        };
    }

    const exactPoint = points.find(point => Math.abs(point.pressure - pressure) < 0.0001);
    if (exactPoint) {
        return {
            satTemp: exactPoint.temp,
            sourceLabel: `Tabela PT local: ponto exato em ${formatPressure(exactPoint.pressure)} PSI`
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
                sourceLabel: `Tabela PT local: ponto repetido em ${formatPressure(lower.pressure)} PSI`
            };
        }

        const ratio = (pressure - lower.pressure) / span;
        const interpolatedTemp = Number((lower.temp + ((upper.temp - lower.temp) * ratio)).toFixed(1));

        return {
            satTemp: interpolatedTemp,
            sourceLabel: `Interpolado entre ${formatPressure(lower.pressure)} PSI (${formatTemperature(lower.temp)}) e ${formatPressure(upper.pressure)} PSI (${formatTemperature(upper.temp)})`
        };
    }

    return {
        satTemp: null,
        sourceLabel: 'Tabela PT local',
        warning: `Nao foi possivel localizar a Tsat local para ${fluid} em ${pressure} PSI.`
    };
};

/**
 * Lógica centralizada para evitar erros em produção.
 * Estas funções são puras: mesma entrada sempre gera mesma saída.
 */

export const logicService = {
    // Busca a temperatura de saturação local e interpola quando a pressão cair entre dois pontos conhecidos.
    getSaturationTemp: (fluid: Refrigerant, pressure: number): number | null => {
        return getSaturationLookup(fluid, pressure).satTemp;
    },

    getCalculatorAudit: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode): CalculatorAudit => {
        const pressureVal = parseNumericInput(press);
        const tempMeasured = parseNumericInput(temp);
        const modeShortLabel = mode === 'Superaquecimento' ? 'SH' : 'SC';
        const directionLabel = mode === 'Superaquecimento'
            ? 'SH = temperatura do tubo de succao - Tsat'
            : 'SC = Tsat - temperatura da linha de liquido';
        const reference = getReferenceRange(mode);
        const baseAudit: Omit<CalculatorAudit, 'ready' | 'sourceLabel' | 'tsatLabel' | 'resultLabel' | 'satTemp' | 'resultKelvin'> = {
            modeShortLabel,
            directionLabel,
            referenceLabel: reference.label,
            classificationLabel: 'Classificacao local: aguardando dados',
            classification: null
        };

        if (!Number.isFinite(pressureVal) || !Number.isFinite(tempMeasured)) {
            return {
                ...baseAudit,
                ready: false,
                sourceLabel: 'Tabela PT local',
                tsatLabel: 'Tsat = --',
                resultLabel: `${modeShortLabel} = --`,
                satTemp: null,
                resultKelvin: null,
                warning: 'Preencha pressao e temperatura validas para exibir a conta auditavel.'
            };
        }

        const lookup = getSaturationLookup(fluid, pressureVal);
        if (lookup.satTemp === null) {
            return {
                ...baseAudit,
                ready: false,
                sourceLabel: lookup.sourceLabel,
                tsatLabel: 'Tsat = --',
                resultLabel: `${modeShortLabel} = --`,
                satTemp: null,
                resultKelvin: null,
                warning: lookup.warning
            };
        }

        const resultKelvin = Number((mode === 'Superaquecimento'
            ? tempMeasured - lookup.satTemp
            : lookup.satTemp - tempMeasured).toFixed(1));
        const classification = classifyCalculation(resultKelvin, mode);
        const resultLabel = mode === 'Superaquecimento'
            ? `SH = ${formatTemperature(tempMeasured)} - ${formatTemperature(lookup.satTemp)} = ${formatKelvin(resultKelvin)}`
            : `SC = ${formatTemperature(lookup.satTemp)} - ${formatTemperature(tempMeasured)} = ${formatKelvin(resultKelvin)}`;

        return {
            ...baseAudit,
            ready: true,
            sourceLabel: lookup.sourceLabel,
            tsatLabel: `Tsat = ${formatTemperature(lookup.satTemp)}`,
            resultLabel,
            satTemp: lookup.satTemp,
            resultKelvin,
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
            ? `CÁLCULO LOCAL REALIZADO (USE ESTE VALOR): ${audit.tsatLabel}. ${audit.resultLabel}. ${audit.classificationLabel}. Fonte: ${audit.sourceLabel}.`
            : `AVISO: ${audit.warning || `Nao foi possivel calcular localmente a temperatura de saturacao para ${fluid} a ${press} PSI.`} Realize o calculo com base em seu conhecimento.`;

        return `
        COMANDO: CALCULAR ${mode === 'Superaquecimento' ? 'Superaquecimento (SH)' : 'Sub-resfriamento (SC)'}.
        DADOS: Fluido ${fluid}, Pressão ${press} PSI, Temperatura ${temp} °C.
        
        ${calculationContext}

        CONTEXTO DE REFERÊNCIA:
        - Faixa IDEAL para Superaquecimento (SH): ${shRange.min}K a ${shRange.max}K (T.Sucção - T.Evaporação).
        - Faixa IDEAL para Sub-resfriamento (SC): ${scRange.min}K a ${scRange.max}K (T.Condensação - T.Linha de Líquido).
        
        INSTRUÇÃO DE SAÍDA:
        NÃO use formatação Markdown ou símbolos especiais.
        1. Apresente o resultado final do cálculo em Kelvin (K). Se o cálculo foi fornecido acima, use-o obrigatoriamente.
        2. Classifique o resultado como ALTO, IDEAL ou BAIXO, comparando com a faixa de referência.
        3. Adicione a AÇÃO RECOMENDADA prática (ex: "Adicionar fluido", "Recolher fluido", "Verificar/Limpar condensador", "Abrir/Fechar VET").
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
