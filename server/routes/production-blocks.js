const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Проверка материалов для конкретного этапа
router.post('/check-materials/:orderId/:stage', authenticateToken, async (req, res) => {
  try {
    const { orderId, stage } = req.params;
    
    // Получаем материалы заказа
    const orderMaterials = await db.query(`
      SELECT DISTINCT om.material_name, om.required_quantity, om.unit
      FROM order_materials om
      WHERE om.order_id = $1
    `, [parseInt(orderId)]);
    
    // Получаем требования для этапа
    const stageRequirements = await db.query(`
      SELECT pr.material_name, pr.required_quantity, pr.unit
      FROM production_requirements pr
      WHERE pr.stage = $1 AND pr.is_required = true
    `, [stage]);
    
    const materials = [];
    
    // Проверяем каждый материал
    for (const orderMaterial of orderMaterials.rows) {
      // Проверяем, нужен ли этот материал для данного этапа
      const requirement = stageRequirements.rows.find(r => 
        r.material_name.toLowerCase() === orderMaterial.material_name.toLowerCase()
      );
      
      if (requirement) {
        // Получаем текущий остаток материала
        const materialStock = await db.query(`
          SELECT current_stock FROM materials 
          WHERE LOWER(name) = LOWER($1)
        `, [orderMaterial.material_name]);
        
        const availableQuantity = materialStock.rows.length > 0 
          ? parseFloat(materialStock.rows[0].current_stock) || 0 
          : 0;
        
        const requiredQuantity = parseFloat(orderMaterial.required_quantity);
        const missingQuantity = Math.max(0, requiredQuantity - availableQuantity);
        const isBlocked = requiredQuantity > availableQuantity;
        
        materials.push({
          material_name: orderMaterial.material_name,
          required_quantity: requiredQuantity,
          available_quantity: availableQuantity,
          missing_quantity: missingQuantity,
          unit: orderMaterial.unit,
          is_blocked: isBlocked
        });
      }
    }
    
    const hasBlockedMaterials = materials.some(m => m.is_blocked);
    
    res.json({
      success: true,
      stage,
      materials,
      hasBlockedMaterials,
      blockedCount: materials.filter(m => m.is_blocked).length
    });
  } catch (error) {
    console.error('Ошибка проверки материалов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение всех блокировок для заказа
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await db.query(`
      SELECT 
        pb.*,
        o.order_number,
        o.product_name
      FROM production_blocks pb
      JOIN orders o ON pb.order_id = o.id
      WHERE pb.order_id = $1 AND pb.status = 'active'
      ORDER BY pb.blocked_at DESC
    `, [orderId]);
    
    res.json({
      success: true,
      blocks: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения блокировок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение всех активных блокировок
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { stage, material_type } = req.query;
    
    let query = `
      SELECT 
        pb.*,
        o.order_number,
        o.product_name,
        o.priority,
        o.delivery_date
      FROM production_blocks pb
      JOIN orders o ON pb.order_id = o.id
      WHERE pb.status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (stage) {
      paramCount++;
      query += ` AND pb.stage = $${paramCount}`;
      params.push(stage);
    }
    
    if (material_type) {
      paramCount++;
      query += ` AND pb.material_type = $${paramCount}`;
      params.push(material_type);
    }
    
    query += ' ORDER BY pb.blocked_at DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      blocks: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения активных блокировок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Создание блокировки
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      order_id,
      stage,
      material_type,
      material_name,
      required_quantity,
      available_quantity,
      missing_quantity,
      unit,
      notes
    } = req.body;
    
    const result = await db.query(`
      INSERT INTO production_blocks (
        order_id, stage, material_type, material_name,
        required_quantity, available_quantity, missing_quantity,
        unit, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      order_id, stage, material_type, material_name,
      required_quantity, available_quantity, missing_quantity,
      unit, notes, req.user.userId
    ]);
    
    // Обновляем блокировки заказа
    await db.query('SELECT update_order_blocks($1)', [order_id]);
    
    res.json({
      success: true,
      block: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания блокировки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Разрешение блокировки
router.put('/resolve/:blockId', authenticateToken, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { notes } = req.body;
    
    const result = await db.query(`
      UPDATE production_blocks 
      SET 
        status = 'resolved',
        resolved_at = CURRENT_TIMESTAMP,
        notes = COALESCE($2, notes)
      WHERE id = $1
      RETURNING *
    `, [blockId, notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Блокировка не найдена'
      });
    }
    
    // Обновляем блокировки заказа
    await db.query('SELECT update_order_blocks($1)', [result.rows[0].order_id]);
    
    res.json({
      success: true,
      block: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка разрешения блокировки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Игнорирование блокировки
router.put('/ignore/:blockId', authenticateToken, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { notes } = req.body;
    
    const result = await db.query(`
      UPDATE production_blocks 
      SET 
        status = 'ignored',
        notes = COALESCE($2, notes)
      WHERE id = $1
      RETURNING *
    `, [blockId, notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Блокировка не найдена'
      });
    }
    
    res.json({
      success: true,
      block: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка игнорирования блокировки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение статистики блокировок
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        stage,
        material_type,
        COUNT(*) as total_blocks,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_blocks,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_blocks,
        COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_blocks
      FROM production_blocks
      GROUP BY stage, material_type
      ORDER BY stage, material_type
    `);
    
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_blocks,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_blocks,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_blocks,
        COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_blocks
      FROM production_blocks
    `);
    
    res.json({
      success: true,
      summary: summary.rows[0],
      byStage: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики блокировок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Автоматическая проверка всех заказов
router.post('/check-all-orders', authenticateToken, async (req, res) => {
  try {
    // Получаем все заказы в производстве
    const ordersResult = await db.query(`
      SELECT id FROM orders 
      WHERE status = 'in_production' 
      AND blocked_by_materials = false
    `);
    
    const checkedOrders = [];
    const newBlocks = [];
    
    for (const order of ordersResult.rows) {
      // Проверяем каждый этап
      const stages = ['frame', 'upholstery', 'foam_molding', 'assembly'];
      
      for (const stage of stages) {
        const materialsResult = await db.query(
          'SELECT * FROM check_materials_for_stage($1, $2)',
          [order.id, stage]
        );
        
        const blockedMaterials = materialsResult.rows.filter(m => m.is_blocked);
        
        for (const material of blockedMaterials) {
          // Проверяем, есть ли уже такая блокировка
          const existingBlock = await db.query(`
            SELECT id FROM production_blocks 
            WHERE order_id = $1 AND stage = $2 AND material_name = $3 AND status = 'active'
          `, [order.id, stage, material.material_name]);
          
          if (existingBlock.rows.length === 0) {
            // Создаем новую блокировку
            const blockResult = await db.query(`
              INSERT INTO production_blocks (
                order_id, stage, material_type, material_name,
                required_quantity, available_quantity, missing_quantity,
                unit, created_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *
            `, [
              order.id, stage, 'unknown', material.material_name,
              material.required_quantity, material.available_quantity, material.missing_quantity,
              material.unit, req.user.userId
            ]);
            
            newBlocks.push(blockResult.rows[0]);
          }
        }
        
        // Обновляем блокировки заказа
        await db.query('SELECT update_order_blocks($1)', [order.id]);
      }
      
      checkedOrders.push(order.id);
    }
    
    res.json({
      success: true,
      checkedOrders: checkedOrders.length,
      newBlocks: newBlocks.length,
      blocks: newBlocks
    });
  } catch (error) {
    console.error('Ошибка автоматической проверки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

module.exports = router;
