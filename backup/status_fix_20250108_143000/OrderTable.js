// Бэкап функции handleStatusChange из OrderTable.js
// Дата: 2025-01-08 14:30:00

const handleStatusChange = async (orderId, newStatus) => {
  setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
  
  try {
    console.log(`Начинаем изменение статуса заказа ${orderId} на ${newStatus}`);
    
    // Обновляем статус заказа
    console.log('Обновляем статус заказа...');
    const updateResult = await ordersAPI.update(orderId, { status: newStatus });
    console.log('Статус заказа успешно обновлен:', updateResult);
    
    // Если статус меняется на "in_production", создаем production_operation
    if (newStatus === 'in_production') {
      console.log('Создаем production_operation...');
      try {
        const productionResult = await ordersAPI.createProductionOperation(orderId, {
          operation_type: 'produce',
          production_stage: 'КБ'
        });
        console.log('Production_operation успешно создана:', productionResult);
      } catch (productionError) {
        console.error('Ошибка при создании production_operation:', productionError);
        // Не показываем ошибку пользователю, так как статус уже обновлен
      }
    }
    
    // Обновляем данные с задержкой для гарантии обновления
    if (onRefresh && typeof onRefresh === 'function') {
      setTimeout(() => {
        try {
          console.log('Обновляем данные (первый раз)...');
          onRefresh();
        } catch (refreshError) {
          console.error('Ошибка при первом обновлении:', refreshError);
        }
      }, 100);
      
      // Дополнительное обновление через 500мс для гарантии
      setTimeout(() => {
        try {
          console.log('Обновляем данные (второй раз)...');
          onRefresh();
        } catch (refreshError) {
          console.error('Ошибка при втором обновлении:', refreshError);
        }
      }, 500);
    } else {
      console.warn('Функция onRefresh не определена или не является функцией');
    }
    
    console.log('Изменение статуса завершено успешно');
    
  } catch (error) {
    console.error('Ошибка при изменении статуса:', error);
    alert('Ошибка при изменении статуса заказа');
  } finally {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
  }
};








