
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
`;
