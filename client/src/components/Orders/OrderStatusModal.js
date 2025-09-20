import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

const OrderStatusModal = ({ order, onClose, onUpdate, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      status: order.status,
      priority: order.priority,
      delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
      paid_amount: order.paid_amount || 0,
      notes: order.notes || ''
    }
  });

  const onSubmit = (data) => {
    onUpdate(data);
  };

  const statusOptions = [
    { value: 'new', label: 'Новый' },
    { value: 'confirmed', label: 'Подтвержден' },
    { value: 'in_production', label: 'В производстве' },
    { value: 'ready', label: 'Готов' },
    { value: 'shipped', label: 'Отправлен' },
    { value: 'delivered', label: 'Доставлен' },
    { value: 'cancelled', label: 'Отменен' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Низкий' },
    { value: 'normal', label: 'Обычный' },
    { value: 'high', label: 'Высокий' },
    { value: 'urgent', label: 'Срочно' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Изменить статус заказа {order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус *
              </label>
              <select
                {...register('status', { required: 'Выберите статус' })}
                className="select"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select {...register('priority')} className="select">
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата доставки
              </label>
              <input
                type="date"
                {...register('delivery_date')}
                className="input"
              />
            </div>

            {/* Paid amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Оплаченная сумма (₽)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('paid_amount', { 
                  min: { value: 0, message: 'Сумма не может быть отрицательной' },
                  max: { value: order.total_amount, message: 'Сумма не может превышать общую стоимость заказа' }
                })}
                className="input"
              />
              {errors.paid_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.paid_amount.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Общая сумма заказа: {order.total_amount?.toLocaleString()} ₽
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              {...register('notes')}
              className="textarea"
              rows="3"
              placeholder="Дополнительная информация о заказе"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline btn-md"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-md"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusModal;



























