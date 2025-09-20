const db = require('../config/database');

const clearOrdersData = async () => {
  try {
    console.log('🗑️ Очистка данных о заказах...');

    await db.query('DELETE FROM financial_transactions WHERE order_id IS NOT NULL');
    await db.query('DELETE FROM material_usage');
    await db.query('DELETE FROM production_operations');
    await db.query('DELETE FROM order_status_history');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM calculator_orders');
    await db.query('DELETE FROM orders');

    console.log('✅ Данные о заказах успешно удалены!');

  } catch (error) {
    console.error('❌ Ошибка при очистке данных:', error);
    throw error;
  }
};

const runClear = async () => {
  try {
    await clearOrdersData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

if (require.main === module) {
  runClear();
}
