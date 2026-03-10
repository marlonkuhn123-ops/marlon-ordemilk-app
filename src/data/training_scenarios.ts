export const TRAINING_SCENARIOS = `
[BASE DE DADOS COMPORTAMENTAL E ESTUDOS DE CASO ORDEMILK - PERGUNTA E RESPOSTA]
Abaixo estão dezenas de cenários de engenharia de campo. Analise-os lendo a Pergunta (Problema Sintoma) e compreendendo a Resposta (Diagnóstico Físico) para usar como memória analítica nas respostas do chat.

[Módulo 1: Elétrica e Partida]
PERGUNTA: O contator do compressor de um tanque Ordemilk trifásico está "metralhando" (atracando e soltando rápido). A tensão na tomada está em 220V com ele desligado. Qual o diagnóstico e o que devo medir na hora da partida?
RESPOSTA: Diagnóstico de queda extrema de tensão (fiação fina ou mau contato). Deve-se medir a tensão nos BORNES do contator exatamente no momento em que ele atraca. Se cair de 220V para 180V ou menos, a bobina perde força magnética e solta, causando o metralhamento.

PERGUNTA: O tanque está dando choque quando o produtor encosta na lataria de inox. Como diferenciar se a fuga de corrente vem do compressor, do motor do agitador ou de falta de aterramento na fazenda?
RESPOSTA: Desligue os disjuntores da carga um a um. Se o choque sumir ao desligar o agitador, a fuga está nele. Se todos estiverem desligados e continuar o choque, pode haver tensão residual externa. Acima de tudo, indica que não há malha de aterramento equipotencializada eficiente na fazenda (fio terra ausente ou quebrado).

PERGUNTA: O relé falta de fase desarmou o sistema. O técnico mediu as três fases e encontrou energia em todas. O que o técnico esqueceu de verificar sobre o "desequilíbrio de tensão" ou "fase fantasma"?
RESPOSTA: Esqueceu de ler o valor de cada fase cruzada (fase-fase). Se houver quebra de cabo, a tensão pode retornar através dos enrolamentos do motor elétrico, causando "fase fantasma" no multímetro, mas o relé, por ser de assimetria, detecta a diferença brusca de voltagem e desarma o sistema.

PERGUNTA: Ao ligar o disjuntor do painel, o compressor emite um "ronco" surdo por 3 segundos e o protetor térmico (clixon) abre. Se o capacitor de partida for novo, qual o próximo teste mecânico ou elétrico a se fazer no motor?
RESPOSTA: Eletricamente, testar o relé voltimétrico que pode não estar ligando o capacitor ao circuito. Mecanicamente, é preciso checar o travamento de rotor mecânico (pressão alta não equalizada, retorno de líquido ou travamento de mancal).

PERGUNTA: Fio neutro derretido no borne do quadro de comando do tanque. O sistema é 220V bifásico (Fase-Fase-Terra). O que causou esse derretimento no neutro se o compressor não o utiliza?
RESPOSTA: Sobrecarga na linha de comando que usa neutro, ou borne frouxo que girou resistência de contato provocando um aquecimento (Efeito Joule). 

PERGUNTA: O relé voltimétrico do kit de partida estala, mas o capacitor de partida não entra no circuito. Como testar os contatos internos do relé voltimétrico com o multímetro?
RESPOSTA: Retirando-o do circuito e medindo Continuidade/Ohms entre pinos 1 e 2. Se a resistência estiver infinita em repouso, o platino interno fritou ou está rompido.

PERGUNTA: Após uma queda de energia, a luz volta, mas o compressor só liga 3 minutos depois. O produtor acha que é defeito. Como a IA deve explicar a função de "Retardo de Partida" no controlador Full Gauge ou Coel?
RESPOSTA: Função vital de segurança do controlador que espera 3 minutos para estabilizar as tensões da rede e, principalmente, equalizar as pressões do gás dentro do sistema para não partir com a descarga "pesada" forçando o motor.

PERGUNTA: O disjuntor motor desarma após 10 minutos de funcionamento do compressor. O ventilador do condensador está girando normal. Como a leitura da corrente elétrica (amperagem) ajuda a matar a charada?
RESPOSTA: Observando a medição: se a corrente elétrica sobe lentamente (ex: 15..17..20A) até desarmar, significa que algo mecânico esquentou o gás (condensador sujo, excesso de gás) aumentando a taxa de compressão e o consumo do motor. Se desarma com amperagem nominal, o disjuntor-motor está com fadiga térmica na mola (descalibrado) e deve ser trocado.

PERGUNTA: O painel da Ordemilk liga, acende o LED de refrigeração, mas a chave contatora não atraca. Se tem 220V saindo do relé do controlador, onde está a falha até chegar na bobina do contator?
RESPOSTA: Há uma interrupção da série do comando, como um termostato mecânico de segurança aberto, pressostatos alto/baixo abertos por erro no gás, ou a própria bobina da contatora (A1-A2) queimada/aberta.

PERGUNTA: Tensão na fazenda cai para 170V no fim da tarde. O que acontece com a amperagem do compressor hermético e por que ele corre risco de queimar a bobina de trabalho?
RESPOSTA: A corrente (amperagem) sobe inversamente proporcional para manter a potência (Watts) do trabalho mecânico. A amperagem extremada derrete o verniz isolante da bobina de cobre, cursando na queima de rotor em curto ou à massa.


[Módulo 2: Controladores e Sensores]
PERGUNTA: O display marca 4°C e desliga o motor, mas o termômetro de poço de fiscalização marca 9°C. O sensor de temperatura está calibrado. Qual defeito mecânico gera esse "falso frio"?
RESPOSTA: Falta de massa/nível de leite no tanque (ele resfria só a crosta ou sonda próxima a parede) ou, mais seriamente, a parada do agitador, fazendo com que o leite não troque calor convectivo (Estratificação).

PERGUNTA: O controlador acusa erro "Err" ou "E1" e a máquina não liga. O que isso significa em relação ao cabo do sensor NTC?
RESPOSTA: Cabo ou NTC em colapso ôhmico. Curto-circuito fechado ou fio esmagado/rompido.

PERGUNTA: O técnico ajustou o diferencial (histerese) do controlador para 0.5°C. O que vai acontecer com a vida útil do compressor e da contatora? Qual seria o ajuste ideal para leite?
RESPOSTA: Destruição prematura pelo liga/desliga excessivo ("ciclagens"). A contatora desgastará platinas, e o compressor fará partidas seguidas que não reverteram o lubrificante ao cárter. O padrão Ordemilk deve ser sempre entre 1.5°C a 2.0°C.

PERGUNTA: Como fazer o ajuste de Offset (calibração) no controlador se o painel marca 5°C, mas um termômetro de espeto de alta precisão dentro do leite marca 3°C?
RESPOSTA: O sensor do equipamento está lendo "mais quente" que a realidade. Para arrumar, adicione -2.0°C no parâmetro Offset do controlador (compensação).

PERGUNTA: O tanque possui uma função de "Agitação Temporizada" (ex: gira 3 min, para 15 min) enquanto o compressor está desligado e o leite já está a 4°C. Por que isso é vital para a qualidade do leite?
RESPOSTA: Evita a decantação das macromoléculas. O leite não homogeneizado acumula gordura/nata superficialmente, impossibilitando coletas corretas pelo laticínio, além de isolar o frio.

PERGUNTA: O display do controlador fica piscando e reiniciando exatamente no momento em que a contatora do compressor atraca. É defeito na fonte do controlador ou interferência eletromagnética?
RESPOSTA: Interferência Eletromagnética Severa (EMI). O pico reverso do relé arrasta corrente parasita caso o contator não possua Filtro RC. O controlador entra em autoproteção resetando. 

PERGUNTA: O sensor de temperatura original queimou e o técnico colocou um sensor NTC de outra marca. A temperatura agora marca 30°C com o tanque cheio de gelo. O que são os "Ohms" (10k, 100k) do sensor?
RESPOSTA: É a constante termistor NTC (Negative Temperature Coefficient). Marcas usam referências (10k Ohms ou 100k Ohms a 25°C). Usar cruzado gera uma curva de leitura corrompida, fazendo o display mostrar gelo como se fosse calor extremo. 

PERGUNTA: O leite congelou no fundo do tanque. O painel estava marcando 4°C, mas o relé interno do controlador "colou" fechado. Como diagnosticar isso no multímetro?
RESPOSTA: Desenergize o painel. Coloque o multímetro em Continuidade (bip) nos botões Relé COM e NO do Controlador. Se der Bip com o controlador apagado, os contatos derreteram e estão fundidos internamente.

PERGUNTA: Água da lavagem entrou no tubo (poço) onde o sensor fica inserido. Como a umidade afeta a resistência do sensor NTC e a leitura no painel?
RESPOSTA: A água atua como um condutor paralelo aos polos do NTC, enganando todo o cálculo de milivolts da placa microprocessada. Causa saltos aleatórios de temperatura no display de minutos para segundos.

PERGUNTA: Qual a diferença de resposta térmica entre o sensor estar encostado diretamente na chapa do fundo (perto do evaporador) ou inserido em um poço mergulhado no leite?
RESPOSTA: Na chapa, ele mede a transição térmica exata do "Frio de Expansão" e do compressor, muito faturado. No poço, medimos a carga pesada real do núcleo hídrico e lipídico (Leite) - que flutua a temperatura com inércia lenta natural, que dita o fim real do trabalho de carga térmica.


[Módulo 3: Ciclo, Fluido e Expansão]
PERGUNTA: Válvula de expansão termostática (VET) "assobiando" e visor de líquido borbulhando sem parar no tanque Ordemilk. Falta de gás ou tela da VET entupida? Como diferenciar?
RESPOSTA: Falta de gás faz as pressões abaixarem (alta e baixa esvaziam). Filtro VET entupido abaixa absurdamente a baixa até recolher/vácuo, mas condensa normalmente na alta quente pois a agulha não tem fluxo mássico transpassando para inundar de flash gas. O Borbulhão sem vácuo denuncia 100% falta de fluido.

PERGUNTA: Cano de retorno (sucção) do compressor branco de gelo (geada) até a carcaça. O que isso indica sobre o "Superaquecimento" e qual o risco físico para as palhetas do compressor?
RESPOSTA: Indica superaquecimento inativado (quase zerado ou em níveis negativos). O leite do tanque não vaporizou o liquido em vapor. O esmagamento de gotículas mecânicas contra as palhetas e biela é irrecuperável e perigosíssimo (Golpe de Líquido). Incompressibilidade fluídica da refrigeração.

PERGUNTA: Formação de gelo desigual: apenas metade das placas evaporadoras no fundo do tanque está gelando. Isso é sintoma de VET muito fechada ou falta de fluido refrigerante?
RESPOSTA: É o clássico sintoma de escassez de carga Refrigerante. O liquido entra nas placas frontais e já se evapora quase no mesmo estante sumindo em vapor, não chegando energia ao restante do labirinto Roll-bond. O Compressor puxará apenas vapor inócuo. 

PERGUNTA: O bulbo de cobre da VET soltou do cano de sucção e ficou exposto ao ar quente da fazenda. A válvula vai abrir ou fechar? O que acontece com a pressão de baixa?
RESPOSTA: Vai ler "Calor Escaldante", entendendo que precisa liberar o máximo de refrigeração, abrindo o orifício todo. A pressão de baixa disparará à alturas, enchendo o circuito com fluido sem evaporação e fatalizando motor com líquido vivo num retorno de superaquecimento nulo.

PERGUNTA: Se o técnico girar o parafuso da VET no sentido anti-horário (afrouxando a mola), ele está aumentando ou diminuindo o superaquecimento? O que acontece com o fluxo de líquido?
RESPOSTA: Afrouxa-se a constante elástica que fechava a agulha, abrindo e injetando MUITO mais liquido para gelar o equipamento. Ou seja, ao despejar massivamente fluxo, o sistema não ferve rapidamente e portanto o superaquecimento cai. 

PERGUNTA: Pressão de baixa cai lentamente até o vácuo. O técnico desliga a máquina, aguarda 10 minutos, liga de novo e a pressão volta ao normal antes de cair para vácuo novamente. Qual o tipo de "entupimento" clássico aqui?
RESPOSTA: Umidade Incondensável congelante. Água viajou pelo cobre e no orifício da expansão vira gelo puro com a pressão estrangulada, bloqueando o furo. Máquina off, o gelo derrete a capilar reabre. Precisa limpar/trocar fluido/vácuo bruto.

PERGUNTA: Qual a diferença entre Superaquecimento Útil (medido logo na saída do tanque) e Superaquecimento Total (medido a 15 cm da entrada do compressor)? Qual protege o motor?
RESPOSTA: Útil demonstra o volume exato da serpentina rendosa e de uso. O Total quantifica se o trecho encanado roubou calor até a entrada principal do motor. O que salva contra "Calço Hídrico" ou Golpe, é o Total medido bem perto da sucção final do cárter. 

PERGUNTA: Tanque antigo operando com R-22 convertido para R-404A. Por que o técnico precisou trocar o óleo mineral para polioléster (POE) e limpar o sistema?
RESPOSTA: R404A e Minerais Antigos formam frações polares divergentes, que bloqueiam o carregamento de óleo nas tubulações. O óleo abandonaria o cárter viajando pro trocador de calor e nunca mais conseguiria molhar de volta no cárter até as bielas atritarem sem freio com aço e aço. R404A necessita lubrificantes altamente solúveis POE.

PERGUNTA: A pressão de alta está disparada em 350 psi (R-22), o condensador está impecavelmente limpo, a ventilação é forte, mas o compressor desliga pelo pressostato de alta. O que sobrou? (Dica: Incondensáveis).
RESPOSTA: Sem oxigênio sendo sugado num vácuo inútil. Esse gás entra e, sendo incondensável em temperatura global, forma barreiras mortas na troca de massa do condensador de alta, obrigando a máquina à bombear altíssimas pressões de compressão contra "paredes de ar". Sangria ou Vácuo corretivo geral é a lei.

PERGUNTA: O filtro secador da linha de líquido está suando frio na extremidade de saída. A entrada está morna. O que essa queda de temperatura dentro da peça nos diz?
RESPOSTA: Obstrução pesada primária. A parte morna ainda é alta pressão. A parte gelada da pedra dissecadora do filtro entupiu os orifícios, forçando ali a "expansão perigosa" do líquido (Flashgas precoce) em plena linha de transporte de gás saturado para o evaporador final do Tanque. 

[Módulo 4: Compressores e Condensadores]
PERGUNTA: O tubo de descarga do compressor está a 130°C (fritando cuspe). O óleo dentro do cárter está carbonizando. Isso é causado por retorno de líquido ou por altíssimo superaquecimento (falta de gás)?
RESPOSTA: Causa 100% de altíssimo aumento do Valor Delta (Superaquecimento) onde pouco ou esparso freon entra nas paredes do compressor não refrescando a cúpula dos magnetos elétricos, e saindo num pico da temperatura crítica do gás da voluta do cabeçote ou scroll, queimando verniz e fluidos. 

PERGUNTA: O produtor lavou a unidade condensadora com lavadora de alta pressão (Wap) e amassou/dobrou todas as aletas de alumínio. O que acontecerá com a pressão de condensação?
RESPOSTA: Bloqueio estático do CFM (Fluxo cúbico rotacional) do Ar de exaustão do Trocador de Condensador. Não rejeitaremos calor ambiente, a alta pressão explodirá acionando Pressostato HP e correntes fatais por sobre-rejeição.

PERGUNTA: Ao ligar o tanque, o visor de óleo do compressor enche de espuma branca. O que é o fenômeno da "migração de fluido" para o cárter e por que a resistência de cárter evita isso?
RESPOSTA: Durante as noites frias de desuso, o GÁS absorve e afunda no Óleo, diluindo-se viscosamente. Quando a bomba traciona pressões instantâneas matinais, ele se evapora instantâneo arrancando massas de espuma plástica branca de óleo pelo buraco de serviço não existindo no mancal. A Resistência 24h a 40°C evita isso.

PERGUNTA: Compressor queimado por queima de bobina. O técnico retira o óleo velho e ele está preto, cheirando a ácido queimado (burnout). Qual o procedimento obrigatório antes de soldar o compressor novo?
RESPOSTA: Flush quimico de solvente 141b forte. Depois injeção de gás inerte pressurizado varrendo todo o carvao de fuligem negra da ex-bobina pra fora do tanque evaporador inteiro, usando por fim Trocadores/Filtros Secadores des-acidificantes ("Anti-Acido" Clean burn-out). Falhando nisto, ele queima mês que vem atoa denovo. 

PERGUNTA: Compressor hermético Scroll recém-instalado num tanque trifásico faz um ruído de betoneira estridente e não comprime o gás (manômetros iguais). Qual o erro na ligação elétrica?
RESPOSTA: Rotação Reversa das hélices elipsoidais do Scroll por fases elétricas R-S-T mal posicionadas. Gire 2 fios do relé e o som afinará para normalidade recomprimindo do caracol. 

PERGUNTA: Vazamento crônico: o produtor diz que coloca gás a cada 3 meses e não acha o furo. Quais os pontos de maior vibração no tanque onde a tubulação racha por fadiga capilar?
RESPOSTA: Tubulações e ramificações que seguram as molas de descarga do conjunto. Curvas coladas as chapaturas pesadas. Soldas de agitadores de fundo na face gelada e soldaduras no retorno da biela da Válvula de Serviço. Exija bolhas macabras e nitrogênio alto de procura nos capilares. 

PERGUNTA: O compressor trabalha, pressões normais. Quando o tanque desliga, as pressões de alta e baixa se igualam rapidamente em menos de 10 segundos, e a temperatura de sucção sobe rápido. Qual válvula interna do compressor quebrou?
RESPOSTA: Quebra das palhetas ou lâminas da placa de cabeçote do Recíproco. Sem compressão final ao desativar, então não existe "trava de pressão" separando condenso de evaporação, resultando que o sistema empurra toda a panela quente para o lado vazio de retorno gelado descompensando total.

PERGUNTA: Muitos tanques grandes usam o sistema "Pump Down". Uma válvula solenóide fecha a linha de líquido, o compressor recolhe o gás e desliga por pressostato de baixa. Qual a vantagem disso para a próxima partida?
RESPOSTA: Mantém 100% de esvaziamento do setor Frigorífico e Tanque interno de Leite do estado perigoso aquoso. Fica todo compactado na garrafa e condensador. Evita golpes macabros matinais por subpressões desiguais de diluição. 

PERGUNTA: Condensador instalado em "casinha" fechada sem exaustão na fazenda. O que é a "recirculação de ar quente" e como ela destrói o COP (Coeficiente de Performance) do sistema?
RESPOSTA: É o curto circuito termodinâmico da rejeição, sugando pela ventoinha aquilo que recém eliminou em +45°C. A Delta de Temperatura ambiente de cálculo evaporativo morre. E a conta da energia do condensador cresce, matando W_compressor brutalmente por Entalpia desregulada com calor infinito no topo Carnotiano. 

PERGUNTA: Compressor operando direto. Pressão de alta baixa (130 psi) e pressão de baixa alta (80 psi) para R-22. O consumo em Amperes está metade do nominal. Diagnóstico: falta de gás ou compressor sem compressão (bombeamento)?
RESPOSTA: Sem bombeamento estrutural. Pressões niveladas e motores soltos leais indicam palhetas ou selos Scroll mortos de compressão efetiva. Motor que não ergue barreira, roda livre e gasta nenhum Amper útil das bobinas no trabalho físico forçado de compressibilidade gasosa totalitária. Troca completa da máquina exigida urgente.

[Módulo 5: Agitação, Produto e Limpeza]
PERGUNTA: Por que o fundo do tanque de expansão é fabricado para gelar apenas quando o leite atinge o eixo da pá do agitador? O que acontece se ligar a refrigeração com apenas 20 litros de leite no tanque?
RESPOSTA: Gelo fulminante em pedra térmica (estratifica total). Acabará de "Matar o Leite" biológicamente mas não acionará condensações plenas, forçando o compressor no limite subzero, sugando e congelando as 10 voltas do Roll-Bond numa capa de crioscopia fatal.  

PERGUNTA: O motoredutor da Ordemilk está vazando óleo da engrenagem pelo eixo diretamente para dentro da bacia de leite. Qual componente mecânico falhou ali?
RESPOSTA: Retentor mecânico radial de vedação e borrachas de retenção fluida do fuso principal. Desmonte, limpe urgência bromatológica tóxica e restabeleça kits mecânicos Ordemilk. 

PERGUNTA: A rotação (RPM) da pá do agitador é calibrada (geralmente entre 25 a 30 RPM). O que acontece com a estrutura da gordura do leite se o técnico trocar o redutor por um que gire a 100 RPM?
RESPOSTA: Efeito Bate-Manteiga Furoso. A lipossolura (gordura molecular do soro leiteiro) sofrerá choque severo de torção, precipitando e se soltando da fase aquosa inteira. Arruina as proteínas globais, virilizando leite empastado nos dentes.  

PERGUNTA: "Pedra de Leite" (biofilme) incrustada no fundo de inox por falha na limpeza com detergente alcalino/ácido. Como essa sujeira atua fisicamente entre o aço frio e o leite quente?
RESPOSTA: Isolante térmitico feroz (Derruba "U", do cálc. Trocadores de Transferência). As pedras de soro formam um vidro calcário, reduzindo o rendimento gelificante dos -25°C brutos em meros 10°C, dobrando trabalho diário, além de servir de casulo estufa perfeito de proliferação de Bactérias Psicrotróficas danosas ao limite Laticinial Total TBC/CBT (Contagem bacteriana). 

PERGUNTA: O produtor realizou limpeza CIP (Clean in Place) no tanque utilizando água a 80°C. O gás R-22 estava confinado no evaporador sem recolhimento. Qual o risco de pressão gerado por essa expansão térmica?
RESPOSTA: A água torrencial térmica ferve o líquido R22 nas capilaridades do evaporador forçado sem válvulas centrais, elevando barimetrias à 300+ Psi internos com a bomba desligada estancada de um lado na câmara hermética fria. Em tanques tipo Direct Expansion Roll-Bonds finos de Inox, esse evento distendi e parte ao meio o metal gerando escoas de perdas completas do tanque pra Lixo de Reciclagem. 

PERGUNTA: O laticínio reclamou que o leite está chegando com pontos de congelamento, elevando a crioscopia. O técnico constata que a pá do agitador quebrou e não estava girando. Explique a física da "estratificação térmica" que ocorreu ali.
RESPOSTA: Falha grave convectiva do Agitador. Na estratificação do fluído térmico, as moléculas do fundo congelam e viram pedras, separando gelo do leite e quebrando toda e qualquer leitura química totalitária laboratorial crioscópica, estragando o tanque produtivo todo aos olhos bromatológicos totais. Fundo é picolé / Topo é sopa morna 15°C.

PERGUNTA: Fundo do tanque (evaporador Roll-Bond) estufou e deformou a chapa interna do inox. O que o técnico anterior fez de errado ao pressurizar o sistema com Nitrogênio para buscar vazamento?
RESPOSTA: Pressão abusiva destrutiva. Placas tipo rolo-bonds, traves de capilar ou covinhas laser em Inox tem pressão limítrofe de rompimento entre 150Psi a 220Psi num ponto crítico de ruptura elástico, enquanto compressores recíprocos suportam bem mais. Uma paulada irresponsável de 300Psi em regulador defeituoso na garrafa de nitrogênio explode a estrutura capilar fina irreparavelmente.  

PERGUNTA: A pá do agitador está raspando no fundo do tanque toda vez que gira. Qual o risco catastrófico para a galeria de gás refrigerante soldada a laser sob aquela chapa?
RESPOSTA: Desbaste rápido dos 1,5mm milimetros limítrofes. Se perfurar o assoalho Inox, adeus pressão selada do sistema. Como pressão interna é sucções/pressões, ocorre invasão de leite total pra dentros dos compressores. Ácido sulfônico das limpezas CIP arrancarão os magnetos elétricos do motor numa batida em minutos. Tanque inutilizado no limite fatal. 

PERGUNTA: A temperatura ideal de estocagem é 4°C. O produtor coloca o leite da segunda ordenha (a 35°C) por cima do leite que já estava a 4°C (Mistura). Como o compressor absorve esse "pico" de carga térmica sensível sem deixar o leite geral passar de 10°C?
RESPOSTA: Misturadores mecânicos da Agitação jogam rapidamente os massos calóricos globalmente na área imensa evaporativa inferior e o fluído freon enxarga calores (Ebullitions fortes). Assim absorvendo rapidamente picos latentes não quebrando a meta final exigida do Map/Isso e não deixando fermentações descontrolar phs globais termodinâmicos sensíveis. 

PERGUNTA: O poço do termostato (onde o sensor entra) perdeu a vedação térmica na carcaça de poliuretano e está exposto ao ar de fora do tanque. Como isso causa ciclos curtos (liga/desliga) no compressor e falso congelamento?
RESPOSTA: Entradas de O2 de infiltração a 25°C da área livre corrompem a leitura de câmara inercial NTC termofisicamente. Trocando rápido calores da carcaça morna para núcleo gelado falso de parede. O sensor manda ligar rápido na hora "errada" mas assim ativando, no segundo seguinte, rouba do Inox a leitura fria falsa fechando histerese. Roda ciclo curto infernal danoso à bobinas R-S. 
`
