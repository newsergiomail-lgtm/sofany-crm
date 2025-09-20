import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ordersAPI, customersAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const OrderEditPanel = ({ orderId, orderData, onClose }) => {
  console.log('OrderEditPanel rendered with:', { orderId, orderData });
  
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  console.log('OrderEditPanel: Hooks initialized');

  // Обработка данных, переданных напрямую из канбана
  useEffect(() => {
    console.log('OrderEditPanel: useEffect called');
    if (orderData) {
      console.log('OrderEditPanel: Setting formData');
      setFormData({
        order_number: orderData.order_number || '',
        customer_name: orderData.client || '',
        customer_phone: orderData.phone || '',
        customer_email: orderData.email || '',
        customer_company: orderData.company || '',
        description: orderData.product_name || orderData.description || '',
        total_amount: orderData.price || 0,
        paid_amount: orderData.prepayment || 0,
        status: orderData.status || 'draft',
        priority: orderData.priority || 'normal',
        deadline: orderData.deadline || '',
        notes: orderData.notes || '',
        materials_cost: orderData.materials_cost || 0,
        labor_cost: orderData.labor_cost || 0,
        other_costs: orderData.other_costs || 0,
        profit_margin: orderData.profit_margin || 0,
        // Delivery fields
        delivery_address: orderData.delivery_address || '',
        floor: orderData.floor || '',
        has_elevator: orderData.has_elevator || false,
        delivery_notes: orderData.delivery_notes || '',
      });
    }
  }, [orderData]);

  // Загрузка данных заказа (только если не переданы данные напрямую)
  console.log('OrderEditPanel: About to call useQuery');
  const { data: order, isLoading, error } = useQuery(
    ['order', orderId],
    () => ordersAPI.getById(orderId),
    {
      enabled: !!orderId && !orderData,
      onSuccess: (data) => {
        console.log('OrderEditPanel: useQuery onSuccess');
        setFormData({
          order_number: data.order_number || '',
          customer_name: data.customer_name || '',
          customer_phone: data.customer_phone || '',
          customer_email: data.customer_email || '',
          customer_company: data.customer_company || '',
          description: data.project_description || data.description || '',
          total_amount: data.total_amount || 0,
          paid_amount: data.paid_amount || 0,
          status: data.status || 'draft',
          priority: data.priority || 'normal',
          deadline: data.deadline || '',
          notes: data.notes || '',
          materials_cost: data.materials_cost || 0,
          labor_cost: data.labor_cost || 0,
          other_costs: data.other_costs || 0,
          profit_margin: data.profit_margin || 0
        });
      }
    }
  );

  // Мутация для обновления заказа
  console.log('OrderEditPanel: About to call useMutation');
  const updateOrderMutation = useMutation(
    (data) => ordersAPI.update(orderId, data),
    {
      onSuccess: () => {
        console.log('OrderEditPanel: useMutation onSuccess');
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries(['kanban']);
        setIsEditing(false);
      }
    }
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateOrderMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (order) {
        setFormData({
          order_number: order.order_number || '',
          customer_name: order.customer_name || '',
          customer_phone: order.customer_phone || '',
          customer_email: order.customer_email || '',
          customer_company: order.customer_company || '',
          description: order.project_description || order.description || '',
          total_amount: order.total_amount || 0,
          paid_amount: order.paid_amount || 0,
          status: order.status || 'draft',
          priority: order.priority || 'normal',
        deadline: order.deadline || '',
        notes: order.notes || '',
        materials_cost: order.materials_cost || 0,
        labor_cost: order.labor_cost || 0,
        other_costs: order.other_costs || 0,
        profit_margin: order.profit_margin || 0
      });
    }
    setIsEditing(false);
  };

  console.log('OrderEditPanel: About to check isLoading', { isLoading, error, orderData });
  if (isLoading) {
    console.log('OrderEditPanel: isLoading is true');
    return (
      <div className="order-edit-panel">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    console.log('OrderEditPanel: error is true', error);
    return (
      <div className="order-edit-panel">
        <div className="text-center p-4">
          <p className="text-red-600 mb-4">Ошибка загрузки заказа</p>
          <button onClick={onClose} className="btn btn-secondary">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  // Если у нас есть orderData, используем его вместо order из useQuery
  const currentOrder = orderData || order;
  
  if (!currentOrder) {
    console.log('OrderEditPanel: currentOrder is null/undefined', { order, orderData, currentOrder });
    return null;
  }

  const totalCost = (formData.materials_cost || 0) + (formData.labor_cost || 0) + (formData.other_costs || 0);
  const profit = (formData.total_amount || 0) - totalCost;
  const margin = formData.total_amount > 0 ? ((profit / formData.total_amount) * 100).toFixed(1) : 0;

  console.log('OrderEditPanel: About to render main JSX');
  return (
    <div className="order-edit-panel">
      <div className="order-edit-header">
        <h3 className="order-edit-title">
          Заказ #{formData.order_number || orderId}
        </h3>
        <div className="order-edit-actions">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="btn btn-secondary btn-sm"
                disabled={updateOrderMutation.isLoading}
              >
                Отмена
              </button>
              <button 
                onClick={handleSave}
                className="btn btn-primary btn-sm"
                disabled={updateOrderMutation.isLoading}
              >
                {updateOrderMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="btn btn-primary btn-sm"
            >
              Редактировать
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Закрыть
          </button>
        </div>
      </div>

      <div className="order-edit-content">
        <div className="order-edit-grid">
          {/* Основная информация */}
          <div className="order-edit-section">
            <h4 className="order-edit-section-title">Основная информация</h4>
            <div className="order-edit-fields">
              <div className="form-group">
                <label className="form-label">Номер заказа</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.order_number}
                  onChange={(e) => handleInputChange('order_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Статус</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="draft">Черновик</option>
                  <option value="confirmed">Подтвержден</option>
                  <option value="in_production">В производстве</option>
                  <option value="ready">Готов</option>
                  <option value="shipped">Отгружен</option>
                  <option value="completed">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Приоритет</label>
                <select
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="low">Низкий</option>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Дедлайн</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Информация о клиенте */}
          <div className="order-edit-section">
            <h4 className="order-edit-section-title">Клиент</h4>
            <div className="order-edit-fields">
              <div className="form-group">
                <label className="form-label">Имя клиента</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Компания</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customer_company}
                  onChange={(e) => handleInputChange('customer_company', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Информация о доставке */}
          <div className="order-edit-section">
            <h4 className="order-edit-section-title">Доставка</h4>
            <div className="order-edit-fields">
              <div className="form-group">
                <label className="form-label">Адрес доставки</label>
                <div className="form-input form-input-readonly">
                  {(orderData?.delivery_address || order?.delivery_address) || 'Не указано'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Этаж</label>
                <div className="form-input form-input-readonly">
                  {(orderData?.floor || order?.floor) || 'Не указано'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Лифт</label>
                <div className="form-input form-input-readonly">
                  {(orderData?.has_elevator || order?.has_elevator) ? 'Есть' : 'Нет'}
                </div>
              </div>

              {(orderData?.delivery_notes || order?.delivery_notes) && (
                <div className="form-group">
                  <label className="form-label">Примечания к доставке</label>
                  <div className="form-input form-input-readonly">
                    {orderData?.delivery_notes || order?.delivery_notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Финансовая информация */}
          <div className="order-edit-section">
            <h4 className="order-edit-section-title">Финансы</h4>
            <div className="order-edit-fields">
              <div className="form-group">
                <label className="form-label">Стоимость материалов</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.materials_cost}
                  onChange={(e) => handleInputChange('materials_cost', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Стоимость работ</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.labor_cost}
                  onChange={(e) => handleInputChange('labor_cost', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Прочие расходы</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.other_costs}
                  onChange={(e) => handleInputChange('other_costs', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цена продажи</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Предоплата</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.paid_amount}
                  onChange={(e) => handleInputChange('paid_amount', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Себестоимость</label>
                <div className="form-input form-input-readonly">
                  {totalCost.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Прибыль</label>
                <div className={`form-input form-input-readonly ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Маржинальность</label>
                <div className={`form-input form-input-readonly ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margin}%
                </div>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="order-edit-section">
            <h4 className="order-edit-section-title">Дополнительно</h4>
            <div className="order-edit-fields">
              <div className="form-group">
                <label className="form-label">Заметки</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditPanel;
