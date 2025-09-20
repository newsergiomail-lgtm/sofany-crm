import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Flame,
  BarChart3,
  PieChart,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Download,
  Moon,
  Sun
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { ordersAPI, customersAPI, materialsAPI, productionAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Загружаем тему из localStorage при монтировании
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme));
    }
  }, []);

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
        }
      })
      .catch(error => {
        console.error('Ошибка установки токена:', error);
      });
    }
  }, []);

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Загружаем статистику с простой обработкой ошибок
  const { data: ordersStats, isLoading: ordersLoading, error: ordersError } = useQuery(
    ['orders-stats', selectedPeriod],
    () => ordersAPI.getStats({ period: selectedPeriod }),
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      cacheTime: 300000
    }
  );

  const { data: customersStats, isLoading: customersLoading, error: customersError } = useQuery(
    'customers-stats',
    () => customersAPI.getStats(),
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      cacheTime: 300000
    }
  );

  const { data: materialsStats, isLoading: materialsLoading, error: materialsError } = useQuery(
    'materials-stats',
    () => materialsAPI.getStats(),
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      cacheTime: 300000
    }
  );

  const { data: productionStats, isLoading: productionLoading, error: productionError } = useQuery(
    ['production-stats', selectedPeriod],
    () => productionAPI.getStats({ period: selectedPeriod }),
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      cacheTime: 300000
    }
  );

  const { data: recentOrders, isLoading: ordersListLoading } = useQuery(
    'recent-orders',
    () => ordersAPI.getAll({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
    {
      enabled: true,
      staleTime: 30000,
      cacheTime: 300000
    }
  );

  const isLoading = ordersLoading || customersLoading || materialsLoading || productionLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Простое обновление данных
    window.location.reload();
  };

  // Базовые данные с fallback значениями
  const ordersData = ordersStats?.stats || ordersStats?.data?.stats || ordersStats?.data || ordersStats || {
    total_orders: 0,
    new_orders: 0,
    in_production: 0,
    in_sewing: 0,
    ready: 0,
    delivered: 0,
    urgent_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
    total_paid: 0
  };

  const customersData = customersStats?.data?.stats || customersStats?.data || customersStats || {
    total_customers: 0,
    new_customers: 0
  };

  const materialsData = materialsStats?.data?.stats || materialsStats?.data || materialsStats || {
    total_materials: 0,
    low_stock_materials: 0,
    total_value: 0
  };

  const productionData = productionStats?.data?.stats || productionStats?.data || productionStats || {
    total_operations: 0,
    completed_operations: 0
  };

  // Конвертируем данные в числа
  const dashboardData = {
    totalRevenue: parseFloat(ordersData.total_revenue) || 0,
    totalOrders: parseInt(ordersData.total_orders) || 0,
    newOrders: parseInt(ordersData.new_orders) || 0,
    avgOrderValue: parseFloat(ordersData.avg_order_value) || 0,
    paidAmount: parseFloat(ordersData.total_paid) || 0,
    urgentOrders: parseInt(ordersData.urgent_orders) || 0,
    inProduction: parseInt(ordersData.in_production) || 0,
    inSewing: parseInt(ordersData.in_sewing) || 0,
    completed: (parseInt(ordersData.ready) || 0) + (parseInt(ordersData.delivered) || 0),
    lowStockItems: parseInt(materialsData.low_stock_materials) || 0,
    newCustomers: parseInt(customersData.new_customers) || 0,
    totalCustomers: parseInt(customersData.total_customers) || 0,
    totalMaterials: parseInt(materialsData.total_materials) || 0,
    totalValue: parseFloat(materialsData.total_value) || 0
  };

  // Данные для графиков
  const revenueChartData = [
    { name: 'Неделя 1', revenue: 250000, orders: 8 },
    { name: 'Неделя 2', revenue: 320000, orders: 12 },
    { name: 'Неделя 3', revenue: 280000, orders: 10 },
    { name: 'Неделя 4', revenue: 400000, orders: 15 },
  ];

  const ordersStatusData = [
    { 
      name: 'Новые', 
      value: parseInt(ordersData.new_orders) || 0, 
      color: '#3B82F6',
      description: 'Только что созданные заказы, ожидающие подтверждения'
    },
    { 
      name: 'В производстве', 
      value: parseInt(ordersData.in_production) || 0, 
      color: '#F59E0B',
      description: 'Заказы в процессе изготовления'
    },
    { 
      name: 'В пошиве', 
      value: parseInt(ordersData.in_sewing) || 0, 
      color: '#2563EB',
      description: 'Заказы на этапе пошива обивки'
    },
    { 
      name: 'Готовы', 
      value: parseInt(ordersData.ready) || 0, 
      color: '#10B981',
      description: 'Завершенные заказы, готовые к доставке'
    },
    { 
      name: 'Доставлены', 
      value: parseInt(ordersData.delivered) || 0, 
      color: '#8B5CF6',
      description: 'Заказы успешно доставлены клиентам'
    },
    { 
      name: 'Срочные', 
      value: parseInt(ordersData.urgent_orders) || 0, 
      color: '#DC2626',
      description: 'Заказы с высоким приоритетом'
    }
  ].filter(item => item.value > 0);

  // Проверяем есть ли данные для отображения
  const hasData = ordersStatusData.length > 0 && ordersStatusData.some(item => item.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Дашборд</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Обзор ключевых показателей и активности</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Светлая</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Темная</span>
                  </>
                )}
              </button>

              {/* Period Selector */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                {['7', '30', '90'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period}д
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Обновить</span>
              </button>

              {/* Export Button */}
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Экспорт</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800 hover:shadow-lg dark:hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+12.5%</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Общая выручка</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {dashboardData.totalRevenue.toLocaleString()} ₽
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {dashboardData.paidAmount.toLocaleString()} ₽ оплачено
              </p>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+{dashboardData.newOrders}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Заказы</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardData.totalOrders}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {dashboardData.newOrders} новых за {selectedPeriod}д
              </p>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+{dashboardData.newCustomers}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Клиенты</h3>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardData.totalCustomers}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                {dashboardData.newCustomers} новых за {selectedPeriod}д
              </p>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800 hover:shadow-lg dark:hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+8.2%</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Средний чек</h3>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {dashboardData.avgOrderValue.toLocaleString()} ₽
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                За последний месяц
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Urgent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Срочные заказы</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{dashboardData.urgentOrders}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Требуют внимания</p>
          </div>

          {/* Production Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">В производстве</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{dashboardData.inProduction}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Активных заказов</p>
          </div>

          {/* Completed Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Завершено</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{dashboardData.completed}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">За {selectedPeriod} дней</p>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Низкие остатки</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{dashboardData.lowStockItems}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Позиций на складе</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Динамика выручки</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <PieChart className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                      border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: isDarkMode ? '#F9FAFB' : '#111827'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value.toLocaleString()} ₽` : value,
                      name === 'revenue' ? 'Выручка' : 'Заказы'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#14B8A6" 
                    strokeWidth={3}
                    dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#14B8A6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Status Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Статусы заказов</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Распределение заказов по этапам производства
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <PieChart className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={ordersStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ordersStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                        border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: isDarkMode ? '#F9FAFB' : '#111827'
                      }}
                      formatter={(value) => [value, 'Заказов']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg font-medium">Нет данных для отображения</p>
                    <p className="text-sm">Создайте заказы чтобы увидеть статистику</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Легенда с маркерами */}
            {hasData && (
              <div className="mt-4">
                <div className="flex flex-wrap justify-center gap-4">
                  {ordersStatusData.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                      title={item.description}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Последние заказы</h3>
                <button className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium">
                  Все заказы →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {ordersListLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : recentOrders?.data?.orders?.length > 0 ? (
                  recentOrders.data.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          order.priority === 'urgent' ? 'bg-red-500' :
                          order.priority === 'high' ? 'bg-orange-500' :
                          order.priority === 'normal' ? 'bg-teal-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Заказ #{order.order_number}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.customer_name || `Клиент #${order.customer_id}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {order.total_amount ? order.total_amount.toLocaleString() : '0'} ₽
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Нет заказов</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Production Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Активность производства</h3>
                <button className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium">
                  Все операции →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Нет активных операций</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;