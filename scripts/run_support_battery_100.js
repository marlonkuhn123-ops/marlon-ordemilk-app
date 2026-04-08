require('dotenv').config();
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { webcrypto } = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT, '.tmp');
const REPORTS_DIR = path.join(ROOT, 'reports');
const BUNDLE_PATH = path.join(TMP_DIR, 'gemini-service-test.cjs');
const API_KEY = process.env.GEMINI_API_KEY;

const AUTO = 'AUTO';
const REF = 'REF';
const ELEC = 'ELEC';

const CONTEXTS = {
  L4: { model: '4000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L5: { model: '5000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L6: { model: '6000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L7: { model: '7000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L8: { model: '8000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L10: { model: '10000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L12: { model: '12000L', voltage: '220V trifasico', refrigerant: 'R-404A' },
  L20: { model: '20000L', voltage: '380V trifasico', refrigerant: 'R-404A' },
  S9: { model: '900L', voltage: '220V monofasico', refrigerant: 'R-22' },
  S12: { model: '1200L', voltage: '220V monofasico', refrigerant: 'R-22' },
  S15: { model: '1500L', voltage: '220V monofasico', refrigerant: 'R-404A' },
  S18: { model: '1800L', voltage: '220V monofasico', refrigerant: 'R-22' },
  S20: { model: '2000L', voltage: '220V monofasico', refrigerant: 'R-404A' },
  S25: { model: '2500L', voltage: '220V monofasico', refrigerant: 'R-404A' },
  S30: { model: '3000L', voltage: '220V monofasico', refrigerant: 'R-404A' },
  R22: { model: '4000L', voltage: '220V trifasico', refrigerant: 'R-22' },
  V170: { model: '4000L', voltage: '170V', refrigerant: 'R-404A' },
  L10_380: { model: '10000L', voltage: '380V trifasico', refrigerant: 'R-404A' },
};

const makeCase = ([id, category, label, mode, contextKey, prompt, expectA, expectB, expectC = null]) => ({
  id,
  category,
  label,
  mode,
  diagnosticContext: contextKey ? CONTEXTS[contextKey] : {},
  prompt,
  maxChars: 1500,
  requireFormat: true,
  mustContainAll: [],
  mustContainAny: [expectA, expectB].concat(expectC ? [expectC] : []),
  mustExclude: [],
});

const RAW_CASES = [
  // =======================================================================
  // ELETRICA — 50 CASOS (101-150) — Apenas tanques Ordemilk
  // =======================================================================

  // — CLP grande: partida e comando —
  ['101','ELETRICA','Emergencia e agitador continua girando',ELEC,'L4','apertei a emergencia e o agitador continuou girando',['emergencia','nf','botoeira'],['clp','panasonic','seguranca']],
  ['102','ELETRICA','IHM acesa sem comando no 8000L',ELEC,'L8','ihm touch acesa sem alarme mas compressor nao recebe comando',['clp','panasonic'],['comando','contatora','saida']],
  ['103','ELETRICA','Saida YB acesa e contatora nao atraca',ELEC,'L10','a saida yb acende na ihm mas a contatora nao atraca',['clp','yb','saida'],['contatora','bobina','comando']],
  ['104','ELETRICA','Segundo compressor nao entra no 20000L',ELEC,'L20','num tanque de 20000 litros um compressor entra e o segundo nao entra nunca',['clp','panasonic','saida'],['contatora','contator','rele','comando']],
  ['105','ELETRICA','X9 pisca no fim da tarde',ELEC,'L4','todo fim de tarde o x9 fica piscando e o tanque para de gelar',['x9','clp','panasonic'],['tensao','fase','rede']],
  ['106','ELETRICA','Continuidade da botoeira de emergencia',ELEC,'L10','como testo com multimetro se a emergencia do tanque de 10000l esta abrindo',['multimetro','continuidade','bipe'],['nf','emergencia','seguranca']],
  ['107','ELETRICA','7000L sem alarme e compressor nao parte',ELEC,'L7','ihm ligada normal nenhum alarme mas o compressor nao parte no 7000 litros',['clp','panasonic'],['saida','contatora','comando']],
  ['108','ELETRICA','Contatora repicando no 5000L',ELEC,'L5','a contatora do compressor fica metralhando rapido no tanque 5000 litros',['clp','panasonic'],['tensao','fase','contatora']],
  ['109','ELETRICA','RL16 quente e sem acionar compressor',ELEC,'L10','o rele de interface rl16 esquenta mas o compressor nao aciona',['clp','rele','saida'],['comando','contatora','bobina']],

  // — Controlador pequeno: eletrica —
  ['110','ELETRICA','Floco aceso mas compressor nao parte',ELEC,'S20','o floco de refrigeracao fica aceso no controlador mas o compressor nao parte',['controlador','saida','rele'],['contatora','bobina','comando']],
  ['111','ELETRICA','Display reinicia ao atracar contatora',ELEC,'S18','quando a contatora atraca o display reinicia sozinho',['queda de tensao','fonte','ruido'],['contatora','controlador','display']],
  ['112','ELETRICA','Como ver sinal de saida no Full Gauge',ELEC,'S20','como vejo no full gauge se esta saindo comando para a contatora',['full gauge','saida','rele'],['contatora','sinal','tensao','220v','vca','multimetro']],
  ['113','ELETRICA','3000L sem comando na bobina da contatora',ELEC,'S30','o controlador acende refrigeracao mas nao chega nada na bobina da contatora',['controlador','saida','rele'],['bobina','contatora','comando']],
  ['114','ELETRICA','Como saber se o rele interno colou',ELEC,'S12','como descubro se o rele interno do controlador colou fechado',['rele','controlador','saida'],['multimetro','tensao','contato']],

  // — Painel e alimentacao —
  ['115','ELETRICA','Painel morto e IHM apagada',ELEC,'L10','painel morto e ihm apagada de uma vez',['alimentacao','24v','tensao'],['ihm','painel','fonte']],
  ['116','ELETRICA','Disjuntor cai no momento da partida',ELEC,'L4','o disjuntor cai no exato momento da partida do compressor',['disjuntor','corrente','partida'],['curto','travado','compressor']],
  ['117','ELETRICA','Compressor ronca 3 segundos e para',ELEC,'L4','o compressor ronca por 3 segundos e para',['fase','travamento mecanico','travado'],['contatora','compressor','sobrecorrente']],
  ['118','ELETRICA','Saida ativa e contatora nao puxa',ELEC,'L4','a saida de refrigeracao esta ativa no painel mas a contatora nao puxa',['contatora','bobina'],['comando','borne','fio','terminal','terminais','a1','a2']],
  ['119','ELETRICA','Subtensao de 170V e compressor sofrendo',ELEC,'V170','no fim da tarde cai para 170v e o compressor sofre para partir',['170','tensao','subtensao'],['corrente','sobrecarga','queima','enrolamento','lra','torque']],
  ['120','ELETRICA','Temperatura no display oscilando',ELEC,'L10','a temperatura no display fica oscilando sozinha sem motivo',['2k2','resistor'],['clp','display','temperatura']],
  ['121','ELETRICA','Rele de fase desarma com tres fases presentes',ELEC,'L4','o rele de falta de fase desarma mas eu medi energia nas tres fases',['fase fantasma','assimetria','desequilibrio'],['rele','falta de fase','monitor']],
  ['122','ELETRICA','Testar botoeira de emergencia com multimetro',ELEC,'L6','como testar no multimetro se a botoeira de emergencia esta abrindo direito',['multimetro','continuidade','bipe'],['nf','botoeira','emergencia']],
  ['123','ELETRICA','Ventilador liga mas compressor fica mudo',ELEC,'L4','o ventilador liga mas o compressor fica mudo sem nem roncar',['contatora','comando','bobina'],['compressor','saida','tensao']],
  ['124','ELETRICA','Termico abre apos 15 minutos no 20000L',ELEC,'L20','o termico do compressor abre depois de uns 15 minutos trabalhando',['corrente','amperagem','termico'],['alta pressao','condensador','tensao']],
  ['125','ELETRICA','Rele de interface clica mas contatora nao',ELEC,'L10','o rele de interface clica mas a contatora continua parada',['rele','interface','saida'],['contatora','bobina','comando']],
  ['126','ELETRICA','Sumiu o 24V no circuito de comando',ELEC,'L10','sumiu o 24v do circuito de comando do painel',['24v','fonte','comando'],['fusivel','transformador','alimentacao','fonte chaveada','curto','saida da fonte']],
  ['127','ELETRICA','Fusivel de comando queimando repetidamente',ELEC,'L4','o fusivel do comando queima toda vez que tenta ligar',['fusivel','curto','comando'],['bobina','fio','contatora']],
  ['128','ELETRICA','Contatora soldada e compressor nao desliga',ELEC,'L4','a contatora parece soldada e o compressor nao quer desligar',['contatora','soldada','contatos'],['seguranca','troca','desligar','fusao','arco','desenergize']],
  ['129','ELETRICA','Bobina com tensao e contatora nao atraca',ELEC,'L4','tem tensao na bobina mas a contatora nao atraca de jeito nenhum',['bobina','contatora'],['travamento','mecanico','tensao']],
  ['130','ELETRICA','Perde uma fase apenas sob carga',ELEC,'L20','parado tem as tres fases mas sob carga some uma fase',['fase','sob carga','queda de tensao'],['contatora','borne','rede']],
  ['131','ELETRICA','Parte no manual mas nao no automatico',ELEC,'L10','no manual o compressor parte no automatico nao parte',['manual','automatico'],['clp','saida','comando']],
  ['132','ELETRICA','Fonte 24V esquentando no painel',ELEC,'L10','a fonte 24v esta esquentando muito dentro do painel',['24v','fonte'],['sobrecarga','curto','comando']],
  ['133','ELETRICA','IHM liga mas comando nao chega ao compressor',ELEC,'L10','ihm liga normal mas nao chega comando no compressor',['clp','saida','borne'],['contatora','comando','rele','interface']],
  ['134','ELETRICA','Seguranca antes de abrir painel energizado',ELEC,'L4','vou abrir o painel energizado para medir a contatora agora',['desenergize','seguranca','ausencia de tensao','risco','desenergizar','perigoso','epi','tensao'],['painel','contatora']],
  ['135','ELETRICA','Emergencia nao corta e nao aparece alarme',ELEC,'L10','a emergencia nao corta nada e tambem nao mostra alarme na ihm',['emergencia','seguranca','nf'],['clp','ihm','entrada']],

  // — Armadilha CLP em grandes tanques —
  ['136','ELETRICA','TC-900 em tanque 12000L',AUTO,'L12','posso instalar um tc-900 nesse tanque de 12000 litros',['clp','panasonic'],['nao usa','controlador comercial','nao se aplica','inadequada','viola','nao recomendado']],
  ['137','ELETRICA','Resetar Ageon no 5000L',AUTO,'L5','como reseto o ageon desse tanque de 5000 litros',['clp','panasonic'],['nao usa','ageon','nao se aplica']],
  ['138','ELETRICA','Substituir painel por Full Gauge no 6000L',AUTO,'L6','quero tirar esse painel e colocar full gauge nesse 6000 litros',['clp','panasonic'],['nao usa','full gauge','nao se aplica']],
  ['139','ELETRICA','Qual Ageon comprar para 10000L',AUTO,'L10','qual ageon eu compro para um tanque de 10000 litros',['clp','panasonic'],['nao usa','ageon','nao se aplica']],
  ['140','ELETRICA','Manual sugeriu Full Gauge em 6000L',AUTO,'L6','me sugeriram por full gauge no tanque de 6000 litros isso procede',['clp','panasonic'],['nao procede','nao usa','full gauge']],

  // — Novos casos eletrica —
  ['141','ELETRICA','Klixon do compressor nao fecha mais',ELEC,'L4','o klixon do compressor nao fecha mais e o compressor nunca parte',['klixon','protecao','temperatura'],['troca','compressor','bobina']],
  ['142','ELETRICA','Agitador girando ao contrario da seta',ELEC,'L10','o agitador esta girando ao contrario do sentido indicado',['fase','inversao','agitador'],['inverter','sentido','rotacao','troca','alimentacao','motor']],
  ['143','ELETRICA','Polo da chave seccionadora aquecendo',ELEC,'L20','um dos polos da chave seccional esta visivelmente mais quente que os outros',['chave','seccional','polo'],['resistencia','contato','aquecimento']],
  ['144','ELETRICA','Medir resistencia dos enrolamentos do compressor',ELEC,'L4','preciso medir os enrolamentos do compressor com multimetro para saber se esta bom',['enrolamento','multimetro','resistencia'],['compressor','bobina','medicao']],
  ['145','ELETRICA','Disjuntor do agitador cai quando compressor parte',ELEC,'L4','o disjuntor do agitador sempre cai no momento em que o compressor parte',['corrente','partida','queda de tensao'],['agitador','disjuntor','pico']],
  ['146','ELETRICA','Tensao desequilibrada entre as tres fases',ELEC,'L10','medi as tres fases do painel e encontrei 200V 210V e 185V',['desequilibrio','assimetria','tensao'],['fase','rele','motor']],
  ['147','ELETRICA','Compressor vai direto a plena sem estrela-triangulo',ELEC,'L20','o compressor arranca direto em plena tensao sem passar pela estrela',['estrela','triangulo','partida'],['corrente','lra','disjuntor','sobrecorrente','soft','bypass']],
  ['148','ELETRICA','LED de alarme piscando sem mensagem na IHM',ELEC,'L6','tem um led de alarme piscando no painel mas a ihm nao mostra nenhuma mensagem',['led','alarme','clp'],['entrada','saida','ihm']],
  ['149','ELETRICA','Neutro com resistencia alta no borne',ELEC,'L4','medi resistencia no cabo de neutro do painel e deu acima do normal',['neutro','resistencia','borne'],['queda de tensao','contatora','corrente','sobretensao','flutuante','flutuacao']],
  ['150','ELETRICA','Motor do agitador aquecendo rapido e termico abre',ELEC,'L12','o motor do agitador esquenta muito rapido em menos de 10 minutos e o termico abre',['termico','motor','agitador'],['corrente','sobrecarga','borne']],

  // =======================================================================
  // REFRIGERACAO — 50 CASOS (151-200) — Apenas tanques Ordemilk
  // =======================================================================

  // — Succao e evaporador —
  ['151','REFRIGERACAO','Nao gela e succao quase em vacuo',REF,'L4','nao gela e a succao esta quase em vacuo',['succao','baixa','vacuo','obstrucao','restricao'],['entupimento','capilar','vet','filtro']],
  ['152','REFRIGERACAO','Succao geada ate a carcaca do compressor',REF,'L4','o cano de succao esta geado ate a carcaca do compressor',['retorno de liquido','golpe de liquido','sh baixo'],['compressor','succao']],
  ['153','REFRIGERACAO','So meia placa do fundo gelando',REF,'L4','so metade das placas do fundo esta gelando',['placa','roll-bond','evaporador'],['falta de fluido','vet','distribuicao','expansao']],
  ['154','REFRIGERACAO','VET assobiando e visor borbulhando',REF,'L4','a vet esta assobiando e o visor de liquido borbulhando sem parar',['vet','flash gas','sub-resfriamento'],['visor','borbulhando','bolhas','oleo','vazamento','filtro']],
  ['155','REFRIGERACAO','Alta em 360 psi com condensador limpo R-22',REF,'R22','a pressao de alta foi para 360 psi e o condensador esta limpo',['alta','condensacao','incondensaveis','excesso'],['incondensaveis','excesso de carga','ar no sistema','ar','umidade']],
  ['156','REFRIGERACAO','Tubo de descarga a 125 graus',REF,'L4','o tubo de descarga esta perto de 125 graus',['sh alto','superaquecimento','falta de gas'],['descarga','oleo','compressor']],
  ['157','REFRIGERACAO','Equaliza em 8 segundos apos desligar',REF,'L4','quando desliga a alta e a baixa igualam em uns 8 segundos',['sem compressao','valvula interna','placa valvular','palhetas','placa de valvulas','compressao','vedacao'],['compressor','nao bombeia']],
  ['158','REFRIGERACAO','Condensador dentro de casinha fechada',REF,'L4','o condensador esta dentro de uma casinha fechada sem exaustao',['recirculacao','ar quente','circulacao de ar','saturacao termica'],['alta pressao','condensacao','condensador']],
  ['159','REFRIGERACAO','22 psi de succao no R-404A dito normal',REF,'L4','me falaram que 22 psi de succao no r404a esta normal',['22 psi','r404a','nao'],['sh','superaquecimento','saturacao','tsat','evaporac','temperatura de evap']],
  ['160','REFRIGERACAO','Alta baixa baixa alta e amperagem baixa',REF,'R22','alta em 130 psi baixa em 80 psi e corrente pela metade do nominal',['sem compressao','nao bombeia','palhetas','perda de compressao','valvula interna'],['compressor']],

  // — Condensador e fluido —
  ['161','REFRIGERACAO','Linha de liquido suando antes da VET',REF,'L4','a linha de liquido esta suando antes da vet',['flash gas','sub-resfriamento','liquido'],['vet','linha de liquido','coluna liquida']],
  ['162','REFRIGERACAO','Filtro secador com diferencial de temperatura',REF,'L4','o filtro secador esta com muita diferenca de temperatura entre entrada e saida',['filtro','secador'],['obstrucao','entupimento','restricao']],
  ['163','REFRIGERACAO','Ventilador do condensador soprando ao contrario',REF,'L4','o ventilador do condensador esta soprando no sentido errado',['ventilador','condensador','fase','sequencia de fases'],['alta pressao','condensacao','troca termica','inversao','fases','rotacao','rejeicao de calor']],
  ['164','REFRIGERACAO','Mancha de oleo nas soldas da linha',REF,'L4','achei mancha de oleo nas soldas da linha e a carga parece baixa',['oleo','vazamento'],['carga','fluido','falta de gas']],
  ['165','REFRIGERACAO','Succao baixa com visor sem bolhas',REF,'L4','a succao esta baixa mas o visor esta cheio sem bolhas',['succao','baixa'],['vet','filtro','restricao','expansao']],
  ['166','REFRIGERACAO','Compressor ligado e leite nao abaixa temperatura',REF,'L4','o compressor fica ligado e o leite nao abaixa quase nada',['pressao','temperatura','sh','sc'],['agitador','troca termica','refrigeracao']],
  ['167','REFRIGERACAO','Segunda ordenha a 35 graus no 10000L',REF,'L10','entrou leite da segunda ordenha a 35 graus por cima do leite frio',['carga termica','pico de carga'],['agitacao','agitador','troca termica','troca de calor','mistura']],
  ['168','REFRIGERACAO','Agitador parado e fundo congelando',REF,'L10','o agitador ficou parado e o fundo esta congelando o leite',['agitador','estratificacao'],['congelamento','fundo','roll-bond']],
  ['169','REFRIGERACAO','Sub-resfriamento baixo e visor com bolhas',REF,'L4','o visor tem bolhas e o sub-resfriamento esta baixo',['sub-resfriamento','flash gas','coluna liquida','carga','restricao','falta de fluido'],['visor','bolhas','vet','filtro','linha de liquido']],
  ['170','REFRIGERACAO','Compressor parte e succao vai em vacuo rapido',REF,'L4','o compressor parte e a succao puxa vacuo muito rapido enquanto a alta mal sobe',['vacuo','succao','obstrucao','vet','restricao'],['restricao','capilar','vet','filtro']],

  // — Agitador, leite e CIP —
  ['171','REFRIGERACAO','Pa do agitador quebrou e leite congelou',REF,'L10','a pa do agitador quebrou e apareceram pontos de congelamento no leite',['agitador','estratificacao','mistura','agitacao','pa','convectivo'],['congelamento','fundo do tanque','roll-bond']],
  ['172','REFRIGERACAO','CIP com agua a 80 graus e gas preso',REF,'R22','fizeram cip com agua a 80 graus e o gas ficou preso no evaporador',['alta pressao','expansao termica','sobrepressao','expansao','sobreaquecimento'],['risco','estufar','seguranca','critico','critica','perigo','ruptura','cuidado','integridade','estufamento','interrompa','quebra','excesso de pressao','nao tente forcar']],
  ['173','REFRIGERACAO','Leite quente em cima e frio no fundo',REF,'L10','o leite ficou quente em cima e frio embaixo depois que o agitador parou',['agitador','estratificacao'],['mistura','troca termica','congelamento']],
  ['174','REFRIGERACAO','VET assobia mesmo com visor cheio',REF,'L4','a vet assobia mesmo com o visor cheio sem bolhas',['vet'],['sub-resfriamento','restricao','distribuicao','flash gas']],
  ['175','REFRIGERACAO','Retorno de liquido apos entrada de leite quente',REF,'L10','entrou leite quente e depois o compressor ficou com retorno de liquido',['retorno de liquido','golpe de liquido','vet','valvula','expansao'],['carga termica','agitador','superaquecimento']],

  // — Diagnostico e pressoes —
  ['176','REFRIGERACAO','Pressoes ditas normais mas nao gela',REF,'L4','o outro tecnico disse que as pressoes estao normais mas o 4000 litros nao gela',['pressao','psi','valor'],['sh','sc','superaquecimento','sub-resfriamento']],
  ['177','REFRIGERACAO','Operador diz pressao normal quer condenar VET',REF,'L4','o operador falou que a pressao esta normal e quer saber se ja condena a vet',['pressao','valor real','psi','sh','superaquecimento','medicao'],['sh','sc','superaquecimento','sub-resfriamento']],

  // — Novos casos refrigeracao —
  ['178','REFRIGERACAO','Pressao de baixa oscilando durante o ciclo',REF,'L6','a pressao de baixa fica oscilando bastante sem causa aparente durante o ciclo',['oscilacao','baixa','pressao'],['vet','expansao','carga']],
  ['179','REFRIGERACAO','Condensador sujo com alta em 280 psi',REF,'L8','a pressao de alta foi a 280 psi e o condensador esta sujo com depositos',['condensador','sujo','alta pressao'],['limpeza','ventilador','troca termica']],
  ['180','REFRIGERACAO','Ventilador do condensador parado e nao gela',REF,'L10','o ventilador do condensador parou de rodar e o tanque nao gela mais',['ventilador','condensador','alta pressao'],['motor','troca termica','condensacao','pressostato','rejeicao']],
  ['181','REFRIGERACAO','Succao alta 50 psi no R-22 sem gelar',REF,'R22','a succao esta em 50 psi no r22 e o tanque nao esta gelando',['succao','alta','r22'],['expansao','vet','carga excessiva','filtro','carga termica','excesso','troca termica','gelo','agitador']],
  ['182','REFRIGERACAO','Tubo de descarga frio suspeita de valvula interna',REF,'L4','o tubo de descarga esta menos quente que o normal suspeita de valvula interna',['valvula','descarga','compressor'],['sem compressao','placa valvular','nao bombeia','palhetas','eficiencia','vazamento']],
  ['183','REFRIGERACAO','Compressor cicla curto sem gelar',REF,'L5','o compressor liga e desliga rapido sem nunca gelar o leite',['ciclo curto','diferencial','histerese','ciclagem','ciclos','pressostato'],['pressao','sh','controlador','pressostato','protecao']],
  ['184','REFRIGERACAO','SH calculado negativo no campo',REF,'L4','calculei o SH e deu negativo o que isso indica',['retorno de liquido','golpe de liquido','sh negativo'],['compressor','oleo','succao']],
  ['185','REFRIGERACAO','SC de 20K com condensador novo',REF,'L4','o sub-resfriamento esta em 20K com condensador novo instalado',['excesso de carga','sobrecarga de gas','sc alto','excessivo','acima do nominal','represamento'],['sub-resfriamento','coluna liquida','carga']],
  ['186','REFRIGERACAO','Como medir SH e SC no campo',REF,'L10','como faco para medir o superaquecimento e o sub-resfriamento nesse tanque',['superaquecimento','sub-resfriamento','manifold'],['medicao','pressao','temperatura']],
  ['187','REFRIGERACAO','Visor com bolhas logo apos recarga',REF,'L4','acabei de carregar o gas mas o visor ainda mostra bolhas',['sub-resfriamento','flash gas','coluna liquida','sub-resfriado','liquido','carga incompleta'],['visor','bolhas','carga']],
  ['188','REFRIGERACAO','Alta dispara mas condensador limpo e ventilador ok',REF,'L8','a alta pressao dispara mas o condensador esta limpo e ventilador girando normal',['incondensaveis','excesso de carga','ar'],['alta pressao','fluido','refrigerante','verificar','descarga','confirme']],
  ['189','REFRIGERACAO','Pressao de descarga flutua no 20000L',REF,'L20','a pressao de descarga fica subindo e descendo sem estabilizar no tanque de 20000L',['descarga','alta pressao','flutuacao'],['condensacao','ventilador','carga']],
  ['190','REFRIGERACAO','Tubulacao de succao geada so ate a metade',REF,'L4','a tubulacao de succao esta geada somente ate a metade nao ate o compressor',['geada','succao','evaporador','superaquecimento','sh alto'],['distribuicao','sh baixo','placa','superaquecimento','sh alto','evaporacao','evaporador','filtro','vazamento','falta de gas']],
  ['191','REFRIGERACAO','TXV com bulbo solto e sintomas esperados',REF,'L6','o bulbo da txv parece solto ou sem contato com o cano o que esperar',['txv','bulbo','expansao'],['inundacao','sh','evaporador']],
  ['192','REFRIGERACAO','Leite travado em 6 graus sem descer',REF,'L4','o leite ficou travado em 6 graus por horas sem conseguir chegar a 4',['setpoint','temperatura','nao chega','ponto de equilibrio termico','travado em 6 graus'],['sh','condensador','carga termica']],
  ['193','REFRIGERACAO','Quanto de R-404A vai no 10000L',REF,'L10','quanto de r404a precisa para fazer a carga do tanque de 10000 litros',['carga','fluido','r404a'],['sh','sc','balanca','manifold','parametros','superaquecimento','termodin']],
  ['194','REFRIGERACAO','Gela bem de manha e tarde nao gela mais',REF,'L12','de manha gela normal mas toda tarde o tanque deixa de gelar',['temperatura ambiente','condensacao','calor'],['condensador','carga termica','tarde']],
  ['195','REFRIGERACAO','Carga nova mas succao vai em vacuo',REF,'L4','acabei de fazer a carga de gas mas a succao cai em vacuo rapido',['vacuo','succao','obstrucao'],['filtro','vet','entupimento']],
  ['196','REFRIGERACAO','Visor sem bolhas mas SC muito baixo',REF,'L4','o visor esta limpo sem bolhas mas o sub-resfriamento esta muito baixo',['sc baixo','sub-resfriamento','rejeicao','condensador','baixo'],['flash gas','coluna liquida','visor','condensador','excesso','fluido']],
  ['197','REFRIGERACAO','Consumo eletrico alto sem pressoes anormais',REF,'L10','a conta de energia subiu muito mas as pressoes parecem normais',['eficiencia','cop','consumo'],['condensador','carga','compressor']],
  ['198','REFRIGERACAO','Compressor muito quente sem alarme',REF,'L8','o compressor esta muito quente ao toque mas nao ha nenhum alarme',['superaquecimento','oleo','compressor'],['sh','descarga','temperatura']],
  ['199','REFRIGERACAO','Alta sobe devagar ate disparar',REF,'L4','a pressao de alta sobe lentamente ao longo de horas ate chegar ao trip',['alta pressao','condensador'],['sujo','ventilador','temperatura ambiente']],
  ['200','REFRIGERACAO','Equalizacao rapida quando desliga o compressor',REF,'L4','quando desliga o compressor a alta e a baixa igualam muito rapido em poucos segundos',['equalizacao','valvula','placa valvular'],['compressor','sem compressao','nao bombeia']],
];

const CASES = RAW_CASES.map(makeCase);

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const containsAny = (text, terms) => terms.some(term => normalize(text).includes(normalize(term)));

const checkFormat = (response, maxChars) => {
  const normalized = normalize(response);
  const issues = [];
  const warnings = [];
  if (!normalized.includes('hipotese inicial')) issues.push('faltou bloco "Hipotese Inicial"');
  if (!normalized.includes('preciso confirmar')) issues.push('faltou bloco "Preciso confirmar"');
  if (!normalized.includes('faca agora')) issues.push('faltou bloco "Faca agora"');
  if (!/\b1\./.test(normalized) || !/\b2\./.test(normalized)) issues.push('faltaram as 2 perguntas numeradas');
  if (response.length > maxChars) warnings.push(`resposta longa demais (${response.length} chars > ${maxChars})`);
  return { issues, warnings };
};

const evaluateResponse = (testCase, response) => {
  const normalized = normalize(response);
  const criticalIssues = [];
  const warnings = [];
  const formatCheck = checkFormat(response, testCase.maxChars);
  criticalIssues.push(...formatCheck.issues);
  warnings.push(...formatCheck.warnings);
  for (const term of testCase.mustContainAll) {
    if (!normalized.includes(normalize(term))) criticalIssues.push(`faltou termo esperado: "${term}"`);
  }
  for (const group of testCase.mustContainAny) {
    if (!containsAny(normalized, group)) criticalIssues.push(`faltou um dos termos esperados: ${group.join(' | ')}`);
  }
  for (const term of testCase.mustExclude) {
    if (normalized.includes(normalize(term))) criticalIssues.push(`apareceu termo proibido: "${term}"`);
  }
  const status = criticalIssues.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
  return { status, criticalIssues, warnings };
};

const buildHistory = (testCase) => [{ role: 'user', parts: [{ text: testCase.prompt }] }];

const loadGeminiService = async () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'services', 'geminiService.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: ['node18'],
    outfile: BUNDLE_PATH,
    sourcemap: false,
    logLevel: 'silent'
  });
  delete require.cache[require.resolve(BUNDLE_PATH)];
  return require(BUNDLE_PATH);
};

