import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Save,
  User,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  Package,
  Shield
} from 'lucide-react';
import { ordersAPI, customersAPI, purchaseAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import SimpleQRCodeGenerator from '../../components/Production/SimpleQRCodeGenerator';
import OrderItemsTableSimple from '../../components/Orders/OrderItemsTableSimple';
import WarehouseInventoryTable from '../../components/Orders/WarehouseInventoryTable';
import toast from 'react-hot-toast';

const CreateOrderNew = () => {
  const navigate = useNavigate();

  // Состояния для форм
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    floor: '',
    comment: '',
    hasFreightElevator: false,
    company: '',
    // Доп. контакты и доставка (для синхронизации со шторкой)
    additionalContact: '',
    preferredChannel: '',
    deliveryTimeWindow: '',
    deliveryMethod: '',
    deliveryCost: ''
  });

  const [financialForm, setFinancialForm] = useState({
    totalAmount: 0,
    prepaymentDate: '',
    prepaymentAmount: 0,
    prepaymentPercent: 0,
    isCashPayment: false,
    // Доп. финполя
    paymentMethod: '',
    invoiceNumber: '',
    finalPaymentDate: '',
    finalPaymentAmount: 0,
    paidAmount: 0
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    deadline: '',
    priority: 'normal',
    status: 'new'
  });

  // Состояние заказа (номер, ID, статус сохранения)
  const [orderForm, setOrderForm] = useState({
    id: null,
    orderNumber: '',
    status: 'new',
    priority: 'normal'
  });

  const [isOrderSaved, setIsOrderSaved] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Автоматическая авторизация
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Токен не найден, выполняем авторизацию...');
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sofany.com', password: 'admin123' })
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            console.log('Авторизация успешна');
            setIsAuthorized(true);
          } else {
            console.error('Ошибка авторизации');
            toast.error('Ошибка авторизации');
          }
        } else {
          console.log('Токен найден');
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Ошибка автоматической авторизации:', error);
        toast.error('Ошибка подключения к серверу');
      }
    };

    autoLogin();
  }, []);

  // Позиции заказа
  const [orderItems, setOrderItems] = useState([]);

  // Материалы склада для сверки
  const [warehouseItems, setWarehouseItems] = useState([]);

  // Файлы (будут загружены после создания заказа)
  const [selectedFiles, setSelectedFiles] = useState([]); // Array<File>
  const [uploading, setUploading] = useState(false);

  // Мутация для создания заказа
  const createOrderMutation = useMutation(ordersAPI.create, {
    onSuccess: () => {
      // навигацию и загрузку файлов выполняем в handleSave через mutateAsync
    },
    onError: (error) => {
      console.error('Ошибка создания заказа:', error);
      toast.error('Ошибка создания заказа');
    }
  });

  // Обработчики изменения форм
  const handleClientFormChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialFormChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectFormChange = (field, value) => {
    setProjectForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status) => {
    setOrderForm(prev => ({ ...prev, status }));
  };

  const handlePriorityChange = (priority) => {
    setOrderForm(prev => ({ ...prev, priority }));
  };

  // Проверка готовности формы
  const isFormReady = () => {
    return clientForm.name.trim() && 
           clientForm.phone.trim() && 
           projectForm.name.trim() && 
           projectForm.description.trim() && 
           financialForm.totalAmount && 
           financialForm.totalAmount > 0;
  };

  // Валидация обязательных полей
  const validateForm = () => {
    const errors = [];
    
    if (!clientForm.name.trim()) {
      errors.push('Имя клиента обязательно');
    }
    
    if (!clientForm.phone.trim()) {
      errors.push('Телефон клиента обязателен');
    }
    
    if (!projectForm.name.trim()) {
      errors.push('Название проекта обязательно');
    }
    
    if (!projectForm.description.trim()) {
      errors.push('Описание проекта обязательно');
    }
    
    if (!financialForm.totalAmount || financialForm.totalAmount <= 0) {
      errors.push('Общая сумма должна быть больше 0');
    }
    
    return errors;
  };

  // Обработчик сохранения заказа
  const handleSave = async () => {
    try {
      console.log('🔍 Начинаем создание заказа...');
      
      // Валидация формы
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      // Определяем ID клиента
      let customerId = null;
      
      try {
        // Сначала пытаемся найти существующего клиента по email или телефону
        if (clientForm.email || clientForm.phone) {
          const existingCustomer = await customersAPI.findByEmailOrPhone({
            email: clientForm.email,
            phone: clientForm.phone
          });
        if (existingCustomer) {
          customerId = existingCustomer.id;
            console.log('✅ Найден существующий клиент, ID:', customerId);
          }
        }
        
        // Если клиент не найден, создаем нового
        if (!customerId) {
          const newCustomer = await customersAPI.create({
            name: clientForm.name,
            phone: clientForm.phone,
            address: clientForm.address || '',
            email: clientForm.email || `client_${Date.now()}@temp.com` // Генерируем уникальный email если не указан
          });
          customerId = newCustomer.id;
          console.log('✅ Создан новый клиент, ID:', customerId);
        }
      } catch (error) {
        console.error('Ошибка работы с клиентом:', error);
        toast.error('Ошибка создания клиента, используем существующего');
        // Фолбэк - используем существующего клиента
        customerId = 1; // Временный ID
      }

      // Позиции заказа (используем данные из таблицы или создаем одну позицию)
      const items = orderItems.length > 0 ? orderItems.map(item => ({
        name: item.name || 'Товар',
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0
      })) : [{
        name: orderForm.productName || projectForm.name || 'Основной товар',
        description: projectForm.description || '',
        quantity: 1,
        unit_price: parseFloat(financialForm.totalAmount) || 0
      }];

      // Вычисляем общую сумму заказа
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const apiBody = {
        customer_id: customerId,
        product_name: orderForm.productName || projectForm.name || items[0]?.name || '',
        status: orderForm.status || 'new',
        priority: orderForm.priority === 'medium' ? 'normal' : (orderForm.priority || 'normal'),
        delivery_date: orderForm.deadline || null,
        total_amount: totalAmount,
        items: items,
        prepayment_amount: financialForm.prepaymentAmount || 0,
        paid_amount: financialForm.paidAmount || 0,
        notes: clientForm.comment || '',
        short_description: projectForm.description || '',
        detailed_description: projectForm.description || '',
        // плоские поля клиента/доставки
        additional_contact: clientForm.additionalContact || null,
        preferred_contact: clientForm.preferredChannel || null,
        delivery_address: clientForm.address || null,
        has_elevator: !!clientForm.hasFreightElevator,
        floor: clientForm.floor || null,
        delivery_notes: clientForm.comment || null,
        project_description: projectForm.description || null
      };

      // Создаём заказ и дожидаемся результата
      const data = await createOrderMutation.mutateAsync(apiBody);
      const newId = data?.order?.id || data?.id;
      const newOrderNumber = data?.order?.order_number || data?.order_number;
      if (!newId) {
        toast.error('Не удалось получить ID созданного заказа');
        return;
      }

      // Обновляем orderForm с реальными данными заказа
      setOrderForm(prev => ({
        ...prev,
        id: newId,
        orderNumber: newOrderNumber || prev.orderNumber
      }));

      // Помечаем заказ как сохраненный
      setIsOrderSaved(true);

      // Загрузка выбранных файлов после создания заказа
      if (selectedFiles.length > 0) {
        setUploading(true);
        try {
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('drawing', file);
            await ordersAPI.uploadDrawing(newId, formData);
          }
          toast.success('Файлы загружены');
        } catch (e) {
          console.error('Ошибка загрузки файлов:', e);
          toast.error('Не все файлы удалось загрузить');
        } finally {
          setUploading(false);
          setSelectedFiles([]);
        }
      }

      toast.success('Заказ успешно создан!');
      // Остаемся на странице создания для генерации QR-кода
    } catch (e) {
      const msg = e?.message || 'Ошибка подготовки данных заказа';
      toast.error(msg);
    }
  };

  if (createOrderMutation.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
  return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Авторизация...</p>
            </div>
          </div>
    );
  }

  // Статусы заказа
  const orderStatuses = [
    { id: 'new', label: 'Новый', icon: Package, color: 'blue' },
    { id: 'confirmed', label: 'Подтвержден', icon: CheckCircle, color: 'green' },
    { id: 'in_production', label: 'В производстве', icon: Clock, color: 'yellow' },
    { id: 'ready', label: 'Готов', icon: Shield, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
              <button
              onClick={() => navigate('/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
            <h1 className="text-3xl font-bold text-gray-900">Создание заказа</h1>
          </div>
          <p className="text-gray-600">Заполните информацию о заказе, клиенте и проекте</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Левая колонка - Формы (золотое сечение ~62%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Информация о клиенте */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Информация о клиенте</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !clientForm.name.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={clientForm.name}
                    onChange={(e) => handleClientFormChange('name', e.target.value)}
                    placeholder="Введите имя клиента"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !clientForm.phone.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={clientForm.phone}
                    onChange={(e) => handleClientFormChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={clientForm.email}
                    onChange={(e) => handleClientFormChange('email', e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={clientForm.company}
                    onChange={(e) => handleClientFormChange('company', e.target.value)}
                    placeholder="Название компании"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Адрес доставки</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={clientForm.address}
                    onChange={(e) => handleClientFormChange('address', e.target.value)}
                    placeholder="Полный адрес доставки"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={clientForm.floor}
                    onChange={(e) => handleClientFormChange('floor', e.target.value)}
                    placeholder="Номер этажа"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasFreightElevator"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={clientForm.hasFreightElevator}
                    onChange={(e) => handleClientFormChange('hasFreightElevator', e.target.checked)}
                  />
                  <label htmlFor="hasFreightElevator" className="ml-2 block text-sm text-gray-700">
                    Есть грузовой лифт
                </label>
              </div>
                
                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий</label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={clientForm.comment}
                    onChange={(e) => handleClientFormChange('comment', e.target.value)}
                    placeholder="Дополнительная информация о заказе"
                />
              </div>
                </div>
              </div>

            {/* Финансовая информация */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Финансовая информация</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Общая сумма <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      !financialForm.totalAmount || financialForm.totalAmount <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={financialForm.totalAmount}
                    onChange={(e) => handleFinancialFormChange('totalAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Предоплата</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={financialForm.prepaymentAmount}
                    onChange={(e) => handleFinancialFormChange('prepaymentAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  min="0"
                    step="0.01"
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата предоплаты</label>
                    <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={financialForm.prepaymentDate}
                    onChange={(e) => handleFinancialFormChange('prepaymentDate', e.target.value)}
                  />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={financialForm.paymentMethod}
                    onChange={(e) => handleFinancialFormChange('paymentMethod', e.target.value)}
                  >
                    <option value="">Выберите способ</option>
                    <option value="cash">Наличные</option>
                    <option value="card">Карта</option>
                    <option value="transfer">Банковский перевод</option>
                    <option value="installment">Рассрочка</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата отгрузки (дедлайн)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={financialForm.finalPaymentDate}
                    onChange={(e) => handleFinancialFormChange('finalPaymentDate', e.target.value)}
                  />
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Финальная оплата</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={financialForm.finalPaymentAmount}
                    onChange={(e) => handleFinancialFormChange('finalPaymentAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                </div>
                </div>

                  </div>

          {/* Правая колонка - QR код и статус (золотое сечение ~38%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR код */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">QR код заказа</h2>
                  </div>

              <div className="text-center">
              {isOrderSaved && orderForm.id ? (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <SimpleQRCodeGenerator 
                      orderId={orderForm.id} 
                      orderNumber={orderForm.orderNumber}
                    />
                  </div>
                </div>
              ) : (
                <div className="py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Сначала сохраните заказ</p>
                </div>
              )}
              </div>
            </div>

            {/* Статус заказа */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Статус заказа</h2>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер заказа</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                    value={orderForm.orderNumber}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {orderStatuses.map((status) => {
                  const IconComponent = status.icon;
                  const isActive = orderForm.status === status.id;
                  
                  return (
                    <div
                      key={status.id}
                      onClick={() => handleStatusChange(status.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? `bg-${status.color}-50 border border-${status.color}-200`
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 ${
                        isActive ? `text-${status.color}-600` : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                          isActive ? `text-${status.color}-900` : 'text-gray-700'
                        }`}>
                        {status.label}
                      </span>
                        </div>
                  );
                })}
                        </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={orderForm.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  <option value="low">Низкий</option>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
                      </div>
                    </div>
              </div>
            </div>

        {/* Информация о проекте - на всю ширину */}
        <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Информация о проекте</h2>
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название проекта <span className="text-red-500">*</span>
                </label>
                  <input
                    type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    !projectForm.name.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={projectForm.name}
                  onChange={(e) => handleProjectFormChange('name', e.target.value)}
                  placeholder="Название мебели или проекта"
                  required
                  />
                </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Срок выполнения</label>
                  <input
                    type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={projectForm.deadline}
                  onChange={(e) => handleProjectFormChange('deadline', e.target.value)}
                  />
                </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание проекта <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    !projectForm.description.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  rows={4}
                  value={projectForm.description}
                  onChange={(e) => handleProjectFormChange('description', e.target.value)}
                  placeholder="Подробное описание проекта, материалов, размеров и т.д."
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Файлы-чертежи</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                      >
                        <span>Загрузить файлы</span>
                  <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                          onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        />
                      </label>
                      <p className="pl-1">или перетащите сюда</p>
                </div>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG, DWG, DXF до 10MB</p>
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-green-600">
                        Выбрано файлов: {selectedFiles.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Складские остатки - на всю ширину */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Складские остатки</h2>
            </div>
            
            <WarehouseInventoryTable
              onItemsChange={setWarehouseItems}
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isOrderSaved ? (
              <span className="text-green-600">✓ Заказ сохранен</span>
            ) : (
                <div>
                <div>Заполните обязательные поля: <span className="text-red-500">*</span></div>
                <div className="text-xs mt-1">
                  {!clientForm.name.trim() && <span className="text-red-500 mr-2">• Имя клиента</span>}
                  {!clientForm.phone.trim() && <span className="text-red-500 mr-2">• Телефон</span>}
                  {!projectForm.name.trim() && <span className="text-red-500 mr-2">• Название проекта</span>}
                  {!projectForm.description.trim() && <span className="text-red-500 mr-2">• Описание проекта</span>}
                  {(!financialForm.totalAmount || financialForm.totalAmount <= 0) && <span className="text-red-500 mr-2">• Общая сумма</span>}
                </div>
              </div>
            )}
            </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                isFormReady() && !createOrderMutation.isLoading
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              disabled={!isFormReady() || createOrderMutation.isLoading}
            >
              {createOrderMutation.isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {createOrderMutation.isLoading ? 'Сохранение...' : 'Сохранить заказ'}
            </button>
            
            {isOrderSaved && orderForm.id && (
              <button
                onClick={() => navigate(`/orders/${orderForm.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FileText className="h-4 w-4" />
                Перейти к заказу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderNew;