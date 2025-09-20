import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AutoLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const autoLogin = async () => {
      try {
        console.log('Начинаем автоматический вход...');
        const result = await login('admin@sofany.com', 'admin123');
        console.log('Результат входа:', result);
        
        if (result.success) {
          console.log('Вход успешен, перенаправляем на заказы...');
          navigate('/orders');
        } else {
          console.log('Вход не удался, перенаправляем на логин...');
          navigate('/login');
        }
      } catch (error) {
        console.error('Ошибка автоматического входа:', error);
        navigate('/login');
      }
    };

    autoLogin();
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Автоматический вход...</p>
        <p className="text-sm text-gray-500 mt-2">Пожалуйста, подождите</p>
      </div>
    </div>
  );
};

export default AutoLogin;
