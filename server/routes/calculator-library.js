const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Получение всех данных для калькулятора из библиотеки
router.get('/data', async (req, res) => {
  try {
    // Загружаем материалы по категориям
    const materialsResult = await db.query(`
      SELECT 
        ml.id,
        ml.name,
        ml.description,
        ml.unit,
        ml.current_price as price,
        ml.specifications,
        mc.name as category_name,
        mc.color as category_color
      FROM materials_library ml
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      WHERE ml.is_active = true
      ORDER BY mc.name, ml.name
    `);

    // Загружаем операции
    const operationsResult = await db.query(`
      SELECT 
        ol.id,
        ol.name,
        ol.description,
        ol.time_norm_minutes,
        ol.complexity_factor,
        ol.quality_coefficient,
        oc.name as category_name
      FROM operations_library ol
      LEFT JOIN operation_categories oc ON ol.category_id = oc.id
      WHERE ol.is_active = true
      ORDER BY oc.name, ol.name
    `);

    // Загружаем расценки
    const ratesResult = await db.query(`
      SELECT 
        rl.id,
        rl.name,
        rl.description,
        rl.rate_value,
        rl.unit,
        rl.category_id,
        rc.name as category_name
      FROM rates_library rl
      LEFT JOIN rate_categories rc ON rl.category_id = rc.id
      WHERE rl.is_active = true
      ORDER BY rc.name, rl.name
    `);

    // Загружаем настройки калькулятора
    const settingsResult = await db.query(`
      SELECT 
        cs.id,
        cs.setting_name,
        cs.setting_value,
        cs.setting_type,
        cs.description
      FROM calculator_settings cs
      ORDER BY cs.setting_name
    `);

    // Загружаем справочные данные
    const referenceDataResult = await db.query(`
      SELECT 
        rd.id,
        rd.name,
        rd.value,
        rd.unit,
        rd.category,
        rd.description
      FROM reference_data_library rd
      WHERE rd.is_active = true
      ORDER BY rd.category, rd.name
    `);

    // Группируем материалы по категориям
    const materialsByCategory = {};
    materialsResult.rows.forEach(material => {
      const category = material.category_name || 'Без категории';
      if (!materialsByCategory[category]) {
        materialsByCategory[category] = [];
      }
      materialsByCategory[category].push(material);
    });

    // Группируем операции по категориям
    const operationsByCategory = {};
    operationsResult.rows.forEach(operation => {
      const category = operation.category_name || 'Без категории';
      if (!operationsByCategory[category]) {
        operationsByCategory[category] = [];
      }
      operationsByCategory[category].push(operation);
    });

    // Группируем расценки по категориям
    const ratesByCategory = {};
    ratesResult.rows.forEach(rate => {
      const category = rate.category_name || 'Без категории';
      if (!ratesByCategory[category]) {
        ratesByCategory[category] = [];
      }
      ratesByCategory[category].push(rate);
    });

    // Преобразуем настройки в объект
    const settings = {};
    settingsResult.rows.forEach(setting => {
      let value = setting.setting_value;
      
      // Преобразуем значение в зависимости от типа
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value;
        }
      }
      
      settings[setting.setting_name] = value;
    });

    // Группируем справочные данные по категориям
    const referenceDataByCategory = {};
    referenceDataResult.rows.forEach(item => {
      const category = item.category || 'Без категории';
      if (!referenceDataByCategory[category]) {
        referenceDataByCategory[category] = [];
      }
      referenceDataByCategory[category].push(item);
    });

    res.json({
      success: true,
      data: {
        materials: {
          byCategory: materialsByCategory,
          all: materialsResult.rows
        },
        operations: {
          byCategory: operationsByCategory,
          all: operationsResult.rows
        },
        rates: {
          byCategory: ratesByCategory,
          all: ratesResult.rows
        },
        settings: settings,
        referenceData: {
          byCategory: referenceDataByCategory,
          all: referenceDataResult.rows
        }
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки данных для калькулятора:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки данных для калькулятора' 
    });
  }
});

