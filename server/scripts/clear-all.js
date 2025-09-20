const db = require('../config/database');

const clearAllData = async () => {
  try {
    console.log('🔥 Полная очистка базы данных...');

    const tables = [
      'financial_transactions',
      'material_usage',
      'production_operations',
      'order_status_history',
      'order_items',
      'calculator_orders',
      'orders',
      'notifications',
      'system_settings',
      'materials',
      'material_categories',
      'customers',
      'users'
    ];

    for (const table of tables.reverse()) { // Обратный порядок для соблюдения внешних ключей
      console.log(`🗑️ Очистка таблицы ${table}...`);
      await db.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }

    console.log('✅ Все таблицы успешно очищены!');

  } catch (error) {
    console.error('❌ Ошибка при полной очистке данных:', error);
    throw error;
  }
};

const runClearAll = async () => {
  try {
    await clearAllData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

if (require.main === module) {
  runClearAll();
}



