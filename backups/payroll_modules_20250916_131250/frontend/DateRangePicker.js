import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, X } from 'lucide-react';
import { ru } from 'date-fns/locale';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onApply, 
  onClear,
  placeholder = "Выберите период"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    onApply();
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const handleStartDateChange = (date) => {
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      onStartDateChange(date);
    }
  };

  const handleEndDateChange = (date) => {
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      onEndDateChange(date);
    }
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDisplayText = () => {
    if (startDate && endDate && startDate instanceof Date && endDate instanceof Date && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate && startDate instanceof Date && !isNaN(startDate.getTime())) {
      return `с ${formatDate(startDate)}`;
    } else if (endDate && endDate instanceof Date && !isNaN(endDate.getTime())) {
      return `до ${formatDate(endDate)}`;
    }
    return placeholder;
  };

  return (
    <div className="relative">
      {/* Кнопка открытия календаря */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-between"
      >
        <span className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {getDisplayText()}
        </span>
        {isOpen ? (
          <X className="h-4 w-4 text-gray-400" />
        ) : (
          <Calendar className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Модальное окно календаря */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[900px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Выбор периода
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Календарь */}
          <div className="flex justify-center">
            <DatePicker
              selected={startDate}
              onChange={(dates) => {
                if (dates && Array.isArray(dates)) {
                  const [start, end] = dates;
                  if (start && start instanceof Date) {
                    handleStartDateChange(start);
                  }
                  if (end && end instanceof Date) {
                    handleEndDateChange(end);
                  }
                } else if (dates && dates instanceof Date) {
                  handleStartDateChange(dates);
                }
              }}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline
              monthsShown={3}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              locale={ru}
              dateFormat="dd.MM.yyyy"
              className="react-datepicker-custom"
              isClearable
              placeholderText="Выберите дату"
              calendarStartDay={1}
              fixedHeight
            />
          </div>

          {/* Поля ввода дат */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата от
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => handleStartDateChange(date)}
                dateFormat="dd.MM.yyyy"
                placeholderText="Выберите дату"
                locale={ru}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                isClearable
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата до
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date) => handleEndDateChange(date)}
                dateFormat="dd.MM.yyyy"
                placeholderText="Выберите дату"
                locale={ru}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                isClearable
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Очистить
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
