-- Создание таблицы остатков на складе
-- Связывает библиотеку материалов с реальными остатками

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id SERIAL PRIMARY KEY,
  material_library_id INTEGER NOT NULL REFERENCES materials_library(id) ON DELETE CASCADE,
  current_stock NUMERIC(10,2) DEFAULT 0 NOT NULL,
  min_stock NUMERIC(10,2) DEFAULT 0 NOT NULL,
  max_stock NUMERIC(10,2) DEFAULT 0,
  location VARCHAR(100),
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_material_library_id ON warehouse_stock(material_library_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_active ON warehouse_stock(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_location ON warehouse_stock(location);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_supplier ON warehouse_stock(supplier_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_warehouse_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouse_stock_updated_at
  BEFORE UPDATE ON warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_stock_updated_at();

-- Комментарии к таблице и полям
COMMENT ON TABLE warehouse_stock IS 'Остатки материалов на складе, связанные с библиотекой материалов';
COMMENT ON COLUMN warehouse_stock.material_library_id IS 'Ссылка на материал в библиотеке';
COMMENT ON COLUMN warehouse_stock.current_stock IS 'Текущий остаток на складе';
COMMENT ON COLUMN warehouse_stock.min_stock IS 'Минимальный остаток для заказа';
COMMENT ON COLUMN warehouse_stock.max_stock IS 'Максимальный остаток для хранения';
COMMENT ON COLUMN warehouse_stock.location IS 'Местоположение на складе';
COMMENT ON COLUMN warehouse_stock.supplier_id IS 'Основной поставщик материала';
COMMENT ON COLUMN warehouse_stock.last_updated IS 'Время последнего обновления остатка';
COMMENT ON COLUMN warehouse_stock.updated_by IS 'Пользователь, обновивший остаток';

