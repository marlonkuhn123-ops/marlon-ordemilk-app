
import { Refrigerant, CalcMode } from '../types';

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

/**
 * Lógica centralizada para evitar erros em produção.
 * Estas funções são puras: mesma entrada sempre gera mesma saída.
 */

export const logicService = {
    // Formata o prompt da calculadora (Coração do diagnóstico de gás)
    formatCalculatorPrompt: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode): string => {
        return `
        COMANDO: CALCULAR ${mode === 'Superaquecimento' ? 'Superaquecimento (SH)' : 'Sub-resfriamento (SC)'}.
        DADOS: Fluido ${fluid}, Pressão ${press} PSI, Temperatura ${temp} °C.
        
        CONTEXTO DE REFERÊNCIA:
        - Faixa IDEAL para Superaquecimento (SH): 7K a 12K.
        - Faixa IDEAL para Sub-resfriamento (SC): 4K a 8K.
        
        INSTRUÇÃO DE SAÍDA:
        NÃO use formatação Markdown ou símbolos especiais.
        1. Apresente o cálculo em Kelvin (K).
        2. Classifique o resultado.
        3. Adicione a AÇÃO RECOMENDADA prática.
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
