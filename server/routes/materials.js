const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Поиск материалов для автодополнения (должен быть первым!)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10, category_id } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    let sql = `
      SELECT 
        m.id,
        m.name,
        m.current_stock,
        m.unit,
        m.price_per_unit,
        c.name as category_name,
        c.color as category_color,
        (m.current_stock * COALESCE(m.price_per_unit, 0)) as total_value
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_active = true 
        AND m.name ILIKE $1
    `;
    
    const params = [`%${q}%`];
    let paramCount = 1;

    if (category_id) {
      paramCount++;
      sql += ` AND m.category_id = $${paramCount}`;
      params.push(category_id);
    }

    sql += ` ORDER BY m.name LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при поиске материалов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение всех материалов
router.get('/', async (req, res) => {
  try {
    const { category_id, low_stock, search } = req.query;
    
    let sql = `
      SELECT 
        m.*,
        c.name as category_name,
        c.color as category_color
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Фильтр по категории
    if (category_id) {
      paramCount++;
      sql += ` AND m.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    // Фильтр по низкому остатку
    if (low_stock === 'true') {
      sql += ` AND m.current_stock <= LEAST(m.min_stock, 5)`;
    }
    
    // Поиск по названию
    if (search) {
      paramCount++;
      sql += ` AND m.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }
    
    sql += ` ORDER BY m.name`;
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении материалов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение материала по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        m.*,
        c.name as category_name
      FROM materials m
      LEFT JOIN material_categories c ON m.category_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении материала:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создание нового материала
