
import { Refrigerant } from './types';

// --- BIBLIOTECA SILENCIOSA (MANUAIS DE TERCEIROS) ---
export const EXTERNAL_MANUALS: Record<string, string> = {
   'REAFRIO': `
    [CONTEXTO TÉCNICO: REAFRIO]
    - O resfriador Reafrio geralmente utiliza controladores da marca EVERY CONTROL ou FULL GAUGE (modelos antigos).
    - ERROS COMUNS REAFRIO:
      * E1/E2: Erro de sensor (NTC).
      * Defeito recorrente: O agitador possui um temporizador cíclico físico dentro do painel em modelos antigos (não é no display).
    - LÓGICA DE GÁS: Trabalham com expansão por capilar em modelos até 2000L.
    `,

   'DELAVAL': `
    [CONTEXTO TÉCNICO: DELAVAL]
    - Equipamentos costumam ter proteção de tensão muito sensível (Monitor de Fase).
    - Lavagem: O sistema de lavagem (T100/T200) exige pressão de água mínima de 2 bar.
    - Erros de limpeza são bloqueantes: Se a limpeza falhar, ele não deixa gelar.
    `,

   'WESTFALIA': `
    [CONTEXTO TÉCNICO: GEA / WESTFALIA]
    - Utilizam muito o controlador J-STAR.
    - Atenção ao termostato de segurança (Termostato mecânico de bulbo) que fica em série com a contactora. Se ele abrir, o painel liga mas o compressor não parte.
    `
};

// --- CÉREBRO TÉCNICO ORDEMILK V64 (MODO HÍBRIDO: REFRIGERAÇÃO + ELÉTRICA) ---

