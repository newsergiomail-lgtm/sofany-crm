const db = require('../config/database');

const analyzeOrders = async () => {
  try {
    console.log('🔍 Анализ заказов на предмет несоответствий и пустых полей...\n');

    // Получаем все заказы с полной информацией
    const ordersResult = await db.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_number
    `);

    const orders = ordersResult.rows;
    
    console.log(`📊 Всего заказов в базе: ${orders.length}\n`);

    // Разделяем заказы по типу
    const calcOrders = orders.filter(o => o.order_number.startsWith('CALC-'));
    const crmOrders = orders.filter(o => o.order_number.startsWith('CRM-'));

    console.log(`🧮 Заказы из калькулятора: ${calcOrders.length}`);
    console.log(`💼 Заказы из CRM: ${crmOrders.length}\n`);

    const issues = {
      calcOrders: [],
      crmOrders: [],
      common: [],
      critical: []
    };

    // Анализируем заказы из калькулятора
    console.log('🔍 АНАЛИЗ ЗАКАЗОВ ИЗ КАЛЬКУЛЯТОРА:');
    console.log('=' .repeat(50));

    calcOrders.forEach((order, index) => {
      const orderIssues = [];
      
      // Проверяем основные поля
      if (!order.product_name) orderIssues.push('❌ product_name пустое');
      if (!order.customer_name) orderIssues.push('❌ customer_name пустое');
      if (!order.customer_email) orderIssues.push('❌ customer_email пустое');
      if (!order.customer_phone) orderIssues.push('❌ customer_phone пустое');
      if (!order.total_amount || order.total_amount <= 0) orderIssues.push('❌ total_amount некорректное');
      if (!order.delivery_date) orderIssues.push('❌ delivery_date пустое');
      if (!order.project_description) orderIssues.push('❌ project_description пустое');
      if (!order.delivery_address) orderIssues.push('❌ delivery_address пустое');
      if (order.has_elevator === null) orderIssues.push('❌ has_elevator не указано');
      if (!order.floor) orderIssues.push('❌ floor пустое');
      if (!order.delivery_notes) orderIssues.push('❌ delivery_notes пустое');

      // Проверяем данные калькулятора
      if (!order.calculator_data) {
        orderIssues.push('🔴 КРИТИЧНО: calculator_data отсутствует');
        issues.critical.push(`${order.order_number}: calculator_data отсутствует`);
      } else {
        try {
          const calcData = typeof order.calculator_data === 'string' 
            ? JSON.parse(order.calculator_data) 
            : order.calculator_data;
          
          if (!calcData.customer) orderIssues.push('❌ calculator_data.customer отсутствует');
          if (!calcData.config) orderIssues.push('❌ calculator_data.config отсутствует');
          if (!calcData.bom) orderIssues.push('❌ calculator_data.bom отсутствует');
          if (!calcData.pricing) orderIssues.push('❌ calculator_data.pricing отсутствует');
          
          // Проверяем детали калькулятора
          if (calcData.customer) {
            if (!calcData.customer.name) orderIssues.push('❌ calculator_data.customer.name пустое');
            if (!calcData.customer.phone) orderIssues.push('❌ calculator_data.customer.phone пустое');
          }
          
          if (calcData.pricing) {
            if (!calcData.pricing.price) orderIssues.push('❌ calculator_data.pricing.price пустое');
            if (!calcData.pricing.total_cost) orderIssues.push('❌ calculator_data.pricing.total_cost пустое');
          }
        } catch (e) {
          orderIssues.push('🔴 КРИТИЧНО: calculator_data некорректный JSON');
          issues.critical.push(`${order.order_number}: calculator_data некорректный JSON`);
        }
      }

      if (orderIssues.length > 0) {
        issues.calcOrders.push({
          order_number: order.order_number,
          issues: orderIssues
        });
        console.log(`\n📋 ${order.order_number}: ${order.product_name}`);
        orderIssues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log(`\n✅ ${order.order_number}: ${order.product_name} - все поля заполнены корректно`);
      }
    });

    // Анализируем заказы из CRM
    console.log('\n\n🔍 АНАЛИЗ ЗАКАЗОВ ИЗ CRM:');
    console.log('=' .repeat(50));

    crmOrders.forEach((order, index) => {
      const orderIssues = [];
      
      // Проверяем основные поля
      if (!order.product_name) orderIssues.push('❌ product_name пустое');
      if (!order.customer_name) orderIssues.push('❌ customer_name пустое');
      if (!order.customer_email) orderIssues.push('❌ customer_email пустое');
      if (!order.customer_phone) orderIssues.push('❌ customer_phone пустое');
      if (!order.total_amount || order.total_amount <= 0) orderIssues.push('❌ total_amount некорректное');
      if (!order.delivery_date) orderIssues.push('❌ delivery_date пустое');
      if (!order.project_description) orderIssues.push('❌ project_description пустое');
      if (!order.delivery_address) orderIssues.push('❌ delivery_address пустое');
      if (order.has_elevator === null) orderIssues.push('❌ has_elevator не указано');
      if (!order.floor) orderIssues.push('❌ floor пустое');
      if (!order.delivery_notes) orderIssues.push('❌ delivery_notes пустое');

      // Для CRM заказов calculator_data должно быть null
      if (order.calculator_data) {
        orderIssues.push('⚠️  calculator_data присутствует (должно быть null для CRM заказов)');
      }

      if (orderIssues.length > 0) {
        issues.crmOrders.push({
          order_number: order.order_number,
          issues: orderIssues
        });
        console.log(`\n📋 ${order.order_number}: ${order.product_name}`);
        orderIssues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log(`\n✅ ${order.order_number}: ${order.product_name} - все поля заполнены корректно`);
      }
    });

    // Проверяем позиции заказов
    console.log('\n\n🔍 АНАЛИЗ ПОЗИЦИЙ ЗАКАЗОВ:');
    console.log('=' .repeat(50));

    for (const order of orders) {
      const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      const items = itemsResult.rows;
      
      if (items.length === 0) {
        console.log(`❌ ${order.order_number}: нет позиций заказа`);
        issues.common.push(`${order.order_number}: отсутствуют позиции заказа`);
      } else {
        console.log(`✅ ${order.order_number}: ${items.length} позиций`);
        
        // Проверяем каждую позицию
        items.forEach((item, index) => {
          const itemIssues = [];
          if (!item.name) itemIssues.push('название пустое');
          if (!item.description) itemIssues.push('описание пустое');
          if (!item.quantity || item.quantity <= 0) itemIssues.push('количество некорректное');
          if (!item.unit_price || item.unit_price <= 0) itemIssues.push('цена за единицу некорректная');
          if (!item.total_price || item.total_price <= 0) itemIssues.push('общая цена некорректная');
          
          if (itemIssues.length > 0) {
            console.log(`  ❌ Позиция ${index + 1}: ${itemIssues.join(', ')}`);
            issues.common.push(`${order.order_number}, позиция ${index + 1}: ${itemIssues.join(', ')}`);
          }
        });
      }
    }

    // Проверяем историю статусов
    console.log('\n\n🔍 АНАЛИЗ ИСТОРИИ СТАТУСОВ:');
    console.log('=' .repeat(50));

    for (const order of orders) {
      const historyResult = await db.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at', [order.id]);
      const history = historyResult.rows;
      
      if (history.length === 0) {
        console.log(`❌ ${order.order_number}: нет истории статусов`);
        issues.common.push(`${order.order_number}: отсутствует история статусов`);
      } else {
        console.log(`✅ ${order.order_number}: ${history.length} записей в истории`);
      }
    }

    // Проверяем производственные операции
    console.log('\n\n🔍 АНАЛИЗ ПРОИЗВОДСТВЕННЫХ ОПЕРАЦИЙ:');
    console.log('=' .repeat(50));

    for (const order of orders) {
      const operationsResult = await db.query('SELECT * FROM production_operations WHERE order_id = $1', [order.id]);
      const operations = operationsResult.rows;
      
      if (operations.length === 0) {
        console.log(`❌ ${order.order_number}: нет производственных операций`);
        issues.common.push(`${order.order_number}: отсутствуют производственные операции`);
      } else {
        console.log(`✅ ${order.order_number}: ${operations.length} операций`);
      }
    }

    // Проверяем финансовые транзакции
    console.log('\n\n🔍 АНАЛИЗ ФИНАНСОВЫХ ТРАНЗАКЦИЙ:');
    console.log('=' .repeat(50));

    for (const order of orders) {
      const transactionsResult = await db.query('SELECT * FROM financial_transactions WHERE order_id = $1', [order.id]);
      const transactions = transactionsResult.rows;
      
      if (transactions.length === 0) {
        console.log(`❌ ${order.order_number}: нет финансовых транзакций`);
        issues.common.push(`${order.order_number}: отсутствуют финансовые транзакции`);
      } else {
        console.log(`✅ ${order.order_number}: ${transactions.length} транзакций`);
      }
    }

    // Итоговый отчет
    console.log('\n\n📊 ИТОГОВЫЙ ОТЧЕТ:');
    console.log('=' .repeat(50));
    
    console.log(`\n🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ (${issues.critical.length}):`);
    issues.critical.forEach(issue => console.log(`  • ${issue}`));
    
    console.log(`\n❌ ПРОБЛЕМЫ В ЗАКАЗАХ ИЗ КАЛЬКУЛЯТОРА (${issues.calcOrders.length}):`);
    issues.calcOrders.forEach(order => {
      console.log(`  • ${order.order_number}: ${order.issues.length} проблем`);
    });
    
    console.log(`\n❌ ПРОБЛЕМЫ В ЗАКАЗАХ ИЗ CRM (${issues.crmOrders.length}):`);
    issues.crmOrders.forEach(order => {
      console.log(`  • ${order.order_number}: ${order.issues.length} проблем`);
    });
    
    console.log(`\n⚠️  ОБЩИЕ ПРОБЛЕМЫ (${issues.common.length}):`);
    issues.common.forEach(issue => console.log(`  • ${issue}`));

    // Сохраняем детальный отчет
    const report = {
      summary: {
        total_orders: orders.length,
        calc_orders: calcOrders.length,
        crm_orders: crmOrders.length,
        critical_issues: issues.critical.length,
        calc_issues: issues.calcOrders.length,
        crm_issues: issues.crmOrders.length,
        common_issues: issues.common.length
      },
      issues: issues,
      orders_analysis: orders.map(order => ({
        order_number: order.order_number,
        product_name: order.product_name,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        status: order.status,
        has_calculator_data: !!order.calculator_data,
        has_items: false, // Будет заполнено отдельно
        has_history: false, // Будет заполнено отдельно
        has_operations: false, // Будет заполнено отдельно
        has_transactions: false // Будет заполнено отдельно
      }))
    };

    // Заполняем дополнительные данные для отчета
    for (let i = 0; i < report.orders_analysis.length; i++) {
      const order = orders[i];
      
      // Проверяем позиции
      const itemsResult = await db.query('SELECT COUNT(*) as count FROM order_items WHERE order_id = $1', [order.id]);
      report.orders_analysis[i].has_items = parseInt(itemsResult.rows[0].count) > 0;
      
      // Проверяем историю
      const historyResult = await db.query('SELECT COUNT(*) as count FROM order_status_history WHERE order_id = $1', [order.id]);
      report.orders_analysis[i].has_history = parseInt(historyResult.rows[0].count) > 0;
      
      // Проверяем операции
      const operationsResult = await db.query('SELECT COUNT(*) as count FROM production_operations WHERE order_id = $1', [order.id]);
      report.orders_analysis[i].has_operations = parseInt(operationsResult.rows[0].count) > 0;
      
      // Проверяем транзакции
      const transactionsResult = await db.query('SELECT COUNT(*) as count FROM financial_transactions WHERE order_id = $1', [order.id]);
      report.orders_analysis[i].has_transactions = parseInt(transactionsResult.rows[0].count) > 0;
    }

    console.log('\n✅ Анализ завершен! Детальный отчет сохранен в файл.');

  } catch (error) {
    console.error('❌ Ошибка при анализе заказов:', error);
  } finally {
    process.exit(0);
  }
};

// Запускаем анализ
analyzeOrders();
