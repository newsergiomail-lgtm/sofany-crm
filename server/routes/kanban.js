const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Получение всех колонок канбана
router.get('/columns', authenticateToken, async (req, res) => {
  try {
    const client = await db.pool.connect();
    
    const result = await client.query(`
      SELECT * FROM kanban_columns 
      WHERE is_active = true 
      ORDER BY position ASC
    `);
    
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения колонок канбана:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой колонки
router.post('/columns', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { title, color, type, position } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Название колонки обязательно' });
    }
    
    const client = await db.pool.connect();
    
    // Получаем максимальную позицию
    const maxPosResult = await client.query('SELECT MAX(position) as max_pos FROM kanban_columns');
    const maxPosition = maxPosResult.rows[0].max_pos || 0;
    
    const result = await client.query(`
      INSERT INTO kanban_columns (title, color, type, position)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      title,
      color || '#d1fae5',
      type || 'common',
      position || (maxPosition + 1)
    ]);
    
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания колонки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление колонки
router.put('/columns/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, color, type, position, is_active } = req.body;
    
    const client = await db.pool.connect();
    
    const result = await client.query(`
      UPDATE kanban_columns 
      SET 
        title = COALESCE($1, title),
        color = COALESCE($2, color),
        type = COALESCE($3, type),
        position = COALESCE($4, position),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [title, color, type, position, is_active, id]);
    
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Колонка не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления колонки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление колонки (мягкое удаление)
router.delete('/columns/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await db.pool.connect();
    
    // Проверяем, есть ли заказы в этой колонке
    const ordersResult = await client.query(`
      SELECT COUNT(*) as count FROM orders o
      LEFT JOIN production_operations po ON o.id = po.order_id 
      WHERE o.status = 'in_production' 
      AND po.production_stage = (SELECT title FROM kanban_columns WHERE id = $1)
    `, [id]);
    
    if (parseInt(ordersResult.rows[0].count) > 0) {
      client.release();
      return res.status(400).json({ 
        message: 'Нельзя удалить колонку, в которой есть заказы' 
      });
    }
    
    const result = await client.query(`
      UPDATE kanban_columns 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Колонка не найдена' });
    }
    
    res.json({ message: 'Колонка удалена' });
  } catch (error) {
    console.error('Ошибка удаления колонки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Переупорядочивание колонок
router.put('/columns/reorder', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { columns } = req.body; // массив {id, position}
    
    if (!Array.isArray(columns)) {
      return res.status(400).json({ message: 'Неверный формат данных' });
    }
    
    const client = await db.pool.connect();
    
    await client.query('BEGIN');
    
    for (const column of columns) {
      await client.query(`
        UPDATE kanban_columns 
        SET position = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [column.position, column.id]);
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({ message: 'Порядок колонок обновлен' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Ошибка переупорядочивания колонок:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
