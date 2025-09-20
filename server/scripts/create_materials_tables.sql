-- Создание таблицы материалов
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_full VARCHAR(500),
    category VARCHAR(100),
    unit VARCHAR(20) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    supplier VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы материалов заказов
CREATE TABLE IF NOT EXISTS order_materials (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_name_full VARCHAR(500),
    required_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_order_materials_order_id ON order_materials(order_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_material_name ON order_materials(material_name);

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_order_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_materials_updated_at();

DROP TRIGGER IF EXISTS update_order_materials_updated_at ON order_materials;
CREATE TRIGGER update_order_materials_updated_at
    BEFORE UPDATE ON order_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_order_materials_updated_at();

-- Заполняем базовые материалы
INSERT INTO materials (name, name_full, category, unit, current_stock, min_stock, unit_price, supplier) VALUES
('Ткань 800', 'Ткань 800 - основная обивочная ткань', 'fabric', 'м', 0, 10, 8000, 'Поставщик тканей'),
('ППУ ППУ-25 (40мм)', 'Поролон ППУ-25 толщина 40мм', 'foam', 'кг', 0, 50, 1500, 'Поставщик ППУ'),
('Каркас dsp', 'Каркас из ДСП', 'wood', 'шт', 0, 5, 5000, 'Поставщик пиломатериалов'),
('Механизм 3000', 'Механизм трансформации', 'mechanism', 'шт', 0, 3, 3000, 'Поставщик механизмов')
ON CONFLICT (name) DO NOTHING;