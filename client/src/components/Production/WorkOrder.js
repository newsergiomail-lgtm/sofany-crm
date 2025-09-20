import React from 'react';
import QRCodeImage from '../QRCodeImage';

const WorkOrder = ({ order, materials = [] }) => {
  if (!order) {
    return <div className="text-center py-8 text-gray-500">Заказ не найден.</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'in_production': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div id="work-order-content" className="work-order-document bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto my-8 print:shadow-none print:p-0 print:my-0">
      <div className="flex justify-between items-start mb-8 border-b pb-4 print:mb-4 print:pb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Заказ-наряд №{order.order_number}</h1>
          <p className="text-gray-600">Дата создания: {formatDate(order.created_at)}</p>
          <p className="text-gray-600">Срок сдачи: {formatDate(order.delivery_date)}</p>
        </div>
        {order.qr_code_id && (
          <div className="flex-shrink-0">
            <QRCodeImage 
              qrCodeId={order.qr_code_id}
              className="border rounded"
              style={{width: '160px', height: '160px'}}
              alt={`QR-код для заказа ${order.order_number}`}
            />
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Информация о заказе</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p><strong>Изделие:</strong> {order.product_name}</p>
            <p><strong>Статус:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span></p>
            <p><strong>Приоритет:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>{order.priority}</span></p>
          </div>
          <div>
            <p><strong>Текущий этап:</strong> {order.current_stage_name || 'Неизвестно'}</p>
            <p><strong>Статус производства:</strong> {order.production_status || 'Неизвестно'}</p>
            <p><strong>Создан:</strong> {order.created_by_name || 'Неизвестно'}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Информация о клиенте</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p><strong>Имя:</strong> {order.customer_name}</p>
            <p><strong>Компания:</strong> {order.customer_company || 'Частное лицо'}</p>
          </div>
          <div>
            <p><strong>Телефон:</strong> {order.customer_phone}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
          </div>
        </div>
      </div>

      {/* Product Description */}
      {order.detailed_description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Описание изделия</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{order.detailed_description}</p>
        </div>
      )}

      {/* Material Specification */}
      {materials && materials.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Спецификация материалов</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Наименование
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ед. изм.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Описание
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materials.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.unit || 'шт.'} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Info */}
      {(order.delivery_address || order.floor || order.has_elevator) && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Доставка</h2>
          <div className="text-gray-700">
            {order.delivery_address && <p><strong>Адрес:</strong> {order.delivery_address}</p>}
            {order.floor && <p><strong>Этаж:</strong> {order.floor}</p>}
            {order.has_elevator !== null && <p><strong>Наличие лифта:</strong> {order.has_elevator ? 'Да' : 'Нет'}</p>}
            {order.delivery_notes && <p><strong>Примечания по доставке:</strong> {order.delivery_notes}</p>}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Примечания</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t print:mt-4 print:pt-2">
        Сгенерировано SofanyCRM
      </div>
    </div>
  );
};

export default WorkOrder;