const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// МАТЕРИАЛЫ
// =====================================================

// Получить все материалы с фильтрацией
router.get('/materials', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      supplier = '',
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['m.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(m.name ILIKE $${paramCount} OR m.notes ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`mc.name = $${paramCount}`);
      queryParams.push(category);
    }

    if (supplier) {
      paramCount++;
      whereConditions.push(`m.supplier ILIKE $${paramCount}`);
      queryParams.push(`%${supplier}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM materials m
      LEFT JOIN material_categories mc ON m.category_id = mc.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT 
        m.id,
        m.name,
        m.unit,
        m.current_stock,
        m.min_stock,
        m.price_per_unit,
        m.supplier,
        m.notes,
        m.is_active,
        m.created_at,
        m.updated_at,
        mc.name as category_name,
        mc.description as category_description,
        CASE 
          WHEN m.current_stock <= m.min_stock THEN 'low_stock'
          WHEN m.current_stock = 0 THEN 'out_of_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM materials m
      LEFT JOIN material_categories mc ON m.category_id = mc.id
      ${whereClause}
      ORDER BY m.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить категории материалов
router.get('/materials/categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        (SELECT COUNT(*) FROM materials WHERE category_id = mc.id AND is_active = true) as materials_count
      FROM material_categories mc
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения категорий материалов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Скачать образец файла для импорта материалов
router.get('/materials/import-template', authenticateToken, (req, res) => {
  try {
    // Создаем CSV заголовки
    const headers = [
      'name',
      'unit', 
      'current_stock',
      'min_stock',
      'price_per_unit',
      'supplier',
      'notes',
      'category_name'
    ];
    
    // Создаем примеры данных
    const sampleData = [
      [
        'Болт М6x20',
        'шт',
        '100',
        '20',
        '1.50',
        'Метизный завод "Крепеж"',
        'Болт М6x20 для крепления',
        'Крепеж метизы'
      ],
      [
        'ППУ-25',
        'м²',
        '50',
        '10',
        '45.00',
        'Завод ППУ "Полимер"',
        'Поролон плотностью 25 кг/м³',
        'ППУ и поролон'
      ],
      [
        'Ткань жаккард',
        'м',
        '200',
        '50',
        '120.00',
        'Текстильная фабрика "Люкс"',
        'Жаккардовая ткань для обивки',
        'Ткани для обивки'
      ],
      [
        'Механизм трансформации',
        'шт',
        '25',
        '5',
        '850.00',
        'Механизмы "Комфорт"',
        'Механизм трансформации диван-кровать',
        'Механизмы трансформации'
      ]
    ];
    
    // Создаем CSV содержимое
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Устанавливаем заголовки для скачивания файла
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="materials_import_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Отправляем файл
    res.send(csvContent);
  } catch (error) {
    console.error('Ошибка при создании шаблона импорта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка создания шаблона импорта',
      details: error.message 
    });
  }
});

// Импорт материалов из CSV
router.post('/materials/import', authenticateToken, async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат данных CSV'
      });
    }

    const results = {
      imported: 0,
      errors: [],
      skipped: 0
    };

    // Обрабатываем каждую строку CSV
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        // Проверяем обязательные поля
        if (!row.name || !row.unit || !row.category_name) {
          results.errors.push({
            row: i + 1,
            error: 'Отсутствуют обязательные поля: name, unit, category_name'
          });
          results.skipped++;
          continue;
        }

        // Получаем ID категории
        const categoryResult = await db.query(
          'SELECT id FROM material_categories WHERE LOWER(name) = LOWER($1)',
          [row.category_name]
        );

        if (categoryResult.rows.length === 0) {
          results.errors.push({
            row: i + 1,
            error: `Категория "${row.category_name}" не найдена`
          });
          results.skipped++;
          continue;
        }

        const categoryId = categoryResult.rows[0].id;

        // Проверяем, существует ли уже материал с таким названием
        const existingMaterial = await db.query(
          'SELECT id FROM materials WHERE LOWER(name) = LOWER($1)',
          [row.name]
        );

        if (existingMaterial.rows.length > 0) {
          results.errors.push({
            row: i + 1,
            error: `Материал "${row.name}" уже существует`
          });
          results.skipped++;
          continue;
        }

        // Вставляем новый материал
        await db.query(`
          INSERT INTO materials (
            name, unit, current_stock, min_stock, price_per_unit, 
            supplier, notes, category_id, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        `, [
          row.name,
          row.unit,
          parseFloat(row.current_stock) || 0,
          parseFloat(row.min_stock) || 0,
          parseFloat(row.price_per_unit) || 0,
          row.supplier || null,
          row.notes || null,
          categoryId
        ]);

        results.imported++;

      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message
        });
        results.skipped++;
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Ошибка импорта материалов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить материал по ID
router.get('/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        m.*,
        mc.name as category_name,
        mc.description as category_description
      FROM materials m
      LEFT JOIN material_categories mc ON m.category_id = mc.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Материал не найден'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка получения материала:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// ОПЕРАЦИИ
// =====================================================

// Получить все операции с фильтрацией
router.get('/operations', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      department = '',
      difficulty = '',
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (department) {
      paramCount++;
      whereConditions.push(`department = $${paramCount}`);
      queryParams.push(department);
    }

    if (difficulty) {
      paramCount++;
      whereConditions.push(`difficulty_level = $${paramCount}`);
      queryParams.push(parseInt(difficulty));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM operations_catalog ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT *
      FROM operations_catalog
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения операций:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить операции по цехам
router.get('/operations/departments', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        department,
        COUNT(*) as operations_count,
        AVG(estimated_time) as avg_time,
        AVG(difficulty_level) as avg_difficulty
      FROM operations_catalog
      WHERE is_active = true
      GROUP BY department
      ORDER BY department
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения операций по цехам:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// ПРОФЕССИИ
// =====================================================

// Получить все профессии с фильтрацией
router.get('/professions', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      department = '',
      skill_level = '',
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (department) {
      paramCount++;
      whereConditions.push(`department = $${paramCount}`);
      queryParams.push(department);
    }

    if (skill_level) {
      paramCount++;
      whereConditions.push(`skill_level = $${paramCount}`);
      queryParams.push(skill_level);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM professions_catalog ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT *
      FROM professions_catalog
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения профессий:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить профессии по уровням
router.get('/professions/levels', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        skill_level,
        COUNT(*) as professions_count,
        AVG(hourly_rate) as avg_rate,
        MIN(hourly_rate) as min_rate,
        MAX(hourly_rate) as max_rate
      FROM professions_catalog
      WHERE is_active = true
      GROUP BY skill_level
      ORDER BY 
        CASE skill_level
          WHEN 'junior' THEN 1
          WHEN 'middle' THEN 2
          WHEN 'senior' THEN 3
          WHEN 'master' THEN 4
        END
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения профессий по уровням:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// АНАЛИТИКА
// =====================================================

// Общая аналитика библиотеки
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const [
      materialsStats,
      operationsStats,
      professionsStats,
      stockStats
    ] = await Promise.all([
      // Статистика материалов
      db.query(`
        SELECT 
          COUNT(*) as total_materials,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_materials,
          COUNT(DISTINCT category_id) as categories_count,
          AVG(price_per_unit) as avg_price,
          SUM(current_stock * price_per_unit) as total_stock_value
        FROM materials
      `),
      
      // Статистика операций
      db.query(`
        SELECT 
          COUNT(*) as total_operations,
          COUNT(DISTINCT department) as departments_count,
          AVG(estimated_time) as avg_time,
          AVG(difficulty_level) as avg_difficulty
        FROM operations_catalog
        WHERE is_active = true
      `),
      
      // Статистика профессий
      db.query(`
        SELECT 
          COUNT(*) as total_professions,
          COUNT(DISTINCT department) as departments_count,
          AVG(hourly_rate) as avg_rate,
          COUNT(CASE WHEN skill_level = 'junior' THEN 1 END) as junior_count,
          COUNT(CASE WHEN skill_level = 'middle' THEN 1 END) as middle_count,
          COUNT(CASE WHEN skill_level = 'senior' THEN 1 END) as senior_count,
          COUNT(CASE WHEN skill_level = 'master' THEN 1 END) as master_count
        FROM professions_catalog
        WHERE is_active = true
      `),
      
      // Статистика остатков
      db.query(`
        SELECT 
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN current_stock <= min_stock AND current_stock > 0 THEN 1 END) as low_stock,
          COUNT(CASE WHEN current_stock > min_stock THEN 1 END) as in_stock
        FROM materials
        WHERE is_active = true
      `)
    ]);

    res.json({
      success: true,
      data: {
        materials: materialsStats.rows[0],
        operations: operationsStats.rows[0],
        professions: professionsStats.rows[0],
        stock: stockStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Поиск по библиотеке
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Параметр поиска q обязателен'
      });
    }

    const searchTerm = `%${q}%`;
    const results = {};

    // Поиск материалов
    if (type === 'all' || type === 'materials') {
      const materialsResult = await db.query(`
        SELECT 
          'material' as type,
          id,
          name,
          unit,
          current_stock,
          price_per_unit,
          supplier,
          mc.name as category_name
        FROM materials m
        LEFT JOIN material_categories mc ON m.category_id = mc.id
        WHERE m.is_active = true 
        AND (m.name ILIKE $1 OR m.notes ILIKE $1 OR mc.name ILIKE $1)
        ORDER BY m.name
        LIMIT 10
      `, [searchTerm]);
      
      results.materials = materialsResult.rows;
    }

    // Поиск операций
    if (type === 'all' || type === 'operations') {
      const operationsResult = await db.query(`
        SELECT 
          'operation' as type,
          id,
          name,
          description,
          department,
          estimated_time,
          difficulty_level
        FROM operations_catalog
        WHERE is_active = true 
        AND (name ILIKE $1 OR description ILIKE $1 OR department ILIKE $1)
        ORDER BY name
        LIMIT 10
      `, [searchTerm]);
      
      results.operations = operationsResult.rows;
    }

    // Поиск профессий
    if (type === 'all' || type === 'professions') {
      const professionsResult = await db.query(`
        SELECT 
          'profession' as type,
          id,
          name,
          description,
          department,
          skill_level,
          hourly_rate
        FROM professions_catalog
        WHERE is_active = true 
        AND (name ILIKE $1 OR description ILIKE $1 OR department ILIKE $1)
        ORDER BY name
        LIMIT 10
      `, [searchTerm]);
      
      results.professions = professionsResult.rows;
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

module.exports = router;
