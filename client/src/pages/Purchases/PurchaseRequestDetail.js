import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  ShoppingCart,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const PurchaseRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Загрузка заявки на закупку
  const loadRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/purchase/requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequest(data);
        setItems(data.items || []);
      } else {
        throw new Error('Заявка не найдена');
      }
    } catch (error) {
      console.error('Ошибка загрузки заявки:', error);
      toast.error('Ошибка загрузки заявки на закупку');
      navigate('/purchases/requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  // Обновление статуса заявки
  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/purchase/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setRequest(prev => ({ ...prev, status: newStatus }));
        toast.success(`Статус заявки изменен на "${getStatusText(newStatus)}"`);
      } else {
        throw new Error('Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast.error('Ошибка обновления статуса заявки');
    } finally {
      setUpdating(false);
    }
  };

  // Получение иконки статуса
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-gray-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Получение текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Утверждена';
      case 'rejected': return 'Отклонена';
      case 'completed': return 'Выполнена';
      case 'cancelled': return 'Отменена';
      default: return 'Неизвестно';
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Получение текста приоритета
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'normal': return 'Обычный';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочный';
      default: return 'Неизвестно';
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Загрузка заявки на закупку...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Заявка не найдена</h3>
          <p className="mt-1 text-sm text-gray-500">Заявка с указанным ID не существует</p>
          <button
            onClick={() => navigate('/purchases/requests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/purchases/requests')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Заявка {request.request_number}
              </h1>
              <p className="text-gray-600 mt-1">{request.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/purchases/requests/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Редактировать
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Статус и приоритет */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Статус заявки</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {getStatusText(request.status)}
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                    {getPriorityText(request.priority)}
                  </span>
                </div>
              </div>

              {/* Кнопки изменения статуса */}
              {request.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatus('approved')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Утвердить
                  </button>
                  <button
                    onClick={() => updateStatus('rejected')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Отклонить
                  </button>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Отметить выполненной
                  </button>
                  <button
                    onClick={() => updateStatus('cancelled')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Отменить
                  </button>
                </div>
              )}
            </div>

            {/* Описание */}
            {request.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Описание</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
              </div>
            )}

            {/* Позиции заявки */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Позиции заявки</h2>
                <span className="text-sm text-gray-500">{items.length} позиций</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Материал
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Количество
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Поставщик
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.material_name}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-500">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.required_quantity} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.estimated_price ? `${parseFloat(item.estimated_price).toLocaleString()} ₽` : 'Не указана'}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {item.total_price ? `${parseFloat(item.total_price).toLocaleString()} ₽` : 'Не указана'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.supplier_name || 'Не указан'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Общая информация */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Общая информация</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Общая сумма</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {request.total_amount ? `${parseFloat(request.total_amount).toLocaleString()} ₽` : 'Не указана'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Количество позиций</div>
                    <div className="text-lg font-semibold text-gray-900">{items.length}</div>
                  </div>
                </div>

                {request.order_id && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Связанный заказ</div>
                      <div className="text-lg font-semibold text-gray-900">#{request.order_id}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Дата создания</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>

                {request.approved_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Дата утверждения</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(request.approved_at)}
                      </div>
                    </div>
                  </div>
                )}

                {request.completed_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Дата выполнения</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(request.completed_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Примечания */}
            {request.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Примечания</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestDetail;
