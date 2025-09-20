import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { Plus, X, Edit } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const OrderItemsTable = ({ 
  items = [], 
  onItemsChange, 
  onAddItem, 
  onDeleteItem, 
  onUpdateItem,
  editing = false,
  onToggleEdit,
  orderId = null
}) => {
  const [editingItems, setEditingItems] = useState(editing);
  const [missingMaterials, setMissingMaterials] = useState([]);

  // Мутация для проверки материалов
  const checkMaterialsMutation = useMutation(
    () => purchaseAPI.checkMaterials(orderId),
    {
      onSuccess: (response) => {
        const data = response.data || response;
        
        if (!data || typeof data !== 'object') {
          toast.error('Неверный формат ответа от сервера');
          return;
        }
        
        const { missing_materials } = data;
        
        let validMissingMaterials = [];
        if (Array.isArray(missing_materials)) {
          validMissingMaterials = missing_materials.filter(item => 
            item && 
            typeof item === 'object' && 
            typeof item.name === 'string' && 
            item.name.trim() !== ''
          );
        }
        
        setMissingMaterials(validMissingMaterials);
        
        if (validMissingMaterials.length > 0) {
          toast.warning(`Найдено ${validMissingMaterials.length} недостающих материалов`);
        } else {
          toast.success('Все материалы в наличии');
        }
      },
      onError: (error) => {
        console.error('Ошибка проверки материалов:', error);
        toast.error('Ошибка проверки материалов');
      }
    }
  );

  // Нормализация имени для сравнения
  const normalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // убираем все символы кроме букв, цифр и пробелов
      .replace(/\s+/g, ' ') // заменяем множественные пробелы на одинарные
      .trim();
  };

  // Проверка, является ли материал недостающим
  const isMaterialMissing = (itemName) => {
    const normalizedItemName = normalizeName(itemName);
    
    const isMissing = missingMaterials.some(missing => {
      const normalizedMissingName = normalizeName(missing.name);
      return normalizedMissingName === normalizedItemName;
    });
    
    return isMissing;
  };

  // Обработка изменения элемента
  const handleItemChange = (itemId, field, value) => {
    if (onUpdateItem) {
      onUpdateItem(itemId, field, value);
    }
  };

  // Обработка добавления элемента
  const handleAddItem = () => {
    if (onAddItem) {
      onAddItem();
    }
  };

  // Обработка удаления элемента
  const handleDeleteItem = (itemId) => {
    if (onDeleteItem) {
      onDeleteItem(itemId);
    }
  };

  // Переключение режима редактирования
  const toggleEdit = () => {
    setEditingItems(!editingItems);
    if (onToggleEdit) {
      onToggleEdit(!editingItems);
    }
  };

  // Проверка материалов
  const checkMaterials = () => {
    if (orderId) {
      checkMaterialsMutation.mutate();
    } else {
      toast.warning('Сначала сохраните заказ для проверки материалов');
    }
  };

  // Вычисление общей суммы
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.price || 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Edit className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Позиции заказа</h2>
            <p className="text-sm text-gray-500">Состав и стоимость заказа</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {orderId && (
            <button
              onClick={checkMaterials}
              disabled={checkMaterialsMutation.isLoading}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {checkMaterialsMutation.isLoading ? 'Проверяем...' : 'Проверить материалы'}
            </button>
          )}
          
          <button
            onClick={toggleEdit}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
          >
            {editingItems ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-1/2">Наименование</th>
              <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700 w-20">Кол-во</th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 w-32">Цена</th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 w-20">Сумма</th>
              <th className="w-10">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Нет на складе"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="В наличии"></div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              if (!item || !item.name) {
                return null;
              }
              
              const isMissing = isMaterialMissing(item.name);
              return (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  isMissing ? 'bg-red-50 border-red-200' : ''
                }`}>
                  <td className="py-4 px-4 w-1/2">
                    <input
                      type="text"
                      value={item.name}
                      readOnly={!editingItems}
                      onChange={(e) => editingItems && handleItemChange(item.id, 'name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        editingItems 
                          ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                          : 'border-transparent bg-gray-50'
                      }`}
                      placeholder="Название позиции"
                    />
                  </td>
                  <td className="py-4 px-4 w-20">
                    <input
                      type="number"
                      value={item.quantity}
                      readOnly={!editingItems}
                      onChange={(e) => editingItems && handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-2 text-sm border rounded-lg transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        editingItems 
                          ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                          : 'border-transparent bg-gray-50'
                      }`}
                      min="0"
                    />
                  </td>
                  <td className="py-4 px-4 w-32">
                    <input
                      type="number"
                      value={item.price}
                      readOnly={!editingItems}
                      onChange={(e) => editingItems && handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className={`w-full px-2 py-2 text-sm border rounded-lg transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        editingItems 
                          ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                          : 'border-transparent bg-gray-50'
                      }`}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="py-4 px-4 w-20">
                    <input
                      type="text"
                      value={(item.quantity * item.price).toLocaleString()}
                      readOnly
                      className="w-full px-2 py-2 text-sm border border-transparent bg-gray-50 rounded-lg text-right font-medium"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {checkMaterialsMutation.isLoading && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <div className="animate-spin h-3 w-3 border border-blue-700 border-t-transparent rounded-full"></div>
                          Проверяем...
                        </div>
                      )}
                      {!checkMaterialsMutation.isLoading && isMissing && (
                        <div 
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium cursor-help"
                          title="Нет на складе"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                      {!checkMaterialsMutation.isLoading && !isMissing && missingMaterials.length > 0 && (
                        <div 
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium cursor-help"
                          title="В наличии"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                      {editingItems && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Кнопка добавления позиции */}
      {editingItems && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить позицию
          </button>
        </div>
      )}

      {/* Итого */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-sm text-gray-500">Итого:</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalAmount.toLocaleString()} ₽
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTable;
