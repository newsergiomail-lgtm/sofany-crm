-- Создание таблицы поставщиков
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Добавление демо-поставщиков
INSERT INTO suppliers (name, contact_person, email, phone, address, website, notes) VALUES 
('ООО "Мебельные материалы"', 'Иванов Иван Иванович', 'info@mebel-materials.ru', '+7-495-123-45-67', 'Москва, ул. Промышленная, д. 15', 'www.mebel-materials.ru', 'Основной поставщик фурнитуры'),
('ИП Петров А.А.', 'Петров Алексей Александрович', 'petrov@example.com', '+7-999-111-22-33', 'Москва, ул. Лесная, д. 8', '', 'Поставщик древесины'),
('ЗАО "ТекстильПро"', 'Сидорова Мария Петровна', 'sales@textilepro.ru', '+7-495-987-65-43', 'Москва, ул. Текстильная, д. 25', 'www.textilepro.ru', 'Ткани и обивочные материалы'),
('ООО "Фурнитура+"', 'Козлов Сергей Владимирович', 'kozlov@furnitura-plus.ru', '+7-495-555-44-33', 'Москва, ул. Металлистов, д. 12', 'www.furnitura-plus.ru', 'Металлическая фурнитура'),
('ИП Смирнова Е.В.', 'Смирнова Елена Владимировна', 'smirnova@example.com', '+7-999-777-88-99', 'Москва, ул. Садовая, д. 3', '', 'Декоративные элементы')
ON CONFLICT DO NOTHING;

-- Обновление таблицы материалов для связи с поставщиками
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Создание индекса для связи материалов с поставщиками
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Добавление демо-поставщиков
INSERT INTO suppliers (name, contact_person, email, phone, address, website, notes) VALUES 
('ООО "Мебельные материалы"', 'Иванов Иван Иванович', 'info@mebel-materials.ru', '+7-495-123-45-67', 'Москва, ул. Промышленная, д. 15', 'www.mebel-materials.ru', 'Основной поставщик фурнитуры'),
('ИП Петров А.А.', 'Петров Алексей Александрович', 'petrov@example.com', '+7-999-111-22-33', 'Москва, ул. Лесная, д. 8', '', 'Поставщик древесины'),
('ЗАО "ТекстильПро"', 'Сидорова Мария Петровна', 'sales@textilepro.ru', '+7-495-987-65-43', 'Москва, ул. Текстильная, д. 25', 'www.textilepro.ru', 'Ткани и обивочные материалы'),
('ООО "Фурнитура+"', 'Козлов Сергей Владимирович', 'kozlov@furnitura-plus.ru', '+7-495-555-44-33', 'Москва, ул. Металлистов, д. 12', 'www.furnitura-plus.ru', 'Металлическая фурнитура'),
('ИП Смирнова Е.В.', 'Смирнова Елена Владимировна', 'smirnova@example.com', '+7-999-777-88-99', 'Москва, ул. Садовая, д. 3', '', 'Декоративные элементы')
ON CONFLICT DO NOTHING;

-- Обновление таблицы материалов для связи с поставщиками
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Создание индекса для связи материалов с поставщиками
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Добавление демо-поставщиков
INSERT INTO suppliers (name, contact_person, email, phone, address, website, notes) VALUES 
('ООО "Мебельные материалы"', 'Иванов Иван Иванович', 'info@mebel-materials.ru', '+7-495-123-45-67', 'Москва, ул. Промышленная, д. 15', 'www.mebel-materials.ru', 'Основной поставщик фурнитуры'),
('ИП Петров А.А.', 'Петров Алексей Александрович', 'petrov@example.com', '+7-999-111-22-33', 'Москва, ул. Лесная, д. 8', '', 'Поставщик древесины'),
('ЗАО "ТекстильПро"', 'Сидорова Мария Петровна', 'sales@textilepro.ru', '+7-495-987-65-43', 'Москва, ул. Текстильная, д. 25', 'www.textilepro.ru', 'Ткани и обивочные материалы'),
('ООО "Фурнитура+"', 'Козлов Сергей Владимирович', 'kozlov@furnitura-plus.ru', '+7-495-555-44-33', 'Москва, ул. Металлистов, д. 12', 'www.furnitura-plus.ru', 'Металлическая фурнитура'),
('ИП Смирнова Е.В.', 'Смирнова Елена Владимировна', 'smirnova@example.com', '+7-999-777-88-99', 'Москва, ул. Садовая, д. 3', '', 'Декоративные элементы')
ON CONFLICT DO NOTHING;

-- Обновление таблицы материалов для связи с поставщиками
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Создание индекса для связи материалов с поставщиками
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);












