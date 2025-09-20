-- Создание таблицы маппинга материалов между калькулятором и складом
CREATE TABLE IF NOT EXISTS material_mappings (
    id SERIAL PRIMARY KEY,
    calculator_name VARCHAR(255) NOT NULL,
    calculator_category VARCHAR(100),
    warehouse_name VARCHAR(255) NOT NULL,
    warehouse_id INTEGER REFERENCES materials(id),
    mapping_type VARCHAR(50) NOT NULL, -- 'exact', 'fuzzy', 'manual'
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_material_mappings_calculator ON material_mappings(calculator_name);
CREATE INDEX IF NOT EXISTS idx_material_mappings_warehouse ON material_mappings(warehouse_name);
CREATE INDEX IF NOT EXISTS idx_material_mappings_type ON material_mappings(mapping_type);

-- Вставляем базовые маппинги для основных категорий
INSERT INTO material_mappings (calculator_name, calculator_category, warehouse_name, mapping_type, confidence_score) VALUES
-- Ткани
('FABRIC_1', 'fabric', 'Ткань 1 кат.', 'exact', 1.0),
('FABRIC_2', 'fabric', 'Ткань 2 кат.', 'exact', 1.0),
('FABRIC_3', 'fabric', 'Ткань 3 кат.', 'exact', 1.0),
('FABRIC_4', 'fabric', 'Ткань 4 кат.', 'exact', 1.0),
('ECO_LEATHER', 'fabric', 'Экокожа', 'exact', 1.0),
('GENUINE_LEATHER', 'fabric', 'Кожа натуральная', 'exact', 1.0),

-- Каркасные материалы
('DSP', 'frame', 'ДСП (базовый)', 'exact', 1.0),
('PLYWOOD', 'frame', 'Фанера березовая', 'exact', 1.0),
('METAL', 'frame', 'Профиль металлический', 'exact', 1.0),

-- ППУ (динамический маппинг по толщине)
('ППУ', 'pu', 'ППУ', 'fuzzy', 0.8),

-- Механизмы
('BOOK', 'mechanism', 'Механизм: Книжка', 'exact', 1.0),
('EURO_BOOK', 'mechanism', 'Механизм: Еврокнижка', 'exact', 1.0),
('DOLPHIN', 'mechanism', 'Механизм: Дельфин', 'exact', 1.0),
('TIC_TAC', 'mechanism', 'Механизм: Тик-так', 'exact', 1.0),
('ROLL_OUT', 'mechanism', 'Механизм: Выкатной', 'exact', 1.0),

-- Опоры
('PLASTIC', 'supports', 'Опоры пластиковые', 'exact', 1.0),
('WOODEN', 'supports', 'Опоры деревянные', 'exact', 1.0),
('METAL', 'supports', 'Опоры металлические', 'exact', 1.0);

-- Функция для поиска маппинга
CREATE OR REPLACE FUNCTION find_material_mapping(
    calc_name VARCHAR(255),
    calc_category VARCHAR(100) DEFAULT NULL
) RETURNS TABLE (
    warehouse_name VARCHAR(255),
    warehouse_id INTEGER,
    confidence DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mm.warehouse_name,
        mm.warehouse_id,
        mm.confidence_score
    FROM material_mappings mm
    WHERE mm.is_active = true
    AND (
        mm.calculator_name = calc_name
        OR (calc_category IS NOT NULL AND mm.calculator_category = calc_category)
    )
    ORDER BY mm.confidence_score DESC, mm.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Функция для нечеткого поиска материалов
CREATE OR REPLACE FUNCTION fuzzy_material_search(
    search_term VARCHAR(255),
    threshold DECIMAL(3,2) DEFAULT 0.6
) RETURNS TABLE (
    material_id INTEGER,
    material_name VARCHAR(255),
    similarity DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        similarity(m.name, search_term) as similarity
    FROM materials m
    WHERE similarity(m.name, search_term) > threshold
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;




















