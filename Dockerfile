# Используем Node.js 18
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json файлы
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Устанавливаем зависимости
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Копируем исходный код
COPY . .

# Собираем клиент
RUN cd client && npm run build

# Устанавливаем рабочую директорию для сервера
WORKDIR /app/server

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["npm", "start"]
