import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Edit, 
  X, 
  Plus, 
  Check, 
  Download, 
  Eye, 
  Trash2,
  Upload,
  Kanban,
  DollarSign,
  FileText,
  Package,
  Shield,
  Calendar,
  Save
} from 'lucide-react';
import { ordersAPI, purchaseAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import OrderStatusGuide from '../../components/Orders/OrderStatusGuide';
import QRCodeImage from '../../components/QRCodeImage';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Состояния для редактирования
  const [editingItems, setEditingItems] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editingProjectDescription, setEditingProjectDescription] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [editingFinance, setEditingFinance] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  

  // Состояния для новых позиций
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0,
    total: 0
  });

  // Состояния для финансовой аналитики
  const [costValue, setCostValue] = useState(7200);
  const [markupPercentage, setMarkupPercentage] = useState(37.5);

  // Состояние для финансовых данных
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

  // Состояния для форм
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: ''
  });

  const [deadlineForm, setDeadlineForm] = useState({
    deadline: ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    address: '',
    floor: '',
    hasLift: false,
    notes: ''
  });

  const [projectDescriptionForm, setProjectDescriptionForm] = useState({
    description: ''
  });

  const [projectDescription, setProjectDescription] = useState('');

  // Позиции заказа
  const [orderItems, setOrderItems] = useState([]);

  // Недостающие материалы
  const [missingMaterials, setMissingMaterials] = useState([]);
  

  // Загруженные файлы
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Состояния для drag & drop
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Состояния для файлов подробного описания
  const [uploadedFilesDescription, setUploadedFilesDescription] = useState([]);
  const [isDragOverDescription, setIsDragOverDescription] = useState(false);
  const [uploadingFilesDescription, setUploadingFilesDescription] = useState([]);
  const [uploadProgressDescription, setUploadProgressDescription] = useState({});

  // Загрузка данных заказа
  const { data: order, isLoading, error, refetch } = useQuery(
    ['order', id],
    () => ordersAPI.getById(id),
    {
      enabled: !!id,
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000, // 30 секунд
      onSuccess: (data) => {
        if (data) {
          // Плоская инициализация из API
          setClientForm({
            name: data.customer_name || '',
            phone: data.customer_phone || '',
            email: data.customer_email || '',
            company: data.customer_company || ''
          });

          setDeadlineForm({
            deadline: data.delivery_date || ''
          });

          setProjectDescriptionForm({
            description: data.project_description || ''
          });

          setProjectDescription(data.product_name || '');
          setDeliveryForm({
            address: data.delivery_address || '',
            floor: (data.floor ?? '').toString(),
            hasLift: !!data.has_elevator,
            notes: data.delivery_notes || ''
          });
          setProjectDescription(data.project_description || data.description || '');

          // Финансы из API/calculator_data
          const cd = data.calculator_data || {};
          const totalAmount = Number(data.total_amount || 0);
          const prepaymentAmount = Number(data.paid_amount || 0);
          const prepaymentPercent = totalAmount > 0 ? Math.round((prepaymentAmount / totalAmount) * 100) : 0;
          setFinancialForm(prev => ({
            ...prev,
            totalAmount,
            prepaymentAmount,
            prepaymentPercent,
            prepaymentDate: cd.prepayment_date || '',
            isCashPayment: (cd.payment_method || '') === 'cash',
            paymentMethod: cd.payment_method || '',
            invoiceNumber: cd.invoice_number || '',
            finalPaymentDate: cd.final_payment_date || '',
            paymentComment: cd.payment_comment || ''
          }));

          if (data.items && data.items.length > 0) {
            const clientItems = data.items.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              quantity: item.quantity,
              price: item.unit_price || item.price || 0,
              total: item.total_price || (item.quantity * (item.unit_price || item.price || 0))
            }));
            setOrderItems(clientItems);
            const totalCost = clientItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            setCostValue(totalCost);
          } else {
            setOrderItems([]);
            setCostValue(0);
          }
        }
      },
      onError: (error) => {
        console.error('❌ Ошибка загрузки заказа:', error);
        toast.error('Ошибка загрузки данных заказа');
      }
    }
  );

  // Показ уведомления при переходе после создания
  const location = useLocation();
  useEffect(() => {
    if (location.state && location.state.created) {
      // Всплывающее модальное уведомление, автозакрытие
      toast.success('Заказ успешно создан!', { duration: 3000 });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Мутации для сохранения
  const updateOrderMutation = useMutation(
    ({ id, ...data }) => ordersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['kanban']);
        
        // Отправляем событие обновления в канбан
        window.dispatchEvent(new CustomEvent('kanbanOrderUpdated', {
          detail: { orderId: id }
        }));
      }
    }
  );

  // Мутации для закупок
  const checkMaterialsMutation = useMutation(
    () => purchaseAPI.checkMaterials(id),
    {
      onSuccess: (response) => {
        
        // Извлекаем данные из response.data
        const data = response.data || response;
        
        // Валидация структуры данных
        if (!data || typeof data !== 'object') {
          toast.error('Неверный формат ответа от сервера');
          return;
        }
        
        const { summary, missing_materials } = data;
        
        // Валидация missing_materials
        let validMissingMaterials = [];
        if (Array.isArray(missing_materials)) {
          validMissingMaterials = missing_materials.filter(item => 
            item && 
            typeof item === 'object' && 
            typeof item.name === 'string' && 
            item.name.trim().length > 0
          );
        } else {
        }
        
        setMissingMaterials(validMissingMaterials);
        
        // Валидация summary
        if (summary && typeof summary === 'object') {
          const missingCount = summary.missing_materials || 0;
          const totalCost = summary.total_missing_cost || 0;
          
          if (missingCount > 0) {
            toast.success(`Проверка завершена! Недостает ${missingCount} материалов на сумму ${totalCost.toLocaleString()}₽`);
        } else {
          toast.success('Все материалы в наличии!');
          }
        } else {
          toast.success('Проверка материалов завершена');
        }
      },
      onError: (error) => {
        console.error('❌ Ошибка проверки материалов:', error);
        console.error('❌ Детали ошибки:', error.response?.data || error.message);
        toast.error(`Ошибка при проверке материалов: ${error.response?.data?.message || error.message}`);
        setMissingMaterials([]); // Очищаем состояние при ошибке
      }
    }
  );

  const createPurchaseListMutation = useMutation(
    (data) => purchaseAPI.createPurchaseList(id, data),
    {
      onSuccess: (data) => {
        toast.success(`Список на закупку создан! Общая стоимость: ${data.total_cost.toLocaleString()}₽`);
      },
      onError: (error) => {
        console.error('Ошибка создания списка закупок:', error);
        toast.error('Ошибка при создании списка закупок');
      }
    }
  );

  // Загрузка чертежей при инициализации
  useEffect(() => {
    const loadDrawings = async () => {
      if (id) {
        try {
          const drawings = await ordersAPI.getDrawings(id);
          setUploadedFiles(drawings.map(drawing => ({
            id: drawing.id,
            name: drawing.file_name,
            size: formatFileSize(drawing.file_size)
          })));
        } catch (error) {
          console.error('Ошибка загрузки чертежей:', error);
        }
      }
    };

    loadDrawings();
  }, [id]);

  // Автоматический пересчет финансовых показателей при изменении позиций
  useEffect(() => {
    updateFinancialData();
  }, [orderItems]);

  // Функции для работы с позициями
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

  // Функция для пересчета финансовых показателей
  const updateFinancialData = () => {
    const totalCost = orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    setCostValue(totalCost);
    
    // Пересчитываем маржу на основе текущей стоимости
    if (totalCost > 0) {
      const currentSalePrice = totalCost * (1 + markupPercentage / 100);
      const profit = currentSalePrice - totalCost;
      const newMargin = (profit / currentSalePrice) * 100;
      setMarkupPercentage(newMargin);
    }
  };

  // Обработка изменения финансовых данных
  const handleFinancialChange = (field, value) => {
    setFinancialForm(prev => ({ ...prev, [field]: value }));
    
    // Автоматический расчет процента предоплаты
    if (field === 'prepaymentAmount' && financialForm.totalAmount > 0) {
      const percent = Math.round((value / financialForm.totalAmount) * 100);
      setFinancialForm(prev => ({ ...prev, prepaymentPercent: percent }));
    }
  };

  const handleSaveFinance = () => {
    updateOrderMutation.mutate({
      id,
      paid_amount: Number(financialForm.prepaymentAmount || 0),
      calculator_data: {
        payment_method: financialForm.paymentMethod || (financialForm.isCashPayment ? 'cash' : ''),
        prepayment_date: financialForm.prepaymentDate || '',
        invoice_number: financialForm.invoiceNumber || '',
        final_payment_date: financialForm.finalPaymentDate || '',
        payment_comment: financialForm.paymentComment || ''
      }
    });
    setEditingFinance(false);
  };

  // Функции для работы с файлами
  const handleFileAction = async (action, fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    
    if (action === 'delete') {
      if (window.confirm(`Удалить файл ${file.name}?`)) {
        try {
          await ordersAPI.deleteDrawing(id, fileId);
          setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
        } catch (error) {
          console.error('Ошибка удаления файла:', error);
          alert('Ошибка при удалении файла');
        }
      }
    } else if (action === 'download') {
      try {
        const response = await ordersAPI.downloadDrawing(id, fileId);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Ошибка скачивания файла:', error);
        alert('Ошибка при скачивании файла');
      }
    } else if (action === 'view') {
      try {
        const response = await ordersAPI.getDrawing(id, fileId);
        
        // Определяем тип файла по расширению
        const fileExtension = file.name.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        
        switch (fileExtension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'dwg':
            mimeType = 'application/dwg';
            break;
          case 'dxf':
            mimeType = 'application/dxf';
            break;
          case 'skp':
            mimeType = 'application/skp';
            break;
        }
        
        // Создаем blob с правильным MIME-типом
        const blob = new Blob([response.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        // Для изображений открываем в новой вкладке
        if (mimeType.startsWith('image/')) {
          window.open(url, '_blank');
        } 
        // Для PDF открываем в новой вкладке
        else if (mimeType === 'application/pdf') {
          window.open(url, '_blank');
        }
        // Для других типов файлов показываем предупреждение
        else {
          alert('Просмотр данного типа файла не поддерживается. Используйте скачивание.');
        }
        
        // Очищаем URL через некоторое время
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 10000);
        
      } catch (error) {
        console.error('Ошибка просмотра файла:', error);
        alert('Ошибка при открытии файла');
      }
    }
  };

  // Функции для drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  // Функции для drag & drop подробного описания
  const handleDragOverDescription = (e) => {
    e.preventDefault();
    setIsDragOverDescription(true);
  };

  const handleDragLeaveDescription = (e) => {
    e.preventDefault();
    setIsDragOverDescription(false);
  };

  const handleDropDescription = (e) => {
    e.preventDefault();
    setIsDragOverDescription(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUploadDescription(files);
  };

  const handleFileInputDescription = (e) => {
    const files = Array.from(e.target.files);
    handleFileUploadDescription(files);
  };

  const handleFileUploadDescription = async (files) => {
    if (!files || files.length === 0) return;

    // Фильтруем только разрешенные типы файлов
    const allowedTypes = ['.pdf', '.dwg', '.dxf', '.skp', '.jpg', '.jpeg', '.png'];
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      alert('Нет файлов с поддерживаемыми форматами');
      return;
    }

    // Добавляем файлы в состояние загрузки
    const tempFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      isUploading: true,
      isUploaded: false
    }));

    setUploadingFilesDescription(prev => [...prev, ...tempFiles]);

    // Загружаем файлы
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempId = tempFiles[i].id;
      
      try {
        const formData = new FormData();
        formData.append('drawing', file);
        
        const response = await ordersAPI.uploadDrawing(id, formData);
        
        // Обновляем прогресс
        setUploadProgressDescription(prev => ({ ...prev, [tempId]: 100 }));
        
        // Обновляем статус файла
        setUploadingFilesDescription(prev => 
          prev.map(f => 
            f.id === tempId 
              ? { ...f, isUploading: false, isUploaded: true }
              : f
          )
        );
        
        // Добавляем в загруженные файлы
        setUploadedFilesDescription(prev => [...prev, {
          id: response.data.id,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        }]);
        
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        setUploadingFilesDescription(prev => prev.filter(f => f.id !== tempId));
      }
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Фильтруем только разрешенные типы файлов
    const allowedTypes = ['.pdf', '.dwg', '.dxf', '.skp', '.jpg', '.jpeg', '.png'];
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      alert('Некоторые файлы имеют неподдерживаемый формат. Разрешены: PDF, DWG, DXF, SKP, JPG, PNG');
    }

    if (validFiles.length === 0) return;

    // Добавляем файлы в состояние загрузки
    const timestamp = Date.now();
    const newUploadingFiles = validFiles.map((file, index) => ({
      id: `temp-${timestamp}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      isUploading: true,
      progress: 0
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Загружаем каждый файл
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempId = `temp-${timestamp}-${i}`;
      
      try {
        await uploadFile(file, tempId);
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        // Удаляем файл из состояния загрузки при ошибке
        setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
      }
    }
  };

  const uploadFile = async (file, tempId) => {
    try {
      const formData = new FormData();
      formData.append('drawing', file);

      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[tempId] || 0;
          if (currentProgress < 90) {
            return { ...prev, [tempId]: currentProgress + Math.random() * 20 };
          }
          return prev;
        });
      }, 200);

      // Используем API метод
      const response = await ordersAPI.uploadDrawing(id, formData);
      
      clearInterval(progressInterval);
      
      // Завершаем прогресс
      setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
      
      // Обновляем статус файла
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === tempId 
            ? { ...f, isUploading: false, isUploaded: true }
            : f
        )
      );

      // Через секунду удаляем из состояния загрузки и добавляем в загруженные
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
        setUploadedFiles(prev => [...prev, {
          id: response.drawing.id,
          name: response.drawing.file_name,
          size: formatFileSize(response.drawing.file_size)
        }]);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });
      }, 1000);

      return response;
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      throw error;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Функции сохранения
  const handleSaveItems = () => {
    // Преобразуем данные для отправки на сервер
    const itemsForServer = orderItems.map(item => ({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.total
    }));
    
    updateOrderMutation.mutate({
      id,
      items: itemsForServer
    });
    setEditingItems(false);
  };

  const handleSaveProject = () => {
    updateOrderMutation.mutate({
      id,
      product_name: projectDescription
    });
    setEditingProject(false);
  };

  const handleSaveClient = () => {
    updateOrderMutation.mutate({
      id,
      customer: clientForm
    });
    setEditingClient(false);
  };

  const handleSaveDeadline = () => {
    updateOrderMutation.mutate({
      id,
      delivery_date: deadlineForm.deadline
    });
    setEditingDeadline(false);
  };

  const handleSaveProjectDescription = () => {
    updateOrderMutation.mutate({
      id,
      project_description: projectDescriptionForm.description
    });
    setEditingProjectDescription(false);
  };

  const handleSaveDelivery = () => {
    updateOrderMutation.mutate({
      id,
      delivery: deliveryForm
    });
    setEditingDelivery(false);
  };

  const handleMoveToProduction = async () => {
    if (window.confirm('Переместить заказ в производство? Заказ появится в канбане.')) {
      try {
        // Обновляем статус заказа на "in_production"
        await ordersAPI.update(id, { status: 'in_production' });
        
        // Создаем production_operation
        await ordersAPI.createProductionOperation(id, {
          operation_type: 'produce',
          production_stage: 'КБ'
        });
        
        // Обновляем данные
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['kanban']);
        
        alert('Заказ перемещен в производство!');
      } catch (error) {
        console.error('Ошибка при перемещении в производство:', error);
        alert('Ошибка при перемещении заказа в производство');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (window.confirm(`Изменить статус заказа на "${getStatusText(newStatus)}"?`)) {
      try {
        // Обновляем статус заказа
        await ordersAPI.update(id, { status: newStatus });
        
        // Если статус меняется на "in_production", создаем production_operation
        if (newStatus === 'in_production') {
          await ordersAPI.createProductionOperation(id, {
            operation_type: 'produce',
            production_stage: 'КБ'
          });
        }
        
        // Обновляем данные
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['kanban']);
        
        alert('Статус заказа обновлен!');
      } catch (error) {
        console.error('Ошибка при изменении статуса:', error);
        alert('Ошибка при изменении статуса заказа');
      }
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Новый',
      'confirmed': 'Подтвержден',
      'in_production': 'В производстве',
      'ready': 'Готов',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  // Обработчики для закупок
  const handleCheckMaterials = () => {
    
    // Если нет позиций, показываем предупреждение
    if (!orderItems || orderItems.length === 0) {
      toast.error('Нет позиций для проверки материалов');
      return;
    }
    
    checkMaterialsMutation.mutate();
  };

  // Функция проверки материалов (имитация API)
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


  const handleCreatePurchaseList = () => {
    createPurchaseListMutation.mutate({
      name: `Закупка для заказа ${order?.order_number || id}`,
      notes: 'Автоматически созданный список закупок'
    });
  };

  // Нормализация названия для сравнения
  const normalizeName = (name) => {
    if (!name || typeof name !== 'string') {
      return '';
    }
    
    return name
      .toLowerCase()
      .trim() // убираем пробелы в начале и конце
      .replace(/\s+/g, ' ') // заменяем множественные пробелы на одинарные
      .replace(/["""'']/g, '"') // нормализуем кавычки
      .replace(/[^\w\s\-:().а-яё]/g, '') // убираем специальные символы, оставляем кириллицу
      .replace(/\s+/g, ' ') // еще раз убираем лишние пробелы
      .trim();
  };

  // Проверка, является ли материал недостающим
  const isMaterialMissing = (itemName) => {
    const normalizedItemName = normalizeName(itemName);
    
    const isMissing = missingMaterials.some(missing => {
      const normalizedMissingName = normalizeName(missing.name);
      return normalizedMissingName === normalizedItemName;
    });
    
    return isMissing;
  };


  // Расчет финансовой аналитики
  const { price, profit, margin } = useMemo(() => {
    const price = costValue * (1 + markupPercentage / 100);
    const profit = price - costValue;
    const margin = (profit / price) * 100;
    
    return { price, profit, margin };
  }, [costValue, markupPercentage]);

  // Форматирование валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки заказа</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          <button 
            onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Вернуться к списку
          </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Заказ не найден</p>
          <button 
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          {/* Навигация */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Назад к заказам</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => navigate('/orders/create')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Создать новый заказ</span>
              </button>
              
              {order?.status === 'in_production' && (
                <button
                  onClick={() => navigate('/kanban')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-lg"
                >
                  <Kanban className="h-4 w-4" />
                  <span className="font-medium">Перейти к канбану</span>
                </button>
              )}
            </div>
          </div>

          {/* Основной заголовок с информацией о заказе */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  {/* QR-код в отдельном блоке */}
                  {order?.qr_code_id && (
                    <div className="flex-shrink-0">
                      <QRCodeImage 
                        qrCodeId={order.qr_code_id}
                        className="border rounded"
                        style={{width: '120px', height: '120px'}}
                        alt="QR-код заказа"
                      />
                    </div>
                  )}
                  
                  {/* Информация о заказе в отдельном блоке */}
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      Заказ #{order?.order_number || id}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mb-2">
                      {order?.customer_name || 'Клиент не указан'} • {order?.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : 'Дата не указана'}
                    </p>
                    
                    {/* Статус и приоритет под именем и датой */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Статус:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order?.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      order?.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                      order?.status === 'in_production' ? 'bg-orange-100 text-orange-800' :
                      order?.status === 'ready' ? 'bg-green-100 text-green-800' :
                      order?.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order?.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order?.status === 'new' ? 'Новый' :
                       order?.status === 'confirmed' ? 'Подтвержден' :
                       order?.status === 'in_production' ? 'В производстве' :
                       order?.status === 'ready' ? 'Готов' :
                       order?.status === 'shipped' ? 'Отправлен' :
                       order?.status === 'delivered' ? 'Доставлен' :
                       'Неизвестно'}
                    </span>
                  </div>
                  
                  {order?.priority && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Приоритет:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        order.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.priority === 'urgent' ? 'Срочный' :
                         order.priority === 'high' ? 'Высокий' :
                         order.priority === 'normal' ? 'Средний' :
                         'Низкий'}
                      </span>
                    </div>
                  )}

                  {order?.delivery_date && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Дедлайн:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {new Date(order.delivery_date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Действия с заказом */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Печать"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate(`/orders/${id}/specification`)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Спецификация"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Guide */}
        <OrderStatusGuide />

        <div className="grid grid-cols-1 xl:grid-cols-[1.618fr_1fr] gap-6 lg:gap-7">
          {/* Левая колонка */}
          <div className="space-y-6">
            {/* Позиции заказа */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
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
                      <th className="w-10">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" title="Нет на складе"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="В наличии"></div>
                          </div>
                        </div>
                      </th>
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
                            {checkMaterialsMutation.isLoading && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                <div className="animate-spin h-3 w-3 border border-blue-700 border-t-transparent rounded-full"></div>
                                Проверяем...
                              </div>
                            )}
                            {!checkMaterialsMutation.isLoading && isMissing && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium cursor-help"
                                title="Нет на складе"
                              >
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}
                            {!checkMaterialsMutation.isLoading && !isMissing && missingMaterials.length > 0 && (
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
                        {formatCurrency(costValue)}
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

                  <button
                    onClick={handleSaveItems}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Сохранить
                  </button>
                </>
              )}

              {/* Интерактивные карточки управления материалами */}
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
                    disabled={createPurchaseListMutation.isLoading}
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

            {/* Краткое описание */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-12">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                <h2 className="text-xl font-semibold text-gray-900">Краткое описание</h2>
                    <p className="text-sm text-gray-500">Детали и особенности заказа</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProject(!editingProject)}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {editingProject ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
              </div>

              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Введите краткое описание (название изделия + механизм + габариты)..."
                readOnly={!editingProject}
                className={`w-full px-4 py-3 text-sm border rounded-lg resize-y min-h-[120px] transition-all ${
                  editingProject 
                    ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                    : 'border-transparent bg-gray-50'
                }`}
              />

              {editingProject && (
                <button
                  onClick={handleSaveProject}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Сохранить описание
                </button>
              )}
            </div>

            {/* Подробное описание */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Подробное описание</h2>
                <button
                  onClick={() => setEditingProjectDescription(!editingProjectDescription)}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {editingProjectDescription ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
              </div>

              <textarea
                value={projectDescriptionForm.description}
                onChange={(e) => setProjectDescriptionForm({...projectDescriptionForm, description: e.target.value})}
                placeholder="Введите подробное описание проекта (материалы, цвет, размеры, особенности и т.п.)..."
                readOnly={!editingProjectDescription}
                className={`w-full px-4 py-3 text-sm border rounded-lg resize-y min-h-[120px] transition-all ${
                  editingProjectDescription 
                    ? 'border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200' 
                    : 'border-transparent bg-gray-50'
                }`}
              />

              {editingProjectDescription && (
                <button
                  onClick={handleSaveProjectDescription}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Сохранить описание
                </button>
              )}

              {/* Область загрузки файлов для подробного описания */}
              {editingProjectDescription && (
                <div 
                  className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragOverDescription 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                  }`}
                  onDragOver={handleDragOverDescription}
                  onDragLeave={handleDragLeaveDescription}
                  onDrop={handleDropDescription}
                  onClick={() => document.getElementById('fileInputDescription').click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    {isDragOverDescription ? 'Отпустите файлы для загрузки' : 'Перетащите чертежи сюда или нажмите для загрузки'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Поддерживаемые форматы: PDF, DWG, DXF, SKP, JPG, PNG
                  </p>
                  <input 
                    id="fileInputDescription"
                    type="file" 
                    multiple 
                    accept=".pdf,.dwg,.dxf,.skp,.jpg,.jpeg,.png"
                    onChange={handleFileInputDescription}
                    className="hidden" 
                  />
                </div>
              )}

              {/* Загруженные чертежи для подробного описания */}
              {editingProjectDescription && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Загруженные чертежи</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Имя файла</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Размер</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Загружающиеся файлы */}
                        {uploadingFilesDescription.map((file) => (
                          <tr key={file.id} className="border-b border-gray-50 bg-blue-50">
                            <td className="py-3 px-2 text-sm text-gray-900 flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full"></div>
                              {file.name}
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-500">{file.size}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgressDescription[file.id] || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 min-w-[35px]">
                                  {uploadProgressDescription[file.id] || 0}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Загруженные файлы */}
                        {uploadedFilesDescription.map((file) => (
                          <tr key={file.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 text-sm text-gray-900">{file.name}</td>
                            <td className="py-3 px-2 text-sm text-gray-500">{file.size}</td>
                            <td className="py-3 px-2">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleFileAction('download', file.id)}
                                  className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-all duration-200 hover:scale-110"
                                  title="Скачать"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleFileAction('view', file.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-all duration-200 hover:scale-110"
                                  title="Посмотреть"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleFileAction('delete', file.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Область загрузки файлов */}
              {editingProject && (
                <div 
                  className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragOver 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    {isDragOver ? 'Отпустите файлы для загрузки' : 'Перетащите чертежи сюда или нажмите для загрузки'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Поддерживаемые форматы: PDF, DWG, DXF, SKP, JPG, PNG
                  </p>
                  <input 
                    id="fileInput"
                    type="file" 
                    multiple 
                    accept=".pdf,.dwg,.dxf,.skp,.jpg,.jpeg,.png"
                    onChange={handleFileInput}
                    className="hidden" 
                  />
                </div>
              )}

              {/* Загруженные чертежи */}
              {editingProject && (
                <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Загруженные чертежи</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Имя файла</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Размер</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Загружающиеся файлы */}
                      {uploadingFiles.map((file) => (
                        <tr key={file.id} className="border-b border-gray-50 bg-blue-50">
                          <td className="py-3 px-2 text-sm text-gray-900 flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full"></div>
                            {file.name}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-500">{file.size}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[file.id] || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 min-w-[35px]">
                                {uploadProgress[file.id] || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Загруженные файлы */}
                      {uploadedFiles.map((file) => (
                        <tr key={file.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 text-sm text-gray-900">{file.name}</td>
                          <td className="py-3 px-2 text-sm text-gray-500">{file.size}</td>
                          <td className="py-3 px-2">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleFileAction('download', file.id)}
                                className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-all duration-200 hover:scale-110"
                                title="Скачать"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleFileAction('view', file.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-all duration-200 hover:scale-110"
                                title="Посмотреть"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleFileAction('delete', file.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>

            {/* Клиент и доставка */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
              </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Клиент и доставка</h2>
                    <p className="text-sm text-gray-500">Контактные данные и адрес доставки</p>
                    </div>
                    </div>
                <button
                  onClick={() => {
                    setEditingClient(!editingClient);
                    setEditingDelivery(!editingDelivery);
                  }}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Редактировать клиента и доставку"
                >
                  {(editingClient || editingDelivery) ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
                  </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Информация о клиенте */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Контактная информация</h3>
                </div>

                  <div className="space-y-3">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ФИО клиента</label>
                      {editingClient ? (
                        <input
                          type="text"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{clientForm.name}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                      {editingClient ? (
                        <input
                          type="tel"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{clientForm.phone}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {editingClient ? (
                        <input
                          type="email"
                          value={clientForm.email}
                          onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{clientForm.email}</div>
                      )}
                </div>
                
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                      {editingClient ? (
                        <input
                          type="text"
                          value={clientForm.company}
                          onChange={(e) => setClientForm({...clientForm, company: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{clientForm.company}</div>
                      )}
                    </div>
                    </div>

                  </div>

                {/* Информация о доставке */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-pink-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Доставка</h3>
                </div>
                
                  <div className="space-y-3">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Адрес доставки</label>
                      {editingDelivery ? (
                        <input
                          type="text"
                          value={deliveryForm.address}
                          onChange={(e) => setDeliveryForm({...deliveryForm, address: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{deliveryForm.address}</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                        {editingDelivery ? (
                          <input
                            type="text"
                            value={deliveryForm.floor}
                            onChange={(e) => setDeliveryForm({...deliveryForm, floor: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{deliveryForm.floor}</div>
                        )}
                    </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Есть лифт</label>
                        {editingDelivery ? (
                          <select
                            value={deliveryForm.hasLift ? 'true' : 'false'}
                            onChange={(e) => setDeliveryForm({...deliveryForm, hasLift: e.target.value === 'true'})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                          >
                            <option value="false">Нет</option>
                            <option value="true">Да</option>
                          </select>
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{deliveryForm.hasLift ? 'Да' : 'Нет'}</div>
                        )}
                  </div>
                </div>
                
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Примечания к доставке</label>
                      {editingDelivery ? (
                        <textarea
                          value={deliveryForm.notes}
                          onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">{deliveryForm.notes}</div>
                      )}
                      </div>
                      </div>
                    </div>
                  </div>

              {/* Общая кнопка сохранения */}
              {(editingClient || editingDelivery) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleSaveClient();
                      handleSaveDelivery();
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Сохранить изменения
                  </button>
                  </div>
                )}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-6 mt-8 mb-8">
            {/* Финансовая аналитика */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                <h2 className="text-xl font-semibold text-gray-900">Финансовая аналитика</h2>
                  <p className="text-sm text-gray-500">Расчеты и маржинальность</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200 hover:shadow-lg transition-all hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Себестоимость</h3>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(costValue)}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center border border-green-200 hover:shadow-lg transition-all hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Цена продажи</h3>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(price)}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 text-center border border-emerald-200 hover:shadow-lg transition-all hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-emerald-700 mb-2">Прибыль</h3>
                  <div className="text-2xl font-bold text-emerald-900">{formatCurrency(profit)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center border border-purple-200 hover:shadow-lg transition-all hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Маржа</h3>
                  <div className="text-2xl font-bold text-purple-900">{margin.toFixed(1)}%</div>
                </div>
              </div>

              {/* Ползунок наценки */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Уровень наценки</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={markupPercentage}
                    onChange={(e) => setMarkupPercentage(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500">200%</span>
                  <span className="min-w-[50px] text-center font-semibold text-teal-600 text-sm">
                    {markupPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Финансы */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Финансы</h2>
                    <p className="text-sm text-gray-500">Платежи и расчеты</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingFinance(!editingFinance)}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {editingFinance ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сумма сделки (₽)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                    value={financialForm.totalAmount}
                    onChange={(e) => handleFinancialChange('totalAmount', parseFloat(e.target.value) || 0)}
                    readOnly={!editingFinance}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата предоплаты</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.prepaymentDate}
                    onChange={(e) => handleFinancialChange('prepaymentDate', e.target.value)}
                    readOnly={!editingFinance}
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
                    readOnly={!editingFinance}
                  />
                </div>
              </div>
              
              <div className="mt-4">
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
                  disabled={!editingFinance}
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
                      disabled={!editingFinance}
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

              {/* Расширенные поля финпараметров */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.paymentMethod}
                    onChange={(e) => handleFinancialChange('paymentMethod', e.target.value)}
                    disabled={!editingFinance}
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
                    readOnly={!editingFinance}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата фин. оплаты</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={financialForm.finalPaymentDate}
                    onChange={(e) => handleFinancialChange('finalPaymentDate', e.target.value)}
                    readOnly={!editingFinance}
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
                    readOnly={!editingFinance}
                  />
                </div>
              </div>

              {editingFinance && (
                <button
                  onClick={handleSaveFinance}
                  className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Сохранить финансы
                </button>
              )}
            </div>


            {/* Статус и дедлайн заказа */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Статус и дедлайн</h2>
                    <p className="text-sm text-gray-500">Состояние заказа и сроки</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDeadline(!editingDeadline)}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Редактировать дедлайн"
                >
                  {editingDeadline ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Статус заказа */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Статус заказа</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Текущий статус</label>
                  <select
                    value={order?.status || ''}
                    onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="new">Новый</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="in_production">В производстве</option>
                    <option value="ready">Готов</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
              </div>
            </div>

            {/* Дедлайн заказа */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Дедлайн</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата дедлайна</label>
                  {editingDeadline ? (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={deadlineForm.deadline}
                        onChange={(e) => setDeadlineForm({...deadlineForm, deadline: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      />
                    </div>
                  ) : (
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {deadlineForm.deadline ? new Date(deadlineForm.deadline).toLocaleDateString('ru-RU') : 'Не установлен'}
                    </div>
                  )}
              </div>

              {editingDeadline && (
                <button
                  onClick={handleSaveDeadline}
                  className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить дедлайн
                </button>
              )}
            </div>
                </div>
              </div>

            {/* Действия с заказом */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Kanban className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Действия</h2>
                  <p className="text-sm text-gray-500">Управление заказом</p>
                </div>
                </div>

              {/* Кнопки действий в ряд */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 p-3 rounded-lg transition-all bg-teal-50 border border-teal-200 hover:bg-teal-100"
                >
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">Создать договор</span>
                </button>

                <button
                  onClick={() => navigate(`/orders/${id}/specification`)}
                  className="flex items-center gap-2 p-3 rounded-lg transition-all bg-blue-50 border border-blue-200 hover:bg-blue-100"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Заказ-наряд</span>
                </button>
                
                {order?.status === 'in_production' && (
                <button
                    onClick={() => navigate('/kanban')}
                    className="flex items-center gap-2 p-3 rounded-lg transition-all bg-green-50 border border-green-200 hover:bg-green-100 col-span-2"
                >
                    <Kanban className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Открыть канбан</span>
                </button>
              )}
            </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0ea5a5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #e2e8f0;
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

    </div>
  );
};

export default OrderDetail;