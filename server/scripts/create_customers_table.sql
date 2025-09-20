-- Создание таблицы клиентов
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Добавление демо-клиентов
INSERT INTO customers (first_name, last_name, email, phone, company, status, notes) VALUES 
('Анна', 'Петрова', 'petrova.anna@example.com', '+7-999-111-22-33', 'ООО "Мебель Плюс"', 'active', 'Крупный корпоративный клиент, предпочитает диваны'),
('Михаил', 'Сидоров', 'sidorov.m@example.com', '+7-999-222-33-44', 'ИП Сидоров', 'active', 'Частный клиент, заказывает столы и стулья'),
('Елена', 'Козлова', 'kozlova.elena@example.com', '+7-999-333-44-55', 'ООО "Дом и Сад"', 'active', 'Регулярные заказы мягкой мебели'),
('Дмитрий', 'Волков', 'volkov.d@example.com', '+7-999-444-55-66', 'ООО "ОфисМебель"', 'active', 'Корпоративные заказы офисной мебели'),
('Ольга', 'Смирнова', 'smirnova.olga@example.com', '+7-999-555-66-77', 'ИП Смирнова', 'active', 'Дизайнер интерьеров, VIP клиент'),
('Сергей', 'Кузнецов', 'kuznetsov.s@example.com', '+7-999-666-77-88', 'ООО "МебельСервис"', 'active', 'Оптовые заказы для перепродажи'),
('Татьяна', 'Новикова', 'novikova.t@example.com', '+7-999-777-88-99', 'ООО "Стиль и Комфорт"', 'active', 'Салон мебели, регулярные поставки'),
('Александр', 'Морозов', 'morozov.a@example.com', '+7-999-888-99-00', 'ИП Морозов', 'inactive', 'Бывший клиент, не заказывал более года'),
('Мария', 'Федорова', 'fedorova.m@example.com', '+7-999-999-00-11', 'ООО "Дом Мечты"', 'active', 'Строительная компания, заказы для новостроек'),
('Владимир', 'Иванов', 'ivanov.v@example.com', '+7-999-000-11-22', 'ООО "ЭлитМебель"', 'active', 'Премиум сегмент, эксклюзивные заказы'),
('Наталья', 'Лебедева', 'lebedova.n@example.com', '+7-999-111-22-33', 'ИП Лебедева', 'active', 'Частный клиент, заказы детской мебели'),
('Андрей', 'Попов', 'popov.a@example.com', '+7-999-222-33-44', 'ООО "МебельМаркет"', 'active', 'Интернет-магазин мебели'),
('Ирина', 'Соколова', 'sokolova.i@example.com', '+7-999-333-44-55', 'ИП Соколова', 'active', 'Дизайнер, заказы для клиентов'),
('Павел', 'Михайлов', 'mikhailov.p@example.com', '+7-999-444-55-66', 'ООО "КомфортПлюс"', 'active', 'Мебельный салон'),
('Юлия', 'Васильева', 'vasilieva.y@example.com', '+7-999-555-66-77', 'ИП Васильева', 'blocked', 'Проблемы с оплатой'),
('Роман', 'Григорьев', 'grigoriev.r@example.com', '+7-999-666-77-88', 'ООО "МебельСтиль"', 'active', 'Корпоративный клиент'),
('Светлана', 'Козлова', 'kozlova.s@example.com', '+7-999-777-88-99', 'ИП Козлова', 'active', 'Частный клиент'),
('Игорь', 'Семенов', 'semenov.i@example.com', '+7-999-888-99-00', 'ООО "Дом и Офис"', 'active', 'Офисная мебель'),
('Людмила', 'Павлова', 'pavlova.l@example.com', '+7-999-999-00-11', 'ИП Павлова', 'active', 'Частный клиент'),
('Николай', 'Васильев', 'vasiliev.n@example.com', '+7-999-000-11-22', 'ООО "МебельПрофи"', 'active', 'Производственная компания')
ON CONFLICT (email) DO NOTHING;
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Добавление демо-клиентов
INSERT INTO customers (first_name, last_name, email, phone, company, status, notes) VALUES 
('Анна', 'Петрова', 'petrova.anna@example.com', '+7-999-111-22-33', 'ООО "Мебель Плюс"', 'active', 'Крупный корпоративный клиент, предпочитает диваны'),
('Михаил', 'Сидоров', 'sidorov.m@example.com', '+7-999-222-33-44', 'ИП Сидоров', 'active', 'Частный клиент, заказывает столы и стулья'),
('Елена', 'Козлова', 'kozlova.elena@example.com', '+7-999-333-44-55', 'ООО "Дом и Сад"', 'active', 'Регулярные заказы мягкой мебели'),
('Дмитрий', 'Волков', 'volkov.d@example.com', '+7-999-444-55-66', 'ООО "ОфисМебель"', 'active', 'Корпоративные заказы офисной мебели'),
('Ольга', 'Смирнова', 'smirnova.olga@example.com', '+7-999-555-66-77', 'ИП Смирнова', 'active', 'Дизайнер интерьеров, VIP клиент'),
('Сергей', 'Кузнецов', 'kuznetsov.s@example.com', '+7-999-666-77-88', 'ООО "МебельСервис"', 'active', 'Оптовые заказы для перепродажи'),
('Татьяна', 'Новикова', 'novikova.t@example.com', '+7-999-777-88-99', 'ООО "Стиль и Комфорт"', 'active', 'Салон мебели, регулярные поставки'),
('Александр', 'Морозов', 'morozov.a@example.com', '+7-999-888-99-00', 'ИП Морозов', 'inactive', 'Бывший клиент, не заказывал более года'),
('Мария', 'Федорова', 'fedorova.m@example.com', '+7-999-999-00-11', 'ООО "Дом Мечты"', 'active', 'Строительная компания, заказы для новостроек'),
('Владимир', 'Иванов', 'ivanov.v@example.com', '+7-999-000-11-22', 'ООО "ЭлитМебель"', 'active', 'Премиум сегмент, эксклюзивные заказы'),
('Наталья', 'Лебедева', 'lebedova.n@example.com', '+7-999-111-22-33', 'ИП Лебедева', 'active', 'Частный клиент, заказы детской мебели'),
('Андрей', 'Попов', 'popov.a@example.com', '+7-999-222-33-44', 'ООО "МебельМаркет"', 'active', 'Интернет-магазин мебели'),
('Ирина', 'Соколова', 'sokolova.i@example.com', '+7-999-333-44-55', 'ИП Соколова', 'active', 'Дизайнер, заказы для клиентов'),
('Павел', 'Михайлов', 'mikhailov.p@example.com', '+7-999-444-55-66', 'ООО "КомфортПлюс"', 'active', 'Мебельный салон'),
('Юлия', 'Васильева', 'vasilieva.y@example.com', '+7-999-555-66-77', 'ИП Васильева', 'blocked', 'Проблемы с оплатой'),
('Роман', 'Григорьев', 'grigoriev.r@example.com', '+7-999-666-77-88', 'ООО "МебельСтиль"', 'active', 'Корпоративный клиент'),
('Светлана', 'Козлова', 'kozlova.s@example.com', '+7-999-777-88-99', 'ИП Козлова', 'active', 'Частный клиент'),
('Игорь', 'Семенов', 'semenov.i@example.com', '+7-999-888-99-00', 'ООО "Дом и Офис"', 'active', 'Офисная мебель'),
('Людмила', 'Павлова', 'pavlova.l@example.com', '+7-999-999-00-11', 'ИП Павлова', 'active', 'Частный клиент'),
('Николай', 'Васильев', 'vasiliev.n@example.com', '+7-999-000-11-22', 'ООО "МебельПрофи"', 'active', 'Производственная компания')
ON CONFLICT (email) DO NOTHING;










