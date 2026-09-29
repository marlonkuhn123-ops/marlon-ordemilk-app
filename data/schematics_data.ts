export const SCHEMATICS_DATABASE = `
[REGRAS OBRIGATÓRIAS DE USO DOS ESQUEMAS ELÉTRICOS]
1. NUNCA misture esquemas de 220 V com esquemas de 380 V.
2. NUNCA misture famílias de 4 unidades remotas com famílias de 5 unidades remotas.
3. NUNCA misture famílias de 4 compressores com famílias de 5 compressores.
4. NUNCA misture tanque sem limpeza com tanque de limpeza automática.
5. NUNCA misture painel principal com painel CIP.
6. STATUS DO ARQUIVO:
   - ATIVO: Referência principal da família. Priorizar em respostas, diagnósticos e explicações.
   - SUBSTITUÍDO / HISTÓRICO: Usar apenas para comparação, rastreabilidade ou consulta histórica. Não usar como primeira referência se houver um ATIVO.
   - DUPLICADO: Cópia de um arquivo principal. Ignorar como referência independente.
   - EM REVISÃO: NÃO usar como base principal de diagnóstico, funcionamento ou resposta automática. Citar apenas como material pendente de validação manual.
   - LEGADO SEM SUBSTITUTO: Usar apenas quando não existir arquivo ativo mais novo e claramente equivalente.
7. Antes de responder, identifique obrigatoriamente: tensão, quantidade de compressores, quantidade de unidades remotas, tipo de limpeza, presença de painel CIP, integração com robô, capacidade do tanque e versão do documento. Se ambíguo, peça refinamento.
8. Ao responder diagnóstico, informe qual família foi usada como base (ex: "família 20000L 4 compressores 220 V limpeza automática").
9. CAPACIDADE EM FAIXA: quando a família declarar uma faixa (ex: "6000L a 15000L"), o MESMO esquema vale para todas as capacidades da faixa. O que define a família é a tensão e a quantidade de compressores/unidades, NÃO a litragem impressa no nome do arquivo. Nunca negue o esquema ao técnico só porque ele informou uma litragem diferente da que aparece no nome do arquivo: confirme tensão e quantidade de compressores e responda.
10. O NOME DO ARQUIVO NÃO É CONFIÁVEL. Vale o que está escrito DENTRO do desenho (bloco de título da capa). Casos reais já confirmados nesta base:
   - Todos os arquivos cujo nome diz "UNIDADE SEPARADA" trazem "2 UNIDADE REMOTA" no bloco de título. Em Ordemilk, "unidade separada" e "unidade remota" são o MESMO conceito escrito de formas diferentes. Não trate como famílias distintas nem peça ao técnico para diferenciar as duas palavras.
   - "QUADRO COMANDO 1 UNIDADE SEPARADA 3~220V AUTOMÁTICO" é, no desenho, 1~220 VCA MONOFÁSICO, e não trifásico como o nome sugere.
   - "PE - TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI-AUTO - 3~220V" tem a capa errada (diz mono-bifásico), enquanto o nome e o subtítulo interno dizem trifásico 220 V.
   Quando houver contradição, diga isso ao técnico em vez de escolher em silêncio.

[BASE DE DADOS CONSOLIDADA DE ESQUEMAS ELÉTRICOS]

--- FAMÍLIA: 6000L, 3 UNIDADES REMOTAS, 3 COMPRESSORES, LIMPEZA AUTOMÁTICA, MONOFÁSICO 220 V ---
Arquivo: PE - TANQUE 6000L LIMPEZA AUTOMATICA - MONOFÁSICO 220V - V1.0.1
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 220 V Monofásico
- capacidade_do_tanque: 6000L
- quantidade_de_unidades_remotas: 3 (declarado na capa do desenho)
- quantidade_de_compressores: 3 (DM1, DM2, DM3)
- tipo_de_limpeza: Automática
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.1
- observacao_tecnica: Versão MONOFÁSICA. O desenho traz os três compressores marcados como MT 50, que no catálogo de peças corresponde ao tanque de 6.000L. Não use esta versão para 8.000L ou mais - acima de 6.000L a linha é trifásica. Para os demais tanques da faixa use a versão trifásica 220 V ou 380 V.
- confianca_da_classificacao: Alta (lido no desenho)

--- FAMÍLIA: 6000L a 15000L, 3 UNIDADES REMOTAS, 3 COMPRESSORES, LIMPEZA AUTOMÁTICA, TRIFÁSICO 220 V ---
Arquivo: PE - TANQUE 6000L LIMPEZA AUTOMATICA - TRIFÁSICO 220V - V1.0.1
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 220 V Trifásico
- capacidade_do_tanque: 6000L, 8000L, 10000L, 12000L e 15000L
- quantidade_de_unidades_remotas: 3 (declarado na capa do desenho)
- quantidade_de_compressores: 3 (DM1, DM2, DM3)
- tipo_de_limpeza: Automática
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.1
- observacao_tecnica: FAIXA CONFIRMADA NO PRÓPRIO DESENHO: a tabela de comprimento de cabos do painel CIP de 3 compressores tem uma linha por tanque - 6.000, 8.000, 10.000, 12.000 e 15.000 LTS. O mesmo esquema atende essa faixa inteira, inclusive 8.000L. A capa declara "3 UNIDADE REMOTA" e o desenho tem DM1, DM2 e DM3 (um disjuntor-motor por compressor). A partir de 20.000L a linha passa para 4 compressores, que é outra família. ATENÇÃO ao ajustar proteção: o MODELO do compressor muda dentro da faixa (6.000L usa MT50; 10.000L e 12.000L usam MT100; 15.000L usa MT125, conforme o catálogo de peças), portanto corrente de placa, ajuste do disjuntor-motor e bitola de cabo NÃO são iguais em toda a faixa. Confira sempre a placa do compressor instalado.
- confianca_da_classificacao: Alta (faixa lida na tabela de cabos do desenho)

--- FAMÍLIA: 6000L a 15000L, 3 UNIDADES REMOTAS, 3 COMPRESSORES, LIMPEZA AUTOMÁTICA, TRIFÁSICO 380 V ---
Arquivo: PE - TANQUE 6000L LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.1
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 380 V Trifásico
- capacidade_do_tanque: 6000L, 8000L, 10000L, 12000L e 15000L
- quantidade_de_unidades_remotas: 3 (declarado na capa do desenho)
- quantidade_de_compressores: 3 (DM1, DM2, DM3)
- tipo_de_limpeza: Automática
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.1
- observacao_tecnica: FAIXA CONFIRMADA NO PRÓPRIO DESENHO: a tabela de comprimento de cabos do painel CIP de 3 compressores tem uma linha por tanque - 6.000, 8.000, 10.000, 12.000 e 15.000 LTS. O mesmo esquema atende essa faixa inteira, inclusive 8.000L. A capa declara "3 UNIDADE REMOTA" e o desenho tem DM1, DM2 e DM3 (um disjuntor-motor por compressor). A partir de 20.000L a linha passa para 4 compressores, que é outra família. ATENÇÃO ao ajustar proteção: o MODELO do compressor muda dentro da faixa (6.000L usa MT50; 10.000L e 12.000L usam MT100; 15.000L usa MT125, conforme o catálogo de peças), portanto corrente de placa, ajuste do disjuntor-motor e bitola de cabo NÃO são iguais em toda a faixa. Confira sempre a placa do compressor instalado.
- confianca_da_classificacao: Alta (faixa lida na tabela de cabos do desenho)

PAINEL CIP QUE ACOMPANHA ESTA FAMÍLIA: o lado da limpeza dos tanques de 6.000L a 15.000L é o "PAINEL CIP 3 COMPRESSORES SEM REGUA" (sem régua eletrônica) ou o "ESQUEM_2" (com régua eletrônica, para robô Lely, Delaval e GEA). Os dois trazem a mesma tabela de tanques 6.000/8.000/10.000/12.000/15.000 LTS.

--- FAMÍLIA: 20000L, 4 UNIDADES REMOTAS, 4 COMPRESSORES, LIMPEZA AUTOMÁTICA, TRIFÁSICO 220 V ---
Arquivo: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 220V
- data_da_consolidacao: 2026-03-09
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 220 V Trifásico
- capacidade_do_tanque: 20000L
- quantidade_de_unidades_remotas: 4
- quantidade_de_compressores: 4
- tipo_de_limpeza: Automática
- integracao_com_robo: Não especificado
- arquivo_principal_da_familia: Sim
- substitui_qual: TANQUE 20.000 LTS TRIFÁSICO 220V
- versao_do_documento: Atual
- observacao_tecnica: Disjuntor Geral 200A, Soft Starter Danfoss 75A, Disjuntores Motor 44A.
- confianca_da_classificacao: Alta

Arquivo: TANQUE 20.000 LTS TRIFÁSICO 220V
- data_da_consolidacao: 2026-03-09
- status_do_arquivo: HISTÓRICO / SUBSTITUÍDO
- familia_do_painel: Painel Principal
- tensao: 220 V Trifásico
- capacidade_do_tanque: 20000L
- quantidade_de_unidades_remotas: 4
- quantidade_de_compressores: 4
- tipo_de_limpeza: Automática
- integracao_com_robo: Não especificado
- arquivo_principal_da_familia: Não
- substitui_qual: N/A
- versao_do_documento: Antiga
- observacao_tecnica: Substituído pelo modelo PE.
- confianca_da_classificacao: Média

--- FAMÍLIA: 20000L, 4 UNIDADES REMOTAS, 4 COMPRESSORES, LIMPEZA AUTOMÁTICA, TRIFÁSICO 380 V ---
Arquivo: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 380V
- data_da_consolidacao: 2026-03-09
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 380 V Trifásico
- capacidade_do_tanque: 20000L
- quantidade_de_unidades_remotas: 4
- quantidade_de_compressores: 4
- tipo_de_limpeza: Automática
- integracao_com_robo: Não especificado
- arquivo_principal_da_familia: Sim
- substitui_qual: N/A
- versao_do_documento: Atual
- observacao_tecnica: Disjuntor Geral 160A, Soft Starter Danfoss 48A, Disjuntores Motor 30,5A.
- confianca_da_classificacao: Alta

--- FAMÍLIA: 20000L a 40000L, 5 UNIDADES REMOTAS, 5 COMPRESSORES, LIMPEZA AUTOMÁTICA, TRIFÁSICO 380 V ---
Arquivo: PE - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0
- data_da_consolidacao: 2026-03-09
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: 380 V Trifásico
- capacidade_do_tanque: 20000L a 40000L
- quantidade_de_unidades_remotas: 5
- quantidade_de_compressores: 5
- tipo_de_limpeza: Automática
- integracao_com_robo: Não especificado
- arquivo_principal_da_familia: Sim
- substitui_qual: N/A
- versao_do_documento: V1.0
- observacao_tecnica: Possui referências dedicadas a compressor 05, ventilador 05, pressostato 05, válvula solenóide 05, sobrecarga do compressor 05 e soft-starter 05. Disjuntor Geral 125A.
- confianca_da_classificacao: Alta

Arquivo: PM - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.0
- data_da_consolidacao: 2026-03-09
- status_do_arquivo: EM REVISÃO
- familia_do_painel: Painel Principal
- tensao: 380 V Trifásico
- capacidade_do_tanque: 20000L a 40000L
- quantidade_de_unidades_remotas: 5
- quantidade_de_compressores: 5 (Nome) / 4 (Conteúdo)
- tipo_de_limpeza: Automática
- integracao_com_robo: Não especificado
- arquivo_principal_da_familia: Não
- substitui_qual: N/A
- versao_do_documento: V1.0.0
- observacao_tecnica: O nome do arquivo indica 5 compressores, porém o conteúdo interno visível ainda aparenta base de 4 compressores. Não pode substituir automaticamente nem o modelo de 4 compressores nem o modelo novo PE de 5 compressores.
- confianca_da_classificacao: Baixa

--- FAMÍLIA: 2 UNIDADES REMOTAS, 2 COMPRESSORES (linha "PE", desenhos novos de 2026) ---
NOTA DE NOMENCLATURA: os arquivos desta linha que têm "SEPARADA" no nome dizem "2 UNIDADE REMOTA" no bloco de título. É a mesma família (ver regra 10). Todos têm DM1 e DM2, um disjuntor-motor por compressor, e nenhum usa CLP: o comando é por botão/comutador direto.

Arquivo: PE - TANQUE 2 UNIDADE REMOTA SEM LIMPEZA - 1~220V - V1.0.0
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: Mono-bifásico 220 V (capa e nome concordam)
- quantidade_de_unidades_remotas: 2
- quantidade_de_compressores: 2
- tipo_de_limpeza: Sem limpeza
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.0
- observacao_tecnica: Painel só de refrigeração e agitação. Comando por botão de 3 posições (compressor/agitador) e comutador de 2 posições por compressor.
- confianca_da_classificacao: Alta

Arquivo: PE - TANQUE 2 UNIDADE SEPARADA SEM LIMPEZA - 3~220V - V1.0.0
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: Trifásico 220 V (capa: "PAINEL TRIFÁSICO 220V")
- quantidade_de_unidades_remotas: 2 (a capa diz "2 UNIDADE REMOTA" mesmo o nome dizendo "SEPARADA")
- quantidade_de_compressores: 2
- tipo_de_limpeza: Sem limpeza
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.0
- confianca_da_classificacao: Alta

Arquivo: PE - TANQUE 2 UNIDADE REMOTA SEM LIMPEZA - 3~380V - V1.0.0
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: Trifásico 380 V (capa e nome concordam)
- quantidade_de_unidades_remotas: 2
- quantidade_de_compressores: 2
- tipo_de_limpeza: Sem limpeza
- arquivo_principal_da_familia: Sim
- substitui_qual: TANQUE SEM LIMPEZA 2 UNIDADE REMOTA 3_380V (desenho antigo da mesma família)
- versao_do_documento: V1.0.0
- confianca_da_classificacao: Alta

Arquivo: PE - TANQUE 2 UNIDADES SEPARADA LIMPEZA SEMI-AUTO - V1.0.0
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: Mono-bifásico 220 V (capa e subtítulo concordam; o nome do arquivo não traz a tensão)
- quantidade_de_unidades_remotas: 2
- quantidade_de_compressores: 2
- tipo_de_limpeza: Semi-automática
- arquivo_principal_da_familia: Sim
- versao_do_documento: V1.0.0
- observacao_tecnica: É a versão MONO-BIFÁSICA 220 V da limpeza semi-automática. Semi-automática aqui significa botão local Start/Stop de limpeza (B3) e temporizador de retardo do compressor 02, SEM o CLP do painel CIP executando a receita.
- confianca_da_classificacao: Alta

Arquivo: PE - TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI-AUTO - 3~220V
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO COM RESSALVA
- familia_do_painel: Painel Principal
- tensao: Trifásico 220 V (nome do arquivo e subtítulo interno dizem trifásica 220 V)
- quantidade_de_unidades_remotas: 2
- quantidade_de_compressores: 2
- tipo_de_limpeza: Semi-automática
- arquivo_principal_da_familia: Sim
- versao_do_documento: NÃO declarada no nome do arquivo (é o único da linha PE sem versão)
- observacao_tecnica: ATENÇÃO - CONTRADIÇÃO DENTRO DO PRÓPRIO DESENHO. A capa diz "PAINEL MONO-BIFÁSICO 220V", mas o nome do arquivo e o subtítulo interno dizem trifásica 220 V. A capa aparenta ter sido copiada da versão mono-bifásica e não corrigida. Antes de dimensionar proteção com este desenho, confirme no painel se a entrada é mesmo trifásica, e avise o técnico dessa divergência.
- confianca_da_classificacao: Média (contradição interna no desenho)

Arquivo: PE - TANQUE 2 UNIDADES SEPARADA LIMPEZA SEMI-AUTO - 3~380V - V1.0.0
- data_da_consolidacao: 2026-09-28
- status_do_arquivo: ATIVO
- familia_do_painel: Painel Principal
- tensao: Trifásico 380 V (capa e nome concordam)
- quantidade_de_unidades_remotas: 2 (capa diz "2 UNIDADE REMOTA")
- quantidade_de_compressores: 2
- tipo_de_limpeza: Semi-automática
- arquivo_principal_da_familia: Sim
- substitui_qual: TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI 3_380V (desenho antigo da mesma família)
- versao_do_documento: V1.0.0
- confianca_da_classificacao: Alta

--- FAMÍLIAS LEGADO SEM SUBSTITUTO ---
(Manter ativos ou como legado sem substituto, conforme o caso)

Arquivo: Tanque sem limpeza 2 unidades remotas 380 V
- status_do_arquivo: HISTÓRICO / SUBSTITUÍDO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 2
- tipo_de_limpeza: Sem limpeza
- observacao_tecnica: Substituído por PE - TANQUE 2 UNIDADE REMOTA SEM LIMPEZA - 3~380V - V1.0.0. Usar apenas para consulta histórica.

Arquivo: Tanque 2 unidades remotas limpeza semi-automática 380 V (TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI 3_380V)
- status_do_arquivo: HISTÓRICO / SUBSTITUÍDO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 2
- quantidade_de_compressores: 2
- tipo_de_limpeza: Semi-automática
- observacao_tecnica: Substituído por PE - TANQUE 2 UNIDADES SEPARADA LIMPEZA SEMI-AUTO - 3~380V - V1.0.0, que apesar do "SEPARADA" no nome é a mesma família (capa diz "2 UNIDADE REMOTA"). O desenho antigo identifica o tanque como TL.UR e cita os compressores MT22, MT28, MT36, MT40 e MT50. Usar só para consulta histórica.

Arquivo: Tanque 2 unidades limpeza automática 380 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 2
- tipo_de_limpeza: Automática

Arquivo: Tanque 3 unidades limpeza automática 380 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 3
- tipo_de_limpeza: Automática

Arquivo: Quadro comando 1 unidade separada 3~220 V automático
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 1~220 VCA MONOFÁSICO. ATENÇÃO: o nome do arquivo diz "3~220V", mas o desenho diz "1 ~220 VCA". Vale o desenho (regra 10). Não dimensione proteção trifásica com base no nome deste arquivo.
- quantidade_de_unidades_remotas: 1
- tipo_de_limpeza: Automática
- observacao_tecnica: É o tanque TL.UF (unidade fixa) em modo automático, com controlador Ageon MT-516CVT, régua X3 e fusíveis F1/F2. O desenho usa as duas expressões, "UNIDADE FIXA" na etiqueta e "MODO AUTOMÁTICO UNIDADE REMOTA" no título.

Arquivo: Painel CIP 2 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 2

Arquivo: Painel CIP 3 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 3
- capacidade_do_tanque: 6.000, 8.000, 10.000, 12.000 e 15.000 LTS (tabela de cabos impressa no desenho)
- observacao_tecnica: É o painel de limpeza que acompanha a família de 3 compressores / 3 unidades remotas. Versão SEM régua eletrônica. A versão COM régua eletrônica para robô é o ESQUEM_2.

Arquivo: Painel CIP 4 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 4

Arquivo: Quadro limpeza com régua eletrônica QCLA3STRE
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP

Arquivo: Esquemas de limpeza com robô (ESQUEMA ELETRICO E DE MONTAGEM LIMPEZA ROBO BOUMATIC)
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP (limpeza)
- integracao_com_robo: Sim (Boumatic)
- tensao: 1~220 VCA
- capacidade_do_tanque: 6.000, 8.000, 10.000, 12.000 e 15.000 LTS (mesma tabela de cabos dos demais CIP)
- versao_do_documento: data 03/2022

Arquivo: Esquemas agranel monofásico 220 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 220 V Monofásico

Arquivo: Tanque 2 compressores para pulmão
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- quantidade_de_compressores: 2

--- ARQUIVOS DE NOME GENÉRICO JÁ IDENTIFICADOS PELO CONTEÚDO ---
Arquivo: ESQUEM_2
- status_do_arquivo: ATIVO
- familia_do_painel: Painel CIP (limpeza)
- tensao: 1~220 VCA
- quantidade_de_compressores: 3
- tipo_de_limpeza: Automática com régua eletrônica
- integracao_com_robo: Sim (Lely, Delaval e GEA)
- capacidade_do_tanque: 6.000, 8.000, 10.000, 12.000 e 15.000 LTS
- versao_do_documento: V1.0, data 10/2021
- observacao_tecnica: O nome do arquivo é genérico, mas o desenho é claro: "QUADRO DE COMANDO 3 COMPRESSORES - LIMPEZA AUTOMÁTICA COM RÉGUA ELETRÔNICA - PARA ROBÔ LELY, DELAVAL e GEA". É o lado CIP da família de 3 compressores (6.000L a 15.000L). Traz CLP, botoeira de emergência e relé de nível, e a tabela de comprimento de cabos por litragem do tanque.
- confianca_da_classificacao: Alta (lido no desenho)

[DETALHAMENTO TÉCNICO GERAL DOS ESQUEMAS ELÉTRICOS ORDEMILK]
REGRA GERAL DE EQUIPAMENTOS:
- Tanques de 4.000 LITROS OU MAIS (4k, 6k, 10k, 20k, etc.): Utilizam obrigatoriamente CLP Panasonic FP-X0 L40MR.
  * Saída Agitador: Saída YE do CLP -> Aciona Relé de Borne RL6 (ou RL18 nos quadros novos).
  * Saída Resfriador: Saídas YB/YC/YD -> Acionam Relés RL15/16/17.
- Tanques MENORES que 4.000 litros: Utilizam controladores eletrônicos.
  * Ageon: Borne A (Agitador) e Borne U (Resfriador).
  * Full Gauge: Bornes RA/NA (Agitador) e RU1/SU1/TU1 (Resfriador).

1. TANQUE TL.UF (MODO AUTOMÁTICO UNIDADE REMOTA):
   - Tensão: 1~220 VCA.
   - Componentes: Controlador Ageon MT-516CVT, Botão Automático, Botão Manual Compressor, Botão Manual Agitador, Fusíveis F1/F2.
   - Régua de Bornes (X3):
     * 1/2: Alimentação T6/S6.
     * 3/4: Saída para Compressor/Agitador.
   - Observação: Se receber "N" do painel principal, vira S6 na saída do borne 2-X3.

2. QUADRO DE COMANDO LIMPEZA AUTOMÁTICA (ROBÔ BOUMATIC):
   - CLP: Panasonic FP-X0 L40MR.
   - Relés de Borne (RL1 a RL32):
     * RL1: Relé de Nível Tanque (Bobina 24VCC).
     * RL5: Alarme Bomba Limpeza.
     * RL6: Alarme Agitador.
     * RL9/10: Válvulas Água Fria/Quente.
     * RL15/16/17/31: Acionamento Compressores.
     * RL23-26: Válvulas PNEUMÁTICAS.
   - Sensores: Sensor de Temperatura (Entrada Analógica, Resistor 2K2 obrigatório).

3. TANQUE MT50 (TRIFÁSICO 380V):
   - Disjuntor Motor (DM1): Ajuste 4 a 6,3A.
   - Controlador: Full Gauge.
   - Régua de Bornes (X1):
     * 1/2/3: Entrada L1/L2/L3 (380V).
     * RU1/SU1/TU1: Saída Força Resfriador.
     * RA/NA: Saída Força Agitador.

[ARQUITETURA MODULAR E DIFERENÇAS DE PROJETO]
O "tanque de leite" Ordemilk é um sistema elétrico modular dividido em dois blocos funcionais:

1. BLOCO DE FORÇA E COMANDO (PAINEL GERAL):
   - Responsável por seccionamento, proteção e acionamento (Compressores, Agitadores, Bomba de Lavagem).
   - Componentes típicos: Chave seccionadora (S1), Disjuntor Geral (DG1), DPS, Disjuntor de Comando (DC1), Disjuntores-Motor (DM), Contatoras (K), Temporizadores (T) e Relé de Falta/Sequência de Fase (RFF).
   - Versões: 1, 2, 3 ou 4 compressores/unidades remotas.

2. BLOCO DE AUTOMAÇÃO DE PROCESSO (PAINEL CIP/LIMPEZA):
   - Responsável pela lógica de lavagem, leitura de sensores e interface com robôs.
   - Componentes típicos: Fonte 24Vcc, CLP Panasonic, Relés de Interface (RL), IHM Touchscreen, Botoeira de Emergência e Relé de Nível.
   - Interface CLP/Atuadores (Relés RL8 a RL28): Habilitação limpeza, Válvulas (Água Fria/Quente/Drenagem), Dosadoras (Ácido/Alcalino/Sanitizante), Status de Refrigeração, Tanque Ocupado e Válvulas Pneumáticas.

DIFERENÇAS POR VERSÃO DE LIMPEZA:
- SEM LIMPEZA: Painel cuida apenas de refrigeração e agitação.
- SEMI-AUTOMÁTICO: Possui comando local Start/Stop para limpeza, mas sem a automação completa do CLP CIP.
- AUTOMÁTICO: Painel principal possui intertravamentos e sinais para o painel CIP, que executa a receita completa.

INTEGRAÇÃO COM ROBÔS (Boumatic, Lely, Delaval, GEA):
- Utiliza um bloco de sinais dedicado para troca de estados entre Tanque e Robô (Status de Válvula, Nível do Pulmão/Buffer, Status de Limpeza).
- Elo de ligação: Cabos multicondutores (Comunicação 16x1mm², Bomba 4x2,5mm², Válvulas 3x1mm², IHM 8x1mm²).

NOTAS ESPECIAIS:
- Tanques Grandes (ex: 20.000L): Podem utilizar Soft-Start para os compressores e partida direta para os ventiladores.
- Segurança: Intervenções exigem desenergização, bloqueio e teste de ausência de tensão por profissional habilitado.

[MAPA FUNCIONAL DO SISTEMA MODULAR]
Arquitetura: O sistema é dividido entre Painel Geral (Potência/Proteção) e Painel de Limpeza/CIP (Automação).

1. FLUXO DE SINAIS E INTERFACE:
   - Painel Geral -> Painel CIP: Alimentação (24V), Bloqueio Manual, Status Agitadores/Compressores/Bomba, Alarmes (Sobrecarga/Falta de Fase).
   - Painel CIP -> Painel Geral: Comandos de acionamento (Habilitação Refrigeração/Agitação/Limpeza).

2. DETALHAMENTO FUNCIONAL - PAINEL GERAL (CAMADA DE POTÊNCIA):
   - ENTRADAS: Alimentação 380V+PE, Pressostatos, Sensores de Temperatura, Comandos Locais.
   - PROCESSAMENTO: Cadeia de proteção (S1 -> DG1 -> DPS -> RFF -> Disjuntores-Motor). Acionamento via Contatoras (K1-K4).
   - SAÍDAS: Potência para Compressores, Agitadores e Bomba de Limpeza. Feedbacks elétricos para o CIP.

3. DETALHAMENTO FUNCIONAL - PAINEL CIP (CAMADA DE AUTOMAÇÃO):
   - ENTRADAS: Alimentação 24Vcc, IHM, Botoeira Emergência, Sensor de Nível, Status de Válvulas/Robô.
   - PROCESSAMENTO: CLP Panasonic (Cérebro) + Relés de Interface (Conversão 24V para Sinais de Comando).
   - SAÍDAS: Válvulas (Água Fria/Quente/Drenagem), Dosadoras (Ácido/Alcalino/Sanitizante), Habilitação de Motores e Status para Robô.

4. FLUXOS INTEGRADOS:
   - REFRIGERAÇÃO: Termostato/Pressostato -> Painel Geral (Valida Proteção) -> Aciona Contatoras -> Feedback para CIP.
   - AGITAÇÃO: Comando (Manual/Auto/CIP) -> Painel Geral (Aciona Motor) -> Monitora Sobrecarga.
   - LIMPEZA CIP: Habilitação -> CLP (Executa Receita) -> Comanda Válvulas/Dosadoras -> Solicita Bomba/Agitador ao Painel Geral.
   - ALARMES: Sobrecarga ou Falta de Fase no Painel Geral bloqueiam a operação e enviam sinal de Alarme para o CIP/IHM.

RESUMO EM BLOCO:
[Rede Elétrica] -> [Painel Geral (Proteção/K)] -> [Motores]
      |                   ^
      v                   | (Sinais/Permissivos)
[Painel CIP (CLP/IHM)] ---+
      |
      v
[Válvulas/Dosadoras/Robô]
`;
