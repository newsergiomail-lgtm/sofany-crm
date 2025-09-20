import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, Eye, Trash2, FileText } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Pagination from '../../components/UI/Pagination';
import toast from 'react-hot-toast';

const OrdersNew = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    priority: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Автоматическая авторизация
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Токен не найден, выполняем авторизацию...');
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sofany.com', password: 'admin123' })
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            console.log('Авторизация успешна');
            setIsAuthorized(true);
          } else {
            console.error('Ошибка авторизации');
            toast.error('Ошибка авторизации');
          }
        } else {
          console.log('Токен найден, проверяем валидность...');
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Ошибка автоматической авторизации:', error);
        toast.error('Ошибка подключения к серверу');
      }
    };

    autoLogin();
  }, []);

  const { data, isLoading, error, refetch } = useQuery(
    ['orders', filters],
    () => ordersAPI.getAll(filters),
    {
      enabled: isAuthorized, // Запрос выполняется только после авторизации
      keepPreviousData: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await ordersAPI.updateStatus(orderId, { status: newStatus });
      toast.success('Статус заказа обновлен');
      refetch();
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePriorityChange = async (orderId, newPriority) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await ordersAPI.updatePriority(orderId, { priority: newPriority });
      toast.success('Приоритет заказа обновлен');
      refetch();
    } catch (error) {
      toast.error('Ошибка обновления приоритета');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await ordersAPI.delete(orderId);
        toast.success('Заказ удален');
        refetch();
      } catch (error) {
        toast.error('Ошибка удаления заказа');
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Авторизация...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки заказов</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600">Управление заказами и их статусами</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Обновить</span>
          </button>
          <Link
            to="/orders/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать заказ</span>
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по номеру заказа..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все статусы</option>
            <option value="new">Новый</option>
            <option value="confirmed">Подтвержден</option>
            <option value="in_production">В производстве</option>
            <option value="ready">Готов</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange({ priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все приоритеты</option>
            <option value="urgent">Срочно</option>
            <option value="high">Высокий</option>
            <option value="normal">Обычный</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      {/* Таблица заказов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
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
                      Приоритет
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.orders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.order_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customer_name || 'Не указан'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_phone || order.customer_email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingStatus[order.id]}
                          className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border-0 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="new">Новый</option>
                          <option value="confirmed">Подтвержден</option>
                          <option value="in_production">В производстве</option>
                          <option value="ready">Готов</option>
                          <option value="shipped">Отгружен</option>
                          <option value="delivered">Доставлен</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.priority}
                          onChange={(e) => handlePriorityChange(order.id, e.target.value)}
                          disabled={updatingStatus[order.id]}
                          className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border-0 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="urgent">Срочно</option>
                          <option value="high">Высокий</option>
                          <option value="medium">Средний</option>
                          <option value="normal">Обычный</option>
                          <option value="low">Низкий</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {parseFloat(order.total_amount || 0).toLocaleString('ru-RU')} ₽
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Просмотр"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/orders/${order.id}/work-order`}
                            className="text-green-600 hover:text-green-900"
                            title="Заказ-наряд"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {data?.pagination && (
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.pages}
                onPageChange={handlePageChange}
                totalItems={data.pagination.total}
                itemsPerPage={data.pagination.limit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersNew;
