import { SupportDiagnosticContext, SupportMode } from '../types';

type OfflineRoute = 'general' | 'refrigeration' | 'electrical' | 'errors';

const ELECTRICAL_KEYWORDS = [
    'eletrica',
    'eletrico',
    'tensao',
    'voltagem',
    'fase',
    'contatora',
    'disjuntor',
    'borne',
    'painel',
    'clp',
    'ihm',
    'rele',
    'fusivel',
    'compressor nao liga',
    'nao liga'
];

const REFRIGERATION_KEYWORDS = [
    'refrigeracao',
    'refrigerador',
    'compressor',
    'aquece',
    'desliga',
    'pressao',
    'temperatura',
    'superaquecimento',
    'sub-resfriamento',
    'gas',
    'fluido',
    'condensador',
    'ventilador',
    'evaporador'
];

const ERROR_KEYWORDS = ['erro', 'alarme', 'codigo', 'display', 'ihm'];
const ELECTRICAL_PRIORITY_KEYWORDS = [
    'contatora',
    'contator',
    'disjuntor',
    'borne',
    'painel',
    'clp',
    'tensao',
    'fase',
    'nao liga',
    'nao parte',
    'nao aciona'
];

const sanitize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const hasValue = (value?: string) => Boolean(value && value.trim());
const includesAny = (value: string, keywords: string[]) =>
    keywords.some(keyword => value.includes(keyword));

const hasShScClue = (normalizedPrompt: string) =>
    includesAny(normalizedPrompt, ['superaquecimento', 'sh']) &&
    includesAny(normalizedPrompt, ['sub-resfriamento', 'subresfriamento', 'sc']);

const hasHighShLowScClue = (normalizedPrompt: string) =>
    hasShScClue(normalizedPrompt) &&
    includesAny(normalizedPrompt, ['18k', '18 k', 'alto']) &&
    includesAny(normalizedPrompt, ['1k', '1 k', 'baixo']);

const detectRoute = (prompt: string, mode: SupportMode): OfflineRoute => {
    if (mode === 'ELEC') return 'electrical';
    if (mode === 'REF') return 'refrigeration';

    const normalizedPrompt = sanitize(prompt);

    if (ELECTRICAL_PRIORITY_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword))) return 'electrical';
    if (REFRIGERATION_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword))) return 'refrigeration';
    if (ELECTRICAL_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword))) return 'electrical';
    if (ERROR_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword))) return 'errors';
    return 'general';
};

const buildHypothesis = (route: OfflineRoute, prompt: string, context: SupportDiagnosticContext) => {
    const normalizedPrompt = sanitize(prompt);

    if (route === 'errors') {
        if (context.code) {
            return `O primeiro alvo e interpretar o codigo ${context.code} no controlador antes de mexer no restante.`;
        }
        return 'A falha parece ligada ao controlador ou a um alarme ainda nao confirmado.';
    }

    if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            return 'A contatora nao fecha porque a cadeia de comando esta aberta ou a bobina nao esta recebendo comando seguro.';
        }
        if (normalizedPrompt.includes('ihm') || context.ihmOn === 'nao') {
            return 'A causa mais provavel esta na alimentacao de comando ou no circuito de 24V do painel.';
        }
        return 'A causa mais provavel esta na cadeia eletrica de comando ou protecao.';
    }

    if (route === 'refrigeration') {
        if (hasHighShLowScClue(normalizedPrompt)) {
            return 'SH alto com SC baixo aponta primeiro para falta de fluido, vazamento, carga incompleta ou flash gas; nao e caso de abrir VET como primeira acao.';
        }
        if (normalizedPrompt.includes('alta pressao')) {
            return 'O desarme por alta pressao aponta primeiro para falha de rejeicao de calor no condensador, ventilacao ruim, excesso de fluido ou ar no sistema.';
        }
        if (normalizedPrompt.includes('aquece') || normalizedPrompt.includes('desliga')) {
            return 'A causa mais provavel esta em troca termica ruim ou compressor entrando em protecao.';
        }
        return 'A causa mais provavel esta no ciclo frigorifico ainda sem medidas suficientes para fechar.';
    }

    return 'Ainda falta contexto minimo para fechar a causa com seguranca.';
};