export const TECHNICAL_CONTEXT = `
[PROTOCOLO DE DIAGNÓSTICO INTEGRADO]

ATENÇÃO: Um sintoma elétrico (desarme, travamento) é frequentemente a CONSEQUÊNCIA de um problema FRIGORÍFICO/MECÂNICO. Nunca isole as disciplinas.

1. **ANÁLISE FRIGORÍFICA (A CAUSA RAIZ MECÂNICA):**
   - **Pressões "Normais":** Pressão de manômetro isolada NÃO garante funcionamento. É obrigatório calcular SUPER AQUECIMENTO e SUB-RESFRIAMENTO.
     * Superaquecimento Baixo (<7K): Retorno de líquido -> Diluição do óleo -> Travamento mecânico do compressor -> Alta corrente elétrica -> Desarme elétrico.
     * Sub-resfriamento Baixo (<4K): Falta de fluido ou baixa troca no condensador -> Flash gas na expansão.
   - **Condensação (O Vilão Oculto):** Condensador sujo ou ventilador lento eleva a pressão de alta. Isso força o compressor (aumenta corrente elétrica) até o desarme térmico ou pelo pressostato de alta.
   - **Filtro Secador:** Diferença de temperatura entre entrada e saída indica obstrução parcial (estrangulamento).
   - **Válvula de Expansão (TXV):** Bulbo solto ou sem isolamento faz a válvula abrir demais (inundação do evaporador).

2. **ANÁLISE ELÉTRICA/ELETRÔNICA (O SINTOMA/CONTROLE):**
   - **CLP / Monitoramento:** O reset resolve temporariamente? Isso indica atuação de proteção (Pressostato Alta, Térmico, Monitor de Tensão).
   - **Componentes Críticos Ordemilk:**
     * **Resistor 2K2:** Se a temperatura oscila no display, verifique este resistor na entrada do CLP.
     * **LED X9 (CLP):** Indica status da rede elétrica. Piscando = Rede instável impedindo partida.

[DINÂMICA DE RACIOCÍNIO]
- Se o disjuntor cai: Curto-circuito ou compressor travado mecanicamente (falta de óleo/golpe de líquido).
- Se o térmico desarma: Alta corrente elétrica (Condensador sujo, excesso de gás, tensão baixa).
- Se não gela: Válvula travada, falta de gás (vazamento), compressor sem compressão (palhetas).

[MATEMÁTICA E FUNDAMENTOS TERMODINÂMICOS (NÍVEL PESQUISADOR/ENGENHEIRO)]
1. Propriedades Termofísicas do Leite Cru:
- Calor Específico (cp) do Leite Integral: ~3.93 kJ/kg·K (água é 4.18).
- Massa Específica (ρ): ~1030 kg/m³ a 20°C.
2. Carga Térmica (Q):
- Equação: Q = m * cp * ΔT
- Ex: 1000L = 1030kg baixando de 35°C para 4°C. Q = 1030 * 3.93 * 31 = 125484.9 kJ.
- Potência Frigorífica Requerida (Q_dot) para a meta da ISO 5708 (resfriar em até 3 horas = 10800s): Q_dot = 125484.9 / 10800 = 11.62 kW.
3. Evaporador (Fundo do Tanque) e Falha de Agitação:
- Lei do Resfriamento de Newton em Trocadores: Q_dot = U * A * ΔT_ml
- Se o agitador para, o coeficiente convectivo (U) despenca vertiginosamente. Se U cai, a taxa Q_dot também despenca, o sistema não absorve calor, a pressão de sucção desaba no compressor e há retorno brutal de líquido.
4. Ciclo de Compressão de Vapor:
- Capacidade de Refrigeração: Q_dot_evap = m_dot_ref * (h1 - h4)
- Trabalho/Potência de Compressão: W_dot_c = m_dot_ref * (h2 - h1). Se esquenta demais a descarga, h2 dispara.
- COP Ideal para Resfriadores Rurais: Entre 2.5 e 3.0.
5. Psicrometria e Câmaras Frias:
- Condensação e Ponto de Orvalho ("Suor"): Se o isolamento falhar, a chapa externa atinge o ponto de orvalho do ar (mistura de ar seco + vapor d'água), condensando nas paredes. Evaporadores gelam e desumidificam, por isso drenam água.
- Golpe de Líquido e Superaquecimento: O superaquecimento garante que apenas vapor entre no compressor. Ex: tubulação de sucção colada na linha de líquido atua como trocador de calor extra, vaporizando resíduos e evitando condensação ("suor") no tubo de retorno.
- Cargas Térmicas em Câmaras Frias: A máquina combate: (a) Transmissão (calor atravessa paredes, teto, piso. Ex: sol direto); (b) Infiltração (ar quente/úmido entra pela porta); (c) Interna (iluminação, pessoas, motores dos evaporadores).
- Comportamento de Produtos (Carga Principal): Ao resfriar frutas/hortaliças, considere o "Calor de Respiração" (metabolismo). Umidade inadequada causa perda de peso e desidratação severa da carne/vegetais.
- Regime de Funcionamento: O compressor de resfriados NÃO roda 24h. E dimensionado para 16h/dia, usando as outras horas para degelo natural. Congelados operam 18~20h/dia com degelo artificial.

*Referências Acadêmicas Obrigatórias:* Use e embase os argumentos no "ASHRAE Handbook - Refrigeration (Dairy Industry, Psychrometrics and Load Calculations)" e "Norma Técnica ISO 5708".

[BASE DE DADOS DE MATERIAIS (BOM) - APENAS SE SOLICITADO CÓDIGO]
Use esta lista apenas se o técnico pedir peça para compra.

[MAPA MENTAL DE REFRIGERAÇÃO E TERMODINÂMICA (APLICADO EXCLUSIVAMENTE A RESFRIADORES DE LEITE)]
1. **História da Refrigeração (Foco Leite):**
   - Dos primórdios (gelo natural e evaporação de água para resfriar pequenos latões) aos Marcos Modernos: A adoção da máquina de compressão de vapor no agro e o domínio da expansão direta (Fundo Roll-Bond e chillers de placa).
2. **Termodinâmica Avançada (Leis e Processos no Tanque):**
   - **Leis Fundamentais:** Lei Zero (busca pelo equilíbrio térmico chapa/leite), 1ª Lei (conservação de energia no ciclo), 2ª Lei (direção do calor do leite 35ºC para o gás evaporando, entropia), 3ª Lei (zero absoluto, conceitos de congelamento profundo).
   - **Propriedades Físicas de Campo:** Pressão e Temperatura (base do uso do Manifold e conversão PxT), Entalpia e Entropia (capacidade de absorção entálpica pelo fluido), Volume Específico (garantia de compressão a seco, perigo de retorno líquido).
   - **Processos Termodinâmicos Ativos:** Adiabático/Isentrópico (dentro do compressor), processo Isobárico sob temperaturas constantes (na mudança de fase nos trocadores de calor - Condensador e Evaporador).
3. **Ciclos de Refrigeração (O Padrão Ouro do Campo):**
   - Foco irrestrito no ciclo de **Compressão de Vapor**: Compressor, Condensador, Válvula de Expansão e Evaporador.
   - Diagnóstico Focado: Outros tipos rústicos ou experimentais (Absorção por Amônia/Água, Adsorção, Ciclo Stirling ou Gás puro) são desconsiderados para tanques típicos da agroindústria rotineira.
   - **Eficiência e Controle:** Busca obstinada por aumentar o **COP (Coeficiente de Performance)** técnico e reduzir a defasagem realística frente ao Ciclo de Carnot (limite teórico).
4. **Evolução Físico-Química dos Fluidos Refrigerantes:**
   - **A Transição Histórica:** Banimento global dos CFCs altamente degradantes, decaimento acelerado dos HCFCs (R-22) e dominância sólida dos HFCs (R-404A e R-134a) nos laticínios atuais.
   - **Impacto Tecnológico e Sustentável:** Preocupação com o GWP (Potencial de Aquecimento Global) ditado pela Emenda de Kigali e o Protocolo de Montreal. A ascensão engatinhante de testes com fluidos naturais (Propano R290, CO2) em pequenos chillers.
5. **Cadeia do Frio e Boas Práticas Agroindustriais:**
   - A refrigeração não como conforto, mas no papel do "Tempo/Conservação Alimentar" (Cadeia de Frios).
   - **Boas Práticas de Cima a Baixo:** Manutenções preventivas severas em quadros de comando, obrigatoriedade técnica operacional de **Recolhimento, Reciclagem e Pesagem (Tara)** dos fluidos usando balanças, maximizando a Eficiência Energética da propriedade rural e baixando a conta de energia do produtor.

[MAPA MENTAL DE PRÁTICA DE CAMPO: CICLO DE REFRIGERAÇÃO EM TANQUES]
1. **O Coração do Ciclo (Função Extrema no Campo):**
   - **Compressor:** Sucção de vapor de baixa. Exige Compressão estritamente SECA (apenas vapor). Qualquer líquido destrói os flappers e biela.
   - **Condensador:** Rejeição do calor tirado do leite. O vapor superaquecido resfria, condensa e vira líquido.
   - **Dispositivo de Expansão (VET):** Reduz abruptamente a pressão do líquido, preparando para absorver o "choque térmico" do leite cru de 35ºC.
   - **Evaporador (Fundo Roll-Bond):** Placa colada ao inox onde ocorre o efeito frigorífico. O leite deve estar sob forte AGITAÇÃO para transferir calor.
2. **Teoria vs Realidade de Campo:**
   - O Ciclo Teórico (saturado simples) falha no sítio. O Ciclo Real exige desvios térmicos cruciais (Superaquecimento e Sub-resfriamento) para proteger a mecânica do compressor e rentabilizar a condensação.
3. **Parâmetros de Controle Vitais (O Check-up do Técnico):**
   - **Superaquecimento (SH - Superheat):** Faixa ideal 5 a 10K. Medido na Saída do Evaporador (Fundo Traseiro) vs Pressão de Baixa (Manifold). SH baixo = Golpe de Líquido. SH alto = Falta de fluido ou VET sub-alimentando. Cálculo: Temp. Linha de Sucção (-) Temp. de Saturação Evaporação.
   - **Sub-resfriamento (SR - Subcooling):** Faixa ideal 3 a 5K. Medido na Saída do Condensador vs Pressão de Alta. Garante coluna 100% líquida para a VET, evitando "Flash Gas". Cálculo: Temp. de Saturação Condensação (-) Temp. da Linha de Líquido.
4. **Boas Práticas Inegociáveis (Diagnóstico de Campo):**
   - **Isolamento da Sucção:** Exigido desde a saída do Roll-Bond até o compressor, evita falso aquecimento ("suor") que adultera o cálculo de SH.
   - **Limpeza do Condensador:** Serpentina (bobina) suja é o principal causador invisível: destrói a troca térmica, crava a pressão de alta lá em cima, e desarma o relé por corrente do compressor.
   - **Carga de Fluido via Visor/Balança:** O visor não deve apresentar bolhas na alta. Porém, apenas o visor engana. A carga exata cruza SH (Superaquecimento) e SR (Sub-resfriamento) em tempo real sob agitação do leite vivo.
`;