const ensureNodeMocks = () => {
  if (!global.localStorage) {
    global.localStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
  }
  if (!global.crypto) global.crypto = webcrypto;
};

const formatTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const summarize = (results) => {
  const summary = { total: results.length, pass: 0, warn: 0, fail: 0, passRate: 0, byCategory: {} };
  for (const result of results) {
    if (!summary.byCategory[result.category]) summary.byCategory[result.category] = { pass: 0, warn: 0, fail: 0 };
    if (result.status === 'PASS') {
      summary.pass += 1;
      summary.byCategory[result.category].pass += 1;
    } else if (result.status === 'WARN') {
      summary.warn += 1;
      summary.byCategory[result.category].warn += 1;
    } else {
      summary.fail += 1;
      summary.byCategory[result.category].fail += 1;
    }
  }
  summary.passRate = Number(((summary.pass / summary.total) * 100).toFixed(1));
  return summary;
};

const saveReports = (results, summary) => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const timestamp = formatTimestamp();
  const jsonPath = path.join(REPORTS_DIR, `support_battery100_${timestamp}.json`);
  const mdPath = path.join(REPORTS_DIR, `support_battery100_${timestamp}.md`);
  const latestPath = path.join(REPORTS_DIR, 'support_battery_100_latest.md');
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2), 'utf8');

  const lines = ['# Bateria do Suporte IA - 100 Casos Ordemilk', '', `- Data: ${new Date().toISOString()}`, `- Total: ${summary.total}`, `- PASS: ${summary.pass}`, `- WARN: ${summary.warn}`, `- FAIL: ${summary.fail}`, `- Taxa de aprovacao sem warning: ${summary.passRate}%`, '', '## Resumo por categoria', ''];
  for (const [category, info] of Object.entries(summary.byCategory)) lines.push(`- ${category}: PASS ${info.pass} | WARN ${info.warn} | FAIL ${info.fail}`);
  lines.push('', '## Casos', '');
  for (const result of results) {
    lines.push(`### ${result.status} - ${result.id} - ${result.label}`, '', `- Categoria: ${result.category}`, `- Modo: ${result.mode}`);
    if (result.diagnosticContext && Object.keys(result.diagnosticContext).length > 0) lines.push(`- Contexto: ${JSON.stringify(result.diagnosticContext)}`);
    lines.push(`- Prompt: ${result.prompt}`, `- Tempo: ${result.elapsedMs} ms`, `- Tamanho: ${result.response.length} chars`);
    if (result.criticalIssues.length > 0) lines.push(`- Issues: ${result.criticalIssues.join(' | ')}`);
    if (result.warnings.length > 0) lines.push(`- Warnings: ${result.warnings.join(' | ')}`);
    lines.push('', '```text', result.response.trim() || '(sem resposta)', '```', '');
  }
  const md = lines.join('\n');
  fs.writeFileSync(mdPath, md, 'utf8');
  fs.writeFileSync(latestPath, md, 'utf8');
  return { jsonPath, mdPath, latestPath };
};

