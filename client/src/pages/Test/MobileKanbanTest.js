import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Phone, 
  Calendar, 
  User, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

const MobileKanbanTest = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Тестовые данные
  const mockOrders = [
    {
      id: 1,
      title: 'Диван "Комфорт"',
      customer: 'Иванов И.И.',
      priority: 'high',
      status: 'new',
      deadline: '2025-09-25',
      description: 'Мягкий диван с подушками'
    },
    {
      id: 2,
      title: 'Кресло "Офис"',
      customer: 'Петров П.П.',
      priority: 'medium',
      status: 'in_production',
      deadline: '2025-09-22',
      description: 'Офисное кресло черного цвета'
    },
    {
      id: 3,
      title: 'Стол "Рабочий"',
      customer: 'Сидоров С.С.',
      priority: 'low',
      status: 'ready',
      deadline: '2025-09-20',
      description: 'Деревянный рабочий стол'
    },
    {
      id: 4,
      title: 'Шкаф "Классик"',
      customer: 'Козлов К.К.',
      priority: 'urgent',
      status: 'new',
      deadline: '2025-09-18',
      description: 'Двухстворчатый шкаф'
    },
    {
      id: 5,
      title: 'Кровать "Сон"',
      customer: 'Морозов М.М.',
      priority: 'high',
      status: 'in_production',
      deadline: '2025-09-28',
      description: 'Двуспальная кровать с матрасом'
    }
  ];

  const columns = [
    { id: 'new', title: 'Новые', color: 'bg-blue-100' },
    { id: 'in_production', title: 'В производстве', color: 'bg-purple-100' },
    { id: 'ready', title: 'Готовы', color: 'bg-green-100' },
    { id: 'shipped', title: 'Отгружены', color: 'bg-orange-100' }
  ];

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴'
  };

  useEffect(() => {
    // Имитация загрузки данных
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newOrders = [...orders];
    const order = newOrders.find(o => o.id === parseInt(draggableId));
    
    if (order) {
      order.status = destination.droppableId;
      setOrders(newOrders);
    }
  };

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const filteredOrders = orders.filter(order => 
    order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOrdersForColumn = (status) => {
    return filteredOrders.filter(order => order.status === status);
  };

  const nextColumn = () => {
    if (currentColumn < columns.length - 1) {
      setCurrentColumn(currentColumn + 1);
    }
  };

  const prevColumn = () => {
    if (currentColumn > 0) {
      setCurrentColumn(currentColumn - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка Канбана...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильный заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Канбан (Мобильный)</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Поиск */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск заказов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Навигация по колонкам */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={prevColumn}
            disabled={currentColumn === 0}
            className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex-1 text-center">
            <h2 className="text-lg font-medium text-gray-900">
              {columns[currentColumn].title}
            </h2>
            <p className="text-sm text-gray-500">
              {getOrdersForColumn(columns[currentColumn].id).length} заказов
            </p>
          </div>
          
          <button
            onClick={nextColumn}
            disabled={currentColumn === columns.length - 1}
            className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Канбан доска */}
      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={columns[currentColumn].id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-96 p-4 rounded-lg border-2 border-dashed ${
                  snapshot.isDraggingOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  {getOrdersForColumn(columns[currentColumn].id).map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
                            snapshot.isDragging ? 'shadow-lg transform rotate-2' : ''
                          }`}
                        >
                          {/* Заголовок карточки */}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm leading-tight">
                              {order.title}
                            </h3>
                            <span className="text-lg">
                              {priorityIcons[order.priority]}
                            </span>
                          </div>

                          {/* Клиент */}
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{order.customer}</span>
                          </div>

                          {/* Приоритет */}
                          <div className="mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority]}`}>
                              {order.priority === 'low' && 'Низкий'}
                              {order.priority === 'medium' && 'Средний'}
                              {order.priority === 'high' && 'Высокий'}
                              {order.priority === 'urgent' && 'Срочный'}
                            </span>
                          </div>

                          {/* Срок */}
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{order.deadline}</span>
                          </div>

                          {/* Описание */}
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {order.description}
                          </p>

                          {/* Действия */}
                          <div className="mt-3 flex space-x-2">
                            <button className="flex-1 bg-blue-50 text-blue-700 text-xs py-1 px-2 rounded hover:bg-blue-100">
                              Подробнее
                            </button>
                            <button className="flex-1 bg-green-50 text-green-700 text-xs py-1 px-2 rounded hover:bg-green-100">
                              Изменить
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Индикаторы колонок */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2 bg-white rounded-full shadow-lg px-4 py-2">
          {columns.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentColumn(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentColumn ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Фильтры (если открыты) */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-lg w-full max-h-96 p-4">
            <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет
                </label>
                <div className="flex space-x-2">
                  {Object.keys(priorityColors).map(priority => (
                    <button
                      key={priority}
                      className={`px-3 py-1 rounded-full text-xs ${priorityColors[priority]}`}
                    >
                      {priority === 'low' && 'Низкий'}
                      {priority === 'medium' && 'Средний'}
                      {priority === 'high' && 'Высокий'}
                      {priority === 'urgent' && 'Срочный'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileKanbanTest;
