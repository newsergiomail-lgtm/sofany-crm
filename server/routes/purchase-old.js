const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Извлечение материалов из заказа (из calculator_data)
const extractMaterialsFromOrder = async (orderId) => {
  try {
    console.log('Извлечение материалов для заказа:', orderId);
    
    // Получаем данные заказа
    const orderResult = await db.query(`
      SELECT id, status 
      FROM orders 
      WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Заказ не найден');
    }

    const order = orderResult.rows[0];
    console.log('Данные заказа получены:', {
      has_calculator_data: !!order.calculator_data,
      calculator_data_type: typeof order.calculator_data,
      calculator_data_length: order.calculator_data ? order.calculator_data.length : 0
    });
    
    const materials = [];

    if (order.calculator_data) {
      let calculatorData;
      try {
        calculatorData = typeof order.calculator_data === 'string' 
          ? JSON.parse(order.calculator_data) 
          : order.calculator_data;
      } catch (error) {
        console.error('Ошибка парсинга calculator_data:', error);
        calculatorData = order.calculator_data;
      }
      
      // Обрабатываем вложенную структуру calculator_data
      const actualData = calculatorData.calculator_data?.original_calculator_data || 
                        calculatorData.calculator_data || 
                        calculatorData;
      
      
      const { config, bom } = actualData;

      // Извлекаем ткань
      if (bom.fabric_m && bom.fabric_m > 0) {
        materials.push({
          material_name: `Ткань ${config.materials.fabric || 'не указана'}`,
          required_quantity: bom.fabric_m,
          unit: 'м',
          estimated_price: config.materials.fabric_cost_rub || 0,
          source: 'calculator'
        });
      }

      // Извлекаем ППУ слои
      if (bom.pu && bom.pu.layers) {
        bom.pu.layers.forEach((layer, index) => {
          if (layer.brand && layer.weight_kg > 0) {
            materials.push({
              material_name: `ППУ ${layer.brand} (${layer.thickness_mm}мм)`,
              required_quantity: layer.weight_kg,
              unit: 'кг',
              estimated_price: layer.cost_rub || 0,
              source: 'calculator'
            });
          }
        });
      }

      // Извлекаем материалы из текстового списка
      if (bom.materials_list_text) {
        const materialLines = bom.materials_list_text.split('\n').filter(line => line.trim());
        materialLines.forEach(line => {
          if (line.trim()) {
            materials.push({
              material_name: line.trim(),
              required_quantity: 1,
              unit: 'шт',
              estimated_price: 0,
              source: 'calculator'
            });
          }
        });
      }

      // Извлекаем каркас
      if (config.materials.frame) {
        materials.push({
          material_name: `Каркас ${config.materials.frame}`,
          required_quantity: 1,
          unit: 'шт',
          estimated_price: config.materials.supports_rub || 0,
          source: 'calculator'
        });
      }

      // Извлекаем механизм
      if (config.mechanism && config.mechanism.cost_rub > 0) {
        materials.push({
          material_name: `Механизм ${config.mechanism.code || 'не указан'}`,
          required_quantity: 1,
          unit: 'шт',
          estimated_price: config.mechanism.cost_rub,
          source: 'calculator'
        });
      }
    }

    // Сохраняем извлеченные материалы в БД
    for (const material of materials) {
      await db.query(`
        INSERT INTO order_materials (order_id, material_name, required_quantity, unit, estimated_price, source)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [orderId, material.material_name, material.required_quantity, material.unit, material.estimated_price, material.source]);
    }

    return materials;
  } catch (error) {
    console.error('Ошибка при извлечении материалов:', error);
    throw error;
  }
};

// Извлечение материалов из позиций заказа (order_items)
const extractMaterialsFromOrderItems = async (orderId) => {
  try {
    console.log('Извлечение материалов из позиций заказа:', orderId);
    
    // Получаем позиции заказа
    const orderItemsResult = await db.query(`
      SELECT material_name as name, required_quantity as quantity, unit_price, material_name_full as description
      FROM order_materials 
      WHERE order_id = $1
    `, [orderId]);

    const materials = orderItemsResult.rows.map(item => ({
      material_name: item.name,
      required_quantity: parseFloat(item.quantity) || 1,
      unit: 'шт', // Позиции заказа обычно в штуках
      estimated_price: parseFloat(item.unit_price) || 0,
      source: 'order_items',
      description: item.description
    }));

    console.log('Извлечено материалов из позиций заказа:', materials.length);
    return materials;
  } catch (error) {
    console.error('Ошибка при извлечении материалов из позиций заказа:', error);
    throw error;
  }
};

