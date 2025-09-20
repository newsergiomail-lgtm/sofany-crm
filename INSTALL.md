# Инструкция по установке Sofany CRM

## 📋 Системные требования

### Минимальные требования:
- **ОС**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 4 GB
- **Диск**: 2 GB свободного места
- **Node.js**: 16.0+
- **PostgreSQL**: 12.0+

### Рекомендуемые требования:
- **RAM**: 8 GB
- **Диск**: 5 GB свободного места
- **Node.js**: 18.0+
- **PostgreSQL**: 14.0+

## 🚀 Пошаговая установка

### Шаг 1: Установка Node.js

#### Windows:
1. Скачайте Node.js с [nodejs.org](https://nodejs.org/)
2. Запустите установщик и следуйте инструкциям
3. Проверьте установку:
```cmd
node --version
npm --version
```

#### macOS:
```bash
# Через Homebrew
brew install node

# Или скачайте с nodejs.org
```

#### Ubuntu/Debian:
```bash
# Обновление пакетов
sudo apt update

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка установки
node --version
npm --version
```

### Шаг 2: Установка PostgreSQL

#### Windows:
1. Скачайте PostgreSQL с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Запустите установщик
3. Запомните пароль для пользователя postgres
4. Убедитесь, что служба PostgreSQL запущена

#### macOS:
```bash
# Через Homebrew
brew install postgresql
brew services start postgresql

# Создание пользователя
createuser -s postgres
```

#### Ubuntu/Debian:
```bash
# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Переключение на пользователя postgres
sudo -u postgres psql
```

### Шаг 3: Настройка базы данных

#### Создание базы данных:
```sql
-- Подключение к PostgreSQL
psql -U postgres

-- Создание базы данных
CREATE DATABASE sofany_crm;

-- Создание пользователя
CREATE USER sofany_user WITH PASSWORD 'your_secure_password';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE sofany_crm TO sofany_user;

-- Выход
\q
```

#### Проверка подключения:
```bash
# Тест подключения
psql -h localhost -U sofany_user -d sofany_crm
```

### Шаг 4: Клонирование и установка приложения

```bash
# Клонирование репозитория
git clone <repository-url>
cd SofanyCRM

# Установка всех зависимостей
npm run install:all
```

### Шаг 5: Настройка переменных окружения

```bash
# Копирование файла с примером
cp server/env.example server/.env

# Редактирование файла .env
nano server/.env  # или любой другой редактор
```

#### Содержимое файла server/.env:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sofany_crm
DB_USER=sofany_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### Шаг 6: Инициализация базы данных

```bash
# Создание таблиц
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

### Шаг 7: Запуск приложения

#### Режим разработки:
```bash
# Запуск backend и frontend одновременно
npm run dev
```

#### Или по отдельности:
```bash
# Терминал 1 - Backend
npm run server:dev

# Терминал 2 - Frontend
npm run client:dev
```

### Шаг 8: Проверка работы

1. Откройте браузер и перейдите на http://localhost:3000
2. Войдите с тестовыми данными:
   - **Email**: admin@sofany.com
   - **Пароль**: admin123

## 🔧 Настройка для продакшена

### 1. Сборка frontend:
```bash
cd client
npm run build
cd ..
```

### 2. Установка PM2:
```bash
npm install -g pm2
```

### 3. Создание ecosystem файла:
```bash
# Создайте файл ecosystem.config.js в корне проекта
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sofany-crm-api',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF
```

### 4. Запуск с PM2:
```bash
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🐛 Решение проблем

### Проблема: Ошибка подключения к базе данных
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте настройки в .env
cat server/.env

# Проверьте подключение
psql -h localhost -U sofany_user -d sofany_crm
```

### Проблема: Порт уже используется
```bash
# Найти процесс, использующий порт
lsof -i :5000  # для backend
lsof -i :3000  # для frontend

# Остановить процесс
kill -9 <PID>
```

### Проблема: Ошибки при установке зависимостей
```bash
# Очистка кэша npm
npm cache clean --force

# Удаление node_modules и переустановка
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
rm -rf client/node_modules client/package-lock.json

npm run install:all
```

### Проблема: Ошибки миграции базы данных
```bash
# Проверьте подключение к базе данных
psql -h localhost -U sofany_user -d sofany_crm

# Удалите и пересоздайте базу данных
psql -U postgres -c "DROP DATABASE IF EXISTS sofany_crm;"
psql -U postgres -c "CREATE DATABASE sofany_crm;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sofany_crm TO sofany_user;"

# Повторите миграцию
npm run db:migrate
npm run db:seed
```

## 📊 Мониторинг и логи

### Просмотр логов:
```bash
# Логи PM2
pm2 logs sofany-crm-api

# Логи в реальном времени
pm2 logs sofany-crm-api --lines 100

# Статус процессов
pm2 status
```

### Мониторинг ресурсов:
```bash
# Мониторинг PM2
pm2 monit

# Системные ресурсы
htop
```

## 🔄 Обновление приложения

```bash
# Остановка приложения
pm2 stop sofany-crm-api

# Получение обновлений
git pull origin main

# Установка новых зависимостей
npm run install:all

# Сборка frontend
cd client && npm run build && cd ..

# Запуск приложения
pm2 start sofany-crm-api
```

## 🗄️ Резервное копирование

### Создание резервной копии базы данных:
```bash
# Создание бэкапа
pg_dump -h localhost -U sofany_user sofany_crm > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
psql -h localhost -U sofany_user sofany_crm < backup_file.sql
```

### Автоматическое резервное копирование:
```bash
# Создайте скрипт backup.sh
cat > backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U sofany_user sofany_crm > $BACKUP_DIR/sofany_crm_$DATE.sql
find $BACKUP_DIR -name "sofany_crm_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Добавьте в crontab для ежедневного бэкапа
crontab -e
# Добавьте строку:
# 0 2 * * * /path/to/backup.sh
```

## 📞 Поддержка

Если у вас возникли проблемы с установкой:

1. **Проверьте логи**: `pm2 logs sofany-crm-api`
2. **Проверьте статус**: `pm2 status`
3. **Проверьте подключение к БД**: `psql -h localhost -U sofany_user -d sofany_crm`
4. **Проверьте переменные окружения**: `cat server/.env`

### Полезные команды для диагностики:

```bash
# Проверка версий
node --version
npm --version
psql --version

# Проверка портов
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Проверка процессов
ps aux | grep node
ps aux | grep postgres

# Проверка дискового пространства
df -h

# Проверка памяти
free -h
```

---

**Удачной установки!** 🚀



