const buildQuestions = (route: OfflineRoute, context: SupportDiagnosticContext, prompt: string) => {
    const questions: string[] = [];
    const normalizedPrompt = sanitize(prompt);

    const pushIfMissing = (known: boolean, question: string) => {
        if (!known && questions.length < 2) questions.push(question);
    };

    if (route === 'errors') {
        pushIfMissing(hasValue(context.model), 'Qual e o modelo do tanque ou do painel?');
        pushIfMissing(hasValue(context.code), 'Qual codigo ou mensagem aparece exatamente na IHM?');
        pushIfMissing(Boolean(context.ihmOn), 'A IHM acende normal ou esta apagada?');
    } else if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            questions.push('Ha tensao na bobina A1/A2 quando o controlador pede partida?');
            questions.push('Algum DM, rele termico, pressostato ou rele de falta de fase esta aberto?');
            return questions.slice(0, 2);
        }
        pushIfMissing(hasValue(context.voltage), 'Qual tensao voce mediu nas fases ou na alimentacao?');
        pushIfMissing(Boolean(context.ihmOn), 'A IHM acende normal ou o painel esta morto?');
        pushIfMissing(Boolean(context.compressorStarts), 'A contatora fecha ou o compressor nao chega a partir?');
    } else if (route === 'refrigeration') {
        if (hasShScClue(normalizedPrompt)) {
            questions.push('Quais sao as pressoes de succao e descarga no manifold, em psi ou bar?');
            questions.push('O visor de liquido tem bolhas ou ha sinal de vazamento/oleo nas conexoes?');
            return questions.slice(0, 2);
        }
        pushIfMissing(hasValue(context.pressure), 'Qual pressao voce mediu no sistema antes do desarme?');
        pushIfMissing(hasValue(context.temperature), 'Qual temperatura do leite voce mediu?');
        pushIfMissing(hasValue(context.refrigerant), 'Qual e o fluido refrigerante do sistema?');
        pushIfMissing(hasValue(context.model), 'Qual e o modelo ou capacidade do tanque?');
    } else {
        pushIfMissing(hasValue(context.model), 'Qual e o modelo ou capacidade do tanque?');
        pushIfMissing(hasValue(context.code), 'Existe codigo de erro, alarme ou mensagem na IHM?');
        pushIfMissing(Boolean(context.compressorStarts), 'O compressor parte, tenta partir ou nem aciona?');
    }

    while (questions.length < 2) {
        questions.push(questions.length === 0
            ? 'Qual e o sintoma principal visto no local?'
            : 'Voce ja mediu tensao, pressao ou temperatura?');
    }

    return questions.slice(0, 2);
};

const buildAction = (route: OfflineRoute, prompt: string) => {
    const normalizedPrompt = sanitize(prompt);

    if (route === 'errors') {
        return 'Fotografe a IHM, confirme se ela esta energizada e evite apagar o alarme antes de registrar o codigo.';
    }
    if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            return 'Com seguranca, confira DM/rele/falta de fase/pressostatos e meca A1/A2 da bobina antes de forcar partida.';
        }
        return 'Com seguranca, confirme tensao de entrada, rele de falta de fase e disjuntor-motor antes de insistir na partida.';
    }
    if (route === 'refrigeration') {
        if (hasHighShLowScClue(normalizedPrompt)) {
            return 'Nao abra a VET agora; confirme vazamento/carga pelo visor, pressoes e estabilidade antes de adicionar fluido com criterio.';
        }
        if (normalizedPrompt.includes('alta pressao')) {
            return 'Desligue e confira fluxo de ar do condensador, ventiladores e serpentina antes de religar.';
        }
        return 'Nao force nova partida agora; confira condensador, ventilacao e temperatura do compressor antes de religar.';
    }
    return 'Me envie o modelo e o sintoma principal antes de avancar para um teste mais pesado.';
};

export const localSupportService = {
    generateResponse(prompt: string, mode: SupportMode, context: SupportDiagnosticContext) {
        const route = detectRoute(prompt, mode);
        const hypothesis = buildHypothesis(route, prompt, context);
        const questions = buildQuestions(route, context, prompt);
        const action = buildAction(route, prompt);

        const text = [
            'Ola. Vou te ajudar com um diagnostico rapido e direto.',
            '',
            `**Hipotese Inicial:** ${hypothesis}`,
            '',
            '**Preciso confirmar:**',
            `1. ${questions[0]}`,
            `2. ${questions[1]}`,
            '',
            `**Faca agora:** ${action}`,
            '',
            '_Modo consulta local ativo. Assim que a conexao voltar, eu aprofundo com a IA completa._'
        ].join('\n');

        return { route, text };
    }
};
