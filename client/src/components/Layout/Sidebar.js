import React, { useState } from 'react';
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
  Kanban,
  UserCheck,
  ShoppingBag,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePurchaseNotifications } from '../../hooks/usePurchaseNotifications';
import Logo from '../UI/Logo';

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { purchaseCount } = usePurchaseNotifications();
  const [expandedMenus, setExpandedMenus] = useState({});

  const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: Home },
    { name: 'Заказы', href: '/orders', icon: ShoppingCart },
    { name: 'Канбан', href: '/kanban', icon: Kanban },
    { name: 'Клиенты', href: '/customers', icon: Users },
    { name: 'Материалы', href: '/materials', icon: Package },
    { name: 'Сотрудники', href: '/employees', icon: UserCheck },
    { name: 'Поставщики', href: '/suppliers', icon: Building2 },
    { name: 'Закупки', href: '/purchases', icon: ShoppingBag },
    { name: 'Производство', href: '/production', icon: Settings },
    { name: 'Финансы', href: '/finance', icon: BarChart3 },
        { name: 'Тест позиций заказа', href: '/test-order-items', icon: Package },
    { name: 'Уведомления', href: '/notifications', icon: Bell },
    { name: 'Настройки', href: '/admin-settings', icon: Settings },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleSubmenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const isSubmenuExpanded = (menuName) => {
    return expandedMenus[menuName] || false;
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
              const isOrders = item.name === 'Заказы';
              const isPurchases = item.name === 'Закупки';
              const hasSubmenu = item.hasSubmenu;
              const isExpanded = isSubmenuExpanded(item.name);
              
              return (
                <div key={item.name} className="sidebar-item-wrapper">
                  {hasSubmenu ? (
                    // Элемент с подменю
                    <div className="sidebar-item-wrapper">
                      <button
                        onClick={() => !collapsed && toggleSubmenu(item.name)}
                        className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'sidebar-collapsed' : ''} w-full justify-between`}
                        title={collapsed ? item.name : ''}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="sidebar-icon" />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      
                      {/* Бейдж уведомлений для закупок */}
                      {isPurchases && !collapsed && purchaseCount > 0 && (
                        <div className="sidebar-notification-badge">
                          {purchaseCount > 99 ? '99+' : purchaseCount}
                        </div>
                      )}
                      
                      {/* Подменю */}
                      {!collapsed && isExpanded && item.submenu && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = isActive(subItem.href);
                            
                            return (
                              <NavLink
                                key={subItem.name}
                                to={subItem.href}
                                className={({ isActive: linkActive }) =>
                                  `sidebar-item sidebar-sub-item ${linkActive || subActive ? 'active' : ''}`
                                }
                                onClick={onClose}
                                title={subItem.name}
                              >
                                <SubIcon className="sidebar-icon" />
                                <span>{subItem.name}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Обычный элемент
                    <div className="sidebar-item-wrapper">
                      <NavLink
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
                      
                      {/* Бейдж уведомлений для закупок */}
                      {isPurchases && !collapsed && purchaseCount > 0 && (
                        <div className="sidebar-notification-badge">
                          {purchaseCount > 99 ? '99+' : purchaseCount}
                        </div>
                      )}
                      
                      {/* Кнопка добавления для заказов */}
                      {isOrders && !collapsed && (
                        <NavLink
                          to="/orders/create"
                          className="sidebar-add-btn"
                          onClick={onClose}
                          title="Создать новый заказ"
                        >
                          <Plus className="sidebar-add-icon" />
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
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

