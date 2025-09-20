import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

const FinancialAnalytics = ({ 
  items = [], 
  totalAmount = 0, 
  onMarkupChange 
}) => {
  const [markupPercentage, setMarkupPercentage] = useState(37.5);
  
  // Расчет себестоимости из позиций заказа
  const costValue = items.reduce((sum, item) => {
    // Используем реальную себестоимость из позиции, если есть
    // Иначе рассчитываем как 60% от цены позиции
    const itemCost = item.costPrice || (item.unitPrice || 0) * 0.6;
    const totalItemCost = itemCost * (item.quantity || 0);
    return sum + totalItemCost;
  }, 0);
  
  // Цена продажи - это общая сумма заказа
  const salePrice = totalAmount;
  
  // Расчеты
  const profit = salePrice - costValue;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
  
  // Обновляем цену продажи при изменении наценки
  const handleMarkupChange = (newMarkup) => {
    setMarkupPercentage(newMarkup);
    if (costValue > 0) {
      const newSalePrice = costValue * (1 + newMarkup / 100);
      if (onMarkupChange) {
        onMarkupChange(newSalePrice, newMarkup);
      }
    }
  };

  // Форматирование валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', { 
      maximumFractionDigits: 0 
    }).format(value) + ' ₽';
  };

  // Форматирование процентов
  const formatPercentage = (value) => {
    if (isNaN(value) || !isFinite(value)) return '0%';
    return value.toFixed(1) + '%';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Финансовая аналитика
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Расчеты и маржинальность
          </p>
        </div>
      </div>

      {/* Карточки с метриками */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Себестоимость */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            Себестоимость
          </h3>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(costValue)}
          </div>
        </div>

        {/* Цена продажи */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            Цена продажи
          </h3>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(salePrice)}
          </div>
        </div>

        {/* Прибыль */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            Прибыль
          </h3>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(profit)}
          </div>
        </div>

        {/* Маржа */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
            Маржа
          </h3>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatPercentage(margin)}
          </div>
        </div>
      </div>

      {/* Ползунок наценки */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            УРОВЕНЬ НАЦЕНКИ
          </label>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {markupPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="200"
            step="0.1"
            value={markupPercentage}
            onChange={(e) => handleMarkupChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${markupPercentage}%, #e5e7eb ${markupPercentage}%, #e5e7eb 100%)`
            }}
          />
          
          {/* Метки на ползунке */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0%</span>
            <span>200%</span>
          </div>
        </div>
      </div>

      {/* Информация о расчетах */}
      {items.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 Расчеты основаны на {items.length} позициях заказа. 
            Себестоимость рассчитывается как 60% от цены позиции.
          </p>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #14b8a6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #14b8a6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default FinancialAnalytics;













