#!/bin/bash

echo "🛑 Остановка всех процессов SofanyCRM..."

# Останавливаем сервер
echo "🔄 Остановка сервера..."
pkill -f "node.*server" 2>/dev/null || echo "Сервер не запущен"

# Останавливаем клиент
echo "🔄 Остановка клиента..."
pkill -f "react-scripts" 2>/dev/null || echo "Клиент не запущен"

# Останавливаем nodemon
echo "🔄 Остановка nodemon..."
pkill -f "nodemon" 2>/dev/null || echo "Nodemon не запущен"

echo "✅ Все процессы остановлены!"