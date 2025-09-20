const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Извлечение материалов из заказа (упрощенная версия)
const extractMaterialsFromOrder = async (orderId) => {
  try {
    console.log('Извлечение материалов для заказа:', orderId);
    
    // Проверяем, что заказ существует
    const orderResult = await db.query(`
      SELECT o.id, o.status 
      FROM orders o
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Заказ не найден');
    }

    console.log('Заказ найден:', orderId);
    
    // Пока что возвращаем пустой массив, так как calculator_data не существует
    const materials = [];
    
    console.log('Извлечено материалов из калькулятора:', materials.length);
    return materials;
  } catch (error) {
    console.error('Ошибка при извлечении материалов из заказа:', error);
    throw error;
  }
};

// Извлечение материалов из позиций заказа (order_items)
const extractMaterialsFromOrderItems = async (orderId) => {
  try {
    console.log('Извлечение материалов из позиций заказа:', orderId);
    
    // Получаем позиции заказа из order_items
    const orderItemsResult = await db.query(`
      SELECT name, quantity, unit_price, description
      FROM order_items 
      WHERE order_id = $1
    `, [orderId]);

    const materials = orderItemsResult.rows.map(item => ({
      material_name: item.name,
      required_quantity: parseFloat(item.quantity) || 1,
      unit: 'шт', // По умолчанию штуки
      estimated_price: parseFloat(item.unit_price) || 0,
      source: 'order_items',
      description: item.description || ''
    }));

    console.log('Извлечено материалов из позиций заказа:', materials.length);
    return materials;
  } catch (error) {
    console.error('Ошибка при извлечении материалов из позиций заказа:', error);
    throw error;
  }
};

// Проверка материалов на складе для временного заказа
router.post('/check-materials-temp', async (req, res) => {
  try {
    const { items } = req.body;
    console.log('=== ПРОВЕРКА МАТЕРИАЛОВ ДЛЯ ВРЕМЕННОГО ЗАКАЗА ===');
    console.log('Позиции:', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        total_materials: 0,
        missing_materials: [],
        all_materials: []
      });
    }

    // Преобразуем позиции в формат материалов
    const materials = items.map(item => ({
      material_name: item.name,
      required_quantity: parseFloat(item.quantity) || 1,
      unit: 'шт',
      estimated_price: parseFloat(item.unit_price) || 0
    }));

    // Проверяем наличие каждого материала на складе
    const materialCheckResults = [];
    
    for (const material of materials) {
      // Ищем материал в таблице materials
      const libraryResult = await db.query(`
        SELECT id, name, unit, price_per_unit as current_price, price_per_unit as base_price
        FROM materials 
        WHERE LOWER(name) = LOWER($1) AND is_active = true
        ORDER BY name
        LIMIT 1
      `, [material.material_name]);
      
      if (libraryResult.rows.length === 0) {
        // Материал не найден в библиотеке
        materialCheckResults.push({
          ...material,
          material_id: null,
          library_material_id: null,
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

      // Получаем остаток на складе
      const availableQuantity = parseFloat(libraryMaterial.current_stock) || 0;
      const missingQuantity = Math.max(0, material.required_quantity - availableQuantity);
      const unitPrice = libraryMaterial.current_price || libraryMaterial.base_price || material.estimated_price || 0;

      materialCheckResults.push({
        ...material,
        material_id: libraryMaterial.id,
        library_material_id: libraryMaterial.id,
        available_quantity: availableQuantity,
        missing_quantity: missingQuantity,
        is_available: missingQuantity === 0,
        unit_price: unitPrice,
        total_price: missingQuantity * unitPrice,
        status: missingQuantity === 0 ? 'available' : 'insufficient_stock',
        min_stock: 0
      });
    }

    // Фильтруем недостающие материалы
    const missingMaterials = materialCheckResults.filter(material => 
      material.missing_quantity > 0 || !material.is_available
    );

    console.log('Результат проверки материалов:', {
      total: materialCheckResults.length,
      missing: missingMaterials.length,
      available: materialCheckResults.length - missingMaterials.length
    });

    res.json({
      success: true,
      total_materials: materialCheckResults.length,
      missing_materials: missingMaterials,
      all_materials: materialCheckResults
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

// Проверка материалов на складе
router.post('/check-materials/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('=== НОВЫЙ API ВЫЗВАН ===');
    console.log('Order ID:', orderId);
    
    // Извлекаем материалы из позиций заказа (order_items)
    const orderItemMaterials = await extractMaterialsFromOrderItems(orderId);
    
    // Объединяем все материалы
    const allMaterials = [...orderItemMaterials];
    
    console.log('Всего материалов для проверки:', allMaterials.length);
    console.log('Из позиций заказа:', orderItemMaterials.length);
    
    // Проверяем наличие каждого материала на складе (новая архитектура)
    const materialCheckResults = [];
    
    for (const material of allMaterials) {
      // Ищем материал в таблице materials
      const libraryResult = await db.query(`
        SELECT id, name, unit, price_per_unit as current_price, price_per_unit as base_price
        FROM materials 
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

      // Ищем остаток на складе в таблице materials
      const stockResult = await db.query(`
        SELECT id, current_stock, min_stock
        FROM materials
        WHERE id = $1 AND is_active = true
      `, [libraryMaterial.id]);

      const availableQuantity = stockResult.rows.length > 0 ? 
        parseFloat(stockResult.rows[0].current_stock) : 0;

      const missingQuantity = Math.max(0, material.required_quantity - availableQuantity);
      const unitPrice = libraryMaterial.current_price || libraryMaterial.base_price || material.estimated_price || 0;

      materialCheckResults.push({
        ...material,
        material_id: libraryMaterial.id,
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

    // Фильтруем недостающие материалы
    const missingMaterials = materialCheckResults.filter(material => 
      material.missing_quantity > 0 || !material.is_available
    );

    console.log('Результат проверки материалов:', {
      total: materialCheckResults.length,
      missing: missingMaterials.length,
      available: materialCheckResults.length - missingMaterials.length
    });

    res.json({
      success: true,
      total_materials: materialCheckResults.length,
      missing_materials: missingMaterials,
      all_materials: materialCheckResults
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

// Сохранение позиций заказа
router.post('/save-order-items/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;
    
    console.log('Сохранение позиций заказа:', orderId, items);
    
    // Проверяем, что заказ существует
    const orderResult = await db.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' });
    }
    
    // Удаляем старые позиции заказа
    await db.query('DELETE FROM order_materials WHERE order_id = $1', [orderId]);
    
    // Добавляем новые позиции
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(`
          INSERT INTO order_materials (order_id, material_name, required_quantity, unit, estimated_price, source)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          orderId,
          item.name || '',
          parseFloat(item.quantity) || 0,
          item.unit || 'шт',
          parseFloat(item.unit_price) || 0,
          'manual'
        ]);
      }
    }
    
    console.log('Позиции заказа сохранены:', items.length);
    res.json({ success: true, message: 'Позиции заказа сохранены' });
    
  } catch (error) {
    console.error('Ошибка сохранения позиций заказа:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// Получение позиций заказа
router.get('/order-items/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await db.query(`
      SELECT id, material_name as name, required_quantity as quantity, unit, estimated_price as unit_price, (required_quantity * estimated_price) as total_price
      FROM order_materials 
      WHERE order_id = $1
      ORDER BY id
    `, [orderId]);
    
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name || '',
      quantity: parseFloat(row.quantity) || 0,
      unit: row.unit || 'шт',
      unit_price: parseFloat(row.unit_price) || 0,
      total_price: parseFloat(row.total_price) || 0
    }));
    
    res.json({ success: true, items });
    
  } catch (error) {
    console.error('Ошибка получения позиций заказа:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// Простая проверка материалов для создания заказа
router.post('/check-materials-simple', async (req, res) => {
  try {
    const { items } = req.body;
    console.log('=== ПРОВЕРКА МАТЕРИАЛОВ ===');
    console.log('Позиции:', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        total_materials: 0,
        missing_materials: [],
        all_materials: []
      });
    }

    // Получаем все материалы из базы
    const materialsResult = await db.query(`
      SELECT id, name, unit, price_per_unit, current_stock, min_stock
      FROM materials 
      WHERE is_active = true
      ORDER BY name
    `);

    const allMaterials = materialsResult.rows;
    const materialCheckResults = [];
    
    for (const item of items) {
      const materialName = item.name.toLowerCase();
      const requiredQuantity = parseFloat(item.quantity) || 1;
      
      // Ищем материал по имени
      const foundMaterial = allMaterials.find(m => 
        m.name.toLowerCase().includes(materialName) || 
        materialName.includes(m.name.toLowerCase())
      );
      
      if (!foundMaterial) {
        // Материал не найден
        materialCheckResults.push({
          material_name: item.name,
          required_quantity: requiredQuantity,
          unit: 'шт',
          material_id: null,
          available_quantity: 0,
          missing_quantity: requiredQuantity,
          is_available: false,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: requiredQuantity * (parseFloat(item.unit_price) || 0),
          status: 'not_found'
        });
        continue;
      }

      const availableQuantity = parseFloat(foundMaterial.current_stock) || 0;
      const missingQuantity = Math.max(0, requiredQuantity - availableQuantity);
      const unitPrice = parseFloat(foundMaterial.price_per_unit) || parseFloat(item.unit_price) || 0;

      materialCheckResults.push({
        material_name: item.name,
        required_quantity: requiredQuantity,
        unit: foundMaterial.unit || 'шт',
        material_id: foundMaterial.id,
        available_quantity: availableQuantity,
        missing_quantity: missingQuantity,
        is_available: missingQuantity === 0,
        unit_price: unitPrice,
        total_price: missingQuantity * unitPrice,
        status: missingQuantity === 0 ? 'available' : 'insufficient_stock',
        min_stock: foundMaterial.min_stock || 0
      });
    }

    // Фильтруем недостающие материалы
    const missingMaterials = materialCheckResults.filter(material => 
      material.missing_quantity > 0 || !material.is_available
    );

    console.log('Результат проверки:', {
      total: materialCheckResults.length,
      missing: missingMaterials.length,
      available: materialCheckResults.length - missingMaterials.length
    });

    res.json({
      success: true,
      total_materials: materialCheckResults.length,
      missing_materials: missingMaterials,
      all_materials: materialCheckResults
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

module.exports = router;
