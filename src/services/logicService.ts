import { Refrigerant, CalcMode } from '../types';
import { PT_TABLES } from '../data/pt_tables';

/**
 * Lógica centralizada para evitar erros em produção.
 * Estas funções são puras: mesma entrada sempre gera mesma saída.
 */

export const logicService = {
    // Busca a temperatura de saturação exata na tabela
    getSaturationTemp: (fluid: Refrigerant, pressure: number): number | null => {
        const table = PT_TABLES[fluid];
        if (!table) return null;
        
        // Arredondar a pressão para o inteiro mais próximo (já que a tabela é de 1 em 1 PSI)
        const pressKey = Math.round(pressure);
        return table[pressKey] !== undefined ? table[pressKey] : null;
    },

    // Formata o prompt da calculadora (Coração do diagnóstico de gás)
    formatCalculatorPrompt: (fluid: Refrigerant, press: string, temp: string, mode: CalcMode) => {
        const pressureVal = parseFloat(press);
        const tempMeasured = parseFloat(temp);
        const satTemp = logicService.getSaturationTemp(fluid, pressureVal);

        // Se tivermos o valor exato, passamos para a IA já processado
        const satDataContext = satTemp !== null 
            ? `VALOR EXATO DE SATURAÇÃO ENCONTRADO NA TABELA: ${satTemp}°C.`
            : `AVISO: Valor de saturação não encontrado na biblioteca local para ${fluid} a ${press} PSI. Use seus conhecimentos técnicos padrão.`;

        return `
        COMANDO: CALCULAR ${mode === 'Superaquecimento' ? 'Superaquecimento (SH)' : 'Sub-resfriamento (SC)'}.
        DADOS: Fluido ${fluid}, Pressão ${press} PSI, Temperatura Medida ${tempMeasured} °C.
        ${satDataContext}
        
        VALORES DE REFERÊNCIA ORDEMILK:
        - Faixa IDEAL para Superaquecimento (SH): 7K a 12K.
        - Faixa IDEAL para Sub-resfriamento (SC): 4K a 8K.
        
        SAÍDA OBRIGATÓRIA (COPIE EXATAMENTE ESTE FORMATO E PREENCHA):
        [MARCA]RESULTADO: {VALOR_EM_K} K[/MARCA]

        1. CÁLCULO TERMOMECÂNICO
        ${satTemp !== null 
            ? `Equação: ${mode === 'Superaquecimento' ? `${tempMeasured} - (${satTemp})` : `(${satTemp}) - ${tempMeasured}`} = ${(mode === 'Superaquecimento' ? tempMeasured - satTemp : satTemp - tempMeasured).toFixed(1)}K.`
            : '(IA, realize o cálculo baseado na temperatura de saturação correta do fluido)'}

        2. CLASSIFICAÇÃO
        (Diga se está ALTO, BAIXO ou IDEAL e explique).

        3. AÇÃO RECOMENDADA
        (Checklist mecânico para o técnico no campo).
        `.trim();
    },

    // Formata o laudo técnico (Garante que nenhum dado do cliente suma)
    formatReportPrompt: (data: {
        client: string,
        date: string,
        techName: string,
        model: string,
        serviceMode: string,
        params: { sh: string, sc: string, temp: string },
        procedureText: string,
        obs: string
    }) => {
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
    calculateCargaTermica: (volume: number) => {
        const massa = volume * 1.03;
        const cargaBase = (massa * 0.93 * 31) / 3;
        const cargaTotalKcal = cargaBase * 0.75;
        return {
            kcal: Math.round(cargaTotalKcal),
            kw: parseFloat((cargaTotalKcal / 860).toFixed(2))
        };
    }
};
