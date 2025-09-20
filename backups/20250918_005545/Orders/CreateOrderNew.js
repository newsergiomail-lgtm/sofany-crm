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
    paymentComment: ''
  });

  const [orderForm, setOrderForm] = useState({
    orderNumber: 'Будет присвоен автоматически',
    creationDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'new',
    priority: 'normal',
    productName: ''
  });

  // Состояние для предиктивного ввода
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Статусы заказа
  const orderStatuses = [
    {
      id: 'new',
      title: 'Новый',
      description: 'Заказ только что создан',
      icon: CheckCircle,
      color: 'teal'
    },
    {
      id: 'confirmed',
      title: 'Принят',
      description: 'Заказ подтвержден',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'purchase',
      title: 'В закупке',
      description: 'Закупка материалов',
      icon: Package,
      color: 'orange'
    },
    {
      id: 'production',
      title: 'В производство',
      description: 'Изготовление изделия',
      icon: Shield,
      color: 'green'
    }
  ];

  



  // Состояния для QR-кода
  const [qrCode, setQrCode] = useState(null);
  const [showQRGenerator, setShowQRGenerator] = useState(true);
  const [isOrderSaved, setIsOrderSaved] = useState(false);

  // Описание проекта
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');

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
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Ошибка при создании заказа';
      toast.error(msg);
    }
  });

  // Мутация для проверки материалов
  const checkMaterialsMutation = useMutation(
    (orderId) => purchaseAPI.checkMaterials(orderId),
    {
      onSuccess: (data) => {
        const { summary } = data;
        if (summary.missing_materials > 0) {
          toast.success(`Проверка завершена! Недостает ${summary.missing_materials} материалов на сумму ${summary.total_missing_cost.toLocaleString()}₽`);
        } else {
          toast.success('Все материалы в наличии!');
        }
      },
      onError: (error) => {
        console.error('Ошибка проверки материалов:', error);
        toast.error('Ошибка при проверке материалов');
      }
    }
  );

  // Мутация для создания списка закупок
  const createPurchaseListMutation = useMutation(
    ({ orderId, data }) => purchaseAPI.createPurchaseList(orderId, data),
    {
      onSuccess: (data) => {
        const { total_cost, purchase_list_id, materials_count, missing_materials_count } = data;
        
        // Детальное уведомление об успехе
        toast.success(
          <div className="space-y-1">
            <div className="font-semibold text-green-800">✅ Список на закупку создан!</div>
            <div className="text-sm text-green-700">
              • ID списка: #{purchase_list_id}<br/>
              • Материалов обработано: {materials_count || 'N/A'}<br/>
              • Недостающих позиций: {missing_materials_count || 'N/A'}<br/>
              • Общая стоимость: <span className="font-semibold">{total_cost.toLocaleString()}₽</span>
            </div>
          </div>,
          { duration: 6000 }
        );
      },
      onError: (error) => {
        console.error('Ошибка создания списка закупок:', error);
        
        // Детальная обработка ошибок
        let errorMessage = 'Ошибка при создании списка закупок';
        
        if (error.response?.data?.error) {
          if (error.response.data.error.includes('уже существует')) {
            errorMessage = `Список закупок уже существует! ID: #${error.response.data.purchase_list_id}`;
          } else if (error.response.data.error.includes('не найден')) {
            errorMessage = 'Заказ не найден в базе данных';
          } else {
            errorMessage = error.response.data.error;
          }
        } else if (error.response?.status === 500) {
          errorMessage = 'Ошибка сервера при создании списка закупок';
        } else if (error.response?.status === 404) {
          errorMessage = 'API для создания списка закупок не найден';
        }
        
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold text-red-800">❌ Ошибка создания заявки</div>
            <div className="text-sm text-red-700">{errorMessage}</div>
          </div>,
          { duration: 5000 }
        );
      }
    }
  );

  // Обработчики изменения форм
  const handleClientChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
    
    // Автоматический расчет процента предоплаты
    if (field === 'prepaymentAmount' && financialForm.totalAmount > 0) {
      const percent = Math.round((value / financialForm.totalAmount) * 100);
      setFinancialForm(prev => ({ ...prev, prepaymentPercent: percent }));
    }
  };

  const handleOrderChange = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (statusId) => {
    setOrderForm(prev => ({ ...prev, status: statusId }));
  };

  // Работа с файлами (до создания заказа)
  const allowedExtensions = ['.pdf', '.dwg', '.dxf', '.skp', '.jpg', '.jpeg', '.png'];
  const addFiles = (files) => {
    const incoming = Array.from(files || []);
    const valid = incoming.filter(f => {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      return allowedExtensions.includes(ext);
    });
    if (valid.length !== incoming.length) {
      toast.error('Некоторые файлы отклонены. Разрешены: PDF, DWG, DXF, SKP, JPG, PNG');
    }
    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
    }
  };
  const handleFileInput = (e) => addFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };





  // Форматирование валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  };


  // Обработчики для закупок
  const handleCheckMaterials = async () => {
    if (!orderForm.orderNumber || orderForm.orderNumber === 'Будет присвоен автоматически') {
      toast.error('Сначала сохраните заказ');
      return;
    }
    
    try {
      // Находим ID заказа по номеру
      const ordersResponse = await ordersAPI.getAll({ search: orderForm.orderNumber });
      const orders = ordersResponse.data.orders || ordersResponse.data.data || [];
      const order = orders.find(o => o.order_number === orderForm.orderNumber);
      
      if (!order) {
        toast.error('Заказ не найден');
        return;
      }
      
      await checkMaterialsMutation.mutateAsync(order.id);
    } catch (error) {
      console.error('Ошибка при поиске заказа:', error);
      toast.error('Ошибка при поиске заказа');
    }
  };

  const handleCreatePurchaseList = async () => {
    if (!orderForm.orderNumber || orderForm.orderNumber === 'Будет присвоен автоматически') {
      toast.error('Сначала сохраните заказ');
      return;
    }
    
    try {
      // Показываем уведомление о начале процесса
      toast.loading('Поиск заказа и создание списка закупок...', { id: 'purchase-loading' });
      
      // Находим ID заказа по номеру
      const ordersResponse = await ordersAPI.getAll({ search: orderForm.orderNumber });
      const orders = ordersResponse.data.orders || ordersResponse.data.data || [];
      const order = orders.find(o => o.order_number === orderForm.orderNumber);
      
      if (!order) {
        toast.dismiss('purchase-loading');
        toast.error('Заказ не найден в базе данных');
        return;
      }
      
      // Обновляем уведомление
      toast.loading('Создание списка закупок...', { id: 'purchase-loading' });
      
      await createPurchaseListMutation.mutateAsync({
        orderId: order.id,
        data: {
          name: `Закупка для заказа ${orderForm.orderNumber}`,
          notes: 'Автоматически созданный список закупок'
        }
      });
      
      // Убираем loading уведомление
      toast.dismiss('purchase-loading');
      
    } catch (error) {
      console.error('Ошибка при создании списка закупок:', error);
      toast.dismiss('purchase-loading');
      
      // Детальная обработка ошибок поиска заказа
      if (error.response?.status === 404) {
        toast.error('Заказ не найден в базе данных');
      } else if (error.response?.status === 500) {
        toast.error('Ошибка сервера при поиске заказа');
      } else {
        toast.error('Ошибка при поиске заказа');
      }
    }
  };

  // Обеспечить customer_id: взять сохраненный, первый из базы или создать тестового
  const ensureCustomerId = async () => {
    const cached = localStorage.getItem('default_customer_id');
    if (cached) return Number(cached);

    try {
      const res = await customersAPI.getAll({ page: 1, limit: 1 });
      const list = res?.data?.customers || res?.data?.data || res?.data || [];
      const first = Array.isArray(list) ? list[0] : null;
      if (first?.id) {
        localStorage.setItem('default_customer_id', String(first.id));
        return first.id;
      }
    } catch (_) {}

    // Создаем тестового клиента, если никого нет
    try {
      const createRes = await customersAPI.create({
        name: clientForm.name || 'Тестовый клиент',
        phone: clientForm.phone || '+7 999 999 99 99',
        email: clientForm.email || 'test@example.com'
      });
      const id = createRes?.data?.customer?.id || createRes?.data?.id;
      if (id) {
        localStorage.setItem('default_customer_id', String(id));
        return id;
      }
    } catch (_) {}

    // Фолбэк
    throw new Error('Не удалось определить клиента (customer_id)');
  };

  // Сохранение заказа (соответствие серверной схеме Joi)
  const handleSave = async () => {
    try {
      // Валидация обязательных полей
      if (!clientForm.name?.trim()) {
        toast.error('Введите имя клиента');
        return;
      }

      if (!clientForm.phone?.trim()) {
        toast.error('Введите телефон клиента');
        return;
      }

      // Создаем или находим клиента
      let customerId;
      try {
        // Сначала пытаемся найти существующего клиента по телефону
        const existingCustomers = await customersAPI.getAll({ search: clientForm.phone });
        const customers = existingCustomers?.data?.customers || existingCustomers?.data?.data || existingCustomers?.data || [];
        const existingCustomer = Array.isArray(customers) ? customers.find(c => c.phone === clientForm.phone) : null;
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Создаем нового клиента
          const newCustomer = await customersAPI.create({
            name: clientForm.name,
            phone: clientForm.phone,
            address: clientForm.address || '',
            email: clientForm.email || `client_${Date.now()}@temp.com` // Генерируем уникальный email если не указан
          });
          customerId = newCustomer.id;
        }
      } catch (error) {
        console.error('Ошибка работы с клиентом:', error);
        toast.error('Ошибка создания клиента, используем существующего');
        // Фолбэк - используем существующего клиента
        customerId = await ensureCustomerId();
      }

      // Позиции заказа (обязательное поле для сервера)
      const items = [{
        name: orderForm.productName || 'Основной товар',
        description: orderForm.projectDescription || '',
        quantity: 1,
        unit_price: parseFloat(orderForm.totalAmount) || 0
      }];

      // Вычисляем общую сумму заказа
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const apiBody = {
        customer_id: customerId,
        product_name: orderForm.productName || projectName || items[0]?.name || '',
        status: orderForm.status || 'new',
        priority: orderForm.priority === 'medium' ? 'normal' : (orderForm.priority || 'normal'),
        delivery_date: orderForm.deadline || null,
        total_amount: totalAmount,
        items: items,
        prepayment_amount: financialForm.prepaymentAmount || 0,
        paid_amount: financialForm.paidAmount || 0,
        notes: clientForm.comment || '',
        short_description: shortDescription || '',
        detailed_description: detailedDescription || '',
        // плоские поля клиента/доставки
        additional_contact: clientForm.additionalContact || null,
        preferred_contact: clientForm.preferredChannel || null,
        delivery_address: clientForm.address || null,
        has_elevator: !!clientForm.hasFreightElevator,
        floor: clientForm.floor || null,
        delivery_notes: clientForm.comment || null,
        calculator_data: {
          project_name: projectName || '',
          project_requirements: projectDescription || '',
          // контакты
          additional_contact: clientForm.additionalContact || '',
          preferred_channel: clientForm.preferredChannel || '',
          // доставка
          delivery_time_window: clientForm.deliveryTimeWindow || '',
          delivery_method: clientForm.deliveryMethod || '',
          delivery_cost: Number(clientForm.deliveryCost || 0),
          // финансы
          payment_method: financialForm.paymentMethod || '',
          prepayment_date: financialForm.prepaymentDate || '',
          invoice_number: financialForm.invoiceNumber || '',
          final_payment_date: financialForm.finalPaymentDate || '',
          payment_comment: financialForm.paymentComment || ''
        }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к заказам
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Создание нового заказа</h1>
              <p className="text-gray-600">Заполните информацию о заказе</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={createOrderMutation.isLoading}
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
                Заказ-наряд
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Основная колонка */}
          <div className="flex-1 space-y-6">
            {/* Клиент и доставка */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Клиент и доставка</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО клиента <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Иванов Иван Иванович"
                    value={clientForm.name}
                    onChange={(e) => handleClientChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="+7 (900) 123-45-67"
                    value={clientForm.phone}
                    onChange={(e) => handleClientChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="client@example.com"
                    value={clientForm.email}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="ООО Пример"
                    value={clientForm.company}
                    onChange={(e) => handleClientChange('company', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес доставки <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    value={clientForm.address}
                    onChange={(e) => handleClientChange('address', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="1"
                    value={clientForm.floor}
                    onChange={(e) => handleClientChange('floor', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clientForm.hasFreightElevator}
                    onChange={(e) => handleClientChange('hasFreightElevator', e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Грузовой лифт есть</span>
                </label>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={3}
                  placeholder="Дополнительная информация..."
                  value={clientForm.comment}
                  onChange={(e) => handleClientChange('comment', e.target.value)}
                />
              </div>

              {/* Доп. контакт и предпочтительный канал связи */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Доп. контакт</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Имя, телефон"
                    value={clientForm.additionalContact}
                    onChange={(e) => handleClientChange('additionalContact', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Канал связи</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={clientForm.preferredChannel}
                    onChange={(e) => handleClientChange('preferredChannel', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="phone">Телефон</option>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="viber">Viber</option>
                  </select>
                </div>
              </div>

              {/* Параметры доставки из шторки */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Окно доставки</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={clientForm.deliveryTimeWindow}
                    onChange={(e) => handleClientChange('deliveryTimeWindow', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="09:00-12:00">09:00 - 12:00</option>
                    <option value="12:00-15:00">12:00 - 15:00</option>
                    <option value="14:00-18:00">14:00 - 18:00</option>
                    <option value="18:00-21:00">18:00 - 21:00</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ доставки</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={clientForm.deliveryMethod}
                    onChange={(e) => handleClientChange('deliveryMethod', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="pickup">Самовывоз</option>
                    <option value="courier">Курьер</option>
                    <option value="transport">ТК</option>
                    <option value="post">Почта</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Стоимость доставки (₽)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                    value={clientForm.deliveryCost}
                    onChange={(e) => handleClientChange('deliveryCost', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Финансы */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-6 w-6 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Финансы</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сумма сделки (₽) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                    value={financialForm.totalAmount}
                    onChange={(e) => handleFinancialChange('totalAmount', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата предоплаты</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.prepaymentDate}
                    onChange={(e) => handleFinancialChange('prepaymentDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сумма предоплаты (₽)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                    value={financialForm.prepaymentAmount}
                    onChange={(e) => handleFinancialChange('prepaymentAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Процент предоплаты</span>
                  <span className="text-sm font-semibold text-teal-600">{financialForm.prepaymentPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={financialForm.prepaymentPercent}
                  onChange={(e) => {
                    const percent = parseInt(e.target.value);
                    setFinancialForm(prev => ({ 
                      ...prev, 
                      prepaymentPercent: percent,
                      prepaymentAmount: Math.round((prev.totalAmount * percent) / 100)
                    }));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Оплата наличными</span>
                  <label className="relative inline-block w-12 h-7 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={financialForm.isCashPayment}
                      onChange={(e) => handleFinancialChange('isCashPayment', e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-all duration-300 rounded-full ${
                      financialForm.isCashPayment ? 'bg-teal-600' : 'bg-gray-300'
                    }`}>
                      <span className={`absolute content-[''] h-5 w-5 left-1 bottom-1 bg-white transition-all duration-300 rounded-full ${
                        financialForm.isCashPayment ? 'transform translate-x-5' : ''
                      }`} />
                    </span>
                  </label>
                </div>
              </div>

              {/* Фин. реквизиты из шторки */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.paymentMethod}
                    onChange={(e) => handleFinancialChange('paymentMethod', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="bank_transfer">Банковский перевод</option>
                    <option value="card">Карта</option>
                    <option value="installment">Рассрочка</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Номер счета</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="INV-001"
                    value={financialForm.invoiceNumber}
                    onChange={(e) => handleFinancialChange('invoiceNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата фин. оплаты</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.finalPaymentDate}
                    onChange={(e) => handleFinancialChange('finalPaymentDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий к оплате</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Комментарий"
                    value={financialForm.paymentComment}
                    onChange={(e) => handleFinancialChange('paymentComment', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Описание проекта (как в OrderDetail) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Описание проекта</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название проекта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder='Например: Диван "Неаполь" с аккордеоном'
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Краткое описание</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-h-[120px]"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Краткое описание изделия (название + механизм + габариты)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Подробное описание</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-h-[120px]"
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Подробное описание проекта (материалы, цвет, размеры, особенности и т.п.)..."
                  />
                </div>


                {/* Чертежи и документы */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Чертежи и документы</h3>
                    <div>
                      <input
                        id="fileInputCreate"
                        type="file"
                        multiple
                        accept=".pdf,.dwg,.dxf,.skp,.jpg,.jpeg,.png"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInputCreate').click()}
                        className="px-3 py-2 bg-teал-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                      >
                        Добавить файл
                      </button>
                    </div>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`border-2 border-dashed rounded-xl p-6 text-center ${selectedFiles.length ? 'border-teal-300 bg-teal-50' : 'border-gray-300 hover:border-teal-400'}`}
                  >
                    <p className="text-gray-600 text-sm">Перетащите файлы сюда или нажмите «Добавить файл»</p>
                    <p className="text-xs text-gray-500 mt-1">Поддержка: PDF, DWG, DXF, SKP, JPG, PNG</p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 border border-gray-100 rounded-lg divide-y">
                      {selectedFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <div className="text-sm text-gray-800 truncate mr-3">{f.name}</div>
                          <div className="flex items-center gap-3">
                            {uploading ? (
                              <span className="text-xs text-gray-500">Загрузка...</span>
                            ) : (
                              <button type="button" onClick={() => removeSelectedFile(idx)} className="text-red-600 text-sm hover:underline">Удалить</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>


          </div>

          {/* Боковая колонка */}
          <div className="w-80 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                      <div>
                        <div className={`font-medium ${
                          isActive ? `text-${status.color}-900` : 'text-gray-700'
                        }`}>
                          {status.title}
                        </div>
                        <div className={`text-sm ${
                          isActive ? `text-${status.color}-700` : 'text-gray-500'
                        }`}>
                          {status.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Информация о заказе */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Информация о заказе</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата создания</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    value={orderForm.creationDate}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Срок выполнения</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={orderForm.deadline}
                    onChange={(e) => handleOrderChange('deadline', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Краткое описание</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Например: Диван 2200мм + Раскладушка"
                    value={orderForm.productName}
                    onChange={(e) => handleOrderChange('productName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={orderForm.priority}
                    onChange={(e) => handleOrderChange('priority', e.target.value)}
                  >
                    <option value="low">Низкий</option>
                    <option value="normal">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderNew;

