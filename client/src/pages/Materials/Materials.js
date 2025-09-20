import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  BarChart3, 
  X,
  Warehouse,
  DollarSign,
  Wrench,
  PlusCircle,
  MinusCircle,
  Edit3,
  Truck
} from 'lucide-react';

const Materials = () => {
  // Состояние для данных
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Состояние для фильтрации
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // Состояние для модальных окон
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Состояние для операций
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [operationData, setOperationData] = useState({
    quantity: '',
    supplier: '',
    purpose: '',
    reason: '',
    notes: ''
  });

  // Состояние для поиска материалов
  const [materialSearch, setMaterialSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const API_BASE = 'http://localhost:5000/api';
  const AUTH_TOKEN = 'test-token';

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadData();
  }, []);

  // Закрытие автодополнения при клике вне поля
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMaterialsStats(),
        loadMaterials(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const loadMaterialsStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/materials/stats/overview`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  // Загрузка материалов
  const loadMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (stockFilter === 'low') params.append('low_stock', 'true');

      const response = await fetch(`${API_BASE}/materials?${params}`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };


  // Поиск материалов для автодополнения
  const searchMaterials = async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/materials/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data);
      }
    } catch (error) {
      console.error('Ошибка поиска материалов:', error);
    }
  };

  // Обработка поиска
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchText(query);
    searchMaterials(query);
    setShowSuggestions(query.length >= 2);
  };

  // Обработка поиска для модальных окон
  const handleModalSearch = (e) => {
    const query = e.target.value;
    setMaterialSearch(query);
    searchMaterials(query);
    setShowSuggestions(query.length >= 2);
  };

  // Выбор материала из поиска
  const selectMaterial = (material) => {
    setSelectedMaterial(material);
    setMaterialSearch(material.name);
    setShowSuggestions(false);
  };

  // Применение фильтров
  const applyFilters = () => {
    loadMaterials();
  };

  // Обработка операций со складом
  const handleReceive = async () => {
    if (!selectedMaterial || !operationData.quantity) return;

    try {
      const response = await fetch(`${API_BASE}/materials/${selectedMaterial.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          quantity: operationData.quantity,
          supplier: operationData.supplier,
          notes: operationData.notes
        })
      });

      if (response.ok) {
        alert('Приход успешно оформлен!');
        setShowReceiveModal(false);
        resetOperationData();
        loadData();
      } else {
        const error = await response.json();
        alert('Ошибка: ' + error.message);
      }
    } catch (error) {
      console.error('Ошибка прихода:', error);
      alert('Ошибка оформления прихода');
    }
  };

  const handleIssue = async () => {
    if (!selectedMaterial || !operationData.quantity) return;

    try {
      const response = await fetch(`${API_BASE}/materials/${selectedMaterial.id}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          quantity: operationData.quantity,
          purpose: operationData.purpose,
          notes: operationData.notes
        })
      });

      if (response.ok) {
        alert('Списание успешно оформлено!');
        setShowIssueModal(false);
        resetOperationData();
        loadData();
      } else {
        const error = await response.json();
        alert('Ошибка: ' + error.message);
      }
    } catch (error) {
      console.error('Ошибка списания:', error);
      alert('Ошибка оформления списания');
    }
  };

  const handleAdjust = async () => {
    if (!selectedMaterial || !operationData.quantity) return;

    try {
      const response = await fetch(`${API_BASE}/materials/${selectedMaterial.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          new_quantity: operationData.quantity,
          reason: operationData.reason,
          notes: operationData.notes
        })
      });

      if (response.ok) {
        alert('Корректировка успешно выполнена!');
        setShowAdjustModal(false);
        resetOperationData();
        loadData();
      } else {
        const error = await response.json();
        alert('Ошибка: ' + error.message);
      }
    } catch (error) {
      console.error('Ошибка корректировки:', error);
      alert('Ошибка корректировки остатка');
    }
  };

  // Сброс данных операции
  const resetOperationData = () => {
    setOperationData({
      quantity: '',
      supplier: '',
      purpose: '',
      reason: '',
      notes: ''
    });
    setSelectedMaterial(null);
    setMaterialSearch('');
  };

  // Быстрые действия
  const quickReceive = (material) => {
    setSelectedMaterial(material);
    setMaterialSearch(material.name);
    setShowReceiveModal(true);
  };

  const quickIssue = (material) => {
    setSelectedMaterial(material);
    setMaterialSearch(material.name);
    setShowIssueModal(true);
  };

  const quickAdjust = (material) => {
    setSelectedMaterial(material);
    setMaterialSearch(material.name);
    setOperationData(prev => ({ ...prev, quantity: material.current_stock }));
    setShowAdjustModal(true);
  };

  // Форматирование валюты
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount || 0);
  };


  // Расчет процента остатка для прогресс-бара
  const getStockPercentage = (current, minimum) => {
    if (minimum === 0) return 100;
    // Используем логарифмическую шкалу для более наглядного отображения
    // Чем меньше остаток относительно минимума, тем короче полоска
    const ratio = current / minimum;
    if (ratio <= 0.1) return 5; // Очень низкий остаток - 5%
    if (ratio <= 0.3) return 15; // Низкий остаток - 15%
    if (ratio <= 0.5) return 30; // Половина минимума - 30%
    if (ratio <= 0.7) return 50; // 70% от минимума - 50%
    if (ratio <= 1) return 70; // На уровне минимума - 70%
    if (ratio <= 1.5) return 85; // 1.5x минимума - 85%
    return 100; // Выше 1.5x минимума - 100%
  };

  // Получение цвета прогресс-бара
  const getProgressColor = (current, minimum) => {
    if (current <= minimum) return 'bg-red-500';
    if (current <= minimum * 1.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                <Warehouse className="inline-block mr-2 text-blue-600 dark:text-blue-400" />
                Склад материалов
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-glass btn-glass-success btn-glass-md flex items-center"
              >
                <Plus className="inline-block mr-2" />
                Добавить материал
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Метрики склада */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Всего материалов</p>
                <p className="text-3xl font-bold">{stats.total_materials || 0}</p>
                <p className="text-blue-200 dark:text-blue-300 text-xs mt-1">{stats.normal_stock_materials || 0} нормальный остаток</p>
              </div>
              <Package className="text-4xl text-blue-200 dark:text-blue-300" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Общая стоимость</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.total_value)}</p>
                <p className="text-blue-200 dark:text-blue-300 text-xs mt-1">{formatCurrency(stats.avg_material_value)} средняя стоимость</p>
              </div>
              <DollarSign className="text-4xl text-blue-200 dark:text-blue-300" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-yellow-500 dark:from-pink-600 dark:to-yellow-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Низкий остаток</p>
                <p className="text-3xl font-bold">{stats.low_stock_materials || 0}</p>
                <p className="text-blue-200 dark:text-blue-300 text-xs mt-1">{stats.critical_stock_materials || 0} критический</p>
              </div>
              <Package className="text-4xl text-blue-200 dark:text-blue-300" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Категории</p>
                <p className="text-3xl font-bold">{stats.categories_count || 0}</p>
                <p className="text-blue-200 dark:text-blue-300 text-xs mt-1">{stats.zero_stock_materials || 0} с нулевым остатком</p>
              </div>
              <BarChart3 className="text-4xl text-blue-200 dark:text-blue-300" />
            </div>
          </div>
        </div>


        {/* Инструменты кладовщика */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            <Wrench className="inline-block mr-2 text-blue-600 dark:text-blue-400" />
            Инструменты кладовщика
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowReceiveModal(true)}
              className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="text-center">
                <PlusCircle className="text-3xl text-green-600 dark:text-green-400 mb-2 mx-auto" />
                <div className="text-sm font-medium text-green-800 dark:text-green-300">Приход</div>
                <div className="text-xs text-green-600 dark:text-green-400">Пополнить склад</div>
              </div>
            </button>
            
            <button 
              onClick={() => setShowIssueModal(true)}
              className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="text-center">
                <MinusCircle className="text-3xl text-red-600 dark:text-red-400 mb-2 mx-auto" />
                <div className="text-sm font-medium text-red-800 dark:text-red-300">Списание</div>
                <div className="text-xs text-red-600 dark:text-red-400">Выдать со склада</div>
              </div>
            </button>
            
            <button 
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <div className="text-center">
                <Edit3 className="text-3xl text-yellow-600 dark:text-yellow-400 mb-2 mx-auto" />
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Корректировка</div>
                <div className="text-xs text-yellow-600">Исправить остаток</div>
              </div>
            </button>
            
            <button 
              onClick={() => alert('Функция массового прихода будет добавлена в следующей версии')}
              className="flex items-center justify-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="text-center">
                <Truck className="text-3xl text-blue-600 mb-2 mx-auto" />
                <div className="text-sm font-medium text-blue-800">Массовый приход</div>
                <div className="text-xs text-blue-600">Несколько материалов</div>
              </div>
            </button>
          </div>
        </div>

        {/* Поиск материалов */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            <Search className="inline-block mr-2 text-blue-600 dark:text-blue-400" />
            Поиск материалов
          </h3>
          
          <div className="relative mb-4 search-container">
            <input
              type="text"
              value={searchText}
              onChange={handleSearch}
              placeholder="Введите название материала для поиска..."
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 text-xl" />
            
            {/* Автодополнение для основного поиска */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                {searchSuggestions.map(material => (
                  <div
                    key={material.id}
                    onClick={() => {
                      setSearchText(material.name);
                      setShowSuggestions(false);
                      // Автоматически применить фильтр при выборе
                      setTimeout(() => applyFilters(), 100);
                    }}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{material.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{material.category_name || 'Без категории'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{material.current_stock} {material.unit}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(material.price_per_unit)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Остаток</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все</option>
                <option value="low">Низкий остаток</option>
                <option value="normal">Нормальный</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="inline-block mr-2" />
                Применить фильтры
              </button>
            </div>
          </div>
        </div>

        {/* Таблица материалов */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Материал</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Категория</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Текущий остаток</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Минимальный</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена за единицу</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Общая стоимость</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Действия</span>
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-600 dark:bg-green-700 text-white px-3 py-1 rounded text-xs hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center"
                        title="Добавить материал"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Добавить
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {materials.map((material) => {
                  const isLowStock = material.current_stock <= Math.min(material.min_stock, 5);
                  const totalValue = material.current_stock * (material.price_per_unit || 0);
                  
                  return (
                    <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{material.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{material.supplier || 'Без поставщика'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: material.category_color || '#6B7280' }}
                        >
                          {material.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{material.current_stock} {material.unit}</span>
                              <span className="text-gray-500 dark:text-gray-400">из {material.min_stock}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(material.current_stock, material.min_stock)}`}
                                style={{ width: `${getStockPercentage(material.current_stock, material.min_stock)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.min_stock} {material.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(material.price_per_unit)}/{material.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isLowStock 
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' 
                            : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        }`}>
                          {isLowStock ? 'Низкий остаток' : 'Нормальный'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => quickReceive(material)}
                            className="icon-action icon-action-success" 
                            title="Приход"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => quickIssue(material)}
                            className="icon-action icon-action-danger" 
                            title="Списание"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => quickAdjust(material)}
                            className="icon-action icon-action-warning" 
                            title="Корректировка"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Модальные окна */}
        {/* Модальное окно прихода */}
        {showReceiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <PlusCircle className="inline-block mr-2 text-green-600" />
                  Приход материала
                </h3>
                <button 
                  onClick={() => setShowReceiveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
                  <div className="relative search-container">
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={handleModalSearch}
                      placeholder="Начните вводить название материала..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchSuggestions.map(material => (
                          <div
                            key={material.id}
                            onClick={() => selectMaterial(material)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{material.name}</div>
                                <div className="text-sm text-gray-500">{material.category_name || 'Без категории'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{material.current_stock} {material.unit}</div>
                                <div className="text-xs text-gray-500">{formatCurrency(material.price_per_unit)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
                  <input
                    type="number"
                    value={operationData.quantity}
                    onChange={(e) => setOperationData(prev => ({ ...prev, quantity: e.target.value }))}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Поставщик</label>
                  <input
                    type="text"
                    value={operationData.supplier}
                    onChange={(e) => setOperationData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Примечания</label>
                  <textarea
                    value={operationData.notes}
                    onChange={(e) => setOperationData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleReceive}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Оформить приход
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно списания */}
        {showIssueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <MinusCircle className="inline-block mr-2 text-red-600" />
                  Списание материала
                </h3>
                <button 
                  onClick={() => setShowIssueModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
                  <div className="relative search-container">
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={handleModalSearch}
                      placeholder="Начните вводить название материала..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchSuggestions.map(material => (
                          <div
                            key={material.id}
                            onClick={() => selectMaterial(material)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{material.name}</div>
                                <div className="text-sm text-gray-500">{material.category_name || 'Без категории'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{material.current_stock} {material.unit}</div>
                                <div className="text-xs text-gray-500">{formatCurrency(material.price_per_unit)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedMaterial && (
                    <div className="text-sm text-gray-500 mt-1">
                      Доступно: {selectedMaterial.current_stock} {selectedMaterial.unit}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
                  <input
                    type="number"
                    value={operationData.quantity}
                    onChange={(e) => setOperationData(prev => ({ ...prev, quantity: e.target.value }))}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Назначение</label>
                  <input
                    type="text"
                    value={operationData.purpose}
                    onChange={(e) => setOperationData(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Примечания</label>
                  <textarea
                    value={operationData.notes}
                    onChange={(e) => setOperationData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleIssue}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Оформить списание
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно корректировки */}
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <Edit3 className="inline-block mr-2 text-yellow-600" />
                  Корректировка остатка
                </h3>
                <button 
                  onClick={() => setShowAdjustModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
                  <div className="relative search-container">
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={handleModalSearch}
                      placeholder="Начните вводить название материала..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchSuggestions.map(material => (
                          <div
                            key={material.id}
                            onClick={() => selectMaterial(material)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{material.name}</div>
                                <div className="text-sm text-gray-500">{material.category_name || 'Без категории'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{material.current_stock} {material.unit}</div>
                                <div className="text-xs text-gray-500">{formatCurrency(material.price_per_unit)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Текущий остаток</label>
                  <input
                    type="number"
                    value={selectedMaterial?.current_stock || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Новый остаток</label>
                  <input
                    type="number"
                    value={operationData.quantity}
                    onChange={(e) => setOperationData(prev => ({ ...prev, quantity: e.target.value }))}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Причина</label>
                  <input
                    type="text"
                    value={operationData.reason}
                    onChange={(e) => setOperationData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Примечания</label>
                  <textarea
                    value={operationData.notes}
                    onChange={(e) => setOperationData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAdjust}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Выполнить корректировку
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;