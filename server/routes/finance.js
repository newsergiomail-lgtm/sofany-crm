const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Общая финансовая аналитика
router.get('/overview', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Определяем период
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '90 days'";
        break;
      case 'year':
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '365 days'";
        break;
    }

    // Общая статистика
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) as in_progress_orders
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `;

    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // Расчет затрат (примерный)
    const expensesQuery = `
      SELECT 
        COALESCE(SUM(o.total_amount * 0.6), 0) as materials_cost,
        COALESCE(SUM(o.total_amount * 0.1), 0) as labor_cost,
        COALESCE(SUM(o.total_amount * 0.05), 0) as overhead_cost
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `;

    const expensesResult = await db.query(expensesQuery);
    const expenses = expensesResult.rows[0];

    const totalExpenses = expenses.materials_cost + expenses.labor_cost + expenses.overhead_cost;
    const profit = stats.total_revenue - totalExpenses;
    const profitability = stats.total_revenue > 0 ? (profit / stats.total_revenue) * 100 : 0;

    res.json({
      ...stats,
      expenses: {
        materials: expenses.materials_cost,
        labor: expenses.labor_cost,
        overhead: expenses.overhead_cost,
        total: totalExpenses
      },
      profit,
      profitability
    });

  } catch (error) {
    console.error('Ошибка при получении финансовой аналитики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Детальная финансовая аналитика по заказу
router.get('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Данные заказа
    const orderQuery = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `;

    const orderResult = await db.query(orderQuery, [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Операции по заказу
    const operationsQuery = `
      SELECT 
        wl.id,
        wl.quantity,
        wl.start_time,
        wl.end_time,
        EXTRACT(EPOCH FROM (wl.end_time - wl.start_time))/3600 as duration_hours,
        o.name as operation_name,
        o.price_per_unit,
        (wl.quantity * o.price_per_unit) as cost,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.department,
        e.position
      FROM work_log wl
      LEFT JOIN operations o ON wl.operation_id = o.id
      LEFT JOIN employees e ON wl.employee_id = e.id
      WHERE wl.order_id = $1
    `;

    const operationsResult = await db.query(operationsQuery, [id]);
    const operations = operationsResult.rows;

    // Расчет финансовых показателей
    const totalWorkCost = operations.reduce((sum, op) => sum + (op.cost || 0), 0);
    const totalWorkHours = operations.reduce((sum, op) => sum + (op.duration_hours || 0), 0);
    
    // Примерные затраты на материалы (60% от стоимости заказа)
    const materialsCost = order.total_amount * 0.6;
    
    // Накладные расходы (5% от стоимости заказа)
    const overheadCost = order.total_amount * 0.05;
    
    // Прочие расходы (5% от стоимости заказа)
    const otherCost = order.total_amount * 0.05;

    const totalExpenses = materialsCost + totalWorkCost + overheadCost + otherCost;
    const profit = order.total_amount - totalExpenses;
    const profitability = order.total_amount > 0 ? (profit / order.total_amount) * 100 : 0;

    const avgHourlyCost = totalWorkHours > 0 ? totalWorkCost / totalWorkHours : 0;
    const efficiency = totalWorkHours > 0 ? (order.total_amount / totalWorkHours) * 100 : 0;

    res.json({
      order,
      operations,
      financial: {
        total_cost: order.total_amount,
        total_expenses,
        profit,
        profitability,
        materials_cost: materialsCost,
        labor_cost: totalWorkCost,
        overhead_cost: overheadCost,
        other_cost: otherCost,
        total_work_hours: totalWorkHours,
        operations_count: operations.length,
        avg_hourly_cost: avgHourlyCost,
        efficiency
      }
    });

  } catch (error) {
    console.error('Ошибка при получении финансовой аналитики заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;