import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Save,
  User,
  DollarSign,
  Clock,
  Package,
  Truck,
  FileText,
  X,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import DrawingUpload from '../../components/UI/DrawingUpload';
import WarehouseInventoryTable from '../../components/Orders/WarehouseInventoryTable';
import OrderQRCode from '../../components/Production/OrderQRCode';
import toast from 'react-hot-toast';

const CreateOrder = () => {
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
    paymentMethod: 'cash',
    finalPaymentDate: '',
    paymentComment: ''
  });

  const [orderForm, setOrderForm] = useState({
    orderNumber: 'Будет присвоен автоматически',
    creationDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'new',
    priority: 'normal',
    productName: '',
    description: ''
  });

  // Состояния для чертежей
  const [drawings, setDrawings] = useState([]);
  const [uploadingDrawings, setUploadingDrawings] = useState(false);
  
  // Состояния для созданного заказа и QR кода
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Валидация
  const [errors, setErrors] = useState({});

  // Мутация для создания заказа
  const createOrderMutation = useMutation(ordersAPI.create, {
    onSuccess: async (data) => {
      const orderId = data?.order?.id;
      const orderNumber = data?.order?.order_number;
      
      if (orderId) {
        // Загружаем чертежи после создания заказа
        if (drawings.length > 0) {
          await uploadDrawings(orderId);
        }
        
        // Сохраняем данные созданного заказа
        setCreatedOrderId(orderId);
        setCreatedOrderNumber(orderNumber);
        setShowQRCode(true);
        
        toast.success('Заказ успешно создан! QR-код сгенерирован.');
      } else {
        toast.error('Ошибка: не удалось получить ID заказа');
      }
    },
    onError: (error) => {
      console.error('Ошибка создания заказа:', error);
      toast.error('Ошибка при создании заказа');
    }
  });

  // Функция загрузки чертежей
  const uploadDrawings = async (orderId) => {
    if (drawings.length === 0) return;

    setUploadingDrawings(true);
    try {
      for (const drawing of drawings) {
        const formData = new FormData();
        formData.append('drawing', drawing.file);

        await ordersAPI.uploadDrawing(orderId, formData);
      }
      toast.success('Чертежи загружены успешно');
    } catch (error) {
      console.error('Ошибка загрузки чертежей:', error);
      toast.error('Ошибка при загрузке чертежей');
    } finally {
      setUploadingDrawings(false);
    }
  };

  // Обработчики для чертежей
  const handleDrawingUpload = async (files) => {
    if (!createdOrderId) {
      toast.error('Сначала сохраните заказ, затем загрузите чертежи');
      return;
    }
    
    setUploadingDrawings(true);
    try {
      await uploadDrawings(createdOrderId);
      toast.success('Чертежи загружены успешно');
    } catch (error) {
      console.error('Ошибка загрузки чертежей:', error);
      toast.error('Ошибка загрузки чертежей');
    } finally {
      setUploadingDrawings(false);
    }
  };

  const handleDrawingDelete = (drawingId) => {
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
  };

  const handleDrawingDownload = (drawing) => {
    const url = URL.createObjectURL(drawing.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = drawing.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrawingView = (drawing) => {
    const url = URL.createObjectURL(drawing.file);
    window.open(url, '_blank');
  };

  // Обработчик перехода к заказу
  const handleGoToOrder = () => {
    if (createdOrderId) {
      navigate(`/orders/${createdOrderId}`);
    }
  };


  // Обработчики изменения форм
  const handleClientChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFinancialChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOrderChange = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    // Обязательные поля клиента
    if (!clientForm.name.trim()) newErrors.name = 'ФИО клиента обязательно';
    if (!clientForm.phone.trim()) newErrors.phone = 'Телефон обязателен';
    if (!clientForm.address.trim()) newErrors.address = 'Адрес доставки обязателен';

    // Обязательные поля заказа
    if (!orderForm.productName.trim()) newErrors.productName = 'Краткое описание обязательно';
    if (!orderForm.deadline) newErrors.deadline = 'Срок выполнения обязателен';

    // Обязательные поля финансов
    if (!financialForm.totalAmount || financialForm.totalAmount <= 0) {
      newErrors.totalAmount = 'Общая сумма обязательна';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Сохранение заказа
  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const orderData = {
      customer_id: 1, // В реальном приложении это будет ID выбранного клиента
      product_name: orderForm.productName,
      status: orderForm.status,
      priority: orderForm.priority,
      delivery_date: orderForm.deadline,
      notes: orderForm.description,
      total_amount: financialForm.totalAmount,
      prepayment_amount: financialForm.prepaymentAmount,
      paid_amount: 0,
      delivery_address: clientForm.address,
      has_elevator: clientForm.hasFreightElevator,
      floor: clientForm.floor,
      delivery_notes: clientForm.comment,
      short_description: orderForm.productName,
      detailed_description: orderForm.description,
      // Добавляем обязательное поле items
      items: [{
        name: orderForm.productName || 'Основной продукт',
        description: orderForm.description || '',
        quantity: 1,
        unit_price: financialForm.totalAmount || 0
      }]
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
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              <p className="text-gray-600">Режим эксперта - все поля на одной странице</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={createOrderMutation.isLoading || uploadingDrawings}
            >
              {createOrderMutation.isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {createOrderMutation.isLoading 
                ? 'Сохранение...' 
                : uploadingDrawings 
                  ? 'Загрузка чертежей...' 
                  : 'Сохранить заказ'
              }
            </button>
            
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Клиент и доставка - объединенный блок */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Клиент и доставка</h2>
                  <p className="text-sm text-gray-500">Основные данные заказчика и адрес доставки</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Левая часть - Информация о клиенте */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Клиент</h3>
                  </div>
                  
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
                      value={clientForm.name}
                      onChange={(e) => handleClientChange('name', e.target.value)}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
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
                        value={clientForm.phone}
                        onChange={(e) => handleClientChange('phone', e.target.value)}
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
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
                  </div>
                </div>

                {/* Правая часть - Доставка */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="h-4 w-4 text-orange-600" />
                    <h3 className="font-medium text-gray-900">Доставка</h3>
                  </div>
                  
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
                      value={clientForm.address}
                      onChange={(e) => handleClientChange('address', e.target.value)}
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
                        value={clientForm.floor}
                        onChange={(e) => handleClientChange('floor', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={clientForm.hasFreightElevator}
                        onChange={(e) => handleClientChange('hasFreightElevator', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <label className="text-sm text-gray-700">Грузовой лифт</label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий к доставке</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Дополнительная информация о доставке..."
                      value={clientForm.comment}
                      onChange={(e) => handleClientChange('comment', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Детали заказа */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Детали заказа</h2>
                  <p className="text-sm text-gray-500">Описание и параметры заказа</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Краткое описание <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.productName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Диван угловой 200x150x80 см"
                    value={orderForm.productName}
                    onChange={(e) => handleOrderChange('productName', e.target.value)}
                  />
                  {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
                  <p className="mt-1 text-xs text-gray-500">Название дивана и габариты</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Приоритет <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={orderForm.priority}
                    onChange={(e) => handleOrderChange('priority', e.target.value)}
                  >
                    <option value="low">Низкий</option>
                    <option value="normal">Обычный</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Подробное описание</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Подробное описание заказа, материалы, особенности изготовления..."
                    value={orderForm.description}
                    onChange={(e) => handleOrderChange('description', e.target.value)}
                  />
                </div>

                {/* Компактная загрузка чертежей */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Чертежи и документы
                    </label>
                    <span className="text-xs text-gray-500">
                      {drawings.length}/10 файлов
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Кнопка загрузки */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-2 pb-3">
                          <Package className="w-6 h-6 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Нажмите для загрузки</span> или перетащите файлы
                          </p>
                          <p className="text-xs text-gray-400">PDF, DWG, DXF, JPG, PNG (до 10MB)</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.tiff,.bmp"
                          onChange={handleDrawingUpload}
                        />
                      </label>
                    </div>
                    
                    {/* Список загруженных файлов */}
                    {drawings.length > 0 && (
                      <div className="space-y-1">
                        {drawings.map((drawing, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded border p-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 truncate max-w-48">
                                {drawing.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({(drawing.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDrawingView(drawing)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Просмотр"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDrawingDownload(drawing)}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Скачать"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDrawingDelete(index)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Удалить"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Правая колонка - Дополнительная информация */}
          <div className="space-y-6">
            

            {/* 2. Информация о заказе */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Информация о заказе</h2>
                  <p className="text-sm text-gray-500">Основные данные</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Номер заказа</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    value="Будет присвоен автоматически"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата создания</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={orderForm.creationDate}
                    onChange={(e) => handleOrderChange('creationDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок выполнения (дедлайн) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.deadline ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={orderForm.deadline}
                    onChange={(e) => handleOrderChange('deadline', e.target.value)}
                  />
                  {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
                </div>
              </div>
            </div>

            {/* 3. Финансы */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Финансы</h2>
                  <p className="text-sm text-gray-500">Стоимость и оплата</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Общая сумма <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    value={financialForm.totalAmount}
                    onChange={(e) => handleFinancialChange('totalAmount', Number(e.target.value))}
                  />
                  {errors.totalAmount && <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Предоплата</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0.00"
                    value={financialForm.prepaymentAmount}
                    onChange={(e) => handleFinancialChange('prepaymentAmount', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.paymentMethod}
                    onChange={(e) => handleFinancialChange('paymentMethod', e.target.value)}
                  >
                    <option value="cash">Наличные</option>
                    <option value="card">Карта</option>
                    <option value="transfer">Перевод</option>
                  </select>
                </div>
                
              </div>
            </div>


          </div>
        </div>

        {/* Таблица складских остатков на всю ширину */}
        <div className="mt-6">
          <WarehouseInventoryTable />
        </div>

        {/* Блок QR кода после создания заказа */}
        {showQRCode && createdOrderId && (
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">QR-код заказа</h2>
                  <p className="text-sm text-gray-500">Заказ #{createdOrderNumber} успешно создан</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR код */}
                <div className="flex justify-center">
                  <OrderQRCode 
                    orderId={createdOrderId} 
                    orderNumber={createdOrderNumber}
                    onQRGenerated={(qrData) => {
                      console.log('QR код сгенерирован:', qrData);
                    }}
                  />
                </div>
                
                {/* Информация и кнопки */}
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Заказ создан успешно</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Заказ #{createdOrderNumber} готов к производству. 
                      QR-код содержит всю необходимую информацию для отслеживания.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleGoToOrder}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Перейти к заказу
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowQRCode(false);
                        setCreatedOrderId(null);
                        setCreatedOrderNumber(null);
                        // Очищаем формы
                        setClientForm({
                          name: '',
                          phone: '',
                          email: '',
                          address: '',
                          floor: '',
                          comment: '',
                          hasFreightElevator: false,
                          company: '',
                          additionalContact: '',
                          preferredChannel: '',
                          deliveryTimeWindow: '',
                          deliveryMethod: '',
                          deliveryCost: ''
                        });
                        setFinancialForm({
                          totalAmount: 0,
                          prepaymentDate: '',
                          prepaymentAmount: 0,
                          prepaymentPercent: 0,
                          isCashPayment: false,
                          paymentMethod: 'cash',
                          finalPaymentDate: '',
                          paymentComment: ''
                        });
                        setOrderForm({
                          orderNumber: 'Будет присвоен автоматически',
                          creationDate: new Date().toISOString().split('T')[0],
                          deadline: '',
                          status: 'new',
                          priority: 'normal',
                          productName: '',
                          description: ''
                        });
                        setDrawings([]);
                        setErrors({});
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      <Package className="h-4 w-4" />
                      Создать новый заказ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;