// Проверка наличия материалов на складе
router.post('/check-materials/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Извлекаем материалы из калькулятора
    const calculatorMaterials = await extractMaterialsFromOrder(orderId);
    
    // Извлекаем материалы из позиций заказа
    const orderItemMaterials = await extractMaterialsFromOrderItems(orderId);
    
    // Объединяем все материалы
    const allMaterials = [...calculatorMaterials, ...orderItemMaterials];
    
    console.log('Всего материалов для проверки:', allMaterials.length);
    console.log('Из калькулятора:', calculatorMaterials.length);
    console.log('Из позиций заказа:', orderItemMaterials.length);
    
    // Проверяем наличие каждого материала на складе (новая архитектура)
    const materialCheckResults = [];
    
    for (const material of allMaterials) {
      // Ищем материал в библиотеке
      const libraryResult = await db.query(`
        SELECT id, name, unit, base_price, current_price
        FROM materials_library 
        WHERE LOWER(name) = LOWER($1) AND is_active = true
        ORDER BY name
        LIMIT 1
      `, [material.material_name]);
      
      if (libraryResult.rows.length === 0) {
        // Материал не найден в библиотеке
        materialCheckResults.push({
          ...material,
          material_id: null,
          available_quantity: 0,
          missing_quantity: material.required_quantity,
          is_available: false,
          unit_price: material.estimated_price || 0,
          total_price: material.required_quantity * (material.estimated_price || 0),
          status: 'not_in_library'
        });
        continue;
      }
      
      const libraryMaterial = libraryResult.rows[0];
      
      // Ищем остаток на складе
      const stockResult = await db.query(`
        SELECT ws.id, ws.current_stock, ws.min_stock
        FROM warehouse_stock ws
        WHERE ws.material_library_id = $1 AND ws.is_active = true
        ORDER BY ws.current_stock DESC
        LIMIT 1
      `, [libraryMaterial.id]);
      
      const availableQuantity = stockResult.rows.length > 0 ? 
        parseFloat(stockResult.rows[0].current_stock) : 0;
      
      const missingQuantity = Math.max(0, material.required_quantity - availableQuantity);
      const unitPrice = libraryMaterial.current_price || libraryMaterial.base_price || material.estimated_price || 0;
      
      materialCheckResults.push({
        ...material,
        material_id: stockResult.rows.length > 0 ? stockResult.rows[0].id : null,
        library_material_id: libraryMaterial.id,
        available_quantity: availableQuantity,
        missing_quantity: missingQuantity,
        is_available: missingQuantity === 0,
        unit_price: unitPrice,
        total_price: missingQuantity * unitPrice,
        status: missingQuantity === 0 ? 'available' : 'insufficient_stock',
        min_stock: stockResult.rows.length > 0 ? stockResult.rows[0].min_stock : 0
      });
    }

    // Подсчитываем общую статистику
    const totalMaterials = materialCheckResults.length;
    const availableMaterials = materialCheckResults.filter(m => m.is_available).length;
    const missingMaterials = totalMaterials - availableMaterials;
    const totalMissingCost = materialCheckResults.reduce((sum, m) => sum + m.total_price, 0);

    res.json({
      success: true,
      order_id: orderId,
      materials: materialCheckResults,
      missing_materials: materialCheckResults.filter(m => !m.is_available),
      summary: {
        total_materials: totalMaterials,
        available_materials: availableMaterials,
        missing_materials: missingMaterials,
        total_missing_cost: totalMissingCost,
        availability_percentage: totalMaterials > 0 ? Math.round((availableMaterials / totalMaterials) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Ошибка при проверке материалов:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера', 
      details: error.message 
    });
  }
});

