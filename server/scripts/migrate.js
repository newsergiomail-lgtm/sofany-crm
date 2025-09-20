const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const createTables = async () => {
  try {
    console.log('🔄 Создание таблиц базы данных...');

    // Пользователи и роли
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'manager',
        avatar VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Клиенты
    await db.query(`DROP TABLE IF EXISTS customers CASCADE;`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Категории материалов
    await db.query(`
      CREATE TABLE IF NOT EXISTS material_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Материалы
    await db.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES material_categories(id),
        unit VARCHAR(50) NOT NULL,
        current_stock DECIMAL(10,2) DEFAULT 0,
        min_stock DECIMAL(10,2) DEFAULT 0,
        price_per_unit DECIMAL(10,2) NOT NULL,
        supplier VARCHAR(255),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Заказы
    await db.query(`DROP TABLE IF EXISTS orders CASCADE;`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        product_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'new',
        priority VARCHAR(20) DEFAULT 'normal',
        total_amount DECIMAL(12,2) DEFAULT 0,
        paid_amount DECIMAL(12,2) DEFAULT 0,
        delivery_date DATE,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        project_description TEXT,
        delivery_address TEXT,
        has_elevator BOOLEAN,
        floor VARCHAR(50),
        delivery_notes TEXT,
        calculator_data JSONB
      )
    `);

    // Позиции заказа
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        materials_cost DECIMAL(12,2) DEFAULT 0,
        labor_cost DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Статусы заказов (таймлайн)
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        comment TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Производственные операции
    await db.query(`
      CREATE TABLE IF NOT EXISTS production_operations (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        operation_type VARCHAR(50) NOT NULL,
        production_stage VARCHAR(50) DEFAULT 'КБ',
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to INTEGER REFERENCES users(id),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Расход материалов
    await db.query(`
      CREATE TABLE IF NOT EXISTS material_usage (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        material_id INTEGER REFERENCES materials(id),
        quantity_used DECIMAL(10,2) NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(12,2) NOT NULL,
        operation_id INTEGER REFERENCES production_operations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Финансовые операции
    await db.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        order_id INTEGER REFERENCES orders(id),
        created_by INTEGER REFERENCES users(id),
        transaction_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Уведомления
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Настройки системы
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Заказы из калькулятора
    await db.query(`
      CREATE TABLE IF NOT EXISTS calculator_orders (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        calculator_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Индексы для оптимизации
    await db.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_material_usage_order_id ON material_usage(order_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_calculator_orders_order_id ON calculator_orders(order_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_calculator_orders_created_at ON calculator_orders(created_at)');

    // Добавляем поле production_stage если его нет
    await db.query(`
      ALTER TABLE production_operations 
      ADD COLUMN IF NOT EXISTS production_stage VARCHAR(50) DEFAULT 'КБ'
    `);

    // Добавляем колонку created_by если её нет
    await db.query(`
      ALTER TABLE production_operations 
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
    `);

    console.log('✅ Таблицы созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    await createTables();
    console.log('🎉 Миграции выполнены успешно!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Ошибка выполнения миграций:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { createTables };
