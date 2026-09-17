
import { logicService } from './logicService';
import { analyzeSupportCase } from './supportDiagnosticEngine';
import { localSupportService, normalizeSupportFieldTerminology } from './localSupportService';
import { Refrigerant } from '../types';
import { KNOWLEDGE_BASE } from '../data/knowledge_base';
import { getRefrigerationReferenceContext, getTypicalPressureWindow, REFRIGERATION_SUPPORT_REFERENCE_CONTEXT } from '../data/refrigeration_support_reference';
import { FAQ_DATABASE } from '../data/faq_data';
import { TECHNICAL_CONTEXT } from '../constants';

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
        assert(audit.tsatLabel === "Tsat = 4.2\u00b0C", `Linha de Tsat incorreta no Sup.Aque. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "Sup.Aque = 14.2\u00b0C - 4.2\u00b0C = 10.0K", `Linha de cálculo Sup.Aque incorreta. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve calcular Superaquecimento corretamente com temperaturas negativas", () => {
        // R-22 a 30 PSIG = -13.9 C na referencia Danfoss. Logo -3.9 C - (-13.9 C) = 10K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R22, "30", "-3.9", "Superaquecimento");
        assert(p.includes("= 10.0K"), `Cálculo SH com negativos falhou. Esperado 10.0K. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R22, "30", "-3.9", "Superaquecimento");
        assert(audit.resultLabel === "Sup.Aque = -3.9\u00b0C - (-13.9\u00b0C) = 10.0K", `Fórmula Sup.Aque negativa sem parenteses. Recebido: ${audit.resultLabel}`);
    });

    test("Calculadora: Deve exibir parenteses ao subtrair Tsat negativa no R-404A", () => {
        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "20", "-8", "Superaquecimento");
        assert(audit.tsatLabel === "Tsat = -25.9\u00b0C", `Tsat R-404A 20 PSIG incorreta. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "Sup.Aque = -8.0\u00b0C - (-25.9\u00b0C) = 17.9K", `Fórmula R-404A Sup.Aque deveria usar parenteses. Recebido: ${audit.resultLabel}`);
        assert(audit.classification === "ALTO", `Classificação esperada ALTO. Recebido: ${audit.classification}`);
    });

    test("Calculadora: Deve usar R-404A bubble no sub-resfriamento conforme Danfoss", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 295, "Sub-resfriamento");
        assert(satTemp !== null && Math.abs(satTemp - 46.6) < 0.1, `R-404A bubble falhou. Esperado ~46.6 C, recebido ${satTemp}`);

        // R-404A a 295 PSIG em bubble = ~46.6 C. Logo 46.6 - 53 = -6.4K, nao 8K.
        const p = logicService.formatCalculatorPrompt(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(p.includes("= -6.4K"), `Cálculo SC R-404A falhou. Esperado -6.4K. Prompt: ${p}`);
        assert(p.includes("R404A bubble/líquido"), `Prompt nao declarou curva bubble. Prompt: ${p}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "295", "53", "Sub-resfriamento");
        assert(audit.tsatLabel === "Tsat = 46.6\u00b0C", `Linha de Tsat incorreta no Sub.Res. Recebido: ${audit.tsatLabel}`);
        assert(audit.resultLabel === "Sub.Res = 46.6\u00b0C - 53.0\u00b0C = -6.4K", `Linha de cálculo Sub.Res incorreta. Recebido: ${audit.resultLabel}`);
        assert(audit.classification === "BAIXO", `Classificação incorreta para Sub.Res negativo. Recebido: ${audit.classification}`);
    });

    test("Calculadora: Deve usar R-404A dew no superaquecimento", () => {
        const satTemp = logicService.getSaturationTemp(Refrigerant.R404A, 295, "Superaquecimento");
        assert(satTemp !== null && Math.abs(satTemp - 46.9) < 0.1, `R-404A dew falhou. Esperado ~46.9 C, recebido ${satTemp}`);

        const audit = logicService.getCalculatorAudit(Refrigerant.R404A, "295", "56.9", "Superaquecimento");
        assert(audit.resultLabel === "Sup.Aque = 56.9\u00b0C - 46.9\u00b0C = 10.0K", `Linha de cálculo Sup.Aque/dew incorreta. Recebido: ${audit.resultLabel}`);
        assert(audit.curveLabel.includes("dew"), `Curva Sup.Aque deveria ser dew. Recebido: ${audit.curveLabel}`);
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
        assert(p.includes("Pressão fora da faixa da tabela PT local"), "Mensagem de fallback para saturação não encontrada falhou.");
        assert(p.includes("Realize o cálculo com base em seu conhecimento"), "Instrução para a IA em caso de falha não encontrada.");
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

    // --- TESTES DO SUPORTE / MOTOR TECNICO ---
    test("Suporte: Deve interpretar SH alto e SC baixo de forma determinística", () => {
        const analysis = analyzeSupportCase(
            "R404A com SH=18K e SC: 1,2K no manifold",
            "REF",
            { refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 18, `SH nao foi lido corretamente. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 1.2, `SC decimal nao foi lido corretamente. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrão SH/SC incorreto. Recebido: ${analysis.shSc?.pattern}`);
        assert(Boolean(analysis.shSc?.action.includes("Não abra a válvula de expansão")), `Ação deveria bloquear abertura da válvula de expansão. Recebido: ${analysis.shSc?.action}`);
    });

    test("Suporte: Deve interpretar fórmula de SH e pegar o resultado final em K", () => {
        const analysis = analyzeSupportCase(
            "SH = -8.0C - (-25.9C) = 17.9K e sub-resfriamento 2K",
            "REF",
            { refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 17.9, `Fórmula SH deveria usar resultado final 17.9K. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 2, `SC deveria ser 2K. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrão deveria ser SH alto + SC baixo. Recebido: ${analysis.shSc?.pattern}`);
    });

    test("Suporte: SH/SC não deve confundir capacidade do tanque com medida", () => {
        const analysis = analyzeSupportCase(
            "R404A no tanque 10 mil, SH=18K, SC=1K, visor com bolhas",
            "REF",
            { model: "10000L", refrigerant: "R-404A" }
        );

        assert(analysis.shSc?.shKelvin === 18, `SH deveria ser 18K, não capacidade do tanque. Recebido: ${analysis.shSc?.shKelvin}`);
        assert(analysis.shSc?.scKelvin === 1, `SC deveria ser 1K. Recebido: ${analysis.shSc?.scKelvin}`);
        assert(analysis.shSc?.pattern === "SH alto + SC baixo", `Padrão deveria ser falta de fluido/vazamento. Recebido: ${analysis.shSc?.pattern}`);
    });

    test("Suporte REF: R404A com sucção de 22 PSIG deve gerar alerta de plausibilidade", () => {
        const analysis = analyzeSupportCase(
            "R404A, pressão de sucção 22 PSI no circuito 1",
            "REF",
            { refrigerant: "R-404A", model: "10000L" }
        );

        assert(analysis.refrigeration?.suctionPsig === 22, `Sucção deveria ser 22 PSIG. Recebido: ${analysis.refrigeration?.suctionPsig}`);
        assert(analysis.refrigeration?.isOutlier === true, "22 PSIG em R404A deveria exigir confirmação/investigação.");
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("muito abaixo")), `Hipótese deveria destacar leitura muito baixa. Recebido: ${analysis.refrigeration?.hypothesis}`);
        assert(!analysis.refrigeration?.hypothesis.includes("defeito confirmado"), "Faixa típica não pode fechar defeito automaticamente.");
    });

    test("Suporte REF: janela típica R404A deve vir da tabela PT local", () => {
        const window = getTypicalPressureWindow('R-404A', 30);
        assert(window?.suctionPsig.min === 55 && window?.suctionPsig.max === 59, `Sucção típica R404A esperada 55-59. Recebido: ${JSON.stringify(window?.suctionPsig)}`);
        assert(window?.dischargePsig?.min === 220 + 31, `Descarga mínima R404A a 30C esperada 251. Recebido: ${window?.dischargePsig?.min}`);
        assert(window?.dischargePsig?.max === 284, `Descarga máxima R404A a 30C esperada 284. Recebido: ${window?.dischargePsig?.max}`);
    });

    test("Suporte REF: janela típica R22 deve vir da tabela PT local", () => {
        const window = getTypicalPressureWindow('R-22', 30);
        assert(window?.suctionPsig.min === 43 && window?.suctionPsig.max === 47, `Sucção típica R22 esperada 43-47. Recebido: ${JSON.stringify(window?.suctionPsig)}`);
        assert(window?.dischargePsig?.min === 208 && window?.dischargePsig?.max === 236, `Descarga R22 esperada 208-236. Recebido: ${JSON.stringify(window?.dischargePsig)}`);
    });

    test("Suporte REF: pressão em bar deve ser convertida para PSIG", () => {
        const analysis = analyzeSupportCase(
            "R404A com pressão de sucção 1,5 bar",
            "REF",
            { refrigerant: "R-404A" }
        );
        assert(Math.abs((analysis.refrigeration?.suctionPsig || 0) - 21.8) < 0.1, `1,5 bar deveria converter para 21,8 PSIG. Recebido: ${analysis.refrigeration?.suctionPsig}`);
        assert(analysis.refrigeration?.isOutlier === true, "Leitura convertida deveria ser reconhecida como muito baixa.");
    });

    test("Suporte REF: descarga alta deve considerar temperatura ambiente", () => {
        const analysis = analyzeSupportCase(
            "R404A sucção 57 PSI, descarga 340 PSI e ambiente 30 C",
            "REF",
            { refrigerant: "R-404A" }
        );
        assert(analysis.refrigeration?.dischargePsig === 340, `Descarga deveria ser 340 PSIG. Recebido: ${analysis.refrigeration?.dischargePsig}`);
        assert(analysis.refrigeration?.ambientC === 30, `Ambiente deveria ser 30C. Recebido: ${analysis.refrigeration?.ambientC}`);
        assert(analysis.refrigeration?.isOutlier === true, "340 PSIG a 30C deveria ficar acima da faixa típica.");
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("fluxo de ar")), `Hipótese deveria priorizar lado de alta. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: pressões típicas não devem gerar falso alarme", () => {
        const analysis = analyzeSupportCase(
            "R404A sucção 57 PSI, descarga 270 PSI e ambiente 30 C",
            "REF",
            { refrigerant: "R-404A" }
        );
        assert(analysis.refrigeration?.isOutlier === false, `Leituras típicas não deveriam gerar alerta. Recebido: ${analysis.refrigeration?.hypothesis}`);
        assert(analysis.refrigeration?.compressionRatio === 3.97, `Taxa esperada 3,97. Recebido: ${analysis.refrigeration?.compressionRatio}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("não comprova")), `Pressão normal não deve fechar diagnóstico. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: caso saudável completo não deve ser diagnosticado como falha", () => {
        const prompt = "R404A, sucção 57 PSI, descarga 270 PSI, ambiente 30 C, superaquecimento 9 K, sub-resfriamento 6 K e leite a 4 C";
        const context = { refrigerant: "R-404A", currentTemperature: "4" };
        const analysis = analyzeSupportCase(prompt, "REF", context);
        const local = localSupportService.generateResponse(prompt, "REF", context).text;
        assert(analysis.refrigeration?.isOutlier === false, "Pressões do caso saudável devem ficar dentro da faixa típica.");
        assert(analysis.shSc?.shStatus === "ideal" && analysis.shSc?.scStatus === "ideal", "Sup.Aque/Sub.Res do caso saudável devem ser ideais.");
        assert(local.includes("compatível com operação normal"), `Resposta deve declarar operação normal. Recebido: ${local}`);
        assert(local.includes("não indica falha frigorífica"), `Resposta deve declarar ausência de indício de falha. Recebido: ${local}`);
        assert(!local.includes("causa mais provável"), `Caso saudável não pode receber diagnóstico provável. Recebido: ${local}`);
    });

    test("Suporte ELEC: pergunta puramente elétrica não deve carregar referência frigorífica", () => {
        const context = getRefrigerationReferenceContext("Tanque 10000L não liga o agitador, saída YE apagada", "ELEC");
        assert(context === '', "Modo elétrico puro não deveria carregar o pacote frigorífico adicional.");
        const crossed = getRefrigerationReferenceContext("Disjuntor desarma quando a pressão de descarga sobe", "ELEC");
        assert(crossed.includes("REFERÊNCIA FRIGORÍFICA"), "Modo elétrico deve cruzar quando houver sinal frigorífico claro.");
    });

    test("Suporte REF: descarga a 145C deve gerar alerta de limite oficial", () => {
        const analysis = analyzeSupportCase("Maneurop MTZ com temperatura de descarga 145 C", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "limite oficial", `Classe deveria ser limite oficial. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(analysis.refrigeration?.isOutlier === true, "145C deveria gerar alerta firme.");
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("ultrapassa")), `Deveria indicar ultrapassagem do limite. Recebido: ${analysis.refrigeration?.hypothesis}`);
        assert(Boolean(analysis.refrigeration?.action.includes("Interrompa")), `Ação deveria impedir insistência de funcionamento. Recebido: ${analysis.refrigeration?.action}`);
    });

    test("Suporte REF: TD de 24K deve pedir confirmação como faixa típica", () => {
        const analysis = analyzeSupportCase("TD do condensador 24 K", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "faixa típica", `TD deveria ser faixa típica, não limite. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("pede confirmação")), `TD deveria pedir confirmação. Recebido: ${analysis.refrigeration?.hypothesis}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("não condena")), `TD não deveria condenar componente. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: 10 partidas por hora com soft-starter deve exceder limite de 6", () => {
        const analysis = analyzeSupportCase("Compressor Maneurop com soft-starter fazendo 10 partidas por hora", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "limite oficial", `Partidas deveriam usar limite oficial. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("limite de 6")), `Deveria aplicar limite 6. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: desequilíbrio de 3% deve ultrapassar limite oficial de 2%", () => {
        const analysis = analyzeSupportCase("Desequilíbrio de tensão 3% entre fases", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "limite oficial", `Desequilíbrio deveria ser limite oficial. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("2%")), `Deveria citar limite 2%. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: pré-resfriador com leite a 30C deve ser investigado antes do gás", () => {
        const analysis = analyzeSupportCase("Tem pré-resfriador a placas, mas o leite entra no tanque a 30 C", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "faixa típica", `Pré-resfriador deveria usar faixa típica. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(Boolean(analysis.refrigeration?.action.includes("vazão")), `Deveria verificar vazão da placa. Recebido: ${analysis.refrigeration?.action}`);
        assert(Boolean(analysis.refrigeration?.action.includes("antes de alterar carga")), `Não deveria mexer no gás primeiro. Recebido: ${analysis.refrigeration?.action}`);
    });

    test("Suporte REF: agitador parado deve priorizar troca térmica, não retorno automático", () => {
        const analysis = analyzeSupportCase("Agitador parado durante o resfriamento e leite congela no fundo", "REF", {});
        assert(analysis.refrigeration?.evidenceClass === "hipótese diagnóstica", `Agitador deveria ser hipótese. Recebido: ${analysis.refrigeration?.evidenceClass}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("perda de troca térmica")), `Deveria explicar a troca térmica. Recebido: ${analysis.refrigeration?.hypothesis}`);
        assert(Boolean(analysis.refrigeration?.hypothesis.includes("não prova retorno")), `Não deveria concluir retorno de líquido. Recebido: ${analysis.refrigeration?.hypothesis}`);
    });

    test("Suporte REF: tanque multicircuito deve pedir comparação lado a lado", () => {
        const prompts = [
            "Tanque 20000L com 4 compressores, o circuito 2 nao gela igual aos outros.",
            "Tanque 20000L, um compressor gela e o outro nao.",
            "Tanque 20000L de 4 compressores, so um circuito esta gelando.",
            "Dois circuitos, um gela e o outro nao.",
            "Tanque multicircuito, o circuito 2 nao gela.",
            "Tanque com 4 circuitos, um deles nao gela.",
            "No circuito 1 a pressao esta boa mas no circuito 2 esta baixa."
        ];

        prompts.forEach(prompt => {
            const analysis = analyzeSupportCase(prompt, "REF", {});
            assert(analysis.refrigeration?.evidenceClass === "hipótese diagnóstica", `Multicircuito deveria orientar método para: ${prompt}`);
            assert(Boolean(analysis.refrigeration?.questions[0].includes("cada circuito")), `Deveria comparar circuitos para: ${prompt}. Recebido: ${analysis.refrigeration?.questions.join(' | ')}`);
        });
    });

    test("Suporte local: resposta visível deve usar Sup.Aque/Sub.Res sem SH/SC", () => {
        const result = localSupportService.generateResponse(
            "R404A com SH=18K e SC=1K",
            "REF",
            { refrigerant: "R-404A" }
        );
        assert(result.text.includes("Sup.Aque") && result.text.includes("Sub.Res"), `Resposta deveria usar termos visíveis aprovados. Recebido: ${result.text}`);
        assert(!/\bSH\b|\bSC\b/.test(result.text), `Resposta não pode exibir SH/SC. Recebido: ${result.text}`);
    });

    test("Suporte: saída online e local deve normalizar siglas de campo", () => {
        const normalized = normalizeSupportFieldTerminology("SH alto, SC baixo: confira VET ou TXV.");
        assert(normalized === "Sup.Aque alto, Sub.Res baixo: confira válvula de expansão.", `Normalização incorreta. Recebido: ${normalized}`);
        assert(!/\bSH\b|\bSC\b|\bVET\b|\bTXV\b/i.test(normalized), `Siglas proibidas permaneceram na saída. Recebido: ${normalized}`);
    });

    test("Suporte REF: descarga sem ambiente deve pedir ar de entrada", () => {
        const analysis = analyzeSupportCase(
            "R404A com pressão de descarga 300 PSI",
            "REF",
            { refrigerant: "R-404A" }
        );
        assert(Boolean(analysis.refrigeration?.questions[0].includes("ar entrando")), `Deveria pedir ar de entrada. Recebido: ${analysis.refrigeration?.questions.join(' | ')}`);
        assert(Boolean(analysis.refrigeration?.action.includes("Não classifique")), `Ação deveria impedir conclusão sem ambiente. Recebido: ${analysis.refrigeration?.action}`);
    });

    test("Suporte REF: pressão sem fluido deve pedir confirmação antes de comparar", () => {
        const analysis = analyzeSupportCase("pressão de sucção 45 PSI", "REF", {});
        assert(!analysis.refrigeration?.refrigerant, "Fluido não deveria ser inventado.");
        assert(Boolean(analysis.refrigeration?.questions[0].includes("fluido")), `Deveria pedir o fluido. Recebido: ${analysis.refrigeration?.questions.join(' | ')}`);
    });

    test("Suporte REF: capacidade de 10 mil litros não deve virar pressão", () => {
        const analysis = analyzeSupportCase(
            "Tanque 10 mil litros R404A demora para gelar",
            "REF",
            { model: "10000L", refrigerant: "R-404A" }
        );
        assert(!analysis.refrigeration, `Capacidade não deveria gerar leitura de pressão. Recebido: ${JSON.stringify(analysis.refrigeration)}`);
    });

    test("Suporte REF: fallback local deve priorizar pressão muito improvável", () => {
        const result = localSupportService.generateResponse(
            "R404A com pressão de sucção 22 PSI no circuito 1",
            "REF",
            { refrigerant: "R-404A", model: "10000L" }
        );
        assert(result.text.includes("muito abaixo"), `Fallback deveria destacar a leitura improvável. Recebido: ${result.text}`);
        assert(result.text.includes("Não complete carga"), `Fallback deveria bloquear ajuste prematuro. Recebido: ${result.text}`);
    });

    test("Base técnica: não deve manter os quatro conflitos frigoríficos corrigidos", () => {
        const combined = `${TECHNICAL_CONTEXT}\n${KNOWLEDGE_BASE}\n${FAQ_DATABASE}`;
        assert(!combined.includes("retorno brutal de líquido"), "Agitador parado não pode implicar retorno automático.");
        assert(!combined.includes("R-404A exige óleo polioléster"), "Óleo não pode ser definido apenas pelo refrigerante.");
        assert(!combined.includes("despencando a pressão"), "Bulbo solto não pode indicar pressão no sentido errado.");
        assert(!combined.includes("impossibilita golpe de líquido"), "Pump-down não pode ser descrito como proteção absoluta.");
        assert(REFRIGERATION_SUPPORT_REFERENCE_CONTEXT.includes("FAIXA TÍPICA"), "Referência estruturada deve distinguir faixa típica.");
        assert(REFRIGERATION_SUPPORT_REFERENCE_CONTEXT.includes("tanque multicircuito"), "Referência deve exigir comparação por circuito.");
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

    test("Suporte: busca elétrica sem acentos deve continuar puxando o esquema", () => {
        const analysis = analyzeSupportCase(
            "a contatora nao fecha e o disjuntor motor esta desarmando",
            "ELEC",
            {}
        );
        assert(analysis.electrical?.symptom === "contatora não fecha", `Busca sem acentos perdeu o sintoma. Recebido: ${analysis.electrical?.symptom}`);
        assert(Boolean(analysis.electrical?.action.includes("A1/A2")), `Busca sem acentos deve manter a rota de esquema. Recebido: ${analysis.electrical?.action}`);
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