// Создание списка на закупку
router.post('/create-purchase-list/:orderId', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const { name, notes } = req.body;
    
    // Определяем, является ли orderId числом или строкой (order_number)
    const isNumericId = /^\d+$/.test(orderId);
    
    // Получаем ID заказа, если передан order_number
    let actualOrderId = orderId;
    if (!isNumericId) {
      const orderResult = await client.query(`
        SELECT id FROM orders WHERE order_number = $1
      `, [orderId]);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Заказ не найден'
        });
      }
      
      actualOrderId = orderResult.rows[0].id;
    }

    // Проверяем, есть ли уже список закупок для этого заказа
    const existingList = await client.query(`
      SELECT id FROM purchase_lists WHERE order_id = $1
    `, [actualOrderId]);

    if (existingList.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Список закупок для этого заказа уже существует',
        purchase_list_id: existingList.rows[0].id
      });
    }

    // Получаем данные заказа
    const orderResult = await client.query(`
      SELECT order_number, product_name FROM orders WHERE id = $1
    `, [actualOrderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Заказ не найден'
      });
    }

    const order = orderResult.rows[0];
    const listName = name || `Закупка для заказа ${order.order_number}`;

    // Создаем список закупок
    const purchaseListResult = await client.query(`
      INSERT INTO purchase_lists (order_id, name, status, created_by, notes)
      VALUES ($1, $2, 'pending', 1, $3)
      RETURNING id
    `, [actualOrderId, listName, notes || '']);

    const purchaseListId = purchaseListResult.rows[0].id;

    // Извлекаем материалы и создаем позиции списка закупок
    const materials = await extractMaterialsFromOrder(actualOrderId);
    let totalCost = 0;
    let materialsProcessed = 0;
    let missingMaterialsCount = 0;

    for (const material of materials) {
      materialsProcessed++;
      // Ищем материал на складе
      const materialResult = await client.query(`
        SELECT id, name, current_stock, unit, price_per_unit
        FROM materials 
        WHERE name ILIKE $1 AND is_active = true
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN name ILIKE $2 THEN 2
            ELSE 3
          END
        LIMIT 1
      `, [`%${material.material_name}%`, `%${material.material_name.split(' ')[0]}%`]);

      const availableQuantity = materialResult.rows.length > 0 ? 
        parseFloat(materialResult.rows[0].current_stock) : 0;
      
      const missingQuantity = Math.max(0, material.required_quantity - availableQuantity);
      const unitPrice = materialResult.rows.length > 0 ? 
        materialResult.rows[0].price_per_unit : material.estimated_price;
      
      const totalPrice = missingQuantity * unitPrice;
      totalCost += totalPrice;

      // Создаем позицию списка закупок только если есть недостающие материалы
      if (missingQuantity > 0) {
        missingMaterialsCount++;
        await client.query(`
          INSERT INTO purchase_list_items (
            purchase_list_id, material_id, material_name, required_quantity, 
            available_quantity, missing_quantity, unit, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          purchaseListId,
          materialResult.rows.length > 0 ? materialResult.rows[0].id : null,
          material.material_name,
          material.required_quantity,
          availableQuantity,
          missingQuantity,
          material.unit,
          unitPrice,
          totalPrice
        ]);
      }
    }

    // Обновляем общую стоимость списка закупок
    await client.query(`
      UPDATE purchase_lists SET total_cost = $1 WHERE id = $2
    `, [totalCost, purchaseListId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      purchase_list_id: purchaseListId,
      total_cost: totalCost,
      materials_count: materialsProcessed,
      missing_materials_count: missingMaterialsCount,
      message: 'Список на закупку успешно создан'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при создании списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Получение списка закупок для заказа
router.get('/purchase-lists/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await db.query(`
      SELECT 
        pl.*,
        o.order_number,
        o.product_name
      FROM purchase_lists pl
      JOIN orders o ON pl.order_id = o.id
      WHERE pl.order_id = $1
      ORDER BY pl.created_at DESC
    `, [orderId]);

    res.json({
      success: true,
      purchase_lists: result.rows
    });

  } catch (error) {
    console.error('Ошибка при получении списков закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение позиций списка закупок
router.get('/purchase-list-items/:purchaseListId', async (req, res) => {
  try {
    const { purchaseListId } = req.params;

    const result = await db.query(`
      SELECT 
        pli.*,
        m.name as material_name_full,
        m.current_stock,
        m.unit as material_unit
      FROM purchase_list_items pli
      LEFT JOIN materials m ON pli.material_id = m.id
      WHERE pli.purchase_list_id = $1
      ORDER BY pli.created_at
    `, [purchaseListId]);

    res.json({
      success: true,
      items: result.rows
    });

  } catch (error) {
    console.error('Ошибка при получении позиций списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновление статуса позиции списка закупок
router.put('/purchase-list-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, supplier, notes } = req.body;

    const result = await db.query(`
      UPDATE purchase_list_items 
      SET status = $1, supplier = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, supplier, notes, itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Позиция списка закупок не найдена'
      });
    }

    res.json({
      success: true,
      item: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка при обновлении позиции списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

module.exports = router;
