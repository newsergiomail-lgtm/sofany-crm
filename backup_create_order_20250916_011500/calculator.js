const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Функции для перевода названий материалов на русский язык
const translateMaterial = (type, value) => {
  const translations = {
    frame: {
      'dsp': 'ДСП (базовый)',
      'plywood': 'Фанера (стандарт)',
      'metal': 'Металлокаркас (премиум)'
    },
    fabric: {
      '300': 'Ткань 1 кат.',
      '800': 'Ткань 2 кат.',
      '1000': 'Ткань 3 кат.',
      '1400': 'Ткань 4 кат.',
      '1500': 'Эко-кожа',
      '5000': 'Натуральная кожа'
    },
    mechanism: {
      '0': 'Отсутствует',
      '1000': 'Книжка',
      '3000': 'Еврокнижка',
      '3500': 'Тик-так',
      '12000': 'Раскладушка'
    },
    product: {
      'sofa': 'Диван',
      'armchair': 'Кресло',
      'bed': 'Кровать'
    },
    extras: {
      'massage': 'Массажный механизм',
      'lighting': 'Подсветка',
      'usb': 'USB-разъемы',
      'recliner-mech': 'Реклайнер механический',
      'recliner-elec': 'Реклайнер электрический',
      'audio': 'Стереосистема Bluetooth',
      'stitching': 'Отстрочка',
      'tufting': 'Утяжки',
      'piping': 'Кант',
      'nails': 'Декоративные гвозди',
      'buttons': 'Пуговицы',
      'carriage': 'Каретная стяжка',
      'linen-box': 'Бельевой ящик',
      'lift-mechanism': 'Подъемный механизм'
    }
  };
  
  return translations[type]?.[value] || value;
};

