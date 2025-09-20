-- Создание таблиц для административных настроек
-- Использование: psql -d sofany_crm -f create_admin_settings.sql

-- Удаляем существующую таблицу и создаем новую
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    data_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json, array
    is_public BOOLEAN DEFAULT false, -- доступно ли обычным пользователям
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек модулей
CREATE TABLE IF NOT EXISTS module_settings (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    value TEXT,
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_name, setting_key)
);

-- Таблица ролей и разрешений
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, module, permission)
);

-- Таблица настроек уведомлений
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    channels JSONB DEFAULT '["email"]', -- email, telegram, sms, push
    frequency VARCHAR(50) DEFAULT 'immediate', -- immediate, daily, weekly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Таблица настроек интеграций
CREATE TABLE IF NOT EXISTS integration_settings (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    config JSONB,
    credentials JSONB, -- зашифрованные данные
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_name)
);

-- Вставка базовых системных настроек
INSERT INTO system_settings (key, value, description, category, data_type, is_public, is_required) VALUES
-- Общие настройки компании
('company_name', 'Sofany', 'Название компании', 'company', 'string', true, true),
('company_email', 'info@sofany.com', 'Email компании', 'company', 'string', true, true),
('company_phone', '+7-495-123-45-67', 'Телефон компании', 'company', 'string', true, true),
('company_address', 'Москва, ул. Примерная, д. 1', 'Адрес компании', 'company', 'string', true, false),
('company_logo', '', 'Логотип компании', 'company', 'string', true, false),

-- Настройки валюты и финансов
('default_currency', 'RUB', 'Валюта по умолчанию', 'finance', 'string', true, true),
('currency_symbol', '₽', 'Символ валюты', 'finance', 'string', true, true),
('tax_rate', '20', 'Налоговая ставка (%)', 'finance', 'number', false, true),
('profit_margin', '30', 'Минимальная наценка (%)', 'finance', 'number', false, true),

-- Настройки уведомлений
('notifications_enabled', 'true', 'Включить уведомления', 'notifications', 'boolean', false, true),
('email_notifications', 'true', 'Email уведомления', 'notifications', 'boolean', false, true),
('telegram_notifications', 'true', 'Telegram уведомления', 'notifications', 'boolean', false, true),
('notification_email', 'admin@sofany.com', 'Email для уведомлений', 'notifications', 'string', false, true),

-- Настройки склада
('low_stock_threshold', '1.5', 'Коэффициент для предупреждения о низких остатках', 'inventory', 'number', false, true),
('auto_reorder', 'false', 'Автоматический заказ при низких остатках', 'inventory', 'boolean', false, true),
('inventory_tracking', 'true', 'Отслеживание остатков', 'inventory', 'boolean', false, true),

-- Настройки производства
('production_tracking', 'true', 'Отслеживание производства', 'production', 'boolean', false, true),
('material_blocking', 'true', 'Блокировка при нехватке материалов', 'production', 'boolean', false, true),
('quality_control', 'true', 'Контроль качества', 'production', 'boolean', false, true),

-- Настройки безопасности
('session_timeout', '480', 'Таймаут сессии (минуты)', 'security', 'number', false, true),
('password_min_length', '8', 'Минимальная длина пароля', 'security', 'number', false, true),
('login_attempts', '5', 'Максимум попыток входа', 'security', 'number', false, true),
('two_factor_auth', 'false', 'Двухфакторная аутентификация', 'security', 'boolean', false, false),

-- Настройки интерфейса
('theme', 'light', 'Тема интерфейса', 'ui', 'string', true, false),
('language', 'ru', 'Язык интерфейса', 'ui', 'string', true, false),
('timezone', 'Europe/Moscow', 'Часовой пояс', 'ui', 'string', true, true),
('date_format', 'DD.MM.YYYY', 'Формат даты', 'ui', 'string', true, true),
('time_format', '24', 'Формат времени (12/24)', 'ui', 'string', true, true),

-- Настройки резервного копирования
('backup_enabled', 'true', 'Включить резервное копирование', 'backup', 'boolean', false, true),
('backup_frequency', 'daily', 'Частота резервного копирования', 'backup', 'string', false, true),
('backup_retention', '30', 'Срок хранения резервных копий (дни)', 'backup', 'number', false, true)
ON CONFLICT (key) DO NOTHING;

