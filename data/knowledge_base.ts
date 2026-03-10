
export const KNOWLEDGE_BASE = `
[CAMADA 1: FUNCIONAMENTO - LÓGICA E COMPONENTES]
Esta camada explica como o sistema Ordemilk deve operar e a função de cada componente.

1. ARQUITETURA MODULAR:
   - PAINEL GERAL: Camada de potência e proteção. Cuida de motores (Compressores, Agitadores, Bomba) e intertravamentos elétricos.
   - PAINEL CIP/LIMPEZA: Camada de automação. Concentra IHM, CLP e Relés de Interface para gerenciar a lógica de lavagem.
   - INTERLIGAÇÃO: Feita via borneiras e cabos multicondutores (Sinais de 24Vcc e permissivos).

2. REGRAS DE EQUIPAMENTOS (OBRIGATÓRIO RESPEITAR CAPACIDADE):
   - Tanques >= 4.000L: OBRIGATORIAMENTE usam CLP Panasonic FP-X0 L40MR e Válvula de Expansão Termostática (VET). NUNCA mencione Ageon, Full Gauge ou tubo capilar para estes modelos.
   - Tanques < 4.000L: Usam Controladores eletrônicos (Ageon/Full Gauge). Expansão por capilar geralmente restrita a modelos até 2000L.

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

[CAMADA 5: REFRIGERAÇÃO DE RESFRIADORES DE LEITE (DOMÍNIO PRIORITÁRIO)]
Este bloco define o escopo exato e as regras de diagnóstico exclusivas para sistemas de refrigeração de expansão direta aplicados a tanques de resfriamento de leite.

1. ESCOPO EXATO DO DOMÍNIO:
- O domínio abrange exclusivamente sistemas de refrigeração de expansão direta aplicados a tanques de resfriamento de leite (geralmente em aço inox).
- O foco é o processo de redução rápida da temperatura do leite cru (de aprox. 35°C para 4°C) e sua manutenção, garantindo a integridade do produto sem congelamento, operando em ambientes rurais ou de laticínios.

2. ASSUNTOS QUE DEVEM ENTRAR:
- Ciclo Frigorífico Específico: Comportamento do fluido refrigerante no evaporador de fundo de tanque (tipo dimple jacket ou roll-bond).
- Compressores: Foco em compressores herméticos e semi-herméticos aplicados a este setor (ex: linha Maneurop Danfoss, Copeland Scroll, Tecumseh, Bitzer).
- Condensação a Ar: Unidades condensadoras, limpeza de aletas, falhas de ventilação, posicionamento da unidade na sala de ordenha.
- Agitação: O papel crítico do motorredutor e da pá do agitador na troca térmica e na prevenção do congelamento do leite.
- Controle e Proteção: Pressostatos de alta e baixa (regulagens típicas para o setor), protetores térmicos, relés de falta/inversão de fase, monitores de tensão.
- Comandos Elétricos: Contatoras do compressor e do agitador, termostatos/controladores de temperatura específicos para leite.
- Fluidos Refrigerantes: Comportamento das pressões de trabalho para os fluidos comuns no setor (R22, R404A, R134a, R410A, etc.) aplicados a resfriadores.

3. ASSUNTOS QUE DEVEM SER PROIBIDOS OU IGNORADOS:
- Chillers (sistemas de água gelada, trocadores de calor a placas para HVAC).
- Ar-condicionado (janela, split, piso-teto, cassete).
- Sistemas VRF/VRV.
- HVAC de conforto térmico e climatização predial.
- Câmaras frias genéricas (a menos que o princípio seja estritamente aplicável à unidade condensadora do tanque).
- Bombas de calor para aquecimento de piscinas ou ambientes.

4. REGRAS PARA NÃO MISTURAR COM CHILLER E AR-CONDICIONADO:
- Regra do Meio Resfriado: A IA deve sempre assumir que o produto a ser resfriado é um líquido orgânico (leite) em contato direto com a parede do tanque, e não ar ambiente ou água de processo.
- Regra da Troca Térmica: A troca de calor depende obrigatoriamente da agitação mecânica do leite. Se não há troca térmica, a IA deve priorizar a verificação do agitador antes de assumir problemas complexos de termodinâmica do ar.
- Regra de Sintomas: Termos como "não gela" ou "demora para gelar" devem ser interpretados como "tempo de resfriamento do leite excessivo", descartando hipóteses como "filtros de ar sujos" (típico de AC) ou "bomba de água gelada falhando" (típico de chiller).

5. ESTRUTURA SUGERIDA DE CONHECIMENTO INTERNO:
- MEC_01 (Compressão): Diagnóstico de compressores (Maneurop, etc.), rendimento mecânico, ruídos anormais.
- MEC_02 (Condensação): Troca térmica na unidade externa, obstruções, falhas de motoventilador.
- MEC_03 (Evaporação e Agitação): Fundo do tanque, motorredutor, formação de gelo, retorno de líquido.
- ELE_01 (Potência): Contatoras, cabeamento, disjuntores, quedas de tensão na fazenda.
- ELE_02 (Comando e Proteção): Pressostatos (Alta/Baixa), relés térmicos, controladores de temperatura.

6. EXEMPLOS DE SINTOMAS E CATEGORIAS QUE A IA DEVE RECONHECER:
- Sintoma: Resfriamento lento (demora muito para baixar a temperatura).
  Categoria: Falta de troca térmica (condensador sujo, ventilador inoperante), baixo rendimento do compressor, carga de fluido incorreta.
- Sintoma: Leite congelando no fundo.
  Categoria: Falha na agitação (motorredutor queimado, pá solta/quebrada), termostato descalibrado ou com relé colado.
- Sintoma: Compressor não parte.
  Categoria: Falha elétrica (falta de fase, contatora com bobina queimada, pressostato aberto, protetor térmico atuado).
- Sintoma: Compressor parte e desarma logo em seguida.
  Categoria: Desarme por Alta Pressão (condensador obstruído, ventilador parado), Desarme por Baixa Pressão (vazamento de fluido, recolhimento), sobrecarga elétrica (corrente alta).
- Sintoma: Retorno de líquido para o compressor.
  Categoria: Falha no agitador (leite não troca calor, evaporador inunda), válvula de expansão desregulada/superaquecimento incorreto.

[CAMADA 6: FUNDAMENTOS DO CICLO DE REFRIGERAÇÃO E PRÁTICA DE CAMPO (A CAMADA DE REALIDADE)]
Este bloco traduz a teoria do ciclo frigorífico para a prática bruta de campo, focando na análise fria do ciclo e nas armadilhas de diagnóstico.

1. OS 4 CORAÇÕES DA MÁQUINA TRADUZIDOS PRO CAMPO:
- Compressor (O Coração): Succiona o vapor em baixa pressão/temperatura e o comprime. (No contexto de leite: geralmente compressores Maneurop Danfoss ou equivalentes).
- Condensador (O Dissipador): A que junta poeira no ambiente rústico da fazenda e desarma tudo por alta pressão. Rejeita o calor para o ambiente externo.
- Dispositivo de Expansão (O Regulador): Válvula de expansão (VET) ou tubo capilar que reduz abruptamente a pressão do líquido.
- Evaporador (O Absorvedor): A chapa Inox/Roll-bond no fundo do tanque. Onde o fluido em baixa pressão absorve o calor do leite e evapora completamente.

2. A OBRIGATORIEDADE DA COMPRESSÃO SECA:
- O ciclo real deve garantir a "compressão seca" (apenas vapor chegando ao compressor).
- Retorno de líquido destrói os flappers (palhetas) e a biela do compressor. Danos mecânicos irreversíveis.

3. MATEMÁTICA DO SH E SR (CRÍTICOS PARA DIAGNÓSTICO):
- Superaquecimento (SH - Superheat) cravado em 5 a 10 K:
  * Função: Protege o compressor. SH muito baixo significa: "Compressor vai quebrar por golpe de líquido".
  * Cálculo Prático: Temp. da Linha de Sucção (medida no tubo) MINUS Temp. de Saturação (lida no manifold de baixa).
- Sub-resfriamento (SR - Subcooling) cravado em 3 a 5 K:
  * Função: Para proteger a expansão e evitar que a VET jogue uma rajada inútil de vapor (o "Flash Gas") dentro do tanque.
  * Cálculo Prático: Temp. de Saturação (lida no manifold de alta) MINUS Temp. da Linha de Líquido (medida no tubo).

4. ARMADILHAS DE DIAGNÓSTICO (SEGREDOS DE CAMPO):
- Isolamento da Sucção: Atenção ao isolamento de espuma térmica na sucção. Sem ele, o superaquecimento útil se perde e o gás aquece excessivamente no trajeto.
- Visor de Líquido Mentiroso: O visor de líquido engana se você não comparar com a balança ou com o cálculo de SH/SR. Bolhas podem ser flash gas por restrição, não apenas falta de gás.
- O Assassino Invisível: Serpentina suja atuando como assassina invisível de compressores. Reduz a troca térmica, eleva a pressão de alta, frita o óleo e quebra o compressor por fadiga térmica.
`;
