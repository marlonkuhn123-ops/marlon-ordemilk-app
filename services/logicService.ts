
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
    // Nomes por extenso (nao mais SH/SC): tecnicos de campo confundem as siglas.
    modeShortLabel: 'Sup.Aque' | 'Sub.Res';
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

// Fluido de mistura (zeotropico) tem duas curvas: dew e bubble. Vale para R-404A e R-407C.
// Em vez de citar o fluido na mao, olhamos se a tabela dele tem as duas curvas.
const temCurvasDeGlide = (fluid: Refrigerant) =>
    Boolean(PT_TABLES[fluid]?.dew && PT_TABLES[fluid]?.bubble);

const getCurveKeyForMode = (fluid: Refrigerant, mode: CalcMode): PtCurveKey => {
    if (temCurvasDeGlide(fluid)) {
        return mode === 'Superaquecimento' ? 'dew' : 'bubble';
    }

    return 'single';
};

const getCurveLabel = (fluid: Refrigerant, curveKey: PtCurveKey): string => {
    const nome = fluid.replace('-', '');

    if (curveKey === 'dew') {
        return `${nome} dew/vapor - correto para Sup.Aque`;
    }

    if (curveKey === 'bubble') {
        return `${nome} bubble/líquido - correto para Sub.Res`;
    }

    return `${fluid} saturação única`;
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

// Conduta completa: o que fazer, em que ordem e com que numero. Sem SH/SC (tecnicos confundem
// as siglas) e sempre terminando com a observacao do fluido usado, porque a acao muda entre
// R-22, R-404A e R-407C.
const getFluidNote = (fluid: Refrigerant): string => {
    if (fluid === Refrigerant.R407C) {
        return ' No R-407C carregue sempre em fase líquida e, se houve vazamento, NÃO complete a carga: o que vazou muda a composição da mistura. Recolha o que restou e carregue tudo de novo com fluido virgem. Lembre também que este fluido tem glide de cerca de 6 K, então medir na curva errada erra a conta em vários kelvin.';
    }

    if (fluid === Refrigerant.R404A) {
        return ' No R-404A carregue sempre em fase líquida: tirar da garrafa em vapor separa a mistura e falseia as pressões depois. Se o compressor for da família MTZ, o óleo é poliéster e absorve umidade rápido, então não deixe o circuito aberto.';
    }

    return ' No R-22 a leitura usa uma curva única de saturação e a carga pode ser completada normalmente. Se o compressor for da família MT, o óleo é mineral: não misture com poliéster em nenhuma hipótese.';
};

const getRecommendedAction = (
    mode: CalcMode,
    classification: 'BAIXO' | 'IDEAL' | 'ALTO',
    fluid: Refrigerant
): string => {
    const fluidNote = getFluidNote(fluid);

    if (mode === 'Superaquecimento') {
        if (classification === 'BAIXO') {
            return 'Superaquecimento baixo significa líquido voltando para o compressor, e isso quebra compressor. Comece pelo bulbo da válvula de expansão: ele precisa estar bem preso na saída do evaporador, com contato limpo e isolado. Bulbo solto, sujo ou sem isolamento é a causa mais comum, porque faz a válvula abrir mais do que devia. Confirme também se o agitador está rodando, já que sem agitação a troca de calor cai e o evaporador não consegue evaporar todo o líquido. Se o bulbo e a agitação estiverem corretos, feche a válvula de expansão um quarto de volta por vez e espere de 10 a 15 minutos antes de medir de novo, nunca mais de meia volta sem reavaliar. Se a linha de sucção estiver suando ou com gelo até o compressor, desligue e não insista com ele rodando, para não dar golpe de líquido.' + fluidNote;
        }
        if (classification === 'ALTO') {
            return 'Superaquecimento alto significa evaporador recebendo pouco líquido, com o compressor trabalhando quente. O próximo passo é medir o sub-resfriamento, porque é ele que separa as duas causas possíveis. Se o sub-resfriamento também estiver baixo, o problema é falta de fluido: procure vazamento antes de completar a carga, olhando manchas de óleo nas conexões, nas soldas, no evaporador e no condensador, e veja se o visor de líquido apresenta bolhas constantes. Se o sub-resfriamento estiver normal ou alto, o problema é restrição e não falta de gás: sinta a diferença de temperatura entre a entrada e a saída do filtro secador, confira a válvula solenoide e veja se a válvula de expansão não está fechada demais ou com a tela de entrada entupida. Só abra a válvula de expansão depois de descartar vazamento e restrição, um quarto de volta por vez, esperando de 10 a 15 minutos entre cada ajuste.' + fluidNote;
        }
        return 'Está dentro da faixa ideal, então não mexa na válvula de expansão por causa deste número. Antes de dar o equipamento como bom, feche o conjunto: meça também o sub-resfriamento, olhe o visor de líquido, confira a pressão de alta com o condensador limpo e os ventiladores girando, e acompanhe se o leite está descendo de temperatura no tempo esperado. Um superaquecimento bom com sub-resfriamento ruim ainda é sistema com problema, e o contrário também vale.' + fluidNote;
    }

    if (classification === 'BAIXO') {
        return 'Sub-resfriamento baixo significa que não há reserva de líquido chegando na válvula de expansão, e provavelmente está passando gás junto com o líquido. Antes de completar carga, procure vazamento: manchas de óleo nas conexões, soldas, evaporador e condensador, e visor de líquido com bolhas constantes. Confirme também se não existe restrição antes do ponto de medição, porque queda de pressão na linha de líquido ou no filtro secador derruba o sub-resfriamento mesmo sem faltar fluido. Se confirmar que falta fluido, complete aos poucos e acompanhe o sub-resfriamento e o superaquecimento juntos, não apenas a pressão do manômetro. Valor muito baixo, perto de zero, trate como urgente: o compressor está sem coluna de líquido garantida.' + fluidNote;
    }
    if (classification === 'ALTO') {
        return 'Sub-resfriamento alto significa líquido demais acumulado no condensador, o que empurra a pressão de alta para cima e força o compressor. Antes de retirar fluido, verifique tudo que rejeita calor: lave a colmeia do condensador se houver poeira, barro ou teia, confirme se todos os ventiladores estão girando na rotação e no sentido corretos, e veja se não há recirculação de ar quente ou obstrução perto do equipamento. Confirme também se não entrou ar no sistema em alguma intervenção feita sem vácuo adequado, porque gás não condensável eleva a pressão de alta do mesmo jeito e é confundido com excesso de carga. Só retire fluido depois de descartar condensador sujo, ventilador fraco e ar no sistema, e retire pouco de cada vez acompanhando a pressão de alta e o superaquecimento.' + fluidNote;
    }
    return 'Está dentro da faixa ideal, então não adicione nem retire fluido por causa deste número. Para fechar o diagnóstico, meça também o superaquecimento, confira o visor de líquido, a temperatura atual do leite e o tempo que o tanque está levando para resfriar. Sub-resfriamento bom com superaquecimento alto ainda indica restrição no caminho do líquido, e vale investigar o filtro secador e a válvula de expansão antes de liberar o equipamento.' + fluidNote;
};

const getSaturationLookup = (fluid: Refrigerant, pressure: number, mode: CalcMode): PtLookupResult => {
    const curveKey = getCurveKeyForMode(fluid, mode);
    const curveLabel = getCurveLabel(fluid, curveKey);

    if (!Number.isFinite(pressure)) {
        return {
            satTemp: null,
            sourceLabel: PT_TABLE_SOURCE,
            curveLabel,
            warning: 'Pressão inválida. Digite um valor numérico para localizar a Tsat.'
        };
    }

    const points = getSortedPtTablePoints(fluid, curveKey);
    if (points.length === 0) {
        return {
            satTemp: null,
            sourceLabel: PT_TABLE_SOURCE,
            curveLabel,
            warning: `Tabela PT local indisponível para ${fluid} (${curveLabel}).`
        };
    }

    if (pressure < points[0].pressure || pressure > points[points.length - 1].pressure) {
        return {
            satTemp: null,
            sourceLabel: `${PT_TABLE_SOURCE}: ${curveLabel}`,
            curveLabel,
            warning: `Pressão fora da faixa da tabela PT local para ${fluid}. Confira o fluido e o manômetro antes de agir.`
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
        warning: `Nao foi possível localizar a Tsat local para ${fluid} em ${pressure} PSI.`
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
        const modeShortLabel: 'Sup.Aque' | 'Sub.Res' = mode === 'Superaquecimento' ? 'Sup.Aque' : 'Sub.Res';
        const directionLabel = mode === 'Superaquecimento'
            ? 'Sup.Aque = temperatura do tubo de sucção - Tsat'
            : 'Sub.Res = Tsat - temperatura da linha de líquido';
        const reference = getReferenceRange(mode);
        const curveLabel = getCurveLabel(fluid, getCurveKeyForMode(fluid, mode));
        const baseAudit: Omit<CalculatorAudit, 'ready' | 'sourceLabel' | 'tsatLabel' | 'resultLabel' | 'satTemp' | 'resultKelvin'> = {
            modeShortLabel,
            directionLabel,
            referenceLabel: reference.label,
            classificationLabel: 'Classificação local: aguardando dados',
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
                warning: 'Preencha pressão e temperatura válidas para exibir a conta auditável.'
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
        const actionLabel = getRecommendedAction(mode, classification, fluid);
        const resultLabel = mode === 'Superaquecimento'
            ? `${modeShortLabel} = ${formatTemperature(tempMeasured)} - ${formatSubtractedTemperature(lookup.satTemp)} = ${formatKelvin(resultKelvin)}`
            : `${modeShortLabel} = ${formatTemperature(lookup.satTemp)} - ${formatSubtractedTemperature(tempMeasured)} = ${formatKelvin(resultKelvin)}`;

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
            classificationLabel: `Classificação local: ${classification}`
        };
    },

    // Formata o prompt da calculadora (Coração do diagnóstico de gás)
    formatCalculatorPrompt: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode): string => {
        const audit = logicService.getCalculatorAudit(fluid, press, temp, mode);
        const shRange = getReferenceRange('Superaquecimento');
        const scRange = getReferenceRange('Sub-resfriamento');

        // Se tivermos dados suficientes, passamos o cálculo fechado para a IA já processado.
        const calculationContext = audit.ready
            ? `CÁLCULO LOCAL REALIZADO (USE ESTE VALOR): ${audit.tsatLabel}. ${audit.resultLabel}. ${audit.classificationLabel}. Curva usada: ${audit.curveLabel}. Conduta local: ${audit.actionLabel}. Fonte: ${audit.sourceLabel}.`
            : `AVISO: ${audit.warning || `Nao foi possível calcular localmente a temperatura de saturação para ${fluid} a ${press} PSI.`} Realize o cálculo com base em seu conhecimento.`;

        return `
        COMANDO: CALCULAR ${mode === 'Superaquecimento' ? 'Superaquecimento (SH)' : 'Sub-resfriamento (SC)'}.
        DADOS: Fluido ${fluid}, Pressão ${press} PSIG/manifold, Temperatura ${temp} C.
        
        ${calculationContext}

        CONTEXTO DE REFERÊNCIA:
        - Faixa IDEAL para Sup.Aque (superaquecimento): ${shRange.min}K a ${shRange.max}K (T.Sucção - T.Evaporação).
        - Faixa IDEAL para Sub.Res (sub-resfriamento): ${scRange.min}K a ${scRange.max}K (T.Condensação - T.Linha de Líquido).
        - Para R404A, use dew/vapor no Sup.Aque e bubble/líquido no Sub.Res. Não use curva única para blend.
        - A pressão informada pelo técnico é PSIG/gauge de manifold, não pressão absoluta.
        
        INSTRUÇÃO DE SAÍDA:
        NÃO use formatação Markdown ou símbolos especiais.
        1. Apresente o resultado final do cálculo em Kelvin (K). Se o cálculo foi fornecido acima, use-o obrigatoriamente.
        2. Classifique o resultado como ALTO, IDEAL ou BAIXO, comparando com a faixa de referência.
        3. Use a conduta local como trilho técnico. Nao recomende adicionar fluido, recolher fluido, abrir a válvula de expansão ou fechar a válvula de expansão sem antes citar a confirmação necessária.
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
        
        PARÂMETROS: Sup.Aque: ${data.params.sh}K, Sub.Res: ${data.params.sc}K, Temp: ${data.params.temp}°C.
        REGRA DE ESCRITA: no documento, escreva sempre "Sup.Aque" e "Sub.Res". Nunca use as siglas "SH" ou "SC".
        
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
