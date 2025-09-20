# Sofany CRM - Система управления мебельным производством

Полнофункциональная CRM-система для управления мебельным производством и продажами, разработанная специально для компании Sofany.

## 🚀 Возможности

### Основные модули:
- **Управление заказами** - создание, отслеживание статусов, таймлайн
- **Управление клиентами** - база клиентов, история взаимодействий
- **Материалы и склад** - учёт фанеры, ДВП, ППУ, тканей, автоматический расход
- **Производство** - кнопки действий «Закупить», «Закупить и в производство», «В производство», «Отменить»
- **Финансы** - расходы, себестоимость, прибыль, отчёты по KPI
- **Уведомления** - интеграция с Telegram, email

### Технические особенности:
- Современный минималистичный интерфейс
- Брендинг Sofany (бирюза, белый, тёмный серый, шрифт Inter)
- Адаптация под мобильные устройства
- Гибкая настройка коэффициентов расхода и цен
- Интеграция с калькулятором Sofany Pro

## 🛠 Технологический стек

### Backend:
- **Node.js** + **Express.js** - серверная часть
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Joi** - валидация данных
- **Nodemailer** - отправка email
- **node-telegram-bot-api** - интеграция с Telegram

### Frontend:
- **React 18** - пользовательский интерфейс
- **React Router** - маршрутизация
- **React Query** - управление состоянием и кэширование
- **React Hook Form** - формы
- **Tailwind CSS** - стилизация
- **Lucide React** - иконки
- **Recharts** - графики и диаграммы
- **React Hot Toast** - уведомления

## 📋 Требования

- **Node.js** 16+ 
- **PostgreSQL** 12+
- **npm** или **yarn**

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd SofanyCRM
```

### 2. Установка зависимостей
```bash
# Установка всех зависимостей (root, server, client)
npm run install:all
```

### 3. Настройка базы данных

#### Создание базы данных PostgreSQL:
```sql
CREATE DATABASE sofany_crm;
CREATE USER sofany_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sofany_crm TO sofany_user;
```

#### Настройка переменных окружения:
```bash
# Скопируйте файл с примером переменных окружения
cp server/env.example server/.env

# Отредактируйте server/.env с вашими настройками:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sofany_crm
DB_USER=sofany_user
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 4. Инициализация базы данных
```bash
# Создание таблиц
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

### 5. Запуск приложения

#### Режим разработки (одновременно backend и frontend):
```bash
npm run dev
```

#### Или запуск по отдельности:
```bash
# Backend (порт 5000)
npm run server:dev

# Frontend (порт 3000)
npm run client:dev
```

### 6. Доступ к приложению
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 👤 Тестовые данные для входа

После выполнения `npm run db:seed` будут созданы следующие пользователи:

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@sofany.com | admin123 |
| Менеджер | manager@sofany.com | admin123 |
| Рабочий | worker@sofany.com | admin123 |

## 📁 Структура проекта

```
SofanyCRM/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # Пользовательские хуки
│   │   ├── services/       # API сервисы
│   │   └── index.css       # Глобальные стили
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── config/            # Конфигурация
│   ├── middleware/        # Middleware функции
│   ├── routes/            # API маршруты
│   ├── scripts/           # Скрипты миграции и заполнения
│   ├── package.json
│   └── index.js           # Точка входа сервера
├── package.json           # Root package.json
└── README.md
```

## 🔧 Конфигурация

### Переменные окружения (server/.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sofany_crm
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
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

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `GET /api/auth/profile` - Получение профиля
- `PUT /api/auth/profile` - Обновление профиля
- `PUT /api/auth/change-password` - Смена пароля

### Заказы
- `GET /api/orders` - Список заказов
- `GET /api/orders/:id` - Детали заказа
- `POST /api/orders` - Создание заказа
- `PUT /api/orders/:id` - Обновление заказа
- `DELETE /api/orders/:id` - Удаление заказа
- `GET /api/orders/stats/overview` - Статистика заказов

### Клиенты
- `GET /api/customers` - Список клиентов
- `GET /api/customers/:id` - Детали клиента
- `POST /api/customers` - Создание клиента
- `PUT /api/customers/:id` - Обновление клиента
- `DELETE /api/customers/:id` - Удаление клиента

### Материалы
- `GET /api/materials` - Список материалов
- `GET /api/materials/:id` - Детали материала
- `POST /api/materials` - Создание материала
- `PUT /api/materials/:id` - Обновление материала
- `PUT /api/materials/:id/stock` - Обновление остатков
- `GET /api/materials/categories/list` - Категории материалов

### Производство
- `GET /api/production` - Список операций
- `POST /api/production` - Создание операции
- `PUT /api/production/:id` - Обновление операции
- `PUT /api/production/:id/complete` - Завершение операции

### Финансы
- `GET /api/finance/transactions` - Финансовые транзакции
- `POST /api/finance/transactions` - Создание транзакции
- `GET /api/finance/reports/overview` - Финансовая отчётность
- `GET /api/finance/reports/kpi` - KPI отчёты

### Уведомления
- `GET /api/notifications` - Список уведомлений
- `POST /api/notifications` - Создание уведомления
- `PUT /api/notifications/:id/read` - Отметка как прочитанное
- `POST /api/notifications/send-email` - Отправка email
- `POST /api/notifications/send-telegram` - Отправка в Telegram

## 🚀 Деплой на сервер

### 1. Подготовка сервера

#### Ubuntu/Debian:
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка PM2 для управления процессами
sudo npm install -g pm2
```

