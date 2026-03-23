import { FieldTip } from '../types';

const STORAGE_KEY = 'om_field_knowledge';
const DEFAULT_CONTEXT_LIMIT = 8;

const parseStoredTips = (saved: string | null): FieldTip[] => {
    if (!saved) return [];

    try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((tip): tip is FieldTip => {
            return Boolean(
                tip &&
                typeof tip.id === 'string' &&
                typeof tip.content === 'string' &&
                typeof tip.date === 'string'
            );
        });
    } catch (error) {
        console.warn('Knowledge storage is invalid. Resetting cached field tips.');
        return [];
    }
};

export const knowledgeService = {
    getTips: (): FieldTip[] => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return parseStoredTips(saved);
    },

    saveTip: (content: string) => {
        const tips = knowledgeService.getTips();
        const newTip: FieldTip = {
            id: crypto.randomUUID(),
            content,
            date: new Date().toLocaleDateString('pt-BR')
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newTip, ...tips]));
        return newTip;
    },

    deleteTip: (id: string) => {
        const tips = knowledgeService.getTips().filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tips));
    },

    getKnowledgeContext: (limit = DEFAULT_CONTEXT_LIMIT) => {
        const tips = knowledgeService.getTips();
        if (tips.length === 0) return "";

        const recentTips = tips.slice(0, limit);
        return `
        [MEMORIA DE CAMPO - APRENDIZADO DO TECNICO]
        O tecnico adicionou as seguintes observacoes reais de campo que voce deve considerar:
        ${recentTips.map(t => `- ${t.content}`).join('\n')}
        `.trim();
    }
};
