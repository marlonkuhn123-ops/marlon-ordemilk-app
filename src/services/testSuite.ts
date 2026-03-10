
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
