const express = require('express');
const router = express.Router();
const db = require('../config/database');

// =====================================================
// ОПЕРАЦИИ И ПРОЦЕССЫ
// =====================================================

// Получить все операции
router.get('/operations', async (req, res) => {
  try {
    const { search, category_id, department, difficulty_level, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT ol.*, oc.name as category_name, oc.color as category_color
      FROM operations_library ol
      LEFT JOIN operation_categories oc ON ol.category_id = oc.id
      WHERE ol.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (ol.name ILIKE $${paramCount} OR ol.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND ol.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (department) {
      paramCount++;
      query += ` AND ol.department = $${paramCount}`;
      params.push(department);
    }
    
    if (difficulty_level) {
      paramCount++;
      query += ` AND ol.difficulty_level = $${paramCount}`;
      params.push(difficulty_level);
    }
    
    query += ` ORDER BY ol.name ASC`;
    
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
    console.error('Ошибка получения операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать операцию
router.post('/operations', async (req, res) => {
  try {
    const {
      name, description, category_id, department, estimated_time_minutes,
      difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
      required_skills, materials_needed, tools_required
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO operations_library 
       (name, description, category_id, department, estimated_time_minutes, 
        difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
        required_skills, materials_needed, tools_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, description, category_id, department, estimated_time_minutes,
       difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
       required_skills, materials_needed, tools_required]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить операцию
router.put('/operations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, category_id, department, estimated_time_minutes,
      difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
      required_skills, materials_needed, tools_required
    } = req.body;
    
    const result = await db.query(
      `UPDATE operations_library SET
       name = $1, description = $2, category_id = $3, department = $4,
       estimated_time_minutes = $5, difficulty_level = $6, base_rate = $7,
       complexity_multiplier = $8, quality_multiplier = $9,
       required_skills = $10, materials_needed = $11, tools_required = $12,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 RETURNING *`,
      [name, description, category_id, department, estimated_time_minutes,
       difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
       required_skills, materials_needed, tools_required, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить операцию
router.delete('/operations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE operations_library SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    
    res.json({ message: 'Операция удалена' });
  } catch (error) {
    console.error('Ошибка удаления операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// ДОЛЖНОСТИ И СТАВКИ
// =====================================================

// Получить все должности
router.get('/positions', async (req, res) => {
  try {
    const { search, department, skill_level, payment_type, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM positions_library WHERE is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }
    
    if (skill_level) {
      paramCount++;
      query += ` AND skill_level = $${paramCount}`;
      params.push(skill_level);
    }
    
    if (payment_type) {
      paramCount++;
      query += ` AND payment_type = $${paramCount}`;
      params.push(payment_type);
    }
    
    query += ` ORDER BY name ASC`;
    
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
    console.error('Ошибка получения должностей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать должность
router.post('/positions', async (req, res) => {
  try {
    const {
      name, description, department, skill_level, hourly_rate, monthly_rate,
      payment_type, complexity_bonus, quality_bonus, required_education, responsibilities
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO positions_library 
       (name, description, department, skill_level, hourly_rate, monthly_rate,
        payment_type, complexity_bonus, quality_bonus, required_education, responsibilities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, description, department, skill_level, hourly_rate, monthly_rate,
       payment_type, complexity_bonus, quality_bonus, required_education, responsibilities]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания должности:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить должность
router.put('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, department, skill_level, hourly_rate, monthly_rate,
      payment_type, complexity_bonus, quality_bonus, required_education, responsibilities
    } = req.body;
    
    const result = await db.query(
      `UPDATE positions_library SET
       name = $1, description = $2, department = $3, skill_level = $4,
       hourly_rate = $5, monthly_rate = $6, payment_type = $7,
       complexity_bonus = $8, quality_bonus = $9, required_education = $10,
       responsibilities = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, description, department, skill_level, hourly_rate, monthly_rate,
       payment_type, complexity_bonus, quality_bonus, required_education, responsibilities, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Должность не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления должности:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить должность
router.delete('/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE positions_library SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Должность не найдена' });
    }
    
    res.json({ message: 'Должность удалена' });
  } catch (error) {
    console.error('Ошибка удаления должности:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// МАТЕРИАЛЫ И КОМПОНЕНТЫ
// =====================================================

// Получить все материалы
router.get('/materials', async (req, res) => {
  try {
    const { search, category_id, supplier_id, min_stock, max_stock, page = 1, limit = 50 } = req.query;
    
    const query = `SELECT * FROM materials_library WHERE is_active = true ORDER BY name ASC LIMIT 50`;
    const params = [];
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать материал
router.post('/materials', async (req, res) => {
  try {
    const {
      name, description, category_id, unit, base_price, current_price,
      supplier_id, min_stock, max_stock, current_stock, specifications,
      quality_standards, storage_requirements
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO materials_library 
       (name, description, category_id, unit, base_price, current_price,
        supplier_id, min_stock, max_stock, current_stock, specifications,
        quality_standards, storage_requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [name, description, category_id, unit, base_price, current_price,
       supplier_id, min_stock, max_stock, current_stock, specifications,
       quality_standards, storage_requirements]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания материала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить материал
router.put('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, category_id, unit, base_price, current_price,
      supplier_id, min_stock, max_stock, current_stock, specifications,
      quality_standards, storage_requirements
    } = req.body;
    
    const result = await db.query(
      `UPDATE materials_library SET
       name = $1, description = $2, category_id = $3, unit = $4,
       base_price = $5, current_price = $6, supplier_id = $7,
       min_stock = $8, max_stock = $9, current_stock = $10,
       specifications = $11, quality_standards = $12, storage_requirements = $13,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [name, description, category_id, unit, base_price, current_price,
       supplier_id, min_stock, max_stock, current_stock, specifications,
       quality_standards, storage_requirements, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления материала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить материал
router.delete('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE materials_library SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    
    res.json({ message: 'Материал удален' });
  } catch (error) {
    console.error('Ошибка удаления материала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// КАТЕГОРИИ
// =====================================================

// Получить категории операций
router.get('/operation-categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM operation_categories WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить категории материалов
router.get('/material-categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM material_categories WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий материалов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// СПРАВОЧНЫЕ ДАННЫЕ
// =====================================================

// Получить справочные данные
router.get('/reference-data', async (req, res) => {
  try {
    const { category, subcategory, search, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM reference_data_library WHERE is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (subcategory) {
      paramCount++;
      query += ` AND subcategory = $${paramCount}`;
      params.push(subcategory);
    }
    
    query += ` ORDER BY category, subcategory, name ASC`;
    
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
    console.error('Ошибка получения справочных данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// РАСЦЕНКИ
// =====================================================

// Получить расценки
router.get('/rates', async (req, res) => {
  try {
    const { category, rate_type, position_id, operation_id, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT rl.*, pl.name as position_name, ol.name as operation_name
      FROM rates_library rl
      LEFT JOIN positions_library pl ON rl.position_id = pl.id
      LEFT JOIN operations_library ol ON rl.operation_id = ol.id
      WHERE rl.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND rl.category = $${paramCount}`;
      params.push(category);
    }
    
    if (rate_type) {
      paramCount++;
      query += ` AND rl.rate_type = $${paramCount}`;
      params.push(rate_type);
    }
    
    if (position_id) {
      paramCount++;
      query += ` AND rl.position_id = $${paramCount}`;
      params.push(position_id);
    }
    
    if (operation_id) {
      paramCount++;
      query += ` AND rl.operation_id = $${paramCount}`;
      params.push(operation_id);
    }
    
    query += ` ORDER BY rl.name ASC`;
    
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
    console.error('Ошибка получения расценок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// НАСТРОЙКИ КАЛЬКУЛЯТОРА
// =====================================================

// Получить настройки калькулятора
router.get('/calculator-settings', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM system_settings_library WHERE module = $1 ORDER BY setting_name ASC',
      ['calculator']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения настроек калькулятора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// НАСТРОЙКИ СИСТЕМЫ
// =====================================================

// Получить настройки системы
router.get('/system-settings', async (req, res) => {
  try {
    const { category, module, is_public } = req.query;
    
    let query = `
      SELECT * FROM system_settings_library WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (module) {
      paramCount++;
      query += ` AND module = $${paramCount}`;
      params.push(module);
    }
    
    if (is_public !== undefined) {
      paramCount++;
      query += ` AND is_public = $${paramCount}`;
      params.push(is_public === 'true');
    }
    
    query += ` ORDER BY category, module, setting_name ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения настроек системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить настройку системы
router.put('/system-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { setting_value } = req.body;
    
    const result = await db.query(
      'UPDATE system_settings_library SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [setting_value, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления настройки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// СТАТИСТИКА И АНАЛИТИКА
// =====================================================

// Получить статистику библиотеки
router.get('/stats', async (req, res) => {
  try {
    const [operationsResult, positionsResult, materialsResult, categoriesResult] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM operations_library WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM positions_library WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM materials_library WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM operation_categories WHERE is_active = true')
    ]);
    
    const stats = {
      operations: parseInt(operationsResult.rows[0].count),
      positions: parseInt(positionsResult.rows[0].count),
      materials: parseInt(materialsResult.rows[0].count),
      categories: parseInt(categoriesResult.rows[0].count)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// МАССОВЫЕ ОПЕРАЦИИ
// =====================================================

// Массовое создание операций
router.post('/operations/bulk', async (req, res) => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: 'Массив операций не может быть пустым' });
    }
    
    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await db.query(
          `INSERT INTO operations_library 
           (name, description, category_id, department, estimated_time_minutes, 
            difficulty_level, base_rate, complexity_multiplier, quality_multiplier,
            required_skills, materials_needed, tools_required)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            operation.name, operation.description, operation.category_id, operation.department,
            operation.estimated_time_minutes, operation.difficulty_level, operation.base_rate,
            operation.complexity_multiplier, operation.quality_multiplier,
            operation.required_skills, operation.materials_needed, operation.tools_required
          ]
        );
        results.push({ success: true, data: result.rows[0] });
      } catch (error) {
        results.push({ success: false, error: error.message, data: operation });
      }
    }
    
    res.json({ results, total: operations.length, successful: results.filter(r => r.success).length });
  } catch (error) {
    console.error('Ошибка массового создания операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Массовое создание материалов
router.post('/materials/bulk', async (req, res) => {
  try {
    const { materials } = req.body;
    
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ error: 'Массив материалов не может быть пустым' });
    }
    
    const results = [];
    
    for (const material of materials) {
      try {
        const result = await db.query(
          `INSERT INTO materials_library 
           (name, description, category_id, unit, base_price, current_price,
            supplier_id, min_stock, max_stock, current_stock, specifications,
            quality_standards, storage_requirements)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            material.name, material.description, material.category_id, material.unit,
            material.base_price, material.current_price, material.supplier_id,
            material.min_stock, material.max_stock, material.current_stock,
            material.specifications, material.quality_standards, material.storage_requirements
          ]
        );
        results.push({ success: true, data: result.rows[0] });
      } catch (error) {
        results.push({ success: false, error: error.message, data: material });
      }
    }
    
    res.json({ results, total: materials.length, successful: results.filter(r => r.success).length });
  } catch (error) {
    console.error('Ошибка массового создания материалов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =====================================================
// АНАЛИТИКА
// =====================================================

// Получить аналитику библиотеки
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Определяем дату начала периода
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = '';
    }

    // Аналитика материалов
    const materialsAnalytics = await getMaterialsAnalytics(dateFilter);
    
    // Аналитика операций
    const operationsAnalytics = await getOperationsAnalytics(dateFilter);
    
    // Аналитика расценок
    const ratesAnalytics = await getRatesAnalytics(dateFilter);
    
    // Аналитика справочных данных
    const referenceDataAnalytics = await getReferenceDataAnalytics(dateFilter);
    
    // Аналитика настроек калькулятора
    const calculatorSettingsAnalytics = await getCalculatorSettingsAnalytics();

    const analytics = {
      materials: materialsAnalytics,
      operations: operationsAnalytics,
      rates: ratesAnalytics,
      referenceData: referenceDataAnalytics,
      calculatorSettings: calculatorSettingsAnalytics
    };

    res.json({ data: analytics });
  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вспомогательные функции для аналитики
async function getMaterialsAnalytics(dateFilter) {
  const [
    totalResult,
    byCategoryResult,
    lowStockResult,
    topUsedResult,
    valueByCategoryResult
  ] = await Promise.all([
    // Общее количество материалов
    db.query(`SELECT COUNT(*) as total FROM materials_library WHERE is_active = true ${dateFilter}`),
    
    // Материалы по категориям
    db.query(`
      SELECT mc.name, COUNT(ml.id) as count, 
             ROUND(COUNT(ml.id) * 100.0 / (SELECT COUNT(*) FROM materials_library WHERE is_active = true ${dateFilter}), 2) as percentage
      FROM material_categories mc
      LEFT JOIN materials_library ml ON mc.id = ml.category_id AND ml.is_active = true ${dateFilter}
      WHERE mc.is_active = true
      GROUP BY mc.id, mc.name
      ORDER BY count DESC
    `),
    
    // Материалы с низкими остатками
    db.query(`
      SELECT ml.name, mc.name as category, ml.current_stock, ml.min_stock
      FROM materials_library ml
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      WHERE ml.is_active = true AND ml.current_stock <= ml.min_stock
      ORDER BY (ml.current_stock - ml.min_stock) ASC
      LIMIT 10
    `),
    
    // Топ используемых материалов (заглушка - в реальной системе нужно считать из заказов)
    db.query(`
      SELECT ml.name, mc.name as category, 
             COALESCE(usage_count, 0) as usage_count
      FROM materials_library ml
      LEFT JOIN material_categories mc ON ml.category_id = mc.id
      WHERE ml.is_active = true
      ORDER BY usage_count DESC
      LIMIT 10
    `),
    
    // Стоимость по категориям
    db.query(`
      SELECT mc.name, 
             COUNT(ml.id) as count,
             COALESCE(SUM(ml.current_price * ml.current_stock), 0) as total_value
      FROM material_categories mc
      LEFT JOIN materials_library ml ON mc.id = ml.category_id AND ml.is_active = true ${dateFilter}
      WHERE mc.is_active = true
      GROUP BY mc.id, mc.name
      ORDER BY total_value DESC
    `)
  ]);

  return {
    total: parseInt(totalResult.rows[0].total),
    byCategory: byCategoryResult.rows,
    lowStock: lowStockResult.rows,
    topUsed: topUsedResult.rows,
    valueByCategory: valueByCategoryResult.rows
  };
}

async function getOperationsAnalytics(dateFilter) {
  const [
    totalResult,
    byCategoryResult,
    mostExpensiveResult,
    averageTimeResult
  ] = await Promise.all([
    // Общее количество операций
    db.query(`SELECT COUNT(*) as total FROM operations_library WHERE is_active = true ${dateFilter}`),
    
    // Операции по категориям
    db.query(`
      SELECT oc.name, COUNT(ol.id) as count,
             ROUND(COUNT(ol.id) * 100.0 / (SELECT COUNT(*) FROM operations_library WHERE is_active = true ${dateFilter}), 2) as percentage
      FROM operation_categories oc
      LEFT JOIN operations_library ol ON oc.id = ol.category_id AND ol.is_active = true ${dateFilter}
      WHERE oc.is_active = true
      GROUP BY oc.id, oc.name
      ORDER BY count DESC
    `),
    
    // Самые дорогие операции
    db.query(`
      SELECT ol.name, oc.name as category, ol.base_rate as price_per_unit, ol.estimated_time_minutes as time_norm_minutes
      FROM operations_library ol
      LEFT JOIN operation_categories oc ON ol.category_id = oc.id
      WHERE ol.is_active = true
      ORDER BY ol.base_rate DESC
      LIMIT 10
    `),
    
    // Среднее время операций
    db.query(`
      SELECT oc.name, AVG(ol.estimated_time_minutes) as avg_time
      FROM operation_categories oc
      LEFT JOIN operations_library ol ON oc.id = ol.category_id AND ol.is_active = true ${dateFilter}
      WHERE oc.is_active = true
      GROUP BY oc.id, oc.name
      ORDER BY avg_time DESC
    `)
  ]);

  return {
    total: parseInt(totalResult.rows[0].total),
    byCategory: byCategoryResult.rows,
    mostExpensive: mostExpensiveResult.rows,
    averageTime: averageTimeResult.rows
  };
}

async function getRatesAnalytics(dateFilter) {
  const [
    totalResult,
    byCategoryResult,
    averageRateResult
  ] = await Promise.all([
    // Общее количество расценок
    db.query(`SELECT COUNT(*) as total FROM rates_library WHERE is_active = true ${dateFilter}`),
    
    // Расценки по категориям
    db.query(`
      SELECT category, COUNT(*) as count,
             ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rates_library WHERE is_active = true ${dateFilter}), 2) as percentage
      FROM rates_library
      WHERE is_active = true ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `),
    
    // Средняя расценка
    db.query(`
      SELECT AVG(rate_value) as average_rate
      FROM rates_library
      WHERE is_active = true ${dateFilter}
    `)
  ]);

  return {
    total: parseInt(totalResult.rows[0].total),
    byCategory: byCategoryResult.rows,
    averageRate: parseFloat(averageRateResult.rows[0].average_rate || 0)
  };
}

async function getReferenceDataAnalytics(dateFilter) {
  const [
    totalResult,
    byCategoryResult
  ] = await Promise.all([
    // Общее количество справочных данных
    db.query(`SELECT COUNT(*) as total FROM reference_data_library WHERE is_active = true ${dateFilter}`),
    
    // Справочные данные по категориям
    db.query(`
      SELECT category, COUNT(*) as count,
             ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reference_data_library WHERE is_active = true ${dateFilter}), 2) as percentage
      FROM reference_data_library
      WHERE is_active = true ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `)
  ]);

  return {
    total: parseInt(totalResult.rows[0].total),
    byCategory: byCategoryResult.rows
  };
}

async function getCalculatorSettingsAnalytics() {
  const [
    totalResult,
    byCategoryResult
  ] = await Promise.all([
    // Общее количество настроек
    db.query(`SELECT COUNT(*) as total FROM system_settings_library WHERE module = 'calculator'`),
    
    // Настройки по категориям
    db.query(`
      SELECT category, COUNT(*) as count
      FROM system_settings_library
      WHERE module = 'calculator'
      GROUP BY category
      ORDER BY count DESC
    `)
  ]);

  return {
    total: parseInt(totalResult.rows[0].total),
    byCategory: byCategoryResult.rows
  };
}

module.exports = router;