
import { logicService } from './logicService';
import { analyzeSupportCase } from './supportDiagnosticEngine';
import { localSupportService } from './localSupportService';
import { Refrigerant } from '../types';
import { KNOWLEDGE_BASE } from '../data/knowledge_base';

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
        assert(p.includes("60 PSIG/manifold"), "Pressão incorreta no prompt");
    });

    test("Calculadora: Deve calcular Superaquecimento corretamente com tabela local", () => {
        // R-22 a 68 PSIG = 4.2 C na referencia Danfoss. Logo 14.2 C - 4.2 C = 10K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "68", "14.2", "Superaquecimento");
        assert(p.includes("= 10.0K"), `Cálculo SH padrão falhou. Esperado 10.0K. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "68", "14.2", "Superaquecimento");
        assert(audit.tsatLabel === "Tsat = 4.2\u00b0C", `Linha de Tsat incorreta no SH. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "SH = 14.2\u00b0C - 4.2\u00b0C = 10.0K", `Linha de cálculo SH incorreta. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve calcular Superaquecimento corretamente com temperaturas negativas", () => {
        // R-22 a 30 PSIG = -13.9 C na referencia Danfoss. Logo -3.9 C - (-13.9 C) = 10K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "30", "-3.9", "Superaquecimento");
        assert(p.includes("= 10.0K"), `Cálculo SH com negativos falhou. Esperado 10.0K. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "30", "-3.9", "Superaquecimento");
        assert(audit.resultLabel === "SH = -3.9\u00b0C - (-13.9\u00b0C) = 10.0K", `Formula SH negativa sem parenteses. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve exibir parenteses ao subtrair Tsat negativa no R-404A", () => {
        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "20", "-8", "Superaquecimento");
        assert(audit.tsatLabel === "Tsat = -25.9\u00b0C", `Tsat R-404A 20 PSIG incorreta. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "SH = -8.0\u00b0C - (-25.9\u00b0C) = 17.9K", `Formula R-404A SH deveria usar parenteses. Recebido: ${audit.resultLabel}`);
        assert(audit.classification === "ALTO", `Classificacao esperada ALTO. Recebido: ${audit.classification}`);
    });

    test("Calculadora: Deve usar R-404A bubble no sub-resfriamento conforme Danfoss", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 295, "Sub-resfriamento");
        assert(satTemp !== null && Math.abs(satTemp - 46.6) < 0.1, `R-404A bubble falhou. Esperado ~46.6 C, recebido ${satTemp}`);

        // R-404A a 295 PSIG em bubble = ~46.6 C. Logo 46.6 - 53 = -6.4K, nao 8K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(p.includes("= -6.4K"), `Cálculo SC R-404A falhou. Esperado -6.4K. Prompt: ${p}`);
        assert(p.includes("R404A bubble/liquido"), `Prompt nao declarou curva bubble. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(audit.tsatLabel === "Tsat = 46.6\u00b0C", `Linha de Tsat incorreta no SC. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "SC = 46.6\u00b0C - 53.0\u00b0C = -6.4K", `Linha de cálculo SC incorreta. Recebido: ${audit.resultLabel}`);
        assert(audit.classification === "BAIXO", `Classificacao incorreta para SC negativo. Recebido: ${audit.classification}`);
    });

    test("Calculadora: Deve usar R-404A dew no superaquecimento", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 295, "Superaquecimento");
        assert(satTemp !== null && Math.abs(satTemp - 46.9) < 0.1, `R-404A dew falhou. Esperado ~46.9 C, recebido ${satTemp}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "295", "56.9", "Superaquecimento");
        assert(audit.resultLabel === "SH = 56.9\u00b0C - 46.9\u00b0C = 10.0K", `Linha de calculo SH/dew incorreta. Recebido: ${audit.resultLabel}`);
        assert(audit.curveLabel.includes("dew"), `Curva SH deveria ser dew. Recebido: ${audit.curveLabel}`);
    });

    test("Calculadora: Deve encontrar chaves decimais exatas na tabela PT", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 341.3, "Sub-resfriamento");
        assert(satTemp === 52.7, `Busca exata de chave decimal falhou. Esperado 52.7 C, recebido ${satTemp}`);
    });

    test("Calculadora: Deve lidar com dados de saturação não encontrados", () => {
        // Usando uma pressão irreal para forçar o erro
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "9999", "10", "Superaquecimento");
        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "9999", "10", "Superaquecimento");
        assert(audit.ready === false, "Auditoria local deveria sinalizar cálculo indisponível.");
        assert(p.includes("Pressao fora da faixa da tabela PT local"), "Mensagem de fallback para saturação não encontrada falhou.");
        assert(p.includes("Realize o calculo com base em seu conhecimento"), "Instrução para a IA em caso de falha não encontrada.");
        assert(!p.includes("CALCULO LOCAL REALIZADO"), "Contexto de cálculo local não deveria existir no fallback.");
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

    // --- TESTES DO SUPORTE / MOTOR TECNICO ---
    test("Suporte: Deve interpretar SH alto e SC baixo de forma deterministica", () => {
        const analysis = analyzeSupportCase(
            "R404A com SH=18K e SC: 1,2K no manifold",
            "REF",
            { refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 18, `SH nao foi lido corretamente. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 1.2, `SC decimal nao foi lido corretamente. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrao SH/SC incorreto. Recebido: ${analysis.shSc?.pattern}`);
        assert(Boolean(analysis.shSc?.action.includes("Não abra a VET")), `Ação deveria bloquear abertura de VET. Recebido: ${analysis.shSc?.action}`);
    });

    test("Suporte: Deve interpretar formula de SH e pegar o resultado final em K", () => {
        const analysis = analyzeSupportCase(
            "SH = -8.0C - (-25.9C) = 17.9K e sub-resfriamento 2K",
            "REF",
            { refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 17.9, `Formula SH deveria usar resultado final 17.9K. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 2, `SC deveria ser 2K. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrao deveria ser SH alto + SC baixo. Recebido: ${analysis.shSc?.pattern}`);
    });

    test("Suporte: SH/SC não deve confundir capacidade do tanque com medida", () => {
        const analysis = analyzeSupportCase(
            "R404A no tanque 10 mil, SH=18K, SC=1K, visor com bolhas",
            "REF",
            { model: "10000L", refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 18, `SH deveria ser 18K, não capacidade do tanque. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 1, `SC deveria ser 1K. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrao deveria ser falta de fluido/vazamento. Recebido: ${analysis.shSc?.pattern}`);
    });

    test("Suporte REF: Não deve puxar árvore elétrica por frase ambígua", () => {
        const prompt = "Modo refrigeração: compressor nao liga direito, leite nao baixa e pressao de succao baixa";
        const analysis = analyzeSupportCase(prompt, "REF", { refrigerant: "R-404A" });
        const fallback = localSupportService.generateResponse(prompt, "REF", { refrigerant: "R-404A" });

        assert(!analysis.electrical, `Modo REF não deve montar árvore elétrica. Recebido: ${JSON.stringify(analysis.electrical)}`);
        assert(fallback.route === "refrigeration", `Fallback REF deveria ficar em refrigeração. Recebido: ${fallback.route}`);
        assert(!/(CLP|A1\/A2|contatora|borne|rel[eé]|painel)/i.test(fallback.text), `Fallback REF não deve citar esquema elétrico. Recebido: ${fallback.text}`);
    });

    test("Base técnica: Refrigeração deve usar SH 7-12K e SC 4-8K", () => {
        assert(KNOWLEDGE_BASE.includes("MATEMÁTICA DO SH E SC"), "Base deve padronizar SH/SC.");
        assert(KNOWLEDGE_BASE.includes("7 a 12 K"), "Base deve usar SH 7 a 12K.");
        assert(KNOWLEDGE_BASE.includes("4 a 8 K"), "Base deve usar SC 4 a 8K.");
        assert(!KNOWLEDGE_BASE.includes("SH E SR"), "Base não deve manter sigla SR no título.");
        assert(!KNOWLEDGE_BASE.includes("5 a 10 K"), "Base não deve manter faixa antiga de SH 5 a 10K.");
        assert(!KNOWLEDGE_BASE.includes("3 a 5 K"), "Base não deve manter faixa antiga de SC/SR 3 a 5K.");
        assert(!KNOWLEDGE_BASE.includes("SH/SR"), "Base não deve misturar SH/SR.");
    });

    test("Suporte: Deve montar árvore elétrica para contatora em tanque grande CLP", () => {
        const analysis = analyzeSupportCase(
            "Tanque 20000L 380V, IHM acende, contatora nao fecha no compressor 02",
            "ELEC",
            { model: "20000L", voltage: "380v 3f" }
        );

        assert(analysis.electrical?.symptom === "contatora não fecha", `Sintoma elétrico incorreto. Recebido: ${analysis.electrical?.symptom}`);
        assert(Boolean(analysis.electrical?.family.includes("CLP Panasonic")), `Família deveria indicar CLP Panasonic. Recebido: ${analysis.electrical?.family}`);
        assert(Boolean(analysis.electrical?.reference.includes("TRIFÁSICO 380V")), `Referência PDF 380V esperada. Recebido: ${analysis.electrical?.reference}`);
        assert(Boolean(analysis.electrical?.action.includes("A1/A2")), `Ação deveria pedir A1/A2. Recebido: ${analysis.electrical?.action}`);
    });

    test("Suporte: Agitador em tanque 10 mil deve puxar esquema CLP Panasonic", () => {
        const prompt = "Tanque 10 mil 380V nao liga o agitador";
        const analysis = analyzeSupportCase(
            prompt,
            "ELEC",
            { model: "10000L", voltage: "380V" }
        );
        const fallback = localSupportService.generateResponse(prompt, "ELEC", { model: "10000L", voltage: "380V" });
        const combined = `${analysis.electrical?.hypothesis}\n${analysis.electrical?.action}\n${analysis.electrical?.decisionTree.join('\n')}\n${fallback.text}`;

        assert(analysis.electrical?.symptom === "agitador não aciona", `Sintoma deveria ser agitador. Recebido: ${analysis.electrical?.symptom}`);
        assert(Boolean(combined.includes("CLP Panasonic")), `Deveria citar CLP Panasonic. Recebido: ${combined}`);
        assert(Boolean(combined.includes("saída YE")), `Deveria citar saída YE. Recebido: ${combined}`);
        assert(Boolean(combined.includes("RL6") && combined.includes("RL18")), `Deveria citar RL6/RL18. Recebido: ${combined}`);
        assert(Boolean(combined.includes("painel geral")), `Deveria guiar pela interligação/painel geral. Recebido: ${combined}`);
        assert(!combined.includes("Ageon") && !combined.includes("Full Gauge"), `Tanque 10 mil não deve usar Ageon/Full Gauge. Recebido: ${combined}`);
    });

    test("Suporte: Fallback local deve responder com português acentuado", () => {
        const result = localSupportService.generateResponse(
            "compressor desarma por alta pressao",
            "AUTO",
            {}
        );

        assert(result.text.includes("pressão"), `Fallback deveria escrever "pressão" com acento. Recebido: ${result.text}`);
        assert(result.text.includes("conexão"), `Fallback deveria escrever "conexão" com acento. Recebido: ${result.text}`);
        assert(!result.text.includes("pressao") && !result.text.includes("conexao"), `Fallback não deve devolver termos sem acento. Recebido: ${result.text}`);
        assert(!result.text.includes("_Modo consulta local"), `Fallback não deve exibir markdown cru. Recebido: ${result.text}`);
    });

    return report;
};
