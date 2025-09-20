const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Получить все остатки на складе
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category_id, location, min_stock, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        ws.*,
        ml.name as material_name,
        ml.unit,
        ml.base_price,
        ml.current_price,
        ml.description,
        mc.name as category_name,
        mc.color as category_color,
        s.name as supplier_name
      FROM warehouse_stock ws
      JOIN materials_library ml ON ws.material_library_id = ml.id
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      LEFT JOIN suppliers s ON ws.supplier_id = s.id
      WHERE ws.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (ml.name ILIKE $${paramCount} OR ml.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND ml.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (location) {
      paramCount++;
      query += ` AND ws.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }
    
    if (min_stock) {
      paramCount++;
      query += ` AND ws.current_stock <= $${paramCount}`;
      params.push(min_stock);
    }
    
    query += ` ORDER BY ml.name ASC`;
    
    // Добавляем пагинацию
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push((parseInt(page) - 1) * parseInt(limit));
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения остатков на складе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить остаток конкретного материала
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        ws.*,
        ml.name as material_name,
        ml.unit,
        ml.base_price,
        ml.current_price,
        ml.description,
        mc.name as category_name,
        s.name as supplier_name
      FROM warehouse_stock ws
      JOIN materials_library ml ON ws.material_library_id = ml.id
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      LEFT JOIN suppliers s ON ws.supplier_id = s.id
      WHERE ws.id = $1 AND ws.is_active = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения остатка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новый остаток на складе
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      material_library_id, 
      current_stock, 
      min_stock, 
      max_stock, 
      location, 
      supplier_id, 
      notes 
    } = req.body;
    
    // Проверяем, что материал существует в библиотеке
    const materialCheck = await db.query(
      'SELECT id FROM materials_library WHERE id = $1 AND is_active = true',
      [material_library_id]
    );
    
    if (materialCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Материал не найден в библиотеке' });
    }
    
    // Проверяем, что остаток для этого материала еще не создан
    const existingStock = await db.query(
      'SELECT id FROM warehouse_stock WHERE material_library_id = $1 AND is_active = true',
      [material_library_id]
    );
    
    if (existingStock.rows.length > 0) {
      return res.status(400).json({ error: 'Остаток для этого материала уже существует' });
    }
    
    const result = await db.query(`
      INSERT INTO warehouse_stock (
        material_library_id, current_stock, min_stock, max_stock, 
        location, supplier_id, notes, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      material_library_id,
      parseFloat(current_stock) || 0,
      parseFloat(min_stock) || 0,
      parseFloat(max_stock) || 0,
      location || 'Основной склад',
      supplier_id || null,
      notes || null,
      req.user.id
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания остатка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить остаток
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      current_stock, 
      min_stock, 
      max_stock, 
      location, 
      supplier_id, 
      notes 
    } = req.body;
    
    const result = await db.query(`
      UPDATE warehouse_stock 
      SET 
        current_stock = $1,
        min_stock = $2,
        max_stock = $3,
        location = $4,
        supplier_id = $5,
        notes = $6,
        updated_by = $7,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $8 AND is_active = true
      RETURNING *
    `, [
      parseFloat(current_stock) || 0,
      parseFloat(min_stock) || 0,
      parseFloat(max_stock) || 0,
      location,
      supplier_id || null,
      notes || null,
      req.user.id,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления остатка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Списание материалов (уменьшение остатка)
router.post('/:id/consume', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, purpose, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Количество должно быть больше 0' });
    }
    
    // Получаем текущий остаток
    const stockResult = await db.query(
      'SELECT current_stock, material_library_id FROM warehouse_stock WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    const currentStock = parseFloat(stockResult.rows[0].current_stock);
    const requestedQuantity = parseFloat(quantity);
    
    if (requestedQuantity > currentStock) {
      return res.status(400).json({ 
        error: `Недостаточно материала. Доступно: ${currentStock}, запрошено: ${requestedQuantity}` 
      });
    }
    
    const newStock = currentStock - requestedQuantity;
    
    // Обновляем остаток
    await db.query(
      'UPDATE warehouse_stock SET current_stock = $1, last_updated = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
      [newStock, req.user.id, id]
    );
    
    // Записываем операцию в журнал (можно добавить таблицу material_transactions)
    console.log(`Списание материала ID ${id}: -${quantity}, новый остаток: ${newStock}, цель: ${purpose}`);
    
    res.json({ 
      message: 'Списание успешно оформлено',
      new_stock: newStock,
      consumed_quantity: quantity
    });
  } catch (error) {
    console.error('Ошибка при списании:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Поступление материалов (увеличение остатка)
router.post('/:id/receive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, supplier_id, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Количество должно быть больше 0' });
    }
    
    // Получаем текущий остаток
    const stockResult = await db.query(
      'SELECT current_stock FROM warehouse_stock WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    const currentStock = parseFloat(stockResult.rows[0].current_stock);
    const receivedQuantity = parseFloat(quantity);
    const newStock = currentStock + receivedQuantity;
    
    // Обновляем остаток
    await db.query(
      'UPDATE warehouse_stock SET current_stock = $1, last_updated = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
      [newStock, req.user.id, id]
    );
    
    // Обновляем поставщика если указан
    if (supplier_id) {
      await db.query(
        'UPDATE warehouse_stock SET supplier_id = $1 WHERE id = $2',
        [supplier_id, id]
      );
    }
    
    console.log(`Поступление материала ID ${id}: +${quantity}, новый остаток: ${newStock}`);
    
    res.json({ 
      message: 'Поступление успешно оформлено',
      new_stock: newStock,
      received_quantity: quantity
    });
  } catch (error) {
    console.error('Ошибка при поступлении:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Корректировка остатка
router.post('/:id/adjust', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_quantity, reason, notes } = req.body;
    
    if (new_quantity < 0) {
      return res.status(400).json({ error: 'Остаток не может быть отрицательным' });
    }
    
    // Получаем текущий остаток
    const stockResult = await db.query(
      'SELECT current_stock FROM warehouse_stock WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    const oldStock = parseFloat(stockResult.rows[0].current_stock);
    const difference = parseFloat(new_quantity) - oldStock;
    
    // Обновляем остаток
    await db.query(
      'UPDATE warehouse_stock SET current_stock = $1, last_updated = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
      [new_quantity, req.user.id, id]
    );
    
    console.log(`Корректировка материала ID ${id}: ${oldStock} → ${new_quantity} (${difference > 0 ? '+' : ''}${difference}), причина: ${reason}`);
    
    res.json({ 
      message: 'Корректировка успешно выполнена',
      old_stock: oldStock,
      new_stock: new_quantity,
      difference: difference
    });
  } catch (error) {
    console.error('Ошибка при корректировке:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить остаток (мягкое удаление)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE warehouse_stock SET is_active = false, updated_by = $1 WHERE id = $2 RETURNING *',
      [req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Остаток не найден' });
    }
    
    res.json({ message: 'Остаток успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении остатка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка остатков для заказа (новая функция)
router.post('/check-order-materials', authenticateToken, async (req, res) => {
  try {
    const { materials } = req.body; // массив { material_name, required_quantity, unit }
    
    if (!materials || !Array.isArray(materials)) {
      return res.status(400).json({ error: 'Необходимо передать массив материалов' });
    }
    
    const results = [];
    
    for (const material of materials) {
      // Ищем материал в библиотеке
      const libraryResult = await db.query(`
        SELECT id, name, unit FROM materials_library 
        WHERE LOWER(name) = LOWER($1) AND is_active = true
      `, [material.material_name]);
      
      if (libraryResult.rows.length === 0) {
        results.push({
          material_name: material.material_name,
          required_quantity: material.required_quantity,
          available_quantity: 0,
          missing_quantity: material.required_quantity,
          unit: material.unit,
          is_available: false,
          status: 'not_in_library'
        });
        continue;
      }
      
      const libraryMaterial = libraryResult.rows[0];
      
      // Ищем остаток на складе
      const stockResult = await db.query(`
        SELECT current_stock, min_stock FROM warehouse_stock 
        WHERE material_library_id = $1 AND is_active = true
      `, [libraryMaterial.id]);
      
      const availableQuantity = stockResult.rows.length > 0 
        ? parseFloat(stockResult.rows[0].current_stock) || 0 
        : 0;
      
      const requiredQuantity = parseFloat(material.required_quantity);
      const missingQuantity = Math.max(0, requiredQuantity - availableQuantity);
      const isAvailable = requiredQuantity <= availableQuantity;
      
      results.push({
        material_name: material.material_name,
        required_quantity: requiredQuantity,
        available_quantity: availableQuantity,
        missing_quantity: missingQuantity,
        unit: material.unit,
        is_available: isAvailable,
        status: isAvailable ? 'available' : 'insufficient_stock',
        min_stock: stockResult.rows.length > 0 ? stockResult.rows[0].min_stock : 0
      });
    }
    
    const hasInsufficientStock = results.some(r => !r.is_available);
    
    res.json({
      success: true,
      materials: results,
      has_insufficient_stock: hasInsufficientStock,
      insufficient_count: results.filter(r => !r.is_available).length
    });
  } catch (error) {
    console.error('Ошибка проверки остатков:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;

