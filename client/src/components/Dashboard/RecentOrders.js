import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const RecentOrders = ({ orders, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_production':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'urgent': 'Срочно',
      'high': 'Высокий',
      'normal': 'Обычный',
      'low': 'Низкий'
    };
    return priorityMap[priority] || priority;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Последние заказы</h3>
        </div>
        <div className="card-content">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Последние заказы</h3>
          <Link 
            to="/orders" 
            className="text-sm text-sofany-600 hover:text-sofany-700 font-medium"
          >
            Все заказы
          </Link>
        </div>
      </div>
      <div className="card-content">
        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart className="empty-state-icon" />
            <h3 className="empty-state-title">Нет заказов</h3>
            <p className="empty-state-description">
              Заказы появятся здесь после их создания
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/orders/${order.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-sofany-600"
                      >
                        {order.order_number}
                      </Link>
                      <span className={`badge ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.customer_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {order.total_amount?.toLocaleString()} ₽
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;








