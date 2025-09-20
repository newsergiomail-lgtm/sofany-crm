-- Миграция данных из таблицы materials в warehouse_stock
-- Связывает существующие материалы с библиотекой

-- Сначала создаем таблицу warehouse_stock (если еще не создана)
\i create_warehouse_stock_table.sql

-- Временная таблица для сопоставления материалов
CREATE TEMP TABLE material_mapping AS
SELECT 
  m.id as old_material_id,
  m.name,
  m.current_stock,
  m.min_stock,
  m.price_per_unit,
  m.supplier,
  m.notes,
  m.category_id,
  ml.id as library_material_id
FROM materials m
LEFT JOIN materials_library ml ON LOWER(TRIM(m.name)) = LOWER(TRIM(ml.name));

-- Показываем статистику сопоставления
SELECT 
  'Статистика сопоставления материалов:' as info,
  COUNT(*) as total_materials,
  COUNT(library_material_id) as matched_with_library,
  COUNT(*) - COUNT(library_material_id) as not_matched
FROM material_mapping;

-- Показываем материалы, которые не найдены в библиотеке
SELECT 
  'Материалы НЕ найденные в библиотеке:' as status,
  name,
  current_stock,
  price_per_unit
FROM material_mapping 
WHERE library_material_id IS NULL
ORDER BY name;

-- Мигрируем данные в warehouse_stock
INSERT INTO warehouse_stock (
  material_library_id,
  current_stock,
  min_stock,
  location,
  notes,
  is_active
)
SELECT 
  library_material_id,
  COALESCE(current_stock, 0),
  COALESCE(min_stock, 0),
  'Основной склад' as location,
  notes,
  true as is_active
FROM material_mapping
WHERE library_material_id IS NOT NULL;

-- Показываем результат миграции
SELECT 
  'Результат миграции:' as status,
  COUNT(*) as migrated_records
FROM warehouse_stock;

-- Показываем первые 10 записей для проверки
SELECT 
  ws.id,
  ml.name as material_name,
  ws.current_stock,
  ws.min_stock,
  ws.location,
  ws.created_at
FROM warehouse_stock ws
JOIN materials_library ml ON ws.material_library_id = ml.id
ORDER BY ws.id
LIMIT 10;

-- Создаем представление для обратной совместимости
CREATE OR REPLACE VIEW materials_warehouse_view AS
SELECT 
  ws.id,
  ml.name,
  ml.unit,
  ws.current_stock,
  ws.min_stock,
  ml.base_price as price_per_unit,
  s.name as supplier,
  ws.notes,
  ml.category_id,
  ws.is_active,
  ws.created_at,
  ws.updated_at
FROM warehouse_stock ws
JOIN materials_library ml ON ws.material_library_id = ml.id
LEFT JOIN suppliers s ON ws.supplier_id = s.id
WHERE ws.is_active = true;

-- Комментарий к представлению
COMMENT ON VIEW materials_warehouse_view IS 'Представление для обратной совместимости с таблицей materials';

