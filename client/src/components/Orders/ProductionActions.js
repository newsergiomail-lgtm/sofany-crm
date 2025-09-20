import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { 
  Package, 
  Settings, 
  ShoppingCart, 
  X, 
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productionAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProductionActions = ({ order, operations, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const createOperationMutation = useMutation(
    (data) => productionAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Операция создана');
        onRefresh();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка создания операции');
      }
    }
  );

  const completeOperationMutation = useMutation(
    ({ operationId, notes }) => productionAPI.complete(operationId, { notes }),
    {
      onSuccess: () => {
        toast.success('Операция завершена');
        onRefresh();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка завершения операции');
      }
    }
  );

  const handleOperation = async (operationType) => {
    setLoading(true);
    try {
      await createOperationMutation.mutateAsync({
        order_id: order.id,
        operation_type: operationType,
        notes: `Операция "${getOperationText(operationType)}" для заказа ${order.order_number}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOperation = async (operationId) => {
    if (window.confirm('Завершить эту операцию?')) {
      await completeOperationMutation.mutateAsync({ operationId });
    }
  };

  const getOperationText = (type) => {
    const typeMap = {
      'purchase': 'Закупить',
      'purchase_and_produce': 'Закупить и в производство',
      'produce': 'В производство',
      'cancel': 'Отменить'
    };
    return typeMap[type] || type;
  };

  const getOperationIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4" />;
      case 'purchase_and_produce':
        return <Package className="h-4 w-4" />;
      case 'produce':
        return <Settings className="h-4 w-4" />;
      case 'cancel':
        return <X className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getOperationStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Определяем доступные операции в зависимости от статуса заказа
  const getAvailableOperations = () => {
    const validTransitions = {
      'new': ['purchase', 'purchase_and_produce', 'produce', 'cancel'],
      'confirmed': ['purchase', 'purchase_and_produce', 'produce', 'cancel'],
      'in_production': ['cancel'],
      'ready': [],
      'shipped': [],
      'delivered': [],
      'cancelled': []
    };

    return validTransitions[order.status] || [];
  };

  const availableOperations = getAvailableOperations();
  const activeOperations = operations.filter(op => op.status === 'in_progress' || op.status === 'pending');

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Производственные операции
        </h3>
      </div>
      <div className="card-content">
        {/* Available actions */}
        {availableOperations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Доступные действия:</h4>
            <div className="flex flex-wrap gap-2">
              {availableOperations.map((operationType) => (
                <button
                  key={operationType}
                  onClick={() => handleOperation(operationType)}
                  disabled={loading}
                  className={`btn ${
                    operationType === 'cancel' ? 'btn-danger' : 'btn-primary'
                  } btn-sm`}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      {getOperationIcon(operationType)}
                      <span className="ml-2">{getOperationText(operationType)}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active operations */}
        {activeOperations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Активные операции:</h4>
            <div className="space-y-3">
              {activeOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getOperationStatusIcon(operation.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getOperationText(operation.operation_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {operation.notes}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getStatusColor(operation.status)}`}>
                      {getOperationStatusText(operation.status)}
                    </span>
                    {operation.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteOperation(operation.id)}
                        className="btn-primary btn-sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Завершить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All operations history */}
        {operations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">История операций:</h4>
            <div className="space-y-2">
              {operations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                  <div className="flex items-center space-x-3">
                    {getOperationIcon(operation.operation_type)}
                    <div>
                      <p className="text-sm text-gray-900">
                        {getOperationText(operation.operation_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(operation.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(operation.status)}`}>
                    {getOperationStatusText(operation.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No operations message */}
        {operations.length === 0 && availableOperations.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Нет доступных операций для этого статуса заказа</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionActions;



























