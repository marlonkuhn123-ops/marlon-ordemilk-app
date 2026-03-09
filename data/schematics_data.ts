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

[BASE DE DADOS CONSOLIDADA DE ESQUEMAS ELÉTRICOS]

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

--- FAMÍLIAS LEGADO SEM SUBSTITUTO ---
(Manter ativos ou como legado sem substituto, conforme o caso)

Arquivo: Tanque sem limpeza 2 unidades remotas 380 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 2
- tipo_de_limpeza: Sem limpeza

Arquivo: Tanque 2 unidades remotas limpeza semi-automática 380 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 380 V Trifásico
- quantidade_de_unidades_remotas: 2
- tipo_de_limpeza: Semi-automática

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
- tensao: 220 V Trifásico
- quantidade_de_unidades_remotas: 1
- tipo_de_limpeza: Automática

Arquivo: Painel CIP 2 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 2

Arquivo: Painel CIP 3 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 3

Arquivo: Painel CIP 4 compressores sem régua
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP
- quantidade_de_compressores: 4

Arquivo: Quadro limpeza com régua eletrônica QCLA3STRE
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- familia_do_painel: Painel CIP

Arquivo: Esquemas de limpeza com robô
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- integracao_com_robo: Sim

Arquivo: Esquemas agranel monofásico 220 V
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- tensao: 220 V Monofásico

Arquivo: Tanque 2 compressores para pulmão
- status_do_arquivo: LEGADO SEM SUBSTITUTO
- quantidade_de_compressores: 2

--- ARQUIVOS GENÉRICOS OU AMBÍGUOS ---
Arquivo: ESQUEM_2 (e similares)
- status_do_arquivo: EM REVISÃO
- observacao_tecnica: Nome genérico, pouco descritivo ou sem família totalmente clara. Não usar como referência principal sem revisão.
- confianca_da_classificacao: Baixa

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
