-- Миграция для улучшения библиотеки
-- Создает недостающие таблицы БЕЗ изменения существующих

-- 1. Категории операций
CREATE TABLE IF NOT EXISTS operation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Справочные данные (размеры, константы, коэффициенты)
CREATE TABLE IF NOT EXISTS reference_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Расценки (почасовая оплата, надбавки, коэффициенты)
CREATE TABLE IF NOT EXISTS rates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    rate_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Настройки калькулятора
CREATE TABLE IF NOT EXISTS calculator_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Категории материалов (если нужно)
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10B981',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_operation_categories_name ON operation_categories(name);
CREATE INDEX IF NOT EXISTS idx_reference_data_category ON reference_data(category);
CREATE INDEX IF NOT EXISTS idx_reference_data_active ON reference_data(is_active);
CREATE INDEX IF NOT EXISTS idx_rates_category ON rates(category);
CREATE INDEX IF NOT EXISTS idx_rates_active ON rates(is_active);
CREATE INDEX IF NOT EXISTS idx_rates_valid_dates ON rates(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_calculator_settings_name ON calculator_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_material_categories_name ON material_categories(name);

-- Добавляем колонку category_id в operations (если её нет)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'operations' AND column_name = 'category_id') THEN
        ALTER TABLE operations ADD COLUMN category_id INTEGER REFERENCES operation_categories(id);
    END IF;
END $$;

-- Добавляем колонку category_id в materials (если её нет)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materials' AND column_name = 'category_id') THEN
        ALTER TABLE materials ADD COLUMN category_id INTEGER REFERENCES material_categories(id);
    END IF;
END $$;

-- Вставляем базовые категории операций
INSERT INTO operation_categories (name, description, color) VALUES
('Подготовительные работы', 'Разметка, раскрой, подготовка материалов', '#3B82F6'),
('Обработка дерева', 'Строгание, шлифовка, фрезеровка', '#10B981'),
('Сборка', 'Соединение деталей, крепление', '#F59E0B'),
('Обивка', 'Работа с тканью, поролоном, кожей', '#EF4444'),
('Финишная обработка', 'Покраска, лакировка, полировка', '#8B5CF6'),
('Упаковка', 'Упаковка готовых изделий', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Вставляем базовые категории материалов
INSERT INTO material_categories (name, description, color) VALUES
('Древесина', 'Доски, бруски, фанера', '#8B4513'),
('Обивочные материалы', 'Ткань, кожа, поролон', '#FF6B6B'),
('Фурнитура', 'Петли, ручки, замки', '#4ECDC4'),
('Крепеж', 'Саморезы, болты, гвозди', '#45B7D1'),
('Отделочные материалы', 'Лак, краска, клей', '#96CEB4'),
('Упаковочные материалы', 'Картон, пленка, скотч', '#FFEAA7')
ON CONFLICT (name) DO NOTHING;

-- Вставляем базовые справочные данные
INSERT INTO reference_data (name, category, value, unit, description) VALUES
('Коэффициент сложности', 'Расчеты', 1.2, 'ед', 'Базовый коэффициент для расчета сложности'),
('Норма времени на подготовку', 'Время', 15, 'мин', 'Время на подготовку рабочего места'),
('Коэффициент качества', 'Расчеты', 1.1, 'ед', 'Коэффициент для премиальных изделий'),
('Стандартная ширина ткани', 'Размеры', 150, 'см', 'Стандартная ширина обивочной ткани'),
('Толщина поролона', 'Размеры', 5, 'см', 'Стандартная толщина поролона'),
('Длина самореза', 'Размеры', 3.5, 'см', 'Стандартная длина самореза')
ON CONFLICT DO NOTHING;

-- Вставляем базовые расценки
INSERT INTO rates (name, category, rate_value, unit, description) VALUES
('Почасовая ставка мастера', 'Оплата', 500, 'руб/час', 'Базовая почасовая ставка мастера'),
('Почасовая ставка помощника', 'Оплата', 300, 'руб/час', 'Базовая почасовая ставка помощника'),
('Надбавка за сложность', 'Надбавки', 0.2, 'коэф', 'Надбавка за сложные работы'),
('Надбавка за качество', 'Надбавки', 0.15, 'коэф', 'Надбавка за высокое качество'),
('Премия за перевыполнение', 'Премии', 0.1, 'коэф', 'Премия за перевыполнение плана'),
('Коэффициент срочности', 'Коэффициенты', 1.5, 'коэф', 'Коэффициент для срочных заказов')
ON CONFLICT DO NOTHING;

-- Вставляем базовые настройки калькулятора
INSERT INTO calculator_settings (setting_name, setting_value, setting_type, description) VALUES
('default_markup', '1.3', 'decimal', 'Базовая наценка на материалы'),
('labor_cost_multiplier', '1.2', 'decimal', 'Множитель стоимости работ'),
('complexity_factor', '1.1', 'decimal', 'Коэффициент сложности'),
('quality_factor', '1.05', 'decimal', 'Коэффициент качества'),
('rush_order_multiplier', '1.5', 'decimal', 'Множитель для срочных заказов'),
('profit_margin', '0.25', 'decimal', 'Плановая рентабельность'),
('tax_rate', '0.2', 'decimal', 'Налоговая ставка'),
('currency', 'RUB', 'string', 'Валюта расчетов')
ON CONFLICT (setting_name) DO NOTHING;
