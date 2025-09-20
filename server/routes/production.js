const express = require('express');
const router = express.Router();
const db = require('../config/database');
const QRCode = require('qrcode-generator');
const QRCodeLib = require('qrcode');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

// Middleware для проверки прав доступа
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Для простоты пока разрешаем всем аутентифицированным пользователям
    // В будущем можно добавить проверку ролей
    next();
  };
};

// Создание операции производства
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { order_id, operation_type, production_stage, status, assigned_to, notes } = req.body;

    if (!order_id || !operation_type) {
      return res.status(400).json({ message: 'order_id и operation_type обязательны' });
    }

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Проверяем, что заказ существует
      const orderResult = await client.query('SELECT id FROM orders WHERE id = $1', [order_id]);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      // Создаем операцию производства
      const result = await client.query(`
        INSERT INTO production_operations (
          order_id, operation_type, production_stage, status, assigned_to, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        order_id,
        operation_type,
        production_stage || 'КБ',
        status || 'in_progress',
        assigned_to || null,
        notes || null
      ]);

      await client.query('COMMIT');
      client.release();

      res.json({
        message: 'Операция производства создана',
        operation: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка создания операции производства:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 0. Получение заказов для страницы производства
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 200 } = req.query;
    const offset = (page - 1) * limit;
    
    // Показываем только актуальные заказы (за последний год)
    // Статусы в базе: 'new', 'in_progress', 'completed', 'cancelled'
    let whereConditions = [
      'o.status IN (\'in_progress\', \'in_production\', \'production\')',
      'o.created_at >= CURRENT_DATE - INTERVAL \'1 year\''
    ];
    let queryParams = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      paramCount++;
      // Если статус - это этап производства, фильтруем по production_stage
      if (['КБ', 'Столярный цех', 'Формовка', 'Швейный цех', 'Обивка', 'Сборка и упаковка', 'Отгружен'].includes(status)) {
        whereConditions.push(`COALESCE(po.production_stage, 'КБ') = $${paramCount}`);
        queryParams.push(status);
      } else {
        // Если статус - это статус заказа, фильтруем по status
        whereConditions.push(`o.status = $${paramCount}`);
        queryParams.push(status);
      }
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`(o.order_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Получаем заказы с информацией о производстве
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.product_name,
        o.status,
        o.priority,
        o.total_amount,
        o.paid_amount,
        o.delivery_date,
        o.notes,
        o.created_at,
        o.updated_at,
        o.project_description,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.company as customer_company,
        COALESCE(po.production_stage, 'КБ') as production_stage,
        COALESCE(po.status, 'in_progress') as production_status,
        COALESCE(po.created_at, o.created_at) as stage_started_at,
        o.updated_at as stage_updated_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      INNER JOIN production_operations po ON o.id = po.order_id 
        AND po.status = 'in_progress' 
        AND po.operation_type = 'produce'
      WHERE ${whereClause}
      ORDER BY 
        CASE o.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
        END,
        o.delivery_date ASC NULLS LAST,
        o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const allParams = [...queryParams, limit, offset];
    
    const ordersResult = await db.query(ordersQuery, allParams);
    
    // Подсчитываем общее количество
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      INNER JOIN production_operations po ON o.id = po.order_id 
        AND po.status = 'in_progress' 
        AND po.operation_type = 'produce'
      WHERE ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Статусы уже в правильном формате (строки)
    const orders = ordersResult.rows;
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов производства:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// 1. Получение всех этапов производства
router.get('/stages', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, order_index, description, can_work_parallel, is_active
      FROM production_stages
      WHERE is_active = true
      ORDER BY order_index
    `);

    res.json({
      success: true,
      stages: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения этапов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения этапов производства'
    });
  }
});

// Отладочный endpoint для проверки QR-кода
router.get('/qr-debug/:qrCodeId', authenticateToken, async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    
    const result = await db.query(`
      SELECT qr_code, expires_at
      FROM order_qr_codes 
      WHERE id = $1
    `, [qrCodeId]);
    
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'QR-код не найден' });
    }
    
    const qrCode = result.rows[0];
    res.json({
      success: true,
      qr_code: qrCode.qr_code,
      expires_at: qrCode.expires_at,
      qr_code_type: typeof qrCode.qr_code
    });
  } catch (error) {
    console.error('Ошибка отладки QR-кода:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Получение QR-кода по ID
router.get('/qr-image/:qrCodeId', authenticateToken, async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    
    const result = await db.query(`
      SELECT qr_code, expires_at
      FROM order_qr_codes 
      WHERE id = $1
    `, [qrCodeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR-код не найден'
      });
    }
    
    const qrCode = result.rows[0];
    
    // Проверяем срок действия
    if (new Date() > new Date(qrCode.expires_at)) {
      return res.status(410).json({
        success: false,
        error: 'QR-код истек'
      });
    }
    
    // Генерируем QR-код изображение из данных
    try {
      let qrDataString;
      try {
        // Пробуем распарсить как JSON
        const qrData = JSON.parse(qrCode.qr_code);
        qrDataString = JSON.stringify(qrData);
      } catch (e) {
        // Если не JSON, используем как есть
        qrDataString = qrCode.qr_code;
      }
      
      const qrImageBuffer = await QRCodeLib.toBuffer(qrDataString, {
        type: 'png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': qrImageBuffer.length,
        'Cache-Control': 'public, max-age=3600' // Кэшируем на час
      });
      
      res.send(qrImageBuffer);
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка генерации QR-кода'
      });
    }
    
  } catch (error) {
    console.error('Ошибка получения QR-кода:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения QR-кода'
    });
  }
});

// 3. Генерация QR-кода для заказа
router.post('/generate-qr/:orderId', 
  authenticateToken, 
  async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

      const { orderId } = req.params;
      const { stageId } = req.body;
      const userId = req.user.id;

    // Проверяем существование заказа
      const orderResult = await client.query(`
        SELECT id, order_number, current_stage_id
        FROM orders 
        WHERE id = $1
      `, [orderId]);

    if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Заказ не найден'
        });
      }

      // Проверяем, есть ли уже активный QR-код для этого заказа
      const existingQrResult = await client.query(`
        SELECT id, current_stage_id, created_at
        FROM order_qr_codes 
        WHERE order_id = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [orderId]);

      if (existingQrResult.rows.length > 0) {
        const existingQr = existingQrResult.rows[0];
        
        // Получаем полную информацию о QR коде
        const fullQrResult = await client.query(`
          SELECT oqc.*, ps.name as stage_name
          FROM order_qr_codes oqc
          LEFT JOIN production_stages ps ON oqc.current_stage_id = ps.id
          WHERE oqc.id = $1
        `, [existingQr.id]);
        
        const fullQr = fullQrResult.rows[0];
        
        // Генерируем изображение из существующих данных
        const qrData = JSON.parse(fullQr.qr_code);
        const qr = QRCode(0, 'M');
        qr.addData(JSON.stringify(qrData));
        qr.make();
        const qrCodeImage = qr.createDataURL(4);
        
        await client.query('COMMIT');
        return res.json({
          success: true,
          message: 'QR-код уже существует для этого заказа',
          qr_code: {
            id: fullQr.id,
            qr_data: fullQr.qr_code,
            qr_image: qrCodeImage,
            order_id: orderId,
            stage_id: fullQr.current_stage_id,
            stage_name: fullQr.stage_name,
            expires_at: fullQr.expires_at
          }
        });
      }

    const order = orderResult.rows[0];

      // Проверяем существование этапа
      const stageResult = await client.query(`
        SELECT id, name, order_index
        FROM production_stages 
        WHERE id = $1 AND is_active = true
      `, [stageId]);

      if (stageResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Этап производства не найден'
        });
      }

      const stage = stageResult.rows[0];

      // Деактивируем старые QR-коды для этого заказа с retry логикой
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await client.query(`
            UPDATE order_qr_codes 
            SET is_active = false 
            WHERE order_id = $1 AND is_active = true
          `, [orderId]);
          break; // Успешно выполнили, выходим из цикла
        } catch (error) {
          if (error.code === '40P01' && retryCount < maxRetries - 1) {
            // Deadlock, пробуем еще раз
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Экспоненциальная задержка
            continue;
          }
          throw error; // Если не deadlock или превышены попытки
        }
      }

      // Генерируем новый QR-код
      const qrData = {
        orderId: parseInt(orderId),
        stageId: parseInt(stageId),
        timestamp: Math.floor(Date.now() / 1000),
        signature: crypto.createHmac('sha256', process.env.QR_SECRET || 'default_secret')
          .update(`${orderId}-${stageId}-${Math.floor(Date.now() / 1000)}`)
          .digest('hex')
      };

      const qrCodeString = JSON.stringify(qrData);
      
      // Создаем QR код с помощью qrcode-generator
      const qr = QRCode(0, 'M');
      qr.addData(qrCodeString);
      qr.make();
      
      // Конвертируем в base64 изображение
      const qrCodeImage = qr.createDataURL(4);

      // Создаем запись QR-кода с retry логикой
      let qrResult;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          qrResult = await client.query(`
            INSERT INTO order_qr_codes (order_id, qr_code, current_stage_id, created_by, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [
            orderId,
            qrCodeString,
            stageId,
            userId,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
          ]);
          break; // Успешно выполнили, выходим из цикла
        } catch (error) {
          if (error.code === '40P01' && retryCount < maxRetries - 1) {
            // Deadlock, пробуем еще раз
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            continue;
          }
          throw error;
        }
      }

      const qrId = qrResult.rows[0].id;

      // Обновляем заказ с retry логикой
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          await client.query(`
            UPDATE orders 
            SET current_stage_id = $1, qr_code_id = $2, production_status = 'in_progress'
            WHERE id = $3
          `, [stageId, qrId, orderId]);
          break; // Успешно выполнили, выходим из цикла
        } catch (error) {
          if (error.code === '40P01' && retryCount < maxRetries - 1) {
            // Deadlock, пробуем еще раз
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            continue;
          }
          throw error;
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        qr_code: {
          id: qrId,
          qr_data: qrCodeString,
          qr_image: qrCodeImage,
          order_id: orderId,
          stage_id: stageId,
          stage_name: stage.name,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка генерации QR-кода:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка генерации QR-кода'
      });
    } finally {
      client.release();
    }
  }
);

// 3. Сканирование QR-кода
router.post('/scan-qr', 
  authenticateToken, 
  checkPermission('can_scan'),
  async (req, res) => {
    try {
      const { qrCode } = req.body;
      const userId = req.user.id;

      // Парсим QR-код
      let qrData;
      try {
        qrData = JSON.parse(qrCode);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Неверный формат QR-кода'
        });
      }

      // Проверяем подпись QR-кода
      const expectedSignature = crypto.createHmac('sha256', process.env.QR_SECRET || 'default_secret')
        .update(`${qrData.orderId}-${qrData.stageId}-${qrData.timestamp}`)
        .digest('hex');

      if (qrData.signature !== expectedSignature) {
        return res.status(400).json({
          success: false,
          error: 'QR-код поврежден или подделан'
        });
      }

      // Проверяем срок действия QR-кода
      const qrAge = Math.floor(Date.now() / 1000) - qrData.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
      
      if (qrAge > maxAge) {
      return res.status(400).json({ 
          success: false,
          error: 'QR-код устарел'
        });
      }

      // Получаем данные заказа
      const orderResult = await db.query(`
        SELECT o.*, ps.name as stage_name, ps.order_index as stage_order
        FROM orders o
        JOIN production_stages ps ON o.current_stage_id = ps.id
        WHERE o.id = $1
      `, [qrData.orderId]);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Заказ не найден'
        });
      }

      const order = orderResult.rows[0];

      // Проверяем, может ли пользователь работать с этим этапом
      const userStageResult = await db.query(`
        SELECT stage_id FROM users WHERE id = $1
      `, [userId]);

      const userStageId = userStageResult.rows[0]?.stage_id;

      if (userStageId && userStageId !== qrData.stageId) {
        return res.status(403).json({
          success: false,
          error: 'Вы не можете работать с заказами этого этапа'
        });
      }

      res.json({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          product_name: order.product_name,
          current_stage: {
            id: order.current_stage_id,
            name: order.stage_name,
            order_index: order.stage_order
          },
          production_status: order.production_status,
          created_at: order.created_at
        },
        can_confirm: req.user.can_confirm
      });

    } catch (error) {
      console.error('Ошибка сканирования QR-кода:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сканирования QR-кода'
      });
    }
  }
);

// 4. Подтверждение принятия заказа
router.post('/confirm-order', 
  authenticateToken, 
  checkPermission('can_confirm'),
  async (req, res) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { orderId, stageId, notes } = req.body;
      const userId = req.user.id;

      // Проверяем возможность перехода
      const canTransfer = await client.query(`
        SELECT can_transfer_to_stage($1, $2, $3) as can_transfer
      `, [orderId, null, stageId]);

      if (!canTransfer.rows[0].can_transfer) {
        return res.status(400).json({
          success: false,
          error: 'Невозможно принять заказ на этом этапе'
        });
      }

      // Создаем запись о перемещении
      const transferResult = await client.query(`
        INSERT INTO order_transfers (order_id, to_stage_id, scanned_by, status, notes)
        VALUES ($1, $2, $3, 'confirmed', $4)
        RETURNING id
      `, [orderId, stageId, userId, notes]);

      // Обновляем статус заказа
      await client.query(`
        UPDATE orders 
        SET current_stage_id = $1, production_status = 'in_progress'
        WHERE id = $2
      `, [stageId, orderId]);

      // Создаем уведомления
      await client.query(`
        SELECT create_production_notification(
          $1, $2, 'order_transferred', 
          'Заказ принят в работу', 
          'Заказ #' || $3 || ' принят на этапе ' || $4
        )
      `, [userId, orderId, orderId, stageId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Заказ успешно принят в работу',
        transfer_id: transferResult.rows[0].id
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка подтверждения заказа:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка подтверждения заказа'
      });
    } finally {
      client.release();
    }
  }
);

// 5. Отметка заказа как готового
router.post('/mark-ready', 
  authenticateToken, 
  checkPermission('can_confirm'),
  async (req, res) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { orderId, notes } = req.body;
      const userId = req.user.id;

      // Получаем текущий этап заказа
      const currentStageResult = await client.query(`
        SELECT current_stage_id FROM orders WHERE id = $1
      `, [orderId]);

      if (currentStageResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Заказ не найден'
        });
      }

      const currentStageId = currentStageResult.rows[0].current_stage_id;

      // Если текущий этап не установлен, устанавливаем первый этап
      if (!currentStageId) {
        const firstStageResult = await client.query(`
          SELECT id FROM production_stages 
          WHERE is_active = true 
          ORDER BY order_index ASC 
          LIMIT 1
        `);
        
        if (firstStageResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Не найдены активные этапы производства'
          });
        }
        
        const firstStageId = firstStageResult.rows[0].id;
        
        // Обновляем заказ с первым этапом
        await client.query(`
          UPDATE orders 
          SET production_status = 'ready', current_stage_id = $2
          WHERE id = $1
        `, [orderId, firstStageId]);

        // Создаем запись о готовности с первым этапом
        await client.query(`
          INSERT INTO order_transfers (order_id, from_stage_id, to_stage_id, scanned_by, status, notes, transfer_type)
          VALUES ($1, $2, $3, $4, 'ready', $5, 'normal')
        `, [orderId, firstStageId, firstStageId, userId, notes]);
        
        await client.query('COMMIT');
        return res.json({
          success: true,
          message: 'Заказ отмечен как готовый и назначен на первый этап'
        });
      }

      // Получаем следующий этап
      const nextStageResult = await client.query(`
        SELECT id FROM production_stages 
        WHERE order_index = (
          SELECT order_index + 1 FROM production_stages 
          WHERE id = $1
        ) AND is_active = true
        ORDER BY order_index LIMIT 1
      `, [currentStageId]);

      const nextStageId = nextStageResult.rows.length > 0 ? nextStageResult.rows[0].id : currentStageId;

      // Обновляем статус заказа
      await client.query(`
        UPDATE orders 
        SET production_status = 'ready', current_stage_id = $2
        WHERE id = $1
      `, [orderId, nextStageId]);

      // Создаем запись о готовности
      await client.query(`
        INSERT INTO order_transfers (order_id, from_stage_id, to_stage_id, scanned_by, status, notes, transfer_type)
        VALUES ($1, $2, $3, $4, 'ready', $5, 'normal')
      `, [orderId, currentStageId, nextStageId, userId, notes]);

      // Создаем уведомления для следующего этапа
      await client.query(`
        SELECT create_production_notification(
          null, $1, 'order_ready', 
          'Заказ готов к передаче', 
          'Заказ #' || $2 || ' готов к передаче на следующий этап'
        )
      `, [orderId, orderId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Заказ отмечен как готовый'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка отметки готовности:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка отметки готовности'
      });
    } finally {
      client.release();
    }
  }
);

// 6. Возврат заказа на доработку
router.post('/return-order', 
  authenticateToken, 
  checkPermission('can_return_orders'),
  async (req, res) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { orderId, fromStageId, toStageId, returnType, reason } = req.body;
      const userId = req.user.id;

      // Создаем запись о возврате
      const returnResult = await client.query(`
        INSERT INTO order_returns (order_id, from_stage_id, to_stage_id, return_type, reason, returned_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [orderId, fromStageId, toStageId, returnType, reason, userId]);

      // Обновляем статус заказа
    await client.query(`
        UPDATE orders 
        SET current_stage_id = $1, production_status = 'in_progress'
        WHERE id = $2
      `, [toStageId, orderId]);

      // Создаем запись о перемещении
    await client.query(`
        INSERT INTO order_transfers (order_id, from_stage_id, to_stage_id, scanned_by, status, transfer_type, notes)
        VALUES ($1, $2, $3, $4, 'confirmed', 'rework', $5)
      `, [orderId, fromStageId, toStageId, userId, reason]);

    await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Заказ возвращен на доработку',
        return_id: returnResult.rows[0].id
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка возврата заказа:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка возврата заказа'
      });
    } finally {
      client.release();
    }
  }
);

