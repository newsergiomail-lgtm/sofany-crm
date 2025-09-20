-- Создание таблицы цехов
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы должностей
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('piecework', 'hourly', 'salary', 'salary_bonus')),
    base_rate DECIMAL(10,2) DEFAULT 0, -- базовая ставка (за единицу, за час, оклад)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE, -- табельный номер
    phone VARCHAR(20),
    email VARCHAR(255),
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы операций/задач
CREATE TABLE IF NOT EXISTS operations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL, -- единица измерения (шт, м, м², операция)
    piece_rate DECIMAL(10,2) NOT NULL, -- расценка за единицу
    time_norm DECIMAL(8,2), -- норма времени в часах
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы выполненных работ
CREATE TABLE IF NOT EXISTS work_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    quantity DECIMAL(10,2) NOT NULL,
    piece_rate DECIMAL(10,2) NOT NULL, -- расценка на момент выполнения
    total_amount DECIMAL(10,2) NOT NULL, -- quantity * piece_rate
    work_date DATE NOT NULL,
    shift VARCHAR(20), -- смена (день/ночь)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL
);

-- Создание таблицы табеля рабочего времени
CREATE TABLE IF NOT EXISTS timesheets (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    hours_overtime DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'sick', 'vacation', 'day_off')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    UNIQUE(employee_id, work_date)
);

-- Создание таблицы премий и штрафов
CREATE TABLE IF NOT EXISTS bonuses_penalties (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bonus', 'penalty')),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL
);

-- Создание таблицы расчетных периодов
CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    total_payroll DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL
);

-- Создание таблицы расчетов зарплаты
CREATE TABLE IF NOT EXISTS payroll_calculations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    period_id INTEGER REFERENCES payroll_periods(id) ON DELETE CASCADE,
    piecework_amount DECIMAL(10,2) DEFAULT 0, -- сдельная часть
    hourly_amount DECIMAL(10,2) DEFAULT 0, -- почасовая часть
    salary_amount DECIMAL(10,2) DEFAULT 0, -- окладная часть
    bonus_amount DECIMAL(10,2) DEFAULT 0, -- премии
    penalty_amount DECIMAL(10,2) DEFAULT 0, -- штрафы
    total_amount DECIMAL(10,2) NOT NULL, -- итого к выплате
    hours_worked DECIMAL(6,2) DEFAULT 0, -- отработано часов
    operations_count INTEGER DEFAULT 0, -- количество операций
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, period_id)
);

-- Вставка базовых цехов
INSERT INTO departments (name, code, description) VALUES
('КБ', 'KB', 'Конструкторское бюро'),
('Столярный цех', 'STOL', 'Обработка дерева, распил, кромление'),
('Обивочный цех', 'OBIV', 'Обивка мебели, работа с тканями'),
('Швейный цех', 'SHVEY', 'Пошив чехлов, подушек'),
('Формовочный цех', 'FORM', 'Формовка ППУ, набивка'),
('Разнорабочий', 'RAZNO', 'Помощники, грузчики, подсобники')
ON CONFLICT (name) DO NOTHING;

-- Вставка базовых должностей
INSERT INTO positions (name, department_id, payment_type, base_rate) VALUES
-- Производственные рабочие (сдельная оплата)
('Столяр', 2, 'piecework', 0),
('Кромщик', 2, 'piecework', 0),
('Сборщик', 2, 'piecework', 0),
('Обивщик', 3, 'piecework', 0),
('Швея', 4, 'piecework', 0),
('Формовщик ППУ', 5, 'piecework', 0),

-- Помощники (почасовая оплата)
('Помощник столяра', 2, 'hourly', 300),
('Грузчик', 6, 'hourly', 250),
('Подсобный рабочий', 6, 'hourly', 280),

-- Мастера (оклад + процент)
('Мастер столярного цеха', 2, 'salary_bonus', 50000),
('Мастер обивки', 3, 'salary_bonus', 45000),
('Технолог', 1, 'salary_bonus', 60000),

-- Менеджеры (оклад)
('Менеджер производства', 1, 'salary', 70000),
('Дизайнер', 1, 'salary', 55000)
ON CONFLICT DO NOTHING;

-- Вставка базовых операций
INSERT INTO operations (name, code, department_id, unit, piece_rate, time_norm) VALUES
-- Столярный цех
('Распил ЛДСП', 'RASPIL_LDSP', 2, 'м.пог.', 15.00, 0.1),
('Кромление', 'KROMLENIE', 2, 'м.пог.', 8.00, 0.05),
('Сверление отверстий', 'SVERLENIE', 2, 'отверстие', 2.00, 0.02),
('Сборка тумбы', 'SBORKA_TUMBA', 2, 'шт', 500.00, 2.0),
('Сборка стола', 'SBORKA_STOL', 2, 'шт', 800.00, 3.0),

-- Обивочный цех
('Раскрой ткани', 'RAZKROY_TKAN', 3, 'м²', 25.00, 0.2),
('Обивка спинки', 'OBIVKA_SPINKA', 3, 'шт', 300.00, 1.5),
('Обивка сиденья', 'OBIVKA_SIDENIE', 3, 'шт', 250.00, 1.2),
('Сборка дивана', 'SBORKA_DIVAN', 3, 'шт', 1500.00, 4.0),

-- Швейный цех
('Пошив чехла', 'POSHIV_CHEHLA', 4, 'шт', 200.00, 1.0),
('Пошив подушки', 'POSHIV_PODUSHKA', 4, 'шт', 150.00, 0.8),

-- Формовочный цех
('Формовка ППУ', 'FORMOVKA_PPU', 5, 'м³', 800.00, 0.5),
('Набивка подушки', 'NABIVKA_PODUSHKA', 5, 'шт', 100.00, 0.3)
ON CONFLICT (code) DO NOTHING;

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_work_records_employee_id ON work_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_records_work_date ON work_records(work_date);
CREATE INDEX IF NOT EXISTS idx_work_records_order_id ON work_records(order_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_payroll_calculations_employee_id ON payroll_calculations(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calculations_period_id ON payroll_calculations(period_id);

-- Создание триггеров для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();







