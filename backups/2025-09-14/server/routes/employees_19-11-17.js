const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получить всех сотрудников
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', position = '', is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (department) {
      paramCount++;
      whereClause += ` AND department = $${paramCount}`;
      queryParams.push(department);
    }

    if (position) {
      paramCount++;
      whereClause += ` AND position = $${paramCount}`;
      queryParams.push(position);
    }

    if (is_active !== undefined && is_active !== '') {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      queryParams.push(is_active === 'true');
    }

    const countQuery = `SELECT COUNT(*) FROM employees ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT 
        id, first_name, last_name, department, position, 
        is_active, created_at
      FROM employees 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    // Добавляем параметры для LIMIT и OFFSET
    queryParams.push(parseInt(limit), offset);
    
    const result = await db.query(dataQuery, queryParams);

    res.json({
      employees: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения сотрудников:', error);
    res.status(500).json({ message: 'Ошибка получения сотрудников' });
  }
});

// Получить сотрудника по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения сотрудника:', error);
    res.status(500).json({ message: 'Ошибка получения сотрудника' });
  }
});

// Создать нового сотрудника
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      department,
      position,
      is_active = true
    } = req.body;

    // Валидация обязательных полей
    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'Имя и фамилия обязательны' });
    }

    const result = await db.query(
      `INSERT INTO employees 
       (first_name, last_name, department, position, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [first_name, last_name, department, position, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания сотрудника:', error);
    res.status(500).json({ message: 'Ошибка создания сотрудника' });
  }
});

// Обновить сотрудника
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      department,
      position,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, department = $3, position = $4, 
           is_active = $5
       WHERE id = $6
       RETURNING *`,
      [first_name, last_name, department, position, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления сотрудника:', error);
    res.status(500).json({ message: 'Ошибка обновления сотрудника' });
  }
});

// Удалить сотрудника
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json({ message: 'Сотрудник удален' });
  } catch (error) {
    console.error('Ошибка удаления сотрудника:', error);
    res.status(500).json({ message: 'Ошибка удаления сотрудника' });
  }
});

module.exports = router;
