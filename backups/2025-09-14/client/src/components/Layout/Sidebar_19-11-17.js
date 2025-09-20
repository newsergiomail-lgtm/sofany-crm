import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  BarChart3, 
  Bell,
  User,
  Calculator,
  Kanban,
  UserCheck,
  Coins,
  ShoppingBag,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../UI/Logo';

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: Home },
    { name: 'Заказы', href: '/orders', icon: ShoppingCart },
    { name: 'Канбан', href: '/kanban', icon: Kanban },
    { name: 'Клиенты', href: '/customers', icon: Users },
    { name: 'Сотрудники', href: '/employees', icon: UserCheck },
    { name: 'Зарплаты', href: '/simple-work', icon: Coins },
    { name: 'Материалы', href: '/materials', icon: Package },
    { name: 'Поставщики', href: '/suppliers', icon: Building2 },
    { name: 'Закупки', href: '/purchases', icon: ShoppingBag },
    { name: 'Производство', href: '/production', icon: Settings },
    { name: 'Финансы', href: '/finance', icon: BarChart3 },
    { name: 'Калькулятор', href: '/calculator', icon: Calculator },
    { name: 'Уведомления', href: '/notifications', icon: Bell },
    { name: 'Настройки', href: '/admin-settings', icon: Settings },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay open"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="flex h-full flex-col">
          {/* Header with logo and toggle button */}
          <div className="flex h-16 items-center justify-between px-4">
            {!collapsed && <Logo size="small" color="teal" showText={false} />}
            <button
              onClick={onToggleCollapse}
              className="sidebar-toggle-btn"
              title={collapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
            >
              {collapsed ? (
                <ChevronRight />
              ) : (
                <ChevronLeft />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive: linkActive }) =>
                    `sidebar-item ${linkActive || active ? 'active' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`
                  }
                  onClick={onClose}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="sidebar-icon" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          {!collapsed && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-gray-700">
                  <User className="h-4 w-4 text-teal-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                    {user?.role === 'admin' ? 'Администратор' : 
                     user?.role === 'manager' ? 'Менеджер' : 'Рабочий'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

