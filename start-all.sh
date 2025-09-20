#!/bin/bash

echo "🚀 Запуск всей системы SofanyCRM..."

# Функция для завершения всех процессов при выходе
cleanup() {
    echo "🛑 Остановка всех процессов..."
    pkill -f "node.*server"
    pkill -f "react-scripts"
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM

# Запускаем сервер в фоне
echo "🔄 Запуск сервера..."
cd server
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей сервера..."
    npm install
fi
npm run dev &
SERVER_PID=$!

# Ждем немного, чтобы сервер запустился
sleep 3

# Запускаем клиент в фоне
echo "🔄 Запуск клиента..."
cd ../client
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей клиента..."
    npm install
fi
npm start &
CLIENT_PID=$!

echo "✅ Система запущена!"
echo "🌐 Сервер: http://localhost:5000"
echo "🌐 Клиент: http://localhost:3000"
echo "📝 Для остановки нажмите Ctrl+C"

# Ждем завершения процессов
wait
