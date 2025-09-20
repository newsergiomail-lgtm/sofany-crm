#!/bin/bash

echo "🧹 Полная очистка кэша и перезапуск..."

# Останавливаем все процессы
echo "🛑 Останавливаем процессы..."
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node.*client" 2>/dev/null || true

# Очищаем кэш
echo "🧹 Очищаем кэш..."
cd client
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -f .eslintcache 2>/dev/null || true
rm -rf .next 2>/dev/null || true

# Очищаем npm кэш
echo "📦 Очищаем npm кэш..."
npm cache clean --force 2>/dev/null || true

# Переустанавливаем зависимости
echo "📦 Переустанавливаем зависимости..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install

echo "✅ Очистка завершена!"
echo "🚀 Запускаем клиент..."
npm start




