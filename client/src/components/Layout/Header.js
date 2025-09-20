import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../ThemeToggle';
import { notificationsAPI } from '../../services/api';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из системы');
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  // Загрузка количества непрочитанных уведомлений
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsAPI.getAll({ is_read: false });
        const unread = response.notifications?.filter(n => !n.is_read) || [];
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
      }
    };

    fetchUnreadCount();
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={handleNotificationClick}
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 text-xs font-medium text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-700 dark:border-gray-600">
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Уведомления
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2" />
                    <p>Уведомления загружаются...</p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => navigate('/notifications')}
                    className="w-full text-center text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    Посмотреть все уведомления
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sofany-100">
                <User className="h-4 w-4 text-sofany-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'admin' ? 'Администратор' : 
                   user?.role === 'manager' ? 'Менеджер' : 'Рабочий'}
                </p>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50 dark:bg-gray-700 dark:border-gray-600">
                <button
                  onClick={handleProfileClick}
                  className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <Settings className="h-4 w-4" />
                  <span>Настройки</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Функция для получения заголовка страницы
const getPageTitle = () => {
  const path = window.location.pathname;
  
  const titles = {
    '/dashboard': 'Дашборд',
    '/orders': 'Заказы',
    '/customers': 'Клиенты',
    '/materials': 'Материалы',
    '/production': 'Производство',
    '/finance': 'Финансы',
    '/notifications': 'Уведомления',
    '/profile': 'Профиль'
  };

  // Проверяем точное совпадение
  if (titles[path]) {
    return titles[path];
  }

  // Проверяем вложенные пути
  for (const [route, title] of Object.entries(titles)) {
    if (path.startsWith(route + '/')) {
      return title;
    }
  }

  return 'CRM Система';
};

export default Header;


















