-- Создание таблицы заявок на закупку
CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы позиций заявки на закупку
CREATE TABLE IF NOT EXISTS purchase_request_items (
  id SERIAL PRIMARY KEY,
  purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
  material_name VARCHAR(255) NOT NULL,
  required_quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  estimated_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  notes TEXT,
  is_ordered BOOLEAN DEFAULT FALSE,
  ordered_at TIMESTAMP,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_purchase_requests_order_id ON purchase_requests(order_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_created_by ON purchase_requests(created_by);
CREATE INDEX idx_purchase_request_items_request_id ON purchase_request_items(purchase_request_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_purchase_requests_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_requests_updated_at 
  BEFORE UPDATE ON purchase_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_purchase_requests_updated_at_column();

-- Функция для генерации номера заявки
CREATE OR REPLACE FUNCTION generate_purchase_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Получаем следующий номер
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 'REQ-(\d+)') AS INTEGER)), 0) + 1
  INTO counter
  FROM purchase_requests
  WHERE request_number ~ '^REQ-\d+$';
  
  new_number := 'REQ-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE purchase_requests IS 'Заявки на закупку материалов';
COMMENT ON TABLE purchase_request_items IS 'Позиции заявок на закупку материалов';
COMMENT ON COLUMN purchase_requests.request_number IS 'Уникальный номер заявки на закупку';
COMMENT ON COLUMN purchase_requests.status IS 'Статус заявки: pending, approved, rejected, completed, cancelled';
COMMENT ON COLUMN purchase_requests.priority IS 'Приоритет заявки: low, normal, high, urgent';

