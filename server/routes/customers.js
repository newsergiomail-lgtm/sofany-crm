const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Получение всех клиентов с пагинацией и фильтрацией
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sort_by = 'created_at', 
      sort_order = 'desc',
      status = '',
      company = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    // Поиск по имени, email, телефону
    if (search) {
      paramCount++;
      whereConditions.push(`(
        LOWER(c.name) LIKE LOWER($${paramCount}) OR 
        LOWER(c.email) LIKE LOWER($${paramCount}) OR 
        LOWER(c.phone) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
    }

    // Фильтр по статусу
    if (status) {
      paramCount++;
      whereConditions.push(`c.status = $${paramCount}`);
      params.push(status);
    }

    // Фильтр по компании
    if (company) {
      paramCount++;
      whereConditions.push(`LOWER(c.company) LIKE LOWER($${paramCount})`);
      params.push(`%${company}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Основной запрос
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id, c.name, c.email, c.phone, c.company, c.status, c.created_at, c.updated_at
      ORDER BY c.${sort_by} ${sort_order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), offset);

    const result = await db.query(sql, params);

    // Подсчет общего количества
    const countSql = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${whereClause}
    `;

    const countResult = await db.query(countSql, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      customers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении клиентов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение аналитики по клиентам (краткая версия)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Общая статистика
    const totalStatsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_customers,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
    `);

    const totalStats = totalStatsResult.rows[0];

    res.json({
      success: true,
      data: {
        total_customers: parseInt(totalStats.total_customers),
        active_customers: parseInt(totalStats.active_customers),
        total_orders: parseInt(totalStats.total_orders),
        total_revenue: parseFloat(totalStats.total_revenue),
        avg_order_value: parseFloat(totalStats.avg_order_value)
      }
    });
  } catch (error) {
    console.error('Ошибка получения аналитики клиентов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение аналитики по клиентам (подробная версия)
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    // Общая статистика
    const totalStatsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_customers,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
    `);

    // Топ клиентов по сумме заказов
    const topCustomersResult = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.company,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id, c.name, c.company
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    // Статистика по компаниям
    const companyStatsResult = await db.query(`
      SELECT 
        c.company,
        COUNT(DISTINCT c.id) as customers_count,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.company IS NOT NULL AND c.company != ''
      GROUP BY c.company
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Новые клиенты за последние 30 дней
    const newCustomersResult = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.company,
        c.created_at
      FROM customers c
      WHERE c.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    res.json({
      total_stats: totalStatsResult.rows[0],
      top_customers: topCustomersResult.rows,
      company_stats: companyStatsResult.rows,
      new_customers: newCustomersResult.rows
    });
  } catch (error) {
    console.error('Ошибка при получении аналитики клиентов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение статистики клиентов для дашборда
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '${period} days' THEN 1 END) as new_customers,
        COUNT(CASE WHEN c.company IS NOT NULL AND c.company != '' THEN 1 END) as company_customers,
        COUNT(CASE WHEN c.company IS NULL OR c.company = '' THEN 1 END) as individual_customers,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id 
        AND o.created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    // Топ клиенты по заказам
    const topCustomersResult = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.company,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_amount
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id 
        AND o.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY c.id, c.name, c.company
      HAVING COUNT(o.id) > 0
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    res.json({ 
      stats: statsResult.rows[0],
      top_customers: topCustomersResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики клиентов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение клиента по ID с детальной информацией
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что id - это число, а не строка "analytics"
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Неверный ID клиента' });
    }

    // Основная информация о клиенте
    const customerResult = await db.query(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    const customer = customerResult.rows[0];

    // История заказов
    const ordersResult = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.product_name,
        o.total_amount,
        o.prepayment_amount,
        o.status,
        o.priority,
        o.deadline,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [id]);

    // Статистика по месяцам
    const monthlyStatsResult = await db.query(`
      SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_amount
      FROM orders o
      WHERE o.customer_id = $1
        AND o.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY month DESC
    `, [id]);

    // Статистика по статусам заказов
    const statusStatsResult = await db.query(`
      SELECT 
        o.status,
        COUNT(o.id) as count,
        COALESCE(SUM(o.total_amount), 0) as total_amount
      FROM orders o
      WHERE o.customer_id = $1
      GROUP BY o.status
      ORDER BY count DESC
    `, [id]);

    res.json({
      customer,
      orders: ordersResult.rows,
      monthly_stats: monthlyStatsResult.rows,
      status_stats: statusStatsResult.rows
    });
  } catch (error) {
    console.error('Ошибка при получении клиента:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создание нового клиента
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      status = 'active',
      notes
    } = req.body;

    const result = await db.query(`
      INSERT INTO customers (name, email, phone, company, address, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, email, phone, company, address, status, notes]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании клиента:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление клиента
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      company,
      address,
      status,
      notes
    } = req.body;

    const result = await db.query(`
      UPDATE customers 
      SET 
        name = $1,
        email = $2,
        phone = $3,
        company = $4,
        address = $5,
        status = $6,
        notes = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, email, phone, company, address, status, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении клиента:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Удаление клиента
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    res.json({ message: 'Клиент успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении клиента:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
