import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Edit, Trash2, X, FileText, Calendar, Clock, Printer } from 'lucide-react';
import { ordersAPI, customersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import SimpleQRCodeGenerator from '../../components/Production/SimpleQRCodeGenerator';
import OrderPositionsTableNew from '../../components/Orders/OrderPositionsTableNew';
import WorkOrderPrintComponent from '../../components/Orders/WorkOrderPrintComponent';
import toast from 'react-hot-toast';

const OrderWorkOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const statusOptions = [
    { value: 'new', label: 'Новый', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Завершен', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Отменен', color: 'bg-red-100 text-red-800' },
    { value: 'in_production', label: 'В производстве', color: 'bg-purple-100 text-purple-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: 'bg-gray-100 text-gray-800' },
    { value: 'normal', label: 'Обычный', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Высокий', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Срочный', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadOrder();
    loadCustomers();
  }, [id]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getById(id);
      setOrder(response);
      setOrderItems(response.items || []);
      await loadDrawings();
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error);
      setError('Ошибка загрузки заказа');
      toast.error('Ошибка загрузки заказа');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrawings = async () => {
    try {
      const response = await fetch(`/api/orders/${id}/drawings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const files = data.files.map(file => ({
          id: file.id,
          name: file.original_name || file.filename,
          size: file.size,
          type: file.file_type,
          uploadDate: new Date(file.created_at).toLocaleString('ru-RU')
        }));
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Ошибка загрузки чертежей:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 1000 });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ordersAPI.update(id, order);
      toast.success('Заказ-наряд успешно обновлен');
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка сохранения заказа-наряда:', error);
      toast.error('Ошибка сохранения заказа-наряда');
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemsChange = async (newItems) => {
    try {
      setOrderItems(newItems);
      // Обновляем заказ с новыми позициями
      const updatedOrder = { ...order, items: newItems };
      await ordersAPI.update(id, updatedOrder);
      setOrder(updatedOrder);
      toast.success('Позиции заказа обновлены');
    } catch (error) {
      console.error('Ошибка обновления позиций:', error);
      toast.error('Ошибка обновления позиций заказа');
    }
  };

  // Обработчики для работы с файлами
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    await uploadFilesToServer(files);
  };

  const uploadFilesToServer = async (files) => {
    if (!files || files.length === 0) return;

    // Фильтруем только разрешенные типы файлов
    const allowedTypes = ['.pdf', '.dwg', '.dxf', '.skp', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast.error('Некоторые файлы имеют неподдерживаемый формат');
    }

    if (validFiles.length === 0) return;

    // Загружаем каждый файл на сервер
    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('drawing', file);

        const response = await fetch(`/api/orders/${id}/drawings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          const newFile = {
            id: result.drawing.id,
            name: result.drawing.file_name,
            size: result.drawing.file_size,
            type: result.drawing.file_type,
            uploadDate: new Date().toLocaleString('ru-RU')
          };
          setUploadedFiles(prev => [...prev, newFile]);
        } else {
          throw new Error('Ошибка загрузки файла');
        }
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        toast.error(`Ошибка загрузки файла ${file.name}`);
      }
    }

    toast.success(`Загружено файлов: ${validFiles.length}`);
  };

  const handleFileRemove = async (fileId) => {
    try {
      const response = await fetch(`/api/orders/${id}/drawings/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        toast.success('Файл удален');
      } else {
        throw new Error('Ошибка удаления файла');
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      toast.error('Ошибка удаления файла');
    }
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    toast.success('Все файлы удалены');
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

  // Обработчики drag & drop
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
    uploadFilesToServer(files);
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityInfo = (priority) => {
    return priorityOptions.find(p => p.value === priority) || { label: priority, color: 'bg-gray-100 text-gray-800' };
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
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Вернуться к заказам
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Заказ не найден</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Вернуться к заказам
        </button>
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
                  onClick={() => navigate(`/orders/${id}`)}
                  className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 group"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                </button>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Заказ-наряд
                    </h1>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      #{order.order_number}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Производственный документ для заказа
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPrintView(!showPrintView)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {showPrintView ? 'Вернуться' : 'Печать'}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Отменить' : 'Редактировать'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        {showPrintView ? (
          <WorkOrderPrintComponent 
            order={order}
            orderItems={orderItems}
            uploadedFiles={uploadedFiles}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - основная информация */}
          <div className="lg:col-span-2 space-y-8">
            {/* Статус и приоритет */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Статус и приоритет
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Статус заказа
                  </label>
                  {isEditing ? (
                    <select
                      value={order.status}
                      onChange={(e) => setOrder({ ...order, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusInfo(order.status).color}`}>
                        {getStatusInfo(order.status).label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Приоритет
                  </label>
                  {isEditing ? (
                    <select
                      value={order.priority}
                      onChange={(e) => setOrder({ ...order, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityInfo(order.priority).color}`}>
                        {getPriorityInfo(order.priority).label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Информация о продукте */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Информация о продукте
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Название продукта
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={order.product_name || ''}
                      onChange={(e) => setOrder({ ...order, product_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {order.product_name || 'Не указано'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Описание проекта
                  </label>
                  {isEditing ? (
                    <textarea
                      value={order.project_description || ''}
                      onChange={(e) => setOrder({ ...order, project_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Введите описание проекта"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {order.project_description || 'Описание отсутствует'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Заметки */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Заметки
                </h3>
              </div>
              <div>
                {isEditing ? (
                  <textarea
                    value={order.notes || ''}
                    onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                    placeholder="Введите заметки по заказу"
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-gray-900 dark:text-white leading-relaxed">
                      {order.notes || 'Заметки отсутствуют'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Доставка с дедлайном */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Доставка
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Адрес доставки
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={order.delivery_address || ''}
                      onChange={(e) => setOrder({ ...order, delivery_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Введите адрес доставки"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white">
                        {order.delivery_address || 'Адрес не указан'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Дедлайн (обязательно)
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={order.delivery_date ? order.delivery_date.split('T')[0] : ''}
                      onChange={(e) => setOrder({ ...order, delivery_date: e.target.value + 'T00:00:00.000Z' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Дедлайн не установлен'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-8">
            {/* QR-код */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  QR-код заказа
                </h3>
              </div>
              <div className="text-center">
                <SimpleQRCodeGenerator 
                  orderId={order.id} 
                  orderNumber={order.order_number} 
                />
              </div>
            </div>

            {/* Загрузка файлов */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Чертежи и файлы
                </h3>
              </div>
              <div className="space-y-4">
                {/* Область загрузки */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload-workorder').click()}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isDragOver ? 'Отпустите файлы для загрузки' : 'Перетащите файлы сюда'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isDragOver ? '' : 'или нажмите для выбора'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Поддерживаются: PDF, DWG, DXF, JPG, PNG, DOC, DOCX
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      id="file-upload-workorder"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload-workorder"
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
                    htmlFor="file-upload-workorder"
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
            {/* Позиции заказа - на всю ширину */}
            <div className="mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Позиции заказа
                  </h3>
                </div>
                <OrderPositionsTableNew
                  items={orderItems}
                  totalAmount={order?.total_amount || 0}
                  onItemsChange={handleItemsChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderWorkOrder;


