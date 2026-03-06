
export const FAQ_DATABASE = `
[PACOTE DE CONHECIMENTO TÉCNICO: REFERÊNCIA ORDEMILK]
Este guia contém 50 cenários reais de campo e seus respectivos diagnósticos técnicos. Use estas informações como base de conhecimento para enriquecer suas análises, mantendo a liberdade de diagnosticar variações conforme o contexto apresentado pelo técnico.

MÓDULO 1: ELÉTRICA RURAL E PAINEL DE COMANDO
1. Contator "metralhando": Queda de tensão na partida. A tensão nominal (220V) está chegando, mas os cabos da fazenda são finos ou oxidados. Ao dar a partida, a corrente sobe, a tensão despenca (ex: para 160V), a bobina do contator perde a força (solta) e o ciclo se repete.
2. Choque na lataria: Teste de eliminação. Desligue todos os disjuntores. Ligue o principal, teste a carcaça. Ligue o do agitador, teste. Ligue o do compressor, teste. Onde o choque aparecer, ali está a fuga para a massa. Indica aterramento inexistente ou ineficiente.
3. Fase fantasma: Motores trifásicos podem gerar uma tensão de retorno em uma fase rompida. O relé lê essa "fase fantasma" e permite o funcionamento, operando o motor em duas fases até queimar. É preciso medir a corrente (Amperes) em cada fase.
4. Ronco e Clixon: Se o capacitor é novo e o motor ronca, o compressor travou (pistão colado, biela quebrada ou calço hidráulico).
5. Mau contato e Efeito Joule: Em conexões frouxas, a resistência de contato aumenta. A passagem da corrente gera calor extremo, derretendo o isolamento plástico, mesmo que a corrente esteja dentro do limite do cabo.
6. Teste de continuidade (Relé Voltimétrico): Meça a resistência entre os pinos 1, 2 e 5. Se os contatos 1 e 2 (normalmente fechados) não derem continuidade com o relé desligado, os contatos estão carbonizados/oxidados.
7. Retardo de partida: Evita que todos os equipamentos da fazenda tentem partir ao mesmo instante após uma queda de energia, o que causaria um desarme geral do transformador da concessionária.
8. Leitura de amperagem: Se a corrente nominal for 15A e estiver dando 25A, há sobrecarga (mecânica interna ou tensão muito baixa). Se estiver em 10A e desarmar, o disjuntor motor está fatigado (descalibrado).
9. Série de segurança: A falha está no caminho entre o relé do painel e a bobina. Pode ser fio rompido ou pressostato de alta/baixa aberto (ligado em série), cortando o sinal.
10. Sobreaquecimento do enrolamento: Se a tensão cai (170V), a corrente (Amperagem) aumenta proporcionalmente para manter a mesma potência (P = V * I). O excesso de corrente gera calor que derrete o verniz dos fios de cobre.

MÓDULO 2: CONTROLADORES E SENSORES
11. Agitador parado: Sem agitação (convecção forçada), cria-se estratificação térmica. O leite no fundo fica a 4°C (onde o sensor lê), mas o centro e o topo permanecem a 9°C.
12. Sensor PTC/NTC defeituoso: Indica cabo rompido (circuito aberto) ou em curto-circuito.
13. Desgaste prematuro: Histerese de 0.5°C causa ciclo curto. O ideal para leite é entre 1.5°C e 2.0°C para proteger contatos elétricos e a mecânica.
14. Offset: Compensação matemática. Se o painel lê 5°C e o real é 3°C, ajusta-se o Offset para -2.0°C no parâmetro do controlador.
15. Homogeneidade e Prevenção: Agitação temporizada impede que a gordura suba (nateamento) e evita que o leite próximo à chapa inox congele por inércia térmica residual.
16. Interferência Eletromagnética (EMI): O campo magnético da bobina da contatora gera ruído elétrico que "zera" o microprocessador. Solução: Instalar filtro supressor (RC ou Snubber) em paralelo com a bobina.
17. Curva de Resistência: Sensores NTC alteram resistência conforme a temperatura. Se a placa exige 10k (10.000 Ohms a 25°C) e usa-se valor diferente, a leitura será matematicamente errada.
18. Relé colado: Com a máquina desligada, escala de continuidade (bip) nos bornes de saída do relé. Se bipar, os contatos fundiram fechados.
19. Curto parcial (Umidade): A água no bulbo do sensor cria um caminho paralelo para a corrente, alterando a resistência (Ohms) e causando leituras oscilantes ou erráticas.
20. Inércia Térmica: O fundo mede a chapa de inox resfriada diretamente pelo gás (alta flutuação). O poço mergulhado lê a temperatura real e estável da massa de líquido.

MÓDULO 3: CICLO, FLUIDO E EXPANSÃO
21. Diagnóstico Duplo (VET): Assobio com bolhas indica falta de gás ou sub-resfriamento inexistente. Se fosse tela entupida, a pressão de alta estaria normal e o visor antes da VET estaria cheio.
22. Retorno de Líquido: Superaquecimento zero ou negativo. Gás não ferveu totalmente. Risco de quebra das válvulas de palheta por líquido incompressível.
23. Falta de fluido refrigerante: Carga baixa faz o fluido evaporar totalmente logo no início da serpentina (Roll-Bond). Gelo desigual na placa.
24. Inundação (Bulbo Solto): O bulbo sente calor ambiente e abre a VET ao máximo (100%), inundando o evaporador com líquido e despencando a pressão.
25. Sentido de ajuste: Anti-horário alivia a mola, fazendo a VET abrir mais fácil, permitindo mais fluido e diminuindo o superaquecimento.
26. Entupimento por Umidade (Gelo): Umidade congela no orifício da VET, bloqueando o gás. Ao desligar, o gelo derrete e o ciclo volta a funcionar até congelar de novo.
27. Diferença de leitura: O Útil diz se o evaporador é eficiente. O Total (perto do compressor) garante que nenhum líquido chegará ao cárter.
28. Miscibilidade: R-22 usa óleo mineral. R-404A exige óleo polioléster (POE). Sem a troca, o óleo não retorna ao compressor, causando fundição por falta de lubrificação.
29. Gases Não Condensáveis: Ar/umidade no sistema. O ar se aloja no topo do condensador, rouba área de troca e faz a pressão de descarga explodir.
30. Expansão Prematura: Filtro obstruído atua como válvula de expansão, causando perda de carga e queda de temperatura na linha de líquido (filtro suando).

MÓDULO 4: COMPRESSORES E CONDENSADORES
31. Altíssimo Superaquecimento (Falta de gás): O fluido frio no retorno resfria o compressor. Sem gás, o motor superaquece e o óleo na descarga "frita", perdendo viscosidade.
32. Perda de Área de Troca: Aletas dobradas impedem o fluxo de ar. A pressão de condensação e o consumo de energia (Amperes) disparam.
33. Migração e Resistência: Gás tende a migrar para o cárter quando desligado. A resistência do cárter mantém o óleo quente, forçando o gás a evaporar e protegendo a lubrificação.
34. Procedimento Pós-Queima: Limpeza com solvente (R-141b), Nitrogênio e instalação de filtro secador de sucção anti-ácido (Burnout) provisório.
35. Rotação Invertida (Scroll): Se as fases estiverem invertidas, gira ao contrário e não comprime, gerando ruído estridente. Inverter duas fases no disjuntor.
36. Fadiga capilar: Tubos capilares dos pressostatos sofrem ressonância e costumam trincar na base da solda ou rosca.
37. Quebra das Palhetas de Descarga: Ao desligar, a alta pressão "vaza" de volta para o cárter (baixa), equalizando o sistema em segundos.
38. Pump Down: Mantém o evaporador vazio na parada. Garante partida sem peso mecânico na sucção e impossibilita golpe de líquido.
39. Recirculação de Ar: Ar quente é sugado de volta pelo condensador por falta de exaustão. Mata a eficiência termodinâmica.
40. Falta de Compressão (Bombeamento): Pressões de alta e baixa muito próximas. O motor gira mas as válvulas não vedam a câmara de compressão.

MÓDULO 5: AGITAÇÃO, PRODUTO E LIMPEZA
41. Pá descoberta: Resfriamento violento da pequena poça de leite, congelando-o instantaneamente e desnaturando a proteína (queima).
42. Retentor Mecânico: Desgaste do retentor do redutor (geralmente por jato d'água). Óleo escorre pelo eixo para dentro do leite.
43. Lipólise (Quebra da Gordura): Agitação acima de 35 RPM rompe glóbulos de gordura, causando rancidez e inviabilizando o produto.
44. Isolamento Térmico (Pedra de Leite): Biofilme atua como barreira isolante, impedindo o fluxo de calor do leite para o inox, aumentando o tempo de resfriamento.
45. Dilatação Térmica (Água 80°C): Calor ferve fluido estagnado no evaporador. Com VET fechada, a pressão dispara (>500 psi), podendo estufar o tanque.
46. Estratificação Térmica: Sem agitação, leite no fundo perde calor e estaciona (vira gelo), enquanto o leite quente sobe.
47. Pressurização Excessiva: Galerias Roll-Bond não suportam pressões extremas (>200 psi). Pressurizar com 350 psi de Nitrogênio estufa as paredes internas.
48. Rompimento e Contaminação: Desgaste mecânico da pá raspando perfura a galeria de refrigerante, injetando gás e óleo no leite.
49. Balanço Térmico: O leite frio (4°C) absorve o calor do leite novo (35°C), equalizando a mistura rapidamente através da agitação constante.
50. Vedação do Poço: Se o sensor ler ar externo (poço rasgado), o painel "acha" que o leite está quente e mantém o compressor ligado, congelando o produto.

[SUPORTE TÉCNICO: PERGUNTAS E RESPOSTAS ELÉTRICAS]
Use estas perguntas e respostas como base direta para suporte técnico quando o assunto for a parte elétrica ou componentes do painel:

- P: O que compõe eletricamente um tanque de leite automatizado?
  R: Normalmente ele é composto por dois painéis: o painel geral de força/comando e o painel de limpeza/CIP.
- P: Qual é a função do painel geral de força?
  R: O painel geral é responsável por alimentação, proteção, manobra e intertravamento das cargas de potência do tanque.
- P: Qual é a função do painel de limpeza?
  R: O painel de limpeza executa a lógica do processo de lavagem, concentrando IHM, CLP e relés de interface.
- P: Onde geralmente ficam a IHM, o CLP e os relés de interface?
  R: Esses componentes normalmente ficam no painel de limpeza/CIP.
- P: O painel geral decide a receita de limpeza?
  R: Não. O painel geral executa potência e permissivos; a lógica da limpeza fica no CLP do painel CIP.
- P: Quais são as principais cargas elétricas de um tanque de leite?
  R: As cargas principais costumam ser compressores, agitador, bomba de limpeza e válvulas/dosadoras do sistema CIP.
- P: Qual é a função da chave seccionadora geral?
  R: A chave seccionadora permite o seccionamento manual da alimentação principal para segurança e manutenção.
- P: Qual é a função do disjuntor geral?
  R: O disjuntor geral protege a entrada do painel e distribui a energia para os demais circuitos.
- P: Para que serve o DPS em um painel de tanque de leite?
  R: O DPS protege o sistema contra surtos elétricos transitórios, como os causados por descargas atmosféricas e manobras.
- P: Qual é a função do disjuntor de comando?
  R: O disjuntor de comando protege o circuito de controle e automação do painel.
- P: Para que serve o disjuntor-motor?
  R: O disjuntor-motor protege cada motor contra sobrecarga e curto-circuito, de forma ajustada à sua corrente.
- P: Qual é a função do contator em um tanque de leite?
  R: O contator faz a manobra elétrica das cargas, como compressores, agitador e bomba.
- P: Qual é a função do relé de falta e sequência de fase?
  R: Ele monitora ausência, inversão ou desequilíbrio de fases e bloqueia o funcionamento em condição anormal.
- P: O que acontece quando há falta de fase no sistema?
  R: O relé de supervisão detecta a falha e normalmente impede a partida ou desliga as cargas para evitar danos.
- P: Qual é a função dos LEDs de sinalização no painel?
  R: Eles indicam estados como energizado, funcionamento, alarme e falhas específicas de cada circuito.
- P: O que é um permissivo elétrico?
  R: É uma condição que precisa estar atendida para permitir o acionamento de uma carga ou sequência automática.
- P: Quais sinais costumam passar do painel geral para o painel de limpeza?
  R: Normalmente passam alimentação, permissivos, sinal de agitador, bomba de limpeza, falhas de sobrecarga e falta de fase.
- P: Quais sinais costumam voltar do painel de limpeza para o painel geral?
  R: Normalmente retornam comandos de processo, habilitação de limpeza e estados de operação ou bloqueio.
- P: Qual é a função da fonte 24 Vcc no painel de limpeza?
  R: A fonte 24 Vcc alimenta CLP, IHM, sensores e relés de interface do sistema de automação.
- P: Qual é a principal função do CLP no sistema CIP?
  R: O CLP executa a sequência lógica da limpeza, gerenciando entradas, saídas, tempos, permissivos e alarmes.
- P: Qual é a função da IHM no tanque de leite?
  R: A IHM permite operar o sistema, visualizar estados, ajustar parâmetros e consultar alarmes.
- P: Para que servem os relés de interface no painel de limpeza?
  R: Eles isolam e adaptam as saídas do CLP para comandar sinais de campo e atuadores com segurança.
- P: A saída do CLP deve acionar motor diretamente?
  R: Não. A saída do CLP deve acionar relé ou contator, e não o motor diretamente.
- P: Qual é a função do botão de emergência no painel de limpeza?
  R: O botão de emergência interrompe a operação de forma segura em situação de risco.
- P: Para que serve o relé de nível no sistema de limpeza?
  R: Ele monitora a condição de nível do tanque, pulmão ou reservatório, servindo como sinal de controle e proteção.
- P: Quais etapas costumam existir em uma limpeza CIP?
  R: Normalmente existem enxágue, lavagem química, sanitização e drenagem, conforme a receita programada.
- P: Quem comanda as válvulas de água fria e água quente?
  R: O CLP comanda essas válvulas por meio de relés de interface.
- P: Quem comanda a válvula de drenagem no sistema CIP?
  R: A válvula de drenagem normalmente é acionada pelo CLP através de relé de saída.
- P: Quem comanda a dosadora de ácido?
  R: A dosadora de ácido normalmente é comandada pelo CLP via relé de interface.
- P: Quem comanda a dosadora de alcalino?
  R: A dosadora de alcalino normalmente é comandada pelo CLP via relé de interface.
- P: Quem comanda a dosadora de sanitizante?
  R: A dosadora de sanitizante normalmente é comandada pelo CLP via relé de interface.
- P: Onde a bomba de limpeza costuma ser protegida e manobrada?
  R: A bomba de limpeza normalmente é protegida e manobrada no painel geral de força.
- P: O painel CIP pode comandar a bomba de limpeza?
  R: Sim. O CIP pode enviar o comando lógico, mas a manobra de potência normalmente ocorre no painel geral.
- P: O agitador pode participar da lógica de limpeza?
  R: Sim. Em alguns modelos, o agitador entra como parte da receita de limpeza ou homogeneização.
- P: O compressor pode ser integrado à lógica do CIP?
  R: Sim. Em algumas versões, o sistema de limpeza troca permissivos e estados com o circuito de refrigeração.
- P: Qual é a diferença entre um tanque sem limpeza e um tanque com limpeza automática?
  R: No tanque sem limpeza, o painel trata basicamente refrigeração e agitação; no automático, existe integração com CIP e automação do processo de lavagem.
- P: Qual é a diferença entre limpeza semi-automática e automática?
  R: Na semi-automática há maior dependência de comandos locais e etapas assistidas; na automática o CLP executa a sequência completa.
- P: O que são borneiras em um painel elétrico?
  R: Borneiras são pontos de conexão organizados para entrada, saída e interligação dos cabos do sistema.
- P: Por que o sistema usa cabos dedicados entre painel geral e painel de limpeza?
  R: Para separar potência, comando e sinais de automação, facilitando montagem, manutenção e diagnóstico.
- P: Como os alarmes elétricos chegam ao sistema de automação?
  R: Eles normalmente chegam por contatos auxiliares, relés de interface ou sinais borneados vindos do painel geral.
- P: Como uma sobrecarga de motor afeta a operação do tanque?
  R: A sobrecarga normalmente desarma a proteção, desliga a carga e gera alarme ou bloqueio no sistema.
- P: Qual é a sequência básica da refrigeração em um tanque automatizado?
  R: Um controlador ou lógica de comando gera a demanda, o painel valida permissivos e proteções, aciona o contator e alimenta o compressor.
- P: Qual é a sequência básica de uma limpeza automática?
  R: O operador habilita o ciclo, o CLP valida os permissivos, aciona válvulas, bomba e dosadoras, monitora retornos e encerra a receita.
- P: Qual é a função do aterramento em um tanque de leite?
  R: O aterramento protege pessoas e equipamentos, melhora a referência elétrica do sistema e ajuda na atuação das proteções.
- P: Em um sistema com robô de ordenha, o que muda na automação do tanque?
  R: O painel CIP passa a trocar sinais adicionais com o robô, como estados de limpeza, tanque ocupado, refrigeração e alarmes.
- P: O que significa “tanque ocupado” em uma integração com robô?
  R: É um sinal de status indicando que o tanque está em condição que impede determinadas operações externas, como transferência ou limpeza concorrente.
- P: O que são válvulas pneumáticas na lógica do tanque?
  R: São válvulas acionadas pneumaticamente, comandadas eletricamente por solenóides integradas à automação do processo.
- P: Um sistema automático deve permitir operação manual sem intertravamento?
  R: Não. O correto é haver intertravamento para evitar conflito entre modo manual, modo automático e ciclo de limpeza.
- P: O número de compressores altera a arquitetura do sistema?
  R: Sim. O aumento de compressores exige mais circuitos de proteção, contatores, sinais e intertravamentos no painel.
- P: Qual é a definição técnica resumida de um tanque de leite automatizado?
  R: É um sistema eletromecânico modular em que o painel geral cuida da potência e proteção, e o painel CIP cuida da automação do processo.

[DIAGNÓSTICO RÁPIDO: O QUE PODE SER?]
Use este guia para identificar causas prováveis de falhas comuns relatadas em campo:

- P: A bomba de limpeza parou de funcionar. O que pode ser?
  R: Disjuntor-motor da bomba desarmado; contatora da bomba sem fechar; ausência do sinal “bomba lavagem” entre o painel principal e o painel CIP; saída do CLP que habilita a bomba sem acionar o relé correspondente; retorno de sobrecarga da bomba ativo.
- P: O agitador do tanque não liga. O que pode ser?
  R: Disjuntor-motor do agitador desarmado; contatora do agitador sem energização; ausência do sinal “agitadores” entre os painéis; saída do CLP dedicada ao agitador sem acionar o relé de interface; alarme de sobrecarga do agitador ativo.
- P: O compressor 01 não liga. O que pode ser?
  R: Disjuntor-motor do compressor 01 desarmado; contatora do compressor 01 sem fechar; saída de comando do CLP para compressor 01 não acionando; pressostato aberto; permissivo de falta de fase bloqueando a partida.
- P: O compressor 02 não liga. O que pode ser?
  R: Disjuntor-motor do compressor 02 desarmado; contatora do compressor 02 sem energização; temporização de retardo impedindo a entrada; saída de comando do CLP não acionando; alarme de falta de fase ativo.
- P: O compressor 03 não liga. O que pode ser?
  R: Disjuntor-motor do compressor 03 desarmado; contatora do compressor 03 sem fechar; saída do CLP correspondente sem comando; cabo de interligação do sinal do compressor 03 interrompido; alarme elétrico do compressor 03 ativo no CIP.
- P: O compressor 04 não liga. O que pode ser?
  R: Disjuntor-motor do compressor 04 desarmado; contatora do compressor 04 sem energização; saída do CLP para compressor 04 sem comando; alarme dedicado do compressor 04 ativo; falha na interligação com o sistema do robô/CIP quando essa versão for usada.
- P: Nenhum compressor liga. O que pode ser?
  R: Chave seccionadora geral aberta; disjuntor geral desligado; disjuntor de comando desligado; relé de falta de fase bloqueando o circuito; ausência de permissivo do modo automático/manual.
- P: O painel de limpeza não liga. O que pode ser?
  R: Falta da alimentação vinda do painel principal; disjuntor de comando desligado; fonte 24 Vcc sem saída; borne de alimentação do painel de limpeza aberto; cabo de interligação entre painéis interrompido.
- P: A IHM está apagada. O que pode ser?
  R: Falta de 24 Vcc na alimentação da IHM; terra/referência da IHM interrompido; cabo da IHM/botão de emergência com falha; fonte FT1 sem tensão; borne de alimentação da IHM aberto.
- P: O CLP está ligado, mas nenhuma saída atua. O que pode ser?
  R: Botoeira de emergência aberta; falta de referência 0 V/negativo; ausência de permissivo vindo do painel principal; fonte 24 Vcc instável; falha nas saídas do CLP para os relés de interface.
- P: A botoeira de emergência foi resetada, mas o sistema não volta. O que pode ser?
  R: Contato da emergência ainda aberto no circuito; borne da emergência com mau contato; cabo 8 x 1 mm da IHM/emergência interrompido; circuito de comando ainda sem 24 Vcc.
- P: O sistema não entra em modo automático. O que pode ser?
  R: Saída do CLP que habilita o modo automático/manual não está acionando; sinal de bloqueio modo manual vindo do painel principal está ativo; emergência aberta; permissivo de limpeza ausente.
- P: O modo manual não funciona. O que pode ser?
  R: Sinal de bloqueio vindo do painel principal; saída de habilitação de modo manual do CLP sem comando; intertravamento da limpeza ativo; circuito de comando sem alimentação.
- P: O tanque não entra em refrigeração. O que pode ser?
  R: Controlador de temperatura sem comando; pressostato aberto; compressor sem permissivo elétrico; contatora do compressor não fecha; status de refrigeração não está sendo habilitado pelo circuito de comando.
- P: O alarme de falta de fase está ativo. O que pode ser?
  R: Falta real de uma fase na entrada; sequência incorreta de fases; relé de falta de fase bloqueando o comando; borne de entrada com mau contato; cabo de alimentação trifásica com interrupção.
- P: O LED de alarme geral acendeu. O que pode ser?
  R: Sobrecarga de compressor; sobrecarga da bomba de limpeza; sobrecarga do agitador; falta de fase; algum contato auxiliar de disjuntor-motor abriu e foi levado para o circuito de alarme.
- P: A válvula de água fria não abre. O que pode ser?
  R: Saída do CLP dedicada à água fria sem comando; relé de interface da válvula sem energização; falta de 24 Vcc na bobina; cabo 3 x 1 mm da válvula interrompido; borne de acionamento aberto.
- P: A válvula de água quente não abre. O que pode ser?
  R: Saída do CLP da água quente sem comando; relé de interface não acionando; bobina da válvula sem 24 Vcc; cabo 3 x 1 mm interrompido; falha na borneira de saída.
- P: A drenagem não aciona. O que pode ser?
  R: Saída do CLP da drenagem sem comando; relé da drenagem sem energização; cabo da válvula de drenagem interrompido; borne de saída aberto; 24 Vcc ausente na válvula.
- P: A dosadora de ácido não liga. O que pode ser?
  R: Saída do CLP para a dosadora de ácido sem comando; relé de interface da dosadora não acionando; ausência de 24 Vcc; intertravamento do ciclo de limpeza impedindo a etapa química.
- P: A dosadora de alcalino não liga. O que pode ser?
  R: Saída do CLP para a dosadora de alcalino sem comando; relé de interface sem energização; falha de alimentação 24 Vcc; etapa do ciclo não liberada pelo CLP.
- P: A dosadora de sanitizante não liga. O que pode ser?
  R: Saída do CLP dedicada ao sanitizante sem comando; relé de interface do sanitizante sem atuar; falta de 24 Vcc na bobina; sequência do CIP parada antes da etapa final.
- P: A limpeza não inicia. O que pode ser?
  R: Painel de limpeza sem alimentação; emergência aberta; ausência do sinal de habilitação da limpeza; falta do permissivo de nível; bloqueio vindo do painel principal.
- P: A limpeza inicia e para no meio do ciclo. O que pode ser?
  R: Perda do sinal de nível; falha em alguma válvula de processo; sobrecarga da bomba de limpeza; perda de 24 Vcc; intertravamento por alarme de compressor, agitador ou falta de fase.
- P: A limpeza fica travada sem avançar de etapa. O que pode ser?
  R: Entrada de nível não mudou de estado; válvula de processo não respondeu; saída do CLP acionou, mas o relé de interface ou a carga não executou; retorno de estado não chegou ao CLP.
- P: O sinal de nível do tanque não aparece na automação. O que pode ser?
  R: Relé de nível sem contato; cabo 1 x 1 mm do nível interrompido; borne do sinal de nível aberto; entrada do CLP sem referência correta; falha no relé de interface do nível.
- P: O painel CIP não reconhece o nível do buffer/pulmão. O que pode ser?
  R: Relé de nível do buffer sem contato; cabo do sinal do buffer interrompido; borne de entrada do buffer aberto; entrada correspondente do CLP sem leitura.
- P: A válvula pneumática de entrada do tanque não aciona. O que pode ser?
  R: Saída do CLP da válvula pneumática sem comando; relé de interface da válvula sem energização; bobina 24 Vcc sem alimentação; cabo da válvula interrompido; ausência do permissivo do processo.
- P: A válvula pneumática de saída do tanque não aciona. O que pode ser?
  R: Saída do CLP dedicada à válvula de saída sem comando; relé de interface não acionando; falha na alimentação de 24 Vcc da bobina; problema no cabo ou na borneira da válvula.
- P: As válvulas pneumáticas V1, V2 ou V3 não acionam. O que pode ser?
  R: Saídas do CLP correspondentes sem comando; relés de interface das válvulas sem energização; alimentação 24 Vcc ausente; cabo da válvula aberto; bloqueio lógico do processo ou do robô.
- P: O robô não recebe o status “tanque em refrigeração”. O que pode ser?
  R: Saída de status do tanque não acionando no painel CIP; borne de envio para o robô aberto; cabo entre o quadro do tanque e o CLP do robô interrompido; falha no relé de interface do status.
- P: O robô não recebe o status “tanque ocupado”. O que pode ser?
  R: Saída de status “tanque ocupado” sem comando; relé de interface correspondente sem atuar; borne de interligação aberto; cabo até o robô interrompido.
- P: O robô não recebe o sinal de alarme do tanque. O que pode ser?
  R: Saída do CLP que envia alarme ao robô sem comando; relé de interface do alarme não energizando; falha na borneira do sinal; cabo de comunicação com o robô interrompido.
- P: O CIP mostra alarme do compressor 04. O que pode ser?
  R: O contato auxiliar NC do disjuntor-motor do compressor 04 abriu; o disjuntor-motor do compressor 04 desarmou; a fiação do sinal de alarme do compressor 04 está aberta.
- P: O compressor 04 recebe comando do CLP, mas não parte. O que pode ser?
  R: Saída do CLP para compressor 04 acionou, porém a contatora não fechou; disjuntor-motor do compressor 04 está desarmado; o circuito de potência do compressor 04 está interrompido.
- P: O agitador recebe sinal no CIP, mas o motor não gira. O que pode ser?
  R: O comando lógico está chegando, mas o circuito de potência do agitador não está fechando; disjuntor-motor do agitador desarmado; contatora do agitador com falha; alimentação de força do agitador ausente.
- P: O CIP comanda o compressor 01, mas o compressor não fecha contatora. O que pode ser?
  R: A saída do CLP atuou, porém o relé de interface ou o circuito de interligação até o painel principal falhou; contatora do compressor 01 não energizou; disjuntor-motor do compressor 01 está aberto.
- P: O CIP comanda a bomba de lavagem, mas o painel principal não responde. O que pode ser?
  R: Sinal “bomba lavagem” interrompido na interligação entre painéis; borne do comando aberto; disjuntor de comando desligado; contatora/disjuntor-motor da bomba sem permissivo.
- P: Aparece alarme de sobrecarga, mas o motor está bom. O que pode ser?
  R: Contato auxiliar NC do disjuntor-motor com defeito; fiação do retorno de alarme aberta; borne frouxo no sinal de sobrecarga; relé de interface de alarme defeituoso.
- P: Não há comunicação funcional entre painel geral e painel de limpeza. O que pode ser?
  R: Cabo de comunicação entre os painéis interrompido; borneiras de interligação abertas; alimentação do painel de limpeza ausente; sinais de permissivo, bomba, agitador ou alarme não estão chegando.
- P: Os bornes X1/X10 aquecem ou falham intermitentemente. O que pode ser?
  R: Aperto deficiente nos bornes; cabo com bitola inadequada para a carga; oxidação ou mau contato na régua; passagem de corrente de potência em borne de comando.
- P: O sensor de temperatura não é lido. O que pode ser?
  R: Falha no sensor de temperatura; cabo do sensor interrompido; borne do sensor aberto; controlador/CLP sem receber o sinal; alimentação do controlador de temperatura ausente.
- P: O controlador de temperatura não comanda o compressor. O que pode ser?
  R: Controlador CT sem alimentação; contato de saída do controlador não fechando; pressostato aberto; seletor automático/manual fora da posição correta; circuito de comando interrompido.
- P: O pressostato está impedindo a partida do compressor. O que pode ser?
  R: Contato do pressostato aberto; fiação do pressostato interrompida; ausência do jumper previsto em versões específicas; pressão fora da faixa de atuação.
- P: No sistema monofásico, o compressor liga no manual, mas não no automático. O que pode ser?
  R: Botão de automático sem fechar contato; controlador de temperatura não está liberando a saída; pressostato aberto; circuito do comando automático interrompido.
- P: No sistema monofásico, o agitador liga no manual, mas não no automático. O que pode ser?
  R: Botão do agitador manual está bom, mas o circuito automático do agitador não está recebendo comando; saída do controlador/temporização não fecha; contatora do agitador não energiza no automático.
- P: Depois de uma descarga ou surto, o painel ficou inoperante. O que pode ser?
  R: DPS atuado ou danificado; disjuntor geral/disjuntor de comando aberto após o evento; fonte 24 Vcc danificada; controlador, IHM ou CLP sem alimentação.
- P: Os alarmes no circuito 24 Vcc aparecem de forma intermitente. O que pode ser?
  R: Fonte 24 Vcc instável; referência negativa/0 V mal conectada; borne frouxo na distribuição de 24 Vcc; cabo de sinal com mau contato.
- P: O relé de interface energiza, mas a carga de campo não atua. O que pode ser?
  R: O CLP está comandando corretamente, porém a saída do relé não está fechando; a alimentação da carga está ausente; cabo de campo interrompido; borne da carga aberto.
- P: Todos os dispositivos 24 Vcc pararam ao mesmo tempo. O que pode ser?
  R: Fonte FT1 sem saída; disjuntor do comando desligado; curto na linha 24 Vcc; distribuição do positivo ou do negativo interrompida; alimentação do painel de limpeza ausente.
`;
