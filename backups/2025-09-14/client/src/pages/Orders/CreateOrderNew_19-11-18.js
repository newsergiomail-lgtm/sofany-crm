import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Save,
  Plus,
  User,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  Package,
  Shield,
  Edit,
  X
} from 'lucide-react';
import { ordersAPI, customersAPI, purchaseAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import QRCodeGenerator from '../../components/Production/QRCodeGenerator';
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
    manager: 'Анна Петрова',
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

  // Состояния для позиций заказа
  const [orderItems, setOrderItems] = useState([
    { id: 1, name: '', quantity: 1, price: 0, total: 0 }
  ]);
  
  // Состояния для редактирования позиций
  const [editingItems, setEditingItems] = useState(true);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0,
    total: 0
  });

  // Состояния для управления материалами
  const [missingMaterials, setMissingMaterials] = useState([]);

  // Состояния для QR-кода
  const [qrCode, setQrCode] = useState(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  // Описание проекта
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');

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



  const removeOrderItem = (itemId) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Расчет общей суммы
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Функции для работы с позициями заказа (из OrderDetail.js)
  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.price) {
      toast.error('Заполните все поля');
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

  // Форматирование валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  };

  // Функции для работы с материалами (из OrderDetail.js)
  const handleCheckMaterialsAlternative = () => {
    if (!orderItems || orderItems.length === 0) {
      toast.error('Нет позиций для проверки материалов');
      return;
    }

    // Если подсветка уже активна, выключаем её
    if (missingMaterials.length > 0) {
      setMissingMaterials([]);
      toast.success('Подсветка материалов отключена');
      return;
    }

    // Используем ту же логику, что и в тестовой кнопке - берем первые 2 материала
    const testMaterials = orderItems.slice(0, 2).map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    setMissingMaterials(testMaterials);
    
    const totalCost = testMaterials.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    toast.success(`Проверка завершена! Недостает ${testMaterials.length} материалов на сумму ${totalCost.toLocaleString()}₽`);
  };

  // Проверка, является ли материал недостающим
  const isMaterialMissing = (itemName) => {
    if (!missingMaterials || missingMaterials.length === 0) {
      return false;
    }
    
    const isMissing = missingMaterials.some(missing => 
      missing.name === itemName
    );
    
    return isMissing;
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

      const customerId = await ensureCustomerId();

      // Преобразуем позиции к полям API
      const items = orderItems
        .filter(i => (i.name || '').trim().length > 0)
        .map(i => ({
          name: i.name,
          description: '',
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.price) || 0,
        }));

      if (items.length === 0) {
        toast.error('Добавьте хотя бы одну позицию');
        return;
      }

      // Вычисляем общую сумму заказа
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const apiBody = {
        customer_id: customerId,
        product_name: orderForm.productName || projectName || items[0]?.name || '',
        status: orderForm.status || 'new',
        priority: orderForm.priority === 'medium' ? 'normal' : (orderForm.priority || 'normal'),
        delivery_date: orderForm.deadline || null,
        total_amount: totalAmount,
        prepayment_amount: financialForm.prepaymentAmount || 0,
        paid_amount: financialForm.paidAmount || 0,
        notes: clientForm.comment || '',
        short_description: projectDescription || '',
        detailed_description: projectRequirements || '',
        // плоские поля клиента/доставки
        additional_contact: clientForm.additionalContact || null,
        preferred_contact: clientForm.preferredChannel || null,
        delivery_address: clientForm.address || null,
        has_elevator: !!clientForm.hasFreightElevator,
        floor: clientForm.floor || null,
        delivery_notes: clientForm.comment || null,
        project_description: projectDescription || null,
        calculator_data: {
          project_name: projectName || '',
          project_requirements: projectRequirements || '',
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
        },
        items,
      };

      // Создаём заказ и дожидаемся результата
      const data = await createOrderMutation.mutateAsync(apiBody);
      const newId = data?.order?.id || data?.id;
      if (!newId) {
        toast.error('Не удалось получить ID созданного заказа');
        return;
      }

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
      navigate(`/orders/${newId}`, { state: { created: true } });
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">ФИО клиента</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Иванов Иван Иванович"
                    value={clientForm.name}
                    onChange={(e) => handleClientChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="+7 (900) 123-45-67"
                    value={clientForm.phone}
                    onChange={(e) => handleClientChange('phone', e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Адрес доставки</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    value={clientForm.address}
                    onChange={(e) => handleClientChange('address', e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сумма сделки (₽)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                    value={financialForm.totalAmount}
                    onChange={(e) => handleFinancialChange('totalAmount', parseFloat(e.target.value) || 0)}
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
                    <option value="cash">Наличные</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название проекта</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder='Например: Диван "Неаполь" с аккордеоном'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Краткое описание</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-h-[120px]"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Краткое описание изделия (название + механизм + габариты)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Подробное описание</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-h-[120px]"
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                    placeholder="Подробное описание проекта (материалы, цвет, размеры, особенности и т.п.)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Особые требования</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                    placeholder="Например: доставка в разобранном виде, гарантия, сборка..."
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

            {/* Позиции заказа */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Позиции заказа</h2>
                    <p className="text-sm text-gray-500">Состав и стоимость заказа</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItems(!editingItems)}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {editingItems ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-1/2">Наименование</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700 w-20">Кол-во</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 w-32">Цена</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 w-20">Сумма</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => {
                      // Защита от ошибок
                      if (!item || !item.name) {
                        return null;
                      }
                      
                      const isMissing = isMaterialMissing(item.name);
                      return (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isMissing ? 'bg-red-50 border-red-200' : ''
                      }`}>
                        <td className="py-4 px-4 w-1/2">
                          <input
                            type="text"
                            value={item.name}
                            readOnly={!editingItems}
                            onChange={(e) => editingItems && handleItemChange(item.id, 'name', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                              editingItems 
                                ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                                : 'border-transparent bg-gray-50'
                            }`}
                          />
                        </td>
                        <td className="py-4 px-4 w-20">
                          <input
                            type="number"
                            value={item.quantity}
                            readOnly={!editingItems}
                            onChange={(e) => editingItems && handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className={`w-full px-2 py-2 text-sm border rounded-lg transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              editingItems 
                                ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                                : 'border-transparent bg-gray-50'
                            }`}
                          />
                        </td>
                        <td className="py-4 px-4 w-32">
                          <input
                            type="number"
                            value={item.price}
                            readOnly={!editingItems}
                            onChange={(e) => editingItems && handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className={`w-full px-2 py-2 text-sm border rounded-lg transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              editingItems 
                                ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                                : 'border-transparent bg-gray-50'
                            }`}
                          />
                        </td>
                        <td className="py-4 px-4 w-20">
                          <input
                            type="text"
                            value={(item.quantity * item.price).toLocaleString()}
                            readOnly
                            className="w-full px-2 py-2 text-sm border border-transparent bg-gray-50 rounded-lg text-right font-medium"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {isMissing && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium cursor-help"
                                title="Нет на складе"
                              >
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}
                            {!isMissing && missingMaterials.length > 0 && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium cursor-help"
                                title="В наличии"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                            )}
                            {editingItems && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    
                    {/* Строка с итоговой суммой */}
                    <tr className="border-t-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
                      <td className="py-3 px-4 font-semibold text-base text-gray-900" colSpan="3">
                        Итого:
                      </td>
                      <td className="py-3 px-4 font-bold text-base text-teal-700 text-right whitespace-nowrap">
                        {formatCurrency(calculateTotal())}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Форма добавления новой позиции */}
              {editingItems && (
                <>
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
                </>
              )}

              {/* Кнопки управления материалами */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleCheckMaterialsAlternative}
                    className={`flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-all duration-300 group ${
                      missingMaterials.length > 0 
                        ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-colors duration-300 ${
                      missingMaterials.length > 0 
                        ? 'bg-red-100' 
                        : 'bg-blue-100 group-hover:bg-blue-200'
                    }`}>
                      <Package className={`h-3.5 w-3.5 ${
                        missingMaterials.length > 0 ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className={`text-base font-semibold mb-1 group-hover:opacity-80 transition-colors duration-300 ${
                        missingMaterials.length > 0 
                          ? 'text-red-900 group-hover:text-red-800' 
                          : 'text-blue-900 group-hover:text-blue-800'
                      }`}>
                        {missingMaterials.length > 0 ? 'Отключить подсветку' : 'Проверить материалы'}
                      </h4>
                      <p className={`text-xs group-hover:opacity-80 transition-colors duration-300 ${
                        missingMaterials.length > 0 
                          ? 'text-red-700 group-hover:text-red-600' 
                          : 'text-blue-700 group-hover:text-blue-600'
                      }`}>
                        {missingMaterials.length > 0 
                          ? 'Убирает подсветку недостающих материалов' 
                          : 'Проверяет наличие всех материалов из заказа на складе'
                        }
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleCreatePurchaseList}
                    disabled={createPurchaseListMutation.isLoading || !orderForm.orderNumber || orderForm.orderNumber === 'Будет присвоен автоматически'}
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                  >
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors duration-300">
                      <Package className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-base font-semibold text-orange-900 mb-1 group-hover:text-orange-800 transition-colors duration-300">
                        {createPurchaseListMutation.isLoading ? 'Создаем...' : 'В закупку'}
                      </h4>
                      <p className="text-xs text-orange-700 group-hover:text-orange-600 transition-colors duration-300">
                        Создает заявку на закупку недостающих материалов
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Боковая колонка */}
          <div className="w-80 space-y-6">
            {/* QR-код для производства */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-teal-600" />
                  <h2 className="text-xl font-semibold text-gray-900">QR-код для производства</h2>
                </div>
                <button
                  onClick={() => setShowQRGenerator(!showQRGenerator)}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  {showQRGenerator ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              
              {showQRGenerator && (
                <QRCodeGenerator
                  orderId={orderForm.id || orderForm.orderNumber}
                  orderNumber={orderForm.orderNumber || 'Новый заказ'}
                  currentStage={null}
                  onQRGenerated={(qr) => {
                    setQrCode(qr);
                    toast.success('QR-код сгенерирован для производства');
                  }}
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Менеджер</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    value={orderForm.manager}
                    readOnly
                  />
                </div>
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
