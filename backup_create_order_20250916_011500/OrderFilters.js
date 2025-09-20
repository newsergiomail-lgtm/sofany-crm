import React from 'react';
import { customersAPI } from '../../services/api';
import { useQuery } from 'react-query';

const OrderFilters = ({ filters, onChange }) => {
  const { data: customersData, isLoading: customersLoading } = useQuery('customers-list', () => 
    customersAPI.getAll({ limit: 100 })
  );

  const customers = customersData?.data?.customers || [];

  const handleStatusFilter = (status) => {
    onChange({ status });
  };

  const handlePriorityFilter = (priority) => {
    onChange({ priority });
  };

  const handleCustomerFilter = (customer_id) => {
    onChange({ customer_id });
  };

  const handleSortBy = (sort_by) => {
    onChange({ sort_by });
  };

  const handleSortOrder = (sort_order) => {
    onChange({ sort_order });
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Статус */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Статус
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              color: '#111827',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="">Все статусы</option>
            <option value="new">Новый</option>
            <option value="confirmed">Подтвержден</option>
            <option value="in_production">В производстве</option>
            <option value="ready">Готов</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>

        {/* Приоритет */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Приоритет
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handlePriorityFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              color: '#111827',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="">Все приоритеты</option>
            <option value="urgent">Срочно</option>
            <option value="high">Высокий</option>
            <option value="normal">Обычный</option>
            <option value="low">Низкий</option>
          </select>
        </div>

        {/* Клиент */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Клиент
          </label>
          <select
            value={filters.customer_id || ''}
            onChange={(e) => handleCustomerFilter(e.target.value)}
            disabled={customersLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: customersLoading ? '#f9fafb' : 'white',
              color: customersLoading ? '#9ca3af' : '#111827',
              fontSize: '0.875rem',
              cursor: customersLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{customersLoading ? 'Загрузка...' : 'Все клиенты'}</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Сортировка */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Сортировка
          </label>
          <select
            value={filters.sort_by || 'created_at'}
            onChange={(e) => handleSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              color: '#111827',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="created_at">По дате создания</option>
            <option value="order_number">По номеру заказа</option>
            <option value="total_amount">По сумме</option>
            <option value="delivery_date">По дате доставки</option>
          </select>
        </div>

        {/* Порядок сортировки */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Порядок
          </label>
          <select
            value={filters.sort_order || 'desc'}
            onChange={(e) => handleSortOrder(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              color: '#111827',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;