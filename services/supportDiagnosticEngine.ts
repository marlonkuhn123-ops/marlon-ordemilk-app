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
    let action = 'Não ajuste VET nem carga ainda; confirme pressões, visor e estabilidade do sistema primeiro.';

    if (shStatus === 'alto' && scStatus === 'baixo') {
        pattern = 'SH alto + SC baixo';
        hypothesis = 'SH alto com SC baixo aponta primeiro para falta de fluido, vazamento, carga incompleta ou flash gas; não é padrão para abrir VET primeiro.';
        questions = [
            'O visor de líquido está com bolhas e existe mancha de óleo/vazamento em conexões, evaporador ou condensador?',
            'Quais são as pressões de sucção e descarga com o compressor estabilizado?'
        ];
        action = 'Não abra a VET agora; procure vazamento/bolhas e confirme carga antes de adicionar fluido com critério.';
        guardrails.push('Proibido orientar abrir VET como primeira ação neste padrão.');
    } else if (shStatus === 'alto' && (scStatus === 'ideal' || scStatus === 'alto')) {
        pattern = scStatus === 'alto' ? 'SH alto + SC alto' : 'SH alto + SC ideal';
        hypothesis = 'SH alto com SC normal/alto indica evaporador subalimentado por restrição, filtro secador, VET, bulbo/igualador ou coluna líquida com perda.';
        questions = [
            'Há queda de temperatura antes/depois do filtro secador ou sinal de congelamento na linha?',
            'O bulbo da VET está bem fixado/isolado e o igualador externo está conectado?'
        ];
        action = 'Confira restrição, filtro secador e montagem da VET antes de mexer na carga.';
    } else if (shStatus === 'baixo') {
        pattern = scStatus === 'alto' ? 'SH baixo + SC alto' : 'SH baixo';
        hypothesis = 'SH baixo indica risco de retorno de líquido ao compressor, possível excesso de alimentação, baixa carga térmica ou VET aberta demais.';
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
        hypothesis = 'SC baixo sugere falta de líquido na linha, carga baixa, flash gas ou alimentação instável da VET.';
        questions = [
            'O visor de líquido apresenta bolhas depois de estabilizar?',
            'Existe vazamento/óleo em conexões ou queda de pressão na linha de líquido?'
        ];
        action = 'Confirme bolhas, vazamento e pressões antes de completar carga.';
    } else if (shStatus === 'ideal' && scStatus === 'ideal') {
        pattern = 'SH e SC na faixa ideal';
        hypothesis = 'SH e SC estão em faixa de referência; a falha pode estar fora de carga de fluido, como troca térmica, comando, sensor ou condição operacional.';
        questions = [
            'Qual sintoma continua acontecendo mesmo com SH/SC dentro da faixa?',
            'A temperatura do leite está caindo no tempo esperado?'
        ];
        action = 'Não altere carga nem VET agora; procure causa em troca térmica, comando ou sensor.';
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

    if (includesAny(text, ['contatora nao fecha', 'contator nao fecha', 'contatora nao aciona', 'contator nao aciona', 'nao fecha contatora'])) {
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
    } else if (text.includes('agitador')) {
        symptom = 'agitador não aciona';
        hypothesis = 'Agitador é diagnóstico de comando/elétrica: parâmetros d1/d2, saída do controlador/CLP, contatora, DM e motor elétrico.';
        questions = [
            'O comando está em manual, automático ou vindo do CIP/CLP?',
            'A saída do controlador/CLP aciona a contatora do agitador e o DM está armado?'
        ];
        action = 'Confira parâmetros/saída de comando e contatora; não trate primeiro como problema mecânico.';
        decisionTree = decisionTree.concat([
            'Não começar girando pás manualmente como diagnóstico principal.',
            'Verificar d1/d2 quando aplicável, saída Ageon A ou CLP YE/RL6/RL18, contatora e DM.',
            'Depois medir tensão/corrente do motor.'
        ]);
    } else if (includesAny(text, ['choque', 'lataria', 'carcaca energizada'])) {
        symptom = 'choque na lataria/carcaca';
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
            '[PARSER SH/SC LOCAL - RESULTADO DETERMINÍSTICO]',
            ...analysis.shSc.facts.map(fact => `- ${fact}`),
            `- Padrão: ${analysis.shSc.pattern}.`,
            `- Hipótese técnica: ${analysis.shSc.hypothesis}`,
            `- Perguntas prioritarias: 1) ${analysis.shSc.questions[0]} 2) ${analysis.shSc.questions[1]}`,
            `- Ação imediata: ${analysis.shSc.action}`,
            ...analysis.shSc.guardrails.map(rule => `- Regra: ${rule}`)
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
            `- Perguntas prioritarias: 1) ${analysis.electrical.questions[0]} 2) ${analysis.electrical.questions[1]}`,
            `- Ação imediata: ${analysis.electrical.action}`,
            '- Sequência de decisão:',
            ...analysis.electrical.decisionTree.map((step, index) => `  ${index + 1}. ${step}`)
        ].join('\n'));
    }

    if (!blocks.length) return '';

    return `\n\n[RESULTADO DO MOTOR TÉCNICO LOCAL - NÃO IGNORAR]\nO app calculou a leitura abaixo antes da resposta. Use como âncora técnica e não contradiga sem pedir medida nova.\n${blocks.join('\n\n')}`;
};