-- Вставка настроек модулей
INSERT INTO module_settings (module_name, setting_key, value, description, data_type, is_required) VALUES
-- Настройки модуля заказов
('orders', 'auto_numbering', 'true', 'Автоматическая нумерация заказов', 'boolean', true),
('orders', 'number_prefix', 'SOF-', 'Префикс номера заказа', 'string', true),
('orders', 'number_length', '13', 'Длина номера заказа', 'number', true),
('orders', 'default_status', 'new', 'Статус по умолчанию', 'string', true),
('orders', 'auto_archive_days', '365', 'Автоархивация через (дней)', 'number', false),
('orders', 'require_customer', 'true', 'Обязательное указание клиента', 'boolean', true),

-- Настройки модуля клиентов
('customers', 'auto_create', 'true', 'Автоматическое создание клиентов', 'boolean', false),
('customers', 'require_phone', 'false', 'Обязательный телефон', 'boolean', false),
('customers', 'require_email', 'false', 'Обязательный email', 'boolean', false),
('customers', 'duplicate_check', 'true', 'Проверка дубликатов', 'boolean', true),

-- Настройки модуля материалов
('materials', 'auto_tracking', 'true', 'Автоматическое отслеживание остатков', 'boolean', true),
('materials', 'low_stock_alert', 'true', 'Уведомления о низких остатках', 'boolean', true),
('materials', 'negative_stock', 'false', 'Разрешить отрицательные остатки', 'boolean', false),
('materials', 'auto_reorder', 'false', 'Автоматический заказ', 'boolean', false),

-- Настройки модуля производства
('production', 'kanban_enabled', 'true', 'Включить канбан', 'boolean', true),
('production', 'material_check', 'true', 'Проверка материалов', 'boolean', true),
('production', 'quality_gates', 'true', 'Контрольные точки качества', 'boolean', false),
('production', 'time_tracking', 'true', 'Учет времени', 'boolean', false),

-- Настройки модуля финансов
('finance', 'auto_calculation', 'true', 'Автоматический расчет стоимости', 'boolean', true),
('finance', 'include_tax', 'true', 'Включать налоги', 'boolean', true),
('finance', 'profit_tracking', 'true', 'Отслеживание прибыли', 'boolean', true),
('finance', 'cost_tracking', 'true', 'Отслеживание себестоимости', 'boolean', true),

-- Настройки модуля уведомлений
('notifications', 'email_templates', 'true', 'Использовать шаблоны email', 'boolean', false),
('notifications', 'telegram_bot', 'true', 'Telegram бот', 'boolean', false),
('notifications', 'push_notifications', 'false', 'Push уведомления', 'boolean', false),
('notifications', 'sms_notifications', 'false', 'SMS уведомления', 'boolean', false)
ON CONFLICT (module_name, setting_key) DO NOTHING;

-- Вставка ролей и разрешений
INSERT INTO role_permissions (role, module, permission) VALUES
-- Администратор - полные права
('admin', 'orders', 'create'),
('admin', 'orders', 'read'),
('admin', 'orders', 'update'),
('admin', 'orders', 'delete'),
('admin', 'customers', 'create'),
('admin', 'customers', 'read'),
('admin', 'customers', 'update'),
('admin', 'customers', 'delete'),
('admin', 'materials', 'create'),
('admin', 'materials', 'read'),
('admin', 'materials', 'update'),
('admin', 'materials', 'delete'),
('admin', 'production', 'create'),
('admin', 'production', 'read'),
('admin', 'production', 'update'),
('admin', 'production', 'delete'),
('admin', 'finance', 'create'),
('admin', 'finance', 'read'),
('admin', 'finance', 'update'),
('admin', 'finance', 'delete'),
('admin', 'employees', 'create'),
('admin', 'employees', 'read'),
('admin', 'employees', 'update'),
('admin', 'employees', 'delete'),
('admin', 'settings', 'read'),
('admin', 'settings', 'update'),
('admin', 'reports', 'read'),

-- Менеджер - ограниченные права
('manager', 'orders', 'create'),
('manager', 'orders', 'read'),
('manager', 'orders', 'update'),
('manager', 'customers', 'create'),
('manager', 'customers', 'read'),
('manager', 'customers', 'update'),
('manager', 'materials', 'read'),
('manager', 'production', 'read'),
('manager', 'production', 'update'),
('manager', 'finance', 'read'),
('manager', 'employees', 'read'),
('manager', 'reports', 'read'),

-- Рабочий - минимальные права
('worker', 'orders', 'read'),
('worker', 'materials', 'read'),
('worker', 'production', 'read'),
('worker', 'production', 'update')
ON CONFLICT (role, module, permission) DO NOTHING;

