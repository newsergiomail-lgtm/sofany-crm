# Руководство по деплою Sofany CRM

## 🚀 Деплой на VPS/Сервер

### Подготовка сервера

#### Ubuntu 20.04/22.04 LTS:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Установка PM2
sudo npm install -g pm2

# Проверка установки
node --version
npm --version
psql --version
```

### Настройка PostgreSQL

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE sofany_crm;
CREATE USER sofany_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE sofany_crm TO sofany_user;
ALTER USER sofany_user CREATEDB;

# Выход
\q

# Настройка PostgreSQL для внешних подключений (опционально)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Раскомментируйте и измените:
# listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Добавьте строку:
# local   all             sofany_user                              md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### Деплой приложения

```bash
# Создание директории для приложения
sudo mkdir -p /var/www/sofany-crm
sudo chown $USER:$USER /var/www/sofany-crm

# Клонирование репозитория
cd /var/www/sofany-crm
git clone <repository-url> .

# Установка зависимостей
npm run install:all

# Настройка переменных окружения
cp server/env.example server/.env
nano server/.env
```

#### Содержимое server/.env для продакшена:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sofany_crm
DB_USER=sofany_user
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-production-change-this
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# Email (настройте для отправки уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram (настройте для уведомлений)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### Инициализация базы данных

```bash
# Создание таблиц
npm run db:migrate

# Заполнение тестовыми данными (опционально)
npm run db:seed
```

### Сборка и запуск

```bash
# Сборка frontend
cd client
npm run build
cd ..

# Создание директории для загрузок
mkdir -p server/uploads

# Создание ecosystem файла для PM2
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
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Создание директории для логов
mkdir -p logs

# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
# Выполните команду, которую покажет PM2
```

### Настройка Nginx

```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/sofany-crm
```

#### Содержимое /etc/nginx/sites-available/sofany-crm:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Frontend
    location / {
        root /var/www/sofany-crm/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Загрузка файлов
    location /uploads {
        alias /var/www/sofany-crm/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Активация сайта
sudo ln -s /etc/nginx/sites-available/sofany-crm /etc/nginx/sites-enabled/

# Удаление дефолтного сайта
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Настройка SSL (Let's Encrypt)

```bash
# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление сертификата
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Настройка файрвола

```bash
# Настройка UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Проверка статуса
sudo ufw status
```

## 🐳 Деплой с Docker

### Создание Dockerfile для backend:

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Создание директории для загрузок
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

USER nodejs

EXPOSE 5000

CMD ["node", "index.js"]
```

### Создание Dockerfile для frontend:

```dockerfile
# client/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm ci

# Копирование исходного кода и сборка
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Копирование собранного приложения
COPY --from=build /app/build /usr/share/nginx/html

# Копирование конфигурации Nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: sofany_crm
      POSTGRES_USER: sofany_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  api:
    build: ./server
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: sofany_crm
      DB_USER: sofany_user
      DB_PASSWORD: your_secure_password
      JWT_SECRET: your-super-secret-jwt-key
      PORT: 5000
    depends_on:
      - postgres
    ports:
      - "5000:5000"
    volumes:
      - ./server/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Запуск с Docker:

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## ☁️ Деплой на облачные платформы

### Heroku:

```bash
# Установка Heroku CLI
# Скачайте с https://devcenter.heroku.com/articles/heroku-cli

# Логин в Heroku
heroku login

# Создание приложения
heroku create sofany-crm

# Добавление PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Настройка переменных окружения
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key

# Деплой
git push heroku main

# Запуск миграций
heroku run npm run db:migrate
heroku run npm run db:seed
```

### DigitalOcean App Platform:

1. Создайте новый App в DigitalOcean
2. Подключите GitHub репозиторий
3. Настройте переменные окружения
4. Добавьте PostgreSQL базу данных
5. Деплой автоматически

### AWS EC2:

```bash
# Создание EC2 инстанса
# Выберите Ubuntu 20.04 LTS
# Минимум t3.medium для продакшена

# Подключение к инстансу
ssh -i your-key.pem ubuntu@your-ec2-ip

# Установка Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Клонирование и запуск
git clone <repository-url>
cd SofanyCRM
docker-compose up -d
```

## 📊 Мониторинг и логирование

### Настройка логирования:

```bash
# Создание скрипта для ротации логов
cat > rotate-logs.sh << EOF
#!/bin/bash
LOG_DIR="/var/www/sofany-crm/logs"
DATE=$(date +%Y%m%d)

# Сжатие старых логов
gzip $LOG_DIR/*.log

# Удаление логов старше 30 дней
find $LOG_DIR -name "*.log.gz" -mtime +30 -delete

# Очистка текущих логов
> $LOG_DIR/combined.log
> $LOG_DIR/out.log
> $LOG_DIR/err.log
EOF

chmod +x rotate-logs.sh

# Добавление в crontab
crontab -e
# Добавьте строку:
# 0 0 * * * /var/www/sofany-crm/rotate-logs.sh
```

### Мониторинг с PM2:

```bash
# Установка PM2 Plus (опционально)
pm2 install pm2-server-monit

# Мониторинг в реальном времени
pm2 monit

# Настройка алертов
pm2 install pm2-slack
```

## 🔄 Автоматический деплой с GitHub Actions

### .github/workflows/deploy.yml:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/sofany-crm
          git pull origin main
          npm run install:all
          cd client && npm run build && cd ..
          pm2 restart sofany-crm-api
```

## 🗄️ Резервное копирование

### Автоматический бэкап:

```bash
# Создание скрипта бэкапа
cat > backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/sofany-crm"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U sofany_user sofany_crm > $BACKUP_DIR/db_$DATE.sql

# Бэкап загруженных файлов
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/sofany-crm/server/uploads

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Добавление в crontab
crontab -e
# Добавьте строку:
# 0 3 * * * /var/www/sofany-crm/backup.sh
```

## 🔒 Безопасность

### Настройка fail2ban:

```bash
# Установка fail2ban
sudo apt install -y fail2ban

# Создание конфигурации
sudo nano /etc/fail2ban/jail.local
```

#### Содержимое /etc/fail2ban/jail.local:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

```bash
# Запуск fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Настройка автоматических обновлений:

```bash
# Установка unattended-upgrades
sudo apt install -y unattended-upgrades

# Настройка
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

**Удачного деплоя!** 🚀



























