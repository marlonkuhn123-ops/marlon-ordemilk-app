export const SCHEMATICS_DATABASE = `
[DETALHAMENTO TÉCNICO DOS ESQUEMAS ELÉTRICOS ORDEMILK]

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

4. TANQUE 20000L (4 UNIDADES REMOTAS - TRIFÁSICO 220V):
   - Partida: Soft Starter WEG SSW-05.
   - Proteção: Relé de Falta de Fase (RFF) e DPS.
   - Cabos: Entrada 70mm HEPR.

5. TANQUE AGRANEL MONOFÁSICA (OM 02 - 220V):
   - Controlador: Ageon MT-516CVT.
   - Régua de Bornes (X1):
     * 1 (R): Sinal Pressostato.
     * 2 (A): Sinal Agitador (Saída Contatora).
     * 3 (N): Sinal Agitador (Saída Contatora).

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
