import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ShipmentCalendar = ({ orders = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Получаем заказы с дедлайнами
  const ordersWithDeadlines = useMemo(() => {
    return orders.filter(order => order.delivery_date).map(order => ({
      ...order,
      deadline: new Date(order.delivery_date)
    }));
  }, [orders]);

  // Получаем все заказы для статистики
  const allOrders = useMemo(() => {
    return orders.map(order => ({
      ...order,
      deadline: order.delivery_date ? new Date(order.delivery_date) : null
    }));
  }, [orders]);

  // Генерируем календарь на 3 месяца
  const generateCalendar = () => {
    const months = [];
    const startDate = new Date(currentDate);
    startDate.setMonth(startDate.getMonth() - 1); // Начинаем с предыдущего месяца
    
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      months.push(generateMonth(monthDate));
    }
    
    return months;
  };

  const generateMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() + 6) % 7; // Понедельник = 0
    
    const days = [];
    
    // Пустые дни в начале месяца
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayOrders = ordersWithDeadlines.filter(order => 
        order.deadline.toDateString() === dayDate.toDateString()
      );
      
      days.push({
        date: dayDate,
        day,
        orders: dayOrders,
        isToday: dayDate.toDateString() === new Date().toDateString(),
        isPast: dayDate < new Date().setHours(0, 0, 0, 0)
      });
    }
    
    return {
      date,
      name: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      days
    };
  };

  const getDayStatus = (day) => {
    if (!day || day.orders.length === 0) return 'empty';
    
    const hasOverdue = day.orders.some(order => day.isPast && order.status !== 'Отгружен');
    const hasCompleted = day.orders.every(order => order.status === 'Отгружен');
    const hasInProgress = day.orders.some(order => order.status !== 'Отгружен');
    
    if (hasOverdue) return 'overdue';
    if (hasCompleted) return 'completed';
    if (hasInProgress) return 'in-progress';
    
    return 'scheduled';
  };

  const getDayColor = (day) => {
    const status = getDayStatus(day);
    
    switch (status) {
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in-progress':
        return 'bg-blue-500 text-white';
      case 'scheduled':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
    }
  };

  const getStatusIcon = (day) => {
    const status = getDayStatus(day);
    
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'in-progress':
        return <Clock className="w-3 h-3" />;
      case 'scheduled':
        return <Package className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const months = generateCalendar();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Календарь отгрузок
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Дедлайны и статусы заказов по месяцам
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
          >
            Сегодня
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Просрочено</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Выполнено</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">В работе</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Запланировано</span>
        </div>
      </div>

      {/* Календари */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              {month.name}
            </h3>
            
            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Дни месяца */}
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all hover:scale-105 cursor-pointer
                    ${day ? getDayColor(day) : 'bg-transparent'}
                    ${day?.isToday ? 'ring-2 ring-teal-500 dark:ring-teal-400' : ''}
                  `}
                  title={day ? `${day.day} ${month.name} - ${day.orders.length} заказов` : ''}
                >
                  {day && (
                    <>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(day)}
                        <span className="text-xs font-bold">{day.day}</span>
                      </div>
                      {day.orders.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          {day.orders.length}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Статистика */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">Просрочено</span>
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-200 mt-1">
            {allOrders.filter(order => 
              order.delivery_date && new Date(order.delivery_date) < new Date().setHours(0, 0, 0, 0) && order.status !== 'delivered'
            ).length}
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Выполнено</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
            {allOrders.filter(order => order.status === 'delivered').length}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">В работе</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
            {allOrders.filter(order => order.status === 'in_production').length}
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Всего</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mt-1">
            {allOrders.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentCalendar;
