console.log('=== ЗАГРУЖЕН ОБНОВЛЕННЫЙ ФАЙЛ orders.js ===');
const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Функция генерации номера заказа
const generateOrderNumber = async (client, prefix) => {
  try {
    // Получаем текущий год
    const currentYear = new Date().getFullYear();
    
    // Получаем последний номер заказа с данным префиксом за текущий год
    const result = await client.query(`
      SELECT order_number 
      FROM orders 
      WHERE order_number LIKE $1 
      ORDER BY order_number DESC 
      LIMIT 1
    `, [`${prefix}-${currentYear}-%`]);
    
    let nextNumber = 1;
    
    if (result.rows.length > 0) {
      // Извлекаем номер из последнего заказа
      const lastOrderNumber = result.rows[0].order_number;
      const match = lastOrderNumber.match(new RegExp(`${prefix}-${currentYear}-(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    } else {
      // Если нет заказов с новой нумерацией, начинаем с 1
      nextNumber = 1;
    }
    
    // Форматируем номер с ведущими нулями (4 цифры)
    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Ошибка генерации номера заказа:', error);
    // Fallback к timestamp если что-то пошло не так
    return `${prefix}-${Date.now()}`;
  }
};

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

// Схемы валидации
const orderSchema = Joi.object({
  customer_id: Joi.number().integer().required(),
  status: Joi.string().valid('new', 'draft', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled').default('new'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  delivery_date: Joi.date().allow(null),
  notes: Joi.string().allow(''),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    quantity: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required()
  })).min(1).required()
});

// Получение заказов для канбана (только в производстве)
router.get('/kanban', authenticateToken, async (req, res) => {
  try {
    const client = await db.pool.connect();
    
    // Получаем заказы со статусом 'in_production' и их текущий этап производства
    const result = await client.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.priority,
        o.total_amount,
        o.paid_amount,
        o.delivery_date,
        o.notes,
        o.project_description,
        o.created_at,
        o.updated_at,
        o.delivery_address,
        o.floor,
        o.has_elevator,
        o.delivery_notes,
        o.materials_cost,
        o.labor_cost,
        o.other_costs,
        o.profit_margin,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_company,
        COALESCE(o.customer_name, c.name) as customer_name,
        COALESCE(o.customer_email, c.email) as customer_email,
        COALESCE(o.customer_phone, c.phone) as customer_phone,
        COALESCE(o.customer_company, c.company) as customer_company,
        c.address as customer_address,
        po.production_stage,
        po.status as production_status,
        po.created_at as stage_started_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN production_operations po ON o.id = po.order_id 
        AND po.status = 'in_progress' 
        AND po.operation_type = 'produce'
      WHERE o.status = 'in_production'
      ORDER BY o.priority DESC, o.created_at ASC
    `);
    
    client.release();
    
    // Группируем заказы по этапам производства
    const kanbanData = {
      columns: [
        { id: 1, title: "КБ", color: "#d1fae5", cards: [] },
        { id: 2, title: "Столярный цех", color: "#fef3c7", cards: [] },
        { id: 3, title: "Формовка ППУ", color: "#e0e7ff", cards: [] },
        { id: 4, title: "Швейный цех", color: "#f3e8ff", cards: [] },
        { id: 5, title: "Сборка и упаковка", color: "#fce7f3", cards: [] },
        { id: 6, title: "Готов к отгрузке", color: "#d1fae5", cards: [] },
        { id: 7, title: "Отгружен", color: "#e0f7f7", cards: [] }
      ]
    };
    
    // Распределяем заказы по колонкам
    result.rows.forEach(order => {
      const stage = order.production_stage || 'КБ'; // По умолчанию КБ
      const columnIndex = kanbanData.columns.findIndex(col => col.title === stage);
      
      if (columnIndex !== -1) {
        const card = {
          id: order.id,
          order_number: order.order_number,
          client: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email,
          company: order.customer_company,
          address: order.customer_address,
          price: parseFloat(order.total_amount),
          prepayment: parseFloat(order.paid_amount || 0),
          product_name: order.project_description,
          deadline: order.delivery_date,
          priority: order.priority,
          notes: order.notes,
          status: columnIndex + 1,
          color: "#ffffff",
          created_at: order.created_at,
          stage_started_at: order.stage_started_at,
          // Данные о доставке
          delivery_address: order.delivery_address,
          floor: order.floor,
          has_elevator: order.has_elevator,
          delivery_notes: order.delivery_notes,
          // Финансовые данные
          materials_cost: order.materials_cost,
          labor_cost: order.labor_cost,
          other_costs: order.other_costs,
          profit_margin: order.profit_margin
        };
        
        kanbanData.columns[columnIndex].cards.push(card);
      }
    });
    
    res.json(kanbanData);
  } catch (error) {
    console.error('Ошибка получения данных канбана:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление этапа производства заказа в канбане
router.put('/kanban/:orderId/stage', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { stage } = req.body;
    
    if (!stage) {
      return res.status(400).json({ message: 'Этап производства не указан' });
    }
    
    const validStages = ['КБ', 'Столярный цех', 'Формовка ППУ', 'Швейный цех', 'Сборка и упаковка', 'Готов к отгрузке', 'Отгружен'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: 'Недопустимый этап производства' });
    }
    
    const client = await db.pool.connect();
    
    await client.query('BEGIN');
    
    // Обновляем этап производства в активной операции
    await client.query(`
      UPDATE production_operations 
      SET production_stage = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2 AND status = 'in_progress' AND operation_type = 'produce'
    `, [stage, orderId]);
    
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
    await client.query('ROLLBACK');
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
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
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
        COALESCE(o.customer_name, c.name) as customer_name,
        COALESCE(o.customer_email, c.email) as customer_email,
        COALESCE(o.customer_phone, c.phone) as customer_phone,
        COALESCE(o.customer_company, c.company) as customer_company,
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

    const { customer_id, status, priority, delivery_date, notes, items } = value;

    // Генерируем номер заказа
    console.log('Генерируем номер заказа...');
    const orderNumber = await generateOrderNumber(client, 'SOF');
    console.log('Сгенерированный номер заказа:', orderNumber);

    // Создаем заказ
    const orderResult = await client.query(`
      INSERT INTO orders (order_number, customer_id, status, priority, delivery_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [orderNumber, customer_id, status, priority, delivery_date, notes, req.user.id]);

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
    await client.query('ROLLBACK');
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
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
      delivery_address,
      has_elevator,
      floor,
      delivery_notes,
      project_description,
      calculator_data,
      customer_name,
      customer_phone,
      customer_email,
      customer_company,
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
      customer_name,
      customer_phone,
      customer_email,
      customer_company
    });

    // Обновление заказа с простым SQL запросом
    const result = await client.query(`
      UPDATE orders 
      SET 
        status = COALESCE($1, status),
        priority = COALESCE($2, priority),
        delivery_date = COALESCE($3, delivery_date),
        notes = COALESCE($4, notes),
        paid_amount = COALESCE($5, paid_amount),
        delivery_address = COALESCE($6, delivery_address),
        has_elevator = COALESCE($7, has_elevator),
        floor = COALESCE($8, floor),
        delivery_notes = COALESCE($9, delivery_notes),
        project_description = COALESCE($10, project_description),
        calculator_data = COALESCE($11, calculator_data),
        customer_name = $12,
        customer_phone = $13,
        customer_email = $14,
        customer_company = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `, [
      status || null, 
      priority || null, 
      delivery_date || null, 
      notes || null, 
      paid_amount || null,
      delivery_address || null,
      has_elevator !== undefined ? has_elevator : null,
      floor || null,
      delivery_notes || null,
      project_description || null,
      calculator_data ? JSON.stringify(calculator_data) : null,
      customer_name !== undefined ? customer_name : null,
      customer_phone !== undefined ? customer_phone : null,
      customer_email !== undefined ? customer_email : null,
      customer_company !== undefined ? customer_company : null,
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
    await client.query('ROLLBACK');
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

// Удаление заказа
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

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
        COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
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
      'SELECT id, file_name, file_type, file_size, created_at FROM order_drawings WHERE order_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json({ drawings: result.rows });
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
      'Content-Disposition': `inline; filename="${drawing.file_name}"`,
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







