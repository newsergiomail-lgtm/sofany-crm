const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешенные типы файлов
    const allowedTypes = /jpeg|jpg|png|gif|pdf|dwg|dxf|skp/;
    const allowedMimeTypes = /image\/|application\/pdf|application\/dwg|application\/dxf|application\/x-koan/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.log('Отклонен файл:', file.originalname, 'тип:', file.mimetype);
      cb(new Error('Неподдерживаемый тип файла'));
    }
  }
});

// Функция генерации номера заказа
async function generateOrderNumber(client) {
  try {
    console.log('🔢 Генерируем номер заказа...');
    
    // Получаем последний номер заказа из базы данных
    const result = await client.query(`
      SELECT order_number 
      FROM orders 
      WHERE order_number LIKE 'SOF-%' 
      ORDER BY order_number DESC 
      LIMIT 1
    `);
    
    console.log('📊 Найдено заказов:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('📋 Последний номер:', result.rows[0].order_number);
    }
    
    let nextNumber = 1;
    
    if (result.rows.length > 0) {
      const lastOrderNumber = result.rows[0].order_number;
      const numberPart = lastOrderNumber.substring(4); // Убираем "SOF-"
      
      console.log('🔍 Часть номера:', numberPart);
      
      // Проверяем, является ли номер числом (не timestamp)
      if (/^\d{1,5}$/.test(numberPart)) {
        nextNumber = parseInt(numberPart) + 1;
        console.log('✅ Числовой номер, следующий:', nextNumber);
      } else {
        // Если это timestamp, начинаем с 1
        nextNumber = 1;
        console.log('⚠️ Timestamp номер, начинаем с 1');
      }
    } else {
      console.log('🆕 Первый заказ, начинаем с 1');
    }
    
    // Генерируем номер и проверяем, что он уникален
    let orderNumber;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      attempts++;
      
      // Если номер больше 9999, переходим на 5-значные номера
      if (nextNumber > 9999) {
        orderNumber = `SOF-${String(nextNumber).padStart(5, '0')}`;
      } else {
        orderNumber = `SOF-${String(nextNumber).padStart(4, '0')}`;
      }
      
      // Проверяем, существует ли уже такой номер
      const checkResult = await client.query(
        'SELECT id FROM orders WHERE order_number = $1',
        [orderNumber]
      );
      
      if (checkResult.rows.length === 0) {
        // Номер уникален
        console.log('🎯 Сгенерированный номер:', orderNumber);
        return orderNumber;
      } else {
        // Номер уже существует, пробуем следующий
        console.log('⚠️ Номер уже существует:', orderNumber, 'пробуем следующий');
        nextNumber++;
      }
    } while (attempts < maxAttempts);
    
    // Если не удалось найти уникальный номер за разумное количество попыток, используем timestamp
    console.log('⚠️ Не удалось найти уникальный номер, используем timestamp');
    return `SOF-${Date.now()}`;
    
  } catch (error) {
    console.error('❌ Ошибка генерации номера заказа:', error);
    // Fallback на timestamp если что-то пошло не так
    return `SOF-${Date.now()}`;
  }
}

// Схемы валидации
const orderSchema = Joi.object({
  customer_id: Joi.number().integer().required(),
  product_name: Joi.string().allow(''),
  status: Joi.string().valid('new', 'draft', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled').default('new'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  delivery_date: Joi.date().allow(null),
  total_amount: Joi.number().min(0).allow(null),
  prepayment_amount: Joi.number().min(0).allow(null),
  paid_amount: Joi.number().min(0).allow(null),
  notes: Joi.string().allow(''),
  // Плоские поля клиента (могут прийти с формы) - убраны, используются поля из таблицы customers
  // Плоские поля доставки
  delivery_address: Joi.string().allow('', null),
  has_elevator: Joi.boolean().allow(null),
  floor: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow('', null),
  delivery_notes: Joi.string().allow('', null),
  project_description: Joi.string().allow('', null),
  short_description: Joi.string().allow('', null),
  detailed_description: Joi.string().allow('', null),
  // Дополнительные структурированные данные
  calculator_data: Joi.any().optional(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    quantity: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required()
  })).min(1).required()
});

