import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, MoreVertical, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderTableNew = ({ orders, pagination, onPageChange, onRefresh, onUpdateOrder }) => {
  const [editingOrder, setEditingOrder] = useState(null);
  const [showQuickView, setShowQuickView] = useState(null);

  const statusOptions = [
    { value: 'new', label: 'Новый', color: 'bg-blue-100 text-blue-800' },
    { value: 'confirmed', label: 'Подтвержден', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'in_production', label: 'В производстве', color: 'bg-purple-100 text-purple-800' },
    { value: 'ready', label: 'Готов', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'shipped', label: 'Отгружен', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Доставлен', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Отменен', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: 'bg-gray-100 text-gray-800' },
    { value: 'normal', label: 'Обычный', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Средний', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Высокий', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Срочный', color: 'bg-red-100 text-red-800' }
  ];

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (onUpdateOrder) {
        await onUpdateOrder(orderId, { status: newStatus });
        toast.success('Статус заказа обновлен');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast.error('Ошибка обновления статуса');
    }
  };

  const handlePriorityChange = async (orderId, newPriority) => {
    try {
      if (onUpdateOrder) {
        await onUpdateOrder(orderId, { priority: newPriority });
        toast.success('Приоритет заказа обновлен');
      }
    } catch (error) {
      console.error('Ошибка обновления приоритета:', error);
      toast.error('Ошибка обновления приоритета');
    }
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityInfo = (priority) => {
    return priorityOptions.find(p => p.value === priority) || { label: priority, color: 'bg-gray-100 text-gray-800' };
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Заказы не найдены</div>
        <p className="text-gray-400">Попробуйте изменить фильтры или создать новый заказ</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Номер заказа
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Продукт
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Приоритет
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.order_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {order.customer_name || 'Не указан'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {order.product_name || 'Не указан'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingOrder === order.id ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                      onBlur={() => setEditingOrder(null)}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${getStatusInfo(order.status).color}`}
                      onClick={() => setEditingOrder(order.id)}
                      title="Нажмите для изменения статуса"
                    >
                      {getStatusInfo(order.status).label}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingOrder === order.id ? (
                    <select
                      value={order.priority}
                      onChange={(e) => handlePriorityChange(order.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                      onBlur={() => setEditingOrder(null)}
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${getPriorityInfo(order.priority).color}`}
                      onClick={() => setEditingOrder(order.id)}
                      title="Нажмите для изменения приоритета"
                    >
                      {getPriorityInfo(order.priority).label}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {order.total_amount ? `${order.total_amount} ₽` : '0 ₽'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowQuickView(order.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Быстрый просмотр"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Редактировать"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Модальное окно быстрого просмотра */}
      {showQuickView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Быстрый просмотр заказа
              </h3>
              <button
                onClick={() => setShowQuickView(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {(() => {
              const order = orders.find(o => o.id === showQuickView);
              if (!order) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Номер заказа</label>
                      <p className="text-sm text-gray-900 dark:text-white">{order.order_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</label>
                      <p className="text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusInfo(order.status).color}`}>
                          {getStatusInfo(order.status).label}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Приоритет</label>
                      <p className="text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityInfo(order.priority).color}`}>
                          {getPriorityInfo(order.priority).label}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Сумма</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {order.total_amount ? `${order.total_amount} ₽` : '0 ₽'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Клиент</label>
                    <p className="text-sm text-gray-900 dark:text-white">{order.customer_name || 'Не указан'}</p>
                    {order.customer_email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer_email}</p>
                    )}
                    {order.customer_phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer_phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Продукт</label>
                    <p className="text-sm text-gray-900 dark:text-white">{order.product_name || 'Не указан'}</p>
                  </div>
                  
                  {order.project_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Описание проекта</label>
                      <p className="text-sm text-gray-900 dark:text-white">{order.project_description}</p>
                    </div>
                  )}
                  
                  {order.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Заметки</label>
                      <p className="text-sm text-gray-900 dark:text-white">{order.notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата обновления</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(order.updated_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowQuickView(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Закрыть
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Редактировать
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTableNew;
