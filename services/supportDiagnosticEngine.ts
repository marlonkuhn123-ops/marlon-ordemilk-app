import { SupportDiagnosticContext, SupportMode } from '../types';

type LevelStatus = 'baixo' | 'ideal' | 'alto';

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

export interface SupportCaseAnalysis {
    shSc?: ShScDiagnostic;
    electrical?: ElectricalDecision;
}

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

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
        /\bsh\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsuper\s*aquecimento\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsuperaquecimento\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsh\s*(?:=|:|-)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsuper\s*aquecimento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsuperaquecimento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i
    ]);

const readScKelvin = (text: string) =>
    readMeasurement(text, [
        /\bsc\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsub\s*-?\s*resfriamento\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsubresfriamento\b[^\n]*?=\s*.*?=\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*k\b/i,
        /\bsc\s*(?:=|:|-)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsub\s*-?\s*resfriamento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i,
        /\bsubresfriamento\s*(?:=|:|-|de|em|com|esta)?\s*(-?\d{1,3}(?:[.,]\d{1,2})?)\s*(?:k|kelvin)?\b/i
    ]);

const detectRefrigerant = (prompt: string, context: SupportDiagnosticContext) => {
    const combined = normalize([prompt, context.refrigerant].filter(Boolean).join(' '));
    if (combined.includes('404')) return 'R404A';
    if (combined.includes('22')) return 'R22';
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

    if (refrigerant === 'R404A') {
        guardrails.push('R404A: usar dew/vapor para SH e bubble/liquido para SC.');
    }
    if (shKelvin !== undefined) facts.push(`SH detectado: ${formatNumber(shKelvin)} (${shStatus}).`);
    if (scKelvin !== undefined) facts.push(`SC detectado: ${formatNumber(scKelvin)} (${scStatus}).`);

    let pattern = 'medicao parcial de SH/SC';
    let hypothesis = 'As medidas de SH/SC indicam que o ciclo precisa ser conferido antes de qualquer ajuste.';
    let questions = [
        'Quais sao as pressoes de succao e descarga no manifold, em psi ou bar?',
        'O visor de liquido tem bolhas ou ha sinal de oleo/vazamento nas conexoes?'
    ];
    let action = 'Nao ajuste VET nem carga ainda; confirme pressoes, visor e estabilidade do sistema primeiro.';

    if (shStatus === 'alto' && scStatus === 'baixo') {
        pattern = 'SH alto + SC baixo';
        hypothesis = 'SH alto com SC baixo aponta primeiro para falta de fluido, vazamento, carga incompleta ou flash gas; nao e padrao para abrir VET primeiro.';
        questions = [
            'O visor de liquido esta com bolhas e existe mancha de oleo/vazamento em conexoes, evaporador ou condensador?',
            'Quais sao as pressoes de succao e descarga com o compressor estabilizado?'
        ];
        action = 'Nao abra a VET agora; procure vazamento/bolhas e confirme carga antes de adicionar fluido com criterio.';
        guardrails.push('Proibido orientar abrir VET como primeira acao neste padrao.');
    } else if (shStatus === 'alto' && (scStatus === 'ideal' || scStatus === 'alto')) {
        pattern = scStatus === 'alto' ? 'SH alto + SC alto' : 'SH alto + SC ideal';
        hypothesis = 'SH alto com SC normal/alto indica evaporador subalimentado por restricao, filtro secador, VET, bulbo/igualador ou coluna liquida com perda.';
        questions = [
            'Ha queda de temperatura antes/depois do filtro secador ou sinal de congelamento na linha?',
            'O bulbo da VET esta bem fixado/isolado e o igualador externo esta conectado?'
        ];
        action = 'Confira restricao, filtro secador e montagem da VET antes de mexer na carga.';
    } else if (shStatus === 'baixo') {
        pattern = scStatus === 'alto' ? 'SH baixo + SC alto' : 'SH baixo';
        hypothesis = 'SH baixo indica risco de retorno de liquido ao compressor, possivel excesso de alimentacao, baixa carga termica ou VET aberta demais.';
        questions = [
            'O retorno do compressor esta suando/congelando ou ha ruido de liquido na succao?',
            'A carga termica esta baixa, com leite ja frio ou evaporador muito frio?'
        ];
        action = 'Evite manter o compressor forcado; confirme retorno de liquido antes de qualquer novo teste.';
    } else if (scStatus === 'alto') {
        pattern = 'SC alto';
        hypothesis = 'SC alto sugere excesso de fluido, condensacao elevada, ar no sistema ou restricao depois do condensador.';
        questions = [
            'A pressao de descarga esta alta e o condensador esta limpo com ventilacao correta?',
            'Foi adicionada carga recentemente ou houve manutencao no circuito?'
        ];
        action = 'Verifique condensador/ventiladores e historico de carga antes de retirar fluido.';
    } else if (scStatus === 'baixo') {
        pattern = 'SC baixo';
        hypothesis = 'SC baixo sugere falta de liquido na linha, carga baixa, flash gas ou alimentacao instavel da VET.';
        questions = [
            'O visor de liquido apresenta bolhas depois de estabilizar?',
            'Existe vazamento/oleo em conexoes ou queda de pressao na linha de liquido?'
        ];
        action = 'Confirme bolhas, vazamento e pressoes antes de completar carga.';
    } else if (shStatus === 'ideal' && scStatus === 'ideal') {
        pattern = 'SH e SC na faixa ideal';
        hypothesis = 'SH e SC estao em faixa de referencia; a falha pode estar fora de carga de fluido, como troca termica, comando, sensor ou condicao operacional.';
        questions = [
            'Qual sintoma continua acontecendo mesmo com SH/SC dentro da faixa?',
            'A temperatura do leite esta caindo no tempo esperado?'
        ];
        action = 'Nao altere carga nem VET agora; procure causa em troca termica, comando ou sensor.';
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

const detectVoltage = (combinedText: string) => {
    if (combinedText.includes('380')) return '380 V trifasico';
    if (combinedText.includes('220') && includesAny(combinedText, ['mono', 'monofasico', '1~'])) return '220 V monofasico';
    if (combinedText.includes('220')) return '220 V trifasico/confirmar fases';
    return 'tensao nao confirmada';
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
    if (compressorNumber === 1) return 'saida YB -> rele RL15 -> contatora K1';
    if (compressorNumber === 2) return 'saida YC -> rele RL16 -> contatora K2';
    if (compressorNumber === 3) return 'saida YD -> rele RL17 -> contatora K3';
    if (compressorNumber === 4) return 'saida dedicada do compressor 04 -> rele RL31 -> contatora K4';
    if (compressorNumber === 5) return 'referencias dedicadas do compressor 05 no esquema PE 5 comp -> contatora K5';
    return 'saidas YB/YC/YD e reles RL15/RL16/RL17/RL31 -> contatoras dos compressores';
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
            reference = 'PDF ativo: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFASICO 220V.';
        } else if ((capacity || 0) >= 18000 && voltage.includes('380') && (compressorCount === 4 || compressorCount === undefined)) {
            reference = 'PDF ativo: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFASICO 380V.';
        } else if (voltage.includes('380') && compressorCount === 5) {
            reference = 'PDF ativo: PE - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFASICO 380V - V1.0.';
        } else if (hasCip) {
            reference = 'Base local: painel CIP/limpeza automatica com CLP Panasonic, fonte 24Vcc e reles RL.';
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
            reference: 'Base local: MT50 trifasico 380V, bornes RU1/SU1/TU1 para resfriador e RA/NA para agitador.',
            outputPath: 'controlador Full Gauge -> bornes RU1/SU1/TU1 -> contatora/resfriador',
            compressorNumber,
            isLargeTank: false
        };
    }

    return {
        family: `Tanque menor ou familia ainda nao confirmada, ${voltage}.`,
        reference: 'Base local: Ageon MT-516CVT/Full Gauge conforme familia; confirmar modelo antes de misturar esquemas.',
        outputPath: 'Ageon borne U ou Full Gauge RU1/SU1/TU1 -> circuito de comando -> contatora',
        compressorNumber,
        isLargeTank: false
    };
};