// Получение материалов по категории
router.get('/materials/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await db.query(`
      SELECT 
        ml.id,
        ml.name,
        ml.description,
        ml.unit,
        ml.current_price as price,
        ml.specifications,
        mc.name as category_name,
        mc.color as category_color
      FROM materials_library ml
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      WHERE ml.is_active = true 
        AND (mc.name ILIKE $1 OR ml.name ILIKE $1)
      ORDER BY ml.name
    `, [`%${category}%`]);

    res.json({
      success: true,
      materials: result.rows
    });

  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки материалов' 
    });
  }
});

// Получение операций по категории
router.get('/operations/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await db.query(`
      SELECT 
        ol.id,
        ol.name,
        ol.description,
        ol.time_norm_minutes,
        ol.complexity_factor,
        ol.quality_coefficient,
        oc.name as category_name
      FROM operations_library ol
      LEFT JOIN operation_categories oc ON ol.category_id = oc.id
      WHERE ol.is_active = true 
        AND (oc.name ILIKE $1 OR ol.name ILIKE $1)
      ORDER BY ol.name
    `, [`%${category}%`]);

    res.json({
      success: true,
      operations: result.rows
    });

  } catch (error) {
    console.error('Ошибка загрузки операций:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки операций' 
    });
  }
});

// Получение расценок по категории
router.get('/rates/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await db.query(`
      SELECT 
        rl.id,
        rl.name,
        rl.description,
        rl.rate_value,
        rl.unit,
        rl.category_id,
        rc.name as category_name
      FROM rates_library rl
      LEFT JOIN rate_categories rc ON rl.category_id = rc.id
      WHERE rl.is_active = true 
        AND (rc.name ILIKE $1 OR rl.name ILIKE $1)
      ORDER BY rl.name
    `, [`%${category}%`]);

    res.json({
      success: true,
      rates: result.rows
    });

  } catch (error) {
    console.error('Ошибка загрузки расценок:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка загрузки расценок' 
    });
  }
});

// Расчет стоимости на основе данных из библиотеки
router.post('/calculate', async (req, res) => {
  try {
    const { 
      materials = [], 
      operations = [], 
      settings = {},
      dimensions = {},
      complexity = 1.0 
    } = req.body;

    let totalMaterialsCost = 0;
    let totalLaborCost = 0;
    let totalOperationsTime = 0;

    // Расчет стоимости материалов
    for (const material of materials) {
      if (material.id && material.quantity) {
        const materialResult = await db.query(`
          SELECT current_price, unit FROM materials_library 
          WHERE id = $1 AND is_active = true
        `, [material.id]);
        
        if (materialResult.rows.length > 0) {
          const price = parseFloat(materialResult.rows[0].current_price);
          const cost = price * material.quantity;
          totalMaterialsCost += cost;
        }
      }
    }

    // Расчет стоимости операций
    for (const operation of operations) {
      if (operation.id && operation.quantity) {
        const operationResult = await db.query(`
          SELECT 
            ol.time_norm_minutes,
            ol.complexity_factor,
            rl.rate_value
          FROM operations_library ol
          LEFT JOIN rates_library rl ON ol.rate_id = rl.id
          WHERE ol.id = $1 AND ol.is_active = true
        `, [operation.id]);
        
        if (operationResult.rows.length > 0) {
          const op = operationResult.rows[0];
          const timeNorm = parseFloat(op.time_norm_minutes) || 0;
          const complexityFactor = parseFloat(op.complexity_factor) || 1.0;
          const rateValue = parseFloat(op.rate_value) || 0;
          
          const totalTime = timeNorm * operation.quantity * complexityFactor * complexity;
          const cost = (totalTime / 60) * rateValue; // Переводим минуты в часы
          
          totalOperationsTime += totalTime;
          totalLaborCost += cost;
        }
      }
    }

    // Применяем настройки калькулятора
    const markup = settings.markup_percentage || 0.3; // 30% по умолчанию
    const totalCost = totalMaterialsCost + totalLaborCost;
    const finalPrice = totalCost * (1 + markup);

    res.json({
      success: true,
      calculation: {
        materials: {
          cost: totalMaterialsCost,
          items: materials.length
        },
        labor: {
          cost: totalLaborCost,
          time: totalOperationsTime,
          operations: operations.length
        },
        total: {
          cost: totalCost,
          price: finalPrice,
          markup: markup,
          profit: finalPrice - totalCost
        }
      }
    });

  } catch (error) {
    console.error('Ошибка расчета:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка расчета стоимости' 
    });
  }
});

module.exports = router;
