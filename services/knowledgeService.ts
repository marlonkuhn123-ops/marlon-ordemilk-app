
import { FieldTip } from '../types';

const STORAGE_KEY = 'om_field_knowledge';

export const knowledgeService = {
    getTips: (): FieldTip[] => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
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
