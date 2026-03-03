
export const ELECTRICAL_DATABASE = `
[BANCO DE DADOS DE ESQUEMAS ELÉTRICOS ORDEMILK]

1. TANQUE TL.UF (UNIDADE FIXA - MODO AUTOMÁTICO):
   - Tensão: 1~220 VCA.
   - Controlador: Ageon MT-516CVT.
   - Régua de Bornes (X4):
     * U: Sinal de acionamento do Resfriador.
     * A: Sinal de acionamento do Agitador.
     * S6/N: Alimentação (Vem do quadro geral X1).
     * T6: Alimentação (Vem do quadro geral X1).
   - Cores: Vermelho (Fase/Neutro de comando). Cabo 1mm para comando.

2. QUADROS DE LIMPEZA AUTOMÁTICA (BOUMATIC, LELY, DELAVAL, GEA):
   - CLP: Panasonic FP-X0 L40MR.
   - Expansão/Comunicação: Novus DigiRail 2A RS485.
   - Fonte: 24VCC 2,5A.
   - Lógica de Saídas (Relés de Borne):
     * RL1: Relé de Nível Tanque (Bobina 24VCC).
     * RL2/3/4/28: Alarmes Compressores (NC Disjuntor Motor).
     * RL9/10: Válvulas Água Fria/Quente (Saídas Sólidas Y5/Y6).
     * RL15/16/17/31: Acionamento Compressores (Saídas Sólidas YB/YC/YD).
     * RL20: Status Refrigeração (Saída Y0).
     * RL23-26: Válvulas PNEUMÁTICAS (Saídas Y10-Y13).
   - Sensor de Temperatura: Entrada Analógica do CLP (Fio azul lado esquerdo). Resistor 2K2 obrigatório na entrada.

3. TANQUE MT50 (TRIFÁSICO 380V - UNIDADE FIXA):
   - Disjuntor Motor (DM1): Ajuste 4 a 6,3A.
   - Controlador: Full Gauge (Parâmetros: Cd=28, r0=1.5, d1=15min, d2=2min).
   - Régua de Bornes (X1):
     * 1/2/3: Entrada L1/L2/L3 (380V).
     * RU1/SU1/TU1: Saída Força Resfriador.
     * RA/NA: Saída Força Agitador.
     * U/P: Sinal Pressostato.
     * N: Neutro.

4. TANQUE 20000L (4 UNIDADES REMOTAS - TRIFÁSICO 220V):
   - Disjuntor Geral: 200A.
   - Partida Compressores: Soft Starter WEG SSW-05.
   - Aquecedor de Carter: AC-230V, 27W.
   - Proteção: Relé de Falta de Fase (RFF) e DPS (Dispositivos de Surto).
   - Cabos: Entrada 70mm HEPR. Distribuição interna 10mm. Comando 1mm.

5. TANQUE AGRANEL MONOFÁSICA (OM 02 - 220V):
   - Controlador: Ageon MT-516CVT.
   - Régua de Bornes (X1):
     * 1 (R): Sinal Pressostato.
     * 2 (A): Sinal Agitador (Saída Contatora).
     * 3 (N): Sinal Agitador (Saída Contatora).
     * 4 (NP): Retorno do cabo DC1.
     * 5/6: Alimentação 220VCA.
   - Capacitor de Partida (CS) e Permanente (CR) integrados no compressor.

[PARÂMETROS PADRÃO CONTROLADORES (AGEON/FULL GAUGE)]
- Cd (Acesso): 28.
- r0 (Histerese): 1.5K.
- r1/r2 (Setpoints): -2°C a 10°C.
- d1 (Agitador Desligado): 15 min.
- d2 (Agitador Ligado): 2 min.
- u1/u2 (Proteção Tensão): 200V a 240V.
`;
