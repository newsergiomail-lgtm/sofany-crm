import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2 } from 'lucide-react';
import { suppliersAPI } from '../../services/api';

const SupplierAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Выберите поставщика...", 
  className = "",
  disabled = false 
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Загрузка поставщиков при открытии
  useEffect(() => {
    if (isOpen && suppliers.length === 0) {
      loadSuppliers();
    }
  }, [isOpen]);

  // Установка выбранного поставщика при изменении value
  useEffect(() => {
    if (value && typeof value === 'object') {
      setSelectedSupplier(value);
      setSearchTerm(value.name || '');
    } else if (value && typeof value === 'string') {
      setSearchTerm(value);
    } else {
      setSelectedSupplier(null);
      setSearchTerm('');
    }
  }, [value]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await suppliersAPI.getAll({ 
        limit: 100, 
        search: searchTerm 
      });
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error('Ошибка загрузки поставщиков:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      setLoading(true);
      try {
        const response = await suppliersAPI.getAll({ 
          limit: 100, 
          search: term 
        });
        setSuppliers(response.data.suppliers || []);
      } catch (error) {
        console.error('Ошибка поиска поставщиков:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuppliers([]);
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm(supplier.name);
    setIsOpen(false);
    onChange(supplier);
  };

  const handleClear = () => {
    setSelectedSupplier(null);
    setSearchTerm('');
    setIsOpen(false);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedSupplier && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Загрузка...
            </div>
          ) : filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => handleSelectSupplier(supplier)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center space-x-3"
              >
                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {supplier.name}
                  </div>
                  {supplier.contact_person && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {supplier.contact_person}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Поставщики не найдены
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Введите минимум 2 символа для поиска
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierAutocomplete;







