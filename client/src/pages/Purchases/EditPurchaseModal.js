import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  Save,
  Plus,
  Trash2,
  ShoppingCart,
  Building2
} from 'lucide-react';
import SupplierAutocomplete from '../../components/Suppliers/SupplierAutocomplete';

const EditPurchaseModal = ({ isOpen, onClose, purchaseListId, onSave }) => {
  const [purchaseList, setPurchaseList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newItem, setNewItem] = useState({});

  // Загрузка данных
  const loadPurchaseList = async () => {
    if (!purchaseListId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-requests/${purchaseListId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseList(data);
        setItems(data.items || []);
        setDeliveryDate(data.delivery_date || '');
        setSelectedSupplier(data.supplier || null);
      } else {
        console.error('Ошибка загрузки заявки:', response.status, response.statusText);
        toast.error('Ошибка загрузки заявки на закупку');
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

  // Обновление информации о списке закупок
  const handleUpdateList = async (updates) => {
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseListId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseList(data);
        toast.success('Заявка обновлена');
        return true;
      } else {
        console.error('Ошибка обновления заявки:', response.status, response.statusText);
        toast.error('Ошибка обновления заявки');
        return false;
      }
    } catch (error) {
      console.error('Ошибка обновления списка закупок:', error);
      toast.error('Ошибка обновления заявки');
      return false;
    }
  };

  // Сохранение даты поставки и поставщика
  const handleSaveDeliveryInfo = async () => {
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseListId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          delivery_date: deliveryDate,
          supplier_id: selectedSupplier?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseList(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка сохранения информации о поставке:', error);
      return false;
    }
  };

  // Обновление позиции
  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseListId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем локальное состояние
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...data.item } : item
        ));
        toast.success('Позиция обновлена');
        return true;
      } else {
        console.error('Ошибка обновления позиции:', response.status, response.statusText);
        toast.error('Ошибка обновления позиции');
        return false;
      }
    } catch (error) {
      console.error('Ошибка обновления позиции:', error);
      toast.error('Ошибка обновления позиции');
      return false;
    }
  };

  // Сохранение изменений
  const handleSave = async () => {
    setSaving(true);
    try {
      // Обновляем информацию о заявке на закупку
      const success = await handleUpdateList({
        title: purchaseList.title,
        status: purchaseList.status,
        notes: purchaseList.notes,
        supplier_id: selectedSupplier?.id
      });

      if (success) {
        toast.success('Заявка на закупку обновлена');
        if (onSave) {
          onSave();
        }
        onClose();
      } else {
        console.error('Ошибка сохранения заявки на закупку');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка сохранения заявки');
    } finally {
      setSaving(false);
    }
  };

  // Добавление новой позиции
  const handleAddItem = async (itemData) => {
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseListId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        const data = await response.json();
        // Добавляем новую позицию в локальное состояние
        setItems(prev => [...prev, data.item]);
        setShowAddItem(false);
        setNewItem({});
        toast.success('Позиция добавлена');
        return true;
      } else {
        console.error('Ошибка добавления позиции:', response.status, response.statusText);
        toast.error('Ошибка добавления позиции');
        return false;
      }
    } catch (error) {
      console.error('Ошибка добавления позиции:', error);
      toast.error('Ошибка добавления позиции');
      return false;
    }
  };

  // Удаление позиции
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase-requests/${purchaseListId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Удаляем из локального состояния
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Позиция удалена');
      } else {
        const error = await response.json();
        toast.error(`Ошибка удаления: ${error.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка удаления позиции:', error);
      toast.error('Ошибка при удалении позиции');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Редактирование заявки на закупку
            </h2>
            <p className="text-gray-600">
              {purchaseList?.title || 'Загрузка...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : purchaseList ? (
          <div className="space-y-6">
            {/* Основная информация */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Информация о заявке</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название заявки
                  </label>
                  <input
                    type="text"
                    value={purchaseList.title || ''}
                    onChange={(e) => setPurchaseList(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Название заявки"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Статус
                  </label>
                  <select
                    value={purchaseList.status || 'pending'}
                    onChange={(e) => setPurchaseList(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="approved">Одобрено</option>
                    <option value="rejected">Отклонено</option>
                    <option value="completed">Завершено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Поставщик
                  </label>
                  <SupplierAutocomplete
                    value={selectedSupplier}
                    onChange={setSelectedSupplier}
                    placeholder="Выберите поставщика..."
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Заметки
                </label>
                <textarea
                  value={purchaseList.notes || ''}
                  onChange={(e) => setPurchaseList(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Дополнительные заметки..."
                />
              </div>
            </div>

            {/* Позиции закупок */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Позиции закупок</h3>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить позицию</span>
                </button>
              </div>

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
                        Цена за единицу
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Стоимость
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.material_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {item.required_quantity} {item.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {parseFloat(item.estimated_price || 0).toLocaleString()}₽
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {parseFloat(item.total_price || 0).toLocaleString()}₽
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Удалить позицию"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Форма добавления новой позиции */}
            {showAddItem && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Добавить новую позицию</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название материала *
                    </label>
                    <input
                      type="text"
                      value={newItem.material_name || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, material_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите название материала"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество *
                    </label>
                    <input
                      type="number"
                      value={newItem.required_quantity || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, required_quantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Единица измерения
                    </label>
                    <select
                      value={newItem.unit || 'шт'}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="шт">шт</option>
                      <option value="м">м</option>
                      <option value="м²">м²</option>
                      <option value="м³">м³</option>
                      <option value="кг">кг</option>
                      <option value="л">л</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цена за единицу
                    </label>
                    <input
                      type="number"
                      value={newItem.estimated_price || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, estimated_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowAddItem(false);
                      setNewItem({});
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Закрыть форму
                  </button>
                  <button
                    onClick={() => handleAddItem(newItem)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={!newItem.material_name || !newItem.required_quantity}
                  >
                    Добавить позицию
                  </button>
                </div>
              </div>
            )}
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
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Закрыть
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseModal;