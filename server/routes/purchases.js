const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получение всех списков закупок с фильтрацией
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      order_id, 
      supplier, 
      date_from, 
      date_to,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Фильтр по статусу
    if (status) {
      paramCount++;
      whereClause += ` AND pl.status = $${paramCount}`;
      params.push(status);
    }

    // Фильтр по заказу
    if (order_id) {
      paramCount++;
      whereClause += ` AND pl.order_id = $${paramCount}`;
      params.push(order_id);
    }

    // Фильтр по поставщику
    if (supplier) {
      paramCount++;
      whereClause += ` AND EXISTS (
        SELECT 1 FROM purchase_list_items pli 
        WHERE pli.purchase_list_id = pl.id 
        AND pli.supplier ILIKE $${paramCount}
      )`;
      params.push(`%${supplier}%`);
    }

    // Фильтр по дате
    if (date_from) {
      paramCount++;
      whereClause += ` AND pl.created_at >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereClause += ` AND pl.created_at <= $${paramCount}`;
      params.push(date_to);
    }

    // Поиск по названию или номеру заказа
    if (search) {
      paramCount++;
      whereClause += ` AND (pl.name ILIKE $${paramCount} OR o.order_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM purchase_lists pl
      LEFT JOIN orders o ON pl.order_id = o.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Получение списков закупок
    paramCount++;
    const ordersQuery = `
      SELECT 
        pl.*,
        o.order_number,
        o.product_name,
        o.priority as order_priority,
        o.delivery_date,
        c.name as customer_name_full,
        COUNT(pli.id) as items_count,
        COUNT(CASE WHEN pli.status = 'completed' THEN 1 END) as completed_items,
        COUNT(CASE WHEN pli.status = 'ordered' THEN 1 END) as ordered_items,
        COUNT(CASE WHEN pli.status = 'pending' THEN 1 END) as pending_items
      FROM purchase_lists pl
      LEFT JOIN orders o ON pl.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN purchase_list_items pli ON pl.id = pli.purchase_list_id
      ${whereClause}
      GROUP BY pl.id, o.order_number, o.product_name, o.priority, o.delivery_date, c.name
      ORDER BY pl.${sort_by} ${sort_order}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const ordersResult = await db.query(ordersQuery, params);

    res.json({
      success: true,
      purchase_lists: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка при получении списков закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение детальной информации о списке закупок
router.get('/:purchaseListId', async (req, res) => {
  try {
    const { purchaseListId } = req.params;

    // Получаем информацию о списке закупок
    const listResult = await db.query(`
      SELECT 
        pl.*,
        o.order_number,
        o.product_name,
        o.priority as order_priority,
        o.delivery_date,
        c.name as customer_name_full,
        c.phone as customer_phone,
        c.email as customer_email,
        s.name as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.email as supplier_email
      FROM purchase_lists pl
      LEFT JOIN orders o ON pl.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN suppliers s ON pl.supplier_id = s.id
      WHERE pl.id = $1
    `, [purchaseListId]);

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Список закупок не найден'
      });
    }

    // Получаем позиции списка закупок
    const itemsResult = await db.query(`
      SELECT 
        pli.*,
        m.name as material_name_full,
        m.current_stock,
        m.unit as material_unit,
        m.supplier as material_supplier
      FROM purchase_list_items pli
      LEFT JOIN materials m ON pli.material_id = m.id
      WHERE pli.purchase_list_id = $1
      ORDER BY pli.created_at
    `, [purchaseListId]);

    res.json({
      success: true,
      purchase_list: listResult.rows[0],
      items: itemsResult.rows
    });

  } catch (error) {
    console.error('Ошибка при получении списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновление статуса списка закупок
router.put('/:purchaseListId/status', async (req, res) => {
  try {
    const { purchaseListId } = req.params;
    const { status, notes } = req.body;

    const result = await db.query(`
      UPDATE purchase_lists 
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, notes, purchaseListId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Список закупок не найден'
      });
    }

    res.json({
      success: true,
      purchase_list: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка при обновлении статуса списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Массовое обновление статусов позиций
router.put('/:purchaseListId/items/bulk-update', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { purchaseListId } = req.params;
    const { item_ids, status, supplier, notes } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать ID позиций для обновления'
      });
    }

    const updatePromises = item_ids.map(itemId => 
      client.query(`
        UPDATE purchase_list_items 
        SET status = $1, supplier = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND purchase_list_id = $5
        RETURNING *
      `, [status, supplier, notes, itemId, purchaseListId])
    );

    const results = await Promise.all(updatePromises);
    const updatedItems = results.map(result => result.rows[0]).filter(Boolean);

    await client.query('COMMIT');

    res.json({
      success: true,
      updated_count: updatedItems.length,
      items: updatedItems
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при массовом обновлении позиций:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Получение статистики закупок
router.get('/stats/overview', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 0;

    if (date_from) {
      paramCount++;
      dateFilter += ` AND pl.created_at >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      dateFilter += ` AND pl.created_at <= $${paramCount}`;
      params.push(date_to);
    }

    // Общая статистика (включая заявки на закупку)
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_lists,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_lists,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_lists,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lists,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_lists,
        SUM(total_amount) as total_cost,
        AVG(total_amount) as avg_cost
      FROM (
        SELECT status, total_amount, created_at FROM purchase_lists
        UNION ALL
        SELECT 
          CASE 
            WHEN status = 'approved' THEN 'in_progress'
            ELSE status
          END as status, 
          total_amount, 
          created_at 
        FROM purchase_requests
      ) combined
      WHERE 1=1 ${dateFilter}
    `, params);

    // Статистика по позициям
    const itemsStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN pli.status = 'pending' THEN 1 END) as pending_items,
        COUNT(CASE WHEN pli.status = 'ordered' THEN 1 END) as ordered_items,
        COUNT(CASE WHEN pli.status = 'completed' THEN 1 END) as completed_items,
        SUM(pli.total_price) as total_items_cost
      FROM purchase_list_items pli
      JOIN purchase_lists pl ON pli.purchase_list_id = pl.id
      WHERE 1=1 ${dateFilter}
    `, params);

    // Топ поставщиков
    const suppliersResult = await db.query(`
      SELECT 
        pli.supplier,
        COUNT(*) as orders_count,
        SUM(pli.total_price) as total_amount
      FROM purchase_list_items pli
      JOIN purchase_lists pl ON pli.purchase_list_id = pl.id
      WHERE pli.supplier IS NOT NULL AND pli.supplier != ''
      ${dateFilter}
      GROUP BY pli.supplier
      ORDER BY total_amount DESC
      LIMIT 10
    `, params);

    // Статистика по материалам
    const materialsResult = await db.query(`
      SELECT 
        pli.material_name,
        COUNT(*) as orders_count,
        SUM(pli.quantity) as total_quantity,
        SUM(pli.total_price) as total_amount,
        AVG(pli.unit_price) as avg_price
      FROM purchase_list_items pli
      JOIN purchase_lists pl ON pli.purchase_list_id = pl.id
      WHERE 1=1 ${dateFilter}
      GROUP BY pli.material_name
      ORDER BY total_amount DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      overview: statsResult.rows[0],
      items: itemsStatsResult.rows[0],
      top_suppliers: suppliersResult.rows,
      top_materials: materialsResult.rows
    });

  } catch (error) {
    console.error('Ошибка при получении статистики закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Экспорт списка закупок в Excel
router.get('/:purchaseListId/export', async (req, res) => {
  try {
    const { purchaseListId } = req.params;
    const { format = 'excel' } = req.query;

    // Получаем данные для экспорта
    const listResult = await db.query(`
      SELECT 
        pl.*,
        o.order_number,
        o.product_name,
        c.name as customer_name_full
      FROM purchase_lists pl
      LEFT JOIN orders o ON pl.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE pl.id = $1
    `, [purchaseListId]);

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Список закупок не найден'
      });
    }

    const itemsResult = await db.query(`
      SELECT 
        pli.*,
        m.name as material_name_full,
        m.current_stock,
        m.unit as material_unit
      FROM purchase_list_items pli
      LEFT JOIN materials m ON pli.material_id = m.id
      WHERE pli.purchase_list_id = $1
      ORDER BY pli.created_at
    `, [purchaseListId]);

    const purchaseList = listResult.rows[0];
    const items = itemsResult.rows;

    if (format === 'excel') {
      // Простой CSV экспорт (можно заменить на полноценный Excel)
      const csvData = [
        ['Список закупок', purchaseList.name],
        ['Заказ', purchaseList.order_number],
        ['Клиент', purchaseList.customer_name_full],
        ['Статус', purchaseList.status],
        ['Общая стоимость', purchaseList.total_cost],
        [''],
        ['Материал', 'Требуется', 'Доступно', 'Недостает', 'Единица', 'Цена за единицу', 'Общая стоимость', 'Поставщик', 'Статус']
      ];

      items.forEach(item => {
        csvData.push([
          item.material_name,
          item.required_quantity,
          item.available_quantity,
          item.missing_quantity,
          item.unit,
          item.unit_price,
          item.total_price,
          item.supplier || '',
          item.status
        ]);
      });

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="purchase_list_${purchaseListId}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        purchase_list: purchaseList,
        items: items
      });
    }

  } catch (error) {
    console.error('Ошибка при экспорте списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновление информации о поставке
router.put('/:id/delivery', async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, supplier_id } = req.body;

    const result = await db.query(
      'UPDATE purchase_lists SET delivery_date = $1, supplier_id = $2 WHERE id = $3 RETURNING *',
      [delivery_date || null, supplier_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Список закупок не найден'
      });
    }

    // Получаем обновленный список с информацией о поставщике
    const purchaseListResult = await db.query(`
      SELECT pl.*, s.name as supplier_name, s.contact_person, s.phone, s.email
      FROM purchase_lists pl
      LEFT JOIN suppliers s ON pl.supplier_id = s.id
      WHERE pl.id = $1
    `, [id]);

    res.json({
      success: true,
      purchase_list: purchaseListResult.rows[0]
    });

  } catch (error) {
    console.error('Ошибка обновления информации о поставке:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Удаление позиции списка закупок
router.delete('/purchase-list-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const result = await db.query(`
      DELETE FROM purchase_list_items 
      WHERE id = $1
      RETURNING id
    `, [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Позиция списка закупок не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Позиция успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка при удалении позиции списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Удаление списка закупок
router.delete('/:purchaseListId', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { purchaseListId } = req.params;

    // Проверяем, существует ли список закупок
    const listCheck = await client.query(
      'SELECT id, order_id FROM purchase_lists WHERE id = $1',
      [purchaseListId]
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Список закупок не найден'
      });
    }

    // Удаляем все позиции списка закупок
    await client.query(
      'DELETE FROM purchase_list_items WHERE purchase_list_id = $1',
      [purchaseListId]
    );

    // Удаляем сам список закупок
    await client.query(
      'DELETE FROM purchase_lists WHERE id = $1',
      [purchaseListId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Список закупок успешно удален'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при удалении списка закупок:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;