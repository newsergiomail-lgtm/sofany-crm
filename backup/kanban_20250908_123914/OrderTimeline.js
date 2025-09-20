import React from 'react';
import { Clock, CheckCircle, AlertCircle, Package, User, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const OrderTimeline = ({ statusHistory, operations }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_production':
        return <Package className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Новый заказ',
      'confirmed': 'Заказ подтвержден',
      'in_production': 'В производстве',
      'ready': 'Готов к отгрузке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Заказ отменен'
    };
    return statusMap[status] || status;
  };

  const getOperationIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'purchase_and_produce':
        return <Settings className="h-4 w-4 text-purple-500" />;
      case 'produce':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'cancel':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationText = (type) => {
    const typeMap = {
      'purchase': 'Закупка материалов',
      'purchase_and_produce': 'Закупка и производство',
      'produce': 'Производство',
      'cancel': 'Отмена заказа'
    };
    return typeMap[type] || type;
  };

  const getOperationStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'in_progress':
        return <Settings className="h-3 w-3 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getOperationStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'in_progress': 'В работе',
      'completed': 'Завершено'
    };
    return statusMap[status] || status;
  };

  // Объединяем историю статусов и операции в один массив для отображения
  const timelineItems = [
    ...statusHistory.map(item => ({
      ...item,
      type: 'status',
      timestamp: item.created_at
    })),
    ...operations.map(operation => ({
      ...operation,
      type: 'operation',
      timestamp: operation.created_at,
      status: operation.status,
      operation_type: operation.operation_type
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">История заказа</h3>
      </div>
      <div className="card-content">
        {timelineItems.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">История пуста</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineItems.map((item, index) => (
              <div key={`${item.type}-${item.id}-${index}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {item.type === 'status' ? getStatusIcon(item.status) : getOperationIcon(item.operation_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      {item.type === 'status' ? (
                        <p className="text-sm font-medium text-gray-900">
                          {getStatusText(item.status)}
                        </p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {getOperationText(item.operation_type)}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getOperationStatusIcon(item.status)}
                            <span className="text-xs text-gray-500">
                              {getOperationStatusText(item.status)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {item.comment && (
                        <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                      )}
                      
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(item.timestamp), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(item.timestamp), 'HH:mm', { locale: ru })}
                      </p>
                    </div>
                  </div>
                  
                  {item.created_by_name && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {item.created_by_name}
                      </span>
                    </div>
                  )}
                  
                  {item.assigned_to_name && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Назначено: {item.assigned_to_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTimeline;












