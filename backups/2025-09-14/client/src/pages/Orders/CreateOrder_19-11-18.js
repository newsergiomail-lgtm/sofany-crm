import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Save,
  Plus,
  X
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateOrder = () => {
  const navigate = useNavigate();

  // Состояния для форм
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    deadline: '',
    priority: 'medium'
  });

  const [deliveryForm, setDeliveryForm] = useState({
    address: '',
    city: '',
    postal_code: '',
    contact_person: '',
    contact_phone: '',
    delivery_date: '',
    notes: ''
  });

  const [financialForm, setFinancialForm] = useState({
    total_amount: 0,
    paid_amount: 0,
    materials_cost: 0,
    labor_cost: 0,
    other_costs: 0,
    profit_margin: 0
  });

  // Состояния для позиций заказа
  const [orderItems, setOrderItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0,
    total: 0
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  // Мутация для создания заказа
  const createOrderMutation = useMutation(ordersAPI.create, {
    onSuccess: (data) => {
      toast.success('Заказ успешно создан!');
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => {
      console.error('Ошибка создания заказа:', error);
      toast.error('Ошибка при создании заказа');
    }
  });

  // Обработчики изменения форм
  const handleClientChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectChange = (field, value) => {
    setProjectForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryChange = (field, value) => {
    setDeliveryForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
  };

  // Функции для работы с позициями (из OrderDetail)
  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.price) {
      alert('Заполните все поля');
      return;
    }

    const newItemData = {
      id: Date.now(),
      name: newItem.name,
      description: '',
      quantity: newItem.quantity,
      price: newItem.price,
      total: newItem.quantity * newItem.price
    };

    setOrderItems([...orderItems, newItemData]);
    
    // Сброс формы
    setNewItem({ name: '', quantity: 1, price: 0, total: 0 });
    setShowNewItemForm(false);
  };

  const handleDeleteItem = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Обработчики изменения полей позиций
  const handleItemChange = (itemId, field, value) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Сохранение заказа
  const handleSave = () => {
    const orderData = {
      // Информация о клиенте
      customer_name: clientForm.name,
      customer_phone: clientForm.phone,
      customer_email: clientForm.email,
      customer_company: clientForm.company,
      
      // Информация о проекте
      project_name: projectForm.name,
      project_description: projectForm.description,
      deadline: projectForm.deadline,
      priority: projectForm.priority,
      
      // Информация о доставке
      delivery_address: deliveryForm.address,
      delivery_city: deliveryForm.city,
      delivery_postal_code: deliveryForm.postal_code,
      delivery_contact_person: deliveryForm.contact_person,
      delivery_contact_phone: deliveryForm.contact_phone,
      delivery_date: deliveryForm.delivery_date,
      delivery_notes: deliveryForm.notes,
      
      // Финансовая информация
      total_amount: financialForm.total_amount,
      paid_amount: financialForm.paid_amount,
      materials_cost: financialForm.materials_cost,
      labor_cost: financialForm.labor_cost,
      other_costs: financialForm.other_costs,
      profit_margin: financialForm.profit_margin,
      
      // Позиции заказа
      items: orderItems,
      
      // Статус по умолчанию
      status: 'new'
    };

    createOrderMutation.mutate(orderData);
  };

  if (createOrderMutation.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="btn-secondary btn-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к заказам
          </button>
          <div>
            <h1 className="page-title">Создание нового заказа</h1>
            <p className="page-subtitle">
              Заполните информацию о заказе
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary btn-md"
          disabled={createOrderMutation.isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          Сохранить заказ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Объединенный блок: Клиент и доставка */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="card-title text-xl">Клиент и доставка</h3>
                  <p className="text-sm text-gray-500 mt-1">Основная информация о заказчике и адресе доставки</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              {/* Секция контактной информации */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-900">Контактная информация</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-2">ФИО клиента *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clientForm.name}
                      onChange={(e) => handleClientChange('name', e.target.value)}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Компания</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clientForm.company}
                      onChange={(e) => handleClientChange('company', e.target.value)}
                      placeholder="Название компании"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Телефон</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={clientForm.phone}
                      onChange={(e) => handleClientChange('phone', e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={clientForm.email}
                      onChange={(e) => handleClientChange('email', e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Секция адреса доставки */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-900">Адрес доставки</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label mb-2">Полный адрес</label>
                    <input
                      type="text"
                      className="form-input"
                      value={deliveryForm.address}
                      onChange={(e) => handleDeliveryChange('address', e.target.value)}
                      placeholder="г. Москва, ул. Примерная, д. 1, кв. 10"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Город</label>
                    <input
                      type="text"
                      className="form-input"
                      value={deliveryForm.city}
                      onChange={(e) => handleDeliveryChange('city', e.target.value)}
                      placeholder="Москва"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Почтовый индекс</label>
                    <input
                      type="text"
                      className="form-input"
                      value={deliveryForm.postal_code}
                      onChange={(e) => handleDeliveryChange('postal_code', e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                </div>
              </div>

              {/* Секция контактов для доставки */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-900">Контакты для доставки</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-2">Контактное лицо</label>
                    <input
                      type="text"
                      className="form-input"
                      value={deliveryForm.contact_person}
                      onChange={(e) => handleDeliveryChange('contact_person', e.target.value)}
                      placeholder="Имя контактного лица"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Контактный телефон</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={deliveryForm.contact_phone}
                      onChange={(e) => handleDeliveryChange('contact_phone', e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Дата доставки</label>
                    <input
                      type="date"
                      className="form-input"
                      value={deliveryForm.delivery_date}
                      onChange={(e) => handleDeliveryChange('delivery_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label mb-2">Примечания</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={deliveryForm.notes}
                      onChange={(e) => handleDeliveryChange('notes', e.target.value)}
                      placeholder="Дополнительные примечания к доставке"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Информация о проекте */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Информация о проекте</h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="form-label mb-2">Название проекта *</label>
              <input
                type="text"
                className="form-input"
                value={projectForm.name}
                onChange={(e) => handleProjectChange('name', e.target.value)}
                placeholder="Название проекта"
              />
            </div>
            <div>
              <label className="form-label mb-2">Описание</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={projectForm.description}
                onChange={(e) => handleProjectChange('description', e.target.value)}
                placeholder="Описание проекта"
              />
            </div>
            <div>
              <label className="form-label mb-2">Срок выполнения</label>
              <input
                type="date"
                className="form-input"
                value={projectForm.deadline}
                onChange={(e) => handleProjectChange('deadline', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label mb-2">Приоритет</label>
              <select
                className="form-select"
                value={projectForm.priority}
                onChange={(e) => handleProjectChange('priority', e.target.value)}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
        </div>

        {/* Позиции заказа */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="card-title">Позиции заказа</h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Наименование</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Кол-во</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Цена</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Сумма</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 w-1/2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg"
                          placeholder="Название товара"
                        />
                      </td>
                      <td className="py-3 px-2 w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                        />
                      </td>
                      <td className="py-3 px-2 w-32">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-2 w-20">
                        <input
                          type="text"
                          value={(item.quantity * item.price).toLocaleString()}
                          readOnly
                          className="w-full px-2 py-2 text-sm border border-transparent bg-gray-50 rounded-lg text-right"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Строка с итоговой суммой */}
                  {orderItems.length > 0 && (
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="py-3 px-2 font-medium text-sm text-gray-900" colSpan="4">
                        Итого: {orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} ₽
                      </td>
                      <td className="py-3 px-2"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Форма добавления новой позиции */}
            {showNewItemForm ? (
              <div className="grid grid-cols-5 gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <input
                    type="text"
                    placeholder="Название товара"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Кол-во"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => {
                      const quantity = parseFloat(e.target.value) || 0;
                      const total = quantity * newItem.price;
                      setNewItem({...newItem, quantity, total});
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Цена"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const total = newItem.quantity * price;
                      setNewItem({...newItem, price, total});
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Сумма"
                    value={newItem.total}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddItem}
                    className="w-full bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewItemForm(true)}
                className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Добавить позицию
              </button>
            )}
          </div>
        </div>

        {/* Финансовая информация */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Финансовая информация</h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="form-label mb-2">Общая сумма</label>
              <input
                type="number"
                className="form-input"
                value={financialForm.total_amount}
                onChange={(e) => handleFinancialChange('total_amount', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label mb-2">Предоплата</label>
              <input
                type="number"
                className="form-input"
                value={financialForm.paid_amount}
                onChange={(e) => handleFinancialChange('paid_amount', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label mb-2">Стоимость материалов</label>
              <input
                type="number"
                className="form-input"
                value={financialForm.materials_cost}
                onChange={(e) => handleFinancialChange('materials_cost', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label mb-2">Стоимость работ</label>
              <input
                type="number"
                className="form-input"
                value={financialForm.labor_cost}
                onChange={(e) => handleFinancialChange('labor_cost', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateOrder;
