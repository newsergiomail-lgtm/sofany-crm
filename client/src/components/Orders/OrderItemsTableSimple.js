import React, { useState } from 'react';
import { Plus, X, Edit2, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderItemsTableSimple = ({
  items = [],
  totalAmount = 0,
  onItemsChange
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 1,
    unit_price: 0
  });

  const addNewItem = () => {
    const newItem = {
      id: `new_${Date.now()}`,
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      isNew: true
    };

    if (onItemsChange) {
      onItemsChange([...items, newItem]);
    }
    setEditingItem(newItem.id);
    setEditForm({
      name: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0
    });
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) {
      toast.error('Введите наименование');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === editingItem) {
        const total_price = parseFloat(editForm.quantity || 0) * parseFloat(editForm.unit_price || 0);
        return {
          ...item,
          name: editForm.name.trim(),
          quantity: parseFloat(editForm.quantity) || 0,
          unit_price: parseFloat(editForm.unit_price) || 0,
          total_price: total_price,
          isNew: false
        };
      }
      return item;
    });

    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
    setEditingItem(null);
    setEditForm({ name: '', quantity: 1, unit_price: 0 });
    toast.success('Изменения сохранены');
  };

  const cancelEdit = () => {
    if (items.find(item => item.id === editingItem)?.isNew) {
      const updatedItems = items.filter(item => item.id !== editingItem);
      if (onItemsChange) {
        onItemsChange(updatedItems);
      }
    }
    setEditingItem(null);
    setEditForm({ name: '', quantity: 1, unit_price: 0 });
  };

  const deleteItem = (itemId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      const updatedItems = items.filter(item => item.id !== itemId);
      if (onItemsChange) {
        onItemsChange(updatedItems);
      }
      toast.success('Позиция удалена');
    }
  };

  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Позиции заказа
          </h3>
          <button
            onClick={addNewItem}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить позицию
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Наименование
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Количество
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Цена за ед.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Нет позиций заказа
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="Введите наименование"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name || 'Не указано'}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-center"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.quantity || 0}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.unit_price}
                        onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-right"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {parseFloat(item.unit_price || 0).toFixed(2)} ₽
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)} ₽
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {editingItem === item.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Сохранить"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Отменить"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Итого: {calculatedTotal.toFixed(2)} ₽
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} позиций
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTableSimple;
