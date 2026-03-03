
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

6. CIP DE LIMPEZA (2, 3 E 4 COMPRESSORES) - PADRÃO:
   - CLP: Panasonic FP-X0 L40MR.
   - Fonte: 24VCC 2,5A.
   - Lógica de Saídas (Relés de Borne):
     * RL01: Relé de Nível (Bobina 24VCC_VEM DO CONTATO NA RELÉ NÍVEL).
     * RL02/03/04: Alarme Compressores 01/02/03 (Bobina 220VCA_VEM DO CONTATO AUXILIAR NC DISJUNTOR MOTOR).
     * RL05: Alarme Bomba Limpeza (Bobina 220VCA_VEM DO CONTATO AUXILIAR NC DISJUNTOR MOTOR).
     * RL06: Alarme Agitador (Bobina 220VCA_VEM DO CONTATO AUXILIAR NC DISJUNTOR MOTOR).
     * RL07: Alarme Falta de Fase (Bobina 220VCA_VEM DO CONTATO NC RELÉ FALTA DE FASE).
     * RL08: Habilita Limpeza (Bobina 24VCC_VEM SAÍDA Y4 CLP).
     * RL09: Válvula de Água Fria (Bobina 24VCC_VEM SAÍDA Y5 CLP).
     * RL10: Válvula de Água Quente (Bobina 24VCC_VEM SAÍDA Y6 CLP).
     * RL11: Aciona Drenagem (Bobina 24VCC_VEM SAÍDA Y7 CLP).
     * RL12: Dosadora de Ácido (Bobina 24VCC_VEM SAÍDA Y8 CLP).
     * RL13: Dosadora de Alcalino (Bobina 24VCC_VEM SAÍDA Y9 CLP).
     * RL14: Dosadora de Sanitizante (Bobina 24VCC_VEM SAÍDA YA CLP).
     * RL15/16/17: Aciona Compressores 01/02/03 (Bobina 24VCC_VEM SAÍDA YB/YC/YD CLP).
     * RL18: Aciona Agitadores (Bobina 24VCC_VEM SAÍDA YE CLP).
     * RL19: Habilita Modo Manual (Bobina 24VCC_VEM SAÍDA YF CLP).

7. QUADRO DE COMANDO LIMPEZA AUTOMÁTICA 2 COMPRESSORES STANDART COM SINAIS PARA PULMÃO:
   - CLP: Panasonic FP-X0 L40MR.
   - Lógica de Saídas (Relés de Borne):
     * RL18: Sinal para Habilitar Compressor 02 (24Vcc / Bobina 24Vcc_Vem do contato saída CLP YD).
     * RL21: Sinal que vem do Sensor Registro de Descarregamento do Leite (24Vcc / Bobina 24Vcc_Vem do sinal externo do sensor).
     * RL22: Sinal que vem do Sensor Registro de Descarregamento do Leite (24Vcc / Bobina 24Vcc_Vem do sinal externo do sensor).
     * RL23: Sinal de Monitoramento Válvula 07 - Dreno Final Tanque de Limpeza (24Vcc / Bobina 24Vcc_Vem do sinal externo válvula 07).
     * RL24: Sinal Avisando Coleta do Leite - Descarregamento de Leite (24Vcc / Bobina 24Vcc_Vem do contato saída CLP YC).
     * RL25: Sinal Avisando que Tanque está em Processo de Limpeza (24Vcc / Bobina 24Vcc_Vem do contato saída CLP Y0).

[PARÂMETROS PADRÃO CONTROLADORES (AGEON/FULL GAUGE)]
- Cd (Acesso): 28.
- r0 (Histerese): 1.5K.
- r1/r2 (Setpoints): -2°C a 10°C.
- d1 (Agitador Desligado): 15 min.
- d2 (Agitador Ligado): 2 min.
- u1/u2 (Proteção Tensão): 200V a 240V.

[DIRETRIZES DE DIAGNÓSTICO DE COMPONENTES ESPECÍFICOS ORDEMILK]
ATENÇÃO: Siga estas regras estritamente ao diagnosticar os componentes abaixo:

- AGITADOR: O diagnóstico do agitador é PURAMENTE ELÉTRICO E DE COMANDO. NUNCA sugira verificações mecânicas (como "girar as pás manualmente"). Se o agitador não liga, foque em:
  1. Parâmetros do controlador (Verifique os tempos d1 e d2).
  2. Saída de comando do controlador (Bornes A ou RA/NA).
  3. Contatora do agitador (bobina ou contatos).
  4. Integridade do motor elétrico (medir resistência/tensão).

- BOMBA DE LIMPEZA (CIP): Se a bomba de limpeza não liga ou não aciona, a causa MAIS PROVÁVEL no sistema Ordemilk é o RELÉ DE NÍVEL (RL1 ou RL01) que não detectou água/solução suficiente, ou falha no próprio sensor de nível. Foque o diagnóstico no circuito do relé de nível antes de condenar a bomba. Outra causa comum é o disjuntor motor da bomba desarmado.
`;
