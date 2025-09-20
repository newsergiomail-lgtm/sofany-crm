const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получить все операции
router.get('/operations', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, d.name as department_name
      FROM operations o
      LEFT JOIN departments d ON o.department = d.name
      ORDER BY o.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новую операцию
router.post('/operations', async (req, res) => {
  try {
    const { name, price_per_unit, department, time_norm_minutes } = req.body;
    
    const result = await db.query(
      'INSERT INTO operations (name, price_per_unit, department, time_norm_minutes) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price_per_unit, department, time_norm_minutes || 0]
    );
    
    res.json({ success: true, operation: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при добавлении операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить операцию
router.put('/operations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price_per_unit, department, time_norm_minutes } = req.body;
    
    const result = await db.query(
      'UPDATE operations SET name = $1, price_per_unit = $2, department = $3, time_norm_minutes = $4 WHERE id = $5 RETURNING *',
      [name, price_per_unit, department, time_norm_minutes || 0, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    
    res.json({ success: true, operation: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при обновлении операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить операцию
router.delete('/operations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM operations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех сотрудников
router.get('/employees', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department = d.name
      LEFT JOIN positions p ON e.position = p.name
      ORDER BY e.first_name, e.last_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все отделы
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении отделов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все должности
router.get('/positions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM positions ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении должностей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить нового сотрудника
router.post('/employees', async (req, res) => {
  try {
    const { first_name, last_name, department, position } = req.body;
    
    const result = await db.query(
      'INSERT INTO employees (first_name, last_name, department, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [first_name, last_name, department, position]
    );
    
    res.json({ success: true, employee: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при добавлении сотрудника:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить сотрудника
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, department, position, is_active } = req.body;
    
    const result = await db.query(
      'UPDATE employees SET first_name = $1, last_name = $2, department = $3, position = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [first_name, last_name, department, position, is_active !== undefined ? is_active : true, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    
    res.json({ success: true, employee: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при обновлении сотрудника:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все заказы
router.get('/orders', async (req, res) => {
  try {
    const result = await db.query('SELECT id, order_number, customer_name, status FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сохранить работу с учетом времени
router.post('/work', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { order_id, operation_id, employee_id, quantity, start_time, end_time } = req.body;
    
    // Детальное логирование входящих данных
    console.log('Создание записи работы:', {
      order_id, operation_id, employee_id, quantity, start_time, end_time,
      timestamp: new Date().toISOString()
    });
    
    // Валидация обязательных полей
    if (!order_id || !operation_id || !employee_id || !quantity) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля',
        details: 'order_id, operation_id, employee_id, quantity обязательны'
      });
    }
    
    // Проверяем существование заказа
    const orderResult = await client.query('SELECT id FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(400).json({ error: 'Заказ не найден' });
    }
    
    // Проверяем существование операции
    const operationResult = await client.query(
      'SELECT id, price_per_unit FROM operations WHERE id = $1', 
      [operation_id]
    );
    if (operationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Операция не найдена' });
    }
    
    // Проверяем существование сотрудника
    const employeeResult = await client.query(
      'SELECT id FROM employees WHERE id = $1', 
      [employee_id]
    );
    if (employeeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Сотрудник не найден' });
    }
    
    // Получаем цену операции
    const pricePerUnit = parseFloat(operationResult.rows[0].price_per_unit);
    const amount = quantity * pricePerUnit;
    
    // Рассчитываем длительность
    let duration_minutes = 0;
    if (start_time && end_time) {
      const start = new Date(`2000-01-01T${start_time}`);
      const end = new Date(`2000-01-01T${end_time}`);
      duration_minutes = Math.round((end - start) / (1000 * 60));
      
      // Проверяем корректность времени
      if (duration_minutes < 0) {
        return res.status(400).json({ error: 'Время окончания не может быть раньше времени начала' });
      }
    } else {
      // Если время не указано, используем норматив операции
      const timeNorm = parseFloat(operationResult.rows[0].time_norm_minutes) || 0;
      duration_minutes = timeNorm * quantity;
    }
    
    // Сохраняем работу
    const workResult = await client.query(
      'INSERT INTO work_log (order_id, operation_id, employee_id, quantity, amount, work_date, start_time, end_time, duration_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [order_id, operation_id, employee_id, quantity, amount, new Date(), start_time, end_time, duration_minutes]
    );
    
    // Обновляем зарплату сотрудника
    await updateEmployeePayroll(client, employee_id, amount, duration_minutes);
    
    await client.query('COMMIT');
    
    console.log('Запись работы успешно создана:', workResult.rows[0].id);
    
    res.json({ success: true, work: workResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Детальная ошибка при сохранении работы:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка сервера',
      code: 'WORK_SAVE_ERROR'
    });
  } finally {
    client.release();
  }
});

// Получить работы
router.get('/work', async (req, res) => {
  try {
    const { 
      employee_id, 
      month, 
      start_date, 
      end_date, 
      operation_id, 
      sort_by = 'date', 
      sort_order = 'desc' 
    } = req.query;
    
    
    let query = `
      SELECT wl.*, 
             o.order_number, o.customer_name,
             op.name as operation_name, op.price_per_unit, op.time_norm_minutes,
             e.first_name, e.last_name, e.department
      FROM work_log wl
      JOIN orders o ON wl.order_id = o.id
      JOIN operations op ON wl.operation_id = op.id
      JOIN employees e ON wl.employee_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (employee_id) {
      paramCount++;
      query += ` AND wl.employee_id = $${paramCount}`;
      params.push(employee_id);
    }
    
    if (month) {
      paramCount++;
      query += ` AND TO_CHAR(wl.work_date, 'YYYY-MM') = $${paramCount}`;
      params.push(month);
    }
    
    if (start_date && start_date.trim() !== '') {
      paramCount++;
      query += ` AND wl.work_date >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date && end_date.trim() !== '') {
      paramCount++;
      query += ` AND wl.work_date <= $${paramCount}`;
      params.push(end_date);
    }
    
    if (operation_id && operation_id.trim() !== '') {
      paramCount++;
      query += ` AND wl.operation_id = $${paramCount}`;
      params.push(operation_id);
    }
    
    // Сортировка
    let orderBy = 'wl.created_at';
    if (sort_by === 'date') {
      orderBy = 'wl.work_date';
    } else if (sort_by === 'operation') {
      orderBy = 'op.name';
    } else if (sort_by === 'amount') {
      orderBy = 'wl.amount';
    }
    
    const orderDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${orderBy} ${orderDirection}`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении работ:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить зарплату
router.get('/payroll', async (req, res) => {
  try {
    const { month, department, start_date, end_date } = req.query;
    
    let query = `
      SELECT p.*, e.first_name, e.last_name, e.department
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (month) {
      paramCount++;
      query += ` AND p.month = $${paramCount}`;
      params.push(month);
    }
    
    if (start_date && start_date.trim() !== '') {
      paramCount++;
      query += ` AND p.month >= $${paramCount}`;
      params.push(start_date.substring(0, 7)); // YYYY-MM
    }
    
    if (end_date && end_date.trim() !== '') {
      paramCount++;
      query += ` AND p.month <= $${paramCount}`;
      params.push(end_date.substring(0, 7)); // YYYY-MM
    }
    
    if (department) {
      paramCount++;
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
    }
    
    query += ` ORDER BY p.month DESC, e.first_name, e.last_name`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении зарплаты:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Аналитика - статистика по сотрудникам
router.get('/analytics/employees', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.department,
        COUNT(wl.id) as work_count,
        SUM(wl.amount) as total_amount,
        SUM(wl.duration_minutes) as total_minutes,
        AVG(wl.duration_minutes) as avg_duration,
        SUM(wl.quantity) as total_quantity
      FROM employees e
      LEFT JOIN work_log wl ON e.id = wl.employee_id 
        AND wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE e.is_active = true
      GROUP BY e.id, e.first_name, e.last_name, e.department
      ORDER BY total_amount DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении аналитики сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Аналитика - статистика по операциям
router.get('/analytics/operations', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        op.id,
        op.name,
        op.department,
        op.price_per_unit,
        op.time_norm_minutes,
        COUNT(wl.id) as work_count,
        SUM(wl.amount) as total_amount,
        SUM(wl.quantity) as total_quantity,
        AVG(wl.duration_minutes) as avg_duration,
        AVG(wl.duration_minutes) - op.time_norm_minutes as efficiency_diff
      FROM operations op
      LEFT JOIN work_log wl ON op.id = wl.operation_id 
        AND wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY op.id, op.name, op.department, op.price_per_unit, op.time_norm_minutes
      ORDER BY total_amount DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении аналитики операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Аналитика - общая статистика
router.get('/analytics/overview', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT wl.employee_id) as active_employees,
        COUNT(wl.id) as total_works,
        SUM(wl.amount) as total_amount,
        SUM(wl.duration_minutes) as total_minutes,
        AVG(wl.duration_minutes) as avg_duration,
        COUNT(DISTINCT wl.order_id) as orders_count,
        COUNT(DISTINCT wl.operation_id) as operations_count,
        MAX(wl.work_date) as last_work_date,
        MIN(wl.work_date) as first_work_date,
        SUM(wl.quantity) as total_quantity,
        AVG(wl.amount) as avg_amount_per_work,
        COUNT(DISTINCT e.department) as departments_count
      FROM work_log wl
      LEFT JOIN employees e ON wl.employee_id = e.id
      WHERE wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    // Дополнительная аналитика по дням недели
    const weeklyStats = await db.query(`
      SELECT 
        EXTRACT(DOW FROM wl.work_date) as day_of_week,
        COUNT(*) as works_count,
        SUM(wl.amount) as total_amount,
        AVG(wl.duration_minutes) as avg_duration
      FROM work_log wl
      WHERE wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM wl.work_date)
      ORDER BY day_of_week
    `);
    
    // Топ сотрудников
    const topEmployees = await db.query(`
      SELECT 
        e.first_name,
        e.last_name,
        e.department,
        COUNT(wl.id) as works_count,
        SUM(wl.amount) as total_amount
      FROM employees e
      LEFT JOIN work_log wl ON e.id = wl.employee_id 
        AND wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE e.is_active = true
      GROUP BY e.id, e.first_name, e.last_name, e.department
      ORDER BY total_amount DESC
      LIMIT 5
    `);
    
    // Топ операции
    const topOperations = await db.query(`
      SELECT 
        op.name,
        op.department,
        COUNT(wl.id) as works_count,
        SUM(wl.amount) as total_amount,
        SUM(wl.quantity) as total_quantity
      FROM operations op
      LEFT JOIN work_log wl ON op.id = wl.operation_id 
        AND wl.work_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY op.id, op.name, op.department
      ORDER BY total_amount DESC
      LIMIT 5
    `);
    
    res.json({
      ...result.rows[0] || {},
      weekly_stats: weeklyStats.rows,
      top_employees: topEmployees.rows,
      top_operations: topOperations.rows
    });
  } catch (error) {
    console.error('Ошибка при получении общей аналитики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Функция обновления зарплаты
async function updateEmployeePayroll(client, employeeId, amount, durationMinutes = 0) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const hours = durationMinutes / 60;
    
    // Проверяем, есть ли уже запись за этот месяц
    const existingResult = await client.query(
      'SELECT id, total_amount, work_count, total_hours FROM payroll WHERE employee_id = $1 AND month = $2',
      [employeeId, currentMonth]
    );
    
    if (existingResult.rows.length > 0) {
      // Обновляем существующую запись
      const newTotal = parseFloat(existingResult.rows[0].total_amount) + amount;
      const newCount = existingResult.rows[0].work_count + 1;
      const newHours = parseFloat(existingResult.rows[0].total_hours) + hours;
      
      await client.query(
        'UPDATE payroll SET total_amount = $1, work_count = $2, total_hours = $3 WHERE id = $4',
        [newTotal, newCount, newHours, existingResult.rows[0].id]
      );
    } else {
      // Создаем новую запись
      await client.query(
        'INSERT INTO payroll (employee_id, month, total_amount, work_count, total_hours) VALUES ($1, $2, $3, $4, $5)',
        [employeeId, currentMonth, amount, 1, hours]
      );
    }
  } catch (error) {
    console.error('Ошибка при обновлении зарплаты:', error);
    throw error;
  }
}

module.exports = router;
