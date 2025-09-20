-- Создание таблицы для отслеживания блокировок производства
CREATE TABLE IF NOT EXISTS production_blocks (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'frame', 'upholstery', 'foam_molding'
    material_type VARCHAR(50) NOT NULL, -- 'fabric', 'wood', 'foam', 'mechanism'
    material_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    available_quantity DECIMAL(10,2) NOT NULL,
    missing_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'ignored'
    created_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_production_blocks_order_id ON production_blocks(order_id);
CREATE INDEX IF NOT EXISTS idx_production_blocks_stage ON production_blocks(stage);
CREATE INDEX IF NOT EXISTS idx_production_blocks_status ON production_blocks(status);
CREATE INDEX IF NOT EXISTS idx_production_blocks_material_type ON production_blocks(material_type);

-- Добавляем поле blocked_by_materials в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS blocked_by_materials BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS blocked_stages TEXT[] DEFAULT '{}';

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_production_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_production_blocks_updated_at ON production_blocks;
CREATE TRIGGER update_production_blocks_updated_at
    BEFORE UPDATE ON production_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_production_blocks_updated_at();

-- Создаем таблицу требований к материалам по цехам
CREATE TABLE IF NOT EXISTS production_requirements (
    id SERIAL PRIMARY KEY,
    stage VARCHAR(50) NOT NULL UNIQUE, -- 'frame', 'upholstery', 'foam_molding'
    material_type VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заполняем базовые требования
INSERT INTO production_requirements (stage, material_type, material_name, required_quantity, unit, is_required) VALUES
('frame', 'wood', 'Фанера', 1.0, 'шт', true),
('frame', 'wood', 'Брус', 1.0, 'шт', true),
('frame', 'wood', 'ДСП', 1.0, 'шт', true),
('upholstery', 'fabric', 'Ткань', 1.0, 'м', true),
('upholstery', 'fabric', 'Ткань 800', 1.0, 'м', true),
('foam_molding', 'foam', 'ППУ', 1.0, 'кг', true),
('foam_molding', 'foam', 'ППУ-25', 1.0, 'кг', true),
('assembly', 'mechanism', 'Механизм', 1.0, 'шт', true);

-- Создаем функцию для проверки материалов
CREATE OR REPLACE FUNCTION check_materials_for_stage(
    p_order_id INTEGER,
    p_stage VARCHAR(50)
) RETURNS TABLE (
    material_name VARCHAR(255),
    required_quantity DECIMAL(10,2),
    available_quantity DECIMAL(10,2),
    missing_quantity DECIMAL(10,2),
    unit VARCHAR(20),
    is_blocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH order_materials AS (
        SELECT 
            om.material_name,
            om.required_quantity,
            om.unit,
            COALESCE(m.current_stock, 0) as available_quantity
        FROM order_materials om
        LEFT JOIN materials m ON LOWER(m.name) = LOWER(om.material_name)
        WHERE om.order_id = p_order_id
    ),
    stage_requirements AS (
        SELECT 
            pr.material_name,
            pr.required_quantity,
            pr.unit
        FROM production_requirements pr
        WHERE pr.stage = p_stage AND pr.is_required = true
    )
    SELECT 
        om.material_name,
        om.required_quantity,
        om.available_quantity,
        GREATEST(0, om.required_quantity - om.available_quantity) as missing_quantity,
        om.unit,
        (om.required_quantity > om.available_quantity) as is_blocked
    FROM order_materials om
    INNER JOIN stage_requirements sr ON LOWER(om.material_name) = LOWER(sr.material_name)
    WHERE om.required_quantity > 0;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для обновления блокировок заказа
CREATE OR REPLACE FUNCTION update_order_blocks(p_order_id INTEGER)
RETURNS VOID AS $$
DECLARE
    blocked_stages TEXT[] := '{}';
    stage_name VARCHAR(50);
    is_blocked BOOLEAN;
BEGIN
    -- Проверяем каждый этап
    FOR stage_name IN SELECT DISTINCT stage FROM production_requirements WHERE is_required = true LOOP
        SELECT EXISTS(
            SELECT 1 FROM check_materials_for_stage(p_order_id, stage_name) 
            WHERE is_blocked = true
        ) INTO is_blocked;
        
        IF is_blocked THEN
            blocked_stages := array_append(blocked_stages, stage_name);
        END IF;
    END LOOP;
    
    -- Обновляем заказ
    UPDATE orders 
    SET 
        blocked_by_materials = (array_length(blocked_stages, 1) > 0),
        blocked_stages = blocked_stages
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'frame', 'upholstery', 'foam_molding'
    material_type VARCHAR(50) NOT NULL, -- 'fabric', 'wood', 'foam', 'mechanism'
    material_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    available_quantity DECIMAL(10,2) NOT NULL,
    missing_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'ignored'
    created_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_production_blocks_order_id ON production_blocks(order_id);
CREATE INDEX IF NOT EXISTS idx_production_blocks_stage ON production_blocks(stage);
CREATE INDEX IF NOT EXISTS idx_production_blocks_status ON production_blocks(status);
CREATE INDEX IF NOT EXISTS idx_production_blocks_material_type ON production_blocks(material_type);

-- Добавляем поле blocked_by_materials в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS blocked_by_materials BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS blocked_stages TEXT[] DEFAULT '{}';

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_production_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_production_blocks_updated_at ON production_blocks;
CREATE TRIGGER update_production_blocks_updated_at
    BEFORE UPDATE ON production_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_production_blocks_updated_at();

-- Создаем таблицу требований к материалам по цехам
CREATE TABLE IF NOT EXISTS production_requirements (
    id SERIAL PRIMARY KEY,
    stage VARCHAR(50) NOT NULL UNIQUE, -- 'frame', 'upholstery', 'foam_molding'
    material_type VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заполняем базовые требования
INSERT INTO production_requirements (stage, material_type, material_name, required_quantity, unit, is_required) VALUES
('frame', 'wood', 'Фанера', 1.0, 'шт', true),
('frame', 'wood', 'Брус', 1.0, 'шт', true),
('frame', 'wood', 'ДСП', 1.0, 'шт', true),
('upholstery', 'fabric', 'Ткань', 1.0, 'м', true),
('upholstery', 'fabric', 'Ткань 800', 1.0, 'м', true),
('foam_molding', 'foam', 'ППУ', 1.0, 'кг', true),
('foam_molding', 'foam', 'ППУ-25', 1.0, 'кг', true),
('assembly', 'mechanism', 'Механизм', 1.0, 'шт', true);

-- Создаем функцию для проверки материалов
CREATE OR REPLACE FUNCTION check_materials_for_stage(
    p_order_id INTEGER,
    p_stage VARCHAR(50)
) RETURNS TABLE (
    material_name VARCHAR(255),
    required_quantity DECIMAL(10,2),
    available_quantity DECIMAL(10,2),
    missing_quantity DECIMAL(10,2),
    unit VARCHAR(20),
    is_blocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH order_materials AS (
        SELECT 
            om.material_name,
            om.required_quantity,
            om.unit,
            COALESCE(m.current_stock, 0) as available_quantity
        FROM order_materials om
        LEFT JOIN materials m ON LOWER(m.name) = LOWER(om.material_name)
        WHERE om.order_id = p_order_id
    ),
    stage_requirements AS (
        SELECT 
            pr.material_name,
            pr.required_quantity,
            pr.unit
        FROM production_requirements pr
        WHERE pr.stage = p_stage AND pr.is_required = true
    )
    SELECT 
        om.material_name,
        om.required_quantity,
        om.available_quantity,
        GREATEST(0, om.required_quantity - om.available_quantity) as missing_quantity,
        om.unit,
        (om.required_quantity > om.available_quantity) as is_blocked
    FROM order_materials om
    INNER JOIN stage_requirements sr ON LOWER(om.material_name) = LOWER(sr.material_name)
    WHERE om.required_quantity > 0;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для обновления блокировок заказа
CREATE OR REPLACE FUNCTION update_order_blocks(p_order_id INTEGER)
RETURNS VOID AS $$
DECLARE
    blocked_stages TEXT[] := '{}';
    stage_name VARCHAR(50);
    is_blocked BOOLEAN;
BEGIN
    -- Проверяем каждый этап
    FOR stage_name IN SELECT DISTINCT stage FROM production_requirements WHERE is_required = true LOOP
        SELECT EXISTS(
            SELECT 1 FROM check_materials_for_stage(p_order_id, stage_name) 
            WHERE is_blocked = true
        ) INTO is_blocked;
        
        IF is_blocked THEN
            blocked_stages := array_append(blocked_stages, stage_name);
        END IF;
    END LOOP;
    
    -- Обновляем заказ
    UPDATE orders 
    SET 
        blocked_by_materials = (array_length(blocked_stages, 1) > 0),
        blocked_stages = blocked_stages
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
