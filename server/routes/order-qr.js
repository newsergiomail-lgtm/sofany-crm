const express = require('express');
const qrcode = require('qrcode-generator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Функция для генерации QR-кода
function generateQRCode(data) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(JSON.stringify(data));
    qr.make();
    return qr.createDataURL(4);
  } catch (error) {
    console.error('Ошибка генерации QR-кода:', error);
    return null;
  }
}

// GET /api/order-qr/:orderId - получить QR-код заказа
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Получаем данные заказа
    const orderResult = await db.query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    const order = orderResult.rows[0];
    
    // Генерируем QR-код
    const qrData = {
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const qrImage = generateQRCode(qrData);
    
    if (!qrImage) {
      return res.status(500).json({ message: 'Ошибка генерации QR-кода' });
    }
    
    res.json({
      success: true,
      qr_code: qrImage,
      order_data: qrData
    });
    
  } catch (error) {
    console.error('Ошибка получения QR-кода:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/order-qr/generate - сгенерировать QR-код для заказа
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { orderId, data } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'ID заказа обязателен' });
    }
    
    const qrData = data || {
      order_id: orderId,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const qrImage = generateQRCode(qrData);
    
    if (!qrImage) {
      return res.status(500).json({ message: 'Ошибка генерации QR-кода' });
    }
    
    res.json({
      success: true,
      qr_code: qrImage,
      order_data: qrData
    });
    
  } catch (error) {
    console.error('Ошибка генерации QR-кода:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;



