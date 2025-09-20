const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Генерация QR-кода для заказа
router.get('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT id, order_number, customer_name, status FROM orders WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    const order = result.rows[0];
    const qrData = {
      type: 'order',
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      status: order.status
    };
    
    res.json({
      qr_data: JSON.stringify(qrData),
      order: order,
      qr_text: `Заказ #${order.order_number}`
    });
    
  } catch (error) {
    console.error('Ошибка при генерации QR-кода заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Генерация QR-кода для операции
router.get('/operation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT id, name, code, piece_rate, unit FROM operations WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    
    const operation = result.rows[0];
    const qrData = {
      type: 'operation',
      operation_id: operation.id,
      name: operation.name,
      code: operation.code,
      piece_rate: operation.piece_rate,
      unit: operation.unit
    };
    
    res.json({
      qr_data: JSON.stringify(qrData),
      operation: operation,
      qr_text: `${operation.name} (${operation.code})`
    });
    
  } catch (error) {
    console.error('Ошибка при генерации QR-кода операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Генерация QR-кода для сотрудника
router.get('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT e.id, e.first_name, e.last_name, e.employee_number, 
             p.name as position_name, d.name as department_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    
    const employee = result.rows[0];
    const qrData = {
      type: 'employee',
      employee_id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      employee_number: employee.employee_number,
      position: employee.position_name,
      department: employee.department_name
    };
    
    res.json({
      qr_data: JSON.stringify(qrData),
      employee: employee,
      qr_text: `${employee.first_name} ${employee.last_name} (${employee.employee_number})`
    });
    
  } catch (error) {
    console.error('Ошибка при генерации QR-кода сотрудника:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Генерация QR-кода для работы (заказ + операция + сотрудник)
router.post('/work', async (req, res) => {
  try {
    const { order_id, operation_id, employee_id, quantity } = req.body;
    
    // Проверяем существование всех сущностей
    const [orderResult, operationResult, employeeResult] = await Promise.all([
      db.query('SELECT id, order_number FROM orders WHERE id = $1', [order_id]),
      db.query('SELECT id, name, code FROM operations WHERE id = $1', [operation_id]),
      db.query('SELECT id, first_name, last_name FROM employees WHERE id = $1', [employee_id])
    ]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    if (operationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Операция не найдена' });
    }
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    
    const order = orderResult.rows[0];
    const operation = operationResult.rows[0];
    const employee = employeeResult.rows[0];
    
    const qrData = {
      type: 'work',
      order_id: order.id,
      order_number: order.order_number,
      operation_id: operation.id,
      operation_name: operation.name,
      operation_code: operation.code,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      quantity: quantity || 1
    };
    
    res.json({
      qr_data: JSON.stringify(qrData),
      work_data: qrData,
      qr_text: `Работа: ${operation.name} для заказа #${order.order_number}`
    });
    
  } catch (error) {
    console.error('Ошибка при генерации QR-кода работы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;







