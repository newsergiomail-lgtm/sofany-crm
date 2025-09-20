const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получить всех поставщиков
router.get('/', async (req, res) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT id, name, contact_person, email, phone, address, website, notes, is_active, created_at, updated_at
      FROM suppliers
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    // Подсчет общего количества
    let countQuery = `
      SELECT COUNT(*) 
      FROM suppliers
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR contact_person ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      countParamCount++;
      countQuery += ` AND is_active = $${countParamCount}`;
      countParams.push(is_active === 'true');
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count) || 0;

    // Добавляем пагинацию
    paramCount++;
    query += ` ORDER BY name ASC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push((parseInt(page) - 1) * parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      suppliers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Ошибка получения поставщиков:', error);
    res.status(500).json({ error: 'Ошибка получения поставщиков' });
  }
});

// Получить поставщика по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM suppliers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Поставщик не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения поставщика:', error);
    res.status(500).json({ error: 'Ошибка получения поставщика' });
  }
});

// Создать нового поставщика
router.post('/', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, website, notes, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название поставщика обязательно' });
    }

    const result = await db.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, website, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, contact_person, email, phone, address, website, notes, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания поставщика:', error);
    res.status(500).json({ error: 'Ошибка создания поставщика' });
  }
});

// Обновить поставщика
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, website, notes, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название поставщика обязательно' });
    }

    const result = await db.query(
      `UPDATE suppliers 
       SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, website = $6, notes = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, contact_person, email, phone, address, website, notes, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Поставщик не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления поставщика:', error);
    res.status(500).json({ error: 'Ошибка обновления поставщика' });
  }
});

// Удалить поставщика
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, используется ли поставщик в материалах
    const materialsResult = await db.query(
      'SELECT COUNT(*) FROM materials WHERE supplier_id = $1',
      [id]
    );

    if (parseInt(materialsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить поставщика, который используется в материалах. Сначала измените поставщика в материалах.' 
      });
    }

    const result = await db.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Поставщик не найден' });
    }

    res.json({ message: 'Поставщик удален' });
  } catch (error) {
    console.error('Ошибка удаления поставщика:', error);
    res.status(500).json({ error: 'Ошибка удаления поставщика' });
  }
});

// Поиск поставщиков для автодополнения
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const result = await db.query(
      `SELECT id, name, contact_person, email, phone 
       FROM suppliers 
       WHERE is_active = true 
       AND (name ILIKE $1 OR contact_person ILIKE $1 OR email ILIKE $1)
       ORDER BY name ASC 
       LIMIT 10`,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка поиска поставщиков:', error);
    res.status(500).json({ error: 'Ошибка поиска поставщиков' });
  }
});

module.exports = router;

