import { SupportDiagnosticContext, SupportMode } from '../types';
import { analyzeSupportCase, SupportCaseAnalysis } from './supportDiagnosticEngine';

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

const buildHypothesis = (route: OfflineRoute, prompt: string, context: SupportDiagnosticContext, analysis: SupportCaseAnalysis) => {
    const normalizedPrompt = sanitize(prompt);

    if (route === 'electrical' && analysis.electrical) {
        return analysis.electrical.hypothesis;
    }
    if (route === 'refrigeration' && analysis.shSc) {
        return analysis.shSc.hypothesis;
    }

    if (route === 'errors') {
        if (context.code) {
            return `O primeiro alvo é interpretar o código ${context.code} no controlador antes de mexer no restante.`;
        }
        return 'A falha parece ligada ao controlador ou a um alarme ainda não confirmado.';
    }

    if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            return 'A contatora não fecha porque a cadeia de comando está aberta ou a bobina não está recebendo comando seguro.';
        }
        if (normalizedPrompt.includes('ihm') || context.ihmOn === 'nao') {
            return 'A causa mais provável está na alimentação de comando ou no circuito de 24V do painel.';
        }
        return 'A causa mais provável está na cadeia elétrica de comando ou proteção.';
    }

    if (route === 'refrigeration') {
        if (hasHighShLowScClue(normalizedPrompt)) {
            return 'SH alto com SC baixo aponta primeiro para falta de fluido, vazamento, carga incompleta ou flash gas; não é caso de abrir VET como primeira ação.';
        }
        if (normalizedPrompt.includes('alta pressao')) {
            return 'O desarme por alta pressão aponta primeiro para falha de rejeição de calor no condensador, ventilação ruim, excesso de fluido ou ar no sistema.';
        }
        if (normalizedPrompt.includes('aquece') || normalizedPrompt.includes('desliga')) {
            return 'A causa mais provável está em troca térmica ruim ou compressor entrando em proteção.';
        }
        return 'A causa mais provável está no ciclo frigorífico ainda sem medidas suficientes para fechar.';
    }

    return 'Ainda falta contexto mínimo para fechar a causa com segurança.';
};

const buildQuestions = (route: OfflineRoute, context: SupportDiagnosticContext, prompt: string, analysis: SupportCaseAnalysis) => {
    const questions: string[] = [];
    const normalizedPrompt = sanitize(prompt);

    if (route === 'electrical' && analysis.electrical) {
        return analysis.electrical.questions.slice(0, 2);
    }
    if (route === 'refrigeration' && analysis.shSc) {
        return analysis.shSc.questions.slice(0, 2);
    }

    const pushIfMissing = (known: boolean, question: string) => {
        if (!known && questions.length < 2) questions.push(question);
    };

    if (route === 'errors') {
        pushIfMissing(hasValue(context.model), 'Qual é o modelo do tanque ou do painel?');
        pushIfMissing(hasValue(context.code), 'Qual código ou mensagem aparece exatamente na IHM?');
        pushIfMissing(Boolean(context.ihmOn), 'A IHM acende normal ou está apagada?');
    } else if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            questions.push('Há tensão na bobina A1/A2 quando o controlador pede partida?');
            questions.push('Algum DM, relé térmico, pressostato ou relé de falta de fase está aberto?');
            return questions.slice(0, 2);
        }
        pushIfMissing(hasValue(context.voltage), 'Qual tensão você mediu nas fases ou na alimentação?');
        pushIfMissing(Boolean(context.ihmOn), 'A IHM acende normal ou o painel está morto?');
        pushIfMissing(Boolean(context.compressorStarts), 'A contatora fecha ou o compressor não chega a partir?');
    } else if (route === 'refrigeration') {
        if (hasShScClue(normalizedPrompt)) {
            questions.push('Quais são as pressões de sucção e descarga no manifold, em psi ou bar?');
            questions.push('O visor de líquido tem bolhas ou há sinal de vazamento/óleo nas conexões?');
            return questions.slice(0, 2);
        }
        pushIfMissing(hasValue(context.pressure), 'Qual pressão você mediu no sistema antes do desarme?');
        pushIfMissing(hasValue(context.temperature), 'Qual temperatura do leite você mediu?');
        pushIfMissing(hasValue(context.refrigerant), 'Qual é o fluido refrigerante do sistema?');
        pushIfMissing(hasValue(context.model), 'Qual é o modelo ou capacidade do tanque?');
    } else {
        pushIfMissing(hasValue(context.model), 'Qual é o modelo ou capacidade do tanque?');
        pushIfMissing(hasValue(context.code), 'Existe código de erro, alarme ou mensagem na IHM?');
        pushIfMissing(Boolean(context.compressorStarts), 'O compressor parte, tenta partir ou nem aciona?');
    }

    while (questions.length < 2) {
        questions.push(questions.length === 0
            ? 'Qual é o sintoma principal visto no local?'
            : 'Você já mediu tensão, pressão ou temperatura?');
    }

    return questions.slice(0, 2);
};

