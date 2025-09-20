import React, { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderItemsTableNew = ({ 
  orderId,
  items = [], 
  onItemsChange, 
  onAddItem, 
  onDeleteItem, 
  onUpdateItem,
  onPurchaseRequest
}) => {
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit_price: 0
  });
  const [missingMaterials, setMissingMaterials] = useState([]);
  const [isCheckingMaterials, setIsCheckingMaterials] = useState(false);
  const [warehouseMaterials, setWarehouseMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInputId, setActiveInputId] = useState(null);

  // Загрузка материалов из базы данных
  const loadMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setWarehouseMaterials(data);
        console.log('Загружено материалов:', data.length);
      } else {
        console.error('Ошибка загрузки материалов');
        // Fallback к тестовым данным
        setWarehouseMaterials([
          { id: 1, name: 'Фанера 18мм', current_stock: 15, min_stock: 10, unit: 'м²', price_per_unit: 1200 },
          { id: 2, name: 'ДСП 16мм', current_stock: 20, min_stock: 10, unit: 'м²', price_per_unit: 800 },
          { id: 3, name: 'Болты М8х60', current_stock: 5, min_stock: 10, unit: 'шт', price_per_unit: 8 },
          { id: 4, name: 'Механизм Аккордеон', current_stock: 2, min_stock: 5, unit: 'шт', price_per_unit: 1500 },
          { id: 5, name: 'Поролон ППУ-25', current_stock: 0, min_stock: 5, unit: 'м²', price_per_unit: 300 },
          { id: 6, name: 'Ткань велюр', current_stock: 8, min_stock: 5, unit: 'м', price_per_unit: 800 }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      // Fallback к тестовым данным
      setWarehouseMaterials([
        { id: 1, name: 'Фанера 18мм', current_stock: 15, min_stock: 10, unit: 'м²', price_per_unit: 1200 },
        { id: 2, name: 'ДСП 16мм', current_stock: 20, min_stock: 10, unit: 'м²', price_per_unit: 800 },
        { id: 3, name: 'Болты М8х60', current_stock: 5, min_stock: 10, unit: 'шт', price_per_unit: 8 },
        { id: 4, name: 'Механизм Аккордеон', current_stock: 2, min_stock: 5, unit: 'шт', price_per_unit: 1500 },
        { id: 5, name: 'Поролон ППУ-25', current_stock: 0, min_stock: 5, unit: 'м²', price_per_unit: 300 },
        { id: 6, name: 'Ткань велюр', current_stock: 8, min_stock: 5, unit: 'м', price_per_unit: 800 }
      ]);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Поиск материалов
  const searchMaterials = (query) => {
    console.log('Поиск материалов:', query, 'Материалов в базе:', warehouseMaterials.length);
    
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = warehouseMaterials.filter(material =>
      material.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    console.log('Найдено материалов:', filtered.length);
    setSearchResults(filtered);
    setShowSuggestions(true);
  };

  // Выбор материала
  const handleSelectMaterial = (material, inputId) => {
    if (inputId === 'new') {
      setNewItem(prev => ({
        ...prev,
        name: material.name,
        unit_price: material.price_per_unit
      }));
      } else {
      onUpdateItem(inputId, 'name', material.name);
      onUpdateItem(inputId, 'unit_price', material.price_per_unit);
    }
    setShowSuggestions(false);
    setActiveInputId(null);
  };

  // Загрузка материалов при монтировании компонента
  useEffect(() => {
    console.log('Загружаем материалы...');
    loadMaterials();
  }, []);

  // Закрытие выпадающего списка при клике вне поля
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, что клик не по полю ввода и не по выпадающему списку
      if (!event.target.closest('.material-input-container') && 
          !event.target.closest('.suggestions-dropdown')) {
        setShowSuggestions(false);
        setActiveInputId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Проверка материалов
  const checkMaterials = () => {
    setIsCheckingMaterials(true);
    
    const missing = items.map(item => {
      const material = warehouseMaterials.find(m => 
        m.name.toLowerCase() === item.name.toLowerCase()
      );
      
      if (!material) {
        return {
          material_name: item.name,
          required_quantity: item.quantity,
          available_quantity: 0,
          missing_quantity: item.quantity,
          is_available: false,
          status: 'not_found',
          unit: 'шт',
          unit_price: item.unit_price
        };
      }
      
      const availableStock = parseFloat(material.current_stock) || 0;
      const minStock = parseFloat(material.min_stock) || 0;
      const missingQuantity = Math.max(0, item.quantity - availableStock);
      const isLowStock = availableStock <= minStock;
      
      return {
        material_name: item.name,
        required_quantity: item.quantity,
        available_quantity: availableStock,
        missing_quantity: missingQuantity,
        is_available: missingQuantity === 0,
        is_low_stock: isLowStock && availableStock > 0,
        status: missingQuantity === 0 ? 'available' : 'insufficient_stock',
        unit: material.unit || 'шт',
        unit_price: parseFloat(material.price_per_unit) || item.unit_price
      };
    }).filter(item => item.missing_quantity > 0 || !item.is_available);
    
    setMissingMaterials(missing);
    setIsCheckingMaterials(false);
    
    if (missing.length > 0) {
      toast.error(`Найдено ${missing.length} недостающих материалов`);
        } else {
      toast.success('Все материалы в наличии');
    }
  };

  // Автоматическая проверка при изменении позиций
  useEffect(() => {
    if (items.length > 0) {
      checkMaterials();
    }
  }, [items]);

  // Добавление нового элемента
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast.error('Введите название материала');
      return;
    }

    const item = {
      id: Date.now(),
      name: newItem.name.trim(),
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total: newItem.quantity * newItem.unit_price
    };

    onAddItem(item);
    setNewItem({ name: '', quantity: 1, unit_price: 0 });
    toast.success('Материал добавлен');
  };

  // Проверка статуса материала
  const getMaterialStatus = (itemName) => {
    const missing = missingMaterials.find(m => 
      m.material_name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (!missing) return { status: 'available', icon: CheckCircle, color: 'green' };
    if (missing.is_low_stock) return { status: 'low_stock', icon: AlertTriangle, color: 'yellow' };
    return { status: 'missing', icon: XCircle, color: 'red' };
  };

  // Обработка запроса на закупку
  const handlePurchaseRequest = () => {
    if (missingMaterials.length === 0) {
      toast.error('Нет недостающих материалов для создания заявки');
      return;
    }

        if (onPurchaseRequest) {
      onPurchaseRequest(missingMaterials);
    }
    
    toast.success(`Создана заявка на закупку ${missingMaterials.length} материалов`);
  };

  // Расчет общей суммы
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Позиции заказа
            </h3>
            {isCheckingMaterials && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Проверка материалов...</span>
              </div>
            )}
              </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={checkMaterials}
              disabled={isCheckingMaterials}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Package className="h-4 w-4 mr-2" />
              Проверить материалы
            </button>
            
            {missingMaterials.length > 0 && (
              <button
                onClick={handlePurchaseRequest}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Заявка на закупку
              </button>
            )}
          </div>
            </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Наименование
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Кол-во
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Цена
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Сумма
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Статус
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
              const materialStatus = getMaterialStatus(item.name);
              const StatusIcon = materialStatus.icon;
                    
                    return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 relative">
                    <div className="material-input-container">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          onUpdateItem(item.id, 'name', e.target.value);
                          searchMaterials(e.target.value);
                          setActiveInputId(item.id);
                        }}
                        onFocus={() => {
                          if (item.name.length >= 2) {
                            searchMaterials(item.name);
                            setActiveInputId(item.id);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Введите название материала..."
                      />
                    </div>
                    
                    {/* Выпадающий список предложений */}
                    {showSuggestions && activeInputId === item.id && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleSelectMaterial(material, item.id)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{material.name}</div>
                            <div className="text-sm text-gray-500">
                              Остаток: {material.current_stock} {material.unit} | 
                              Цена: {material.price_per_unit} ₽
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-center"
                      min="0"
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => onUpdateItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right"
                      min="0"
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-right font-medium text-gray-900">
                      {item.quantity * item.unit_price} ₽
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <StatusIcon className={`h-5 w-5 ${
                        materialStatus.color === 'green' ? 'text-green-600' :
                        materialStatus.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Строка добавления */}
            <tr className="bg-blue-50">
              <td className="px-6 py-4 relative">
                <div className="material-input-container">
                  <input
                    type="text"
                      value={newItem.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewItem(prev => ({ ...prev, name: value }));
                      searchMaterials(value);
                      setActiveInputId('new');
                    }}
                    onFocus={() => {
                      setActiveInputId('new');
                      if (newItem.name.length >= 1) {
                        searchMaterials(newItem.name);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите название материала..."
                  />
                </div>
                
                {/* Выпадающий список предложений для нового элемента */}
                {showSuggestions && activeInputId === 'new' && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => handleSelectMaterial(material, 'new')}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-500">
                          Остаток: {material.current_stock} {material.unit} | 
                          Цена: {material.price_per_unit} ₽
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </td>
                
              <td className="px-6 py-4">
                  <input
                    type="number"
                  value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-center"
                  min="1"
                  />
                </td>
                
              <td className="px-6 py-4">
                  <input
                    type="number"
                  value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right"
                    min="0"
                  />
                </td>
                
              <td className="px-6 py-4">
                  <div className="text-right font-medium text-gray-900">
                  {newItem.quantity * newItem.unit_price} ₽
                  </div>
                </td>
                
              <td className="px-6 py-4">
                  <button
                    onClick={handleAddItem}
                    className="w-full flex items-center justify-center p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </td>
                
              <td className="px-6 py-4"></td>
              </tr>
          </tbody>
        </table>
      </div>

      {/* Итого */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Итого: {totalAmount.toFixed(2)} ₽
          </span>
          <span className="text-sm text-gray-500">
            {items.length} позиций
          </span>
        </div>
      </div>

      {/* Недостающие материалы */}
      {missingMaterials.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-800">Недостающие материалы:</h4>
          </div>
          <ul className="list-disc list-inside text-red-700">
            {missingMaterials.map((material, index) => (
              <li key={index} className="text-sm">
                {material.material_name} - требуется {material.required_quantity} {material.unit}
                {material.available_quantity > 0 && (
                  <span className="text-gray-600">
                    (в наличии: {material.available_quantity} {material.unit})
              </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrderItemsTableNew;