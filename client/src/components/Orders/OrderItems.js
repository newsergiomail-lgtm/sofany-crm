import React from 'react';
import { Package } from 'lucide-react';

const OrderItems = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Позиции заказа
          </h3>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Позиции не найдены</p>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Позиции заказа ({items.length})
        </h3>
      </div>
      <div className="card-content p-0">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head">Наименование</th>
                <th className="table-head">Описание</th>
                <th className="table-head">Количество</th>
                <th className="table-head">Цена за единицу</th>
                <th className="table-head">Сумма</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {items.map((item, index) => (
                <tr key={index} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-600">
                      {item.description || '—'}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {item.unit_price?.toLocaleString()} ₽
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">
                      {item.total_price?.toLocaleString()} ₽
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Total */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900">
            Итого: {totalAmount.toLocaleString()} ₽
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItems;












