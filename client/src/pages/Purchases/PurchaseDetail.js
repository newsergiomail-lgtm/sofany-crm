import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  Plus,
  Trash2
} from 'lucide-react';

const PurchaseDetail = ({ purchaseListId, onBack }) => {
  const [purchaseList, setPurchaseList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Загрузка данных
  const loadPurchaseList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchases/${purchaseListId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseList(data.purchase_list);
        setItems(data.items);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка закупок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseList();
  }, [purchaseListId]);

  // Обновление позиции
  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await fetch(`/api/purchase/purchase-list-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadPurchaseList();
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Ошибка обновления позиции:', error);
    }
  };

  // Обновление статуса списка
  const handleUpdateStatus = async (status) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseListId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await loadPurchaseList();
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  // Экспорт
  const handleExport = async () => {
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

  // Получение иконки статуса
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ordered': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!purchaseList) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Список закупок не найден
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {purchaseList.name}
            </h1>
            <p className="text-gray-600">
              Заказ: {purchaseList.order_number} • {purchaseList.product_name}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      {/* Информация о заказе */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о заказе</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{purchaseList.order_number}</p>
                  <p className="text-sm text-gray-500">{purchaseList.product_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{purchaseList.customer_name_full}</p>
                  {purchaseList.customer_phone && (
                    <p className="text-sm text-gray-500 flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{purchaseList.customer_phone}</span>
                    </p>
                  )}
                  {purchaseList.customer_email && (
                    <p className="text-sm text-gray-500 flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{purchaseList.customer_email}</span>
                    </p>
                  )}
                </div>
              </div>
              {purchaseList.delivery_date && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Дата доставки</p>
                    <p className="text-sm text-gray-500">
                      {new Date(purchaseList.delivery_date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Статус и стоимость</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseList.status)}`}>
                  {purchaseList.status === 'pending' ? 'Ожидает' :
                   purchaseList.status === 'in_progress' ? 'В работе' :
                   purchaseList.status === 'completed' ? 'Завершено' :
                   purchaseList.status === 'cancelled' ? 'Отменено' : purchaseList.status}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Общая стоимость</p>
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(purchaseList.total_cost || 0).toLocaleString()}₽
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Позиций</p>
                  <p className="text-sm text-gray-500">{items.length} позиций</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Действия</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Начать закупку
              </button>
              <button
                onClick={() => handleUpdateStatus('completed')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Завершить
              </button>
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Позиции списка закупок */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Позиции закупок</h3>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить позицию</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Материал
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Количество
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Стоимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Поставщик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.material_name}
                      </div>
                      {item.material_name_full && (
                        <div className="text-sm text-gray-500">
                          {item.material_name_full}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {item.required_quantity} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Доступно: {item.available_quantity} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {parseFloat(item.unit_price || 0).toLocaleString()}₽
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {parseFloat(item.total_price || 0).toLocaleString()}₽
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {item.supplier || 'Не указан'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status === 'pending' ? 'Ожидает' :
                         item.status === 'ordered' ? 'Заказано' :
                         item.status === 'completed' ? 'Завершено' : item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="icon-action icon-action-secondary"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно редактирования позиции */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Редактировать позицию
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateItem(editingItem.id, {
                  status: formData.get('status'),
                  supplier: formData.get('supplier'),
                  notes: formData.get('notes')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Статус
                    </label>
                    <select
                      name="status"
                      defaultValue={editingItem.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Ожидает</option>
                      <option value="ordered">Заказано</option>
                      <option value="completed">Завершено</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Поставщик
                    </label>
                    <input
                      type="text"
                      name="supplier"
                      defaultValue={editingItem.supplier || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Заметки
                    </label>
                    <textarea
                      name="notes"
                      defaultValue={editingItem.notes || ''}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetail;


