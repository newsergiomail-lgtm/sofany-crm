-- Создание системы управления производством через QR-коды
-- Дата создания: 2025-09-14

-- 1. Таблица этапов производства
CREATE TABLE IF NOT EXISTS production_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  order_index INTEGER NOT NULL UNIQUE,
  description TEXT,
  can_work_parallel BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка этапов производства
INSERT INTO production_stages (name, order_index, description, can_work_parallel) VALUES
('Конструкторское Бюро', 1, 'Разработка чертежей и конструкций', false),
('Столярный Цех', 2, 'Изготовление каркасов и деревянных элементов', false),
('Формовка ППУ', 3, 'Формовка пенополиуретана', false),
('Швейный Цех', 4, 'Пошив чехлов и текстильных элементов', true),
('Обивочный Цех', 5, 'Обивка мебели', false),
('Сборка и упаковка', 6, 'Финальная сборка и упаковка', false),
('Отгрузка', 7, 'Подготовка к отправке клиенту', false)
ON CONFLICT (name) DO NOTHING;

-- 2. Таблица ролей пользователей
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '{}',
  can_scan BOOLEAN DEFAULT false,
  can_confirm BOOLEAN DEFAULT false,
  can_generate_qr BOOLEAN DEFAULT false,
  can_manage_workers BOOLEAN DEFAULT false,
  can_return_orders BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка ролей
