const db = require('../config/database');

const createPurchaseTables = async () => {
  try {
    console.log('🔄 Создание таблиц для системы закупок...');

    // Создание таблицы списков закупок
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchase_lists (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        total_cost DECIMAL(12,2) DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    console.log('✅ Таблица purchase_lists создана');

    // Создание таблицы позиций списка закупок
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchase_list_items (
        id SERIAL PRIMARY KEY,
        purchase_list_id INTEGER REFERENCES purchase_lists(id) ON DELETE CASCADE,
        material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
        material_name VARCHAR(255) NOT NULL,
        required_quantity DECIMAL(10,2) NOT NULL,
        available_quantity DECIMAL(10,2) DEFAULT 0,
        missing_quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        unit_price DECIMAL(10,2) DEFAULT 0,
        total_price DECIMAL(12,2) DEFAULT 0,
        supplier VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Таблица purchase_list_items создана');

    // Создание таблицы для хранения извлеченных материалов из заказов
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_materials (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        material_name VARCHAR(255) NOT NULL,
        required_quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        estimated_price DECIMAL(10,2) DEFAULT 0,
        source VARCHAR(50) DEFAULT 'calculator' CHECK (source IN ('calculator', 'manual', 'bom')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Таблица order_materials создана');

    // Создание индексов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_lists_order_id ON purchase_lists(order_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_lists_status ON purchase_lists(status)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_list_items_purchase_list_id ON purchase_list_items(purchase_list_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_list_items_material_id ON purchase_list_items(material_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_order_materials_order_id ON order_materials(order_id)
    `);

    console.log('✅ Индексы созданы');
    console.log('🎉 Все таблицы для системы закупок успешно созданы!');

  } catch (error) {
    console.error('❌ Ошибка при создании таблиц:', error);
    throw error;
  }
};

// Запуск скрипта
createPurchaseTables()
  .then(() => {
    console.log('✅ Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });






