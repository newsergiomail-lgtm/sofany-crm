#!/bin/bash

echo "🔧 Исправление проблем с портами..."

# Убиваем все процессы Node.js
echo "🛑 Остановка всех процессов Node.js..."
pkill -f "node" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Ждем завершения процессов
sleep 3

# Принудительно освобождаем порты
echo "🔓 Освобождение портов..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Ждем еще немного
sleep 2

echo "✅ Портты освобождены"
echo "🚀 Запуск сервера..."

# Запускаем сервер
cd server
node index.js &
SERVER_PID=$!

# Ждем запуска сервера
sleep 5

# Проверяем статус
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Сервер успешно запущен на порту 5000"
    echo "🌐 API доступен по адресу: http://localhost:5000"
else
    echo "❌ Сервер не запустился"
    echo "🔍 Проверьте логи выше для диагностики"
fi

echo "📝 Для остановки сервера нажмите Ctrl+C"
wait $SERVER_PID
