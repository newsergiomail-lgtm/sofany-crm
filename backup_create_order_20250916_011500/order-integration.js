const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Автоматическое создание операций для заказа
router.post('/create-operations/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { operations } = req.body; // Массив операций для создания

    // Проверяем существование заказа
    const orderResult = await db.query(
      'SELECT id, order_number, customer_name FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];
    const createdOperations = [];

    // Создаем операции для заказа
    for (const operationData of operations) {
      const { name, code, department_id, unit, piece_rate, time_norm, description } = operationData;

      const result = await db.query(
        `INSERT INTO operations (name, code, department_id, unit, piece_rate, time_norm, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, code, department_id, unit, piece_rate, time_norm, description, true]
      );

      createdOperations.push(result.rows[0]);
    }

    res.json({
      message: `Создано ${createdOperations.length} операций для заказа #${order.order_number}`,
      order: order,
      operations: createdOperations
    });

  } catch (error) {
    console.error('Ошибка при создании операций для заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение шаблонов операций по типу мебели
router.get('/operation-templates/:furnitureType', async (req, res) => {
  try {
    const { furnitureType } = req.params;

    // Шаблоны операций для разных типов мебели
    const templates = {
      'диван': [
        { name: 'Распил каркаса', code: 'RASPIL_KARKAS', department: 'Столярный цех', unit: 'м.пог.', piece_rate: 20.00, time_norm: 0.15 },
        { name: 'Сборка каркаса', code: 'SBORKA_KARKAS', department: 'Столярный цех', unit: 'шт', piece_rate: 800.00, time_norm: 2.00 },
        { name: 'Формовка ППУ', code: 'FORMOVKA_PPU', department: 'Формовочный цех', unit: 'м³', piece_rate: 800.00, time_norm: 0.50 },
        { name: 'Раскрой ткани', code: 'RAZKROY_TKAN', department: 'Обивочный цех', unit: 'м²', piece_rate: 25.00, time_norm: 0.20 },
        { name: 'Обивка спинки', code: 'OBIVKA_SPINKA', department: 'Обивочный цех', unit: 'шт', piece_rate: 400.00, time_norm: 1.50 },
        { name: 'Обивка сиденья', code: 'OBIVKA_SIDENIE', department: 'Обивочный цех', unit: 'шт', piece_rate: 350.00, time_norm: 1.20 },
        { name: 'Сборка дивана', code: 'SBORKA_DIVAN', department: 'Обивочный цех', unit: 'шт', piece_rate: 1500.00, time_norm: 4.00 }
      ],
      'кресло': [
        { name: 'Распил каркаса', code: 'RASPIL_KARKAS', department: 'Столярный цех', unit: 'м.пог.', piece_rate: 15.00, time_norm: 0.10 },
        { name: 'Сборка каркаса', code: 'SBORKA_KARKAS', department: 'Столярный цех', unit: 'шт', piece_rate: 600.00, time_norm: 1.50 },
        { name: 'Формовка ППУ', code: 'FORMOVKA_PPU', department: 'Формовочный цех', unit: 'м³', piece_rate: 800.00, time_norm: 0.30 },
        { name: 'Раскрой ткани', code: 'RAZKROY_TKAN', department: 'Обивочный цех', unit: 'м²', piece_rate: 25.00, time_norm: 0.15 },
        { name: 'Обивка кресла', code: 'OBIVKA_KRESLO', department: 'Обивочный цех', unit: 'шт', piece_rate: 800.00, time_norm: 2.50 }
      ],
      'стол': [
        { name: 'Распил столешницы', code: 'RASPIL_STOLESHNICA', department: 'Столярный цех', unit: 'м²', piece_rate: 30.00, time_norm: 0.20 },
        { name: 'Кромление', code: 'KROMLENIE', department: 'Столярный цех', unit: 'м.пог.', piece_rate: 8.00, time_norm: 0.05 },
        { name: 'Сверление отверстий', code: 'SVERLENIE', department: 'Столярный цех', unit: 'отверстие', piece_rate: 2.00, time_norm: 0.02 },
        { name: 'Сборка стола', code: 'SBORKA_STOL', department: 'Столярный цех', unit: 'шт', piece_rate: 800.00, time_norm: 3.00 }
      ],
      'тумба': [
        { name: 'Распил ЛДСП', code: 'RASPIL_LDSP', department: 'Столярный цех', unit: 'м.пог.', piece_rate: 15.00, time_norm: 0.10 },
        { name: 'Кромление', code: 'KROMLENIE', department: 'Столярный цех', unit: 'м.пог.', piece_rate: 8.00, time_norm: 0.05 },
        { name: 'Сверление отверстий', code: 'SVERLENIE', department: 'Столярный цех', unit: 'отверстие', piece_rate: 2.00, time_norm: 0.02 },
        { name: 'Сборка тумбы', code: 'SBORKA_TUMBA', department: 'Столярный цех', unit: 'шт', piece_rate: 500.00, time_norm: 2.00 }
      ]
    };

    const operationTemplates = templates[furnitureType.toLowerCase()] || [];

    // Получаем ID отделов
    const departmentsResult = await db.query('SELECT id, name FROM departments');
    const departments = departmentsResult.rows;

    // Добавляем ID отделов к шаблонам
    const templatesWithDeptIds = operationTemplates.map(template => ({
      ...template,
      department_id: departments.find(d => d.name === template.department)?.id || null
    }));

    res.json({
      furniture_type: furnitureType,
      templates: templatesWithDeptIds
    });

  } catch (error) {
    console.error('Ошибка при получении шаблонов операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка типов мебели
router.get('/furniture-types', async (req, res) => {
  try {
    const furnitureTypes = [
      { id: 'диван', name: 'Диван', description: 'Мягкая мебель для сидения' },
      { id: 'кресло', name: 'Кресло', description: 'Мягкое кресло' },
      { id: 'стол', name: 'Стол', description: 'Столы различного назначения' },
      { id: 'тумба', name: 'Тумба', description: 'Тумбы и комоды' },
      { id: 'шкаф', name: 'Шкаф', description: 'Шкафы и гардеробы' },
      { id: 'кровать', name: 'Кровать', description: 'Кровати и спальные гарнитуры' }
    ];

    res.json(furnitureTypes);
  } catch (error) {
    console.error('Ошибка при получении типов мебели:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;







