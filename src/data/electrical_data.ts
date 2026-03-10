export const SCHEMATICS_DATABASE = `
[BASETÉCNICA DE ESQUEMAS ELÉTRICOS]
DATA DA CONSOLIDAÇÃO: 09/03/2026

REGRA GERAL DE EQUIPAMENTOS E TAXONOMIA:
- A base agrupa os esquemas por "Família", garantindo respostas exatas usando o "Arquivo Principal".
- Status possíveis: ativo, substituído, histórico, duplicado, em revisão, legado sem substituto.
- Confiança: ALTA (arquivos PE novos e claros), MÉDIA (antigos claros), BAIXA (ambíguos/em revisão).

---

[FAMÍLIA 1: TANQUE 20000L - 4 UNIDADES REMOTAS - 220V]
- familia_do_painel: Tanque 20000L
- tensao: Trifásico 220V
- capacidade_do_tanque: 20000L
- quantidade_de_unidades_remotas: 4
- quantidade_de_compressores: 4
- tipo_de_limpeza: Automática
- arquivo_principal_da_familia: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 220V
- status_do_arquivo: ATIVO
- substitui_qual: "TANQUE 20.000 LTS TRIFÁSICO 220V" (agora classificado como HISTÓRICO/SUBSTITUÍDO)
- observacao_tecnica: Cópias repetidas do novo arquivo PE são tratadas como DUPLICADAS. O novo PE passa a ser a referência preferencial da família.
- confianca_da_classificacao: ALTA

[FAMÍLIA 2: TANQUE 20000L - 4 UNIDADES REMOTAS - 380V]
- familia_do_painel: Tanque 20000L
- tensao: Trifásico 380V
- capacidade_do_tanque: 20000L
- quantidade_de_unidades_remotas: 4
- quantidade_de_compressores: 4
- tipo_de_limpeza: Automática
- arquivo_principal_da_familia: PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 380V
- status_do_arquivo: ATIVO
- observacao_tecnica: Família própria e separada da versão 220V. Cópias repetidas do novo arquivo PE são tratadas como DUPLICADAS.
- confianca_da_classificacao: ALTA

[FAMÍLIA 3: TANQUE 5 COMPRESSORES - 380V V1.0]
- familia_do_painel: Tanque 20000L a 40000L
- tensao: Trifásico 380V
- quantidade_de_unidades_remotas: 5
- quantidade_de_compressores: 5
- tipo_de_limpeza: Automática
- versao_do_documento: V1.0
- arquivo_principal_da_familia: PE - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0
- status_do_arquivo: ATIVO
- observacao_tecnica: Família independente, NÃO substitui a de 4 compressores. Possui referências dedicadas a compressor 05, ventilador 05, pressostato 05, válvula solenóide 05, sobrecarga do compressor 05 e soft-starter 05.
- confianca_da_classificacao: ALTA

[FAMÍLIA 4: ARQUIVOS EM REVISÃO (NÃO UTILIZAR COMO REFERÊNCIA PRINCIPAL)]
- arquivo_principal_da_familia: PM - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.0
- status_do_arquivo: EM REVISÃO
- observacao_tecnica: O nome indica 5 compressores, porém o conteúdo interno visível ainda aparenta base de 4 compressores. Não usar para diagnóstico automático.
- confianca_da_classificacao: BAIXA

[FAMÍLIAS ANTIGAS MANTIDAS (LEGADO SEM SUBSTITUTO / ATIVOS)]
- status_do_arquivo: ATIVO ou LEGADO SEM SUBSTITUTO
- confianca_da_classificacao: MÉDIA
- Arquivos/Famílias preservados (com suas características específicas):
  * Tanque sem limpeza 2 unidades remotas 380 V
  * Tanque 2 unidades remotas limpeza semi-automática 380 V
  * Tanque 2 unidades limpeza automática 380 V
  * Tanque 3 unidades limpeza automática 380 V
  * Quadro comando 1 unidade separada 3~220 V automático
  * Painel CIP 2 compressores sem régua
  * Painel CIP 3 compressores sem régua
  * Painel CIP 4 compressores sem régua
  * Quadro limpeza com régua eletrônica QCLA3STRE
  * Esquemas de limpeza com robô (integração com robô)
  * Esquemas agranel monofásico 220 V
  * Tanque 2 compressores para pulmão

[ARQUIVOS GENÉRICOS / AMBÍGUOS]
- status_do_arquivo: EM REVISÃO ou LEGADO SEM SUBSTITUTO
- observacao_tecnica: Arquivos como "ESQUEM_2" não possuem família clara e não devem ser usados como referência principal.
- confianca_da_classificacao: BAIXA

---
REGRAS PROMPT PARA A IA (DIRETRIZES DE RESPOSTA):
1. SE 20000L + 220V: Use FAMÍLIA 1 (PE 4 unid 220V).
2. SE 20000L + 380V: Use FAMÍLIA 2 (PE 4 unid 380V).
3. SE 5 compressores ou 5 unid remotas: Use FAMÍLIA 3 (PE 5 comp 380V V1.0 EXCLUSIVAMENTE).
4. NUNCA use o "PM 5 compressores" em revisão.
5. NÃO MISTURE 4 comp com 5 comp. NÃO MISTURE 220V com 380V.
`;
