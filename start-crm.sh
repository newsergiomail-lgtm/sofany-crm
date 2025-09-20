#!/bin/bash

echo "🚀 Запуск SofanyCRM системы..."
echo "================================"

# Функция для завершения всех процессов при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка системы..."
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    echo "✅ Все процессы остановлены"
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM

# Проверяем, установлены ли зависимости
echo "📦 Проверка зависимостей..."

if [ ! -d "server/node_modules" ]; then
    echo "📥 Установка зависимостей сервера..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📥 Установка зависимостей клиента..."
    cd client
    npm install
    cd ..
fi

echo "✅ Зависимости проверены"

# Запускаем сервер
echo "🔄 Запуск сервера API..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Ждем немного, чтобы сервер запустился
echo "⏳ Ожидание запуска сервера..."
sleep 5

# Проверяем, запустился ли сервер
if lsof -i :5000 >/dev/null 2>&1; then
    echo "✅ Сервер запущен на порту 5000"
else
    echo "⚠️ Сервер не запустился, но продолжаем..."
fi

# Запускаем клиент
echo "🔄 Запуск клиента..."
cd client
npm start &
CLIENT_PID=$!
cd ..

# Ждем немного, чтобы клиент запустился
echo "⏳ Ожидание запуска клиента..."
sleep 10

# Проверяем, запустился ли клиент
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Клиент запущен на порту 3000"
else
    echo "⚠️ Клиент не запустился, но продолжаем..."
fi

echo ""
echo "🎉 Система запущена!"
echo "================================"
echo "🌐 Клиент: http://localhost:3000"
echo "🔧 Сервер: http://localhost:5000"
echo "📋 Заказы: http://localhost:3000/orders"
echo "🏭 Канбан: http://localhost:3000/kanban"
echo "⚙️ Производство: http://localhost:3000/production"
echo ""
echo "📝 Для остановки нажмите Ctrl+C"
echo "================================"

# Открываем браузер
echo "🌐 Открываем браузер..."
sleep 2
open http://localhost:3000 2>/dev/null || echo "Не удалось открыть браузер автоматически"

# Ждем завершения процессов
wait
