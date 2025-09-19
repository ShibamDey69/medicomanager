FROM node:latest

RUN apt-get update && apt-get install -y ffmpeg redis-server

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install cookie-parser

COPY . .

EXPOSE 3000

CMD redis-server --daemonize yes && npx prisma generate && npx prisma db push && node server.js