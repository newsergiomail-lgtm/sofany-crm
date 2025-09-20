const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');

// Схема валидации для создания заявки на закупку
const purchaseRequestSchema = Joi.object({
  order_id: Joi.number().integer().allow(0, null).default(0), // 0 = общая заявка, не привязанная к заказу
  title: Joi.string().max(255).required(),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  items: Joi.array().items(Joi.object({
    material_name: Joi.string().required(),
    required_quantity: Joi.number().precision(2).min(0.01).required(),
    unit: Joi.string().max(50).required(),
    estimated_price: Joi.number().precision(2).min(0).default(0),
    supplier_name: Joi.string().allow('', null),
    supplier_contact: Joi.string().allow('', null),
    notes: Joi.string().allow('', null)
  })).min(1).required()
});

// Схема валидации для обновления заявки
const updatePurchaseRequestSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'completed', 'cancelled'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
  notes: Joi.string().allow('', null)
});

// Получить все заявки на закупку
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== ПОЛУЧЕНИЕ ЗАЯВОК НА ЗАКУПКУ ===');
    const { status, priority, page = 1, limit = 20 } = req.query;
    console.log('Параметры:', { status, priority, page, limit });
    
    let query = `
      SELECT 
        pr.*,
        o.order_number,
        c.name as customer_name,
        COUNT(pri.id) as items_count
      FROM purchase_requests pr
      LEFT JOIN orders o ON pr.order_id = o.id AND pr.order_id > 0
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN purchase_request_items pri ON pr.id = pri.purchase_request_id
      WHERE pr.is_active = true
      GROUP BY pr.id, o.order_number, c.name
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND pr.status = $${paramCount}`;
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      query += ` AND pr.priority = $${paramCount}`;
      params.push(priority);
    }
    
    query += ` ORDER BY pr.created_at DESC`;
    
    // Пагинация
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push((parseInt(page) - 1) * parseInt(limit));
    
    console.log('SQL запрос:', query);
    console.log('Параметры:', params);
    
    const result = await db.query(query, params);
    console.log('Результат:', result.rows.length, 'заявок');
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заявок на закупку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить заявку по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем заявку
    const requestResult = await db.query(`
      SELECT 
        pr.*,
        o.order_number,
        c.name as customer_name
      FROM purchase_requests pr
      LEFT JOIN orders o ON pr.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE pr.id = $1 AND pr.is_active = true
    `, [id]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заявка на закупку не найдена' });
    }
    
    // Получаем позиции заявки
    const itemsResult = await db.query(`
      SELECT * FROM purchase_request_items 
      WHERE purchase_request_id = $1 
      ORDER BY id
    `, [id]);
    
    const request = requestResult.rows[0];
    request.items = itemsResult.rows;
    
    res.json(request);
  } catch (error) {
    console.error('Ошибка получения заявки на закупку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать заявку на закупку
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = purchaseRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { order_id, title, description, priority, items } = value;
    
    // Генерируем номер заявки
    const requestNumberResult = await db.query('SELECT generate_purchase_request_number() as request_number');
    const requestNumber = requestNumberResult.rows[0].request_number;
    
    // Рассчитываем общую сумму
    const totalAmount = items.reduce((sum, item) => {
      const itemTotal = (item.required_quantity || 0) * (item.estimated_price || 0);
      return sum + itemTotal;
    }, 0);
    
    // Создаем заявку
    const requestResult = await db.query(`
      INSERT INTO purchase_requests (
        order_id, request_number, title, description, priority, 
        total_amount, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      order_id,
      requestNumber,
      title,
      description,
      priority,
      totalAmount,
      req.user.id,
      'pending'
    ]);
    
    const requestId = requestResult.rows[0].id;
    
    // Создаем позиции заявки
    for (const item of items) {
      const itemTotal = (item.required_quantity || 0) * (item.estimated_price || 0);
      
      await db.query(`
        INSERT INTO purchase_request_items (
          purchase_request_id, material_name, required_quantity, unit,
          estimated_price, total_price, supplier_name, supplier_contact, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        requestId,
        item.material_name,
        item.required_quantity,
        item.unit,
        item.estimated_price,
        itemTotal,
        item.supplier_name,
        item.supplier_contact,
        item.notes
      ]);
    }
    
    console.log(`Создана заявка на закупку ${requestNumber} с ${items.length} позициями`);
    res.status(201).json({
      success: true,
      message: 'Заявка на закупку создана',
      request: requestResult.rows[0],
      items_count: items.length
    });
    
  } catch (error) {
    console.error('Ошибка создания заявки на закупку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить заявку на закупку
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePurchaseRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const updateFields = [];
    const params = [];
    let paramCount = 0;
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        params.push(value[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Нет полей для обновления' });
    }
    
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const query = `
      UPDATE purchase_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заявка на закупку не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления заявки на закупку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить заявку на закупку
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE purchase_requests SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заявка на закупку не найдена' });
    }
    
    res.json({ message: 'Заявка на закупку удалена' });
  } catch (error) {
    console.error('Ошибка удаления заявки на закупку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Схема валидации для позиции заявки
const purchaseRequestItemSchema = Joi.object({
  material_name: Joi.string().required(),
  required_quantity: Joi.number().precision(2).min(0.01).required(),
  unit: Joi.string().max(50).required(),
  estimated_price: Joi.number().precision(2).min(0).default(0),
  supplier_name: Joi.string().allow('', null),
  supplier_contact: Joi.string().allow('', null),
  notes: Joi.string().allow('', null)
});

// Добавить позицию к заявке на закупку
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = purchaseRequestItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Проверяем, что заявка существует
    const requestResult = await db.query(
      'SELECT id FROM purchase_requests WHERE id = $1 AND is_active = true',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заявка на закупку не найдена' });
    }

    // Рассчитываем стоимость позиции
    const itemTotal = (value.required_quantity || 0) * (value.estimated_price || 0);

    // Добавляем позицию
    const itemResult = await db.query(`
      INSERT INTO purchase_request_items (
        purchase_request_id, material_name, required_quantity, unit,
        estimated_price, total_price, supplier_name, supplier_contact, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      id,
      value.material_name,
      value.required_quantity,
      value.unit,
      value.estimated_price,
      itemTotal,
      value.supplier_name,
      value.supplier_contact,
      value.notes
    ]);

    // Обновляем общую сумму заявки
    const totalResult = await db.query(`
      SELECT SUM(total_price) as total FROM purchase_request_items 
      WHERE purchase_request_id = $1
    `, [id]);

    const newTotal = totalResult.rows[0].total || 0;
    await db.query(
      'UPDATE purchase_requests SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newTotal, id]
    );

    res.status(201).json({
      success: true,
      message: 'Позиция добавлена',
      item: itemResult.rows[0]
    });

  } catch (error) {
    console.error('Ошибка добавления позиции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить позицию заявки на закупку
router.put('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { error, value } = purchaseRequestItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Проверяем, что заявка и позиция существуют
    const checkResult = await db.query(`
      SELECT pri.id FROM purchase_request_items pri
      JOIN purchase_requests pr ON pri.purchase_request_id = pr.id
      WHERE pri.id = $1 AND pr.id = $2 AND pr.is_active = true
    `, [itemId, id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Позиция не найдена' });
    }

    // Рассчитываем новую стоимость позиции
    const itemTotal = (value.required_quantity || 0) * (value.estimated_price || 0);

    // Обновляем позицию
    const itemResult = await db.query(`
      UPDATE purchase_request_items SET
        material_name = $1,
        required_quantity = $2,
        unit = $3,
        estimated_price = $4,
        total_price = $5,
        supplier_name = $6,
        supplier_contact = $7,
        notes = $8
      WHERE id = $9
      RETURNING *
    `, [
      value.material_name,
      value.required_quantity,
      value.unit,
      value.estimated_price,
      itemTotal,
      value.supplier_name,
      value.supplier_contact,
      value.notes,
      itemId
    ]);

    // Обновляем общую сумму заявки
    const totalResult = await db.query(`
      SELECT SUM(total_price) as total FROM purchase_request_items 
      WHERE purchase_request_id = $1
    `, [id]);

    const newTotal = totalResult.rows[0].total || 0;
    await db.query(
      'UPDATE purchase_requests SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newTotal, id]
    );

    res.json({
      success: true,
      message: 'Позиция обновлена',
      item: itemResult.rows[0]
    });

  } catch (error) {
    console.error('Ошибка обновления позиции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить позицию заявки на закупку
router.delete('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;

    // Проверяем, что заявка и позиция существуют
    const checkResult = await db.query(`
      SELECT pri.id FROM purchase_request_items pri
      JOIN purchase_requests pr ON pri.purchase_request_id = pr.id
      WHERE pri.id = $1 AND pr.id = $2 AND pr.is_active = true
    `, [itemId, id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Позиция не найдена' });
    }

    // Удаляем позицию
    await db.query('DELETE FROM purchase_request_items WHERE id = $1', [itemId]);

    // Обновляем общую сумму заявки
    const totalResult = await db.query(`
      SELECT SUM(total_price) as total FROM purchase_request_items 
      WHERE purchase_request_id = $1
    `, [id]);

    const newTotal = totalResult.rows[0].total || 0;
    await db.query(
      'UPDATE purchase_requests SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newTotal, id]
    );

    res.json({
      success: true,
      message: 'Позиция удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления позиции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