const isElectricalSignal = (text: string, mode: SupportMode) =>
    mode === 'ELEC' ||
    includesAny(text, [
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
        'nao liga',
        'nao parte',
        'nao aciona',
        'metralhando',
        'choque'
    ]);

const buildElectricalDecision = (prompt: string, mode: SupportMode, context: SupportDiagnosticContext): ElectricalDecision | undefined => {
    const text = normalize(prompt);
    if (!isElectricalSignal(text, mode)) return undefined;

    const family = detectElectricalFamily(prompt, context);
    const compressorNumber = family.compressorNumber;
    const compressorLabel = compressorNumber ? `compressor ${String(compressorNumber).padStart(2, '0')}` : 'compressor';
    const dmLabel = compressorNumber ? `DM${compressorNumber}` : 'DM do compressor';
    const kLabel = compressorNumber ? `K${compressorNumber}` : 'contatora do compressor';

    let symptom = 'falha eletrica/comando';
    let hypothesis = 'A falha mais provavel esta na cadeia eletrica de comando, permissivos ou protecao.';
    let questions = [
        'Qual tensao foi medida na entrada do painel e na alimentacao de comando?',
        'A IHM/CLP esta ligado e existe algum alarme de falta de fase, sobrecarga ou pressostato?'
    ];
    let action = 'Siga a sequencia segura: alimentacao, protecoes, permissivos, saida de comando e bobina da contatora.';
    let decisionTree = [
        'Seguranca: painel energizado so deve ser medido por tecnico habilitado, com EPI e metodo seguro.',
        `Familia aplicada: ${family.family}`,
        `Referencia local: ${family.reference}`,
        'Nao misturar esquema 220V com 380V nem familia de 4 compressores com 5 compressores.'
    ];

    if (includesAny(text, ['contatora nao fecha', 'contator nao fecha', 'contatora nao aciona', 'contator nao aciona', 'nao fecha contatora'])) {
        symptom = 'contatora nao fecha';
        hypothesis = 'A contatora nao fecha por bobina sem comando, permissivo aberto ou protecao em serie aberta; se A1/A2 tiver tensao nominal e nao fechar, a propria contatora/bobina vira suspeita.';
        questions = [
            'Quando pede partida, ha tensao nominal em A1/A2 da bobina da contatora?',
            'DM/rele termico/RFF/pressostato/botoeira de emergencia estao fechados e sem alarme?'
        ];
        action = `Confira primeiro protecoes e permissivos; depois meca A1/A2 e siga ${family.outputPath}.`;
        decisionTree = decisionTree.concat([
            'Se A1/A2 nao tem tensao: procurar aberto antes da bobina, como RFF, DM auxiliar, pressostato, emergencia, saida CLP/controlador ou rele de interface.',
            'Se A1/A2 tem tensao nominal e nao fecha: bobina errada/aberta/queimada, contatora travada ou defeito mecanico.',
            'Se fecha e cai/metralha: queda de tensao na partida, borne frouxo, cabo fino/oxidado ou bobina com tensao incorreta.',
            'Se fecha mas motor nao parte: ir para lado de forca, contatos principais, DM, fases, soft-starter e compressor.'
        ]);
    } else if (includesAny(text, ['metralhando', 'bate e solta', 'arma e desarma', 'fica batendo'])) {
        symptom = 'contatora metralhando';
        hypothesis = 'Contatora metralhando aponta para queda de tensao na partida, mau contato, cabo subdimensionado/oxidado ou bobina com tensao incorreta.';
        questions = [
            'Quanto cai a tensao em A1/A2 exatamente no momento da partida?',
            'Os bornes de alimentacao/comando estao apertados e sem oxidacao?'
        ];
        action = 'Meça A1/A2 durante a partida, nao apenas em repouso; procure queda forte de tensao antes de condenar a contatora.';
        decisionTree = decisionTree.concat([
            'Tensao nominal parada nao basta: medir durante a tentativa de partida.',
            'Se cair muito: revisar rede da fazenda, bitola, emendas, bornes, RFF e alimentacao de comando.',
            'Se tensao se mantem nominal: conferir bobina, nucleo da contatora e carga mecanica/eletrica na partida.'
        ]);
    } else if (includesAny(text, ['nenhum compressor', 'compressores nao ligam', 'compressor nenhum liga'])) {
        symptom = 'nenhum compressor liga';
        hypothesis = 'Quando nenhum compressor liga, a prioridade e a cadeia comum: chave geral, disjuntor de comando, RFF/falta de fase, emergencia, permissivo automatico/manual e CLP/controlador.';
        questions = [
            'Ha alarme de falta de fase/RFF, emergencia ou disjuntor de comando aberto?',
            'A IHM/CLP mostra demanda de refrigeracao e alguma saida de compressor aciona?'
        ];
        action = 'Verifique primeiro o comum a todos: DG/DC1, RFF, emergencia e permissivo; depois avance para saidas individuais.';
        decisionTree = decisionTree.concat([
            'Se todos pararam, nao comece por uma contatora individual.',
            'Confirmar tensao de entrada, disjuntor de comando, fonte 24Vcc, RFF e emergencia.',
            'Depois confirmar demanda na IHM/CLP/controlador e saidas de comando.'
        ]);
    } else if (compressorNumber && includesAny(text, ['nao liga', 'nao parte', 'nao aciona', 'nao fecha'])) {
        symptom = `${compressorLabel} nao liga`;
        hypothesis = `${compressorLabel} parado aponta para ${dmLabel} desarmado, ${kLabel} sem energizacao, saida/permissivo sem comando, pressostato aberto ou alarme eletrico dedicado.`;
        questions = [
            `O ${dmLabel} esta armado e sem alarme dedicado na IHM/CIP?`,
            `Quando pede partida, ${kLabel} recebe tensao na bobina e a rota ${family.outputPath} aciona?`
        ];
        action = `Siga ${dmLabel} -> saida/permissivo -> A1/A2 de ${kLabel} -> forca do ${compressorLabel}.`;
        decisionTree = decisionTree.concat([
            `Rota prioritaria: ${dmLabel} armado, pressostato fechado, RFF ok e comando chegando em ${kLabel}.`,
            `Para tanque com CLP, verificar LED/saida e rele de interface em: ${family.outputPath}.`,
            `Se ${kLabel} fecha e o motor nao parte, verificar potencia, contatos principais, soft-starter/fases e compressor.`
        ]);
    } else if (includesAny(text, ['ihm apagada', 'display apagado', 'painel morto', 'clp apagado'])) {
        symptom = 'IHM/CLP apagado';
        hypothesis = 'IHM/CLP apagado e falha de alimentacao de comando: disjuntor de comando, fusivel, fonte 24Vcc, emergencia ou perda de alimentacao do painel.';
        questions = [
            'Existe tensao na entrada da fonte 24Vcc e 24Vcc na saida da fonte?',
            'O disjuntor de comando/fusivel/emergencia esta fechado e sem mau contato?'
        ];
        action = 'Comece pela alimentacao de comando e fonte 24Vcc; nao va para pressao/manifold antes de recuperar IHM/CLP.';
        decisionTree = decisionTree.concat([
            'Sem IHM/CLP, tratar como comando sem alimentacao.',
            'Verificar entrada da fonte, saida 24Vcc, disjuntor de comando, fusivel, emergencia e bornes.',
            'Se 24Vcc existe e IHM nao liga, verificar cabo/comunicacao/alimentacao da propria IHM.'
        ]);
    } else if (includesAny(text, ['clp ligado mas nenhuma saida', 'clp ligado nenhuma saida', 'nenhuma saida atua'])) {
        symptom = 'CLP ligado sem saidas';
        hypothesis = 'CLP ligado sem saidas atuando indica emergencia aberta, falta de 0V/referencia, permissivo ausente, fonte 24Vcc instavel ou logica bloqueada por alarme.';
        questions = [
            'A emergencia, permissivo do painel principal e referencia 0V/24Vcc estao corretos?',
            'Existe alarme ativo na IHM bloqueando o ciclo ou a refrigeracao?'
        ];
        action = 'Confira emergencia, 0V/24Vcc e permissivos antes de condenar o CLP.';
        decisionTree = decisionTree.concat([
            'CLP ligado nao garante permissivo de saida.',
            'Verificar emergencia, negativo/0V, fonte 24Vcc sob carga e permissivos vindos do painel geral.',
            'Depois conferir LEDs de saida e reles de interface.'
        ]);
    } else if (includesAny(text, ['falta de fase', 'rff', 'fase fantasma'])) {
        symptom = 'falta de fase/RFF';
        hypothesis = 'Alarme de falta de fase pode ser fase real ausente, sequencia incorreta, mau contato em borne/cabo ou fase fantasma gerada por motor trifasico.';
        questions = [
            'As tres fases foram medidas fase-fase na entrada e depois do disjuntor/RFF?',
            'A corrente dos motores foi medida nas tres fases durante a tentativa de partida?'
        ];
        action = 'Meça tensao e corrente por fase; nao confie apenas em medicao sem carga quando ha suspeita de fase fantasma.';
        decisionTree = decisionTree.concat([
            'Medir L1-L2, L2-L3, L1-L3 antes e depois das protecoes.',
            'Medir corrente por fase com carga.',
            'Se uma fase some sob carga, procurar borne, cabo, disjuntor, contator ou alimentacao da fazenda.'
        ]);
    } else if (includesAny(text, ['bomba de limpeza', 'bomba limpeza', 'bomba cip'])) {
        symptom = 'bomba de limpeza/CIP nao aciona';
        hypothesis = 'Na bomba de limpeza, a causa comum e permissivo de nivel/RL1, DM da bomba, contatora sem comando, ausencia do sinal entre painel geral e CIP ou saida CLP sem atuar.';
        questions = [
            'O rele de nivel RL1 reconheceu agua/solucao suficiente no tanque?',
            'O DM da bomba esta armado e a saida/relay do CLP aciona durante a etapa?'
        ];
        action = 'Comece pelo nivel/RL1 e DM da bomba antes de condenar a bomba.';
        decisionTree = decisionTree.concat([
            'CIP precisa de permissivo de nivel antes de liberar bomba.',
            'Verificar RL1/sensor de nivel, DM da bomba, contatora, saida CLP e borne de interligacao.',
            'Se comando chega e carga nao roda, ir para potencia/motor.'
        ]);
    } else if (text.includes('agitador')) {
        symptom = 'agitador nao aciona';
        hypothesis = 'Agitador e diagnostico de comando/eletrica: parametros d1/d2, saida do controlador/CLP, contatora, DM e motor eletrico.';
        questions = [
            'O comando esta em manual, automatico ou vindo do CIP/CLP?',
            'A saida do controlador/CLP aciona a contatora do agitador e o DM esta armado?'
        ];
        action = 'Confira parametros/saida de comando e contatora; nao trate primeiro como problema mecanico.';
        decisionTree = decisionTree.concat([
            'Nao comecar girando pas manualmente como diagnostico principal.',
            'Verificar d1/d2 quando aplicavel, saida Ageon A ou CLP YE/RL6/RL18, contatora e DM.',
            'Depois medir tensao/corrente do motor.'
        ]);
    } else if (includesAny(text, ['choque', 'lataria', 'carcaca energizada'])) {
        symptom = 'choque na lataria/carcaca';
        hypothesis = 'Choque na lataria indica fuga para massa e aterramento ausente/ineficiente; e falha de seguranca, nao simples ajuste de operacao.';
        questions = [
            'Existe aterramento medido e DR/DPS em condicao correta?',
            'O choque aparece ao ligar qual circuito: principal, agitador, compressor ou limpeza?'
        ];
        action = 'Interrompa operacao insegura e isole circuito por circuito ate achar onde a fuga aparece.';
        decisionTree = decisionTree.concat([
            'Desligar cargas e religar uma por vez para localizar circuito com fuga.',
            'Verificar aterramento, isolamento dos motores, cabos, resistencia de aquecedor e umidade no painel.',
            'Nao liberar equipamento com carcaca energizada.'
        ]);
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
    electrical: buildElectricalDecision(prompt, mode, context)
});