-- Вставка настроек интеграций
INSERT INTO integration_settings (integration_name, is_enabled, config) VALUES
('telegram', false, '{"bot_token": "", "chat_id": "", "webhook_url": ""}'),
('email', false, '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": ""}'),
('calculator', true, '{"api_url": "http://localhost:3000/calc.html", "token": ""}'),
('backup', false, '{"provider": "local", "path": "./backups", "schedule": "0 2 * * *"}')
ON CONFLICT (integration_name) DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_module_settings_module ON module_settings(module_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_enabled ON integration_settings(is_enabled);

-- Создание функции для обновления времени изменения
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггеров для автоматического обновления updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_settings_updated_at BEFORE UPDATE ON module_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание представления для удобного доступа к настройкам
CREATE OR REPLACE VIEW settings_overview AS
SELECT 
    'system' as type,
    key as setting_key,
    value,
    description,
    category,
    data_type,
    is_public,
    is_required,
    validation_rules,
    created_at,
    updated_at
FROM system_settings
UNION ALL
SELECT 
    'module' as type,
    module_name || '.' || setting_key as setting_key,
    value,
    description,
    module_name as category,
    data_type,
    false as is_public,
    is_required,
    validation_rules,
    created_at,
    updated_at
FROM module_settings;

-- Создание функции для получения настроек модуля
CREATE OR REPLACE FUNCTION get_module_settings(module_name_param VARCHAR)
RETURNS TABLE(setting_key VARCHAR, value TEXT, description TEXT, data_type VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.setting_key,
        ms.value,
        ms.description,
        ms.data_type
    FROM module_settings ms
    WHERE ms.module_name = module_name_param;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки разрешений пользователя
CREATE OR REPLACE FUNCTION check_user_permission(user_role VARCHAR, module_name VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM role_permissions 
        WHERE role = user_role 
        AND module = module_name 
        AND permission = permission_name 
        AND granted = true
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE system_settings IS 'Системные настройки приложения';
COMMENT ON TABLE module_settings IS 'Настройки модулей CRM';
COMMENT ON TABLE role_permissions IS 'Разрешения ролей пользователей';
COMMENT ON TABLE notification_settings IS 'Настройки уведомлений пользователей';
COMMENT ON TABLE integration_settings IS 'Настройки внешних интеграций';
COMMENT ON VIEW settings_overview IS 'Обзор всех настроек системы';
COMMENT ON FUNCTION get_module_settings IS 'Получить настройки конкретного модуля';
COMMENT ON FUNCTION check_user_permission IS 'Проверить разрешение пользователя';




-- Удаляем существующую таблицу и создаем новую
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    data_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json, array
    is_public BOOLEAN DEFAULT false, -- доступно ли обычным пользователям
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек модулей
CREATE TABLE IF NOT EXISTS module_settings (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    value TEXT,
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_name, setting_key)
);

-- Таблица ролей и разрешений
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, module, permission)
);

-- Таблица настроек уведомлений
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    channels JSONB DEFAULT '["email"]', -- email, telegram, sms, push
    frequency VARCHAR(50) DEFAULT 'immediate', -- immediate, daily, weekly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Таблица настроек интеграций
CREATE TABLE IF NOT EXISTS integration_settings (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    config JSONB,
    credentials JSONB, -- зашифрованные данные
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_name)
);

-- Вставка базовых системных настроек
INSERT INTO system_settings (key, value, description, category, data_type, is_public, is_required) VALUES
-- Общие настройки компании
('company_name', 'Sofany', 'Название компании', 'company', 'string', true, true),
('company_email', 'info@sofany.com', 'Email компании', 'company', 'string', true, true),
('company_phone', '+7-495-123-45-67', 'Телефон компании', 'company', 'string', true, true),
('company_address', 'Москва, ул. Примерная, д. 1', 'Адрес компании', 'company', 'string', true, false),
('company_logo', '', 'Логотип компании', 'company', 'string', true, false),

-- Настройки валюты и финансов
('default_currency', 'RUB', 'Валюта по умолчанию', 'finance', 'string', true, true),
('currency_symbol', '₽', 'Символ валюты', 'finance', 'string', true, true),
('tax_rate', '20', 'Налоговая ставка (%)', 'finance', 'number', false, true),
('profit_margin', '30', 'Минимальная наценка (%)', 'finance', 'number', false, true),

-- Настройки уведомлений
('notifications_enabled', 'true', 'Включить уведомления', 'notifications', 'boolean', false, true),
('email_notifications', 'true', 'Email уведомления', 'notifications', 'boolean', false, true),
('telegram_notifications', 'true', 'Telegram уведомления', 'notifications', 'boolean', false, true),
('notification_email', 'admin@sofany.com', 'Email для уведомлений', 'notifications', 'string', false, true),

