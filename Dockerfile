# Etapa 1: Construir o aplicativo React
FROM node:18-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do aplicativo
COPY . .

# Constrói o aplicativo para produção
RUN npm run build

# Etapa 2: Servir o aplicativo com Nginx
FROM nginx:stable-alpine

# Instala 'gettext' para ter 'envsubst' que substitui variáveis de ambiente
RUN apk --no-cache add gettext

# Copia os arquivos construídos da aplicação
COPY --from=build /app/dist /usr/share/nginx/html

# Copia o template de configuração do Nginx
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Expõe a porta 8080 como padrão (o Cloud Run vai sobrescrever com a variável PORT)
EXPOSE 8080

# Inicia o Nginx. O 'envsubst' irá substituir ${PORT} no template
# com o valor da variável de ambiente PORT fornecida pelo Cloud Run.
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" ]
