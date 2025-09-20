import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  Calculator,
  FileText,
  X
} from 'lucide-react';
import DateRangePicker from '../../components/DateRangePicker';
import '../../components/DateRangePicker.css';

const PayrollReports = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Календарный фильтр
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [useDateRange, setUseDateRange] = useState(false);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Модальные окна
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [employeeWorkRecords, setEmployeeWorkRecords] = useState([]);
  
  // Фильтры для детализации сотрудника
  const [employeeFilters, setEmployeeFilters] = useState({
    startDate: '',
    endDate: '',
    operationId: '',
    sortBy: 'date', // date, operation, amount
    sortOrder: 'desc' // asc, desc
  });

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  // Перезагрузка данных при изменении фильтров
  useEffect(() => {
    loadData();
  }, [useDateRange, dateRange, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Формируем параметры для зарплаты
      const payrollParams = new URLSearchParams();
      
      if (useDateRange && dateRange.startDate && dateRange.endDate) {
        payrollParams.append('start_date', dateRange.startDate.toISOString().split('T')[0]);
        payrollParams.append('end_date', dateRange.endDate.toISOString().split('T')[0]);
      }
      
      if (selectedDepartment) payrollParams.append('department', selectedDepartment);
      
      const [payrollRes, workRes, employeesRes, departmentsRes, operationsRes] = await Promise.all([
        fetch(`/api/simple-work/payroll?${payrollParams.toString()}`),
        fetch('/api/simple-work/work'),
        fetch('/api/simple-work/employees'),
        fetch('/api/simple-work/departments'),
        fetch('/api/simple-work/operations')
      ]);

      setPayrollData(await payrollRes.json());
      setWorkRecords(await workRes.json());
      setEmployees(await employeesRes.json());
      setDepartments(await departmentsRes.json());
      setOperations(await operationsRes.json());
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация данных
  const getFilteredData = () => {
    let filtered = payrollData;

    // Фильтр по отделу
    if (selectedDepartment) {
      filtered = filtered.filter(item => item.department === selectedDepartment);
    }

    // Фильтр по сотруднику
    if (selectedEmployee) {
      filtered = filtered.filter(item => item.employee_id === parseInt(selectedEmployee));
    }

    // Поиск по имени
    if (searchTerm) {
      filtered = filtered.filter(item => 
        `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Получение детальных записей работ сотрудника
  const getEmployeeWorkRecords = async (employeeId, month, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('employee_id', employeeId);
      if (month) params.append('month', month);
      if (filters.startDate && filters.startDate.trim() !== '') params.append('start_date', filters.startDate);
      if (filters.endDate && filters.endDate.trim() !== '') params.append('end_date', filters.endDate);
      if (filters.operationId && filters.operationId.trim() !== '') params.append('operation_id', filters.operationId);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
      
      const response = await fetch(`/api/simple-work/work?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка загрузки записей работ:', error);
      return [];
    }
  };

  // Показать детали сотрудника
  const handleShowEmployeeDetails = async (employee) => {
    setSelectedEmployeeData(employee);
    // Сбрасываем фильтры при открытии нового сотрудника
    setEmployeeFilters({
      startDate: '',
      endDate: '',
      operationId: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    const workRecords = await getEmployeeWorkRecords(employee.employee_id, employee.month);
    setEmployeeWorkRecords(workRecords);
    setShowEmployeeDetails(true);
  };

  // Обновление фильтров сотрудника
  const handleEmployeeFilterChange = async (newFilters) => {
    const updatedFilters = { ...employeeFilters, ...newFilters };
    setEmployeeFilters(updatedFilters);
    
    if (selectedEmployeeData) {
      const workRecords = await getEmployeeWorkRecords(
        selectedEmployeeData.employee_id, 
        selectedEmployeeData.month, 
        updatedFilters
      );
      setEmployeeWorkRecords(workRecords);
    }
  };

  // Функция для расчета общего времени
  const calculateTotalTime = (records) => {
    const totalMinutes = records.reduce((sum, record) => {
      const duration = parseFloat(record.duration_minutes) || 0;
      return sum + duration;
    }, 0);
    
    return totalMinutes / 60; // Конвертируем минуты в часы
  };

  // Обработчики календарного фильтра
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  const handleApplyDateRange = () => {
    setUseDateRange(true);
  };

  const handleClearDateRange = () => {
    setDateRange({ startDate: null, endDate: null });
    setUseDateRange(false);
  };

  // Сброс фильтров
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedEmployee('');
    setDateRange({ startDate: null, endDate: null });
    setUseDateRange(false);
    setCurrentPage(1);
  };

  // Экспорт отчета по сотруднику
  const exportEmployeeReport = (employee) => {
    const data = {
      employee: employee,
      workRecords: employeeWorkRecords,
      month: employee.month
    };
    
    // Создаем CSV
    const csvContent = [
      ['Отчет по зарплате', ''],
      ['Сотрудник', `${employee.first_name} ${employee.last_name}`],
      ['Отдел', employee.department],
      ['Месяц', employee.month],
      ['Общая сумма', `${employee.total_amount} ₽`],
      ['Количество работ', employee.work_count],
      ['Общее время', `${employee.total_hours} ч`],
      [''],
      ['Детализация работ:'],
      ['Дата', 'Заказ', 'Операция', 'Количество', 'Время', 'Сумма']
    ];

    employeeWorkRecords.forEach(record => {
      csvContent.push([
        new Date(record.work_date).toLocaleDateString('ru-RU'),
        record.order_number || '',
        record.operation_name || '',
        record.quantity,
        record.duration_minutes ? `${record.duration_minutes} мин` : '-',
        `${record.amount} ₽`
      ]);
    });

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `отчет_${employee.first_name}_${employee.last_name}_${employee.month}.csv`;
    link.click();
  };

  // Пагинация
  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Calculator className="h-8 w-8 mr-3 text-blue-600" />
          Отчеты по зарплатам
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Детальная аналитика заработной платы сотрудников
        </p>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Поиск по имени */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск по имени
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Введите имя сотрудника..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Календарный фильтр */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Период
            </label>
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => handleDateRangeChange(date, dateRange.endDate)}
              onEndDateChange={(date) => handleDateRangeChange(dateRange.startDate, date)}
              onApply={handleApplyDateRange}
              onClear={handleClearDateRange}
              placeholder="Выберите период"
            />
          </div>

          {/* Фильтр по отделу */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Отдел
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Все отделы</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по сотруднику */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сотрудник
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Все сотрудники</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Сброс фильтров */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Найдено: {filteredData.length} записей
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Таблица зарплат */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {useDateRange && dateRange.startDate && dateRange.endDate 
              ? `Зарплаты за ${dateRange.startDate.toLocaleDateString('ru-RU')} - ${dateRange.endDate.toLocaleDateString('ru-RU')}`
              : 'Отчеты по зарплатам'
            }
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Отдел
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Месяц
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Работ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Часы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                            {item.first_name?.[0]}{item.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.first_name} {item.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {item.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.work_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {parseFloat(item.total_hours).toFixed(1)} ч
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {parseFloat(item.total_amount).toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowEmployeeDetails(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Показать детали"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => exportEmployeeReport(item)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Экспорт отчета"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paginatedData.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Нет данных</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Нет записей о зарплатах за выбранный период
              </p>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} из {filteredData.length} записей
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Назад
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} из {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно с деталями сотрудника */}
      {showEmployeeDetails && selectedEmployeeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Детали по сотруднику: {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
              </h3>
              <button
                onClick={() => setShowEmployeeDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Сводка */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Общая сумма</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {parseFloat(selectedEmployeeData.total_amount).toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Количество работ</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {selectedEmployeeData.work_count}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">Общее время</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {parseFloat(selectedEmployeeData.total_hours).toFixed(1)} ч
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">Отдел</div>
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {selectedEmployeeData.department}
                </div>
              </div>
            </div>

            {/* Статистика по фильтрам */}
            {employeeWorkRecords.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Отфильтровано записей</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {employeeWorkRecords.length}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Сумма по фильтру</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {employeeWorkRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Время по фильтру</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {calculateTotalTime(employeeWorkRecords).toFixed(1)} ч
                  </div>
                </div>
              </div>
            )}

            {/* Фильтры для детализации */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Фильтры и сортировка</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Фильтр по датам */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата от
                  </label>
                  <input
                    type="date"
                    value={employeeFilters.startDate}
                    onChange={(e) => handleEmployeeFilterChange({ startDate: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата до
                  </label>
                  <input
                    type="date"
                    value={employeeFilters.endDate}
                    onChange={(e) => handleEmployeeFilterChange({ endDate: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-100"
                  />
                </div>
                
                {/* Фильтр по операциям */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Операция
                  </label>
                  <select
                    value={employeeFilters.operationId}
                    onChange={(e) => handleEmployeeFilterChange({ operationId: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-100"
                  >
                    <option value="">Все операции</option>
                    {operations.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Сортировка */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Сортировка
                  </label>
                  <div className="flex space-x-1">
                    <select
                      value={employeeFilters.sortBy}
                      onChange={(e) => handleEmployeeFilterChange({ sortBy: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-100"
                    >
                      <option value="date">По дате</option>
                      <option value="operation">По операции</option>
                      <option value="amount">По сумме</option>
                    </select>
                    <button
                      onClick={() => handleEmployeeFilterChange({ 
                        sortOrder: employeeFilters.sortOrder === 'asc' ? 'desc' : 'asc' 
                      })}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                      title={employeeFilters.sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
                    >
                      {employeeFilters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Сброс фильтров */}
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Найдено: {employeeWorkRecords.length} записей
                </div>
                <button
                  onClick={() => handleEmployeeFilterChange({
                    startDate: '',
                    endDate: '',
                    operationId: '',
                    sortBy: 'date',
                    sortOrder: 'desc'
                  })}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>

            {/* Таблица работ */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Заказ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Операция</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Количество</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Время</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employeeWorkRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {new Date(record.work_date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        #{record.order_number || record.order_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {record.operation_name || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {record.quantity}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {record.duration_minutes ? `${record.duration_minutes} мин` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(record.amount).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => exportEmployeeReport(selectedEmployeeData)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт отчета
              </button>
              <button
                onClick={() => setShowEmployeeDetails(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReports;
