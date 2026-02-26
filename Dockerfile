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

# Copia os arquivos construídos da etapa anterior para o diretório do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 para o tráfego da web
EXPOSE 80

# Comando para iniciar o Nginx quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]
