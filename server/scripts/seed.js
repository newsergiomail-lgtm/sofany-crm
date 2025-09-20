const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Заполнение базы данных тестовыми данными...');

    // Создаем пользователей
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const users = await db.query(`
      INSERT INTO users (email, password, name, role) VALUES 
      ('admin@sofany.com', $1, 'Администратор', 'admin'),
      ('manager@sofany.com', $1, 'Менеджер', 'manager'),
      ('worker@sofany.com', $1, 'Рабочий', 'worker')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, name, role
    `, [hashedPassword]);

    console.log('✅ Пользователи созданы');

    // Создаем категории материалов
    const categories = await db.query(`
      INSERT INTO material_categories (name, description) VALUES 
      ('Фанера', 'Фанера различных толщин и сортов'),
      ('ДВП', 'Древесно-волокнистые плиты'),
      ('ППУ', 'Пенополиуретан для наполнения'),
      ('Ткани', 'Обивочные ткани и материалы'),
      ('Фурнитура', 'Ручки, петли, крепеж'),
      ('Клей и герметики', 'Клеевые составы и герметики')
      RETURNING id, name
    `);

    console.log('✅ Категории материалов созданы');

    // Создаем материалы
    const materials = await db.query(`
      INSERT INTO materials (name, category_id, unit, current_stock, min_stock, price_per_unit, supplier, notes) VALUES 
      ('Фанера 18мм береза', 1, 'м²', 50, 10, 1200, 'ЛесТорг', 'Высокое качество'),
      ('Фанера 12мм хвойная', 1, 'м²', 30, 5, 800, 'ЛесТорг', 'Стандартная'),
      ('ДВП 3.2мм', 2, 'м²', 100, 20, 300, 'ПлитТорг', 'Для задних стенок'),
      ('ППУ плотность 25', 3, 'м³', 5, 1, 15000, 'ПеноМат', 'Для мягкой мебели'),
      ('Ткань велюр серая', 4, 'м', 200, 50, 800, 'ТекстильПро', 'Основная коллекция'),
      ('Ткань кожзам черная', 4, 'м', 150, 30, 1200, 'ТекстильПро', 'Премиум серия'),
      ('Ручки хром 128мм', 5, 'шт', 500, 100, 150, 'ФурнитураПлюс', 'Стандартные'),
      ('Петли накладные', 5, 'шт', 1000, 200, 80, 'ФурнитураПлюс', 'Для дверей'),
      ('Клей ПВА', 6, 'кг', 20, 5, 200, 'ХимТорг', 'Универсальный'),
      ('Герметик силиконовый', 6, 'шт', 50, 10, 300, 'ХимТорг', 'Белый')
      RETURNING id, name, current_stock, min_stock
    `);

    console.log('✅ Материалы созданы');

    // Создаем клиентов
    const customers = await db.query(`
      INSERT INTO customers (name, email, phone, company, address, notes, created_by) VALUES 
      ('Иванов Иван Иванович', 'ivanov@email.com', '+7-999-123-45-67', 'ООО МебельПро', 'г. Москва, ул. Ленина, 1', 'VIP клиент', 1),
      ('Петрова Анна Сергеевна', 'petrova@email.com', '+7-999-234-56-78', 'ИП Петрова', 'г. Москва, ул. Пушкина, 10', 'Частный заказчик', 1),
      ('Сидоров Петр Александрович', 'sidorov@email.com', '+7-999-345-67-89', 'ООО ДизайнСтудия', 'г. Москва, ул. Гагарина, 25', 'Дизайнерская студия', 2),
      ('Козлова Мария Владимировна', 'kozlova@email.com', '+7-999-456-78-90', '', 'г. Москва, ул. Мира, 5', 'Частный заказчик', 2),
      ('Волков Алексей Николаевич', 'volkov@email.com', '+7-999-567-89-01', 'ООО ОфисМебель', 'г. Москва, ул. Советская, 15', 'Корпоративный клиент', 1)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email
    `);

    console.log('✅ Клиенты созданы');

    // Создаем заказы
    const orders = await db.query(`
      INSERT INTO orders (order_number, customer_id, status, priority, total_amount, paid_amount, delivery_date, notes, created_by) VALUES 
      ('SOF-1703123456789', 1, 'in_production', 'high', 45000, 20000, '2024-01-15', 'Срочный заказ', 1),
      ('SOF-1703123456790', 2, 'ready', 'normal', 28000, 28000, '2024-01-10', 'Готов к отгрузке', 2),
      ('SOF-1703123456791', 3, 'new', 'normal', 65000, 0, '2024-01-20', 'Большой заказ', 1),
      ('SOF-1703123456792', 4, 'confirmed', 'low', 15000, 5000, '2024-01-25', 'Небольшой заказ', 2),
      ('SOF-1703123456793', 5, 'delivered', 'normal', 35000, 35000, '2024-01-05', 'Завершен', 1)
      RETURNING id, order_number, customer_id, status, total_amount
    `);

    console.log('✅ Заказы созданы');

    // Создаем позиции заказов
    await db.query(`
      INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price) VALUES 
      (1, 'Диван угловой', 'Диван угловой 3+2, ткань велюр', 1, 45000, 45000),
      (2, 'Кресло офисное', 'Кресло офисное с подлокотниками', 2, 14000, 28000),
      (3, 'Гарнитур спальный', 'Спальный гарнитур: кровать, тумбы, шкаф', 1, 65000, 65000),
      (4, 'Стол письменный', 'Стол письменный с ящиками', 1, 15000, 15000),
      (5, 'Стулья обеденные', 'Стулья обеденные, комплект 6 шт', 1, 35000, 35000)
    `);

    console.log('✅ Позиции заказов созданы');

    // Создаем историю статусов заказов
    await db.query(`
      INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES 
      (1, 'new', 'Заказ создан', 1),
      (1, 'confirmed', 'Заказ подтвержден', 1),
      (1, 'in_production', 'Заказ в производстве', 1),
      (2, 'new', 'Заказ создан', 2),
      (2, 'confirmed', 'Заказ подтвержден', 2),
      (2, 'in_production', 'Заказ в производстве', 2),
      (2, 'ready', 'Заказ готов', 2),
      (3, 'new', 'Заказ создан', 1),
      (4, 'new', 'Заказ создан', 2),
      (4, 'confirmed', 'Заказ подтвержден', 2),
      (5, 'new', 'Заказ создан', 1),
      (5, 'confirmed', 'Заказ подтвержден', 1),
      (5, 'in_production', 'Заказ в производстве', 1),
      (5, 'ready', 'Заказ готов', 1),
      (5, 'shipped', 'Заказ отправлен', 1),
      (5, 'delivered', 'Заказ доставлен', 1)
    `);

    console.log('✅ История статусов создана');

    // Создаем производственные операции
    await db.query(`
      INSERT INTO production_operations (order_id, operation_type, status, assigned_to, start_date, end_date, notes, created_by) VALUES 
      (1, 'purchase_and_produce', 'in_progress', 3, '2024-01-08 09:00:00', NULL, 'Закупка материалов и начало производства', 1),
      (2, 'produce', 'completed', 3, '2024-01-05 10:00:00', '2024-01-09 17:00:00', 'Производство завершено', 2),
      (3, 'purchase', 'pending', NULL, NULL, NULL, 'Ожидает закупки материалов', 1),
      (4, 'purchase', 'completed', 3, '2024-01-06 08:00:00', '2024-01-07 16:00:00', 'Материалы закуплены', 2),
      (5, 'purchase_and_produce', 'completed', 3, '2024-01-02 09:00:00', '2024-01-04 18:00:00', 'Заказ выполнен', 1)
    `);

    console.log('✅ Производственные операции созданы');

    // Создаем расход материалов
    await db.query(`
      INSERT INTO material_usage (order_id, material_id, quantity_used, unit_cost, total_cost, operation_id) VALUES 
      (1, 1, 2.5, 1200, 3000, 1),
      (1, 4, 0.8, 15000, 12000, 1),
      (1, 5, 15, 800, 12000, 1),
      (1, 7, 4, 150, 600, 1),
      (2, 1, 1.2, 1200, 1440, 2),
      (2, 5, 8, 800, 6400, 2),
      (2, 7, 2, 150, 300, 2),
      (5, 1, 1.8, 1200, 2160, 5),
      (5, 5, 12, 800, 9600, 5),
      (5, 7, 6, 150, 900, 5)
    `);

    console.log('✅ Расход материалов создан');

    // Создаем финансовые транзакции
    await db.query(`
      INSERT INTO financial_transactions (type, category, amount, description, order_id, created_by, transaction_date) VALUES 
      ('income', 'Продажа мебели', 20000, 'Предоплата за заказ SOF-1703123456789', 1, 1, '2024-01-08'),
      ('expense', 'Материалы', 15000, 'Закупка материалов для заказа SOF-1703123456789', 1, 1, '2024-01-08'),
      ('income', 'Продажа мебели', 28000, 'Оплата заказа SOF-1703123456790', 2, 2, '2024-01-09'),
      ('expense', 'Материалы', 8140, 'Закупка материалов для заказа SOF-1703123456790', 2, 2, '2024-01-05'),
      ('income', 'Продажа мебели', 5000, 'Предоплата за заказ SOF-1703123456792', 4, 2, '2024-01-06'),
      ('expense', 'Материалы', 3000, 'Закупка материалов для заказа SOF-1703123456792', 4, 2, '2024-01-07'),
      ('income', 'Продажа мебели', 35000, 'Оплата заказа SOF-1703123456793', 5, 1, '2024-01-05'),
      ('expense', 'Материалы', 12660, 'Закупка материалов для заказа SOF-1703123456793', 5, 1, '2024-01-02'),
      ('expense', 'Коммунальные услуги', 5000, 'Электричество за январь', NULL, 1, '2024-01-31'),
      ('expense', 'Аренда', 15000, 'Аренда помещения за январь', NULL, 1, '2024-01-31')
    `);

    console.log('✅ Финансовые транзакции созданы');

    // Создаем уведомления
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data) VALUES 
      (NULL, 'info', 'Новый заказ', 'Создан новый заказ SOF-1703123456789 от клиента Иванов Иван Иванович', '{"order_id": 1, "order_number": "SOF-1703123456789"}'),
      (NULL, 'warning', 'Низкие остатки', 'Материал "Фанера 12мм хвойная" заканчивается. Текущий остаток: 30, минимальный: 5', '{"material_name": "Фанера 12мм хвойная", "current_stock": 30, "min_stock": 5}'),
      (NULL, 'success', 'Заказ готов', 'Заказ SOF-1703123456790 готов к отгрузке', '{"order_id": 2, "order_number": "SOF-1703123456790"}'),
      (NULL, 'info', 'Изменение статуса', 'Заказ SOF-1703123456793 изменил статус на "Доставлен"', '{"order_id": 5, "order_number": "SOF-1703123456793"}')
    `);

    console.log('✅ Уведомления созданы');

    // Создаем настройки системы
    await db.query(`
      INSERT INTO system_settings (key, value, description) VALUES 
      ('company_name', 'Sofany', 'Название компании'),
      ('company_email', 'info@sofany.com', 'Email компании'),
      ('company_phone', '+7-495-123-45-67', 'Телефон компании'),
      ('default_currency', 'RUB', 'Валюта по умолчанию'),
      ('low_stock_threshold', '1.5', 'Коэффициент для предупреждения о низких остатках'),
      ('auto_notifications', 'true', 'Автоматические уведомления'),
      ('telegram_notifications', 'true', 'Уведомления в Telegram'),
      ('email_notifications', 'true', 'Уведомления по email')
    `);

    console.log('✅ Настройки системы созданы');

    console.log('🎉 Тестовые данные успешно загружены!');
    console.log('\n📋 Данные для входа:');
    console.log('Администратор: admin@sofany.com / admin123');
    console.log('Менеджер: manager@sofany.com / admin123');
    console.log('Рабочий: worker@sofany.com / admin123');

  } catch (error) {
    console.error('❌ Ошибка загрузки тестовых данных:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await seedData();
    console.log('✅ Заполнение завершено успешно!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Ошибка заполнения:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };























