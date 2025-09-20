const express = require('express');
const router = express.Router();
const materialNormalizer = require('../services/materialNormalizer');
const { authenticateToken } = require('../middleware/auth');

// Обработка материалов из калькулятора
router.post('/process-calculator-materials', authenticateToken, async (req, res) => {
  try {
    const { materials } = req.body;
    
    if (!materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат данных материалов'
      });
    }

    const result = await materialNormalizer.processCalculatorMaterials(materials);
    
    res.json({
      success: true,
      data: {
        processed: result.processed,
        unmapped: result.unmapped,
        summary: {
          total: materials.length,
          processed: result.processed.length,
          unmapped: result.unmapped.length,
          success_rate: (result.processed.length / materials.length * 100).toFixed(1)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка обработки материалов калькулятора:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение предложений для маппинга
router.post('/suggest-mappings', authenticateToken, async (req, res) => {
  try {
    const { unmappedMaterials } = req.body;
    
    if (!unmappedMaterials || !Array.isArray(unmappedMaterials)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат данных'
      });
    }

    const suggestions = await materialNormalizer.suggestMappings(unmappedMaterials);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Ошибка получения предложений маппинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Создание нового маппинга
router.post('/create-mapping', authenticateToken, async (req, res) => {
  try {
    const { calculator_name, calculator_category, warehouse_name, warehouse_id, mapping_type = 'manual' } = req.body;
    
    if (!calculator_name || !warehouse_name) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать calculator_name и warehouse_name'
      });
    }

    const db = require('../config/database');
    const query = `
      INSERT INTO material_mappings 
      (calculator_name, calculator_category, warehouse_name, warehouse_id, mapping_type, confidence_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      calculator_name,
      calculator_category,
      warehouse_name,
      warehouse_id,
      mapping_type,
      mapping_type === 'manual' ? 0.9 : 1.0
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания маппинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получение всех маппингов
router.get('/mappings', authenticateToken, async (req, res) => {
  try {
    const db = require('../config/database');
    const query = `
      SELECT 
        mm.*,
        m.name as warehouse_material_name,
        m.current_stock,
        m.unit_price
      FROM material_mappings mm
      LEFT JOIN materials m ON mm.warehouse_id = m.id
      WHERE mm.is_active = true
      ORDER BY mm.created_at DESC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения маппингов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновление маппинга
router.put('/mappings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_name, warehouse_id, confidence_score, is_active } = req.body;
    
    const db = require('../config/database');
    const query = `
      UPDATE material_mappings 
      SET warehouse_name = COALESCE($1, warehouse_name),
          warehouse_id = COALESCE($2, warehouse_id),
          confidence_score = COALESCE($3, confidence_score),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [warehouse_name, warehouse_id, confidence_score, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Маппинг не найден'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления маппинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Удаление маппинга
router.delete('/mappings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = require('../config/database');
    const query = `
      UPDATE material_mappings 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Маппинг не найден'
      });
    }

    res.json({
      success: true,
      message: 'Маппинг успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления маппинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

module.exports = router;




