### 2. Настройка PostgreSQL
```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE sofany_crm;
CREATE USER sofany_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sofany_crm TO sofany_user;
\q
```

### 3. Деплой приложения
```bash
# Клонирование репозитория
git clone <repository-url>
cd SofanyCRM

# Установка зависимостей
npm run install:all

# Настройка переменных окружения
cp server/env.example server/.env
# Отредактируйте server/.env

# Сборка frontend
cd client
npm run build
cd ..

# Инициализация базы данных
npm run db:migrate
npm run db:seed

# Запуск с PM2
pm2 start server/index.js --name "sofany-crm-api"
pm2 startup
pm2 save
```

### 4. Настройка Nginx (опционально)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/SofanyCRM/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
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
    }
}
```

## 🔒 Безопасность

- Все пароли хешируются с помощью bcrypt
- JWT токены для аутентификации
- Валидация всех входящих данных
- CORS настройки
- Helmet для безопасности заголовков
- Роли пользователей (admin, manager, worker)

## 📱 Мобильная адаптация

Приложение полностью адаптировано для мобильных устройств:
- Responsive дизайн с Tailwind CSS
- Адаптивные таблицы
- Мобильное меню
- Оптимизированные формы

## 🧪 Тестирование

```bash
# Запуск тестов frontend
cd client
npm test

# Запуск тестов backend
cd server
npm test
```

## 📈 Мониторинг

### PM2 мониторинг:
```bash
# Статус процессов
pm2 status

# Логи
pm2 logs sofany-crm-api

# Мониторинг в реальном времени
pm2 monit
```

### Логи приложения:
```bash
# Логи сервера
tail -f server/logs/app.log

# Логи ошибок
tail -f server/logs/error.log
```

## 🛠 Разработка

### Добавление новых модулей:

1. **Backend**: Создайте новый файл в `server/routes/`
2. **Frontend**: Создайте компоненты в `client/src/components/` и страницы в `client/src/pages/`
3. **API**: Добавьте методы в `client/src/services/api.js`
4. **Маршруты**: Обновите `client/src/App.js`

### Структура компонентов:
```
components/
├── Layout/          # Компоненты макета
├── UI/             # Переиспользуемые UI компоненты
├── Dashboard/      # Компоненты дашборда
├── Orders/         # Компоненты заказов
├── Customers/      # Компоненты клиентов
└── ...
```

## 🤝 Поддержка

Для получения поддержки:
1. Проверьте документацию
2. Изучите логи приложения
3. Создайте issue в репозитории

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🎯 Roadmap

- [ ] Интеграция с внешними API
- [ ] Расширенная аналитика
- [ ] Мобильное приложение
- [ ] Автоматизация производственных процессов
- [ ] Интеграция с 1C
- [ ] Многоязычность

---

**Sofany CRM** - современное решение для управления мебельным производством 🛋️



























