import React from 'react';
import { customersAPI } from '../../services/api';
import { useQuery } from 'react-query';

const OrderFilters = ({ filters, onChange }) => {
  const { data: customersData } = useQuery('customers-list', () => 
    customersAPI.getAll({ limit: 100 })
  );

  const customers = customersData?.data?.customers || [];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'new', label: 'Новый' },
    { value: 'confirmed', label: 'Подтвержден' },
    { value: 'in_production', label: 'В производстве' },
    { value: 'ready', label: 'Готов' },
    { value: 'shipped', label: 'Отправлен' },
    { value: 'delivered', label: 'Доставлен' },
    { value: 'cancelled', label: 'Отменен' }
  ];

  const priorityOptions = [
    { value: '', label: 'Все приоритеты' },
    { value: 'urgent', label: 'Срочно' },
    { value: 'high', label: 'Высокий' },
    { value: 'normal', label: 'Обычный' },
    { value: 'low', label: 'Низкий' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'По дате создания' },
    { value: 'order_number', label: 'По номеру заказа' },
    { value: 'total_amount', label: 'По сумме' },
    { value: 'delivery_date', label: 'По дате доставки' }
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'По убыванию' },
    { value: 'asc', label: 'По возрастанию' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Статус
        </label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="select"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Приоритет
        </label>
        <select
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
          className="select"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Customer filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Клиент
        </label>
        <select
          value={filters.customer_id}
          onChange={(e) => onChange({ customer_id: e.target.value })}
          className="select"
        >
          <option value="">Все клиенты</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort by */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Сортировка
        </label>
        <div className="flex space-x-2">
          <select
            value={filters.sort_by}
            onChange={(e) => onChange({ sort_by: e.target.value })}
            className="select flex-1"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort_order}
            onChange={(e) => onChange({ sort_order: e.target.value })}
            className="select w-20"
          >
            {sortOrderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;












