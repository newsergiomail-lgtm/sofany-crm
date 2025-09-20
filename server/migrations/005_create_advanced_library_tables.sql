-- =====================================================
-- РАСШИРЕННАЯ БИБЛИОТЕКА ДАННЫХ ДЛЯ МЯГКОЙ МЕБЕЛИ
-- =====================================================

-- 1. КАТЕГОРИИ ОПЕРАЦИЙ (расширенная)
CREATE TABLE IF NOT EXISTS operation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ОПЕРАЦИИ И ПРОЦЕССЫ (расширенная)
CREATE TABLE IF NOT EXISTS operations_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES operation_categories(id),
    department VARCHAR(100) NOT NULL,
    estimated_time_minutes INTEGER DEFAULT 0,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
    base_rate DECIMAL(10,2) DEFAULT 0,
    complexity_multiplier DECIMAL(3,2) DEFAULT 1.0,
    quality_multiplier DECIMAL(3,2) DEFAULT 1.0,
    required_skills TEXT[],
    materials_needed TEXT[],
    tools_required TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ДОЛЖНОСТИ И СТАВКИ
CREATE TABLE IF NOT EXISTS positions_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50) NOT NULL, -- junior, middle, senior, master
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    monthly_rate DECIMAL(10,2) DEFAULT 0,
    payment_type VARCHAR(20) DEFAULT 'hourly', -- hourly, monthly, piecework
    complexity_bonus DECIMAL(5,2) DEFAULT 0, -- надбавка за сложность %
    quality_bonus DECIMAL(5,2) DEFAULT 0, -- надбавка за качество %
    required_education TEXT,
    responsibilities TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. КАТЕГОРИИ МАТЕРИАЛОВ (расширенная)
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#8B4513',
    parent_id INTEGER REFERENCES material_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. МАТЕРИАЛЫ И КОМПОНЕНТЫ (расширенная)
CREATE TABLE IF NOT EXISTS materials_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES material_categories(id),
    unit VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) DEFAULT 0,
    current_price DECIMAL(10,2) DEFAULT 0,
    supplier_id INTEGER,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    specifications JSONB, -- технические характеристики
    quality_standards TEXT[],
    storage_requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. РАСЦЕНКИ И КОЭФФИЦИЕНТЫ
CREATE TABLE IF NOT EXISTS rates_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    rate_type VARCHAR(50) NOT NULL, -- hourly, piecework, percentage, fixed
    rate_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    position_id INTEGER REFERENCES positions_library(id),
    operation_id INTEGER REFERENCES operations_library(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. СПРАВОЧНЫЕ ДАННЫЕ (расширенная)
CREATE TABLE IF NOT EXISTS reference_data_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    formula TEXT, -- формула расчета
    dependencies TEXT[], -- зависимости от других значений
    is_calculated BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. НАСТРОЙКИ СИСТЕМЫ (расширенная)
CREATE TABLE IF NOT EXISTS system_settings_library (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json, array
    category VARCHAR(100) DEFAULT 'general',
    module VARCHAR(100) DEFAULT 'library',
    description TEXT,
    validation_rules JSONB,
    is_required BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. КОЭФФИЦИЕНТЫ И МУЛЬТИПЛИКАТОРЫ
CREATE TABLE IF NOT EXISTS coefficients_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    coefficient_value DECIMAL(8,4) NOT NULL,
    description TEXT,
    applies_to VARCHAR(100), -- operation, material, position, etc.
    condition_formula TEXT, -- условие применения
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. НОРМЫ ВРЕМЕНИ
CREATE TABLE IF NOT EXISTS time_norms_library (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER REFERENCES operations_library(id),
    position_id INTEGER REFERENCES positions_library(id),
    base_time_minutes INTEGER NOT NULL,
    complexity_multiplier DECIMAL(3,2) DEFAULT 1.0,
    quality_multiplier DECIMAL(3,2) DEFAULT 1.0,
    experience_multiplier DECIMAL(3,2) DEFAULT 1.0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ БЫСТРОДЕЙСТВИЯ
-- =====================================================

-- Индексы для поиска
CREATE INDEX IF NOT EXISTS idx_operations_library_name ON operations_library(name);
CREATE INDEX IF NOT EXISTS idx_operations_library_category ON operations_library(category_id);
CREATE INDEX IF NOT EXISTS idx_operations_library_department ON operations_library(department);
CREATE INDEX IF NOT EXISTS idx_operations_library_active ON operations_library(is_active);

CREATE INDEX IF NOT EXISTS idx_materials_library_name ON materials_library(name);
CREATE INDEX IF NOT EXISTS idx_materials_library_category ON materials_library(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_library_supplier ON materials_library(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_library_active ON materials_library(is_active);

CREATE INDEX IF NOT EXISTS idx_positions_library_name ON positions_library(name);
CREATE INDEX IF NOT EXISTS idx_positions_library_department ON positions_library(department);
CREATE INDEX IF NOT EXISTS idx_positions_library_skill ON positions_library(skill_level);
CREATE INDEX IF NOT EXISTS idx_positions_library_active ON positions_library(is_active);

CREATE INDEX IF NOT EXISTS idx_rates_library_category ON rates_library(category);
CREATE INDEX IF NOT EXISTS idx_rates_library_type ON rates_library(rate_type);
CREATE INDEX IF NOT EXISTS idx_rates_library_valid ON rates_library(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_rates_library_active ON rates_library(is_active);

CREATE INDEX IF NOT EXISTS idx_reference_data_category ON reference_data_library(category);
CREATE INDEX IF NOT EXISTS idx_reference_data_subcategory ON reference_data_library(subcategory);
CREATE INDEX IF NOT EXISTS idx_reference_data_active ON reference_data_library(is_active);

-- Составные индексы
CREATE INDEX IF NOT EXISTS idx_operations_library_category_dept ON operations_library(category_id, department);
CREATE INDEX IF NOT EXISTS idx_materials_library_category_supplier ON materials_library(category_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_positions_library_dept_skill ON positions_library(department, skill_level);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для всех таблиц
CREATE TRIGGER update_operation_categories_updated_at BEFORE UPDATE ON operation_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operations_library_updated_at BEFORE UPDATE ON operations_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_library_updated_at BEFORE UPDATE ON positions_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_categories_updated_at BEFORE UPDATE ON material_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_library_updated_at BEFORE UPDATE ON materials_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rates_library_updated_at BEFORE UPDATE ON rates_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reference_data_library_updated_at BEFORE UPDATE ON reference_data_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_library_updated_at BEFORE UPDATE ON system_settings_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coefficients_library_updated_at BEFORE UPDATE ON coefficients_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_norms_library_updated_at BEFORE UPDATE ON time_norms_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

