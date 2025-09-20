const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Получение всех данных для калькулятора из библиотеки
router.get('/data', async (req, res) => {
  try {
    // Загружаем только материалы
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

    // Группируем материалы по категориям
    const materialsByCategory = {};
    materialsResult.rows.forEach(material => {
      const category = material.category_name || 'Без категории';
      if (!materialsByCategory[category]) {
        materialsByCategory[category] = [];
      }
      materialsByCategory[category].push(material);
    });

    res.json({
      success: true,
      data: {
        materials: {
          byCategory: materialsByCategory,
          all: materialsResult.rows
        },
        operations: {
          byCategory: {},
          all: []
        },
        rates: {
          byCategory: {},
          all: []
        },
        settings: {
          markup_percentage: 0.3,
          complexity_factor: 1.0
        },
        referenceData: {
          byCategory: {},
          all: []
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
          time: 0,
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

