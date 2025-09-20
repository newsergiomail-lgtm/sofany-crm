const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');

const router = express.Router();

// Настройка email
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

// Настройка Telegram бота
let telegramBot = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
}

// Схемы валидации
const notificationSchema = Joi.object({
  user_id: Joi.number().integer().allow(null),
  type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  data: Joi.object().allow(null)
});

// Получение уведомлений пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,
      is_read,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['(user_id = $1 OR user_id IS NULL)'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    // Фильтры
    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    if (is_read !== undefined) {
      paramCount++;
      whereConditions.push(`is_read = $${paramCount}`);
      queryParams.push(is_read === 'true');
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Подсчет общего количества
    const countQuery = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Получение уведомлений
    paramCount++;
    const notificationsQuery = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    queryParams.push(limit, offset);

    const notificationsResult = await db.query(notificationsQuery, queryParams);

    res.json({
      notifications: notificationsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание уведомления
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = notificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { user_id, type, title, message, data } = value;

    const result = await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, type, title, message, data ? JSON.stringify(data) : null]);

    res.status(201).json({
      message: 'Уведомление создано',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметка уведомления как прочитанного
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({
      message: 'Уведомление отмечено как прочитанное',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметка всех уведомлений как прочитанных
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await db.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false
    `, [req.user.id]);

    res.json({ message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    console.error('Ошибка обновления уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправка email уведомления
router.post('/send-email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ message: 'Поля to, subject и text обязательны' });
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    await emailTransporter.sendMail(mailOptions);

    res.json({ message: 'Email отправлен успешно' });
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    res.status(500).json({ message: 'Ошибка отправки email' });
  }
});

// Отправка Telegram уведомления
router.post('/send-telegram', authenticateToken, async (req, res) => {
  try {
    const { chat_id, message } = req.body;

    if (!chat_id || !message) {
      return res.status(400).json({ message: 'Поля chat_id и message обязательны' });
    }

    if (!telegramBot) {
      return res.status(400).json({ message: 'Telegram бот не настроен' });
    }

    await telegramBot.sendMessage(chat_id, message);

    res.json({ message: 'Telegram сообщение отправлено успешно' });
  } catch (error) {
    console.error('Ошибка отправки Telegram:', error);
    res.status(500).json({ message: 'Ошибка отправки Telegram сообщения' });
  }
});

// Получение статистики уведомлений
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info_count,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN type = 'success' THEN 1 END) as success_count
      FROM notifications 
      WHERE user_id = $1 OR user_id IS NULL
    `, [req.user.id]);

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Ошибка получения статистики уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Автоматические уведомления при создании заказа
const createOrderNotification = async (orderId, orderNumber, customerName) => {
  try {
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (NULL, 'info', 'Новый заказ', 'Создан новый заказ ${orderNumber} от клиента ${customerName}', $1)
    `, [JSON.stringify({ order_id: orderId, order_number: orderNumber })]);

    // Отправляем в Telegram, если настроен
    if (telegramBot && process.env.TELEGRAM_CHAT_ID) {
      await telegramBot.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        `🆕 Новый заказ!\n\nНомер: ${orderNumber}\nКлиент: ${customerName}\n\nПроверьте CRM для деталей.`
      );
    }
  } catch (error) {
    console.error('Ошибка создания уведомления о заказе:', error);
  }
};

// Автоматические уведомления при изменении статуса заказа
const createStatusChangeNotification = async (orderId, orderNumber, oldStatus, newStatus) => {
  try {
    const statusNames = {
      'new': 'Новый',
      'confirmed': 'Подтвержден',
      'in_production': 'В производстве',
      'ready': 'Готов',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };

    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (NULL, 'info', 'Изменение статуса заказа', 'Заказ ${orderNumber} изменил статус с "${statusNames[oldStatus]}" на "${statusNames[newStatus]}"', $1)
    `, [JSON.stringify({ order_id: orderId, order_number: orderNumber, old_status: oldStatus, new_status: newStatus })]);

    // Отправляем в Telegram для важных изменений
    if (telegramBot && process.env.TELEGRAM_CHAT_ID && ['ready', 'shipped', 'delivered'].includes(newStatus)) {
      await telegramBot.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        `📦 Статус заказа обновлен!\n\nЗаказ: ${orderNumber}\nСтатус: ${statusNames[newStatus]}\n\nПроверьте CRM для деталей.`
      );
    }
  } catch (error) {
    console.error('Ошибка создания уведомления об изменении статуса:', error);
  }
};

// Автоматические уведомления о низких остатках
const createLowStockNotification = async (materialName, currentStock, minStock) => {
  try {
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (NULL, 'warning', 'Низкие остатки', 'Материал "${materialName}" заканчивается. Текущий остаток: ${currentStock}, минимальный: ${minStock}', $1)
    `, [JSON.stringify({ material_name: materialName, current_stock: currentStock, min_stock: minStock })]);

    // Отправляем в Telegram
    if (telegramBot && process.env.TELEGRAM_CHAT_ID) {
      await telegramBot.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        `⚠️ Низкие остатки!\n\nМатериал: ${materialName}\nТекущий остаток: ${currentStock}\nМинимальный: ${minStock}\n\nНеобходимо пополнить склад.`
      );
    }
  } catch (error) {
    console.error('Ошибка создания уведомления о низких остатках:', error);
  }
};

module.exports = {
  router,
  createOrderNotification,
  createStatusChangeNotification,
  createLowStockNotification
};
