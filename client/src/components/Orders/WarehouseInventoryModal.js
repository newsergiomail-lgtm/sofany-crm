import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ShoppingCart, Check, X, AlertCircle, Package, TrendingUp, Database, X as CloseIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const WarehouseInventoryModal = ({ 
  isOpen, 
  onClose,
  orderId,
  items = [], 
  onItemsChange, 
  onAddItem, 
  onDeleteItem, 
  onUpdateItem,
  onPurchaseRequest
}) => {
  // ========================================
  // ИНТЕГРАЦИЯ: База данных
  // ========================================
  const [warehouseDB, setWarehouseDB] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Загрузка материалов из API
  const loadMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные API в формат таблицы
        const transformedData = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_name || 'Не указана',
          stock: parseFloat(item.current_stock) || 0,
          unit: item.unit || 'шт',
          price: parseFloat(item.price_per_unit) || 0,
          min_stock: parseFloat(item.min_stock) || 0,
          supplier: item.supplier || 'Не указан'
        }));
        setWarehouseDB(transformedData);
        console.log('Загружено материалов:', transformedData.length);
      } else {
        console.error('Ошибка загрузки материалов');
        // Fallback к тестовым данным
        setWarehouseDB([
          { id: 1, name: 'Фанера 18мм', category: 'Пиломатериалы', stock: 15, unit: 'м²', price: 1200, min_stock: 10, supplier: 'ЛесТорг' },
          { id: 2, name: 'ДСП 16мм', category: 'Пиломатериалы', stock: 20, unit: 'м²', price: 800, min_stock: 10, supplier: 'ДСП завод' },
          { id: 3, name: 'Болты М8х60', category: 'Крепеж', stock: 5, unit: 'шт', price: 8, min_stock: 10, supplier: 'Метизы' },
          { id: 4, name: 'Механизм Аккордеон', category: 'Фурнитура', stock: 2, unit: 'шт', price: 1500, min_stock: 5, supplier: 'ФурнитураПлюс' },
          { id: 5, name: 'Поролон ППУ-25', category: 'Наполнители', stock: 0, unit: 'м²', price: 300, min_stock: 5, supplier: 'ПеноМат' },
          { id: 6, name: 'Ткань велюр', category: 'Ткани', stock: 8, unit: 'м', price: 800, min_stock: 5, supplier: 'ТекстильПро' }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      // Fallback к тестовым данным
      setWarehouseDB([
        { id: 1, name: 'Фанера 18мм', category: 'Пиломатериалы', stock: 15, unit: 'м²', price: 1200, min_stock: 10, supplier: 'ЛесТорг' },
        { id: 2, name: 'ДСП 16мм', category: 'Пиломатериалы', stock: 20, unit: 'м²', price: 800, min_stock: 10, supplier: 'ДСП завод' },
        { id: 3, name: 'Болты М8х60', category: 'Крепеж', stock: 5, unit: 'шт', price: 8, min_stock: 10, supplier: 'Метизы' },
        { id: 4, name: 'Механизм Аккордеон', category: 'Фурнитура', stock: 2, unit: 'шт', price: 1500, min_stock: 5, supplier: 'ФурнитураПлюс' },
        { id: 5, name: 'Поролон ППУ-25', category: 'Наполнители', stock: 0, unit: 'м²', price: 300, min_stock: 5, supplier: 'ПеноМат' },
        { id: 6, name: 'Ткань велюр', category: 'Ткани', stock: 8, unit: 'м', price: 800, min_stock: 5, supplier: 'ТекстильПро' }
      ]);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Загружаем материалы при открытии модалки
  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  // ========================================
  // СОСТОЯНИЕ КОМПОНЕНТА
  // ========================================
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notification, setNotification] = useState(null);
  const [quantities, setQuantities] = useState({});

  // Синхронизируем selectedItems с items из props только при открытии модалки
  useEffect(() => {
    if (isOpen) {
      if (items && items.length > 0) {
        setSelectedItems(items);
        const newQuantities = {};
        items.forEach(item => {
          newQuantities[item.id || item.name] = item.quantity || 1;
        });
        setQuantities(newQuantities);
      } else {
        // Очищаем при открытии пустой модалки
        setSelectedItems([]);
        setQuantities({});
      }
    }
  }, [isOpen, items]);

  // ========================================
  // ИНТЕГРАЦИЯ: Предиктивный поиск
  // ========================================
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return warehouseDB.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, warehouseDB]);

  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setShowSuggestions(searchTerm.length > 0);
  }, [filteredSuggestions, searchTerm]);

  // ========================================
  // ФУНКЦИИ УПРАВЛЕНИЯ МАТЕРИАЛАМИ
  // ========================================
  
  const addItem = (item) => {
    if (!selectedItems.find(selected => selected.id === item.id)) {
      const newItems = [...selectedItems, item];
      setSelectedItems(newItems);
      setQuantities({...quantities, [item.id]: 1});
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // ИНТЕГРАЦИЯ: Добавление нового материала в систему
  const addCustomItem = (itemName) => {
    const customItem = {
      id: `custom_${Date.now()}`,
      name: itemName,
      category: 'Не указана',
      stock: 0,
      unit: 'шт',
      price: 0,
      min_stock: 0,
      supplier: 'Не указан'
    };
    
    if (!selectedItems.find(selected => selected.name.toLowerCase() === itemName.toLowerCase())) {
      const newItems = [...selectedItems, customItem];
      setSelectedItems(newItems);
      setQuantities({...quantities, [customItem.id]: 1});
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const removeItem = (itemId) => {
    const newItems = selectedItems.filter(item => item.id !== itemId);
    setSelectedItems(newItems);
    const newQuantities = {...quantities};
    delete newQuantities[itemId];
    setQuantities(newQuantities);
  };

  const updateQuantity = (itemId, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    setQuantities({...quantities, [itemId]: newQuantity});
  };

  // ========================================
  // ЛОГИКА ПРОВЕРКИ НАЛИЧИЯ НА СКЛАДЕ
  // ========================================
  
  const getStockStatus = (item) => {
    const requiredQuantity = quantities[item.id] || 1;
    const stock = item.stock || 0;
    if (stock === 0) return 'out-of-stock';
    if (stock < requiredQuantity) return 'insufficient';
    return 'available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'sofany-status-success';
      case 'insufficient': return 'sofany-status-warning';
      case 'out-of-stock': return 'sofany-status-error';
      default: return 'sofany-status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <Check className="w-4 h-4" />;
      case 'insufficient': return <AlertCircle className="w-4 h-4" />;
      case 'out-of-stock': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusText = (status, item) => {
    const requiredQuantity = quantities[item.id] || 1;
    const stock = item.stock || 0;
    const unit = item.unit || 'шт';
    
    switch (status) {
      case 'available': return `В наличии: ${stock} ${unit}`;
      case 'insufficient': return `Недостаточно: ${stock}/${requiredQuantity} ${unit}`;
      case 'out-of-stock': return 'Нет в наличии';
      default: return '';
    }
  };

  // ========================================
  // ИНТЕГРАЦИЯ: Отправка заявки на закупку
  // ========================================
  
  const sendPurchaseRequest = async () => {
    const unavailableItems = selectedItems.filter(item => {
      const status = getStockStatus(item);
      return status === 'out-of-stock' || status === 'insufficient';
    }).map(item => ({
      ...item,
      requiredQuantity: quantities[item.id],
      shortfall: Math.max(0, (quantities[item.id] || 1) - (item.stock || 0))
    }));

    if (unavailableItems.length === 0) {
      setNotification({
        type: 'info',
        message: 'Все материалы есть в наличии. Заявка на закупку не требуется.'
      });
      return;
    }

    setNotification({
      type: 'loading',
      message: 'Отправка заявки на закупку...'
    });

    try {
      // Создаем заявку на закупку
      const purchaseRequestData = {
        order_id: orderId || 0, // 0 = общая заявка, не привязанная к заказу
        title: `Заявка на закупку материалов ${orderId ? `для заказа #${orderId}` : ''}`,
        description: `Автоматически созданная заявка на закупку недостающих материалов.${orderId ? ` Связана с заказом #${orderId}.` : ''}`,
        priority: 'normal',
        items: unavailableItems.map(item => ({
          material_name: item.name,
          required_quantity: item.shortfall,
          unit: item.unit || 'шт',
          estimated_price: item.price || 0,
          supplier_name: item.supplier || '',
          supplier_contact: '',
          notes: `Требуется: ${item.shortfall} ${item.unit || 'шт'}, в наличии: ${item.stock || 0} ${item.unit || 'шт'}`
        }))
      };

      const response = await fetch('/api/purchase/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify(purchaseRequestData)
      });

      if (!response.ok) {
        throw new Error('Ошибка создания заявки на закупку');
      }

      const result = await response.json();
      
      setNotification({
        type: 'success',
        message: `✅ Заявка успешно создана!
        
Номер заявки: ${result.request_number}
Позиций к закупке: ${unavailableItems.length}
Общая сумма: ${unavailableItems.reduce((sum, item) => sum + (item.shortfall * (item.price || 0)), 0).toLocaleString()} ₽

Заявка доступна в разделе "Закупки" для редактирования и утверждения.`
      });

      // Уведомляем родительский компонент о создании заявки
      if (onPurchaseRequest) {
        onPurchaseRequest(result);
      }
      
    } catch (error) {
      console.error('Ошибка создания заявки на закупку:', error);
      setNotification({
        type: 'error',
        message: `Ошибка при создании заявки: ${error.message}`
      });
    }
  };

  const totalValue = selectedItems.reduce((sum, item) => {
    if (item.price > 0) {
      return sum + (item.price * (quantities[item.id] || 1));
    }
    return sum;
  }, 0);

  // Функция для уведомления родительского компонента
  const notifyParent = () => {
    if (onItemsChange) {
      const itemsWithQuantities = selectedItems.map(item => ({
        ...item,
        quantity: quantities[item.id] || 1
      }));
      onItemsChange(itemsWithQuantities);
    }
  };

  // Уведомляем родительский компонент при закрытии модалки
  const handleClose = () => {
    notifyParent();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Складская система</h2>
                <p className="text-gray-600">Управление материалами и автоматические заявки на закупку</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <style jsx>{`
              .sofany-search {
                position: relative;
                margin-bottom: 2rem;
              }

              .sofany-search input {
                width: 100%;
                padding: 1rem 1rem 1rem 3rem;
                border: 2px solid #e2e8f0;
                border-radius: 0.75rem;
                font-size: 1.1rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: white;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }

              .sofany-search input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
              }

              .sofany-suggestions {
                position: absolute;
                z-index: 50;
                width: 100%;
                margin-top: 0.5rem;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                max-height: 20rem;
                overflow-y: auto;
              }

              .sofany-suggestion-item {
                padding: 1rem;
                cursor: pointer;
                border-bottom: 1px solid #f1f5f9;
                transition: all 0.2s;
              }

              .sofany-suggestion-item:hover {
                background: #f8fafc;
                transform: translateX(4px);
              }

              .sofany-suggestion-item:last-child {
                border-bottom: none;
              }

              .sofany-add-custom {
                padding: 1rem;
                cursor: pointer;
                border-top: 2px solid #e2e8f0;
                background: #fefefe;
                transition: all 0.2s;
              }

              .sofany-add-custom:hover {
                background: #f0f9ff;
                transform: translateX(4px);
              }

              .sofany-table-container {
                background: white;
                border-radius: 1rem;
                padding: 2rem;
                margin-bottom: 2rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }

              .sofany-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                background: white;
                border-radius: 0.75rem;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }

              .sofany-table th {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                padding: 1rem;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border-bottom: 2px solid #e2e8f0;
              }

              .sofany-table td {
                padding: 1rem;
                border-bottom: 1px solid #f1f5f9;
                transition: all 0.2s;
              }

              .sofany-table tr:hover {
                background: #f8fafc;
              }

              .sofany-table tr:hover td {
                transform: scale(1.01);
              }

              .sofany-status-success {
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
                padding: 0.5rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
              }

              .sofany-status-warning {
                background: #fef3c7;
                border: 1px solid #fcd34d;
                color: #92400e;
                padding: 0.5rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
              }

              .sofany-status-error {
                background: #fee2e2;
                border: 1px solid #fca5a5;
                color: #991b1b;
                padding: 0.5rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
              }

              .sofany-btn-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }

              .sofany-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }

              .sofany-notification {
                position: fixed;
                top: 1rem;
                right: 1rem;
                padding: 1.5rem;
                border-radius: 0.75rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                max-width: 24rem;
                z-index: 100;
                animation: slideIn 0.3s ease-out;
              }

              @keyframes slideIn {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }

              .sofany-notification.success {
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
              }

              .sofany-notification.loading {
                background: #dbeafe;
                border: 1px solid #93c5fd;
                color: #1e40af;
              }

              .sofany-notification.info {
                background: #fef3c7;
                border: 1px solid #fcd34d;
                color: #92400e;
              }

              .sofany-empty-state {
                text-align: center;
                padding: 4rem 2rem;
                color: #6b7280;
              }

              .sofany-quantity-input {
                width: 5rem;
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                text-align: center;
                transition: all 0.2s;
              }

              .sofany-quantity-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              }

              .sofany-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
              }

              .sofany-stat-card {
                background: white;
                padding: 1rem;
                border-radius: 0.75rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border-left: 4px solid #3b82f6;
              }
            `}</style>

            {/* Статистика */}
            <div className="sofany-stats">
              <div className="sofany-stat-card">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-xl font-bold text-gray-900">{warehouseDB.length}</div>
                    <div className="text-sm text-gray-600">Позиций в базе</div>
                  </div>
                </div>
              </div>
              <div className="sofany-stat-card">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-xl font-bold text-gray-900">{selectedItems.length}</div>
                    <div className="text-sm text-gray-600">Выбрано материалов</div>
                  </div>
                </div>
              </div>
              <div className="sofany-stat-card">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {totalValue > 0 ? `${totalValue.toLocaleString()} ₽` : '0 ₽'}
                    </div>
                    <div className="text-sm text-gray-600">Общая стоимость</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Поиск с предиктивным вводом */}
            <div className="sofany-search">
              <div className="relative">
                <Search className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Начните вводить название материала или создайте новую позицию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {showSuggestions && (
                <div className="sofany-suggestions">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="sofany-suggestion-item"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm px-2 py-1 rounded ${(item.stock || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {(item.stock || 0) > 0 ? `${item.stock || 0} ${item.unit || 'шт'}` : 'Нет в наличии'}
                          </div>
                          <div className="text-sm text-gray-600">{item.price || 0} ₽/{item.unit || 'шт'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Опция добавления нового материала */}
                  {searchTerm.trim() && !suggestions.find(item => item.name.toLowerCase() === searchTerm.toLowerCase()) && (
                    <div
                      onClick={() => addCustomItem(searchTerm.trim())}
                      className="sofany-add-custom"
                    >
                      <div className="flex items-center">
                        <Plus className="w-4 h-4 text-blue-600 mr-2" />
                        <div>
                          <div className="font-medium text-blue-700">Добавить новый: "{searchTerm}"</div>
                          <div className="text-sm text-blue-600">Материал будет добавлен для заявки на закупку</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {suggestions.length === 0 && searchTerm.trim() && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="mb-3">Материал не найден в базе данных</div>
                      <button
                        onClick={() => addCustomItem(searchTerm.trim())}
                        className="sofany-btn-primary"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить "{searchTerm}" в заявку
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Таблица выбранных материалов */}
            {selectedItems.length > 0 && (
              <div className="sofany-table-container">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Выбранные материалы</h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {totalValue > 0 ? `${totalValue.toLocaleString()} ₽` : 'Стоимость уточняется'}
                    </div>
                    {selectedItems.some(item => item.price === 0) && (
                      <div className="text-sm text-gray-600">+ позиции с неуточненной стоимостью</div>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="sofany-table">
                    <thead>
                      <tr>
                        <th>Материал</th>
                        <th>Категория</th>
                        <th className="text-center">Количество</th>
                        <th className="text-center">Цена за ед.</th>
                        <th className="text-center">Сумма</th>
                        <th className="text-center">Статус наличия</th>
                        <th className="text-center">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item) => {
                        const status = getStockStatus(item);
                        return (
                          <tr key={item.id}>
                            <td className="font-semibold text-gray-900">{item.name}</td>
                            <td className="text-gray-600">{item.category}</td>
                            <td className="text-center">
                              <input
                                type="number"
                                min="1"
                                value={quantities[item.id] || 1}
                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                className="sofany-quantity-input"
                              />
                              <span className="ml-2 text-sm text-gray-600">{item.unit || 'шт'}</span>
                            </td>
                            <td className="text-center text-gray-700">
                              {item.price > 0 ? `${item.price} ₽` : 'Уточнить'}
                            </td>
                            <td className="text-center font-semibold text-gray-900">
                              {item.price > 0 ? `${(item.price * (quantities[item.id] || 1)).toLocaleString()} ₽` : 'Уточнить'}
                            </td>
                            <td className="text-center">
                              <div className={getStatusColor(status)}>
                                {getStatusIcon(status)}
                                <span>{getStatusText(status, item)}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={sendPurchaseRequest}
                    className="sofany-btn-primary"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Отправить заявку на закупку
                  </button>
                </div>
              </div>
            )}

            {/* Пустое состояние */}
            {selectedItems.length === 0 && (
              <div className="sofany-empty-state">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">Начните добавлять материалы</h3>
                <p className="text-base">Используйте поиск выше для добавления материалов в заявку</p>
                <p className="text-sm mt-2 opacity-75">Можете добавлять как существующие, так и новые позиции</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Закрыть
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      </div>

      {/* Уведомления */}
      {notification && (
        <div className={`sofany-notification ${notification.type}`}>
          <div className="flex items-start">
            {notification.type === 'loading' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3 mt-0.5"></div>
            )}
            <div>
              <pre className="font-medium whitespace-pre-wrap">{notification.message}</pre>
              <button
                onClick={() => setNotification(null)}
                className="mt-3 text-sm underline hover:no-underline opacity-75 hover:opacity-100"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseInventoryModal;