export const buildSupportAnalysisInstruction = (analysis: SupportCaseAnalysis) => {
    const blocks: string[] = [];

    if (analysis.shSc) {
        blocks.push([
            '[PARSER SH/SC LOCAL - RESULTADO DETERMINISTICO]',
            ...analysis.shSc.facts.map(fact => `- ${fact}`),
            `- Padrao: ${analysis.shSc.pattern}.`,
            `- Hipotese tecnica: ${analysis.shSc.hypothesis}`,
            `- Perguntas prioritarias: 1) ${analysis.shSc.questions[0]} 2) ${analysis.shSc.questions[1]}`,
            `- Acao imediata: ${analysis.shSc.action}`,
            ...analysis.shSc.guardrails.map(rule => `- Regra: ${rule}`)
        ].join('\n'));
    }

    if (analysis.electrical) {
        blocks.push([
            '[ARVORE ELETRICA LOCAL - RESULTADO DETERMINISTICO]',
            `- Sintoma: ${analysis.electrical.symptom}.`,
            `- Familia/esquema usado: ${analysis.electrical.family}`,
            `- Referencia local/PDF: ${analysis.electrical.reference}`,
            `- Rota de comando: ${analysis.electrical.outputPath}`,
            `- Hipotese tecnica: ${analysis.electrical.hypothesis}`,
            `- Perguntas prioritarias: 1) ${analysis.electrical.questions[0]} 2) ${analysis.electrical.questions[1]}`,
            `- Acao imediata: ${analysis.electrical.action}`,
            '- Sequencia de decisao:',
            ...analysis.electrical.decisionTree.map((step, index) => `  ${index + 1}. ${step}`)
        ].join('\n'));
    }

    if (!blocks.length) return '';

    return `\n\n[RESULTADO DO MOTOR TECNICO LOCAL - NAO IGNORAR]\nO app calculou a leitura abaixo antes da resposta. Use como ancora tecnica e nao contradiga sem pedir medida nova.\n${blocks.join('\n\n')}`;
};
