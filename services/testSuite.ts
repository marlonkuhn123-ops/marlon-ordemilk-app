
import { logicService } from './logicService';
import { Refrigerant } from '../types';

/**
 * UTILS DE TESTE
 */
const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`FALHA: ${message}`);
    return true;
};

export const runSystemDiagnostics = () => {
    const report = {
        total: 0,
        passed: 0,
        errors: [] as string[]
    };

    const test = (name: string, fn: () => void) => {
        report.total++;
        try {
            fn();
            report.passed++;
        } catch (e: any) {
            report.errors.push(`${name}: ${e.message}`);
        }
    };

    // --- TESTES DA CALCULADORA ---
    test("Calculadora: Deve gerar prompt com fluido correto", () => {
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "60", "10", "Superaquecimento");
        assert(p.includes("Fluido R-22"), "Fluido não identificado no prompt");
        assert(p.includes("60 PSI"), "Pressão incorreta no prompt");
    });

    test("Calculadora: Deve calcular Superaquecimento corretamente com tabela local", () => {
        // R-22 a 68 PSI = 4.0°C na tabela local. Logo 14°C - 4°C = 10K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "68", "14", "Superaquecimento");
        assert(p.includes("= 10.0K"), `Cálculo SH padrão falhou. Esperado 10.0K. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "68", "14", "Superaquecimento");
        assert(audit.tsatLabel === "Tsat = 4.0°C", `Linha de Tsat incorreta no SH. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "SH = 14.0°C - 4.0°C = 10.0K", `Linha de cálculo SH incorreta. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve calcular Superaquecimento corretamente com temperaturas negativas", () => {
        // R-22 a 30 PSI = -14.0°C na tabela local. Logo -4°C - (-14°C) = 10K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "30", "-4", "Superaquecimento");
        assert(p.includes("= 10.0K"), `Cálculo SH com negativos falhou. Esperado 10.0K. Prompt: ${p}`);
    });

    test("Calculadora: Deve interpolar saturação para R-404A entre dois pontos da tabela", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 295);
        assert(satTemp !== null && Math.abs(satTemp - 61.0) < 0.1, `Interpolação R-404A falhou. Esperado ~61.0°C, recebido ${satTemp}`);

        // Entre 289.9 PSI (60°C) e 299.7 PSI (62°C), 295 PSI fica em ~61.0°C. Logo 61 - 53 = 8K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(p.includes("= 8.0K"), `Cálculo SC interpolado falhou. Esperado 8.0K. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(audit.tsatLabel === "Tsat = 61.0°C", `Linha de Tsat incorreta no SC. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "SC = 61.0°C - 53.0°C = 8.0K", `Linha de cálculo SC incorreta. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve encontrar chaves decimais exatas na tabela PT", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 289.9);
        assert(satTemp === 60, `Busca exata de chave decimal falhou. Esperado 60°C, recebido ${satTemp}`);
    });

    test("Calculadora: Deve lidar com dados de saturação não encontrados", () => {
        // Usando uma pressão irreal para forçar o erro
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "9999", "10", "Superaquecimento");
        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "9999", "10", "Superaquecimento");
        assert(audit.ready === false, "Auditoria local deveria sinalizar cálculo indisponível.");
        assert(p.includes("Pressao fora da faixa da tabela PT local"), "Mensagem de fallback para saturação não encontrada falhou.");
        assert(p.includes("Realize o calculo com base em seu conhecimento"), "Instrução para a IA em caso de falha não encontrada.");
        assert(!p.includes("CÁLCULO LOCAL REALIZADO"), "Contexto de cálculo local não deveria existir no fallback.");
    });

    // --- TESTES DO RELATÓRIO ---
    test("Relatório: Deve conter nome do cliente", () => {
        const p = logicService.formatReportPrompt({
            client: "FAZENDA TESTE",
            date: "2024-01-01",
            techName: "TEC JOAO",
            model: "4000L",
            serviceMode: "Manutenção",
            params: { sh: "10", sc: "5", temp: "4" },
            procedureText: "Vácuo realizado",
            obs: "OK"
        });
        assert(p.includes("FAZENDA TESTE"), "Nome do cliente omitido no laudo");
    });

    // --- TESTES DE DIMENSIONAMENTO (CRÍTICO) ---
    test("Dimensionamento: Cálculo de carga para 1000L", () => {
        const result = logicService.calculateCargaTermica(1000);
        // Valor esperado aproximado baseado na fórmula da Ordemilk
        assert(result.kcal > 7000 && result.kcal < 8500, `Carga térmica fora do esperado: ${result.kcal} kcal`);
    });

    return report;
};