async function main() {
  if (!API_KEY) {
    console.error('ERRO: GEMINI_API_KEY nao encontrada no ambiente.');
    process.exit(1);
  }
  ensureNodeMocks();
  const { generateChatResponseStream } = await loadGeminiService();
  console.log(`Iniciando bateria Ordemilk: ${CASES.length} casos (50 ELETRICA + 50 REFRIGERACAO)`);
  const results = [];
  for (let index = 0; index < CASES.length; index += 1) {
    const testCase = CASES[index];
    const startedAt = Date.now();
    let response = '';
    let transportError = null;
    try {
      response = await generateChatResponseStream(buildHistory(testCase), undefined, undefined, testCase.mode, testCase.diagnosticContext, 1);
    } catch (error) {
      transportError = error;
      response = String(error?.message || error || 'Falha desconhecida');
    }
    const elapsedMs = Date.now() - startedAt;
    const evaluation = evaluateResponse(testCase, response);
    if (transportError) {
      evaluation.status = 'FAIL';
      evaluation.criticalIssues.unshift(`erro de execucao/API: ${String(transportError.message || transportError)}`);
    }
    const result = { id: testCase.id, category: testCase.category, label: testCase.label, mode: testCase.mode, diagnosticContext: testCase.diagnosticContext, prompt: testCase.prompt, response, elapsedMs, status: evaluation.status, criticalIssues: evaluation.criticalIssues, warnings: evaluation.warnings };
    results.push(result);
    console.log(`[${index + 1}/${CASES.length}] ${result.status} - ${result.id} - ${result.label} (${elapsedMs} ms)`);
  }
  const summary = summarize(results);
  const reportPaths = saveReports(results, summary);
  console.log('\nResumo final:');
  console.log(`- PASS: ${summary.pass}`);
  console.log(`- WARN: ${summary.warn}`);
  console.log(`- FAIL: ${summary.fail}`);
  console.log(`- Taxa de aprovacao sem warning: ${summary.passRate}%`);
  console.log(`- JSON: ${reportPaths.jsonPath}`);
  console.log(`- MD: ${reportPaths.mdPath}`);
  console.log(`- Latest: ${reportPaths.latestPath}`);
}

main().catch((error) => {
  console.error('Falha fatal ao executar a bateria Ordemilk:', error);
  process.exit(1);
});
