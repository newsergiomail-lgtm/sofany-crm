# Бэкап модуля клиентов

## Дата создания
$(date '+%Y-%m-%d %H:%M:%S')

## Содержимое бэкапа

### Фронтенд
- `Customers/` - директория с компонентами React модуля клиентов
  - `Customers.js` - основной компонент модуля клиентов
  - Все стили и логика интерфейса

### Бэкенд
- `customers.js` - API роуты для работы с клиентами
  - GET /api/customers - получение списка клиентов
  - POST /api/customers - создание нового клиента
  - PUT /api/customers/:id - обновление клиента
  - DELETE /api/customers/:id - удаление клиента
  - GET /api/customers/analytics - аналитика клиентов

### База данных
- `customers_schema.sql` - схема таблицы customers
- `customers_data.sql` - данные таблицы customers

## Восстановление

### Восстановление фронтенда
```bash
cp -r Customers/ /path/to/client/src/pages/
```

### Восстановление бэкенда
```bash
cp customers.js /path/to/server/routes/
```

### Восстановление базы данных
```bash
# Схема
psql -h localhost -U postgres -d sofany_crm -f customers_schema.sql

# Данные
psql -h localhost -U postgres -d sofany_crm -f customers_data.sql
```

## Функциональность модуля

### Основные возможности
- ✅ Просмотр списка клиентов с пагинацией
- ✅ Добавление нового клиента
- ✅ Редактирование существующего клиента
- ✅ Удаление клиента
- ✅ Быстрый просмотр информации о клиенте
- ✅ Поиск и фильтрация клиентов
- ✅ Аналитика клиентов

### Поля клиента
- Имя (name)
- Email (email)
- Телефон (phone)
- Компания (company)
- Адрес (address)
- Статус (status: active/inactive)
- Заметки (notes)
- Дата создания (created_at)
- Дата обновления (updated_at)

### Стилизация
- Современный дизайн с Tailwind CSS
- Темная тема поддержка
- Адаптивный дизайн
- Красивые модальные окна
- Уведомления об успехе/ошибке

## Версия
Модуль клиентов v1.0 - полностью функциональный
