import React from 'react';
import { PackageCheck } from 'lucide-react';

const STAGES = [
  'КБ', 
  'Столярный цех', 
  'Формовка', 
  'Швейный цех', 
  'Обивка', 
  'Сборка и упаковка', 
  'Отгружен'
];

const getStatusBadge = (status) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
  switch (status) {
    case 'КБ':
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    case 'Столярный цех':
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    case 'Формовка':
      return `${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200`;
    case 'Швейный цех':
      return `${baseClasses} bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200`;
    case 'Обивка':
      return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
    case 'Сборка и упаковка':
      return `${baseClasses} bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    case 'Отгружен':
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100`;
  }
};

const ProductionTable = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <PackageCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold">Нет заказов в производстве</h3>
        <p>На данный момент здесь нет активных заказов.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="table-head">Номер заказа</th>
            <th className="table-head">Изделие</th>
            <th className="table-head">Клиент</th>
            <th className="table-head text-center">Этап</th>
            <th className="table-head">Прогресс</th>
            <th className="table-head text-right">Дедлайн</th>
            <th className="table-head text-right">Сумма</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map(order => {
            const currentStage = order.production_stage || 'КБ';
            const stageIndex = STAGES.indexOf(currentStage);
            const progress = stageIndex !== -1 ? ((stageIndex + 1) / STAGES.length) * 100 : 0;
            const isOverdue = order.delivery_date && new Date(order.delivery_date) < new Date() && order.production_stage !== 'Отгружен';

            return (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="table-cell font-medium text-sofany-600 dark:text-sofany-400">{order.order_number}</td>
                <td className="table-cell">{order.product_name || 'Не указано'}</td>
                <td className="table-cell">{order.customer_name || 'Не указан'}</td>
                <td className="table-cell text-center">
                  <span className={getStatusBadge(order.production_stage)}>
                    {order.production_stage || 'КБ'}
                  </span>
                </td>
                <td className="table-cell" style={{ minWidth: '150px' }}>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div 
                      className="bg-sofany-500 h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-500">
                    Этап {stageIndex + 1} из {STAGES.length}
                  </div>
                  <div className="text-xs text-center text-gray-400">
                    {Math.round(progress)}% завершено
                  </div>
                </td>
                <td className={`table-cell text-right ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                  {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}
                </td>
                <td className="table-cell text-right font-semibold">{(order.total_amount || 0).toLocaleString('ru-RU')} ₽</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductionTable;