const buildAction = (route: OfflineRoute, prompt: string, analysis: SupportCaseAnalysis) => {
    const normalizedPrompt = sanitize(prompt);

    if (route === 'electrical' && analysis.electrical) {
        return analysis.electrical.action;
    }
    if (route === 'refrigeration' && analysis.shSc) {
        return analysis.shSc.action;
    }

    if (route === 'errors') {
        return 'Fotografe a IHM, confirme se ela está energizada e evite apagar o alarme antes de registrar o código.';
    }
    if (route === 'electrical') {
        if (normalizedPrompt.includes('contatora') || normalizedPrompt.includes('contator')) {
            return 'Com segurança, confira DM/relé/falta de fase/pressostatos e meça A1/A2 da bobina antes de forçar partida.';
        }
        return 'Com segurança, confirme tensão de entrada, relé de falta de fase e disjuntor-motor antes de insistir na partida.';
    }
    if (route === 'refrigeration') {
        if (hasHighShLowScClue(normalizedPrompt)) {
            return 'Não abra a VET agora; confirme vazamento/carga pelo visor, pressões e estabilidade antes de adicionar fluido com critério.';
        }
        if (normalizedPrompt.includes('alta pressao')) {
            return 'Desligue e confira fluxo de ar do condensador, ventiladores e serpentina antes de religar.';
        }
        return 'Não force nova partida agora; confira condensador, ventilação e temperatura do compressor antes de religar.';
    }
    return 'Me envie o modelo e o sintoma principal antes de avançar para um teste mais pesado.';
};

export const localSupportService = {
    generateResponse(prompt: string, mode: SupportMode, context: SupportDiagnosticContext) {
        const analysis = analyzeSupportCase(prompt, mode, context);
        let route: OfflineRoute;

        if (mode === 'REF' && analysis.shSc) {
            route = 'refrigeration';
        } else if (mode === 'ELEC' && analysis.electrical) {
            route = 'electrical';
        } else if (analysis.electrical) {
            route = 'electrical';
        } else if (analysis.shSc) {
            route = 'refrigeration';
        } else {
            route = detectRoute(prompt, mode);
        }

        const hypothesis = buildHypothesis(route, prompt, context, analysis);
        const questions = buildQuestions(route, context, prompt, analysis);
        const action = buildAction(route, prompt, analysis);

        const text = [
            'Olá. Vou te ajudar com um diagnóstico rápido e direto.',
            '',
            `**Hipótese Inicial:** ${hypothesis}`,
            '',
            '**Preciso confirmar:**',
            `1. ${questions[0]}`,
            `2. ${questions[1]}`,
            '',
            `**Faça agora:** ${action}`,
            '',
            '**Modo consulta local:** assim que a conexão voltar, eu aprofundo com a IA completa.'
        ].join('\n');

        return { route, text };
    }
};
