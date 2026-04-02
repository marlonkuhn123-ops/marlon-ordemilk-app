
import { FieldTip } from '../types';

const STORAGE_KEY = 'om_field_knowledge';
const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const createTipId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `field-tip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isFieldTip = (value: unknown): value is FieldTip => {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<FieldTip>;
    return (
        typeof candidate.id === 'string' &&
        typeof candidate.content === 'string' &&
        typeof candidate.date === 'string'
    );
};

const parseStoredTips = (saved: string | null): FieldTip[] => {
    if (!saved) return [];

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(isFieldTip) : [];
    } catch (error) {
        console.warn('[knowledgeService] Falha ao ler memoria de campo do localStorage:', error);
        return [];
    }
};

export const knowledgeService = {
    getTips: (): FieldTip[] => {
        if (!hasStorage()) return [];

        const saved = localStorage.getItem(STORAGE_KEY);
        return parseStoredTips(saved);
    },

    saveTip: (content: string) => {
        const tips = knowledgeService.getTips();
        const newTip: FieldTip = {
            id: createTipId(),
            content,
            date: new Date().toLocaleDateString('pt-BR')
        };

        if (!hasStorage()) return newTip;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([newTip, ...tips]));
        } catch (error) {
            console.warn('[knowledgeService] Falha ao salvar memoria de campo no localStorage:', error);
        }

        return newTip;
    },

    deleteTip: (id: string) => {
        const tips = knowledgeService.getTips().filter(t => t.id !== id);

        if (!hasStorage()) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tips));
        } catch (error) {
            console.warn('[knowledgeService] Falha ao remover memoria de campo do localStorage:', error);
        }
    },

    // Formata as dicas para o prompt do Gemini
    getKnowledgeContext: () => {
        const tips = knowledgeService.getTips();
        if (tips.length === 0) return "";
        return `
        [MEMÓRIA DE CAMPO - APRENDIZADO DO TÉCNICO]
        O técnico adicionou as seguintes observações reais de campo que você deve considerar:
        ${tips.map(t => `- ${t.content}`).join('\n')}
        `.trim();
    }
};
