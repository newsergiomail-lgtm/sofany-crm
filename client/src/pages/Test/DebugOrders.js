import React, { useState, useEffect } from 'react';

const DebugOrders = () => {
  const [debugInfo, setDebugInfo] = useState({
    step: 'Инициализация...',
    token: null,
    authStatus: 'Проверяем...',
    ordersStatus: 'Ожидаем...',
    orders: null,
    error: null
  });

  useEffect(() => {
    debugAuth();
  }, []);

  const debugAuth = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, step: 'Проверяем токен...' }));
      
      // Проверяем токен в localStorage
      const token = localStorage.getItem('token');
      setDebugInfo(prev => ({ ...prev, token: token ? 'Найден' : 'Не найден' }));
      
      if (!token) {
        setDebugInfo(prev => ({ ...prev, step: 'Авторизуемся...' }));
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@sofany.com', password: 'admin123' })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          setDebugInfo(prev => ({ 
            ...prev, 
            token: 'Получен',
            authStatus: 'Успешно',
            step: 'Загружаем заказы...'
          }));
          
          // Загружаем заказы
          await loadOrders(data.token);
        } else {
          setDebugInfo(prev => ({ 
            ...prev, 
            authStatus: 'Ошибка',
            error: 'Ошибка авторизации'
          }));
        }
      } else {
        setDebugInfo(prev => ({ 
          ...prev, 
          authStatus: 'Токен найден',
          step: 'Загружаем заказы...'
        }));
        
        // Загружаем заказы
        await loadOrders(token);
      }
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error.message,
        authStatus: 'Ошибка'
      }));
    }
  };

  const loadOrders = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(prev => ({ 
          ...prev, 
          ordersStatus: `Загружено ${data.orders?.length || 0} заказов`,
          orders: data.orders,
          step: 'Готово!'
        }));
      } else {
        setDebugInfo(prev => ({ 
          ...prev, 
          ordersStatus: 'Ошибка загрузки',
          error: `HTTP ${response.status}`
        }));
      }
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        ordersStatus: 'Ошибка',
        error: error.message
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Отладка загрузки заказов</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Статус отладки</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Текущий шаг:</span>
              <span className="text-blue-600">{debugInfo.step}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Токен:</span>
              <span className={debugInfo.token === 'Найден' || debugInfo.token === 'Получен' ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.token}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Авторизация:</span>
              <span className={debugInfo.authStatus === 'Успешно' || debugInfo.authStatus === 'Токен найден' ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.authStatus}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Заказы:</span>
              <span className={debugInfo.ordersStatus?.includes('Загружено') ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.ordersStatus}
              </span>
            </div>
            
            {debugInfo.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <span className="font-medium text-red-800">Ошибка:</span>
                <span className="text-red-600 ml-2">{debugInfo.error}</span>
              </div>
            )}
          </div>
        </div>

        {debugInfo.orders && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Загруженные заказы</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер заказа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {debugInfo.orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name || 'Не указан'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(order.total_amount || 0).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Показано {Math.min(5, debugInfo.orders.length)} из {debugInfo.orders.length} заказов
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Инструкции</h3>
          <p className="text-blue-800">
            Если все работает, откройте{' '}
            <a href="/orders" className="text-blue-600 underline hover:text-blue-800">
              /orders
            </a>{' '}
            для просмотра полного списка заказов.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugOrders;
