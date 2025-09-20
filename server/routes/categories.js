const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получение всех категорий
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(m.id) as materials_count
      FROM categories c
      LEFT JOIN materials m ON c.id = m.category_id
      GROUP BY c.id, c.name, c.color, c.description, c.created_at, c.updated_at
      ORDER BY c.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение категории по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(m.id) as materials_count
      FROM categories c
      LEFT JOIN materials m ON c.id = m.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.color, c.description, c.created_at, c.updated_at
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении категории:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Создание новой категории
router.post('/', async (req, res) => {
  try {
    const { name, color, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название категории обязательно' });
    }
    
    // Проверяем, не существует ли уже категория с таким названием
    const existingCategory = await db.query('SELECT id FROM categories WHERE name = $1', [name]);
    
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ message: 'Категория с таким названием уже существует' });
    }
    
    const result = await db.query(`
      INSERT INTO categories (name, color, description, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [name, color || 'primary', description || '']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании категории:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление категории
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;
    
    // Проверяем, не существует ли уже категория с таким названием (кроме текущей)
    if (name) {
      const existingCategory = await db.query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id]);
      
      if (existingCategory.rows.length > 0) {
        return res.status(400).json({ message: 'Категория с таким названием уже существует' });
      }
    }
    
    const result = await db.query(`
      UPDATE categories 
      SET 
        name = COALESCE($2, name),
        color = COALESCE($3, color),
        description = COALESCE($4, description),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, name, color, description]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении категории:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Удаление категории
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли материалы в этой категории
    const materialsCount = await db.query('SELECT COUNT(*) as count FROM materials WHERE category_id = $1', [id]);
    
    if (parseInt(materialsCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Нельзя удалить категорию, в которой есть материалы. Сначала переместите или удалите все материалы из этой категории.' 
      });
    }
    
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }
    
    res.json({ message: 'Категория удалена', category: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении категории:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение материалов по категории
router.get('/:id/materials', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        m.*,
        c.name as category_name,
        c.color as category_color
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.category_id = $1
      ORDER BY m.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении материалов категории:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;








