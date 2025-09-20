import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';

const MaterialInput = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Введите название материала...",
  showStockStatus = true,
  highlightMissing = true,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stockStatus, setStockStatus] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // API для поиска материалов
  const API_BASE = 'http://localhost:5000/api';
  const AUTH_TOKEN = 'test-token';

  // Поиск материалов с проверкой остатков
  const searchMaterials = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setStockStatus(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/warehouse-stock?search=${encodeURIComponent(query)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
        
        // Проверяем точное совпадение для текущего значения
        if (value && value.trim()) {
          const exactMatch = data.find(material => 
            material.material_name.toLowerCase() === value.toLowerCase()
          );
          if (exactMatch) {
            setStockStatus({
              available: exactMatch.current_stock,
              minStock: exactMatch.min_stock,
              isAvailable: exactMatch.current_stock > 0,
              isLowStock: exactMatch.current_stock <= exactMatch.min_stock,
              unit: exactMatch.unit
            });
          } else {
            setStockStatus({
              available: 0,
              minStock: 0,
              isAvailable: false,
              isLowStock: false,
              unit: 'шт'
            });
          }
        }
      }
    } catch (error) {
      console.error('Ошибка поиска материалов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка изменения ввода
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchMaterials(newValue);
    setShowSuggestions(newValue.length >= 2);
    
    // Обновляем позицию выпадающего списка
    updateDropdownPosition();
  };

  // Простое позиционирование выпадающего списка
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Выбор материала из списка
  const handleSelectMaterial = (material) => {
    onChange(material.material_name);
    setShowSuggestions(false);
    
    // Устанавливаем статус остатка
    setStockStatus({
      available: material.current_stock,
      minStock: material.min_stock,
      isAvailable: material.current_stock > 0,
      isLowStock: material.current_stock <= material.min_stock,
      unit: material.unit
    });

    if (onSelect) {
      onSelect(material);
    }
  };

  // Закрытие списка при клике вне его и обновление позиции
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    const handleScroll = () => {
      if (showSuggestions && inputRef.current) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showSuggestions && inputRef.current) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSuggestions]);

  // Получение цвета статуса
  const getStatusColor = () => {
    if (!stockStatus) return 'text-gray-400';
    if (stockStatus.isAvailable && !stockStatus.isLowStock) return 'text-green-600';
    if (stockStatus.isAvailable && stockStatus.isLowStock) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Получение иконки статуса
  const getStatusIcon = () => {
    if (!stockStatus) return <Search className="h-4 w-4" />;
    if (stockStatus.isAvailable && !stockStatus.isLowStock) return <CheckCircle className="h-4 w-4" />;
    if (stockStatus.isAvailable && stockStatus.isLowStock) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  // Получение текста статуса
  const getStatusText = () => {
    if (!stockStatus) return '';
    if (stockStatus.isAvailable && !stockStatus.isLowStock) return `В наличии: ${stockStatus.available} ${stockStatus.unit}`;
    if (stockStatus.isAvailable && stockStatus.isLowStock) return `Мало: ${stockStatus.available} ${stockStatus.unit} (мин: ${stockStatus.minStock})`;
    return 'Нет на складе';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={updateDropdownPosition}
            placeholder={placeholder}
            className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              highlightMissing && stockStatus && !stockStatus.isAvailable 
                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                : stockStatus && stockStatus.isLowStock
                  ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500 focus:border-yellow-500'
                  : stockStatus && stockStatus.isAvailable
                    ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        
        {/* Иконка статуса */}
        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none ${getStatusColor()}`}>
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          ) : (
            getStatusIcon()
          )}
        </div>
      </div>

      {/* Статус остатка */}
      {showStockStatus && stockStatus && (
        <div className={`mt-1 text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      )}

      {/* Список предложений */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{ 
            top: '100%',
            left: 0,
            width: '100%'
          }}
        >
          {suggestions.map((material) => (
            <div
              key={material.id}
              onClick={() => handleSelectMaterial(material)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {material.material_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {material.category_name || 'Без категории'}
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    material.current_stock > 0 
                      ? material.current_stock <= material.min_stock 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {material.current_stock} {material.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    {material.current_price ? `${material.current_price} ₽` : 'Цена не указана'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialInput;