// 7. Фиксация времени работы
router.post('/log-work-time', 
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId, stageId, startedAt, finishedAt, hourlyRate, notes } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        INSERT INTO work_time_logs (order_id, stage_id, worker_id, started_at, finished_at, hourly_rate, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, work_duration, total_payment
      `, [orderId, stageId, userId, startedAt, finishedAt, hourlyRate, notes]);

      res.json({
        success: true,
        work_log: {
          id: result.rows[0].id,
          work_duration: result.rows[0].work_duration,
          total_payment: result.rows[0].total_payment
        }
      });

    } catch (error) {
      console.error('Ошибка фиксации времени работы:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка фиксации времени работы'
      });
    }
  }
);

// 8. Получение статистики производства
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM production_stats
    `);

    res.json({
      success: true,
      stats: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

// Получение статистики производства для дашборда
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN production_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN production_status = 'in_progress' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN production_status = 'ready' THEN 1 END) as ready_orders,
        COUNT(CASE WHEN production_status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN production_status = 'on_hold' THEN 1 END) as on_hold_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    // Статистика по этапам
    const stageStatsResult = await db.query(`
      SELECT 
        ps.name as stage_name,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_amount
      FROM production_stages ps
      LEFT JOIN orders o ON o.current_stage_id = ps.id 
        AND o.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      WHERE ps.is_active = true
      GROUP BY ps.id, ps.name, ps.order_index
      ORDER BY ps.order_index
    `);

    res.json({ 
      stats: statsResult.rows[0],
      stage_stats: stageStatsResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики производства:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 9. Получение отчетов по сотрудникам
router.get('/worker-reports', 
  authenticateToken, 
  checkPermission('can_manage_workers'),
  async (req, res) => {
    try {
      const { workerId, stageId, dateFrom, dateTo } = req.query;
      
      let query = `
        SELECT * FROM worker_reports
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (workerId) {
        paramCount++;
        query += ` AND worker_id = $${paramCount}`;
        params.push(workerId);
      }

      if (stageId) {
        paramCount++;
        query += ` AND stage_id = $${paramCount}`;
        params.push(stageId);
      }

      query += ` ORDER BY worker_name, stage_name`;

      const result = await db.query(query, params);

      res.json({
        success: true,
        reports: result.rows
      });
    } catch (error) {
      console.error('Ошибка получения отчетов:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения отчетов'
      });
    }
  }
);

// 10. Получение уведомлений пользователя
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { isRead } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT * FROM production_notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (isRead !== undefined) {
      paramCount++;
      query += ` AND is_read = $${paramCount}`;
      params.push(isRead === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения уведомлений'
    });
  }
});

// 11. Отметка уведомления как прочитанного
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(`
      UPDATE production_notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Уведомление не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Уведомление отмечено как прочитанное'
    });
  } catch (error) {
    console.error('Ошибка обновления уведомления:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления уведомления'
    });
  }
});

module.exports = router;