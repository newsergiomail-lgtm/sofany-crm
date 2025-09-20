-- Скрипт для массового импорта материалов из CSV
-- Использование: 
-- 1. Создайте CSV файл с колонками: name,unit,current_stock,min_stock,price_per_unit,supplier,notes,category_name
-- 2. Выполните: psql -d sofany_crm -f import_materials_from_csv.sql

-- Создать временную таблицу для импорта
CREATE TEMP TABLE temp_materials_import (
    name VARCHAR(255),
    unit VARCHAR(50),
    current_stock DECIMAL(10,2),
    min_stock DECIMAL(10,2),
    price_per_unit DECIMAL(10,2),
    supplier VARCHAR(255),
    notes TEXT,
    category_name VARCHAR(255)
);

-- Пример данных для импорта (замените на ваши данные)
INSERT INTO temp_materials_import VALUES
('Новый материал 1', 'шт', 100, 20, 15.50, 'Поставщик А', 'Описание 1', 'Крепеж метизы'),
('Новый материал 2', 'м', 50, 10, 25.00, 'Поставщик Б', 'Описание 2', 'Пиломатериалы'),
('Новый материал 3', 'кг', 200, 50, 8.75, 'Поставщик В', 'Описание 3', 'Клей и герметики'),
('Новый ППУ-30', 'м²', 100, 20, 55.00, 'Завод ППУ', 'Поролон 30 кг/м³', 'ППУ и поролон'),
('Новая ткань', 'м', 150, 30, 180.00, 'Текстиль', 'Ткань для обивки', 'Ткани для обивки');

-- Импортировать данные в основную таблицу
INSERT INTO materials (name, unit, current_stock, min_stock, price_per_unit, supplier, notes, category_id, is_active)
SELECT 
    tmi.name,
    tmi.unit,
    tmi.current_stock,
    tmi.min_stock,
    tmi.price_per_unit,
    tmi.supplier,
    tmi.notes,
    mc.id as category_id,
    true as is_active
FROM temp_materials_import tmi
LEFT JOIN material_categories mc ON LOWER(mc.name) = LOWER(tmi.category_name);

-- Показать результат импорта
SELECT 
    'Импортировано материалов:' as status,
    COUNT(*) as count
FROM materials m
JOIN temp_materials_import tmi ON LOWER(m.name) = LOWER(tmi.name);

-- Показать добавленные материалы
SELECT 
    m.name,
    m.unit,
    m.current_stock,
    m.price_per_unit,
    mc.name as category
FROM materials m
JOIN material_categories mc ON m.category_id = mc.id
JOIN temp_materials_import tmi ON LOWER(m.name) = LOWER(tmi.name);



-- 1. Создайте CSV файл с колонками: name,unit,current_stock,min_stock,price_per_unit,supplier,notes,category_name
-- 2. Выполните: psql -d sofany_crm -f import_materials_from_csv.sql

-- Создать временную таблицу для импорта
CREATE TEMP TABLE temp_materials_import (
    name VARCHAR(255),
    unit VARCHAR(50),
    current_stock DECIMAL(10,2),
    min_stock DECIMAL(10,2),
    price_per_unit DECIMAL(10,2),
    supplier VARCHAR(255),
    notes TEXT,
    category_name VARCHAR(255)
);

-- Пример данных для импорта (замените на ваши данные)
INSERT INTO temp_materials_import VALUES
('Новый материал 1', 'шт', 100, 20, 15.50, 'Поставщик А', 'Описание 1', 'Крепеж метизы'),
('Новый материал 2', 'м', 50, 10, 25.00, 'Поставщик Б', 'Описание 2', 'Пиломатериалы'),
('Новый материал 3', 'кг', 200, 50, 8.75, 'Поставщик В', 'Описание 3', 'Клей и герметики'),
('Новый ППУ-30', 'м²', 100, 20, 55.00, 'Завод ППУ', 'Поролон 30 кг/м³', 'ППУ и поролон'),
('Новая ткань', 'м', 150, 30, 180.00, 'Текстиль', 'Ткань для обивки', 'Ткани для обивки');

-- Импортировать данные в основную таблицу
INSERT INTO materials (name, unit, current_stock, min_stock, price_per_unit, supplier, notes, category_id, is_active)
SELECT 
    tmi.name,
    tmi.unit,
    tmi.current_stock,
    tmi.min_stock,
    tmi.price_per_unit,
    tmi.supplier,
    tmi.notes,
    mc.id as category_id,
    true as is_active
FROM temp_materials_import tmi
LEFT JOIN material_categories mc ON LOWER(mc.name) = LOWER(tmi.category_name);

-- Показать результат импорта
SELECT 
    'Импортировано материалов:' as status,
    COUNT(*) as count
FROM materials m
JOIN temp_materials_import tmi ON LOWER(m.name) = LOWER(tmi.name);

-- Показать добавленные материалы
SELECT 
    m.name,
    m.unit,
    m.current_stock,
    m.price_per_unit,
    mc.name as category
FROM materials m
JOIN material_categories mc ON m.category_id = mc.id
JOIN temp_materials_import tmi ON LOWER(m.name) = LOWER(tmi.name);


