# Ordemilk Tech Assist

App tecnico mobile-first da Ordemilk para suporte de campo, calculos, dimensionamento, relatorios e consulta de dados tecnicos.

## Fonte da verdade

- A raiz do projeto `./` e o runtime vivo.
- O build atual usa `index.tsx` na raiz via esbuild.
- A pasta `src/` contem codigo legado/duplicado e nao e a referencia do runtime atual.
- A pasta `dist/` e artefato gerado e nao deve ser editada manualmente.

## Requisitos

- Node.js
- Arquivo `.env` com as variaveis Gemini necessarias

## Configuracao

1. Instale as dependencias:
   `npm install`
2. Crie o `.env` a partir de `.env.example`.
3. Preencha pelo menos:
   - `GEMINI_API_KEY`
   - `GEMINI_TEXT_MODEL`
   - `GEMINI_SUPPORT_MODEL`
   - `GEMINI_SUPPORT_FALLBACK_MODEL`

## Comandos

- `npm run lint`
  Verifica tipagem TypeScript sem emitir build.
- `npm run build`
  Gera `dist/index.js` e copia os assets publicos.
- `npm start`
  Executa build, injeta a chave no bundle e serve `dist` na porta `3000`.

## Estrutura principal

- `App.tsx`: shell vivo do app
- `index.tsx`: ponto de entrada do runtime atual
- `components/`: telas e shell visiveis no app vivo
- `services/`: logica compartilhada, suporte IA, sessao e calculos
- `public/`: manifest, service worker e assets PWA
- `SALA_DE_REUNIAO.md`: governanca operacional e historico tecnico

## Observacoes

- O suporte IA roda no caminho vivo da raiz, especialmente por `components/Tool_1_Assistant.tsx` e `services/geminiService.ts`.
- Existe codigo auxiliar de testes e baterias internas em `scripts/`, `reports/` e `.tmp/`, mas isso nao faz parte do runtime principal do app.
