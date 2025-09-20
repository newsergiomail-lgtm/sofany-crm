import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Package, Calculator, Clock, Plus, QrCode, Download, X, Building2, Search } from 'lucide-react';
import QRScanner from '../../components/QRScanner';
import NotificationSystem from '../../components/NotificationSystem';
import FilterSelect from '../../components/FilterSelect';
import { exportWorkRecords, exportPayroll, exportOperations, exportEmployees, exportAnalytics } from '../../components/ExcelExport';

const SimpleWork = () => {
  const [orders, setOrders] = useState([]);
  const [operations, setOperations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [payroll, setPayroll] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [analytics, setAnalytics] = useState({});
  
  // Форма
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Модальные окна
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [operationTemplates, setOperationTemplates] = useState([]);
  const [editingOperation, setEditingOperation] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Фильтры
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // Формы для модальных окон
  const [operationForm, setOperationForm] = useState({ name: '', price_per_unit: '', department: '', time_norm_minutes: 0 });
  const [employeeForm, setEmployeeForm] = useState({ first_name: '', last_name: '', department: '', position: '' });

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  // Перезагрузка зарплат при изменении фильтров
  useEffect(() => {
    loadPayroll();
  }, [selectedMonth, selectedDepartment]);

  const loadData = async () => {
    try {
      const [ordersRes, operationsRes, employeesRes, departmentsRes, positionsRes, workRes, analyticsRes] = await Promise.all([
        fetch('/api/simple-work/orders'),
        fetch('/api/simple-work/operations'),
        fetch('/api/simple-work/employees'),
        fetch('/api/simple-work/departments'),
        fetch('/api/simple-work/positions'),
        fetch('/api/simple-work/work'),
        fetch('/api/simple-work/analytics/overview')
      ]);

      setOrders(await ordersRes.json());
      setOperations(await operationsRes.json());
      setEmployees(await employeesRes.json());
      setDepartments(await departmentsRes.json());
      setPositions(await positionsRes.json());
      setWorkRecords(await workRes.json());
      setAnalytics(await analyticsRes.json());
      
      // Загружаем зарплаты с фильтрами
      await loadPayroll();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const loadPayroll = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedDepartment) params.append('department', selectedDepartment.name);
      
      const response = await fetch(`/api/simple-work/payroll?${params.toString()}`);
      const data = await response.json();
      setPayroll(data);
    } catch (error) {
      console.error('Ошибка загрузки зарплат:', error);
    }
  };

  // Сохранение работы
  const saveWork = async () => {
    if (!selectedOrder || !selectedOperation || !selectedEmployee || !quantity) {
      alert('Заполните все обязательные поля!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/simple-work/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder,
          operation_id: selectedOperation,
          employee_id: selectedEmployee,
          quantity: parseInt(quantity),
          start_time: startTime || null,
          end_time: endTime || null
        })
      });

      if (response.ok) {
        alert('Работа записана! Зарплата обновлена автоматически.');
        setSelectedOrder('');
        setSelectedOperation('');
        setSelectedEmployee('');
        setQuantity('');
        setStartTime('');
        setEndTime('');
        loadData(); // Перезагружаем данные
      } else {
        alert('Ошибка при сохранении работы');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении работы');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение операции
  const saveOperation = async () => {
    try {
      const url = editingOperation ? `/api/simple-work/operations/${editingOperation.id}` : '/api/simple-work/operations';
      const method = editingOperation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationForm)
      });

      if (response.ok) {
        alert(editingOperation ? 'Операция обновлена!' : 'Операция добавлена!');
        setShowOperationModal(false);
        setEditingOperation(null);
        setOperationForm({ name: '', price_per_unit: '', department: '', time_norm_minutes: 0 });
        loadData();
      } else {
        alert('Ошибка при сохранении операции');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении операции');
    }
  };

  // Сохранение сотрудника
  const saveEmployee = async () => {
    try {
      const url = editingEmployee ? `/api/simple-work/employees/${editingEmployee.id}` : '/api/simple-work/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm)
      });

      if (response.ok) {
        alert(editingEmployee ? 'Сотрудник обновлен!' : 'Сотрудник добавлен!');
        setShowEmployeeModal(false);
        setEditingEmployee(null);
        setEmployeeForm({ first_name: '', last_name: '', department: '', position: '' });
        loadData();
      } else {
        alert('Ошибка при сохранении сотрудника');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении сотрудника');
    }
  };

  // Удаление операции (функция готова, но не используется в UI)
  // const deleteOperation = async (id) => {
  //   if (!window.confirm('Удалить операцию?')) return;
  //   
  //   try {
  //     const response = await fetch(`/api/simple-work/operations/${id}`, { method: 'DELETE' });
  //     if (response.ok) {
  //       alert('Операция удалена!');
  //       loadData();
  //     } else {
  //       alert('Ошибка при удалении операции');
  //     }
  //   } catch (error) {
  //     console.error('Ошибка:', error);
  //     alert('Ошибка при удалении операции');
  //   }
  // };

  // Получение суммы
  const getAmount = () => {
    if (!selectedOperation || !quantity) return 0;
    const operation = operations.find(op => op.id === selectedOperation);
    return operation ? operation.price_per_unit * parseInt(quantity) : 0;
  };

  // Обработка отсканированного QR-кода
  const handleQRScan = (qrData) => {
    try {
      const data = JSON.parse(qrData);
      
      // Если QR-код содержит данные заказа
      if (data.type === 'order' && data.order_id) {
        setSelectedOrder(data.order_id);
        console.log('Выбран заказ:', data.order_id);
      }
      
      // Если QR-код содержит данные операции
      if (data.type === 'operation' && data.operation_id) {
        setSelectedOperation(data.operation_id);
        console.log('Выбрана операция:', data.operation_id);
      }
      
      // Если QR-код содержит данные сотрудника
      if (data.type === 'employee' && data.employee_id) {
        setSelectedEmployee(data.employee_id);
        console.log('Выбран сотрудник:', data.employee_id);
      }
      
      // Если QR-код содержит полные данные работы
      if (data.type === 'work' && data.order_id && data.operation_id && data.employee_id) {
        setSelectedOrder(data.order_id);
        setSelectedOperation(data.operation_id);
        setSelectedEmployee(data.employee_id);
        if (data.quantity) setQuantity(data.quantity);
        console.log('Заполнены данные работы:', data);
      }
      
    } catch (error) {
      console.error('Ошибка обработки QR-кода:', error);
      // Если не JSON, попробуем найти по номеру заказа
      const order = orders.find(o => o.order_number === qrData);
      if (order) {
        setSelectedOrder(order.id);
        console.log('Найден заказ по номеру:', qrData);
      }
    }
    
    setShowQRScanner(false);
  };

  // Интеграция с заказами - создание операций
  const createOperationsForOrder = async (orderId, operations) => {
    try {
      const response = await fetch(`/api/order-integration/create-operations/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Создано ${data.operations.length} операций для заказа #${data.order.order_number}`);
        loadData(); // Перезагружаем данные
      } else {
        alert('Ошибка при создании операций');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании операций');
    }
  };

  // Получение шаблонов операций
  const getOperationTemplates = async (furnitureType) => {
    try {
      const response = await fetch(`/api/order-integration/operation-templates/${furnitureType}`);
      const data = await response.json();
      return data.templates;
    } catch (error) {
      console.error('Ошибка при получении шаблонов:', error);
      return [];
    }
  };

  // Генерация QR-кода для заказа
  const generateOrderQR = async (orderId) => {
    try {
      const response = await fetch(`/api/qr-codes/order/${orderId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Создаем QR-код и показываем его
        const qrWindow = window.open('', '_blank', 'width=400,height=500');
        qrWindow.document.write(`
          <html>
            <head><title>QR-код заказа</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2>QR-код заказа #${data.order.order_number}</h2>
              <p>Клиент: ${data.order.customer_name}</p>
              <div id="qrcode" style="margin: 20px 0;"></div>
              <p style="font-size: 12px; color: #666;">Отсканируйте QR-код для быстрого выбора заказа</p>
              <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
              <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${data.qr_data}', {
                  width: 200,
                  height: 200,
                  margin: 2
                });
              </script>
            </body>
          </html>
        `);
      } else {
        alert('Ошибка при генерации QR-кода');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при генерации QR-кода');
    }
  };

  // Генерация QR-кода для операции
  const generateOperationQR = async (operationId) => {
    try {
      const response = await fetch(`/api/qr-codes/operation/${operationId}`);
      const data = await response.json();
      
      if (response.ok) {
        const qrWindow = window.open('', '_blank', 'width=400,height=500');
        qrWindow.document.write(`
          <html>
            <head><title>QR-код операции</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2>QR-код операции</h2>
              <p>${data.operation.name} (${data.operation.code})</p>
              <p>Расценка: ${data.operation.piece_rate}₽/${data.operation.unit}</p>
              <div id="qrcode" style="margin: 20px 0;"></div>
              <p style="font-size: 12px; color: #666;">Отсканируйте QR-код для быстрого выбора операции</p>
              <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
              <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${data.qr_data}', {
                  width: 200,
                  height: 200,
                  margin: 2
                });
              </script>
            </body>
          </html>
        `);
      } else {
        alert('Ошибка при генерации QR-кода');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при генерации QR-кода');
    }
  };

  // Получение длительности
  const getDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end - start) / (1000 * 60));
  };

  // Фильтрация сотрудников
  const getFilteredEmployees = () => {
    if (!Array.isArray(employees)) return [];
    
    let filtered = employees.filter(emp => emp.is_active !== false);
    
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment.name);
    }
    
    if (selectedPosition) {
      filtered = filtered.filter(emp => emp.position === selectedPosition.name);
    }
    
    // Преобразуем для FilterSelect - добавляем поле name
    return filtered.map(emp => ({
      ...emp,
      name: `${emp.first_name} ${emp.last_name}`.trim(),
      department_name: emp.department,
      position_name: emp.position
    }));
  };

  // Фильтрация операций
  const getFilteredOperations = () => {
    if (!Array.isArray(operations)) return [];
    
    let filtered = operations.filter(op => op.is_active !== false);
    
    if (selectedDepartment) {
      filtered = filtered.filter(op => op.department === selectedDepartment.name);
    }
    
    // Преобразуем для FilterSelect - добавляем поля для совместимости
    return filtered.map(op => ({
      ...op,
      department_name: op.department,
      position_name: op.position
    }));
  };

  // Фильтрация зарплат
  const getFilteredPayroll = () => {
    if (!Array.isArray(payroll)) return [];
    
    let filtered = payroll;
    
    if (selectedMonth) {
      filtered = filtered.filter(p => p.month === selectedMonth);
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(p => p.department === selectedDepartment.name);
    }
    
    return filtered;
  };

  // Сброс фильтров
  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedPosition(null);
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Учет работ</h1>
      </div>

      {/* Аналитика */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Аналитика за 30 дней</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Обновлено: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Активных сотрудников</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{analytics.active_employees || 0}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">из {employees.length} всего</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Всего работ</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{analytics.total_works || 0}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">за 30 дней</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">Общая сумма</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{analytics.total_amount?.toLocaleString() || 0}₽</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">средняя: {analytics.avg_amount_per_work && typeof analytics.avg_amount_per_work === 'number' ? analytics.avg_amount_per_work.toFixed(0) : 0}₽</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-orange-600 dark:text-orange-400">Средняя длительность</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{Math.round(analytics.avg_duration || 0)} мин</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">на работу</p>
          </div>
        </div>

        {/* Дополнительные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <p className="text-sm text-indigo-600 dark:text-indigo-400">Заказов в работе</p>
            <p className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{analytics.orders_count || 0}</p>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
            <p className="text-sm text-pink-600 dark:text-pink-400">Операций выполнено</p>
            <p className="text-xl font-bold text-pink-800 dark:text-pink-200">{analytics.operations_count || 0}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
            <p className="text-sm text-teal-600 dark:text-teal-400">Цехов задействовано</p>
            <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{analytics.departments_count || 0}</p>
          </div>
        </div>

        {/* Топ сотрудники и операции */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Топ сотрудники */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
              Топ сотрудники
            </h3>
            <div className="space-y-2">
              {analytics.top_employees?.slice(0, 5).map((emp, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{emp.first_name} {emp.last_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{emp.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{emp.total_amount?.toLocaleString() || 0}₽</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.works_count || 0} работ</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Нет данных</p>
              )}
            </div>
          </div>

          {/* Топ операции */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-500 dark:text-green-400" />
              Топ операции
            </h3>
            <div className="space-y-2">
              {analytics.top_operations?.slice(0, 5).map((op, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{op.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{op.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{op.total_amount?.toLocaleString() || 0}₽</p>
                    <p className="text-sm text-gray-500">{op.works_count || 0} раз</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Нет данных</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Форма записи работы */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-emerald-500 dark:text-emerald-400" />
            Записать работу
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowQRScanner(true)}
              className="btn-glass btn-glass-primary btn-glass-sm flex items-center"
            >
              <QrCode className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">QR-сканер</span>
            </button>
            <button
              onClick={() => setShowIntegrationModal(true)}
              className="btn-glass btn-glass-warning btn-glass-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Интеграция</span>
            </button>
            <div className="relative group">
              <button className="btn-glass btn-glass-success btn-glass-sm flex items-center">
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Экспорт</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <button
                    onClick={() => exportWorkRecords(workRecords, employees, operations, orders)}
                    className="btn-glass btn-glass-sm w-full text-left"
                  >
                    Записи работ
                  </button>
                  <button
                    onClick={() => exportPayroll(payroll, employees)}
                    className="btn-glass btn-glass-sm w-full text-left"
                  >
                    Зарплата
                  </button>
                  <button
                    onClick={() => exportOperations(operations)}
                    className="btn-glass btn-glass-sm w-full text-left"
                  >
                    Операции
                  </button>
                  <button
                    onClick={() => exportEmployees(employees)}
                    className="btn-glass btn-glass-sm w-full text-left"
                  >
                    Сотрудники
                  </button>
                  <button
                    onClick={() => exportAnalytics(analytics, employees, operations)}
                    className="btn-glass btn-glass-sm w-full text-left"
                  >
                    Аналитика
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Search className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Фильтры
            </h3>
            {(selectedDepartment || selectedPosition) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Сбросить фильтры
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Фильтр по месяцу */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Месяц
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Фильтр по отделу */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Отдел
              </label>
              <FilterSelect
                options={departments}
                value={selectedDepartment?.id}
                onChange={(dept) => setSelectedDepartment(dept)}
                placeholder="Все отделы"
                searchPlaceholder="Поиск по отделам..."
                icon={Building2}
                className="w-full"
              />
            </div>

            {/* Фильтр по должности */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Должность
              </label>
              <FilterSelect
                options={positions}
                value={selectedPosition?.id}
                onChange={(pos) => setSelectedPosition(pos)}
                placeholder="Все должности"
                searchPlaceholder="Поиск по должностям..."
                icon={Users}
                className="w-full"
              />
            </div>

            {/* Статистика фильтров */}
            <div className="flex items-end">
              <div className="w-full p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Найдено:</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getFilteredEmployees().length} сотрудников, {getFilteredOperations().length} операций
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Прогресс-бар */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Прогресс заполнения</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {[selectedOrder, selectedOperation, selectedEmployee, quantity].filter(Boolean).length} из 4 обязательных
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${([selectedOrder, selectedOperation, selectedEmployee, quantity].filter(Boolean).length / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Пошаговая форма - 2 поля на строку */}
        <div className="space-y-6">
          {/* Строка 1: Заказ и Операция */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Шаг 1: Заказ */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                  selectedOrder 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {selectedOrder ? '✓' : '1'}
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выберите заказ *
                </label>
                {selectedOrder && (
                  <div className="ml-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm dark:bg-gray-700 dark:text-gray-100 ${
                    selectedOrder 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 focus:ring-emerald-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Выберите заказ...</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      #{order.order_number} - {order.customer_name}
                    </option>
                  ))}
                </select>
                {selectedOrder && (
                  <button
                    onClick={() => generateOrderQR(selectedOrder)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex-shrink-0"
                    title="Сгенерировать QR-код"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!selectedOrder && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Выберите заказ для которого выполняется работа</p>
              )}
            </div>

            {/* Шаг 2: Операция */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                  selectedOperation 
                    ? 'bg-emerald-500 text-white' 
                    : selectedOrder
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {selectedOperation ? '✓' : '2'}
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выберите операцию *
                </label>
                {selectedOperation && (
                  <div className="ml-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FilterSelect
                    options={getFilteredOperations()}
                    value={selectedOperation}
                    onChange={(op) => setSelectedOperation(op?.id || '')}
                    placeholder="Выберите операцию..."
                    searchPlaceholder="Поиск операций..."
                    icon={Calculator}
                    groupBy="department_name"
                    className="w-full"
                    disabled={!selectedOrder}
                  />
                </div>
                {selectedOperation && (
                  <button
                    onClick={() => generateOperationQR(selectedOperation)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex-shrink-0"
                    title="Сгенерировать QR-код"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowOperationModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0"
                  disabled={!selectedOrder}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {!selectedOperation && selectedOrder && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Выберите операцию которую выполнял сотрудник</p>
              )}
              {!selectedOrder && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Сначала выберите заказ</p>
              )}
            </div>
          </div>

          {/* Строка 2: Сотрудник и Количество */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Шаг 3: Сотрудник */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                  selectedEmployee 
                    ? 'bg-emerald-500 text-white' 
                    : selectedOperation
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {selectedEmployee ? '✓' : '3'}
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выберите сотрудника *
                </label>
                {selectedEmployee && (
                  <div className="ml-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FilterSelect
                    options={getFilteredEmployees()}
                    value={selectedEmployee}
                    onChange={(emp) => setSelectedEmployee(emp?.id || '')}
                    placeholder="Выберите сотрудника..."
                    searchPlaceholder="Поиск сотрудников..."
                    icon={Users}
                    groupBy="department_name"
                    className="w-full"
                    disabled={!selectedOperation}
                  />
                </div>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex-shrink-0"
                  disabled={!selectedOperation}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {!selectedEmployee && selectedOperation && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Выберите сотрудника который выполнял работу</p>
              )}
              {!selectedOperation && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Сначала выберите операцию</p>
              )}
            </div>

            {/* Шаг 4: Количество */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                  quantity 
                    ? 'bg-emerald-500 text-white' 
                    : selectedEmployee
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {quantity ? '✓' : '4'}
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Количество *
                </label>
                {quantity && (
                  <div className="ml-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Сколько сделал?"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                  quantity 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 focus:ring-emerald-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                disabled={!selectedEmployee}
                min="1"
                step="1"
              />
              {!quantity && selectedEmployee && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Укажите количество выполненных единиц</p>
              )}
              {!selectedEmployee && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Сначала выберите сотрудника</p>
              )}
            </div>
          </div>

          {/* Строка 3: Время (опционально) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Время начала */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Время начала
                </label>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(опционально)</span>
              </div>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                disabled={!quantity}
              />
              {!quantity && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Сначала укажите количество</p>
              )}
            </div>

            {/* Время окончания */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Время окончания
                </label>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(опционально)</span>
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                disabled={!quantity}
              />
              {!quantity && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Сначала укажите количество</p>
              )}
            </div>
          </div>
        </div>

        {/* Подтверждение */}
        {selectedOrder && selectedOperation && selectedEmployee && quantity && (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Подтвердите данные:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-emerald-800 dark:text-emerald-300">Заказ:</span><br />
            <span className="text-emerald-700 dark:text-emerald-200">#{orders.find(o => o.id === selectedOrder)?.order_number}</span>
          </div>
          <div>
            <span className="font-medium text-emerald-800 dark:text-emerald-300">Операция:</span><br />
            <span className="text-emerald-700 dark:text-emerald-200">{operations.find(o => o.id === selectedOperation)?.name}</span>
          </div>
          <div>
            <span className="font-medium text-emerald-800 dark:text-emerald-300">Сотрудник:</span><br />
            <span className="text-emerald-700 dark:text-emerald-200">{employees.find(e => e.id === selectedEmployee)?.first_name} {employees.find(e => e.id === selectedEmployee)?.last_name}</span>
          </div>
              <div>
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Сумма:</span><br />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{getAmount().toLocaleString()}₽</span>
              </div>
            </div>
            {(startTime && endTime) && (
              <div className="mt-2 text-sm">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Длительность:</span> <span className="text-emerald-700 dark:text-emerald-200">{getDuration()} минут</span>
              </div>
            )}
            <button
              onClick={saveWork}
              disabled={loading}
              className="mt-4 w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Сохранение...' : '✅ Записать работу'}
            </button>
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Всего работ</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{Array.isArray(workRecords) ? workRecords.length : 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-green-500 dark:text-green-400 mr-2" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Сотрудников</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{employees.filter(e => e.is_active).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Calculator className="w-6 h-6 text-purple-500 dark:text-purple-400 mr-2" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Операций</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{operations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-orange-500 dark:text-orange-400 mr-2" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Общее время</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.round((Array.isArray(workRecords) ? workRecords.reduce((sum, record) => sum + (record.duration_minutes || 0), 0) : 0) / 60)}ч
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Модальное окно для операций */}
      {showOperationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingOperation ? 'Редактировать операцию' : 'Добавить операцию'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                <input
                  type="text"
                  value={operationForm.name}
                  onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена за единицу (₽)</label>
                <input
                  type="number"
                  value={operationForm.price_per_unit}
                  onChange={(e) => setOperationForm({...operationForm, price_per_unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цех</label>
                <select
                  value={operationForm.department}
                  onChange={(e) => setOperationForm({...operationForm, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Выберите цех...</option>
                  <option value="Столярный цех">Столярный цех</option>
                  <option value="Обивочный цех">Обивочный цех</option>
                  <option value="Швейный цех">Швейный цех</option>
                  <option value="Формовочный цех">Формовочный цех</option>
                  <option value="Разнорабочий">Разнорабочий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Норма времени (минуты)</label>
                <input
                  type="number"
                  value={operationForm.time_norm_minutes}
                  onChange={(e) => setOperationForm({...operationForm, time_norm_minutes: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={saveOperation}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {editingOperation ? 'Обновить' : 'Добавить'}
              </button>
              <button
                onClick={() => {
                  setShowOperationModal(false);
                  setEditingOperation(null);
                  setOperationForm({ name: '', price_per_unit: '', department: '', time_norm_minutes: 0 });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для сотрудников */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                <input
                  type="text"
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({...employeeForm, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                <input
                  type="text"
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({...employeeForm, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цех</label>
                <select
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Выберите цех...</option>
                  <option value="Столярный цех">Столярный цех</option>
                  <option value="Обивочный цех">Обивочный цех</option>
                  <option value="Швейный цех">Швейный цех</option>
                  <option value="Формовочный цех">Формовочный цех</option>
                  <option value="Разнорабочий">Разнорабочий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Должность</label>
                <input
                  type="text"
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEmployee}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              >
                {editingEmployee ? 'Обновить' : 'Добавить'}
              </button>
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setEditingEmployee(null);
                  setEmployeeForm({ first_name: '', last_name: '', department: '', position: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR-сканер */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />

      {/* Модальное окно интеграции */}
      {showIntegrationModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Интеграция с заказами</h3>
              <button
                onClick={() => setShowIntegrationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Выберите заказ и тип мебели для автоматического создания операций
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите заказ
                  </label>
                  <select
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите заказ...</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        #{order.order_number} - {order.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип мебели
                  </label>
                  <select
                    onChange={async (e) => {
                      const templates = await getOperationTemplates(e.target.value);
                      setOperationTemplates(templates);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите тип мебели...</option>
                    <option value="диван">Диван</option>
                    <option value="кресло">Кресло</option>
                    <option value="стол">Стол</option>
                    <option value="тумба">Тумба</option>
                    <option value="шкаф">Шкаф</option>
                    <option value="кровать">Кровать</option>
                  </select>
                </div>
              </div>
              
              {operationTemplates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Операции для создания:
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {operationTemplates.map((template, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-600">
                            {template.piece_rate}₽/{template.unit} • {template.time_norm}ч
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-purple-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (selectedOrder && operationTemplates.length > 0) {
                      createOperationsForOrder(selectedOrder, operationTemplates);
                      setShowIntegrationModal(false);
                    } else {
                      alert('Выберите заказ и тип мебели');
                    }
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Создать операции
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Система уведомлений */}
      <NotificationSystem
        workRecords={workRecords}
        employees={employees}
        operations={operations}
      />
    </div>
  );
};

export default SimpleWork;
