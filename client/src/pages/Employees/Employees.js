import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search,
  Edit, 
  Trash2, 
  UserPlus,
  Building,
  Briefcase,
  Eye,
  Calculator,
  FileText,
  ArrowRight
} from 'lucide-react';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        // Закрытие выпадающих меню
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    position: '',
    department: '',
    employee_number: '',
    phone: '',
    email: '',
    hire_date: ''
  });

  // Загрузка данных
  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, []);

  const loadEmployees = async (page = 1, search = '', department = '', position = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Строим параметры запроса
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (position) params.append('position', position);
      
      // Строим URL вручную для правильного кодирования
      let url = `/api/employees?page=${page}&limit=${itemsPerPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (position) url += `&position=${encodeURIComponent(position)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // API возвращает объект с полем employees и pagination
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setTotalItems(data.pagination?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки отделов:', error);
      setDepartments([]);
    }
  };

  const loadPositions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees/positions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки должностей:', error);
      setPositions([]);
    }
  };

  const handleEditPosition = (position) => {
    setEditingPosition(position);
    setIsCreatingPosition(false);
    setShowPositionModal(true);
  };

  const handleCreatePosition = () => {
    setEditingPosition({
      name: '',
      payment_type: 'piecework',
      base_rate: 0
    });
    setIsCreatingPosition(true);
    setShowPositionModal(true);
  };

  const handleSavePosition = async () => {
    try {
      let response;
      
      if (isCreatingPosition) {
        // Создаем новую должность
        response = await fetch('/api/employees/positions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: editingPosition.name,
            payment_type: editingPosition.payment_type,
            base_rate: editingPosition.base_rate
          })
        });
      } else {
        // Обновляем существующую должность
        response = await fetch(`/api/employees/positions/${encodeURIComponent(editingPosition.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            payment_type: editingPosition.payment_type,
            base_rate: editingPosition.base_rate
          })
        });
      }

      if (response.ok) {
        await loadPositions();
        await loadEmployees(currentPage, searchTerm, selectedDepartment);
        setShowPositionModal(false);
        setEditingPosition(null);
        setIsCreatingPosition(false);
        alert(isCreatingPosition ? 'Должность создана!' : 'Тип оплаты обновлен!');
      } else {
        const error = await response.json();
        alert('Ошибка: ' + error.message);
      }
    } catch (error) {
      console.error('Ошибка сохранения должности:', error);
      alert('Ошибка сохранения должности');
    }
  };

  // Обработчики фильтров
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    const departmentName = selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : '';
    loadEmployees(1, value, departmentName, '');
  };

  const handleDepartmentFilter = (value) => {
    setSelectedDepartment(value);
    setCurrentPage(1);
    const departmentName = value ? departments.find(d => d.id === value)?.name : '';
    loadEmployees(1, searchTerm, departmentName, '');
  };

  // Обработчик пагинации
  const handlePageChange = (page) => {
    const departmentName = selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : '';
    loadEmployees(page, searchTerm, departmentName, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingEmployee 
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';
      
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
          first_name: '',
          last_name: '',
          middle_name: '',
          position: '',
          department: '',
          employee_number: '',
          phone: '',
          email: '',
          hire_date: ''
        });
        const departmentName = selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : '';
        loadEmployees(currentPage, searchTerm, departmentName, '');
      }
    } catch (error) {
      console.error('Ошибка сохранения сотрудника:', error);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    
    // Преобразуем дату в формат YYYY-MM-DD для input type="date"
    let formattedHireDate = '';
    if (employee.hire_date) {
      const date = new Date(employee.hire_date);
      formattedHireDate = date.toISOString().split('T')[0];
    }
    
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      middle_name: employee.middle_name || '',
      position: employee.position || '',
      department: employee.department || '',
      employee_number: employee.employee_number || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hire_date: formattedHireDate
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите деактивировать сотрудника?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const departmentName = selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : '';
        loadEmployees(currentPage, searchTerm, departmentName, '');
      } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
      }
    }
  };

  const handleQuickView = (employee) => {
    setQuickViewEmployee(employee);
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      'piecework': 'Сдельная',
      'hourly': 'Почасовая',
      'salary': 'Оклад',
      'salary_bonus': 'Оклад + %'
    };
    return labels[type] || type;
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      'piecework': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'hourly': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'salary': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'salary_bonus': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Вычисляем данные для пагинации
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center">
            <Users className="h-8 w-8 mr-3 text-sofany-500 dark:text-sofany-400" />
            Сотрудники
          </h1>
          <p className="page-subtitle">
            Управление персоналом и учет рабочего времени
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreatePosition}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Добавить должность
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary btn-md flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Добавить сотрудника
          </button>
        </div>
      </div>

      {/* Кнопки зарплат */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          onClick={() => navigate('/simple-work')}
          className="group cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Calculator className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Зарплаты сотрудников</h3>
                <p className="text-blue-100 text-sm">Учет рабочего времени и расчет зарплат</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/payroll-reports')}
          className="group cursor-pointer bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Отчеты по зарплатам</h3>
                <p className="text-green-100 text-sm">Детальная аналитика и отчеты</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск по имени, фамилии или табельному номеру..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentFilter(e.target.value)}
                className="select-simple"
              >
                <option value="">Все отделы</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица сотрудников */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Отдел
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Должность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Тип оплаты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Дата приема
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-sofany-100 dark:bg-sofany-900/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-sofany-600 dark:text-sofany-400">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {employee.last_name} {employee.first_name} {employee.middle_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.employee_number && `№ ${employee.employee_number}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{employee.department || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{employee.position || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeColor(employee.payment_type)}`}>
                          {getPaymentTypeLabel(employee.payment_type)}
                        </span>
                        <button
                          onClick={() => {
                            const position = positions.find(p => p.name === employee.position);
                            if (position) {
                              handleEditPosition({
                                name: position.name,
                                payment_type: position.payment_type || 'piecework',
                                base_rate: position.base_rate || 0
                              });
                            }
                          }}
                          className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
                          title="Изменить тип оплаты"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {employee.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickView(employee)}
                          className="icon-action icon-action-primary"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="icon-action icon-action-success"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="icon-action icon-action-danger"
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
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Показано {startIndex}-{endIndex} из {totalItems} сотрудников
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Назад
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Фамилия</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Имя</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Отчество</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Отдел</label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    >
                      <option value="">Выберите отдел</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Должность</label>
                    <select
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    >
                      <option value="">Выберите должность</option>
                      {positions.map(pos => (
                        <option key={pos.id} value={pos.name}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Табельный номер</label>
                  <input
                    type="text"
                    value={formData.employee_number}
                    onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата приема</label>
                  <input
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingEmployee(null);
                      setFormData({
                        first_name: '',
                        last_name: '',
                        middle_name: '',
                        position: '',
                        department: '',
                        employee_number: '',
                        phone: '',
                        email: '',
                        hire_date: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mr-3"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingEmployee ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно быстрого просмотра */}
      {quickViewEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Информация о сотруднике
                </h3>
                <button
                  onClick={() => setQuickViewEmployee(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    <div className="h-16 w-16 rounded-full bg-sofany-100 dark:bg-sofany-900/20 flex items-center justify-center">
                      <span className="text-lg font-medium text-sofany-600 dark:text-sofany-400">
                        {quickViewEmployee.first_name[0]}{quickViewEmployee.last_name[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {quickViewEmployee.last_name} {quickViewEmployee.first_name} {quickViewEmployee.middle_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {quickViewEmployee.employee_number && `Табельный номер: ${quickViewEmployee.employee_number}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Отдел
                    </label>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {quickViewEmployee.department_name || 'Не указан'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Должность
                    </label>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {quickViewEmployee.position_name || 'Не указана'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Тип оплаты
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeColor(quickViewEmployee.payment_type)}`}>
                      {getPaymentTypeLabel(quickViewEmployee.payment_type)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Статус
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      quickViewEmployee.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {quickViewEmployee.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Дата приема
                    </label>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {quickViewEmployee.hire_date ? new Date(quickViewEmployee.hire_date).toLocaleDateString('ru-RU') : '—'}
                    </span>
                  </div>
                  
                  {quickViewEmployee.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Телефон
                      </label>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {quickViewEmployee.phone}
                      </span>
                    </div>
                  )}
                  
                  {quickViewEmployee.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {quickViewEmployee.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setQuickViewEmployee(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    setQuickViewEmployee(null);
                    handleEdit(quickViewEmployee);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для изменения типа оплаты должности */}
      {showPositionModal && editingPosition && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {isCreatingPosition ? 'Добавить новую должность' : `Изменить тип оплаты: ${editingPosition.name}`}
              </h3>
              
              <div className="space-y-4">
                {isCreatingPosition && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Название должности
                    </label>
                    <input
                      type="text"
                      value={editingPosition.name}
                      onChange={(e) => setEditingPosition({
                        ...editingPosition,
                        name: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Введите название должности"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Тип оплаты
                  </label>
                  <select
                    value={editingPosition.payment_type}
                    onChange={(e) => setEditingPosition({
                      ...editingPosition,
                      payment_type: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="piecework">Сдельная</option>
                    <option value="hourly">Почасовая</option>
                    <option value="salary">Оклад</option>
                    <option value="salary_bonus">Оклад + %</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Базовая ставка (₽)
                  </label>
                  <input
                    type="number"
                    value={editingPosition.base_rate}
                    onChange={(e) => setEditingPosition({
                      ...editingPosition,
                      base_rate: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Введите базовую ставку"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPositionModal(false);
                    setEditingPosition(null);
                    setIsCreatingPosition(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSavePosition}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isCreatingPosition ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

