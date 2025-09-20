import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Building2, 
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
} from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [quickViewSupplier, setQuickViewSupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customSelectOpen, setCustomSelectOpen] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    is_active: true
  });

  // Устанавливаем токен если его нет
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Автоматически логинимся и устанавливаем токен
      fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@sofany.com',
          password: 'admin123'
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Токен установлен автоматически');
          setTokenReady(true);
        }
      })
      .catch(error => {
        console.error('Ошибка установки токена:', error);
      });
      } else {
      setTokenReady(true);
    }
  }, []);

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setCustomSelectOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        is_active: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const url = `http://localhost:5000/api/suppliers?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки поставщиков:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const totalSuppliers = data.suppliers.length;
        const activeSuppliers = data.suppliers.filter(s => s.is_active).length;
        const inactiveSuppliers = totalSuppliers - activeSuppliers;

        setAnalytics({
          total: totalSuppliers,
          active: activeSuppliers,
          inactive: inactiveSuppliers
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    }
  };

  useEffect(() => {
    // Загружаем данные только когда токен готов
    if (tokenReady) {
    loadSuppliers();
    loadAnalytics();
    }
  }, [tokenReady, currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  // Принудительная загрузка при монтировании компонента
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenReady && suppliers.length === 0) {
        loadSuppliers();
        loadAnalytics();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [tokenReady]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setCustomSelectOpen(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCustomSelectOpen(null);
  };

  const handleQuickView = (supplier) => {
    setQuickViewSupplier(supplier);
  };

  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editSupplier ? `http://localhost:5000/api/suppliers/${editSupplier.id}` : 'http://localhost:5000/api/suppliers';
      const method = editSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        loadSuppliers();
        loadAnalytics();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка сохранения поставщика');
      }
    } catch (error) {
      console.error('Ошибка сохранения поставщика:', error);
      alert('Ошибка сохранения поставщика');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadSuppliers();
        loadAnalytics();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка удаления поставщика');
      }
    } catch (error) {
      console.error('Ошибка удаления поставщика:', error);
      alert('Ошибка удаления поставщика');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Поставщики</h1>
          <p className="page-subtitle">Управление поставщиками материалов</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary btn-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить поставщика
        </button>
      </div>

      {/* Аналитика */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего поставщиков</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Активные</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.active}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-red-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Неактивные</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, контакту, email..."
              value={searchTerm}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>
          
          <div className="custom-select">
            <div
              className="select-selected"
              onClick={() => setCustomSelectOpen(prev => prev === 'status' ? null : 'status')}
            >
              {statusFilter === 'true' ? 'Активные' :
               statusFilter === 'false' ? 'Неактивные' : 'Все статусы'}
            </div>
            {customSelectOpen === 'status' && (
              <div className="select-items active">
                <div
                  className="select-item"
                  onClick={() => handleStatusFilter('')}
                >
                  Все статусы
                </div>
                <div
                  className="select-item"
                  onClick={() => handleStatusFilter('true')}
                >
                  Активные
                </div>
                <div
                  className="select-item"
                  onClick={() => handleStatusFilter('false')}
                >
                  Неактивные
                </div>
              </div>
            )}
          </div>

          <div className="custom-select">
            <div
              className="select-selected"
              onClick={() => setCustomSelectOpen(prev => prev === 'sort' ? null : 'sort')}
            >
              {sortBy === 'name' && sortOrder === 'asc' ? 'Название (А-Я)' :
               sortBy === 'name' && sortOrder === 'desc' ? 'Название (Я-А)' :
               sortBy === 'created_at' && sortOrder === 'asc' ? 'Дата создания (старые)' :
               sortBy === 'created_at' && sortOrder === 'desc' ? 'Дата создания (новые)' : 'Сортировка'}
            </div>
            {customSelectOpen === 'sort' && (
              <div className="select-items active">
                <div
                  className="select-item"
                  onClick={() => handleSort('name')}
                >
                  Название (А-Я)
                </div>
                <div
                  className="select-item"
                  onClick={() => handleSort('name')}
                >
                  Название (Я-А)
                </div>
                <div
                  className="select-item"
                  onClick={() => handleSort('created_at')}
                >
                  Дата создания (новые)
                </div>
                <div
                  className="select-item"
                  onClick={() => handleSort('created_at')}
                >
                  Дата создания (старые)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Таблица поставщиков */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Поставщик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Контакт
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Создан
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {!tokenReady ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Инициализация...
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Загрузка...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Поставщики не найдены
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {supplier.name}
                          </div>
                          {supplier.website && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <Globe className="inline h-3 w-3 mr-1" />
                              {supplier.website}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {supplier.contact_person && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            {supplier.contact_person}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {supplier.email && (
                          <div className="flex items-center mb-1">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {supplier.is_active ? 'Активный' : 'Неактивный'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(supplier.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuickView(supplier)}
                          className="icon-action icon-action-primary"
                          title="Быстрый просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="icon-action icon-action-secondary"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="icon-action icon-action-danger"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Страница {currentPage} из {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary btn-sm disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary btn-sm disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editSupplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input"
                    placeholder="Название поставщика"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Контактное лицо
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="input"
                    placeholder="ФИО контактного лица"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input"
                    placeholder="+7-999-123-45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Адрес
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder="Адрес поставщика"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Веб-сайт
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Заметки
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input"
                    rows="3"
                    placeholder="Дополнительная информация"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Активный поставщик
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary btn-sm"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-sm"
                  >
                    {editSupplier ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно быстрого просмотра */}
      {quickViewSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Информация о поставщике
                </h3>
                <button
                  onClick={() => setQuickViewSupplier(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {quickViewSupplier.name}
                  </h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                    quickViewSupplier.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {quickViewSupplier.is_active ? 'Активный' : 'Неактивный'}
                  </span>
                </div>

                {quickViewSupplier.contact_person && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Контактное лицо</h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{quickViewSupplier.contact_person}</p>
                  </div>
                )}

                {quickViewSupplier.email && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{quickViewSupplier.email}</p>
                  </div>
                )}

                {quickViewSupplier.phone && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Телефон</h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{quickViewSupplier.phone}</p>
                  </div>
                )}

                {quickViewSupplier.address && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Адрес</h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{quickViewSupplier.address}</p>
                  </div>
                )}

                {quickViewSupplier.website && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Веб-сайт</h5>
                    <a 
                      href={quickViewSupplier.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {quickViewSupplier.website}
                    </a>
                  </div>
                )}

                {quickViewSupplier.notes && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Заметки</h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{quickViewSupplier.notes}</p>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</h5>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(quickViewSupplier.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
