import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ordersAPI, customersAPI } from '../../services/api';
import { useQuery } from 'react-query';
import LoadingSpinner from '../UI/LoadingSpinner';

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([
    { name: '', description: '', quantity: 1, unit_price: 0 }
  ]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      customer_id: '',
      status: 'new',
      priority: 'normal',
      delivery_date: '',
      notes: ''
    }
  });

  const { data: customersData } = useQuery('customers-list', () => 
    customersAPI.getAll({ limit: 100 })
  );

  const customers = customersData?.data?.customers || [];

  const addOrderItem = () => {
    setOrderItems([...orderItems, { name: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    
    // Пересчитываем total_price
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const onSubmit = async (data) => {
    // Валидация позиций заказа
    const validItems = orderItems.filter(item => item.name.trim() && item.quantity > 0 && item.unit_price > 0);
    
    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию заказа');
      return;
    }

    setLoading(true);
    
    try {
      const orderData = {
        ...data,
        items: validItems
      };

      await ordersAPI.create(orderData);
      toast.success('Заказ успешно создан');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Создать новый заказ</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Клиент *
              </label>
              <select
                {...register('customer_id', { required: 'Выберите клиента' })}
                className="select"
              >
                <option value="">Выберите клиента</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="text-red-600 text-sm mt-1">{errors.customer_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select {...register('priority')} className="select">
                <option value="low">Низкий</option>
                <option value="normal">Обычный</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочно</option>
              </select>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select {...register('status')} className="select">
                <option value="new">Новый</option>
                <option value="confirmed">Подтвержден</option>
              </select>
            </div>
          </div>

          {/* Позиции заказа */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Позиции заказа</h3>
              <button
                type="button"
                onClick={addOrderItem}
                className="btn-outline btn-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить позицию
              </button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Наименование *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                      className="input"
                      placeholder="Название изделия"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена за единицу *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="input"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      disabled={orderItems.length === 1}
                      className="btn-danger btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                      className="textarea"
                      rows="2"
                      placeholder="Дополнительные детали"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-end">
                    <div className="text-sm text-gray-600">
                      Итого: <span className="font-medium text-gray-900">
                        {(item.quantity * item.unit_price).toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-sofany-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Общая сумма заказа:</span>
                <span className="text-xl font-bold text-sofany-600">
                  {calculateTotal().toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Примечания */}
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

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline btn-md"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-md"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Создание...</span>
                </div>
              ) : (
                'Создать заказ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;