-- Настройки склада
('low_stock_threshold', '1.5', 'Коэффициент для предупреждения о низких остатках', 'inventory', 'number', false, true),
('auto_reorder', 'false', 'Автоматический заказ при низких остатках', 'inventory', 'boolean', false, true),
('inventory_tracking', 'true', 'Отслеживание остатков', 'inventory', 'boolean', false, true),

-- Настройки производства
('production_tracking', 'true', 'Отслеживание производства', 'production', 'boolean', false, true),
('material_blocking', 'true', 'Блокировка при нехватке материалов', 'production', 'boolean', false, true),
('quality_control', 'true', 'Контроль качества', 'production', 'boolean', false, true),

-- Настройки безопасности
('session_timeout', '480', 'Таймаут сессии (минуты)', 'security', 'number', false, true),
('password_min_length', '8', 'Минимальная длина пароля', 'security', 'number', false, true),
('login_attempts', '5', 'Максимум попыток входа', 'security', 'number', false, true),
('two_factor_auth', 'false', 'Двухфакторная аутентификация', 'security', 'boolean', false, false),

-- Настройки интерфейса
('theme', 'light', 'Тема интерфейса', 'ui', 'string', true, false),
('language', 'ru', 'Язык интерфейса', 'ui', 'string', true, false),
('timezone', 'Europe/Moscow', 'Часовой пояс', 'ui', 'string', true, true),
('date_format', 'DD.MM.YYYY', 'Формат даты', 'ui', 'string', true, true),
('time_format', '24', 'Формат времени (12/24)', 'ui', 'string', true, true),

-- Настройки резервного копирования
('backup_enabled', 'true', 'Включить резервное копирование', 'backup', 'boolean', false, true),
('backup_frequency', 'daily', 'Частота резервного копирования', 'backup', 'string', false, true),
('backup_retention', '30', 'Срок хранения резервных копий (дни)', 'backup', 'number', false, true)
ON CONFLICT (key) DO NOTHING;

-- Вставка настроек модулей
INSERT INTO module_settings (module_name, setting_key, value, description, data_type, is_required) VALUES
-- Настройки модуля заказов
('orders', 'auto_numbering', 'true', 'Автоматическая нумерация заказов', 'boolean', true),
('orders', 'number_prefix', 'SOF-', 'Префикс номера заказа', 'string', true),
('orders', 'number_length', '13', 'Длина номера заказа', 'number', true),
('orders', 'default_status', 'new', 'Статус по умолчанию', 'string', true),
('orders', 'auto_archive_days', '365', 'Автоархивация через (дней)', 'number', false),
('orders', 'require_customer', 'true', 'Обязательное указание клиента', 'boolean', true),

-- Настройки модуля клиентов
('customers', 'auto_create', 'true', 'Автоматическое создание клиентов', 'boolean', false),
('customers', 'require_phone', 'false', 'Обязательный телефон', 'boolean', false),
('customers', 'require_email', 'false', 'Обязательный email', 'boolean', false),
('customers', 'duplicate_check', 'true', 'Проверка дубликатов', 'boolean', true),

-- Настройки модуля материалов
('materials', 'auto_tracking', 'true', 'Автоматическое отслеживание остатков', 'boolean', true),
('materials', 'low_stock_alert', 'true', 'Уведомления о низких остатках', 'boolean', true),
('materials', 'negative_stock', 'false', 'Разрешить отрицательные остатки', 'boolean', false),
('materials', 'auto_reorder', 'false', 'Автоматический заказ', 'boolean', false),

-- Настройки модуля производства
('production', 'kanban_enabled', 'true', 'Включить канбан', 'boolean', true),
('production', 'material_check', 'true', 'Проверка материалов', 'boolean', true),
('production', 'quality_gates', 'true', 'Контрольные точки качества', 'boolean', false),
('production', 'time_tracking', 'true', 'Учет времени', 'boolean', false),

-- Настройки модуля финансов
('finance', 'auto_calculation', 'true', 'Автоматический расчет стоимости', 'boolean', true),
('finance', 'include_tax', 'true', 'Включать налоги', 'boolean', true),
('finance', 'profit_tracking', 'true', 'Отслеживание прибыли', 'boolean', true),
('finance', 'cost_tracking', 'true', 'Отслеживание себестоимости', 'boolean', true),

-- Настройки модуля уведомлений
('notifications', 'email_templates', 'true', 'Использовать шаблоны email', 'boolean', false),
('notifications', 'telegram_bot', 'true', 'Telegram бот', 'boolean', false),
('notifications', 'push_notifications', 'false', 'Push уведомления', 'boolean', false),
('notifications', 'sms_notifications', 'false', 'SMS уведомления', 'boolean', false)
ON CONFLICT (module_name, setting_key) DO NOTHING;

