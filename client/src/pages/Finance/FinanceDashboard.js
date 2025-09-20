import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Eye,
  FileText
} from 'lucide-react';

const FinanceDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [financialData, setFinancialData] = useState(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем заказы
      const ordersRes = await fetch('/api/orders?limit=100');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        console.error('Ошибка загрузки заказов:', ordersRes.status);
        setOrders([]);
      }

      // Загружаем финансовые данные
      const financeRes = await fetch(`/api/finance/overview?period=${timeRange}`);
      if (financeRes.ok) {
        const financeData = await financeRes.json();
        setFinancialData(financeData);
      } else {
        console.error('Ошибка загрузки финансовых данных:', financeRes.status);
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Моковые данные для демонстрации
  const mockData = {
    kpis: {
      totalRevenue: 2450000,
      profit: 735000,
      avgOrderValue: 125000,
      totalOrders: 196,
      conversionRate: 23.5,
      customerLifetimeValue: 450000
    },
    revenueData: [
      { month: 'Янв', revenue: 180000, orders: 12 },
      { month: 'Фев', revenue: 220000, orders: 15 },
      { month: 'Мар', revenue: 195000, orders: 13 },
      { month: 'Апр', revenue: 280000, orders: 18 },
      { month: 'Май', revenue: 320000, orders: 22 },
      { month: 'Июн', revenue: 245000, orders: 16 },
      { month: 'Июл', revenue: 310000, orders: 21 },
      { month: 'Авг', revenue: 275000, orders: 19 },
      { month: 'Сен', revenue: 350000, orders: 25 },
      { month: 'Окт', revenue: 420000, orders: 28 },
      { month: 'Ноя', revenue: 380000, orders: 26 },
      { month: 'Дек', revenue: 450000, orders: 32 }
    ],
    topCustomers: [
      { name: 'ООО "Мебель Плюс"', revenue: 450000, orders: 8 },
      { name: 'ИП Иванов И.И.', revenue: 320000, orders: 5 },
      { name: 'ООО "Дом и Сад"', revenue: 280000, orders: 6 },
      { name: 'ИП Петрова А.С.', revenue: 250000, orders: 4 },
      { name: 'ООО "Интерьер"', revenue: 220000, orders: 3 }
    ],
    productProfitability: [
      { name: 'Диваны', revenue: 1200000, profit: 360000, margin: 30 },
      { name: 'Кресла', revenue: 800000, profit: 240000, margin: 30 },
      { name: 'Столы', revenue: 600000, profit: 180000, margin: 30 },
      { name: 'Стулья', revenue: 400000, profit: 120000, margin: 30 },
      { name: 'Шкафы', revenue: 300000, profit: 90000, margin: 30 }
    ],
    costStructure: [
      { category: 'Материалы', amount: 980000, percentage: 40 },
      { category: 'Зарплата', amount: 735000, percentage: 30 },
      { category: 'Аренда', amount: 245000, percentage: 10 },
      { category: 'Маркетинг', amount: 196000, percentage: 8 },
      { category: 'Прочее', amount: 294000, percentage: 12 }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  useEffect(() => {
    // Симуляция загрузки данных
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Финансовая аналитика</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Полный обзор финансовых показателей и трендов</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="week">Неделя</option>
                <option value="month">Месяц</option>
                <option value="quarter">Квартал</option>
                <option value="year">Год</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общая выручка</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {formatCurrency(mockData.kpis.totalRevenue)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">+12.5%</span>
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Прибыль</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {formatCurrency(mockData.kpis.profit)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">+8.3%</span>
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Средний чек</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {formatCurrency(mockData.kpis.avgOrderValue)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">-2.1%</span>
                  <ArrowDownRight className="w-3 h-3 text-red-600 dark:text-red-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 ml-2">
                <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Заказы</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {formatNumber(mockData.kpis.totalOrders)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">+15.2%</span>
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0 ml-2">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Конверсия</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {mockData.kpis.conversionRate}%
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">+3.2%</span>
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0 ml-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">LTV клиента</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {formatCurrency(mockData.kpis.customerLifetimeValue)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">+5.7%</span>
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400 ml-1 flex-shrink-0" />
                </div>
              </div>
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex-shrink-0 ml-2">
                <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Динамика выручки */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Динамика выручки</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Выручка</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Заказы</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-1 overflow-hidden">
              {mockData.revenueData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg mb-2 relative h-48">
                    <div 
                      className="bg-teal-500 rounded-t-lg transition-all duration-500 hover:bg-teal-600 absolute bottom-0 w-full"
                      style={{ height: `${Math.max((item.revenue / 500000) * 200, 4)}px` }}
                    ></div>
                    <div 
                      className="bg-blue-500 rounded-t-lg absolute bottom-0 w-full opacity-70"
                      style={{ height: `${Math.max((item.orders / 35) * 100, 2)}px` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate w-full text-center">{item.month}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Структура затрат */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Структура затрат</h3>
            <div className="space-y-4">
              {mockData.costStructure.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                      style={{ 
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-shrink-0">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right flex-shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right flex-shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Таблицы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Топ клиенты */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Топ клиенты</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockData.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{customer.orders} заказов</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(customer.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Прибыльность продуктов */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Прибыльность продуктов</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockData.productProfitability.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Маржа: {product.margin}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.profit)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        из {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Таблица заказов с финансовой аналитикой */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Финансовая аналитика по заказам
              </h3>
              <div className="flex items-center space-x-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="week">За неделю</option>
                  <option value="month">За месяц</option>
                  <option value="quarter">За квартал</option>
                  <option value="year">За год</option>
                </select>
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center text-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Заказ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Затраты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Прибыль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Рентабельность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(orders) && orders.length > 0 ? orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            #{order.order_number}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.title || `Заказ #${order.order_number}`}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount * 0.7)} {/* Примерная стоимость материалов */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(order.total_amount * 0.3)} {/* Примерная прибыль */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: '30%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">30%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : order.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {order.status === 'completed' ? 'Завершен' : 
                         order.status === 'in_progress' ? 'В работе' : 'Новый'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/finance/orders/${order.id}`}
                        className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Детали
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg font-medium mb-2">Нет заказов</p>
                        <p className="text-sm">Заказы появятся здесь после загрузки данных</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
