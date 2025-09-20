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
      whereClause += ` AND position ILIKE $${paramCount}`;
      queryParams.push(`%${position}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      queryParams.push(is_active === 'true');
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM employees e
      LEFT JOIN positions p ON e.position = p.name
      ${whereClause.replace('department =', 'e.department =').replace('position ILIKE', 'e.position ILIKE')}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT 
        e.id, e.first_name, e.last_name, e.hire_date, e.is_active, e.created_at,
        e.department, e.position, p.payment_type
      FROM employees e
      LEFT JOIN positions p ON e.position = p.name
      ${whereClause.replace('department =', 'e.department =').replace('position ILIKE', 'e.position ILIKE')}
      ORDER BY e.created_at DESC
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

// Получить все отделы
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT department as name
      FROM employees 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `);
    // Добавляем id для каждого отдела
    const departments = result.rows.map((dept, index) => ({
      ...dept,
      id: index + 1
    }));
    res.json(departments);
  } catch (error) {
    console.error('Ошибка получения отделов:', error);
    res.status(500).json({ message: 'Ошибка получения отделов' });
  }
});

// Получить все должности
router.get('/positions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT position as name
      FROM employees 
      WHERE position IS NOT NULL AND position != ''
      ORDER BY position
    `);
    // Добавляем id для каждой должности
    const positions = result.rows.map((pos, index) => ({
      ...pos,
      id: index + 1
    }));
    res.json(positions);
  } catch (error) {
    console.error('Ошибка получения должностей:', error);
    res.status(500).json({ message: 'Ошибка получения должностей' });
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
      hire_date,
      is_active = true
    } = req.body;

    // Валидация обязательных полей
    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'Имя и фамилия обязательны' });
    }

    const result = await db.query(
      `INSERT INTO employees 
       (first_name, last_name, department, position, hire_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [first_name, last_name, department, position, hire_date, is_active]
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
      hire_date,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, department = $3, position = $4, 
           hire_date = $5, is_active = $6
       WHERE id = $7
       RETURNING *`,
      [first_name, last_name, department, position, hire_date, is_active, id]
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

// Получить все должности
router.get('/positions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT 
        e.position as name,
        p.payment_type,
        p.base_rate
      FROM employees e
      LEFT JOIN positions p ON e.position = p.name
      WHERE e.position IS NOT NULL
      ORDER BY e.position
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения должностей:', error);
    res.status(500).json({ message: 'Ошибка получения должностей' });
  }
});

// Создать новую должность
router.post('/positions', async (req, res) => {
  try {
    const { name, payment_type, base_rate } = req.body;

    // Проверяем, есть ли уже такая должность
    const existingPosition = await db.query('SELECT id FROM positions WHERE name = $1', [name]);
    
    if (existingPosition.rows.length > 0) {
      return res.status(400).json({ message: 'Должность с таким названием уже существует' });
    }

    // Создаем новую должность
    const result = await db.query(
      'INSERT INTO positions (name, payment_type, base_rate) VALUES ($1, $2, $3) RETURNING *',
      [name, payment_type, base_rate]
    );

    res.json({ message: 'Должность создана', position: result.rows[0] });
  } catch (error) {
    console.error('Ошибка создания должности:', error);
    res.status(500).json({ message: 'Ошибка создания должности' });
  }
});

// Обновить тип оплаты должности
router.put('/positions/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { payment_type, base_rate } = req.body;

    // Сначала проверяем, есть ли должность в таблице positions
    let positionResult = await db.query('SELECT id FROM positions WHERE name = $1', [name]);
    
    if (positionResult.rows.length === 0) {
      // Если должности нет в таблице positions, создаем её
      positionResult = await db.query(
        'INSERT INTO positions (name, payment_type, base_rate) VALUES ($1, $2, $3) RETURNING id',
        [name, payment_type, base_rate]
      );
    } else {
      // Если должность есть, обновляем её
      await db.query(
        'UPDATE positions SET payment_type = $1, base_rate = $2 WHERE name = $3',
        [payment_type, base_rate, name]
      );
    }

    res.json({ message: 'Тип оплаты обновлен', position: { name, payment_type, base_rate } });
  } catch (error) {
    console.error('Ошибка обновления типа оплаты:', error);
    res.status(500).json({ message: 'Ошибка обновления типа оплаты' });
  }
});

module.exports = router;
