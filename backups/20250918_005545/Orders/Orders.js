import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import OrderTable from '../../components/Orders/OrderTable';
import OrderFilters from '../../components/Orders/OrderFilters';
import OrderStatusGuide from '../../components/Orders/OrderStatusGuide';
import OrdersStatistics from '../../components/Orders/OrdersStatistics';

const Orders = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    priority: '',
    customer_id: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    ['orders', filters],
    () => ordersAPI.getAll(filters),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 секунд
    }
  );

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Сбрасываем страницу при изменении фильтров
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки заказов</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary btn-md"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Заказы</h1>
          <p className="page-subtitle">
            Управление заказами и их статусами
          </p>
        </div>
        <Link
          to="/orders/create"
          className="btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Новый заказ
        </Link>
      </div>

      {/* Statistics */}
      <OrdersStatistics orders={data?.data?.orders || []} />

      {/* Status Guide */}
      <OrderStatusGuide />

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по номеру заказа или клиенту..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline btn-md"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <OrderFilters
                filters={filters}
                onChange={handleFilterChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="card">
        <div className="card-content p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <OrderTable
              orders={data?.data?.orders || []}
              pagination={data?.data?.pagination}
              onPageChange={handlePageChange}
              onRefresh={refetch}
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default Orders;












