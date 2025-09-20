import React, { useState, useEffect } from 'react';
import QuickViewModal from './QuickViewModal';
import EditPurchaseModal from './EditPurchaseModal';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingCart,
  Filter,
  Package,
  DollarSign,
  Search,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const Purchases = () => {
  const [purchaseLists, setPurchaseLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
    supplier: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [quickViewModal, setQuickViewModal] = useState({ isOpen: false, purchaseListId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, purchaseListId: null });

  // Загрузка данных
  const loadPurchaseLists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`/api/purchase/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseLists(data);
        setPagination({
          page: 1,
          limit: 20,
          total: data.length,
          pages: Math.ceil(data.length / 20)
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки списков закупок:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const response = await fetch('/api/purchases/stats/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  useEffect(() => {
    loadPurchaseLists();
    loadStats();
  }, [pagination.page, filters]);

  // Обработка фильтров
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Обработка выбора элементов
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === purchaseLists.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(purchaseLists.map(item => item.id));
    }
  };

  // Удаление заявки на закупку
  const handleDeletePurchaseList = async (requestId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку на закупку? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Удаляем из локального состояния
        setPurchaseLists(prev => prev.filter(list => list.id !== requestId));
        setSelectedItems(prev => prev.filter(id => id !== requestId));
        
        // Показываем уведомление
        toast.success('Заявка на закупку успешно удалена');
        
        // Перезагружаем данные
        await loadPurchaseLists();
        await loadStats();
      } else {
        const error = await response.json();
        toast.error(`Ошибка удаления: ${error.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка удаления заявки на закупку:', error);
      toast.error('Ошибка при удалении заявки на закупку');
    }
  };

  // Массовое обновление статуса
  const handleBulkStatusUpdate = async (status) => {
    if (selectedItems.length === 0) return;

    try {
      const response = await fetch(`/api/purchases/${selectedItems[0]}/items/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          item_ids: selectedItems,
          status: status
        })
      });

      if (response.ok) {
        await loadPurchaseLists();
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Ошибка массового обновления:', error);
    }
  };

  // Массовое удаление заявок
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedItems.length} заявок на закупку? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      // Удаляем заявки по одной
      const deletePromises = selectedItems.map(requestId => 
        fetch(`/api/purchase/requests/${requestId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      );

      const results = await Promise.allSettled(deletePromises);
      
      // Подсчитываем успешные удаления
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`Успешно удалено ${successful} заявок`);
        await loadPurchaseLists();
        await loadStats();
        setSelectedItems([]);
      }

      if (failed > 0) {
        toast.error(`Не удалось удалить ${failed} заявок`);
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      toast.error('Ошибка при массовом удалении заявок');
    }
  };

  // Экспорт в Excel
  const handleExport = async (purchaseListId) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseListId}/export?format=excel`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchase_list_${purchaseListId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  };

  // Открытие модального окна быстрого просмотра
  const handleQuickView = (purchaseListId) => {
    setQuickViewModal({ isOpen: true, purchaseListId });
  };

  // Открытие модального окна редактирования
  const handleEdit = (purchaseListId) => {
    setEditModal({ isOpen: true, purchaseListId });
  };

  // Закрытие модальных окон
  const handleCloseModals = () => {
    setQuickViewModal({ isOpen: false, purchaseListId: null });
    setEditModal({ isOpen: false, purchaseListId: null });
  };

  // Обновление данных после редактирования
  const handleEditSave = () => {
    loadPurchaseLists();
    loadStats();
  };

  // Смена статуса заявки
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const response = await fetch(`/api/purchase/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Статус заявки изменен на "${getStatusText(newStatus)}"`);
        loadPurchaseLists();
        loadStats();
      } else {
        const errorData = await response.json();
        toast.error(`Ошибка изменения статуса: ${errorData.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      toast.error('Ошибка изменения статуса заявки');
    }
  };

  // Получение текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрено';
      case 'rejected': return 'Отклонено';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  // Получение иконки статуса
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'normal': return 'text-blue-600 dark:text-blue-400';
      case 'low': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Закупки</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-glass btn-glass-md flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Фильтры</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего списков</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overview.total_lists}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общая стоимость</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {parseFloat(stats.overview.total_cost || 0).toLocaleString()}₽
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">В работе</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overview.in_progress_lists}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Завершено</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overview.completed_lists}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Номер заказа, название..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Статус</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата от</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата до</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Массовые операции */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Выбрано элементов: {selectedItems.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate('ordered')}
                className="btn-glass btn-glass-primary btn-glass-sm"
              >
                Отметить как заказано
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('completed')}
                className="btn-glass btn-glass-success btn-glass-sm"
              >
                Отметить как завершено
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-glass btn-glass-danger btn-glass-sm"
              >
                Удалить выбранные
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="btn-glass btn-glass-sm"
              >
                Отменить выбор
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Таблица списков закупок */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === purchaseLists.length && purchaseLists.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Заявка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Позиции
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Стоимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Загрузка...
                  </td>
                </tr>
              ) : purchaseLists.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Заявки на закупку не найдены
                  </td>
                </tr>
              ) : (
                purchaseLists.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(request.id)}
                        onChange={() => handleSelectItem(request.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {request.request_number}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {request.title}
                        </div>
                        {request.order_number && (
                          <div className="text-xs text-gray-400">
                            Заказ: {request.order_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {request.customer_name || 'Не указан'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all duration-200 hover:opacity-80 ${getStatusColor(request.status)}`}
                          style={{
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="pending">Ожидает</option>
                          <option value="approved">Одобрено</option>
                          <option value="rejected">Отклонено</option>
                          <option value="completed">Завершено</option>
                          <option value="cancelled">Отменено</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {request.items_count || 0} позиций
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Приоритет: {request.priority === 'high' ? 'Высокий' : 
                                   request.priority === 'normal' ? 'Обычный' : 
                                   request.priority === 'low' ? 'Низкий' : 'Не указан'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(request.total_amount || 0).toLocaleString()}₽
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(request.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleTimeString('ru-RU')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuickView(request.id)}
                          className="icon-action icon-action-success"
                          title="Просмотр заявки"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(request.id)}
                          className="icon-action icon-action-primary"
                          title="Редактировать заявку"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePurchaseList(request.id)}
                          className="icon-action icon-action-danger"
                          title="Удалить заявку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="btn-glass btn-glass-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Предыдущая
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="btn-glass btn-glass-sm disabled:opacity-50 disabled:cursor-not-allowed ml-3"
              >
                Следующая
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Показано <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> из <span className="font-medium">{pagination.total}</span> результатов
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Предыдущая
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующая
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <QuickViewModal
        isOpen={quickViewModal.isOpen}
        onClose={handleCloseModals}
        purchaseListId={quickViewModal.purchaseListId}
        onEdit={handleEdit}
      />
      
      <EditPurchaseModal
        isOpen={editModal.isOpen}
        onClose={handleCloseModals}
        purchaseListId={editModal.purchaseListId}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default Purchases;


