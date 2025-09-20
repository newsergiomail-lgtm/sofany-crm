import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Settings, Download, Filter } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ProductionTable from '../../components/Production/ProductionTable';
import ProductionStats from '../../components/Production/ProductionStats';
import ShipmentCalendar from '../../components/Production/ShipmentCalendar';
import * as XLSX from 'xlsx';

const ProductionPage = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  const { data, isLoading, error } = useQuery(
    ['productionOrders', filters], 
    () => ordersAPI.getProductionOrders(filters),
    { 
      refetchOnWindowFocus: false,
      staleTime: 30000 // 30 секунд
    }
  );

  // Правильно извлекаем заказы из ответа API
  const orders = data?.data?.orders || [];
  
  // Простая отладка
  console.log('Production: orders count =', orders.length, 'loading =', isLoading, 'error =', error);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Производство');
    XLSX.writeFile(workbook, 'production_report.xlsx');
  };

  const statuses = [
    'all',
    'КБ',
    'Столярный цех',
    'Формовка',
    'Швейный цех',
    'Обивка',
    'Сборка и упаковка',
    'Отгружен'
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center">
            <Settings className="h-8 w-8 mr-3 text-sofany-500" />
            Производство
          </h1>
          <p className="page-subtitle">
            Обзор всех производственных процессов и статусов заказов
          </p>
        </div>
      </div>

      <ProductionStats orders={orders} />

      <ShipmentCalendar orders={orders} />

      <div className="card border border-teal-200 dark:border-teal-700">
        <div className="card-content">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Левая часть - фильтры и поиск */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Фильтр по статусу */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-5 min-w-[180px] mt-5">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-transparent border-0 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none cursor-pointer w-full"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'Все статусы' : status}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Поле поиска с предиктивным вводом */}
              <div className="relative flex-1 min-w-0 mt-5">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Поиск по заказам, клиентам, продуктам..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  list="search-suggestions"
                />
                {/* Предиктивные подсказки */}
                <datalist id="search-suggestions">
                  {orders.slice(0, 10).map((order, index) => (
                    <option key={index} value={order.customer_name || order.product_name || order.order_number} />
                  ))}
                </datalist>
              </div>
            </div>
            
            {/* Правая часть - кнопка экспорта */}
            <div className="flex-shrink-0 mt-5">
              <button 
                onClick={handleExport} 
                className="btn-glass btn-glass-primary btn-glass-md inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">
              Ошибка загрузки данных.
            </div>
          ) : (
            <ProductionTable orders={orders} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;