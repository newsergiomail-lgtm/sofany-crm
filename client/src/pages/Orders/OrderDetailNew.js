import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Edit, Trash2, X, FileText } from 'lucide-react';
import { ordersAPI, customersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import SimpleQRCodeGenerator from '../../components/Production/SimpleQRCodeGenerator';
import OrderPositionsTableNew from '../../components/Orders/OrderPositionsTableNew';
import toast from 'react-hot-toast';

const OrderDetailNew = () => {
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
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error);
      setError('Ошибка загрузки заказа');
      toast.error('Ошибка загрузки заказа');
    } finally {
      setIsLoading(false);
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
      toast.success('Заказ успешно обновлен');
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка сохранения заказа:', error);
      toast.error('Ошибка сохранения заказа');
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
    toast.success(`Загружено файлов: ${files.length}`);
  };

  const handleFileRemove = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('Файл удален');
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

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await ordersAPI.delete(id);
        toast.success('Заказ удален');
        navigate('/orders');
      } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        toast.error('Ошибка удаления заказа');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setOrder(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Ошибка загрузки заказа</div>
        <p className="text-gray-600 mb-4">{error || 'Заказ не найден'}</p>
        <div className="space-x-4">
          <button
            onClick={loadOrder}
            className="btn btn-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </button>
          <Link to="/orders" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к заказам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link
                  to="/orders"
                  className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 group"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                </Link>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Заказ {order.order_number}
                    </h1>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusOptions.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusOptions.find(s => s.value === order.status)?.label || order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {isEditing ? 'Редактирование заказа' : 'Просмотр заказа'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {!isEditing ? (
                  <>
                    <Link
                      to={`/orders/${id}/work-order`}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Заказ-наряд
                    </Link>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Редактировать
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Удалить
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        loadOrder();
                      }}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Отмена
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - основная информация */}
          <div className="lg:col-span-2 space-y-8">
            {/* Статус и приоритет */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Статус и приоритет
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Статус
                  </label>
                  {isEditing ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full ${statusOptions.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusOptions.find(s => s.value === order.status)?.label || order.status}
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
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full ${priorityOptions.find(p => p.value === order.priority)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {priorityOptions.find(p => p.value === order.priority)?.label || order.priority}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Информация о клиенте */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Информация о клиенте
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Клиент
                  </label>
                  {isEditing ? (
                    <select
                      value={order.customer_id || ''}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                    >
                      <option value="">Выберите клиента</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(order.customer_name || 'Н').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.customer_name || 'Не указан'}
                      </p>
                    </div>
                  )}
                </div>
                
                {order.customer_email && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">{order.customer_email}</p>
                    </div>
                  </div>
                )}
                
                {order.customer_phone && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Телефон
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">{order.customer_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Информация о продукте */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Информация о продукте
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Название продукта
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={order.product_name || ''}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      placeholder="Введите название продукта"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.product_name || 'Не указан'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Описание проекта
                  </label>
                  {isEditing ? (
                    <textarea
                      value={order.project_description || ''}
                      onChange={(e) => handleInputChange('project_description', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Введите описание проекта"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {order.project_description || 'Не указано'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Финансовая информация */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Финансовая информация
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Общая сумма
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={order.total_amount || ''}
                      onChange={(e) => handleInputChange('total_amount', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {order.total_amount ? `${order.total_amount} ₽` : '0 ₽'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Оплаченная сумма
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={order.paid_amount || ''}
                      onChange={(e) => handleInputChange('paid_amount', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {order.paid_amount ? `${order.paid_amount} ₽` : '0 ₽'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Заметки */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Заметки
                </h3>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Заметки к заказу
                </label>
                {isEditing ? (
                  <textarea
                    value={order.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Введите заметки к заказу"
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
          </div>

          {/* Правая колонка - дополнительная информация */}
          <div className="space-y-8">
            {/* Информация о доставке */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Доставка
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Дата доставки
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={order.delivery_date ? order.delivery_date.split('T')[0] : ''}
                      onChange={(e) => handleInputChange('delivery_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Не указана'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Адрес доставки
                  </label>
                  {isEditing ? (
                    <textarea
                      value={order.delivery_address || ''}
                      onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Введите адрес доставки"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {order.delivery_address || 'Не указан'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Этаж
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={order.floor || ''}
                        onChange={(e) => handleInputChange('floor', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder="Введите этаж"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">
                        {order.floor || 'Не указан'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Есть лифт
                    </label>
                    {isEditing ? (
                      <select
                        value={order.has_elevator ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('has_elevator', e.target.value === 'true')}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="false">Нет</option>
                        <option value="true">Да</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${order.has_elevator ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {order.has_elevator ? 'Да' : 'Нет'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Заметки по доставке
                  </label>
                  {isEditing ? (
                    <textarea
                      value={order.delivery_notes || ''}
                      onChange={(e) => handleInputChange('delivery_notes', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Введите заметки по доставке"
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {order.delivery_notes || 'Заметки отсутствуют'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>


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
                      id="file-upload-detail"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload-detail"
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
                    htmlFor="file-upload-detail"
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

            {/* Системная информация */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Системная информация
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">ID заказа:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{order.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Создан:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')} в {new Date(order.created_at).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Обновлен:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(order.updated_at).toLocaleDateString('ru-RU')} в {new Date(order.updated_at).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Создал:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{order.created_by_name || 'Не указан'}</span>
                </div>
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
    </div>
  );
};

export default OrderDetailNew;






