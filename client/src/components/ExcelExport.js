import * as XLSX from 'xlsx';

// Экспорт записей работ в Excel
export const exportWorkRecords = (workRecords, employees, operations, orders) => {
  const data = workRecords.map(record => {
    const employee = employees.find(e => e.id === record.employee_id);
    const operation = operations.find(o => o.id === record.operation_id);
    const order = orders.find(o => o.id === record.order_id);
    
    return {
      'Дата': new Date(record.created_at).toLocaleDateString('ru-RU'),
      'Заказ': order ? `#${order.order_number}` : 'Не указан',
      'Клиент': order ? order.customer_name : 'Не указан',
      'Операция': operation ? operation.name : 'Не указана',
      'Код операции': operation ? operation.code : 'Не указан',
      'Сотрудник': employee ? `${employee.first_name} ${employee.last_name}` : 'Не указан',
      'Табельный номер': employee ? employee.employee_number : 'Не указан',
      'Количество': record.quantity,
      'Единица измерения': operation ? operation.unit : 'шт',
      'Расценка за единицу': operation ? operation.piece_rate : 0,
      'Сумма': record.amount,
      'Время начала': record.start_time ? new Date(record.start_time).toLocaleString('ru-RU') : 'Не указано',
      'Время окончания': record.end_time ? new Date(record.end_time).toLocaleString('ru-RU') : 'Не указано',
      'Длительность (мин)': record.duration_minutes || 0,
      'Длительность (часы)': record.duration_minutes ? (record.duration_minutes / 60).toFixed(2) : 0
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Записи работ');
  
  // Автоширина колонок
  const colWidths = [
    { wch: 12 }, // Дата
    { wch: 10 }, // Заказ
    { wch: 20 }, // Клиент
    { wch: 25 }, // Операция
    { wch: 15 }, // Код операции
    { wch: 20 }, // Сотрудник
    { wch: 15 }, // Табельный номер
    { wch: 12 }, // Количество
    { wch: 15 }, // Единица измерения
    { wch: 18 }, // Расценка за единицу
    { wch: 12 }, // Сумма
    { wch: 20 }, // Время начала
    { wch: 20 }, // Время окончания
    { wch: 15 }, // Длительность (мин)
    { wch: 15 }  // Длительность (часы)
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `Записи_работ_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Экспорт зарплаты в Excel
export const exportPayroll = (payroll, employees) => {
  const data = payroll.map(record => {
    const employee = employees.find(e => e.id === record.employee_id);
    
    return {
      'Месяц': new Date(record.month).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }),
      'Сотрудник': employee ? `${employee.first_name} ${employee.last_name}` : 'Не указан',
      'Табельный номер': employee ? employee.employee_number : 'Не указан',
      'Отдел': employee ? employee.department_name : 'Не указан',
      'Должность': employee ? employee.position_name : 'Не указана',
      'Сдельная сумма': record.total_piece_rate_amount,
      'Почасовая сумма': record.total_hourly_amount,
      'Премии': record.total_bonuses,
      'Штрафы': record.total_penalties,
      'Отработано часов': record.total_hours_worked,
      'Итого к выплате': record.final_amount
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Зарплата');
  
  // Автоширина колонок
  const colWidths = [
    { wch: 15 }, // Месяц
    { wch: 20 }, // Сотрудник
    { wch: 15 }, // Табельный номер
    { wch: 20 }, // Отдел
    { wch: 20 }, // Должность
    { wch: 15 }, // Сдельная сумма
    { wch: 15 }, // Почасовая сумма
    { wch: 12 }, // Премии
    { wch: 12 }, // Штрафы
    { wch: 15 }, // Отработано часов
    { wch: 15 }  // Итого к выплате
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `Зарплата_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Экспорт операций в Excel
export const exportOperations = (operations) => {
  const data = operations.map(operation => ({
    'Название': operation.name,
    'Код': operation.code,
    'Отдел': operation.department_name,
    'Единица измерения': operation.unit,
    'Расценка за единицу': operation.piece_rate,
    'Норма времени (часы)': operation.time_norm,
    'Описание': operation.description || 'Не указано',
    'Активна': operation.is_active ? 'Да' : 'Нет'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Операции');
  
  // Автоширина колонок
  const colWidths = [
    { wch: 25 }, // Название
    { wch: 15 }, // Код
    { wch: 20 }, // Отдел
    { wch: 15 }, // Единица измерения
    { wch: 18 }, // Расценка за единицу
    { wch: 20 }, // Норма времени (часы)
    { wch: 30 }, // Описание
    { wch: 10 }  // Активна
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `Операции_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Экспорт сотрудников в Excel
export const exportEmployees = (employees) => {
  const data = employees.map(employee => ({
    'Фамилия': employee.last_name,
    'Имя': employee.first_name,
    'Отчество': employee.middle_name || 'Не указано',
    'Табельный номер': employee.employee_number,
    'Отдел': employee.department_name,
    'Должность': employee.position_name,
    'Телефон': employee.phone || 'Не указан',
    'Email': employee.email || 'Не указан',
    'Дата приема': employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ru-RU') : 'Не указана',
    'Активен': employee.is_active ? 'Да' : 'Нет'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
  
  // Автоширина колонок
  const colWidths = [
    { wch: 15 }, // Фамилия
    { wch: 15 }, // Имя
    { wch: 15 }, // Отчество
    { wch: 15 }, // Табельный номер
    { wch: 20 }, // Отдел
    { wch: 20 }, // Должность
    { wch: 15 }, // Телефон
    { wch: 25 }, // Email
    { wch: 15 }, // Дата приема
    { wch: 10 }  // Активен
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `Сотрудники_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Экспорт аналитики в Excel
export const exportAnalytics = (analytics, employees, operations) => {
  const wb = XLSX.utils.book_new();
  
  // Общая аналитика
  const overviewData = [
    { 'Показатель': 'Всего записей работ', 'Значение': analytics.total_work_records || 0 },
    { 'Показатель': 'Общая сумма', 'Значение': analytics.total_amount || 0 },
    { 'Показатель': 'Общее время (часы)', 'Значение': analytics.total_hours || 0 },
    { 'Показатель': 'Средняя производительность', 'Значение': analytics.avg_productivity || 0 },
    { 'Показатель': 'Активных сотрудников', 'Значение': analytics.active_employees || 0 },
    { 'Показатель': 'Всего операций', 'Значение': analytics.total_operations || 0 }
  ];
  
  const overviewWs = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Общая аналитика');
  
  // Аналитика по сотрудникам
  if (analytics.employee_stats && analytics.employee_stats.length > 0) {
    const employeeData = analytics.employee_stats.map(stat => {
      const employee = employees.find(e => e.id === stat.employee_id);
      return {
        'Сотрудник': employee ? `${employee.first_name} ${employee.last_name}` : 'Не указан',
        'Табельный номер': employee ? employee.employee_number : 'Не указан',
        'Количество работ': stat.work_count,
        'Общая сумма': stat.total_amount,
        'Отработано часов': stat.total_hours,
        'Средняя производительность': stat.avg_productivity
      };
    });
    
    const employeeWs = XLSX.utils.json_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, employeeWs, 'Аналитика по сотрудникам');
  }
  
  // Аналитика по операциям
  if (analytics.operation_stats && analytics.operation_stats.length > 0) {
    const operationData = analytics.operation_stats.map(stat => {
      const operation = operations.find(o => o.id === stat.operation_id);
      return {
        'Операция': operation ? operation.name : 'Не указана',
        'Код': operation ? operation.code : 'Не указан',
        'Количество выполнений': stat.execution_count,
        'Общая сумма': stat.total_amount,
        'Средняя производительность': stat.avg_productivity
      };
    });
    
    const operationWs = XLSX.utils.json_to_sheet(operationData);
    XLSX.utils.book_append_sheet(wb, operationWs, 'Аналитика по операциям');
  }
  
  XLSX.writeFile(wb, `Аналитика_${new Date().toISOString().split('T')[0]}.xlsx`);
};







