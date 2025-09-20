#!/bin/bash

# Скрипт восстановления бекапа CRM Sofany
# Дата: 19.09.2025 22:10

echo "🔄 Восстановление бекапа CRM Sofany..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой папки проекта"
    exit 1
fi

# Создаем резервную копию текущих файлов
echo "📦 Создаем резервную копию текущих файлов..."
mkdir -p backup_current_$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP="backup_current_$(date +%Y%m%d_%H%M%S)"

# Копируем текущие файлы
cp -r client/src/pages/Orders/CreateOrderNew.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/pages/Orders/OrderDetailNew.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/pages/Orders/OrderWorkOrder.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/pages/Orders/OrdersNew.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/components/Orders/OrderPositionsTableNew.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/components/Orders/WorkOrderPrintComponent.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r client/src/components/Production/ProductionTable.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r server/index.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r server/routes/orders.js "$CURRENT_BACKUP/" 2>/dev/null || true
cp -r server/routes/production.js "$CURRENT_BACKUP/" 2>/dev/null || true

echo "✅ Текущие файлы сохранены в: $CURRENT_BACKUP"

# Восстанавливаем файлы из бекапа
echo "🔄 Восстанавливаем файлы из бекапа..."

# Клиентские файлы
cp -f client/CreateOrderNew.js client/src/pages/Orders/ 2>/dev/null || echo "⚠️  CreateOrderNew.js не найден"
cp -f client/OrderDetailNew.js client/src/pages/Orders/ 2>/dev/null || echo "⚠️  OrderDetailNew.js не найден"
cp -f client/OrderWorkOrder.js client/src/pages/Orders/ 2>/dev/null || echo "⚠️  OrderWorkOrder.js не найден"
cp -f client/OrdersNew.js client/src/pages/Orders/ 2>/dev/null || echo "⚠️  OrdersNew.js не найден"
cp -f client/OrderPositionsTableNew.js client/src/components/Orders/ 2>/dev/null || echo "⚠️  OrderPositionsTableNew.js не найден"
cp -f client/WorkOrderPrintComponent.js client/src/components/Orders/ 2>/dev/null || echo "⚠️  WorkOrderPrintComponent.js не найден"
cp -f client/ProductionTable.js client/src/components/Production/ 2>/dev/null || echo "⚠️  ProductionTable.js не найден"

# Серверные файлы
cp -f server/index.js server/ 2>/dev/null || echo "⚠️  server/index.js не найден"
cp -f server/orders.js server/routes/ 2>/dev/null || echo "⚠️  server/orders.js не найден"
cp -f server/production.js server/routes/ 2>/dev/null || echo "⚠️  server/production.js не найден"

echo "✅ Восстановление завершено!"

# Проверяем зависимости
echo "🔍 Проверяем зависимости..."
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Устанавливаем серверные зависимости..."
    cd server && npm install && cd ..
fi

echo "🚀 Готово! Теперь можно запустить:"
echo "   npm run server  # для сервера"
echo "   npm start       # для клиента"
echo ""
echo "📁 Резервная копия текущих файлов: $CURRENT_BACKUP"
echo "📋 Подробности изменений: CHANGELOG.md"
