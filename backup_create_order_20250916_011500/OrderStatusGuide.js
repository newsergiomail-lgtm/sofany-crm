import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Plus, CheckCircle, Settings, Scissors, Package, Truck, Home, X } from 'lucide-react';

const OrderStatusGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses = [
    { 
      status: 'new', 
      label: 'Новый', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      description: 'Заказ создан и ожидает обработки',
      icon: Plus,
      iconColor: 'text-blue-600'
    },
    { 
      status: 'confirmed', 
      label: 'Подтвержден', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      description: 'Заказ подтвержден клиентом',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    { 
      status: 'in_production', 
      label: 'В производстве', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      description: 'Заказ находится в процессе изготовления',
      icon: Settings,
      iconColor: 'text-yellow-600'
    },
    { 
      status: 'in_sewing', 
      label: 'В пошиве', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      description: 'Заказ находится в процессе пошива. Может параллельно шиться и быть в другом статусе производства',
      icon: Scissors,
      iconColor: 'text-blue-600'
    },
    { 
      status: 'ready', 
      label: 'Готов', 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      description: 'Заказ готов к выдаче',
      icon: Package,
      iconColor: 'text-purple-600'
    },
    { 
      status: 'shipped', 
      label: 'Отправлен', 
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
      description: 'Заказ отправлен клиенту',
      icon: Truck,
      iconColor: 'text-indigo-600'
    },
    { 
      status: 'delivered', 
      label: 'Доставлен', 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
      description: 'Заказ доставлен клиенту',
      icon: Home,
      iconColor: 'text-emerald-600'
    },
    { 
      status: 'cancelled', 
      label: 'Отменен', 
      color: 'bg-red-100 text-red-800 border-red-200', 
      description: 'Заказ отменен',
      icon: X,
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="card border border-gray-200 bg-white shadow-sm">
      <div className="card-content">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <HelpCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Справочник статусов и приоритетов</h3>
              <p className="text-sm text-gray-600">Нажмите, чтобы развернуть</p>
            </div>
          </div>
          <div className="p-1 rounded-full group-hover:bg-gray-100 transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {statuses.map((status) => {
                const IconComponent = status.icon;
                return (
                  <div key={status.status} className="group">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200">
                      <div className={`p-2 rounded-lg bg-white border border-gray-200 ${status.iconColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{status.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Приоритеты заказов */}
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Приоритеты заказов</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">В</span>
                  </div>
                  <div>
                    <div className="font-semibold text-red-800">Высокий приоритет</div>
                    <div className="text-sm text-red-600">Срочные заказы</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">С</span>
                  </div>
                  <div>
                    <div className="font-semibold text-yellow-800">Средний приоритет</div>
                    <div className="text-sm text-yellow-600">Обычные заказы</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Н</span>
                  </div>
                  <div>
                    <div className="font-semibold text-green-800">Низкий приоритет</div>
                    <div className="text-sm text-green-600">Несрочные заказы</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>💡 Совет:</strong> Статусы заказов помогают отслеживать прогресс выполнения. 
                Кликните на статус в таблице для быстрого изменения.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>✂️ Особенность "В пошиве":</strong> Этот бейджик может отображаться параллельно с основным статусом заказа, 
                указывая на то, что заказ одновременно находится в процессе пошива.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>🎯 Приоритеты:</strong> Цветные кружки с буквами показывают приоритет заказа. 
                Изменить приоритет можно в детальной карточке заказа или в канбане.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusGuide;
