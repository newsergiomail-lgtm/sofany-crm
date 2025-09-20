import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, RefreshCw, Kanban } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { ordersAPI } from '../../services/api';

const OrderTable = ({ orders, pagination, onPageChange, onRefresh }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [quickViewOrder, setQuickViewOrder] = useState(null);

  // Мутация для удаления заказа
  const deleteOrderMutation = useMutation(
    (orderId) => ordersAPI.delete(orderId),
    {
      onSuccess: () => {
        toast.success('Заказ успешно удален');
        queryClient.invalidateQueries(['orders']);
        onRefresh();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка удаления заказа');
      }
    }
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      'new': { text: 'Новый', className: 'badge-secondary' },
      'confirmed': { text: 'Подтвержден', className: 'badge-primary' },
      'in_production': { text: 'В производстве', className: 'badge-warning' },
      'ready': { text: 'Готов', className: 'badge-success' },
      'shipped': { text: 'Отправлен', className: 'badge-primary' },
      'delivered': { text: 'Доставлен', className: 'badge-success' },
      'cancelled': { text: 'Отменен', className: 'badge-danger' }
    };
    
    const config = statusConfig[status] || { text: status, className: 'badge-secondary' };
    return <span className={`badge ${config.className}`}>{config.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'urgent': { text: 'Срочно', className: 'bg-red-100 text-red-800' },
      'high': { text: 'Высокий', className: 'bg-orange-100 text-orange-800' },
      'normal': { text: 'Обычный', className: 'bg-blue-100 text-blue-800' },
      'low': { text: 'Низкий', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = priorityConfig[priority] || { text: priority, className: 'bg-gray-100 text-gray-800' };
    return <span className={`badge ${config.className}`}>{config.text}</span>;
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleQuickView = (order) => {
    setQuickViewOrder(order);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    try {
      // Обновляем статус заказа
      await ordersAPI.update(orderId, { status: newStatus });
      
      // Если статус меняется на "in_production", создаем production_operation
      if (newStatus === 'in_production') {
        await ordersAPI.createProductionOperation(orderId, {
          operation_type: 'produce',
          production_stage: 'КБ'
        });
      }
      
      // Обновляем данные
      onRefresh();
      
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error);
      alert('Ошибка при изменении статуса заказа');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="empty-state-title">Нет заказов</h3>
          <p className="empty-state-description">
            Заказы появятся здесь после их создания
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-head">Номер заказа</th>
            <th className="table-head">Клиент</th>
            <th className="table-head">Статус</th>
            <th className="table-head">Приоритет</th>
            <th className="table-head">Сумма</th>
            <th className="table-head">Дата создания</th>
            <th className="table-head">Доставка</th>
            <th className="table-head">Действия</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {orders.map((order) => (
            <tr key={order.id} className="table-row">
              <td className="table-cell">
                <Link 
                  to={`/orders/${order.id}`}
                  className="font-medium text-sofany-600 hover:text-sofany-700"
                >
                  {order.order_number}
                </Link>
              </td>
              <td className="table-cell">
                <div>
                  <div className="font-medium text-gray-900">{order.customer_name}</div>
                  {order.customer_email && (
                    <div className="text-sm text-gray-500">{order.customer_email}</div>
                  )}
                </div>
              </td>
              <td className="table-cell">
                {user?.role === 'admin' ? (
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingStatus[order.id]}
                    className={`text-sm border rounded px-2 py-1 ${
                      order.status === 'new' ? 'bg-gray-100 text-gray-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'in_production' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="new">Новый</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="in_production">В производстве</option>
                    <option value="ready">Готов</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                ) : (
                  getStatusBadge(order.status)
                )}
              </td>
              <td className="table-cell">
                {getPriorityBadge(order.priority)}
              </td>
              <td className="table-cell">
                <div>
                  <div className="font-medium text-gray-900">
                    {order.total_amount?.toLocaleString()} ₽
                  </div>
                  {order.paid_amount > 0 && (
                    <div className="text-sm text-gray-500">
                      Оплачено: {order.paid_amount.toLocaleString()} ₽
                    </div>
                  )}
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                  {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(order.created_at), 'HH:mm', { locale: ru })}
                </div>
              </td>
              <td className="table-cell">
                {order.delivery_date ? (
                  <div className="text-sm text-gray-900">
                    {format(new Date(order.delivery_date), 'dd.MM.yyyy', { locale: ru })}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="table-cell">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuickView(order)}
                    className="p-1 text-gray-400 hover:text-sofany-600"
                    title="Быстрый просмотр"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {order.status === 'in_production' && (
                    <Link
                      to="/kanban"
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Перейти к канбану"
                    >
                      <Kanban className="h-4 w-4" />
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to={`/orders/${order.id}`}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <span className="text-sm text-gray-700">
              Страница {pagination.page} из {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="btn-outline btn-sm"
              title="Обновить"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">
              Всего: {pagination.total}
            </span>
          </div>
        </div>
      )}

      {/* Модальное окно быстрого просмотра */}
      {quickViewOrder && (
        <div className="modal-overlay active">
          <div className="modal max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Заказ #{quickViewOrder.order_number}
              </h2>
              <button
                onClick={() => setQuickViewOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Клиент</label>
                  <p className="mt-1 text-sm text-gray-900">{quickViewOrder.customer_name || 'Не указан'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Статус</label>
                  <div className="mt-1">{getStatusBadge(quickViewOrder.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Приоритет</label>
                  <div className="mt-1">{getPriorityBadge(quickViewOrder.priority)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Сумма</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {parseFloat(quickViewOrder.total_amount).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата создания</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(quickViewOrder.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата доставки</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {quickViewOrder.delivery_date 
                      ? format(new Date(quickViewOrder.delivery_date), 'dd.MM.yyyy', { locale: ru })
                      : 'Не указана'
                    }
                  </p>
                </div>
              </div>

              {/* Примечания */}
              {quickViewOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Примечания</label>
                  <p className="mt-1 text-sm text-gray-900">{quickViewOrder.notes}</p>
                </div>
              )}

              {/* Контактная информация */}
              <div className="grid grid-cols-2 gap-4">
                {quickViewOrder.customer_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Телефон</label>
                    <p className="mt-1 text-sm text-gray-900">{quickViewOrder.customer_phone}</p>
                  </div>
                )}
                {quickViewOrder.customer_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{quickViewOrder.customer_email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setQuickViewOrder(null)}
                className="btn-outline btn-md"
              >
                Закрыть
              </button>
              <Link
                to={`/orders/${quickViewOrder.id}`}
                className="btn-primary btn-md"
                onClick={() => setQuickViewOrder(null)}
              >
                Открыть заказ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;








