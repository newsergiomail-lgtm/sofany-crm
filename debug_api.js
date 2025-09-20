const fetch = require('node-fetch');

async function debugAPI() {
  console.log('🔍 Диагностика API создания записей работ...\n');
  
  try {
    // Получаем данные
    const [ordersRes, operationsRes, employeesRes] = await Promise.all([
      fetch('http://localhost:5000/api/simple-work/orders'),
      fetch('http://localhost:5000/api/simple-work/operations'),
      fetch('http://localhost:5000/api/simple-work/employees')
    ]);

    const orders = await ordersRes.json();
    const operations = await operationsRes.json();
    const employees = await employeesRes.json();

    console.log(`📊 Данные загружены: ${orders.length} заказов, ${operations.length} операций, ${employees.length} сотрудников`);

    // Берем первые доступные данные
    const order = orders[0];
    const operation = operations[0];
    const employee = employees[0];

    console.log('\n📋 Тестовые данные:');
    console.log(`Заказ: ID=${order.id}, Номер=${order.order_number}`);
    console.log(`Операция: ID=${operation.id}, Название=${operation.name}, Цена=${operation.price_per_unit}`);
    console.log(`Сотрудник: ID=${employee.id}, Имя=${employee.first_name} ${employee.last_name}`);

    // Создаем простую запись работы
    const workData = {
      order_id: order.id,
      operation_id: operation.id,
      employee_id: employee.id,
      quantity: 1,
      start_time: '09:00',
      end_time: '10:00'
    };

    console.log('\n🚀 Отправляем запрос...');
    console.log('Данные:', workData);

    const response = await fetch('http://localhost:5000/api/simple-work/work', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workData)
    });

    const result = await response.json();
    
    console.log('\n📤 Ответ сервера:');
    console.log(`Статус: ${response.status}`);
    console.log(`Результат:`, result);

    if (response.ok) {
      console.log('\n✅ УСПЕХ! API работает корректно');
    } else {
      console.log('\n❌ ОШИБКА! Проблема с API');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

debugAPI();






