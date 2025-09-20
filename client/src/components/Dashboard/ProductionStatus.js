import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ProductionStatus = ({ operations, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'in_progress': 'В работе',
      'completed': 'Завершено'
    };
    return statusMap[status] || status;
  };

  const getOperationText = (type) => {
    const typeMap = {
      'purchase': 'Закупка',
      'purchase_and_produce': 'Закупка и производство',
      'produce': 'Производство',
      'cancel': 'Отмена'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Производство</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Производство</h3>
          <Link 
            to="/production" 
            className="text-sm text-sofany-600 hover:text-sofany-700 font-medium"
          >
            Все операции
          </Link>
        </div>
      </div>
      <div className="card-content">
        {operations.length === 0 ? (
          <div className="empty-state">
            <Settings className="empty-state-icon" />
            <h3 className="empty-state-title">Нет операций</h3>
            <p className="empty-state-description">
              Производственные операции появятся здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {operations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(operation.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/orders/${operation.order_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-sofany-600"
                      >
                        {operation.order_number}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-600">
                      {getOperationText(operation.operation_type)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {getStatusText(operation.status)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(operation.created_at), 'dd.MM.yyyy', { locale: ru })}
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

export default ProductionStatus;




