router.post('/', async (req, res) => {
  try {
    const { name, category_id, current_stock, unit, min_stock, price_per_unit, notes } = req.body;
    
    if (!name || !category_id) {
      return res.status(400).json({ message: 'Название и категория обязательны' });
    }
    
    const result = await db.query(`
      INSERT INTO materials (name, category_id, current_stock, unit, min_stock, price_per_unit, notes, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
      RETURNING *
    `, [name, category_id, current_stock || 0, unit || 'шт', min_stock || 0, price_per_unit || 0, notes || '']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании материала:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление материала
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, quantity, unit, minimum, description } = req.body;
    
    const result = await db.query(`
      UPDATE materials 
      SET 
        name = COALESCE($2, name),
        category_id = COALESCE($3, category_id),
        quantity = COALESCE($4, quantity),
        unit = COALESCE($5, unit),
        minimum = COALESCE($6, minimum),
        description = COALESCE($7, description),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, name, category_id, quantity, unit, minimum, description]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении материала:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Удаление материала
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM materials WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }
    
    res.json({ message: 'Материал удален', material: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении материала:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Операции с материалами (приход/списание)
router.post('/:id/operations', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, note, user_id } = req.body;
    
    if (!type || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Тип операции и количество обязательны' });
    }
    
    // Получаем текущее количество материала
    const materialResult = await db.query('SELECT quantity FROM materials WHERE id = $1', [id]);
    
    if (materialResult.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }
    
    const currentQuantity = materialResult.rows[0].quantity;
    let newQuantity;
    
    if (type === 'add') {
      newQuantity = currentQuantity + quantity;
    } else if (type === 'remove') {
      newQuantity = Math.max(0, currentQuantity - quantity);
    } else {
      return res.status(400).json({ message: 'Неверный тип операции' });
    }
    
    // Обновляем количество материала
    await db.query('UPDATE materials SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQuantity, id]);
    
    // Записываем операцию в историю
    await db.query(`
      INSERT INTO material_operations (material_id, type, quantity, note, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [id, type, quantity, note || '', user_id || null]);
    
    res.json({ 
      message: 'Операция выполнена', 
      newQuantity,
      operation: { type, quantity, note }
    });
  } catch (error) {
    console.error('Ошибка при выполнении операции:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение истории операций с материалом
router.get('/:id/operations', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        mo.*,
        u.name as user_name
      FROM material_operations mo
      LEFT JOIN users u ON mo.user_id = u.id
      WHERE mo.material_id = $1
      ORDER BY mo.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении истории операций:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Поиск материалов
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { category } = req.query;
    
    let sql = `
      SELECT 
        m.*,
        c.name as category_name
      FROM materials m
      LEFT JOIN material_categories c ON m.category_id = c.id
      WHERE m.name ILIKE $1
    `;
    
    const params = [`%${query}%`];
    
    if (category) {
      sql += ' AND m.category_id = $2';
      params.push(category);
    }
    
    sql += ' ORDER BY m.name LIMIT 10';
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при поиске материалов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение статистики склада
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_materials,
        COUNT(CASE WHEN current_stock <= LEAST(min_stock, 5) THEN 1 END) as low_stock_materials,
        SUM(current_stock * COALESCE(price_per_unit, 0)) as total_value,
        COUNT(CASE WHEN current_stock > LEAST(min_stock, 5) THEN 1 END) as normal_stock_materials,
        AVG(current_stock * COALESCE(price_per_unit, 0)) as avg_material_value,
        MAX(current_stock * COALESCE(price_per_unit, 0)) as max_material_value,
        MIN(current_stock * COALESCE(price_per_unit, 0)) as min_material_value,
        COUNT(DISTINCT category_id) as categories_count,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as zero_stock_materials,
        COUNT(CASE WHEN current_stock > 0 AND current_stock <= LEAST(min_stock, 5) THEN 1 END) as critical_stock_materials
      FROM materials
      WHERE is_active = true
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение статистики по категориям
router.get('/stats/by-category', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id,
        c.name as category_name,
        c.color as category_color,
        COUNT(m.id) as materials_count,
        COUNT(CASE WHEN m.current_stock <= LEAST(m.min_stock, 5) THEN 1 END) as low_stock_count,
        SUM(m.current_stock * COALESCE(m.price_per_unit, 0)) as category_value
      FROM categories c
      LEFT JOIN materials m ON c.id = m.category_id AND m.is_active = true
      GROUP BY c.id, c.name, c.color
      ORDER BY c.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении статистики по категориям:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение топ материалов по стоимости
router.get('/stats/top-materials', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.current_stock,
        m.unit,
        m.price_per_unit,
        c.name as category_name,
        c.color as category_color,
        (m.current_stock * COALESCE(m.price_per_unit, 0)) as total_value
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_active = true
      ORDER BY total_value DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении топ материалов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Приход материалов (увеличение остатка)
router.post('/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, supplier } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Количество должно быть больше 0' });
    }

    // Получаем текущий остаток
    const materialResult = await db.query('SELECT current_stock FROM materials WHERE id = $1', [id]);
    if (materialResult.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    const currentStock = parseFloat(materialResult.rows[0].current_stock);
    const newStock = currentStock + parseFloat(quantity);

    // Обновляем остаток
    await db.query(
      'UPDATE materials SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, id]
    );

    // Записываем операцию в журнал (если есть таблица для этого)
    // Пока просто логируем
    console.log(`Приход материала ID ${id}: +${quantity}, новый остаток: ${newStock}`);

    res.json({ 
      message: 'Приход успешно оформлен',
      new_stock: newStock,
      added_quantity: quantity
    });
  } catch (error) {
    console.error('Ошибка при оформлении прихода:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Списание материалов (уменьшение остатка)
router.post('/:id/issue', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, purpose } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Количество должно быть больше 0' });
    }

    // Получаем текущий остаток
    const materialResult = await db.query('SELECT current_stock, name FROM materials WHERE id = $1', [id]);
    if (materialResult.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    const currentStock = parseFloat(materialResult.rows[0].current_stock);
    const requestedQuantity = parseFloat(quantity);

    if (requestedQuantity > currentStock) {
      return res.status(400).json({ 
        message: `Недостаточно материала. Доступно: ${currentStock}, запрошено: ${requestedQuantity}` 
      });
    }

    const newStock = currentStock - requestedQuantity;

    // Обновляем остаток
    await db.query(
      'UPDATE materials SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, id]
    );

    // Записываем операцию в журнал
    console.log(`Списание материала ID ${id}: -${quantity}, новый остаток: ${newStock}`);

    res.json({ 
      message: 'Списание успешно оформлено',
      new_stock: newStock,
      issued_quantity: quantity
    });
  } catch (error) {
    console.error('Ошибка при оформлении списания:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Корректировка остатка
router.post('/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_quantity, reason, notes } = req.body;

    if (new_quantity < 0) {
      return res.status(400).json({ message: 'Остаток не может быть отрицательным' });
    }

    // Получаем текущий остаток
    const materialResult = await db.query('SELECT current_stock, name FROM materials WHERE id = $1', [id]);
    if (materialResult.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    const oldStock = parseFloat(materialResult.rows[0].current_stock);
    const difference = parseFloat(new_quantity) - oldStock;

    // Обновляем остаток
    await db.query(
      'UPDATE materials SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [new_quantity, id]
    );

    // Записываем операцию в журнал
    console.log(`Корректировка материала ID ${id}: ${oldStock} → ${new_quantity} (${difference > 0 ? '+' : ''}${difference})`);

    res.json({ 
      message: 'Корректировка успешно выполнена',
      old_stock: oldStock,
      new_stock: new_quantity,
      difference: difference
    });
  } catch (error) {
    console.error('Ошибка при корректировке остатка:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;