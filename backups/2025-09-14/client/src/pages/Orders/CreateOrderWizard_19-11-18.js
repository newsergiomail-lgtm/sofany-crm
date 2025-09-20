import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  User,
  Package,
  Truck,
  DollarSign,
  FileText
} from 'lucide-react';
import { ordersAPI, customersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import QRCodeGenerator from '../../components/Production/QRCodeGenerator';
import toast from 'react-hot-toast';

const CreateOrderWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Состояния для каждого шага
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: '',
    company: ''
  });

  const [orderDetails, setOrderDetails] = useState({
    productName: '',
    description: '',
    priority: 'normal',
    deadline: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    floor: '',
    hasFreightElevator: false,
    comment: ''
  });

  const [financialInfo, setFinancialInfo] = useState({
    prepaymentAmount: 0,
    prepaymentPercent: 0,
    paymentMethod: 'cash',
    invoiceNumber: ''
  });

  // Валидация для каждого шага
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Клиент', icon: User, description: 'Основная информация' },
    { id: 2, title: 'Заказ', icon: Package, description: 'Детали заказа' },
    { id: 3, title: 'Доставка', icon: Truck, description: 'Адрес и условия' },
    { id: 4, title: 'Финансы', icon: DollarSign, description: 'Оплата' },
    { id: 5, title: 'Обзор', icon: FileText, description: 'Проверка данных' }
  ];

  // Мутация для создания заказа
  const createOrderMutation = useMutation(ordersAPI.create, {
    onSuccess: async (data) => {
      const newId = data?.order?.id || data?.id;
      if (newId) {
        setCreatedOrderId(newId);
        setCompletedSteps(prev => new Set([...prev, 5]));
        toast.success('Заказ успешно создан!');
        
        // Автоматически генерируем QR-код
        try {
          const qrResponse = await fetch(`/api/production/generate-qr/${newId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stageId: 1 })
          });
          
          if (qrResponse.ok) {
            toast.success('QR-код сгенерирован!');
          }
        } catch (error) {
          console.error('Ошибка генерации QR-кода:', error);
        }
      }
    },
    onError: (error) => {
      console.error('Ошибка создания заказа:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Ошибка при создании заказа';
      toast.error(msg);
    }
  });

  // Валидация шага 1 - Клиент
  const validateStep1 = () => {
    const newErrors = {};
    if (!clientInfo.name.trim()) newErrors.name = 'Введите имя клиента';
    if (!clientInfo.phone.trim()) newErrors.phone = 'Введите телефон клиента';
    if (clientInfo.email && !/\S+@\S+\.\S+/.test(clientInfo.email)) {
      newErrors.email = 'Введите корректный email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация шага 2 - Заказ
  const validateStep2 = () => {
    const newErrors = {};
    if (!orderDetails.productName.trim()) newErrors.productName = 'Введите название продукта';
    
    const validItems = orderDetails.items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      newErrors.items = 'Добавьте хотя бы одну позицию';
    }
    
    validItems.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = 'Введите название позиции';
      if (item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'Количество должно быть больше 0';
      if (item.price < 0) newErrors[`item_${index}_price`] = 'Цена не может быть отрицательной';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация шага 3 - Доставка
  const validateStep3 = () => {
    const newErrors = {};
    if (!deliveryInfo.address.trim()) newErrors.address = 'Введите адрес доставки';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация шага 4 - Финансы
  const validateStep4 = () => {
    const newErrors = {};
    if (financialInfo.prepaymentAmount < 0) {
      newErrors.prepaymentAmount = 'Сумма предоплаты не может быть отрицательной';
    }
    if (financialInfo.prepaymentPercent < 0 || financialInfo.prepaymentPercent > 100) {
      newErrors.prepaymentPercent = 'Процент предоплаты должен быть от 0 до 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Переход к следующему шагу
  const nextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setErrors({});
    }
  };

  // Переход к предыдущему шагу
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  // Создание заказа
  const createOrder = async () => {
    try {
      console.log('Начинаем создание заказа...');
      
      // Создаем или находим клиента
      const customerId = await ensureCustomerId();
      console.log('Customer ID получен:', customerId);

      // Подготавливаем позиции заказа
      const items = orderDetails.items
        .filter(item => item.name.trim())
        .map(item => ({
          name: item.name,
          description: '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.price) || 0,
        }));

      console.log('Позиции заказа:', items);

      // Вычисляем общую сумму
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      console.log('Общая сумма:', totalAmount);

      const apiBody = {
        customer_id: customerId,
        product_name: orderDetails.productName,
        status: 'new',
        priority: orderDetails.priority,
        delivery_date: orderDetails.deadline || null,
        total_amount: totalAmount,
        prepayment_amount: financialInfo.prepaymentAmount || 0,
        paid_amount: 0,
        notes: deliveryInfo.comment || '',
        short_description: orderDetails.description || '',
        detailed_description: orderDetails.description || '',
        delivery_address: deliveryInfo.address || null,
        has_elevator: deliveryInfo.hasFreightElevator,
        floor: deliveryInfo.floor || null,
        delivery_notes: deliveryInfo.comment || null,
        items,
      };

      console.log('Отправляем данные заказа:', apiBody);
      await createOrderMutation.mutateAsync(apiBody);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      
      // Более детальные сообщения об ошибках
      if (error.message?.includes('customer_id')) {
        toast.error('Ошибка с клиентом. Попробуйте еще раз.');
      } else if (error.message?.includes('items')) {
        toast.error('Ошибка с позициями заказа. Проверьте данные.');
      } else {
        toast.error(`Ошибка при создании заказа: ${error.message || 'Неизвестная ошибка'}`);
      }
    }
  };

  // Обеспечить customer_id
  const ensureCustomerId = async () => {
    // Сначала пытаемся найти существующего клиента по телефону или email
    if (clientInfo.phone || clientInfo.email) {
      try {
        const res = await customersAPI.getAll({ 
          page: 1, 
          limit: 10,
          search: clientInfo.phone || clientInfo.email 
        });
        const list = res?.data?.customers || res?.data?.data || res?.data || [];
        
        // Ищем клиента по телефону или email
        const existingCustomer = list.find(customer => 
          customer.phone === clientInfo.phone || 
          customer.email === clientInfo.email
        );
        
        if (existingCustomer?.id) {
          console.log('Найден существующий клиент:', existingCustomer.id);
          return existingCustomer.id;
        }
      } catch (error) {
        console.log('Ошибка поиска клиента:', error);
      }
    }

    // Если не найден, создаем нового клиента
    try {
      console.log('Создаем нового клиента...');
      const createRes = await customersAPI.create({
        name: clientInfo.name || 'Тестовый клиент',
        phone: clientInfo.phone || '+7 999 999 99 99',
        email: clientInfo.email || 'test@example.com'
      });
      
      const newId = createRes?.customer?.id || createRes?.id || createRes?.data?.id;
      console.log('Создан новый клиент с ID:', newId);
      
      if (newId) {
        return newId;
      }
    } catch (error) {
      console.error('Ошибка создания клиента:', error);
    }

    // Fallback - ищем любого существующего клиента
    try {
      const res = await customersAPI.getAll({ page: 1, limit: 1 });
      const list = res?.data?.customers || res?.data?.data || res?.data || [];
      const first = Array.isArray(list) ? list[0] : null;
      if (first?.id) {
        console.log('Используем существующего клиента:', first.id);
        return first.id;
      }
    } catch (error) {
      console.error('Ошибка поиска существующего клиента:', error);
    }

    throw new Error('Не удалось определить клиента (customer_id)');
  };

  // Добавление позиции заказа
  const addOrderItem = () => {
    setOrderDetails(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  // Удаление позиции заказа
  const removeOrderItem = (index) => {
    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Обновление позиции заказа
  const updateOrderItem = (index, field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (createOrderMutation.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к заказам
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Создание заказа</h1>
              <p className="text-gray-600">Пошаговое заполнение информации</p>
            </div>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || completedSteps.has(step.id);

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isCompleted 
                        ? 'bg-teal-600 border-teal-600 text-white' 
                        : isCurrent 
                          ? 'bg-teal-100 border-teal-600 text-teal-600' 
                          : isAccessible
                            ? 'bg-white border-gray-300 text-gray-400'
                            : 'bg-gray-100 border-gray-200 text-gray-300'
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isCurrent ? 'text-teal-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      completedSteps.has(step.id) ? 'bg-teal-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Контент шага */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Информация о клиенте</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО клиента <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Иванов Иван Иванович"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+7 (900) 123-45-67"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="client@example.com"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="ООО Пример"
                    value={clientInfo.company}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Детали заказа</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название продукта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.productName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Диван угловой"
                    value={orderDetails.productName}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, productName: e.target.value }))}
                  />
                  {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={3}
                    placeholder="Дополнительные требования к заказу"
                    value={orderDetails.description}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      value={orderDetails.priority}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Низкий</option>
                      <option value="normal">Обычный</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Срок выполнения</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      value={orderDetails.deadline}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Позиции заказа <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Добавить позицию
                    </button>
                  </div>
                  
                  {errors.items && <p className="mb-2 text-sm text-red-600">{errors.items}</p>}
                  
                  <div className="space-y-4">
                    {orderDetails.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-5">
                          <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                              errors[`item_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Название позиции"
                            value={item.name}
                            onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                          />
                          {errors[`item_${index}_name`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_name`]}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                              errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Кол-во"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                              errors[`item_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Цена за шт."
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateOrderItem(index, 'price', Number(e.target.value))}
                          />
                          {errors[`item_${index}_price`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_price`]}</p>
                          )}
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <div className="flex-1 text-right py-2 text-sm font-medium text-gray-700">
                            {item.quantity * item.price}₽
                          </div>
                          {orderDetails.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOrderItem(index)}
                              className="px-2 py-2 text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Доставка</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес доставки <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="1"
                      value={deliveryInfo.floor}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, floor: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={deliveryInfo.hasFreightElevator}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, hasFreightElevator: e.target.checked }))}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">Есть грузовой лифт</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий к доставке</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={3}
                    placeholder="Дополнительные требования к доставке"
                    value={deliveryInfo.comment}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, comment: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Финансовые условия</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сумма предоплаты (₽)</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.prepaymentAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={financialInfo.prepaymentAmount}
                      onChange={(e) => setFinancialInfo(prev => ({ ...prev, prepaymentAmount: Number(e.target.value) }))}
                    />
                    {errors.prepaymentAmount && <p className="mt-1 text-sm text-red-600">{errors.prepaymentAmount}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Процент предоплаты (%)</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.prepaymentPercent ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      max="100"
                      value={financialInfo.prepaymentPercent}
                      onChange={(e) => setFinancialInfo(prev => ({ ...prev, prepaymentPercent: Number(e.target.value) }))}
                    />
                    {errors.prepaymentPercent && <p className="mt-1 text-sm text-red-600">{errors.prepaymentPercent}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialInfo.paymentMethod}
                    onChange={(e) => setFinancialInfo(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Наличные</option>
                    <option value="card">Банковская карта</option>
                    <option value="transfer">Банковский перевод</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Номер счета</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Счет №12345"
                    value={financialInfo.invoiceNumber}
                    onChange={(e) => setFinancialInfo(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Обзор заказа</h2>
              <div className="space-y-6">
                {/* Информация о клиенте */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Клиент</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ФИО:</span>
                      <span className="ml-2 font-medium">{clientInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Телефон:</span>
                      <span className="ml-2 font-medium">{clientInfo.phone}</span>
                    </div>
                    {clientInfo.email && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{clientInfo.email}</span>
                      </div>
                    )}
                    {clientInfo.company && (
                      <div>
                        <span className="text-gray-600">Компания:</span>
                        <span className="ml-2 font-medium">{clientInfo.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Детали заказа */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Заказ</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Продукт:</span>
                      <span className="ml-2 font-medium">{orderDetails.productName}</span>
                    </div>
                    {orderDetails.description && (
                      <div>
                        <span className="text-gray-600">Описание:</span>
                        <span className="ml-2">{orderDetails.description}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Приоритет:</span>
                      <span className="ml-2 font-medium capitalize">{orderDetails.priority}</span>
                    </div>
                    {orderDetails.deadline && (
                      <div>
                        <span className="text-gray-600">Срок:</span>
                        <span className="ml-2 font-medium">{new Date(orderDetails.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Позиции заказа */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Позиции заказа</h3>
                  <div className="space-y-2">
                    {orderDetails.items.filter(item => item.name.trim()).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="font-medium">{item.quantity * item.price}₽</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Итого:</span>
                      <span>
                        {orderDetails.items
                          .filter(item => item.name.trim())
                          .reduce((sum, item) => sum + (item.quantity * item.price), 0)}₽
                      </span>
                    </div>
                  </div>
                </div>

                {/* Доставка */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Доставка</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Адрес:</span>
                      <span className="ml-2">{deliveryInfo.address}</span>
                    </div>
                    {deliveryInfo.floor && (
                      <div>
                        <span className="text-gray-600">Этаж:</span>
                        <span className="ml-2">{deliveryInfo.floor}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Грузовой лифт:</span>
                      <span className="ml-2">{deliveryInfo.hasFreightElevator ? 'Да' : 'Нет'}</span>
                    </div>
                    {deliveryInfo.comment && (
                      <div>
                        <span className="text-gray-600">Комментарий:</span>
                        <span className="ml-2">{deliveryInfo.comment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Финансы */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Финансы</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Предоплата:</span>
                      <span className="ml-2 font-medium">{financialInfo.prepaymentAmount}₽</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Способ оплаты:</span>
                      <span className="ml-2 font-medium capitalize">{financialInfo.paymentMethod}</span>
                    </div>
                    {financialInfo.invoiceNumber && (
                      <div>
                        <span className="text-gray-600">Счет:</span>
                        <span className="ml-2">{financialInfo.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Навигация */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <div className="flex gap-4">
            {currentStep === 5 ? (
              <button
                onClick={createOrder}
                disabled={createOrderMutation.isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {createOrderMutation.isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {createOrderMutation.isLoading ? 'Создание...' : 'Создать заказ'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Далее
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* QR-код генератор (показывается после создания заказа) */}
        {createdOrderId && (
          <div className="mt-8">
            <QRCodeGenerator orderId={createdOrderId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderWizard;
