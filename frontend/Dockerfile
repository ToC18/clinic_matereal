FROM node:20-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g vite

COPY . .

CMD ["vite", "--host"]