// Получение заказов для канбана (новые и в производстве)
router.get('/kanban', authenticateToken, async (req, res) => {
  try {
    console.log('Получение данных канбана...');
    
    // Получаем заказы со статусом 'in_production' и 'production'
    const result = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.product_name,
        o.status,
        o.priority,
        o.total_amount,
        o.paid_amount,
        o.delivery_date,
        o.notes,
        o.created_at,
        o.updated_at,
        o.project_description,
        COALESCE(o.product_name, 'Без названия') as short_description,
        o.project_description as detailed_description,
        o.delivery_address,
        o.has_elevator,
        o.floor,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.company as customer_company,
        po.production_stage,
        po.status as production_status,
        po.created_at as stage_started_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN production_operations po ON o.id = po.order_id 
        AND po.status = 'in_progress' 
        AND po.operation_type = 'produce'
      WHERE o.status IN ('in_production', 'production')
      ORDER BY o.priority DESC, o.created_at ASC
    `);
    
    console.log('Найдено заказов:', result.rows.length);
    
    // Получаем колонки канбана из базы данных
    const columnsResult = await db.query(`
      SELECT * FROM kanban_columns 
      WHERE is_active = true 
      ORDER BY position ASC
    `);
    
    console.log('Найдено колонок:', columnsResult.rows.length);
    
    // Простая группировка заказов по этапам производства
    const kanbanData = {
      columns: columnsResult.rows.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
        type: col.type,
        cards: []
      }))
    };
    
    // Распределяем заказы по колонкам
    result.rows.forEach(order => {
      let stage = order.production_stage || 'КБ'; // По умолчанию КБ
      let columnIndex = kanbanData.columns.findIndex(col => col.title === stage);
      
      // Если стадия не найдена, перенаправляем в КБ
      if (columnIndex === -1) {
        stage = 'КБ';
        columnIndex = kanbanData.columns.findIndex(col => col.title === stage);
      }
      
      if (columnIndex !== -1) {
        const card = {
          id: order.id,
          order_number: order.order_number,
          product_name: order.product_name,
          client: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email,
          company: order.customer_company,
          price: parseFloat(order.total_amount),
          prepayment: parseFloat(order.paid_amount),
          deadline: order.delivery_date,
          priority: order.priority,
          notes: order.notes,
          project_description: order.project_description,
          short_description: order.short_description,
          detailed_description: order.detailed_description,
          delivery_address: order.delivery_address,
          has_elevator: order.has_elevator,
          floor: order.floor,
          status: columnIndex + 1,
          color: "#ffffff",
          created_at: order.created_at,
          stage_started_at: order.stage_started_at
        };
        
        kanbanData.columns[columnIndex].cards.push(card);
      }
    });
    
    console.log('Канбан данные готовы');
    res.json(kanbanData);
  } catch (error) {
    console.error('Ошибка получения данных канбана:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление этапа производства заказа в канбане
router.put('/kanban/:orderId/stage', authenticateToken, async (req, res) => {
  let client;
  try {
    const { orderId } = req.params;
    const { stage } = req.body;
    
    if (!stage) {
      return res.status(400).json({ message: 'Этап производства не указан' });
    }
    
    const validStages = ['КБ', 'Столярный цех', 'Формовка', 'Швейный цех', 'Обивка', 'Сборка и упаковка', 'Отгружен'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: 'Недопустимый этап производства' });
    }
    
    // Проверяем блокировки материалов для этапа
    const stageMapping = {
      'Столярный цех': 'frame',
      'Швейный цех': 'upholstery', 
      'Формовка': 'foam_molding',
      'Сборка и упаковка': 'assembly'
    };
    
    const mappedStage = stageMapping[stage];
    if (mappedStage) {
      // Проверяем материалы для этапа
      const materialsResult = await db.query(
        'SELECT * FROM check_materials_for_stage($1, $2)',
        [orderId, mappedStage]
      );
      
      const blockedMaterials = materialsResult.rows.filter(m => m.is_blocked);
      if (blockedMaterials.length > 0) {
        return res.status(400).json({
          message: `Заказ заблокирован из-за нехватки материалов для этапа "${stage}"`,
          blockedMaterials: blockedMaterials.map(m => ({
            material: m.material_name,
            required: m.required_quantity,
            available: m.available_quantity,
            missing: m.missing_quantity,
            unit: m.unit
          }))
        });
      }
    }
    
    client = await db.pool.connect();
    
    await client.query('BEGIN');
    
    // Проверяем, есть ли активная операция для заказа
    const existingOperation = await client.query(`
      SELECT id FROM production_operations 
      WHERE order_id = $1 AND status = 'in_progress' AND operation_type = 'produce'
    `, [orderId]);
    
    if (existingOperation.rows.length > 0) {
      // Обновляем существующую операцию
      await client.query(`
        UPDATE production_operations 
        SET production_stage = $1, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2 AND status = 'in_progress' AND operation_type = 'produce'
      `, [stage, orderId]);
    } else {
      // Создаем новую операцию для заказа
      await client.query(`
        INSERT INTO production_operations (order_id, operation_type, production_stage, status, created_by)
        VALUES ($1, 'produce', $2, 'in_progress', $3)
      `, [orderId, stage, req.user.id]);
    }
    
    // Если заказ переходит в "Отгружен", обновляем статус заказа
    if (stage === 'Отгружен') {
      await client.query(`
        UPDATE orders 
        SET status = 'shipped', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orderId]);
      
      // Добавляем запись в историю статусов
      await client.query(`
        INSERT INTO order_status_history (order_id, status, comment, created_by)
        VALUES ($1, $2, $3, $4)
      `, [orderId, 'shipped', `Заказ отгружен`, req.user.id]);
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({ message: 'Этап производства обновлен успешно' });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Ошибка обновления этапа производства:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех заказов с фильтрацией и пагинацией
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customer_id, 
      priority,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Всегда исключаем удаленные заказы (статус 'cancelled')
    whereConditions.push(`o.status != 'cancelled'`);

    // Фильтры
    if (status) {
      paramCount++;
      whereConditions.push(`o.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (customer_id) {
      paramCount++;
      whereConditions.push(`o.customer_id = $${paramCount}`);
      queryParams.push(customer_id);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`o.priority = $${paramCount}`);
      queryParams.push(priority);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(o.order_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Получение заказов
    paramCount++;
    const ordersQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
        CASE 
          WHEN o.source = 'calc' THEN 'calc'
          ELSE 'crm'
        END as order_source
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      ${whereClause}
      ORDER BY o.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    queryParams.push(limit, offset);

    const ordersResult = await db.query(ordersQuery, queryParams);

    res.json({
      orders: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение заказа по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем заказ
    const orderResult = await db.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Получаем позиции заказа
    const itemsResult = await db.query(`
      SELECT * FROM order_items WHERE order_id = $1 ORDER BY id
    `, [id]);

    // Получаем историю статусов
    const statusHistoryResult = await db.query(`
      SELECT 
        osh.*,
        u.name as created_by_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.created_by = u.id
      WHERE osh.order_id = $1
      ORDER BY osh.created_at DESC
    `, [id]);

    order.items = itemsResult.rows;
    order.status_history = statusHistoryResult.rows;

    res.json({ order });
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание нового заказа
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { 
      customer_id, product_name, status, priority, delivery_date, notes, items,
      total_amount, prepayment_amount, paid_amount,
      delivery_address, has_elevator, floor, delivery_notes, project_description,
      calculator_data
    } = value;

    // Генерируем номер заказа (простая последовательность)
    const orderNumber = await generateOrderNumber(client);

    // Создаем заказ
    const orderResult = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, product_name, status, priority, delivery_date, notes, created_by,
        total_amount, paid_amount,
        delivery_address, has_elevator, floor, delivery_notes, project_description,
        calculator_data
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10,
        $11, $12, $13, $14, $15,
        $16
      )
      RETURNING *
    `, [
      orderNumber, customer_id, product_name || '', status, priority, delivery_date, notes, req.user.id,
      total_amount || 0, (prepayment_amount || paid_amount) || 0,
      delivery_address || null, has_elevator ?? null, floor ?? null, delivery_notes || null, project_description || null,
      calculator_data ? JSON.stringify(calculator_data) : null
    ]);

    const order = orderResult.rows[0];

    // Добавляем позиции заказа
    let totalAmount = 0;
    for (const item of items) {
      const totalPrice = item.quantity * item.unit_price;
      totalAmount += totalPrice;

      await client.query(`
        INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.name, item.description, item.quantity, item.unit_price, totalPrice]);
    }

    // Обновляем общую сумму заказа
    await client.query(`
      UPDATE orders SET total_amount = $1 WHERE id = $2
    `, [totalAmount, order.id]);

    // Добавляем запись в историю статусов
    await client.query(`
      INSERT INTO order_status_history (order_id, status, comment, created_by)
      VALUES ($1, $2, $3, $4)
    `, [order.id, status, 'Заказ создан', req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: { ...order, total_amount: totalAmount }
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Ошибка создания заказа:', error);
    
    // Более детальная обработка ошибок
    if (error.code === '23505') {
      res.status(400).json({ 
        message: 'Заказ с таким номером уже существует',
        error: 'DUPLICATE_ORDER_NUMBER'
      });
    } else if (error.code === '23503') {
      res.status(400).json({ 
        message: 'Указанный клиент не найден',
        error: 'CUSTOMER_NOT_FOUND'
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка сервера',
        error: error.message
      });
    }
  } finally {
    client.release();
  }
});

// Обновление заказа
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      status, 
      priority, 
      delivery_date, 
      notes, 
      paid_amount,
      total_amount,
      prepayment_amount,
      delivery_address,
      has_elevator,
      floor,
      delivery_notes,
      project_description,
      calculator_data,
      items
    } = req.body;

    // Проверяем существование заказа
    const existingOrder = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const currentOrder = existingOrder.rows[0];

    // Логирование для отладки
    console.log('Обновление заказа:', {
      id,
      status,
      priority,
      delivery_date,
      total_amount,
      prepayment_amount
    });

    // Обновление заказа с простым SQL запросом
    const result = await client.query(`
      UPDATE orders 
      SET 
        status = COALESCE($1, orders.status),
        priority = COALESCE($2, orders.priority),
        delivery_date = COALESCE($3, orders.delivery_date),
        notes = COALESCE($4, orders.notes),
        paid_amount = COALESCE($5, orders.paid_amount),
        total_amount = COALESCE($6, orders.total_amount),
        delivery_address = COALESCE($7, orders.delivery_address),
        has_elevator = COALESCE($8, orders.has_elevator),
        floor = COALESCE($9, orders.floor),
        delivery_notes = COALESCE($10, orders.delivery_notes),
      project_description = COALESCE($11, orders.project_description),
      calculator_data = COALESCE($12, orders.calculator_data),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      status || null, 
      priority || null, 
      delivery_date || null, 
      notes || null, 
      paid_amount || null,
      total_amount || null,
      delivery_address || null,
      has_elevator !== undefined ? has_elevator : null,
      floor || null,
      delivery_notes || null,
      project_description || null,
      calculator_data ? JSON.stringify(calculator_data) : null,
      id
    ]);

    // Обновляем позиции заказа если они переданы
    if (items && Array.isArray(items)) {
      // Удаляем старые позиции
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      
      // Добавляем новые позиции
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          id,
          item.name,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          (item.quantity || 1) * (item.unit_price || 0)
        ]);
      }
    }

    // Если статус изменился, добавляем в историю
    if (status && status !== currentOrder.status) {
      await client.query(`
        INSERT INTO order_status_history (order_id, status, comment, created_by)
        VALUES ($1, $2, $3, $4)
      `, [id, status, 'Статус изменен', req.user.id]);
    }

    await client.query('COMMIT');

    res.json({
      message: 'Заказ обновлен',
      order: result.rows[0]
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Ошибка обновления заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// Обновление данных клиента
router.put('/:id/customer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, company } = req.body;

    // Проверяем существование заказа
    const existingOrder = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = existingOrder.rows[0];

    // Обновляем данные клиента
    const result = await db.query(`
      UPDATE customers 
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        company = COALESCE($4, company),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [name, phone, email, company, order.customer_id]);

    res.json({ message: 'Данные клиента обновлены', customer: result.rows[0] });
  } catch (error) {
    console.error('Ошибка обновления клиента:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление заказа (мягкое удаление - помечаем как удаленный)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли заказ
    const orderCheck = await db.query('SELECT id, status FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Мягкое удаление - помечаем заказ как удаленный
    const result = await db.query(
      'UPDATE orders SET status = $1, notes = COALESCE(notes, \'\') || \' [УДАЛЕН]\' WHERE id = $2 RETURNING *', 
      ['cancelled', id]
    );

    res.json({ message: 'Заказ удален' });
  } catch (error) {
    console.error('Ошибка удаления заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение статистики заказов
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // дней

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_orders,
        COUNT(CASE WHEN status = 'in_production' THEN 1 END) as in_production,
        COUNT(CASE WHEN status = 'in_sewing' THEN 1 END) as in_sewing,
        COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as urgent_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Endpoints для работы с чертежами

// GET /api/orders/:id/drawings - получить список чертежей заказа
router.get('/:id/drawings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT id, file_name as original_name, file_name as filename, file_type, file_size as size, created_at FROM order_drawings WHERE order_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json({ files: result.rows });
  } catch (error) {
    console.error('Ошибка получения чертежей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/orders/:id/drawings - загрузить чертеж
router.post('/:id/drawings', authenticateToken, upload.single('drawing'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'Файл не предоставлен' });
    }
    
    const result = await db.query(
      'INSERT INTO order_drawings (order_id, file_name, file_data, file_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, file.originalname, file.buffer, file.mimetype, file.size, req.user.id]
    );
    
    res.json({ 
      message: 'Чертеж загружен успешно',
      drawing: {
        id: result.rows[0].id,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки чертежа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /api/orders/:id/drawings/:drawingId - получить чертеж
router.get('/:id/drawings/:drawingId', authenticateToken, async (req, res) => {
  try {
    const { id, drawingId } = req.params;
    
    const result = await db.query(
      'SELECT file_name, file_data, file_type FROM order_drawings WHERE id = $1 AND order_id = $2',
      [drawingId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Чертеж не найден' });
    }
    
    const drawing = result.rows[0];
    
    res.set({
      'Content-Type': drawing.file_type,
      'Content-Disposition': `attachment; filename="${drawing.file_name}"`,
      'Content-Length': drawing.file_data.length
    });
    
    res.send(drawing.file_data);
  } catch (error) {
    console.error('Ошибка получения чертежа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// DELETE /api/orders/:id/drawings/:drawingId - удалить чертеж
router.delete('/:id/drawings/:drawingId', authenticateToken, async (req, res) => {
  try {
    const { id, drawingId } = req.params;
    
    const result = await db.query(
      'DELETE FROM order_drawings WHERE id = $1 AND order_id = $2 RETURNING file_name',
      [drawingId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Чертеж не найден' });
    }
    
    res.json({ message: 'Чертеж удален успешно' });
  } catch (error) {
    console.error('Ошибка удаления чертежа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;








// GET /api/orders/:id/drawings/:drawingId - получить чертеж
router.get('/:id/drawings/:drawingId', authenticateToken, async (req, res) => {
  try {
    const { id, drawingId } = req.params;
    
    const result = await db.query(
      'SELECT file_name, file_data, file_type FROM order_drawings WHERE id = $1 AND order_id = $2',
      [drawingId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Чертеж не найден' });
    }
    
    const drawing = result.rows[0];
    
    res.set({
      'Content-Type': drawing.file_type,
      'Content-Disposition': `attachment; filename="${drawing.file_name}"`,
      'Content-Length': drawing.file_data.length
    });
    
    res.send(drawing.file_data);
  } catch (error) {
    console.error('Ошибка получения чертежа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// DELETE /api/orders/:id/drawings/:drawingId - удалить чертеж
router.delete('/:id/drawings/:drawingId', authenticateToken, async (req, res) => {
  try {
    const { id, drawingId } = req.params;
    
    const result = await db.query(
      'DELETE FROM order_drawings WHERE id = $1 AND order_id = $2 RETURNING file_name',
      [drawingId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Чертеж не найден' });
    }
    
    res.json({ message: 'Чертеж удален успешно' });
  } catch (error) {
    console.error('Ошибка удаления чертежа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;

