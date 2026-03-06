
export const KNOWLEDGE_BASE = `
[CAMADA 1: FUNCIONAMENTO - LÓGICA E COMPONENTES]
Esta camada explica como o sistema Ordemilk deve operar e a função de cada componente.

1. ARQUITETURA MODULAR:
   - PAINEL GERAL: Camada de potência e proteção. Cuida de motores (Compressores, Agitadores, Bomba) e intertravamentos elétricos.
   - PAINEL CIP/LIMPEZA: Camada de automação. Concentra IHM, CLP e Relés de Interface para gerenciar a lógica de lavagem.
   - INTERLIGAÇÃO: Feita via borneiras e cabos multicondutores (Sinais de 24Vcc e permissivos).

2. REGRAS DE EQUIPAMENTOS:
   - Tanques >= 4.000L: CLP Panasonic FP-X0 L40MR.
   - Tanques < 4.000L: Controladores eletrônicos (Ageon/Full Gauge).

3. FUNÇÕES DOS COMPONENTES:
   - CLP: Cérebro da limpeza. Gerencia tempos, válvulas e dosadoras.
   - IHM: Interface de operação e ajuste de parâmetros.
   - DISJUNTOR-MOTOR (DM): Proteção individual de motores contra sobrecarga.
   - CONTATORA (K): Manobra de potência das cargas.
   - RELÉ DE INTERFACE (RL): Isola a saída do CLP (24Vcc) para comandar cargas de campo.
   - RFF: Monitora falta, inversão ou desequilíbrio de fase.
   - FONTE 24Vcc: Alimenta toda a automação (CLP, IHM, Sensores).

[CAMADA 2: DIAGNÓSTICO ESTRUTURADO]
Esta camada contém o raciocínio técnico para solução de falhas.

SINTOMA: Bomba de limpeza não liga
- VARIAÇÕES: "bomba parou", "bomba não parte", "lavagem sem pressão"
- CONTEXTO: IHM ligada, sem emergência ativa.
- CAUSA MAIS PROVÁVEL: Disjuntor-motor DM3 desarmado.
- CAUSAS POSSÍVEIS: Contatora K3 com defeito; Saída Y5 do CLP sem sinal; Cabo de interligação rompido.
- ORDEM DE VERIFICAÇÃO:
  1. Verificar se o disjuntor-motor DM3 está armado no painel geral.
  2. Testar se a contatora K3 fecha ao receber comando.
  3. Verificar na IHM/CLP se a saída Y5 está ativa durante a etapa de bomba.
  4. Medir continuidade do sinal entre os painéis.
- COMPONENTES: DM3, K3, Y5, RL5.
- PAINEL: Geral / CIP.
- URGÊNCIA: Alta.
- RISCO: Baixo (Mecânico).
- RESPOSTA CURTA: Verifique o disjuntor DM3 no painel geral.

SINTOMA: Agitador não liga
- VARIAÇÕES: "motor do agitador parado", "agitador não parte", "agitador sem comando"
- CONTEXTO: Pode ocorrer tanto em refrigeração quanto em limpeza.
- CAUSA MAIS PROVÁVEL: Disjuntor-motor DM4 desarmado.
- CAUSAS POSSÍVEIS: Contatora K4 sem energização; Saída YE do CLP sem sinal; Alarme de sobrecarga ativo.
- ORDEM DE VERIFICAÇÃO:
  1. Verificar disjuntor-motor DM4.
  2. Verificar se a contatora K4 recebe 220V na bobina.
  3. Verificar sinal de agitador na borneira de interligação.
- COMPONENTES: DM4, K4, YE, RL6.
- PAINEL: Geral / CIP.

SINTOMA: Compressor não liga (C1, C2, C3 ou C4)
- VARIAÇÕES: "tanque não gela", "unidade remota parada", "compressor não parte"
- CONTEXTO: Ocorre durante a demanda de refrigeração.
- CAUSA MAIS PROVÁVEL: Disjuntor-motor desarmado ou Pressostato aberto.
- CAUSAS POSSÍVEIS: Falta de fase (RFF); Contatora sem fechar; Saída do CLP/Controlador sem sinal.
- ORDEM DE VERIFICAÇÃO:
  1. Verificar disjuntores-motor (DM1, DM2, etc).
  2. Verificar se o relé RFF está com LED verde (fases OK).
  3. Verificar se o pressostato de alta/baixa está fechado.
  4. Testar contatora do compressor.
- COMPONENTES: DM1-4, K1-4, RFF, Pressostatos.
- PAINEL: Geral.

SINTOMA: IHM Apagada
- VARIAÇÕES: "tela preta", "painel de limpeza morto", "IHM não liga"
- CAUSA MAIS PROVÁVEL: Falta de 24Vcc vindo da fonte FT1.
- CAUSAS POSSÍVEIS: Disjuntor de comando desligado; Cabo da IHM rompido; Borne de alimentação aberto.
- ORDEM DE VERIFICAÇÃO:
  1. Medir saída da fonte FT1 (deve ser 24Vcc).
  2. Verificar disjuntor de comando DC1.
  3. Verificar continuidade do cabo 8x1mm.
- COMPONENTES: FT1, DC1, Cabo IHM.
- PAINEL: CIP.

[CAMADA 3: BASE DE ALARMES]
Lista de alarmes e significados rápidos.

- ALARME FALTA DE FASE: RFF detectou problema na rede. Bloqueia todos os compressores.
- SOBRECARGA COMPRESSOR: Disjuntor-motor desarmou por excesso de corrente ou falha mecânica.
- SOBRECARGA AGITADOR: Motor do agitador travado ou disjuntor-motor desregulado.
- EMERGÊNCIA ATIVA: Botão de emergência pressionado. Corta todas as saídas do CLP.
- FALHA DE NÍVEL: Sensor não detectou líquido quando deveria ou detectou quando não deveria.
- TANQUE OCUPADO: Sinal de intertravamento com o robô. Impede limpeza/transferência.

[CAMADA 4: PROCEDIMENTOS DE TESTE]
Como validar componentes de forma segura.

PROCEDIMENTO: Teste de Saída do CLP
1. Localizar o LED da saída correspondente no CLP (ex: Y5).
2. Forçar a saída via IHM (se disponível) ou aguardar a etapa do ciclo.
3. Se o LED acende mas o relé não atua: Medir 24Vcc no borne de saída.
4. Se houver 24Vcc no borne mas o relé não atua: Relé de interface defeituoso.

PROCEDIMENTO: Teste de Pressostato
1. Com o sistema desenergizado, medir continuidade entre os bornes do pressostato.
2. Se aberto: Verificar pressões de alta e baixa do sistema frigorífico.
3. Se fechado e o compressor não parte: O problema é na cadeia de comando posterior.

PROCEDIMENTO: Segurança Obrigatória
- SEMPRE desenergizar e bloquear o painel antes de abrir ou intervir.
- Confirmar ausência de tensão com multímetro antes de tocar em partes vivas.
- Usar EPIs adequados para medições em painéis energizados.
`;
