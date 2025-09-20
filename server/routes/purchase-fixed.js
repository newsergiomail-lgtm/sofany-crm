const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Извлечение материалов из заказа (упрощенная версия)
const extractMaterialsFromOrder = async (orderId) => {
  try {
    console.log('Извлечение материалов для заказа:', orderId);
    
    // Проверяем, что заказ существует
    const orderResult = await db.query(`
      SELECT id, status 
      FROM orders 
      WHERE id = $1
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

// Извлечение материалов из позиций заказа (order_materials)
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

// Проверка материалов на складе
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

module.exports = router;

