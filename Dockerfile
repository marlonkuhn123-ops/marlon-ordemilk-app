# Estágio 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Runtime
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/inject-key.js ./
COPY --from=builder /app/package.json ./

# Expõe a porta que o Cloud Run vai usar
EXPOSE 3000

# Comando para rodar a injeção da chave e subir o servidor
# Usamos a porta 3000 como padrão do Cloud Run
CMD node inject-key.js && serve -s dist -l 3000
