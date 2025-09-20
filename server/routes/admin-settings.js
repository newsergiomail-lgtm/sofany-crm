const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const Joi = require('joi');

// =====================================================
// СИСТЕМНЫЕ НАСТРОЙКИ
// =====================================================

// Получить все системные настройки
router.get('/system', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category, public_only } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    if (category) {
      whereClause = 'WHERE category = $1';
      queryParams.push(category);
    }
    
    if (public_only === 'true') {
      whereClause += whereClause ? ' AND is_public = true' : 'WHERE is_public = true';
    }
    
    const result = await db.query(`
      SELECT 
        id, key, value, description, category, data_type, 
        is_public, is_required, validation_rules, created_at, updated_at
      FROM system_settings 
      ${whereClause}
      ORDER BY category, key
    `, queryParams);
    
    // Группируем настройки по категориям
    const settingsByCategory = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: settingsByCategory,
      categories: Object.keys(settingsByCategory)
    });
  } catch (error) {
    console.error('Ошибка получения системных настроек:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить настройку по ключу
router.get('/system/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await db.query(`
      SELECT * FROM system_settings WHERE key = $1
    `, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Настройка не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка получения настройки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить системную настройку
router.put('/system/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Валидация
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Значение обязательно'
      });
    }
    
    // Получаем текущую настройку для валидации
    const currentSetting = await db.query(`
      SELECT data_type, validation_rules, is_required FROM system_settings WHERE key = $1
    `, [key]);
    
    if (currentSetting.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Настройка не найдена'
      });
    }
    
    const { data_type, validation_rules, is_required } = currentSetting.rows[0];
    
    // Валидация типа данных
    let validatedValue = value;
    if (data_type === 'number') {
      validatedValue = parseFloat(value);
      if (isNaN(validatedValue)) {
        return res.status(400).json({
          success: false,
          error: 'Значение должно быть числом'
        });
      }
    } else if (data_type === 'boolean') {
      validatedValue = value === 'true' || value === true;
    } else if (data_type === 'json') {
      try {
        validatedValue = JSON.parse(value);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Неверный JSON формат'
        });
      }
    }
    
    // Обновляем настройку
    const result = await db.query(`
      UPDATE system_settings 
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE key = $2
      RETURNING *
    `, [validatedValue.toString(), key]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Настройка обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления настройки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// НАСТРОЙКИ МОДУЛЕЙ
// =====================================================

// Получить настройки модуля
router.get('/modules/:moduleName', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { moduleName } = req.params;
    
    const result = await db.query(`
      SELECT 
        id, setting_key, value, description, data_type, 
        is_required, validation_rules, created_at, updated_at
      FROM module_settings 
      WHERE module_name = $1
      ORDER BY setting_key
    `, [moduleName]);
    
    res.json({
      success: true,
      data: result.rows,
      module: moduleName
    });
  } catch (error) {
    console.error('Ошибка получения настроек модуля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить настройку модуля
router.put('/modules/:moduleName/:settingKey', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { moduleName, settingKey } = req.params;
    const { value } = req.body;
    
    // Получаем текущую настройку
    const currentSetting = await db.query(`
      SELECT data_type, validation_rules FROM module_settings 
      WHERE module_name = $1 AND setting_key = $2
    `, [moduleName, settingKey]);
    
    if (currentSetting.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Настройка модуля не найдена'
      });
    }
    
    const { data_type } = currentSetting.rows[0];
    
    // Валидация типа данных
    let validatedValue = value;
    if (data_type === 'number') {
      validatedValue = parseFloat(value);
      if (isNaN(validatedValue)) {
        return res.status(400).json({
          success: false,
          error: 'Значение должно быть числом'
        });
      }
    } else if (data_type === 'boolean') {
      validatedValue = value === 'true' || value === true;
    }
    
    // Обновляем настройку
    const result = await db.query(`
      UPDATE module_settings 
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE module_name = $2 AND setting_key = $3
      RETURNING *
    `, [validatedValue.toString(), moduleName, settingKey]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Настройка модуля обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления настройки модуля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// РОЛИ И РАЗРЕШЕНИЯ
// =====================================================

// Получить все роли и разрешения
router.get('/permissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        role, module, permission, granted
      FROM role_permissions 
      ORDER BY role, module, permission
    `);
    
    // Группируем по ролям и модулям
    const permissionsByRole = result.rows.reduce((acc, perm) => {
      if (!acc[perm.role]) {
        acc[perm.role] = {};
      }
      if (!acc[perm.role][perm.module]) {
        acc[perm.role][perm.module] = {};
      }
      acc[perm.role][perm.module][perm.permission] = perm.granted;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: permissionsByRole
    });
  } catch (error) {
    console.error('Ошибка получения разрешений:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить разрешение роли
router.put('/permissions/:role/:module/:permission', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role, module, permission } = req.params;
    const { granted } = req.body;
    
    const result = await db.query(`
      UPDATE role_permissions 
      SET granted = $1
      WHERE role = $2 AND module = $3 AND permission = $4
      RETURNING *
    `, [granted, role, module, permission]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Разрешение не найдено'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Разрешение обновлено'
    });
  } catch (error) {
    console.error('Ошибка обновления разрешения:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// НАСТРОЙКИ УВЕДОМЛЕНИЙ
// =====================================================

// Получить настройки уведомлений пользователя
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        id, notification_type, enabled, channels, frequency, created_at, updated_at
      FROM notification_settings 
      WHERE user_id = $1
      ORDER BY notification_type
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения настроек уведомлений:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить настройки уведомлений
router.put('/notifications/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled, channels, frequency } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(`
      UPDATE notification_settings 
      SET enabled = $1, channels = $2, frequency = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4 AND notification_type = $5
      RETURNING *
    `, [enabled, JSON.stringify(channels), frequency, userId, type]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Настройка уведомления не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Настройка уведомления обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления настроек уведомлений:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// ИНТЕГРАЦИИ
// =====================================================

// Получить настройки интеграций
router.get('/integrations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, integration_name, is_enabled, config, last_sync, created_at, updated_at
      FROM integration_settings 
      ORDER BY integration_name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения настроек интеграций:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить настройки интеграции
router.put('/integrations/:name', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name } = req.params;
    const { is_enabled, config } = req.body;
    
    const result = await db.query(`
      UPDATE integration_settings 
      SET is_enabled = $1, config = $2, updated_at = CURRENT_TIMESTAMP
      WHERE integration_name = $3
      RETURNING *
    `, [is_enabled, JSON.stringify(config), name]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Интеграция не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Настройки интеграции обновлены'
    });
  } catch (error) {
    console.error('Ошибка обновления настроек интеграции:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
// =====================================================

// Получить всех пользователей
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }
    
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }
    
    // Получаем пользователей
    const usersResult = await db.query(`
      SELECT 
        id, name, email, role, status, last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    // Получаем общее количество
    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, queryParams);
    
    res.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Создать пользователя
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role = 'user', status = 'active' } = req.body;
    
    // Валидация
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Имя, email и пароль обязательны'
      });
    }
    
    // Проверяем, существует ли пользователь
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
    // Хешируем пароль (в реальном приложении используйте bcrypt)
    const hashedPassword = password; // Здесь должно быть хеширование
    
    // Создаем пользователя
    const result = await db.query(`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, email, role, status, created_at
    `, [name, email, hashedPassword, role, status]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Пользователь создан'
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить пользователя
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    
    const result = await db.query(`
      UPDATE users 
      SET name = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, role, status, updated_at
    `, [name, email, role, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Пользователь обновлен'
    });
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Удалить пользователя
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM users WHERE id = $1 RETURNING id, name, email
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      message: 'Пользователь удален',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// НАСТРОЙКИ БЕЗОПАСНОСТИ
// =====================================================

// Получить настройки безопасности
router.get('/security', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT key, value FROM system_settings 
      WHERE category = 'security'
      ORDER BY key
    `);
    
    const securitySettings = result.rows.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: securitySettings
    });
  } catch (error) {
    console.error('Ошибка получения настроек безопасности:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить настройки безопасности
router.put('/security', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await db.query(`
        UPDATE system_settings 
        SET value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE key = $2 AND category = 'security'
      `, [value.toString(), key]);
    }
    
    res.json({
      success: true,
      message: 'Настройки безопасности обновлены'
    });
  } catch (error) {
    console.error('Ошибка обновления настроек безопасности:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// НАСТРОЙКИ ВНЕШНЕГО ВИДА
// =====================================================

// Получить настройки внешнего вида
router.get('/appearance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT key, value FROM system_settings 
      WHERE category = 'appearance'
      ORDER BY key
    `);
    
    const appearanceSettings = result.rows.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: appearanceSettings
    });
  } catch (error) {
    console.error('Ошибка получения настроек внешнего вида:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Обновить настройки внешнего вида
router.put('/appearance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await db.query(`
        UPDATE system_settings 
        SET value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE key = $2 AND category = 'appearance'
      `, [value.toString(), key]);
    }
    
    res.json({
      success: true,
      message: 'Настройки внешнего вида обновлены'
    });
  } catch (error) {
    console.error('Ошибка обновления настроек внешнего вида:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// РЕЗЕРВНЫЕ КОПИИ
// =====================================================

// Получить список резервных копий
router.get('/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // В реальном приложении здесь будет логика работы с файлами резервных копий
    const backups = [
      {
        id: 1,
        name: 'backup_2024_01_15_120000.sql',
        size: '245 MB',
        created_at: '2024-01-15T12:00:00Z',
        status: 'completed'
      },
      {
        id: 2,
        name: 'backup_2024_01_14_120000.sql',
        size: '238 MB',
        created_at: '2024-01-14T12:00:00Z',
        status: 'completed'
      }
    ];
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('Ошибка получения списка резервных копий:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Создать резервную копию
router.post('/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // В реальном приложении здесь будет логика создания резервной копии
    const backupName = `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '_')}.sql`;
    
    res.json({
      success: true,
      message: 'Резервная копия создана',
      data: {
        name: backupName,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Ошибка создания резервной копии:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// МОНИТОРИНГ СИСТЕМЫ
// =====================================================

// Получить данные мониторинга
router.get('/monitoring', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // В реальном приложении здесь будут реальные метрики системы
    const monitoringData = {
      system: {
        cpu_usage: 23,
        memory_usage: 1.2,
        disk_usage: 45,
        uptime: '7 дней 12 часов'
      },
      database: {
        connections: 8,
        max_connections: 50,
        size: '245 MB',
        queries_per_minute: 156
      },
      application: {
        active_users: 3,
        total_users: 12,
        requests_per_minute: 89,
        error_rate: 0.02
      }
    };
    
    res.json({
      success: true,
      data: monitoringData
    });
  } catch (error) {
    console.error('Ошибка получения данных мониторинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================

// Получить настройки для конкретного модуля (публичный API)
router.get('/module/:moduleName', authenticateToken, async (req, res) => {
  try {
    const { moduleName } = req.params;
    
    const result = await db.query(`
      SELECT get_module_settings($1) as settings
    `, [moduleName]);
    
    res.json({
      success: true,
      data: result.rows[0].settings
    });
  } catch (error) {
    console.error('Ошибка получения настроек модуля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Проверить разрешение пользователя
router.get('/check-permission/:module/:permission', authenticateToken, async (req, res) => {
  try {
    const { module, permission } = req.params;
    const userRole = req.user.role;
    
    const result = await db.query(`
      SELECT check_user_permission($1, $2, $3) as has_permission
    `, [userRole, module, permission]);
    
    res.json({
      success: true,
      has_permission: result.rows[0].has_permission
    });
  } catch (error) {
    console.error('Ошибка проверки разрешения:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Получить обзор всех настроек
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [systemSettings, moduleSettings, permissions, integrations] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM system_settings'),
      db.query('SELECT COUNT(*) as count FROM module_settings'),
      db.query('SELECT COUNT(*) as count FROM role_permissions'),
      db.query('SELECT COUNT(*) as count FROM integration_settings')
    ]);
    
    res.json({
      success: true,
      data: {
        system_settings: parseInt(systemSettings.rows[0].count),
        module_settings: parseInt(moduleSettings.rows[0].count),
        permissions: parseInt(permissions.rows[0].count),
        integrations: parseInt(integrations.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Ошибка получения обзора настроек:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// =====================================================
// БИБЛИОТЕКА
// =====================================================

// Получить данные библиотеки
router.get('/library', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Данные библиотеки загружаются через отдельные API endpoints'
      }
    });
  } catch (error) {
    console.error('Ошибка получения данных библиотеки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

module.exports = router;
