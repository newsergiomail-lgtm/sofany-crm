import React from 'react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import ListChecks from 'lucide-react/dist/esm/icons/list-checks';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import CalendarX from 'lucide-react/dist/esm/icons/calendar-x';
import Factory from 'lucide-react/dist/esm/icons/factory';
import SquarePen from 'lucide-react/dist/esm/icons/edit-3';
import Hammer from 'lucide-react/dist/esm/icons/hammer';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Scissors from 'lucide-react/dist/esm/icons/scissors';
import Sofa from 'lucide-react/dist/esm/icons/sofa';
import Package from 'lucide-react/dist/esm/icons/package';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

const STAGE_ICONS = {
  'КБ': <SquarePen className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Столярный цех': <Hammer className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Формовка': <Layers className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Швейный цех': <Scissors className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Обивка': <Sofa className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Сборка и упаковка': <Package className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />,
  'Отгружен': <Truck className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-300" />
};

const StatCard = ({ title, value, icon, subtitle, className }) => (
  <div className={`bg-gradient-to-r ${className} rounded-xl p-6 shadow-lg text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-100 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-blue-200 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="text-4xl text-blue-200">
        {icon}
      </div>
    </div>
  </div>
);

const StageCard = ({ stage, count, totalAmount, prepaymentAmount }) => {
  const formatCurrency = (amount) => `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
  const icon = STAGE_ICONS[stage] || null;

  return (
    <div className="relative bg-emerald-50 dark:bg-gray-800/30 rounded-xl p-4 text-center transition-all duration-300 border-2 border-emerald-500/50 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <div className="mb-3">{icon}</div>
      <h4 className="font-bold text-md text-emerald-900 dark:text-emerald-200 -mt-2">{stage}</h4>
      <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-200 absolute -top-2 -right-2">
        {count}
      </span>
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-3 text-left">
        <div className="flex justify-between">
          <span>Сумма:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Предоплаты:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(prepaymentAmount)}</span>
        </div>
      </div>
    </div>
  );
};


const ProductionStats = ({ orders }) => {
  const totalOrders = orders.length;
  
  // Заказы в работе (активные в производстве)
  const ordersInWork = orders.filter(order => 
    order.status === 'in_production' && 
    (order.production_status === 'in_progress' || order.production_status === null) &&
    order.production_stage !== 'Отгружен'
  ).length;

  const now = new Date();
  const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

  const dueThisWeek = orders.filter(order => {
    if (!order.delivery_date) return false;
    const dueDate = parseISO(order.delivery_date);
    return isWithinInterval(dueDate, { start: startOfCurrentWeek, end: endOfCurrentWeek });
  }).length;

  const overdueOrders = orders.filter(order => {
    if (!order.delivery_date) return false;
    const dueDate = parseISO(order.delivery_date);
    return dueDate < now && order.production_status !== 'completed' && order.production_stage !== 'Отгружен';
  }).length;
  
  const inProgressOrders = orders.filter(order => 
    order.production_stage && 
    order.production_stage !== 'КБ' && 
    order.production_stage !== 'Отгружен'
  ).length;

  const STAGES = ['КБ', 'Столярный цех', 'Формовка', 'Швейный цех', 'Обивка', 'Сборка и упаковка', 'Отгружен'];
  
  const stageStats = STAGES.map(stage => {
    // Фильтруем заказы по этапу, учитывая что заказы без этапа считаются в КБ
    const ordersInStage = orders.filter(order => (order.production_stage || 'КБ') === stage);
    const totalAmount = ordersInStage.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const prepaymentAmount = ordersInStage.reduce((sum, order) => sum + (parseFloat(order.paid_amount) || 0), 0);
    return {
      stage,
      count: ordersInStage.length,
      totalAmount,
      prepaymentAmount,
    };
  });


  // Уникальные производственные метрики
  const ordersWithValidDates = orders.filter(order => {
    if (!order.created_at || !order.delivery_date) return false;
    const created = new Date(order.created_at);
    const delivery = new Date(order.delivery_date);
    // Исключаем заказы с датами в прошлом и заказы, где дата доставки раньше даты создания
    return delivery > created && delivery > now;
  });
  
  const avgProductionTime = ordersWithValidDates.length > 0 ? 
    Math.round(ordersWithValidDates.reduce((sum, order) => {
      const created = new Date(order.created_at);
      const delivery = new Date(order.delivery_date);
      const days = (delivery - created) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0) / ordersWithValidDates.length) : 0;

  const efficiencyRate = orders.length > 0 ? 
    Math.round((orders.filter(order => order.production_stage === 'Отгружен').length / orders.length) * 100) : 0;

  // Используем доступные данные для расчета затрат
  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
  const totalPaid = orders.reduce((sum, order) => sum + (parseFloat(order.paid_amount) || 0), 0);
  const unpaidAmount = totalRevenue - totalPaid;
  
  // Примерная оценка материальных затрат (30% от стоимости заказа)
  const estimatedMaterialCosts = totalRevenue * 0.3;
  // Примерная оценка трудозатрат (40% от стоимости заказа)  
  const estimatedLaborCosts = totalRevenue * 0.4;
  const totalEstimatedCosts = estimatedMaterialCosts + estimatedLaborCosts;
  
  const costEfficiency = totalRevenue > 0 ? Math.round((totalEstimatedCosts / totalRevenue) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Средний срок производства" 
          value={`${avgProductionTime} дн.`} 
          subtitle={`${ordersInWork} заказов в работе`}
          icon={<Clock className="text-4xl" />}
          className="from-blue-500 to-purple-600"
        />
        <StatCard 
          title="Эффективность производства" 
          value={`${efficiencyRate}%`} 
          subtitle={`${orders.filter(order => order.production_stage === 'Отгружен').length} завершено`}
          icon={<CheckCircle className="text-4xl" />}
          className="from-cyan-400 to-blue-500"
        />
        <StatCard 
          title="Затраты на материалы" 
          value={`${Math.round(estimatedMaterialCosts).toLocaleString()} ₽`} 
          subtitle={`${Math.round(estimatedLaborCosts).toLocaleString()} ₽ на труд`}
          icon={<Layers className="text-4xl" />}
          className="from-pink-500 to-yellow-500"
        />
        <StatCard 
          title="Эффективность затрат" 
          value={`${costEfficiency}%`} 
          subtitle={`${Math.round(totalEstimatedCosts).toLocaleString()} ₽ общие затраты`}
          icon={<TrendingUp className="text-4xl" />}
          className="from-red-500 to-pink-500"
        />
      </div>
      
      {/* Компактная таблица этапов производства */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-emerald-500" />
            Этапы производства
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Этап</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Заказов</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Предоплата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stageStats.map(stat => {
                const icon = STAGE_ICONS[stat.stage];
                const formatCurrency = (amount) => `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
                
                return (
                  <tr key={stat.stage} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          {icon}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.stage}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stat.count > 0 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {stat.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(stat.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(stat.prepaymentAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ProductionStats;
