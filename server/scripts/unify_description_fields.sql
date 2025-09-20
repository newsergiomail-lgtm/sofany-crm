-- Миграция для унификации полей описания заказов
-- Объединяем project_description в detailed_description

-- 1. Обновляем detailed_description, если project_description не пустое
UPDATE orders 
SET detailed_description = CASE 
    WHEN detailed_description IS NULL OR detailed_description = '' 
    THEN project_description 
    ELSE detailed_description 
END
WHERE project_description IS NOT NULL AND project_description != '';

-- 2. Проверяем результат
SELECT 
    COUNT(*) as total_orders,
    COUNT(short_description) as has_short_desc,
    COUNT(detailed_description) as has_detailed_desc,
    COUNT(project_description) as has_project_desc
FROM orders;

-- 3. Показываем примеры объединения
SELECT 
    id,
    order_number,
    short_description,
    detailed_description,
    project_description
FROM orders 
WHERE project_description IS NOT NULL 
LIMIT 5;

