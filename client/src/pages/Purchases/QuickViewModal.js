import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Download
} from 'lucide-react';

const QuickViewModal = ({ isOpen, onClose, purchaseListId, onEdit }) => {
  const [purchaseList, setPurchaseList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загрузка данных
  const loadPurchaseList = async () => {
    if (!purchaseListId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase/requests/${purchaseListId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseList(data);
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка закупок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && purchaseListId) {
      loadPurchaseList();
    }
  }, [isOpen, purchaseListId]);

  // Обновление статуса позиции (заглушка для заявок на закупку)
  const handleUpdateItem = async (itemId, updates) => {
    // Для заявок на закупку редактирование позиций не поддерживается
    console.log('Редактирование позиций заявки не поддерживается');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {purchaseList?.title || 'Загрузка...'}
            </h2>
            <p className="text-gray-600">
              {purchaseList?.request_number && `Заявка: ${purchaseList.request_number}`}
              {purchaseList?.order_number && ` | Заказ: ${purchaseList.order_number}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="icon-action icon-action-primary"
              title="Экспорт"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(purchaseListId)}
              className="icon-action icon-action-secondary"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : purchaseList ? (
          <div className="space-y-6">
            {/* Информация о заказе */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Информация о заявке</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{purchaseList.request_number}</p>
                      <p className="text-sm text-gray-500">{purchaseList.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {purchaseList.customer_name || 'Не указан'}
                      </p>
                      {purchaseList.order_number && (
                        <p className="text-sm text-gray-500">
                          Заказ: {purchaseList.order_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Дата создания</p>
                      <p className="text-sm text-gray-500">
                        {new Date(purchaseList.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Статус и стоимость</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(purchaseList.status)}`}>
                      {purchaseList.status === 'pending' ? 'Ожидает' :
                       purchaseList.status === 'approved' ? 'Одобрено' :
                       purchaseList.status === 'rejected' ? 'Отклонено' :
                       purchaseList.status === 'completed' ? 'Завершено' :
                       purchaseList.status === 'cancelled' ? 'Отменено' : purchaseList.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Общая стоимость</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(purchaseList.total_amount || 0).toLocaleString()}₽
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Позиций</p>
                      <p className="text-sm text-gray-500">{purchaseList.items_count || 0} позиций</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Позиции заявки на закупку */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Позиции заявки</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Материал
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Количество
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Стоимость
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.material_name}
                            </div>
                            {item.notes && (
                              <div className="text-sm text-gray-500">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {item.required_quantity} {item.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {parseFloat(item.estimated_price || 0).toLocaleString()}₽
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {parseFloat((item.required_quantity || 0) * (item.estimated_price || 0)).toLocaleString()}₽
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateItem(item.id, { status: 'pending' })}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Редактировать
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Ошибка загрузки данных
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-glass btn-glass-md"
          >
            Закрыть
          </button>
          <button
            onClick={() => onEdit(purchaseListId)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Редактировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;