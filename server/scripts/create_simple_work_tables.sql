-- Удаляем старые таблицы если есть
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS work_log CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. ОПЕРАЦИИ (справочник)
CREATE TABLE operations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  department VARCHAR(100) NOT NULL,
  time_norm_minutes INTEGER DEFAULT 0, -- норма времени в минутах
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. СОТРУДНИКИ (упрощено)
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. РАБОТЫ (главная таблица с учетом времени)
CREATE TABLE work_log (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  operation_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER, -- длительность в минутах
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operation_id) REFERENCES operations(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 4. ЗАРПЛАТА (автоматический расчет)
CREATE TABLE payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  total_amount DECIMAL(10,2) NOT NULL,
  work_count INTEGER NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0, -- общее количество часов
  status VARCHAR(20) DEFAULT 'calculated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Заполняем тестовыми данными
-- Операции
INSERT INTO operations (name, price_per_unit, department, time_norm_minutes) VALUES
('Распил ЛДСП', 500.00, 'Столярный цех', 30),
('Кромление', 300.00, 'Столярный цех', 15),
('Сборка тумбы', 2000.00, 'Столярный цех', 120),
('Обивка сиденья', 800.00, 'Обивочный цех', 60),
('Пошив чехлов', 1200.00, 'Швейный цех', 90),
('Формовка деталей', 600.00, 'Формовочный цех', 45),
('Упаковка', 200.00, 'Разнорабочий', 10);

-- Сотрудники
INSERT INTO employees (first_name, last_name, department, position) VALUES
('Петр', 'Иванов', 'Столярный цех', 'Столяр'),
('Анна', 'Петрова', 'Столярный цех', 'Столяр'),
('Михаил', 'Сидоров', 'Обивочный цех', 'Обивщик'),
('Елена', 'Козлова', 'Швейный цех', 'Швея'),
('Алексей', 'Морозов', 'Формовочный цех', 'Формовщик'),
('Иван', 'Волков', 'Разнорабочий', 'Грузчик');

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_work_log_employee_id ON work_log(employee_id);
CREATE INDEX idx_work_log_operation_id ON work_log(operation_id);
CREATE INDEX idx_work_log_work_date ON work_log(work_date);
CREATE INDEX idx_payroll_employee_month ON payroll(employee_id, month);







