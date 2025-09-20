import React, { useState, useEffect } from 'react';

const StatusPage = () => {
  const [status, setStatus] = useState({
    client: 'Проверяем...',
    server: 'Проверяем...',
    auth: 'Проверяем...',
    orders: 'Проверяем...'
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Проверяем клиент
    setStatus(prev => ({ ...prev, client: '✅ Клиент работает' }));

    // Проверяем сервер
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        setStatus(prev => ({ ...prev, server: '✅ Сервер работает' }));
      } else {
        setStatus(prev => ({ ...prev, server: '❌ Сервер не отвечает' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, server: '❌ Ошибка подключения к серверу' }));
    }

    // Проверяем авторизацию
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@sofany.com', password: 'admin123' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setStatus(prev => ({ ...prev, auth: '✅ Авторизация работает' }));
          localStorage.setItem('token', data.token);
          
          // Проверяем заказы
          try {
            const ordersResponse = await fetch('http://localhost:5000/api/orders', {
              headers: { 'Authorization': `Bearer ${data.token}` }
            });
            
            if (ordersResponse.ok) {
              const ordersData = await ordersResponse.json();
              setStatus(prev => ({ ...prev, orders: `✅ Заказы загружены (${ordersData.orders?.length || 0} шт.)` }));
            } else {
              setStatus(prev => ({ ...prev, orders: '❌ Ошибка загрузки заказов' }));
            }
          } catch (error) {
            setStatus(prev => ({ ...prev, orders: '❌ Ошибка загрузки заказов' }));
          }
        } else {
          setStatus(prev => ({ ...prev, auth: '❌ Токен не получен' }));
        }
      } else {
        setStatus(prev => ({ ...prev, auth: '❌ Ошибка авторизации' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, auth: '❌ Ошибка подключения к API' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Статус системы</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Проверка компонентов</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">Клиент (React)</span>
              <span className="text-lg">{status.client}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">Сервер (Node.js)</span>
              <span className="text-lg">{status.server}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">Авторизация</span>
              <span className="text-lg">{status.auth}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">Заказы</span>
              <span className="text-lg">{status.orders}</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Инструкции</h3>
            <p className="text-blue-800">
              Если все компоненты работают, откройте{' '}
              <a href="/orders" className="text-blue-600 underline hover:text-blue-800">
                /orders
              </a>{' '}
              для просмотра заказов.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