export const SYSTEM_PROMPT_BASE = `
VOCÊ É UM ENGENHEIRO ESPECIALISTA EM REFRIGERAÇÃO INDUSTRIAL E AUTOMAÇÃO (ORDEMILK).

SUA MISSÃO:
Diagnosticar a falha de forma RÁPIDA E DIRETA. O técnico está no campo e não tem tempo para ler.

[REGRAS DE DIFERENCIAÇÃO E COMPONENTES - CRÍTICO]
- **USO DE CONTROLADORES (CLP vs FULL GAUGE):** 
  * Tanques maiores ou iguais a 4000 Litros (ex: 6000L, 8000L, 20000L) usam EXCLUSIVAMENTE **CLP (Geralmente Panasonic)**. É EXTREMAMENTE PROIBIDO mencionar Full Gauge, Ageon ou controladores simples para essas literagens.
  * Tanques pequenos (abaixo de 4000L) usam controladores comerciais (Ageon / Full Gauge).
- **PROBLEMAS DE CICLAGEM:** Foque na Refrigeração. NUNCA mencione CLP ou painel na análise inicial de resfriamento, a menos que haja indício elétrico.

[POSTURA E TOM DE VOZ]
- **ULTRA-CONCISO:** Responda em poucas palavras. NUNCA escreva parágrafos longos. Seja extremamente assertivo.
- **TÉCNICO:** Use termos exatos (LRA, Superaquecimento, Sub-resfriamento, Entalpia, etc).
- **CÉTICO:** Questione "pressão normal". Exija os valores de leitura.

[ESTRUTURA OBRIGATÓRIA DA RESPOSTA]
1. **Diagnóstico Direto:** 1 frase curta com a causa provável.
2. **Plano de Ação (Checklist curto):** 
   - Ação 1.
   - Ação 2.
3. **Pergunta Final:** Peça apenas 1 dado técnico que falta (ex: "Qual a pressão de sucção em PSI?").

NÃO FAÇA SAUDAÇÕES LONGAS. VÁ DIRETO AO PONTO.
`;

export const TOOL_PROMPTS = {
   DIAGNOSTIC: "MODO: ENGENHARIA DE CAMPO. Analise Termodinâmica, Mecânica e Elétrica simultaneamente. Lembre-se: Máximo 3 hipóteses e peça dados específicos.",
   ERRORS: "MODO: CONSULTA TÉCNICA. Explique o código de erro, sua origem (sensor/lógica) e a ação corretiva.",
   CALC: "MODO: TERMODINÂMICA. Analise o Superaquecimento/Sub-resfriamento. Se fora da faixa, indique risco ao compressor (golpe ou superaquecimento).",
   SIZING: "MODO: PROJETO. Calcule carga térmica e selecione compressor baseando-se em normas técnicas (ISO/Danfoss).",
   REPORT: "MODO: DOCUMENTAÇÃO. Gere laudo técnico formal e jurídico.",
   ELECTRIC: "MODO: ELÉTRICA. Analise desbalanceamento, queda de tensão e fator de potência."
};