-- Вставка ролей и разрешений
INSERT INTO role_permissions (role, module, permission) VALUES
-- Администратор - полные права
('admin', 'orders', 'create'),
('admin', 'orders', 'read'),
('admin', 'orders', 'update'),
('admin', 'orders', 'delete'),
('admin', 'customers', 'create'),
('admin', 'customers', 'read'),
('admin', 'customers', 'update'),
('admin', 'customers', 'delete'),
('admin', 'materials', 'create'),
('admin', 'materials', 'read'),
('admin', 'materials', 'update'),
('admin', 'materials', 'delete'),
('admin', 'production', 'create'),
('admin', 'production', 'read'),
('admin', 'production', 'update'),
('admin', 'production', 'delete'),
('admin', 'finance', 'create'),
('admin', 'finance', 'read'),
('admin', 'finance', 'update'),
('admin', 'finance', 'delete'),
('admin', 'employees', 'create'),
('admin', 'employees', 'read'),
('admin', 'employees', 'update'),
('admin', 'employees', 'delete'),
('admin', 'settings', 'read'),
('admin', 'settings', 'update'),
('admin', 'reports', 'read'),

-- Менеджер - ограниченные права
('manager', 'orders', 'create'),
('manager', 'orders', 'read'),
('manager', 'orders', 'update'),
('manager', 'customers', 'create'),
('manager', 'customers', 'read'),
('manager', 'customers', 'update'),
('manager', 'materials', 'read'),
('manager', 'production', 'read'),
('manager', 'production', 'update'),
('manager', 'finance', 'read'),
('manager', 'employees', 'read'),
('manager', 'reports', 'read'),

-- Рабочий - минимальные права
('worker', 'orders', 'read'),
('worker', 'materials', 'read'),
('worker', 'production', 'read'),
('worker', 'production', 'update')
ON CONFLICT (role, module, permission) DO NOTHING;

-- Вставка настроек интеграций
INSERT INTO integration_settings (integration_name, is_enabled, config) VALUES
('telegram', false, '{"bot_token": "", "chat_id": "", "webhook_url": ""}'),
('email', false, '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": ""}'),
('calculator', true, '{"api_url": "http://localhost:3000/calc.html", "token": ""}'),
('backup', false, '{"provider": "local", "path": "./backups", "schedule": "0 2 * * *"}')
ON CONFLICT (integration_name) DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_module_settings_module ON module_settings(module_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_enabled ON integration_settings(is_enabled);

-- Создание функции для обновления времени изменения
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггеров для автоматического обновления updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_settings_updated_at BEFORE UPDATE ON module_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание представления для удобного доступа к настройкам
CREATE OR REPLACE VIEW settings_overview AS
SELECT 
    'system' as type,
    key as setting_key,
    value,
    description,
    category,
    data_type,
    is_public,
    is_required,
    validation_rules,
    created_at,
    updated_at
FROM system_settings
UNION ALL
SELECT 
    'module' as type,
    module_name || '.' || setting_key as setting_key,
    value,
    description,
    module_name as category,
    data_type,
    false as is_public,
    is_required,
    validation_rules,
    created_at,
    updated_at
FROM module_settings;

-- Создание функции для получения настроек модуля
CREATE OR REPLACE FUNCTION get_module_settings(module_name_param VARCHAR)
RETURNS TABLE(setting_key VARCHAR, value TEXT, description TEXT, data_type VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.setting_key,
        ms.value,
        ms.description,
        ms.data_type
    FROM module_settings ms
    WHERE ms.module_name = module_name_param;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки разрешений пользователя
CREATE OR REPLACE FUNCTION check_user_permission(user_role VARCHAR, module_name VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM role_permissions 
        WHERE role = user_role 
        AND module = module_name 
        AND permission = permission_name 
        AND granted = true
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE system_settings IS 'Системные настройки приложения';
COMMENT ON TABLE module_settings IS 'Настройки модулей CRM';
COMMENT ON TABLE role_permissions IS 'Разрешения ролей пользователей';
COMMENT ON TABLE notification_settings IS 'Настройки уведомлений пользователей';
COMMENT ON TABLE integration_settings IS 'Настройки внешних интеграций';
COMMENT ON VIEW settings_overview IS 'Обзор всех настроек системы';
COMMENT ON FUNCTION get_module_settings IS 'Получить настройки конкретного модуля';
COMMENT ON FUNCTION check_user_permission IS 'Проверить разрешение пользователя';


