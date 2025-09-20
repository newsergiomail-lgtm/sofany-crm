import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Save,
  User,
  DollarSign,
  FileText,
  Package,
  Shield
} from 'lucide-react';
import { ordersAPI, customersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import WarehouseInventoryModal from '../../components/Orders/WarehouseInventoryModal';
import toast from 'react-hot-toast';

const CreateOrderNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Определяем режим работы
  const isEditMode = !!id;

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
    paymentMethod: '',
    invoiceNumber: '',
    finalPaymentDate: '',
    paymentComment: ''
  });

  const [orderForm, setOrderForm] = useState({
    status: 'new',
    priority: 'normal',
    deadline: '',
    creationDate: new Date().toISOString().split('T')[0],
    items: []
  });

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Мутация для создания заказа
  const createOrderMutation = useMutation(ordersAPI.create, {
    onSuccess: (data) => {
      console.log('Заказ создан:', data);
    },
    onError: (error) => {
      console.error('Ошибка создания заказа:', error);
    }
  });

  // Обработчики изменений форм
  const handleClientChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderChange = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleItemsChange = (items) => {
    setOrderForm(prev => ({ ...prev, items }));
  };

  const handleAddItem = (item) => {
    setOrderForm(prev => ({ 
      ...prev, 
      items: [...prev.items, { ...item, id: Date.now() }] 
    }));
  };

  const handleDeleteItem = (itemId) => {
    setOrderForm(prev => ({ 
      ...prev, 
      items: prev.items.filter(item => item.id !== itemId) 
    }));
  };

  const handleUpdateItem = (itemId, updatedItem) => {
    setOrderForm(prev => ({ 
      ...prev, 
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updatedItem } : item
      ) 
    }));
  };

  // Обработчики для работы с файлами
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      uploadDate: new Date().toLocaleString('ru-RU')
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('dwg') || fileType.includes('dxf')) return 'dwg';
    if (fileType.includes('word') || fileType.includes('document')) return 'doc';
    return 'file';
  };

  // Валидация обязательных полей
  const validateRequiredFields = () => {
    const errors = [];
    const fieldErrors = {};

    if (!clientForm.name.trim()) {
      errors.push('ФИО клиента');
      fieldErrors.name = true;
    }
    if (!clientForm.phone.trim()) {
      errors.push('Телефон клиента');
      fieldErrors.phone = true;
    }
    if (!clientForm.address.trim()) {
      errors.push('Адрес доставки');
      fieldErrors.address = true;
    }
    if (!projectName.trim()) {
      errors.push('Название проекта');
      fieldErrors.projectName = true;
    }
    if (!financialForm.totalAmount || financialForm.totalAmount <= 0) {
      errors.push('Сумма сделки');
      fieldErrors.totalAmount = true;
    }

    setValidationErrors(fieldErrors);
    return errors;
  };

  // Сохранение заказа
  const handleSave = async () => {
    console.log('handleSave вызвана');
    
    // Валидация
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      toast.error(
        <div className="space-y-1">
          <div className="font-semibold text-red-800">❌ Заполните обязательные поля:</div>
          <div className="text-sm text-red-700">
            • {validationErrors.join('<br/>• ')}
          </div>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    try {
      // Устанавливаем токен авторизации если его нет
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'test-token');
      }

      // Создаем или находим клиента
      let customerId;
      try {
        // Сначала ищем по телефону
        const existingCustomers = await customersAPI.getAll({ search: clientForm.phone });
        const customers = existingCustomers?.data?.customers || existingCustomers?.data?.data || existingCustomers?.data || [];
        const existingCustomer = Array.isArray(customers) ? customers.find(c => c.phone === clientForm.phone) : null;
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('👤 Найден существующий клиент по телефону:', existingCustomer);
        } else {
          // Если не найден по телефону, ищем по email
          if (clientForm.email) {
            const existingByEmail = Array.isArray(customers) ? customers.find(c => c.email === clientForm.email) : null;
            if (existingByEmail) {
              customerId = existingByEmail.id;
              console.log('👤 Найден существующий клиент по email:', existingByEmail);
            }
          }
          
          // Если все еще не найден, создаем нового
          if (!customerId) {
            console.log('👤 Создаем нового клиента...');
            try {
              const newCustomer = await customersAPI.create({
                name: clientForm.name,
                phone: clientForm.phone,
                address: clientForm.address,
                email: clientForm.email || `client_${Date.now()}@temp.com`
              });
              console.log('👤 Создан новый клиент:', newCustomer);
              customerId = newCustomer.id || newCustomer.data?.id;
            } catch (createError) {
              // Если ошибка дублирования, ищем клиента по email
              if (createError.response?.status === 500 && createError.response?.data?.error?.includes('duplicate key')) {
                console.log('👤 Клиент уже существует, ищем по email...');
                const allCustomers = await customersAPI.getAll({ search: clientForm.email });
                const allCustomersList = allCustomers?.data?.customers || allCustomers?.data?.data || allCustomers?.data || [];
                const existingByEmail = Array.isArray(allCustomersList) ? allCustomersList.find(c => c.email === clientForm.email) : null;
                if (existingByEmail) {
                  customerId = existingByEmail.id;
                  console.log('👤 Найден существующий клиент по email после ошибки:', existingByEmail);
                } else {
                  throw createError;
                }
              } else {
                throw createError;
              }
            }
          }
        }
      } catch (error) {
        console.error('Ошибка работы с клиентом:', error);
        toast.error('Ошибка создания клиента: ' + (error.response?.data?.message || error.message));
        return;
      }

      // Создаем заказ - только поля, которые ожидает схема валидации
      const orderData = {
        customer_id: parseInt(customerId), // Обязательно число
        product_name: projectName || '',
        status: orderForm.status || 'new',
        priority: orderForm.priority || 'normal',
        total_amount: parseFloat(financialForm.totalAmount) || 0,
        prepayment_amount: parseFloat(financialForm.prepaymentAmount) || 0,
        paid_amount: 0,
        notes: clientForm.comment || '',
        delivery_address: clientForm.address || '',
        has_elevator: !!clientForm.hasFreightElevator,
        floor: clientForm.floor || null,
        delivery_notes: clientForm.comment || null,
        project_description: projectDescription || '',
        items: orderForm.items.length > 0 ? orderForm.items.map(item => ({
          name: item.name || '',
          description: item.description || '',
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0
        })) : [{
          name: projectName || 'Заказ',
          description: projectDescription || '',
          quantity: 1,
          unit_price: parseFloat(financialForm.totalAmount) || 0
        }]
      };

      // Проверяем, что customerId получен
      if (!customerId) {
        console.error('❌ Не удалось получить ID клиента');
        toast.error('Ошибка: не удалось создать или найти клиента');
        return;
      }

      console.log('📋 Данные для создания заказа:', orderData);
      console.log('👤 ID клиента:', customerId, 'тип:', typeof customerId);

      const result = await createOrderMutation.mutateAsync(orderData);
      const orderId = result?.order?.id || result?.id;
      const orderNumber = result?.order?.order_number || result?.order_number;

      // Показываем уведомление об успешном создании
      toast.success(
        <div className="space-y-1">
          <div className="font-semibold text-green-800">✅ Заказ успешно создан!</div>
          <div className="text-sm text-green-700">
            • Номер заказа: <span className="font-semibold">{orderNumber || `ORD-${orderId}`}</span><br/>
            • ID: #{orderId}<br/>
            • Сумма: <span className="font-semibold">{financialForm.totalAmount.toLocaleString()}₽</span>
          </div>
        </div>,
        { duration: 5000 }
      );

      // Переходим к просмотру заказа
      if (orderId) {
        setTimeout(() => {
          navigate(`/orders/${orderId}`);
        }, 2000);
      }

    } catch (error) {
      console.error('Ошибка при сохранении заказа:', error);
      toast.error(`Ошибка при сохранении заказа: ${error.message || 'Неизвестная ошибка'}`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 group"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                </button>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isEditMode ? 'Редактирование заказа' : 'Создание заказа'}
                    </h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {isEditMode ? 'Редактируйте информацию о заказе' : 'Заполните информацию о заказе'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Информация об обязательных полях */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-700 p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-semibold text-red-800 dark:text-red-300">
                Поля, отмеченные красной звездочкой <span className="text-red-500 font-bold text-lg">*</span>, являются обязательными для заполнения
              </span>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - основная информация */}
          <div className="lg:col-span-2 space-y-8">
            {/* Клиент и доставка */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Клиент и доставка
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО клиента <span className="text-red-500 font-bold text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 ${
                      validationErrors.name 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Иванов Иван Иванович"
                    value={clientForm.name}
                    onChange={(e) => {
                      handleClientChange('name', e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: false }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон <span className="text-red-500 font-bold text-lg">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 ${
                      validationErrors.phone 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="+7 (900) 123-45-67"
                    value={clientForm.phone}
                    onChange={(e) => {
                      handleClientChange('phone', e.target.value);
                      if (validationErrors.phone) {
                        setValidationErrors(prev => ({ ...prev, phone: false }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="client@example.com"
                    value={clientForm.email}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ООО Пример"
                    value={clientForm.company}
                    onChange={(e) => handleClientChange('company', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес доставки <span className="text-red-500 font-bold text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 ${
                      validationErrors.address 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    value={clientForm.address}
                    onChange={(e) => {
                      handleClientChange('address', e.target.value);
                      if (validationErrors.address) {
                        setValidationErrors(prev => ({ ...prev, address: false }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                    value={clientForm.floor}
                    onChange={(e) => handleClientChange('floor', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Описание проекта */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Описание проекта
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название проекта <span className="text-red-500 font-bold text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 ${
                      validationErrors.projectName 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Кухонный гарнитур"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      if (validationErrors.projectName) {
                        setValidationErrors(prev => ({ ...prev, projectName: false }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание проекта</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Подробное описание проекта..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Позиции заказа */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Позиции заказа
                </h3>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Материалы</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {orderForm.items.length > 0 
                        ? `${orderForm.items.length} позиций выбрано` 
                        : 'Добавьте материалы в заказ'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsWarehouseModalOpen(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    {orderForm.items.length > 0 ? 'Редактировать материалы' : 'Добавить материалы'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={createOrderMutation.isLoading}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none"
                  >
                    {createOrderMutation.isLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    {createOrderMutation.isLoading ? 'Сохранение...' : (isEditMode ? 'Обновить заказ' : 'Сохранить заказ')}
                  </button>
                </div>
              </div>
              
              {/* Краткий список выбранных материалов */}
              {orderForm.items.length > 0 && (
                <div className="space-y-2">
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit || 'шт'} × {item.unit_price || 0} ₽
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {((item.quantity || 1) * (item.unit_price || 0)).toLocaleString()} ₽
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - финансы */}
          <div className="space-y-8">
            {/* Финансы */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Финансы
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сумма сделки (₽) <span className="text-red-500 font-bold text-lg">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 ${
                      validationErrors.totalAmount 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="0"
                    value={financialForm.totalAmount}
                    onChange={(e) => {
                      handleFinancialChange('totalAmount', parseFloat(e.target.value) || 0);
                      if (validationErrors.totalAmount) {
                        setValidationErrors(prev => ({ ...prev, totalAmount: false }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата предоплаты</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={financialForm.prepaymentDate}
                    onChange={(e) => handleFinancialChange('prepaymentDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сумма предоплаты (₽)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    value={financialForm.prepaymentAmount}
                    onChange={(e) => handleFinancialChange('prepaymentAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={financialForm.paymentMethod}
                    onChange={(e) => handleFinancialChange('paymentMethod', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="bank_transfer">Банковский перевод</option>
                    <option value="card">Карта</option>
                    <option value="cash">Наличные</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Загрузка файлов */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Чертежи и файлы
                </h3>
              </div>
              <div className="space-y-4">
                {/* Область загрузки */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Перетащите файлы сюда</p>
                      <p className="text-xs text-gray-500">или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Поддерживаются: PDF, DWG, DXF, JPG, PNG, DOC, DOCX
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Выбрать файлы
                    </label>
                  </div>
                </div>

                {/* Список загруженных файлов */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Загруженные файлы ({uploadedFiles.length}):
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file) => {
                        const fileIcon = getFileIcon(file.type);
                        const iconColor = fileIcon === 'pdf' ? 'red' : 
                                        fileIcon === 'image' ? 'green' : 
                                        fileIcon === 'dwg' ? 'blue' : 
                                        fileIcon === 'doc' ? 'blue' : 'gray';
                        
                        return (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 bg-${iconColor}-100 rounded flex items-center justify-center`}>
                                {fileIcon === 'pdf' && (
                                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {fileIcon === 'image' && (
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {fileIcon === 'dwg' && (
                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {fileIcon === 'doc' && (
                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {fileIcon === 'file' && (
                                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)} • {file.uploadDate}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleFileRemove(file.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Файлы не загружены
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex space-x-2">
                  <label
                    htmlFor="file-upload"
                    className="flex-1 cursor-pointer px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors text-center"
                  >
                    Загрузить еще
                  </label>
                  <button 
                    onClick={handleClearAllFiles}
                    disabled={uploadedFiles.length === 0}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Очистить все
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно складской системы */}
        <WarehouseInventoryModal
          isOpen={isWarehouseModalOpen}
          onClose={() => setIsWarehouseModalOpen(false)}
          orderId={isEditMode ? id : null}
          items={orderForm.items}
          onItemsChange={handleItemsChange}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
        />
      </div>
    </div>
  );
};

export default CreateOrderNew;
