# 🚀 CRM Система - Быстрый старт

## Команды для разработки

### Основные команды
```bash
# Запустить всю систему (сервер + клиент)
npm start

# Остановить все процессы
npm stop

# Запустить только сервер
npm run server

# Запустить только клиент
npm run client
```

### Установка и настройка
```bash
# Полная установка (первый раз)
npm run setup

# Очистка и переустановка (если что-то сломалось)
npm run clean
npm run install:all
```

### Работа с базой данных
```bash
# Миграции
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

## 🔧 Решение проблем

### Если порты заняты
```bash
npm stop
# или
./stop-all.sh
```

### Если не запускается клиент
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Если не запускается сервер
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📱 Доступ к приложению

- **Клиент**: http://localhost:3000
- **Сервер API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 👤 Тестовые данные

После `npm run db:seed`:
- **Email**: admin@sofany.ru
- **Пароль**: admin123

## 🛠️ Структура проекта

```
SofanyCRM/
├── client/          # React приложение
├── server/          # Node.js API
├── start-all.sh     # Запуск всего
├── start-server.sh  # Запуск сервера
├── start-client.sh  # Запуск клиента
├── stop-all.sh      # Остановка всего
└── package.json     # Основные команды
```

## ⚡ Быстрые команды

```bash
# Быстрый перезапуск
npm stop && npm start

# Проверить статус
curl http://localhost:5000/api/health
curl http://localhost:3000
```










