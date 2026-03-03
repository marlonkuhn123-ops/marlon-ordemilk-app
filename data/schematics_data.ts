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
`;
