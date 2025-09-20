import React, { useMemo } from 'react';
import { TrendingUp, ShoppingCart, CreditCard, Calculator } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon, gradient, trend }) => (
  <div className={`relative overflow-hidden rounded-xl p-6 text-white bg-gradient-to-br ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
        <p className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform duration-200">{value}</p>
        {subtitle && (
          <p className="text-sm text-white/70 flex items-center">
            {trend && (
              <span className={`mr-1 ${trend > 0 ? 'text-green-200' : trend < 0 ? 'text-red-200' : 'text-white/70'}`}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 p-3 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-200">
        {icon}
      </div>
    </div>
    {/* Декоративные элементы */}
    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-300"></div>
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
  </div>
);

const OrdersStatistics = ({ orders = [] }) => {
  // Рассчитываем статистику
  const statistics = useMemo(() => {
    const totalOrders = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || 0), 0
    );
    
    const totalPaid = orders.reduce((sum, order) => 
      sum + parseFloat(order.paid_amount || 0), 0
    );
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const paidPercentage = totalRevenue > 0 ? (totalPaid / totalRevenue * 100) : 0;
    
    return {
      totalOrders,
      totalRevenue,
      totalPaid,
      avgOrderValue,
      paidPercentage
    };
  }, [orders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  // Генерируем случайные тренды для демонстрации
  const trends = {
    orders: Math.round(Math.random() * 20 - 10),
    revenue: Math.round(Math.random() * 15 - 5),
    paid: statistics.paidPercentage > 100 ? 1 : -1,
    avg: Math.round(Math.random() * 10 - 5)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Всего заказов */}
      <StatCard
        title="Всего заказов"
        value={formatNumber(statistics.totalOrders)}
        subtitle={`${trends.orders > 0 ? '+' : ''}${trends.orders}% за месяц`}
        icon={<ShoppingCart className="w-6 h-6 text-white" />}
        gradient="from-blue-500 to-blue-600"
        trend={trends.orders}
      />

      {/* Общая выручка */}
      <StatCard
        title="Общая выручка"
        value={formatCurrency(statistics.totalRevenue)}
        subtitle={`${trends.revenue > 0 ? '+' : ''}${trends.revenue}% к прошлому месяцу`}
        icon={<TrendingUp className="w-6 h-6 text-white" />}
        gradient="from-emerald-500 to-emerald-600"
        trend={trends.revenue}
      />

      {/* Оплачено */}
      <StatCard
        title="Оплачено"
        value={formatCurrency(statistics.totalPaid)}
        subtitle={`${statistics.paidPercentage.toFixed(1)}% от общей суммы`}
        icon={<CreditCard className="w-6 h-6 text-white" />}
        gradient="from-purple-500 to-purple-600"
        trend={trends.paid}
      />

      {/* Средний чек */}
      <StatCard
        title="Средний чек"
        value={formatCurrency(statistics.avgOrderValue)}
        subtitle={`${trends.avg > 0 ? '+' : ''}${trends.avg}% к среднему`}
        icon={<Calculator className="w-6 h-6 text-white" />}
        gradient="from-orange-500 to-orange-600"
        trend={trends.avg}
      />
    </div>
  );
};

export default OrdersStatistics;
