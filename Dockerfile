# Используем Node.js 18 с Ubuntu
FROM node:18-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только package.json файлы для клиента и сервера
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Устанавливаем зависимости только для клиента и сервера
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