INSERT INTO user_roles (name, display_name, permissions, can_scan, can_confirm, can_generate_qr, can_manage_workers, can_return_orders) VALUES
('manager', 'Менеджер', '{"view_all": true, "edit_orders": true}', true, true, true, true, true),
('production_chief', 'Начальник производства', '{"view_production": true, "manage_stages": true}', true, true, true, true, true),
('master', 'Мастер цеха', '{"view_stage": true, "manage_workers": true}', true, true, false, true, false),
('worker', 'Работник', '{"view_own_work": true}', true, true, false, false, false),
('quality_controller', 'Контролер качества', '{"view_quality": true, "return_orders": true}', true, false, false, false, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Обновление таблицы пользователей (добавление роли)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES user_roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stage_id INTEGER REFERENCES production_stages(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Таблица QR-кодов заказов
CREATE TABLE IF NOT EXISTS order_qr_codes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  current_stage_id INTEGER NOT NULL REFERENCES production_stages(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для QR-кодов
CREATE INDEX IF NOT EXISTS idx_order_qr_codes_order_id ON order_qr_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_qr_codes_qr_code ON order_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_order_qr_codes_stage_id ON order_qr_codes(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_order_qr_codes_expires_at ON order_qr_codes(expires_at);

-- 5. Таблица перемещений заказов между этапами
CREATE TABLE IF NOT EXISTS order_transfers (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_stage_id INTEGER REFERENCES production_stages(id),
  to_stage_id INTEGER NOT NULL REFERENCES production_stages(id),
  scanned_by INTEGER NOT NULL REFERENCES users(id),
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'rework', 'defect')),
  notes TEXT,
  transfer_type VARCHAR(20) DEFAULT 'normal' CHECK (transfer_type IN ('normal', 'rework', 'defect', 'parallel')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для перемещений
CREATE INDEX IF NOT EXISTS idx_order_transfers_order_id ON order_transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_order_transfers_from_stage ON order_transfers(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_order_transfers_to_stage ON order_transfers(to_stage_id);
CREATE INDEX IF NOT EXISTS idx_order_transfers_scanned_by ON order_transfers(scanned_by);
CREATE INDEX IF NOT EXISTS idx_order_transfers_status ON order_transfers(status);

-- 6. Таблица возвратов заказов (доработка/брак)
CREATE TABLE IF NOT EXISTS order_returns (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_stage_id INTEGER NOT NULL REFERENCES production_stages(id),
  to_stage_id INTEGER NOT NULL REFERENCES production_stages(id),
  return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('rework', 'defect')),
  reason TEXT NOT NULL,
  returned_by INTEGER NOT NULL REFERENCES users(id),
  returned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id)
);

-- Индексы для возвратов
CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_from_stage ON order_returns(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_to_stage ON order_returns(to_stage_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_type ON order_returns(return_type);
CREATE INDEX IF NOT EXISTS idx_order_returns_resolved ON order_returns(is_resolved);

-- 7. Таблица фиксации времени работы
CREATE TABLE IF NOT EXISTS work_time_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL REFERENCES production_stages(id),
  worker_id INTEGER NOT NULL REFERENCES users(id),
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  work_duration INTEGER, -- в минутах
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  total_payment DECIMAL(10,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для времени работы
CREATE INDEX IF NOT EXISTS idx_work_time_logs_order_id ON work_time_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_stage_id ON work_time_logs(stage_id);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_worker_id ON work_time_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_started_at ON work_time_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_completed ON work_time_logs(is_completed);

-- 8. Таблица уведомлений
CREATE TABLE IF NOT EXISTS production_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_production_notifications_user_id ON production_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_production_notifications_order_id ON production_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_production_notifications_type ON production_notifications(type);
CREATE INDEX IF NOT EXISTS idx_production_notifications_read ON production_notifications(is_read);

-- 9. Обновление таблицы заказов (добавление полей для производства)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_stage_id INTEGER REFERENCES production_stages(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_status VARCHAR(20) DEFAULT 'pending' CHECK (production_status IN ('pending', 'in_progress', 'ready', 'completed', 'on_hold'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code_id INTEGER REFERENCES order_qr_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMP;

-- Индексы для заказов
CREATE INDEX IF NOT EXISTS idx_orders_current_stage ON orders(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON orders(production_status);
CREATE INDEX IF NOT EXISTS idx_orders_qr_code ON orders(qr_code_id);

-- 10. Функция для обновления времени изменения
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления времени
CREATE TRIGGER update_production_stages_updated_at BEFORE UPDATE ON production_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_qr_codes_updated_at BEFORE UPDATE ON order_qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Функция для автоматического расчета времени работы
CREATE OR REPLACE FUNCTION calculate_work_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.work_duration = EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) / 60;
        NEW.is_completed = true;
        
        -- Расчет оплаты если указана ставка
        IF NEW.hourly_rate > 0 THEN
            NEW.total_payment = (NEW.work_duration / 60.0) * NEW.hourly_rate;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для расчета времени работы
CREATE TRIGGER calculate_work_duration_trigger 
    BEFORE INSERT OR UPDATE ON work_time_logs 
    FOR EACH ROW EXECUTE FUNCTION calculate_work_duration();

-- 12. Функция для создания уведомлений
CREATE OR REPLACE FUNCTION create_production_notification(
    p_user_id INTEGER,
    p_order_id INTEGER,
    p_type VARCHAR(50),
    p_title VARCHAR(200),
    p_message TEXT
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO production_notifications (user_id, order_id, type, title, message)
    VALUES (p_user_id, p_order_id, p_type, p_title, p_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ language 'plpgsql';

-- 13. Функция для проверки возможности перехода между этапами
CREATE OR REPLACE FUNCTION can_transfer_to_stage(
    p_order_id INTEGER,
    p_from_stage_id INTEGER,
    p_to_stage_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    from_stage_order INTEGER;
    to_stage_order INTEGER;
    current_stage_order INTEGER;
BEGIN
    -- Получаем порядковые номера этапов
    SELECT order_index INTO from_stage_order FROM production_stages WHERE id = p_from_stage_id;
    SELECT order_index INTO to_stage_order FROM production_stages WHERE id = p_to_stage_id;
    
    -- Получаем текущий этап заказа
    SELECT current_stage_id INTO current_stage_order FROM orders WHERE id = p_order_id;
    SELECT order_index INTO current_stage_order FROM production_stages WHERE id = current_stage_order;
    
    -- Проверяем возможность перехода
    -- Можно перейти на следующий этап, на предыдущий (для доработки) или на параллельный
    RETURN (to_stage_order = current_stage_order + 1) OR 
           (to_stage_order < current_stage_order) OR
           (to_stage_order = current_stage_order); -- для параллельной работы
END;
$$ language 'plpgsql';

-- 14. Создание представления для статистики производства
CREATE OR REPLACE VIEW production_stats AS
SELECT 
    ps.name as stage_name,
    ps.order_index,
    COUNT(o.id) as orders_count,
    COUNT(CASE WHEN o.production_status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN o.production_status = 'ready' THEN 1 END) as ready,
    COUNT(CASE WHEN o.production_status = 'completed' THEN 1 END) as completed,
    AVG(EXTRACT(EPOCH FROM (o.production_completed_at - o.production_started_at)) / 3600) as avg_hours
FROM production_stages ps
LEFT JOIN orders o ON ps.id = o.current_stage_id
WHERE ps.is_active = true
GROUP BY ps.id, ps.name, ps.order_index
ORDER BY ps.order_index;

-- 15. Создание представления для отчетов по сотрудникам
CREATE OR REPLACE VIEW worker_reports AS
SELECT 
    u.id as worker_id,
    u.name as worker_name,
    ps.name as stage_name,
    COUNT(wtl.id) as tasks_count,
    SUM(wtl.work_duration) as total_minutes,
    SUM(wtl.total_payment) as total_payment,
    AVG(wtl.work_duration) as avg_task_duration,
    COUNT(CASE WHEN wtl.is_completed = true THEN 1 END) as completed_tasks
FROM users u
JOIN work_time_logs wtl ON u.id = wtl.worker_id
JOIN production_stages ps ON wtl.stage_id = ps.id
WHERE u.is_active = true
GROUP BY u.id, u.name, ps.id, ps.name
ORDER BY u.name, ps.order_index;

COMMENT ON TABLE production_stages IS 'Этапы производства мебели';
COMMENT ON TABLE user_roles IS 'Роли пользователей в системе производства';
COMMENT ON TABLE order_qr_codes IS 'QR-коды для отслеживания заказов';
COMMENT ON TABLE order_transfers IS 'Перемещения заказов между этапами';
COMMENT ON TABLE order_returns IS 'Возвраты заказов на доработку или брак';
COMMENT ON TABLE work_time_logs IS 'Логи времени работы сотрудников';
COMMENT ON TABLE production_notifications IS 'Уведомления системы производства';

