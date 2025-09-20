const db = require('../config/database');

const seedDemoData = async () => {
  try {
    console.log('🌱 Заполнение базы данных детализированными демо-заказами...');

    const customers = await db.query("SELECT id, name FROM customers");
    if (customers.rows.length < 5) {
      throw new Error('Недостаточно клиентов для создания заказов. Запустите сначала основной `seed` скрипт.');
    }
    const users = await db.query("SELECT id FROM users");
    if (users.rows.length < 2) {
      throw new Error('Недостаточно пользователей для создания заказов. Запустите сначала основной `seed` скрипт.');
    }
    
    const customerMap = new Map(customers.rows.map(c => [c.id, c.name]));
    const userIds = users.rows.map(u => u.id);

    const ordersData = [
      { order_number: 'SOF-0001', customer_id: customers.rows[0].id, status: 'in_production', priority: 'high', total_amount: 125000, paid_amount: 60000, delivery_date: '2025-10-15', created_by: userIds[0], product_name: 'Угловой диван "Атлант"', product_desc: 'Габариты 280х160 см. Велюр "Enigma 15" (темно-серый), механизм "Дельфин". Подушки в комплекте.', notes: 'Клиент просит ускорить сборку. Готов доплатить. Связаться 10.10.2025.', production_stage: 'Столярный цех', materials_cost: 45000, labor_cost: 25000, project_description: 'Большой угловой диван для гостиной. Современный дизайн, качественные материалы.', delivery_address: 'г. Москва, ул. Тверская, д. 10, кв. 5', has_elevator: true, floor: '3', delivery_notes: 'Позвонить за час до доставки.' },
      { order_number: 'SOF-0002', customer_id: customers.rows[1].id, status: 'in_production', priority: 'medium', total_amount: 48000, paid_amount: 20000, delivery_date: '2025-10-20', created_by: userIds[1], product_name: 'Кресло-кровать "Лагуна"', product_desc: 'Рогожка "Malmo 23" (бежевый), выкатной механизм. Ширина спального места 90 см.', notes: 'Звонок от 05.09: клиент просил уточнить возможность изменения ширины подлокотников до 15 см. Ждем чертеж от КБ.', production_stage: 'КБ', materials_cost: 18000, labor_cost: 12000, project_description: 'Компактное кресло-кровать для детской комнаты. Обивка легко чистится.', delivery_address: 'г. Санкт-Петербург, Невский пр-т, д. 25, кв. 12', has_elevator: false, floor: '4', delivery_notes: 'Подъем по лестнице, требуется 2 грузчика.' },
      { order_number: 'SOF-0003', customer_id: customers.rows[2].id, status: 'in_production', priority: 'high', total_amount: 210000, paid_amount: 100000, delivery_date: '2025-11-01', created_by: userIds[0], product_name: 'Модульный диван "Орион"', product_desc: 'Эко-кожа "Terra 115" (коричневая), 5 модулей.', notes: 'Заказ от дизайн-студии. Особое внимание на качество швов.', production_stage: 'Формовка', materials_cost: 80000, labor_cost: 50000, project_description: 'Премиальный модульный диван для загородного дома. Конфигурация из 5 независимых модулей.', delivery_address: 'г. Сочи, ул. Морская, д. 1', has_elevator: true, floor: '1', delivery_notes: 'Доставка до ворот. Пронос по участку силами заказчика.' },
      { order_number: 'SOF-0004', customer_id: customers.rows[3].id, status: 'in_production', priority: 'low', total_amount: 15000, paid_amount: 7000, delivery_date: '2025-09-30', created_by: userIds[1], product_name: 'Пуф "Велюр"', product_desc: 'Бархат "Velvet Lux 24" (изумрудный), с ящиком для хранения.', notes: 'Стандартное изделие, без изменений.', production_stage: 'Швейный цех', materials_cost: 5000, labor_cost: 4000, project_description: 'Элегантный пуф с внутренним ящиком для хранения. Ножки из массива бука.', delivery_address: 'г. Казань, ул. Баумана, д. 50, кв. 8', has_elevator: true, floor: '2', delivery_notes: '' },
      { order_number: 'SOF-0005', customer_id: customers.rows[4].id, status: 'in_production', priority: 'medium', total_amount: 55000, paid_amount: 25000, delivery_date: '2025-10-25', created_by: userIds[0], product_name: 'Диван-книжка "Классика"', product_desc: 'Жаккард "Versal 03", механизм "клик-кляк".', notes: 'Проверить работу механизма "клик-кляк" перед отгрузкой.', production_stage: 'Швейный цех', materials_cost: 22000, labor_cost: 15000, project_description: 'Классическая модель дивана-книжки с ящиком для белья. Деревянные ножки цвета "венге".', delivery_address: 'г. Екатеринбург, ул. Малышева, д. 70, кв. 34', has_elevator: false, floor: '5', delivery_notes: 'Старый диван нужно будет вынести. Предупредить грузчиков.' },
      { order_number: 'SOF-0006', customer_id: customers.rows[0].id, status: 'in_production', priority: 'medium', total_amount: 32000, paid_amount: 15000, delivery_date: '2025-10-10', created_by: userIds[1], product_name: 'Кресло "Эго"', product_desc: 'Натуральная кожа "Dakota", цвет "Коньяк", поворотный механизм.', notes: 'Кожа специальной выделки, обращаться аккуратно.', production_stage: 'Обивка', materials_cost: 15000, labor_cost: 10000, project_description: 'Уютное кресло для кабинета с поворотным механизмом. Натуральная кожа.', delivery_address: 'г. Москва, ул. Тверская, д. 10, кв. 5', has_elevator: true, floor: '3', delivery_notes: 'Доставить вместе с заказом SOF-720101.' },
      { order_number: 'SOF-0007', customer_id: customers.rows[1].id, status: 'in_production', priority: 'high', total_amount: 72000, paid_amount: 35000, delivery_date: '2025-11-05', created_by: userIds[0], product_name: 'Софа "Элегант"', product_desc: 'Шенилл "Verona 12", механизм "французская раскладушка".', notes: 'Срочный заказ для фотосессии. Доставка строго до 12:00.', production_stage: 'Сборка и упаковка', materials_cost: 30000, labor_cost: 20000, project_description: 'Небольшая софа в классическом стиле. Идеально для небольших пространств.', delivery_address: 'г. Москва, Фотостудия "Лофт", Берсеневская наб., 6', has_elevator: true, floor: '2', delivery_notes: 'Строго до 12:00. Контактное лицо - Мария.' },
      { order_number: 'SOF-0008', customer_id: customers.rows[2].id, status: 'in_production', priority: 'low', total_amount: 22000, paid_amount: 10000, delivery_date: '2025-10-01', created_by: userIds[1], product_name: 'Банкетка "Ренессанс"', product_desc: 'Каретная стяжка, велюр "Amelia 05", массив дуба, цвет "Венге".', notes: 'Ножки покрыть матовым лаком.', production_stage: 'Сборка и упаковка', materials_cost: 9000, labor_cost: 7000, project_description: 'Банкетка для прихожей с каретной стяжкой. Ручная работа.', delivery_address: 'г. Сочи, ул. Морская, д. 1', has_elevator: true, floor: '1', delivery_notes: 'Доставить вместе с заказом SOF-720103.' },
      { order_number: 'SOF-0009', customer_id: customers.rows[3].id, status: 'shipped', priority: 'medium', total_amount: 41000, paid_amount: 41000, delivery_date: '2025-10-18', created_by: userIds[0], product_name: 'Детский диван "Малютка"', product_desc: 'Микрофибра "Happy kids", механизм "аккордеон".', notes: 'Заказ полностью оплачен. Доставка согласована на вечер.', production_stage: 'Отгружен', materials_cost: 17000, labor_cost: 11000, project_description: 'Яркий и безопасный диван для детской. Гипоаллергенный наполнитель.', delivery_address: 'г. Казань, ул. Баумана, д. 50, кв. 8', has_elevator: true, floor: '2', delivery_notes: 'Доставка после 19:00.' },
      { order_number: 'SOF-0010', customer_id: customers.rows[4].id, status: 'shipped', priority: 'high', total_amount: 89000, paid_amount: 89000, delivery_date: '2025-10-12', created_by: userIds[1], product_name: 'Офисный диван "Статус"', product_desc: 'Черная эко-кожа "Oregon", хромированные ножки, 3-х местный.', notes: 'Заказ для офиса Газпром. Требуются все закрывающие документы.', production_stage: 'Отгружен', materials_cost: 35000, labor_cost: 25000, project_description: 'Строгий и стильный диван для приемной. Рассчитан на высокую нагрузку.', delivery_address: 'г. Москва, Бизнес-Центр "Москва-Сити", Башня Федерация', has_elevator: true, floor: '45', delivery_notes: 'Требуется пропуск. Заказать заранее.' },
      { order_number: 'SOF-0011', customer_id: customers.rows[0].id, status: 'new', priority: 'medium', total_amount: 67000, paid_amount: 30000, delivery_date: '2025-11-15', created_by: userIds[0], product_name: 'Диван "Монако"', product_desc: 'Ткань велюр "Monolit 37", зеленый. Механизм "Еврокнижка".', notes: 'Клиент просит сделать подушки в той же ткани. Уточнить размеры подушек.', production_stage: 'Новый', materials_cost: 28000, labor_cost: 18000, project_description: 'Современный диван в скандинавском стиле. Яркий акцент для интерьера.', delivery_address: 'г. Новосибирск, ул. Красный проспект, д. 100, кв. 20', has_elevator: true, floor: '7', delivery_notes: 'Код домофона 2021.' },
      { order_number: 'SOF-0012', customer_id: customers.rows[1].id, status: 'completed', priority: 'low', total_amount: 18000, paid_amount: 18000, delivery_date: '2025-09-25', created_by: userIds[1], product_name: 'Кресло-мешок "Груша"', product_desc: 'Ткань "Оксфорд", цвет синий. Наполнитель - гранулы.', notes: 'Доставка самовывозом. Клиент заберет в субботу.', production_stage: 'Выполнен', materials_cost: 7000, labor_cost: 5000, project_description: 'Удобное и легкое кресло-мешок для зоны отдыха.', delivery_address: 'Самовывоз со склада', has_elevator: false, floor: '1', delivery_notes: 'Склад №3' }
    ];

    for (const order of ordersData) {
      const { product_desc, production_stage, materials_cost, labor_cost, ...orderData } = order;
      
      const res = await db.query(
        'INSERT INTO orders (order_number, customer_id, status, priority, total_amount, paid_amount, delivery_date, notes, created_by, product_name, project_description, delivery_address, has_elevator, floor, delivery_notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (order_number) DO UPDATE SET status = $3, priority = $4, total_amount = $5, paid_amount = $6, delivery_date = $7, notes = $8, updated_at = CURRENT_TIMESTAMP, product_name = $10, project_description = $11, delivery_address = $12, has_elevator = $13, floor = $14, delivery_notes = $15 RETURNING id',
        [orderData.order_number, orderData.customer_id, orderData.status, orderData.priority, orderData.total_amount, orderData.paid_amount, orderData.delivery_date, orderData.notes, orderData.created_by, orderData.product_name, orderData.project_description, orderData.delivery_address, orderData.has_elevator, orderData.floor, orderData.delivery_notes]
      );

      if (res.rows.length > 0) {
        const orderId = res.rows[0].id;

        await db.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        await db.query(
          'INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price, materials_cost, labor_cost) VALUES ($1, $2, $3, 1, $4, $4, $5, $6)',
          [orderId, orderData.product_name, orderData.product_desc, orderData.total_amount, materials_cost, labor_cost]
        );

        await db.query('DELETE FROM production_operations WHERE order_id = $1', [orderId]);
        await db.query(
          'INSERT INTO production_operations (order_id, operation_type, production_stage, status, created_by) VALUES ($1, $2, $3, $4, $5)',
          [orderId, 'produce', production_stage, 'in_progress', orderData.created_by]
        );
        
        await db.query('DELETE FROM order_status_history WHERE order_id = $1', [orderId]);
        await db.query(
          "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES ($1, 'new', 'Заказ создан автоматически', $2)",
          [orderId, orderData.created_by]
        );
        if(order.status !== 'new') {
            await db.query(
              "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES ($1, $2, 'Статус обновлен', $3)",
              [orderId, order.status, orderData.created_by]
            );
        }

        // Добавляем транзакцию для предоплаты
        if(order.paid_amount > 0) {
            await db.query('DELETE FROM financial_transactions WHERE order_id = $1 AND category = $2', [orderId, 'Предоплата']);
            await db.query(
              "INSERT INTO financial_transactions (order_id, type, category, amount, description, created_by) VALUES ($1, 'income', 'Предоплата', $2, $3, $4)",
              [orderId, order.paid_amount, `Предоплата по заказу ${order.order_number}`, order.created_by]
            );
        }

        // Добавляем транзакцию для финальной оплаты, если заказ оплачен полностью
        if(order.paid_amount > 0 && order.paid_amount === order.total_amount) {
            const finalPayment = order.total_amount - order.paid_amount;
            if (finalPayment > 0) {
              await db.query(
                "INSERT INTO financial_transactions (order_id, type, category, amount, description, created_by) VALUES ($1, 'income', 'Финальная оплата', $2, $3, $4)",
                [orderId, finalPayment, `Финальная оплата по заказу ${order.order_number}`, order.created_by]
              );
            }
        }

        // Добавляем транзакцию расхода на материалы
        if(materials_cost > 0) {
            await db.query('DELETE FROM financial_transactions WHERE order_id = $1 AND category = $2', [orderId, 'Материалы']);
            await db.query(
              "INSERT INTO financial_transactions (order_id, type, category, amount, description, created_by) VALUES ($1, 'expense', 'Материалы', $2, $3, $4)",
              [orderId, materials_cost, `Закупка материалов для заказа ${order.order_number}`, order.created_by]
            );
        }
      }
    }

    console.log('✅ 12 детализированных демо-заказов успешно созданы/обновлены!');

  } catch (error) {
    console.error('❌ Ошибка загрузки демо-заказов:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await seedDemoData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}