// Функция генерации номера заказа
const generateOrderNumber = async (client, prefix) => {
  try {
    // Получаем текущий год
    const currentYear = new Date().getFullYear();
    
    // Получаем последний номер заказа с данным префиксом за текущий год
    const result = await client.query(`
      SELECT order_number 
      FROM orders 
      WHERE order_number LIKE $1 
      ORDER BY order_number DESC 
      LIMIT 1
    `, [`${prefix}-${currentYear}-%`]);
    
    let nextNumber = 1;
    
    if (result.rows.length > 0) {
      // Извлекаем номер из последнего заказа
      const lastOrderNumber = result.rows[0].order_number;
      const match = lastOrderNumber.match(new RegExp(`${prefix}-${currentYear}-(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Форматируем номер с ведущими нулями (4 цифры)
    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Ошибка генерации номера заказа:', error);
    // Fallback к timestamp если что-то пошло не так
    return `${prefix}-${Date.now()}`;
  }
};

// Схемы валидации для данных от калькулятора
const calculatorDataSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow(null),
    email: Joi.string().email().allow(null),
    source: Joi.string().default('sofany.pro')
  }).required(),
  order: Joi.object({
    notes: Joi.string().allow(null),
    external_ref: Joi.string().allow(null)
  }).required(),
  config: Joi.object({
    product: Joi.object({
      type: Joi.string().required(),
      complexity_factor: Joi.number().min(0).default(1)
    }).required(),
    dimensions: Joi.object({
      bed: Joi.boolean().default(false),
      width_mm: Joi.number().min(0),
      depth_mm: Joi.number().min(0).allow(null),
      height_mm: Joi.number().min(0).allow(null),
      length_mm: Joi.number().min(0).allow(null),
      tsarga_mm: Joi.number().min(0).allow(null),
      headboard_mm: Joi.number().min(0).allow(null)
    }).required(),
    seating: Joi.object({
      firmness: Joi.number().min(0).default(1),
      armrests: Joi.number().min(0).default(0)
    }).required(),
    mechanism: Joi.object({
      code: Joi.string().allow(''),
      cost_rub: Joi.number().min(0).default(0)
    }).required(),
    materials: Joi.object({
      frame: Joi.string().allow(''),
      fabric: Joi.string().allow(''),
      supports_rub: Joi.number().min(0).default(0),
      fabric_cost_rub: Joi.number().min(0).default(0),
      bed_base_mul: Joi.number().min(0).allow(null)
    }).required(),
    pillows: Joi.object({
      back: Joi.number().min(0).default(0),
      seat: Joi.number().min(0).default(0),
      decor: Joi.number().min(0).default(0)
    }).required(),
    extras: Joi.array().items(Joi.object({
      type: Joi.string().allow(''),
      value: Joi.number().min(0).default(0)
    })).default([])
  }).required(),
  bom: Joi.object({
    fabric_m: Joi.number().min(0).default(0),
    pu: Joi.object({
      layers_count: Joi.number().min(0).default(0),
      total_thickness_mm: Joi.number().min(0).default(0),
      total_weight_kg: Joi.number().min(0).default(0),
      total_cost_rub: Joi.number().min(0).default(0),
      layers: Joi.array().items(Joi.object({
        brand: Joi.string().allow(''),
        thickness_mm: Joi.number().min(0).default(0),
        weight_kg: Joi.number().min(0).default(0),
        cost_rub: Joi.number().min(0).default(0)
      })).default([])
    }).required(),
    materials_list_text: Joi.string().allow('')
  }).required(),
  pricing: Joi.object({
    materials: Joi.number().min(0).default(0),
    labor: Joi.number().min(0).default(0),
    pu: Joi.number().min(0).default(0),
    options: Joi.number().min(0).default(0),
    total_cost: Joi.number().min(0).default(0),
    price: Joi.number().min(0).default(0),
    margin: Joi.number().default(0),
    markup_pct: Joi.number().min(0).default(0)
  }).required()
});

// Middleware для проверки токена калькулятора
const validateCalculatorToken = (req, res, next) => {
  const token = req.query.token || req.headers['x-calculator-token'];
  const validToken = process.env.CALCULATOR_TOKEN || 'YyYujyrcfGyvit76F56f5fUurtUTDX54dyXYchcxhtXr3yH';
  
  if (token !== validToken) {
    return res.status(401).json({ message: 'Неверный токен калькулятора' });
  }
  
  next();
};

// Endpoint для приема данных от калькулятора
router.post('/create-order', validateCalculatorToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { error, value } = calculatorDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Ошибка валидации данных', 
        details: error.details[0].message 
      });
    }

    const { customer, order, config, bom, pricing } = value;

    // Проверяем существование клиента или создаем нового
    let customerId;
    if (customer.email) {
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customer.email]
      );
      
      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      }
    }

    if (!customerId && customer.phone) {
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE phone = $1',
        [customer.phone]
      );
      
      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      }
    }

    // Создаем нового клиента, если не найден
    if (!customerId) {
      const newCustomer = await client.query(`
        INSERT INTO customers (name, email, phone, notes, status, created_by)
        VALUES ($1, $2, $3, $4, 'active', 1)
        RETURNING id
      `, [
        customer.name,
        customer.email,
        customer.phone,
        `Источник: ${customer.source}`
      ]);
      customerId = newCustomer.rows[0].id;
    }

    // Генерируем номер заказа
    const orderNumber = await generateOrderNumber(client, 'CALC');

    // Формируем описание проекта из конфигурации калькулятора
    const mechanismName = config.mechanism.cost_rub > 0 ? translateMaterial('mechanism', config.mechanism.cost_rub.toString()) : 'Отсутствует';
    const projectDescription = `Тип: ${translateMaterial('product', config.product.type)}, Размеры: ${config.dimensions.width_mm}мм x ${config.dimensions.depth_mm}мм x ${config.dimensions.height_mm}мм, Материал каркаса: ${translateMaterial('frame', config.materials.frame)}, Ткань: ${translateMaterial('fabric', config.materials.fabric)}, Механизм: ${mechanismName}, Подушки: спинка ${config.pillows.back}, сиденье ${config.pillows.seat}, декоративные ${config.pillows.decor}`;

    // Генерируем название продукта для отображения в канбане
    const productName = `${translateMaterial('product', config.product.type)} ${config.dimensions.width_mm}мм + ${mechanismName}`;

    // Создаем заказ со статусом "черновик"
    const newOrder = await client.query(`
      INSERT INTO orders (order_number, customer_id, status, priority, total_amount, notes, project_description, product_name, created_by, calculator_data, source)
      VALUES ($1, $2, 'draft', 'normal', $3, $4, $5, $6, 1, $7, 'calc')
      RETURNING id
    `, [
      orderNumber,
      customerId,
      pricing.price,
      order.notes || `Заказ из калькулятора. ${order.external_ref || ''}`,
      projectDescription,
      productName,
      JSON.stringify({ config, bom, pricing })
    ]);

    const orderId = newOrder.rows[0].id;

    // Создаем детальные позиции заказа из данных калькулятора
    const positions = [];

    // Основной продукт
    const productItemName = `${translateMaterial('product', config.product.type)} (${config.dimensions.width_mm}мм)`;
    const productMechanismName = config.mechanism.cost_rub > 0 ? translateMaterial('mechanism', config.mechanism.cost_rub.toString()) : 'Отсутствует';
    const productDescription = `
Тип: ${translateMaterial('product', config.product.type)}
Размеры: ${config.dimensions.width_mm}мм${config.dimensions.depth_mm ? ` x ${config.dimensions.depth_mm}мм` : ''}${config.dimensions.height_mm ? ` x ${config.dimensions.height_mm}мм` : ''}
Материал каркаса: ${translateMaterial('frame', config.materials.frame)}
Ткань: ${translateMaterial('fabric', config.materials.fabric)}
Механизм: ${productMechanismName}
Подушки: спинка ${config.pillows.back}, сиденье ${config.pillows.seat}, декоративные ${config.pillows.decor}
    `.trim();

    positions.push({
      name: productItemName,
      description: productDescription,
      quantity: 1,
      unit_price: pricing.price,
      total_price: pricing.price,
      materials_cost: pricing.materials + pricing.pu + pricing.options,
      labor_cost: pricing.labor
    });

    // Материалы каркаса
    if (config.materials.frame && config.materials.frame !== '') {
      positions.push({
        name: `Материал каркаса: ${translateMaterial('frame', config.materials.frame)}`,
        description: 'Материал для изготовления каркаса',
        quantity: 1,
        unit_price: config.materials.supports_rub || 0,
        total_price: config.materials.supports_rub || 0,
        materials_cost: config.materials.supports_rub || 0,
        labor_cost: 0
      });
    }

    // Ткань
    if (config.materials.fabric && config.materials.fabric !== '') {
      const fabricCost = config.materials.fabric_cost_rub || 0;
      positions.push({
        name: `Ткань: ${translateMaterial('fabric', config.materials.fabric)}`,
        description: `Ткань для обивки (${bom.fabric_m || 0}м)`,
        quantity: 1,
        unit_price: fabricCost,
        total_price: fabricCost,
        materials_cost: fabricCost,
        labor_cost: 0
      });
    }

    // Механизм
    if (config.mechanism.cost_rub > 0) {
      const mechanismName = translateMaterial('mechanism', config.mechanism.cost_rub.toString());
      positions.push({
        name: `Механизм: ${mechanismName}`,
        description: 'Механизм трансформации',
        quantity: 1,
        unit_price: config.mechanism.cost_rub,
        total_price: config.mechanism.cost_rub,
        materials_cost: config.mechanism.cost_rub,
        labor_cost: 0
      });
    }

    // PU слои
    if (bom.pu && bom.pu.layers && bom.pu.layers.length > 0) {
      bom.pu.layers.forEach((layer, index) => {
        if (layer.brand && layer.cost_rub > 0) {
          positions.push({
            name: `PU слой ${index + 1}: ${layer.brand}`,
            description: `Толщина: ${layer.thickness_mm}мм, Вес: ${layer.weight_kg}кг`,
            quantity: 1,
            unit_price: layer.cost_rub,
            total_price: layer.cost_rub,
            materials_cost: layer.cost_rub,
            labor_cost: 0
          });
        }
      });
    }

    // Дополнительные опции
    if (config.extras && config.extras.length > 0) {
      config.extras.forEach((extra, index) => {
        if (extra.type && extra.value > 0) {
          positions.push({
            name: `Доп. опция: ${translateMaterial('extras', extra.type)}`,
            description: 'Дополнительная опция из калькулятора',
            quantity: 1,
            unit_price: extra.value,
            total_price: extra.value,
            materials_cost: extra.value,
            labor_cost: 0
          });
        }
      });
    }

    // Вставляем все позиции
    for (const position of positions) {
      await client.query(`
        INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price, materials_cost, labor_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId,
        position.name,
        position.description,
        position.quantity,
        position.unit_price,
        position.total_price,
        position.materials_cost,
        position.labor_cost
      ]);
    }

    // Обновляем данные калькулятора в заказе с полной информацией
    const calculatorData = {
      config,
      bom,
      pricing,
      positions: positions,
      financial: {
        total_cost: pricing.total_cost,
        materials_cost: pricing.materials,
        labor_cost: pricing.labor,
        pu_cost: pricing.pu,
        options_cost: pricing.options,
        sale_price: pricing.price,
        profit: pricing.price - pricing.total_cost,
        margin: pricing.markup_pct
      }
    };

    // Обновляем calculator_data в заказе
    await client.query(`
      UPDATE orders 
      SET calculator_data = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [JSON.stringify(calculatorData), orderId]);

    // Сохраняем данные калькулятора в отдельной таблице
    await client.query(`
      INSERT INTO calculator_orders (order_id, calculator_data, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `, [orderId, JSON.stringify(calculatorData)]);

    // Добавляем запись в историю статусов
    await client.query(`
      INSERT INTO order_status_history (order_id, status, comment, created_by)
      VALUES ($1, 'draft', 'Заказ создан из калькулятора Sofany.pro', 1)
    `, [orderId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      code: orderNumber,
      id: orderId,
      message: 'Заказ успешно создан из калькулятора'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка создания заказа из калькулятора:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при создании заказа',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка сервера'
    });
  } finally {
    client.release();
  }
});

// Получение списка заказов из калькулятора
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE co.order_id IS NOT NULL AND o.status != \'cancelled\'';
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (o.order_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM calculator_orders co
      LEFT JOIN orders o ON co.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Получение заказов
    paramCount++;
    const ordersQuery = `
      SELECT 
        co.*,
        o.order_number,
        o.status as order_status,
        o.total_amount,
        o.created_at as order_created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM calculator_orders co
      LEFT JOIN orders o ON co.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY co.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    queryParams.push(limit, offset);

    const ordersResult = await db.query(ordersQuery, queryParams);

    res.json({
      orders: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов из калькулятора:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение детальной информации о заказе из калькулятора
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        co.*,
        o.order_number,
        o.status as order_status,
        o.total_amount,
        o.notes as order_notes,
        o.created_at as order_created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM calculator_orders co
      LEFT JOIN orders o ON co.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE co.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = result.rows[0];
    order.calculator_data = JSON.parse(order.calculator_data);

    res.json({ order });
  } catch (error) {
    console.error('Ошибка получения заказа из калькулятора:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Статистика заказов из калькулятора
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(CASE WHEN o.status = 'new' THEN 1 END) as new_orders,
        COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN o.status = 'in_production' THEN 1 END) as in_production_orders
      FROM calculator_orders co
      LEFT JOIN orders o ON co.order_id = o.id
      WHERE co.created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Ошибка получения статистики калькулятора:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Импорт данных из калькулятора в заказ
router.post('/orders/:calculatorOrderId/import-to-order/:orderId', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { calculatorOrderId, orderId } = req.params;

    // Получаем данные из калькулятора
    const calculatorResult = await client.query(`
      SELECT calculator_data FROM calculator_orders WHERE id = $1
    `, [calculatorOrderId]);

    if (calculatorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ из калькулятора не найден' });
    }

    const calculatorData = typeof calculatorResult.rows[0].calculator_data === 'string' 
      ? JSON.parse(calculatorResult.rows[0].calculator_data) 
      : calculatorResult.rows[0].calculator_data;
    const { config, bom, pricing } = calculatorData;

    // Создаем позиции на основе данных калькулятора
    const positions = [];

    // Основная позиция - продукт
    const productName = `${config.product.type === 'bed' ? 'Кровать' : 'Диван'} (${config.dimensions.width_mm}мм)`;
    positions.push({
      name: productName,
      quantity: 1,
      price: pricing.price,
      description: `Тип: ${config.product.type}, Размеры: ${config.dimensions.width_mm}мм${config.dimensions.depth_mm ? ` x ${config.dimensions.depth_mm}мм` : ''}${config.dimensions.height_mm ? ` x ${config.dimensions.height_mm}мм` : ''}`
    });

    // Материалы
    if (bom.materials_list_text) {
      const materials = bom.materials_list_text.split('\n').filter(line => line.trim());
      materials.forEach(material => {
        if (material.trim()) {
          positions.push({
            name: `Материал: ${material.trim()}`,
            quantity: 1,
            price: 0, // Цена будет установлена вручную
            description: 'Материал из калькулятора'
          });
        }
      });
    }

    // PU слои
    if (bom.pu && bom.pu.layers && bom.pu.layers.length > 0) {
      bom.pu.layers.forEach((layer, index) => {
        if (layer.brand && layer.cost_rub > 0) {
          positions.push({
            name: `PU слой ${index + 1}: ${layer.brand}`,
            quantity: 1,
            price: layer.cost_rub,
            description: `Толщина: ${layer.thickness_mm}мм, Вес: ${layer.weight_kg}кг`
          });
        }
      });
    }

    // Дополнительные опции
    if (config.extras && config.extras.length > 0) {
      config.extras.forEach((extra, index) => {
        if (extra.type && extra.value > 0) {
          positions.push({
            name: `Доп. опция: ${extra.type}`,
            quantity: 1,
            price: extra.value,
            description: 'Дополнительная опция из калькулятора'
          });
        }
      });
    }

    // Обновляем calculator_data в заказе
    const updateData = {
      calculator_data: {
        positions: positions,
        financial: {
          total_cost: pricing.total_cost,
          materials_cost: pricing.materials,
          labor_cost: pricing.labor,
          pu_cost: pricing.pu,
          options_cost: pricing.options,
          sale_price: pricing.price,
          profit: pricing.price - pricing.total_cost,
          margin: pricing.markup_pct
        },
        original_calculator_data: calculatorData
      }
    };

    // Удаляем существующие позиции заказа
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    // Создаем новые позиции заказа
    for (const position of positions) {
      await client.query(`
        INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price, materials_cost, labor_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId,
        position.name,
        position.description || '',
        position.quantity,
        position.price,
        position.quantity * position.price,
        0, // materials_cost
        0  // labor_cost
      ]);
    }

    // Вычисляем общую сумму заказа
    const totalAmount = positions.reduce((sum, pos) => sum + (pos.quantity * pos.price), 0);

    // Обновляем заказ
    await client.query(`
      UPDATE orders 
      SET calculator_data = $1, total_amount = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [JSON.stringify(updateData), totalAmount, orderId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      positions: positions,
      message: 'Данные из калькулятора успешно импортированы'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка импорта данных из калькулятора:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при импорте данных',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка сервера'
    });
  } finally {
    client.release();
  }
});

module.exports = router;

