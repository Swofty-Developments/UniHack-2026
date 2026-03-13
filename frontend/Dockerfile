FROM node:20-alpine

WORKDIR /app

RUN npm install -g @expo/ngrok

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081 19000 19001

CMD ["npx", "expo", "start", "--tunnel"]
