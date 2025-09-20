-- Скрипт для добавления пользовательских материалов в библиотеку
-- Использование: psql -d sofany_crm -f add_custom_materials.sql

-- Добавить новые категории материалов (если нужно)
INSERT INTO material_categories (name, description) VALUES
('Новая категория', 'Описание новой категории')
ON CONFLICT (name) DO NOTHING;

-- Получить ID новой категории
-- SELECT id FROM material_categories WHERE name = 'Новая категория';

-- Добавить новые материалы
INSERT INTO materials (name, unit, current_stock, min_stock, price_per_unit, supplier, notes, category_id, is_active) VALUES
('Пользовательский материал 1', 'шт', 50, 10, 25.00, 'Поставщик 1', 'Описание материала 1', 
 (SELECT id FROM material_categories WHERE name = 'Новая категория'), true),
('Пользовательский материал 2', 'м', 100, 20, 15.50, 'Поставщик 2', 'Описание материала 2', 
 (SELECT id FROM material_categories WHERE name = 'Новая категория'), true);

-- Добавить новые операции
INSERT INTO operations_catalog (name, description, department, estimated_time, difficulty_level, required_skills, materials_needed, tools_required, is_active) VALUES
('Пользовательская операция 1', 'Описание операции 1', 'Пользовательский цех', 90, 3, 
 ARRAY['Навык 1', 'Навык 2'], ARRAY['Материал 1', 'Материал 2'], ARRAY['Инструмент 1', 'Инструмент 2'], true),
('Пользовательская операция 2', 'Описание операции 2', 'Пользовательский цех', 120, 4, 
 ARRAY['Навык 3', 'Навык 4'], ARRAY['Материал 3', 'Материал 4'], ARRAY['Инструмент 3', 'Инструмент 4'], true);

-- Добавить новые профессии
INSERT INTO professions_catalog (name, description, department, skill_level, hourly_rate, required_education, responsibilities, is_active) VALUES
('Пользовательская профессия 1', 'Описание профессии 1', 'Пользовательский отдел', 'middle', 300.00, 'Среднее специальное', 
 ARRAY['Ответственность 1', 'Ответственность 2'], true),
('Пользовательская профессия 2', 'Описание профессии 2', 'Пользовательский отдел', 'senior', 450.00, 'Высшее', 
 ARRAY['Ответственность 3', 'Ответственность 4'], true);

-- Показать добавленные данные
SELECT 'Материалы:' as type, name, unit, current_stock, price_per_unit FROM materials WHERE name LIKE 'Пользовательский%'
UNION ALL
SELECT 'Операции:' as type, name, department, estimated_time::text, difficulty_level::text FROM operations_catalog WHERE name LIKE 'Пользовательская%'
UNION ALL
SELECT 'Профессии:' as type, name, department, skill_level, hourly_rate::text FROM professions_catalog WHERE name LIKE 'Пользовательская%';
-- Использование: psql -d sofany_crm -f add_custom_materials.sql

-- Добавить новые категории материалов (если нужно)
INSERT INTO material_categories (name, description) VALUES
('Новая категория', 'Описание новой категории')
ON CONFLICT (name) DO NOTHING;

-- Получить ID новой категории
-- SELECT id FROM material_categories WHERE name = 'Новая категория';

-- Добавить новые материалы
INSERT INTO materials (name, unit, current_stock, min_stock, price_per_unit, supplier, notes, category_id, is_active) VALUES
('Пользовательский материал 1', 'шт', 50, 10, 25.00, 'Поставщик 1', 'Описание материала 1', 
 (SELECT id FROM material_categories WHERE name = 'Новая категория'), true),
('Пользовательский материал 2', 'м', 100, 20, 15.50, 'Поставщик 2', 'Описание материала 2', 
 (SELECT id FROM material_categories WHERE name = 'Новая категория'), true);

-- Добавить новые операции
INSERT INTO operations_catalog (name, description, department, estimated_time, difficulty_level, required_skills, materials_needed, tools_required, is_active) VALUES
('Пользовательская операция 1', 'Описание операции 1', 'Пользовательский цех', 90, 3, 
 ARRAY['Навык 1', 'Навык 2'], ARRAY['Материал 1', 'Материал 2'], ARRAY['Инструмент 1', 'Инструмент 2'], true),
('Пользовательская операция 2', 'Описание операции 2', 'Пользовательский цех', 120, 4, 
 ARRAY['Навык 3', 'Навык 4'], ARRAY['Материал 3', 'Материал 4'], ARRAY['Инструмент 3', 'Инструмент 4'], true);

-- Добавить новые профессии
INSERT INTO professions_catalog (name, description, department, skill_level, hourly_rate, required_education, responsibilities, is_active) VALUES
('Пользовательская профессия 1', 'Описание профессии 1', 'Пользовательский отдел', 'middle', 300.00, 'Среднее специальное', 
 ARRAY['Ответственность 1', 'Ответственность 2'], true),
('Пользовательская профессия 2', 'Описание профессии 2', 'Пользовательский отдел', 'senior', 450.00, 'Высшее', 
 ARRAY['Ответственность 3', 'Ответственность 4'], true);

-- Показать добавленные данные
SELECT 'Материалы:' as type, name, unit, current_stock, price_per_unit FROM materials WHERE name LIKE 'Пользовательский%'
UNION ALL
SELECT 'Операции:' as type, name, department, estimated_time::text, difficulty_level::text FROM operations_catalog WHERE name LIKE 'Пользовательская%'
UNION ALL
SELECT 'Профессии:' as type, name, department, skill_level, hourly_rate::text FROM professions_catalog WHERE name LIKE 'Пользовательская%';










