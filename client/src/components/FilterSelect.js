import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Building2, Users } from 'lucide-react';

const FilterSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Выберите...", 
  searchPlaceholder = "Поиск...",
  groupBy = null,
  icon: Icon = null,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Фильтрация опций
  useEffect(() => {
    let filtered = options;
    
    if (searchTerm) {
      filtered = options.filter(option => 
        option && option.name && option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option && option.department_name && option.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (option && option.position_name && option.position_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredOptions(filtered);
  }, [options, searchTerm]);

  // Группировка опций
  const groupedOptions = groupBy ? 
    filteredOptions.reduce((groups, option) => {
      const group = option[groupBy] || 'Без группы';
      if (!groups[group]) groups[group] = [];
      groups[group].push(option);
      return groups;
    }, {}) : 
    { 'Все': filteredOptions };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фокус на поиск при открытии
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Кнопка выбора */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between text-gray-900 dark:text-gray-100"
      >
        <div className="flex items-center min-w-0 flex-1">
          {Icon && <Icon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />}
          <span className="truncate">
            {selectedOption ? (
              <div className="flex items-center">
                <span className="font-medium">{selectedOption.name}</span>
                {selectedOption.department_name && (
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {selectedOption.department_name}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </span>
        </div>
        <div className="flex items-center ml-2">
          {selectedOption && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Поиск */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Список опций */}
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {/* Заголовок группы */}
                {groupBy && groupName !== 'Все' && (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 sticky top-0">
                    <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      <Building2 className="w-3 h-3 mr-1" />
                      {groupName}
                    </div>
                  </div>
                )}
                
                {/* Опции группы */}
                {groupOptions.length > 0 ? (
                  groupOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          {Icon && <Icon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {option && option.name ? option.name : 'Без названия'}
                            </div>
                            {option && (option.department_name || option.position_name) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {option.department_name && (
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded mr-2">
                                    {option.department_name}
                                  </span>
                                )}
                                {option.position_name && (
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                    {option.position_name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {option && option.piece_rate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {option.piece_rate}₽/шт
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Ничего не найдено
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSelect;





