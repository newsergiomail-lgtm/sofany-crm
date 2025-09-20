import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const NotificationSystem = ({ workRecords, employees, operations }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Анализ эффективности
  useEffect(() => {
    if (workRecords.length === 0) return;

    const newNotifications = [];

    // 1. Анализ производительности сотрудников
    const employeeStats = employees.map(employee => {
      const employeeWorks = workRecords.filter(work => work.employee_id === employee.id);
      const totalAmount = employeeWorks.reduce((sum, work) => sum + (work.amount || 0), 0);
      const totalHours = employeeWorks.reduce((sum, work) => sum + (work.duration_minutes || 0), 0) / 60;
      const avgProductivity = totalHours > 0 ? totalAmount / totalHours : 0;

      return {
        employee,
        totalAmount,
        totalHours,
        avgProductivity,
        workCount: employeeWorks.length
      };
    });

    // Находим сотрудников с низкой производительностью
    const avgProductivity = employeeStats.reduce((sum, stat) => sum + stat.avgProductivity, 0) / employeeStats.length;
    const lowProductivityEmployees = employeeStats.filter(stat => 
      stat.avgProductivity < avgProductivity * 0.7 && stat.workCount > 0
    );

    lowProductivityEmployees.forEach(stat => {
      newNotifications.push({
        id: `low-productivity-${stat.employee.id}`,
        type: 'warning',
        title: 'Низкая производительность',
        message: `${stat.employee.first_name} ${stat.employee.last_name} показывает низкую производительность: ${stat.avgProductivity.toFixed(2)}₽/час (средняя: ${avgProductivity.toFixed(2)}₽/час)`,
        timestamp: new Date(),
        category: 'productivity'
      });
    });

    // 2. Анализ неактивных сотрудников
    const inactiveEmployees = employees.filter(employee => 
      employee.is_active && !workRecords.some(work => work.employee_id === employee.id)
    );

    inactiveEmployees.forEach(employee => {
      newNotifications.push({
        id: `inactive-${employee.id}`,
        type: 'info',
        title: 'Неактивный сотрудник',
        message: `${employee.first_name} ${employee.last_name} не выполнял работ в текущем периоде`,
        timestamp: new Date(),
        category: 'activity'
      });
    });

    // 3. Анализ операций с низкой эффективностью
    const operationStats = operations.map(operation => {
      const operationWorks = workRecords.filter(work => work.operation_id === operation.id);
      const totalAmount = operationWorks.reduce((sum, work) => sum + (work.amount || 0), 0);
      const totalQuantity = operationWorks.reduce((sum, work) => sum + (work.quantity || 0), 0);
      const avgEfficiency = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

      return {
        operation,
        totalAmount,
        totalQuantity,
        avgEfficiency,
        workCount: operationWorks.length
      };
    });

    const avgEfficiency = operationStats.reduce((sum, stat) => sum + stat.avgEfficiency, 0) / operationStats.length;
    const lowEfficiencyOperations = operationStats.filter(stat => 
      stat.avgEfficiency < avgEfficiency * 0.8 && stat.workCount > 0
    );

    lowEfficiencyOperations.forEach(stat => {
      newNotifications.push({
        id: `low-efficiency-${stat.operation.id}`,
        type: 'warning',
        title: 'Низкая эффективность операции',
        message: `Операция "${stat.operation.name}" показывает низкую эффективность: ${stat.avgEfficiency.toFixed(2)}₽/ед (средняя: ${avgEfficiency.toFixed(2)}₽/ед)`,
        timestamp: new Date(),
        category: 'efficiency'
      });
    });

    // 4. Анализ переработок
    const today = new Date();
    const todayWorks = workRecords.filter(work => {
      const workDate = new Date(work.created_at);
      return workDate.toDateString() === today.toDateString();
    });

    const employeeTodayHours = {};
    todayWorks.forEach(work => {
      if (!employeeTodayHours[work.employee_id]) {
        employeeTodayHours[work.employee_id] = 0;
      }
      employeeTodayHours[work.employee_id] += (work.duration_minutes || 0) / 60;
    });

    Object.entries(employeeTodayHours).forEach(([employeeId, hours]) => {
      if (hours > 10) { // Более 10 часов в день
        const employee = employees.find(e => e.id === parseInt(employeeId));
        if (employee) {
          newNotifications.push({
            id: `overtime-${employeeId}-${today.toDateString()}`,
            type: 'info',
            title: 'Переработка',
            message: `${employee.first_name} ${employee.last_name} отработал ${hours.toFixed(1)} часов сегодня`,
            timestamp: new Date(),
            category: 'overtime'
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [workRecords, employees, operations]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Уведомления ({notifications.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showNotifications ? 'Свернуть' : 'Развернуть'}
            </button>
            <button
              onClick={dismissAll}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showNotifications && (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 last:border-b-0 ${getNotificationBgColor(notification.type)}`}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleTimeString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;







