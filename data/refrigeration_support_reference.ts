import { PT_TABLES, PtCurveKey } from './pt_tables';

export type SupportedRefrigerant = 'R-22' | 'R-404A';

export interface TypicalPressureWindow {
    refrigerant: SupportedRefrigerant;
    evaporationC: { min: number; max: number };
    suctionPsig: { min: number; max: number };
    ambientC?: number;
    condensingC?: { min: number; max: number };
    dischargePsig?: { min: number; max: number };
}

const TYPICAL_EVAPORATION_C = { min: -7, max: -5 };
const TYPICAL_CONDENSING_APPROACH_K = { min: 10, max: 15 };

const curveFor = (refrigerant: SupportedRefrigerant, side: 'suction' | 'discharge'): PtCurveKey => {
    if (refrigerant === 'R-404A') return side === 'suction' ? 'dew' : 'bubble';
    return 'single';
};

const pressureAtTemperature = (
    refrigerant: SupportedRefrigerant,
    temperatureC: number,
    curve: PtCurveKey
): number | null => {
    const table = PT_TABLES[refrigerant]?.[curve] || PT_TABLES[refrigerant]?.single;
    if (!table) return null;

    const points = Object.entries(table)
        .map(([pressure, temperature]) => ({ pressure: Number(pressure), temperature }))
        .filter(point => Number.isFinite(point.pressure) && Number.isFinite(point.temperature))
        .sort((a, b) => a.temperature - b.temperature);

    if (!points.length || temperatureC < points[0].temperature || temperatureC > points[points.length - 1].temperature) {
        return null;
    }

    const exact = points.find(point => Math.abs(point.temperature - temperatureC) < 0.0001);
    if (exact) return exact.pressure;

    for (let index = 1; index < points.length; index += 1) {
        const lower = points[index - 1];
        const upper = points[index];
        if (temperatureC < lower.temperature || temperatureC > upper.temperature) continue;

        const temperatureSpan = upper.temperature - lower.temperature;
        if (temperatureSpan === 0) return lower.pressure;

        const ratio = (temperatureC - lower.temperature) / temperatureSpan;
        return lower.pressure + ((upper.pressure - lower.pressure) * ratio);
    }

    return null;
};

const roundedRange = (first: number | null, second: number | null) => {
    if (first === null || second === null) return null;
    return {
        min: Math.round(Math.min(first, second)),
        max: Math.round(Math.max(first, second))
    };
};

export const getTypicalPressureWindow = (
    refrigerant: SupportedRefrigerant,
    ambientC?: number
): TypicalPressureWindow | null => {
    const suctionPsig = roundedRange(
        pressureAtTemperature(refrigerant, TYPICAL_EVAPORATION_C.min, curveFor(refrigerant, 'suction')),
        pressureAtTemperature(refrigerant, TYPICAL_EVAPORATION_C.max, curveFor(refrigerant, 'suction'))
    );
    if (!suctionPsig) return null;

    const base: TypicalPressureWindow = {
        refrigerant,
        evaporationC: TYPICAL_EVAPORATION_C,
        suctionPsig
    };

    if (ambientC === undefined || !Number.isFinite(ambientC)) return base;

    const condensingC = {
        min: ambientC + TYPICAL_CONDENSING_APPROACH_K.min,
        max: ambientC + TYPICAL_CONDENSING_APPROACH_K.max
    };
    const dischargePsig = roundedRange(
        pressureAtTemperature(refrigerant, condensingC.min, curveFor(refrigerant, 'discharge')),
        pressureAtTemperature(refrigerant, condensingC.max, curveFor(refrigerant, 'discharge'))
    );

    return {
        ...base,
        ambientC,
        condensingC,
        ...(dischargePsig ? { dischargePsig } : {})
    };
};

export const REFRIGERATION_SUPPORT_REFERENCE_CONTEXT = `

[REFERÊNCIA FRIGORÍFICA ESTRUTURADA - TANQUES ORDEMILK]
EVIDÊNCIA: LIMITE OFICIAL gera alerta firme somente com modelo/ponto/condição compatíveis; FAIXA TÍPICA pede confirmação e nunca condena componente; HIPÓTESE DIAGNÓSTICA sempre exige próximo teste.
LIMITES: Maneurop MT/MTZ = 12 partidas/h (6 com soft-starter), descarga máxima 130°C e desequilíbrio entre fases máximo 2%. R-404A é carregado em fase líquida; usar dew no Sup.Aque e bubble no Sub.Res. Óleo: MT mineral 160P; MTZ poliéster 175PZ, sempre confirmando placa/modelo.
TRIAGEM: sob carga estabilizada, evaporação -7°C a -5°C e condensação aproximadamente 10K a 15K acima do ar de entrada são referências, não projeto. Sup.Aque 7K a 12K é na saída do evaporador/bulbo; na entrada do compressor é outra medição. Taxa de compressão 3,2 a 5,5 é apenas triagem com pressões absolutas.
TANQUE PRIMEIRO: confirme modelo/capacidade, volume, temperaturas inicial/atual, tempo, ambiente, agitador, pré-resfriador e circuitos ativos. Em tanque multicircuito, compare circuitos sob a mesma carga. Bolhas no visor não provam falta de fluido. Agitador parado causa primeiro perda de troca, estratificação e congelamento localizado, não retorno automático. Combine descarga, taxa de compressão, corrente, Sup.Aque e Sub.Res antes de condenar compressor.
`;

const REFRIGERATION_CLUES = [
    'refriger', 'r404', 'r-404', 'r22', 'r-22', 'pressao', 'psi', 'psig', 'bar',
    'superaquec', 'sub-res', 'subres', 'condensador', 'evaporador', 'valvula de expansao',
    'filtro secador', 'visor', 'gas', 'fluido', 'sucção', 'succao', 'descarga', 'leite', 'agitador'
];

const STRONG_REFRIGERATION_CLUES = REFRIGERATION_CLUES.filter(clue => !['leite', 'agitador'].includes(clue));

export const getRefrigerationReferenceContext = (
    userPrompt: string,
    mode: 'AUTO' | 'REF' | 'ELEC'
) => {
    if (mode === 'REF') return REFRIGERATION_SUPPORT_REFERENCE_CONTEXT;

    const normalized = userPrompt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const clues = mode === 'ELEC' ? STRONG_REFRIGERATION_CLUES : REFRIGERATION_CLUES;
    return clues.some(clue => normalized.includes(clue.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
        ? REFRIGERATION_SUPPORT_REFERENCE_CONTEXT
        : '';
};
