const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Схемы валидации
const operationSchema = Joi.object({
  order_id: Joi.number().integer().required(),
  operation_type: Joi.string().valid('purchase', 'purchase_and_produce', 'produce', 'cancel').required(),
  production_stage: Joi.string().valid('КБ', 'Столярный цех', 'Формовка ППУ', 'Швейный цех', 'Сборка и упаковка', 'Готов к отгрузке', 'Отгружен').allow(null),
  assigned_to: Joi.number().integer().allow(null),
  notes: Joi.string().allow('')
});

// Получение всех производственных операций
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      operation_type,
      assigned_to,
      order_id,
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
      whereConditions.push(`po.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (operation_type) {
      paramCount++;
      whereConditions.push(`po.operation_type = $${paramCount}`);
      queryParams.push(operation_type);
    }

    if (assigned_to) {
      paramCount++;
      whereConditions.push(`po.assigned_to = $${paramCount}`);
      queryParams.push(assigned_to);
    }

    if (order_id) {
      paramCount++;
      whereConditions.push(`po.order_id = $${paramCount}`);
      queryParams.push(order_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM production_operations po
      LEFT JOIN orders o ON po.order_id = o.id
      LEFT JOIN users u ON po.assigned_to = u.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Получение операций
    paramCount++;
    const operationsQuery = `
      SELECT 
        po.*,
        o.order_number,
        o.status as order_status,
        o.priority as order_priority,
        c.name as customer_name,
        u.name as assigned_to_name,
        creator.name as created_by_name
      FROM production_operations po
      LEFT JOIN orders o ON po.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON po.assigned_to = u.id
      LEFT JOIN users creator ON o.created_by = creator.id
      ${whereClause}
      ORDER BY po.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    queryParams.push(limit, offset);

    const operationsResult = await db.query(operationsQuery, queryParams);

    res.json({
      operations: operationsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения операций:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение операции по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        po.*,
        o.order_number,
        o.status as order_status,
        o.priority as order_priority,
        o.total_amount,
        c.name as customer_name,
        u.name as assigned_to_name,
        creator.name as created_by_name
      FROM production_operations po
      LEFT JOIN orders o ON po.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON po.assigned_to = u.id
      LEFT JOIN users creator ON o.created_by = creator.id
      WHERE po.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Операция не найдена' });
    }

    const operation = result.rows[0];

    // Получаем использованные материалы
    const materialsResult = await db.query(`
      SELECT 
        mu.*,
        m.name as material_name,
        m.unit as material_unit
      FROM material_usage mu
      LEFT JOIN materials m ON mu.material_id = m.id
      WHERE mu.operation_id = $1
    `, [id]);

    operation.materials_used = materialsResult.rows;

    res.json({ operation });
  } catch (error) {
    console.error('Ошибка получения операции:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой операции
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { error, value } = operationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { order_id, operation_type, production_stage, assigned_to, notes } = value;

    // Проверяем существование заказа
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Проверяем, можно ли выполнить операцию с текущим статусом заказа
    const validTransitions = {
      'new': ['purchase', 'purchase_and_produce', 'produce', 'cancel'],
      'confirmed': ['purchase', 'purchase_and_produce', 'produce', 'cancel'],
      'in_production': ['produce', 'cancel'], // Разрешаем создавать операции в производстве
      'ready': [],
      'shipped': [],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status]?.includes(operation_type)) {
      return res.status(400).json({ 
        message: `Операция "${operation_type}" недоступна для заказа со статусом "${order.status}"` 
      });
    }

    // Создаем операцию
    const operationResult = await client.query(`
      INSERT INTO production_operations (order_id, operation_type, production_stage, status, assigned_to, notes, created_by)
      VALUES ($1, $2, $3, 'pending', $4, $5, $6)
      RETURNING *
    `, [order_id, operation_type, production_stage || 'КБ', assigned_to, notes, req.user.id]);

    const operation = operationResult.rows[0];

    // Обновляем статус заказа в зависимости от операции
    let newOrderStatus = order.status;
    let operationStatus = 'pending';

    switch (operation_type) {
      case 'purchase':
        newOrderStatus = 'confirmed';
        operationStatus = 'in_progress';
        break;
      case 'purchase_and_produce':
        newOrderStatus = 'in_production';
        operationStatus = 'in_progress';
        break;
      case 'produce':
        newOrderStatus = 'in_production';
        operationStatus = 'in_progress';
        break;
      case 'cancel':
        newOrderStatus = 'cancelled';
        operationStatus = 'completed';
        break;
    }

    // Обновляем статус заказа
    await client.query(`
      UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [newOrderStatus, order_id]);

    // Обновляем статус операции
    await client.query(`
      UPDATE production_operations SET status = $1 WHERE id = $2
    `, [operationStatus, operation.id]);

    // Добавляем запись в историю статусов заказа
    await client.query(`
      INSERT INTO order_status_history (order_id, status, comment, created_by)
      VALUES ($1, $2, $3, $4)
    `, [order_id, newOrderStatus, `Операция: ${operation_type}`, req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Операция создана успешно',
      operation: { ...operation, status: operationStatus }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка создания операции:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// Обновление операции
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, start_date, end_date, notes } = req.body;

    // Проверяем существование операции
    const existingOperation = await db.query('SELECT * FROM production_operations WHERE id = $1', [id]);
    if (existingOperation.rows.length === 0) {
      return res.status(404).json({ message: 'Операция не найдена' });
    }

    const result = await db.query(`
      UPDATE production_operations 
      SET status = $1, assigned_to = $2, start_date = $3, end_date = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [status, assigned_to, start_date, end_date, notes, id]);

    res.json({
      message: 'Операция обновлена',
      operation: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления операции:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Завершение операции
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await db.query(`
      UPDATE production_operations 
      SET status = 'completed', end_date = CURRENT_TIMESTAMP, notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Операция не найдена' });
    }

    res.json({
      message: 'Операция завершена',
      operation: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка завершения операции:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение статистики производства
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // дней

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_operations,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_operations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_operations,
        COUNT(CASE WHEN operation_type = 'purchase' THEN 1 END) as purchase_operations,
        COUNT(CASE WHEN operation_type = 'produce' THEN 1 END) as production_operations,
        COUNT(CASE WHEN operation_type = 'cancel' THEN 1 END) as cancelled_operations
      FROM production_operations 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Ошибка получения статистики производства:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение операций по заказу
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await db.query(`
      SELECT 
        po.*,
        u.name as assigned_to_name,
        creator.name as created_by_name
      FROM production_operations po
      LEFT JOIN users u ON po.assigned_to = u.id
      LEFT JOIN users creator ON o.created_by = creator.id
      WHERE po.order_id = $1
      ORDER BY po.created_at DESC
    `, [orderId]);

    res.json({ operations: result.rows });
  } catch (error) {
    console.error('Ошибка получения операций заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;








