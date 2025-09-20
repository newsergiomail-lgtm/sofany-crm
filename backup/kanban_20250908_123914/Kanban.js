import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import OrderEditPanel from '../../components/Orders/OrderEditPanel';

const Kanban = () => {
  const queryClient = useQueryClient();
  const kanbanContainerRef = useRef(null);
  const kanbanWrapperRef = useRef(null);

  // Состояние приложения
  const [appState, setAppState] = useState({
    editingColumn: null,
    editingCard: null,
    currentView: 'normal', // 'normal' или 'compact'
    selectedOrder: null,
    selectedColumnColor: "#f1f5f9",
    selectedCardColor: "#ffffff",
    showAddColumnModal: false,
    showAddCardModal: false,
    showEditColumnModal: false,
    showEditCardModal: false,
    newColumnTitle: '',
    newCardData: { client: '', price: 0, deadline: '' },
    editingColumnData: { id: null, title: '', color: '#f1f5f9' },
    editingCardData: { id: null, client: '', price: 0, deadline: '', color: '#ffffff' },
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    showLeftIndicator: true,
    showRightIndicator: true
  });

  // Данные канбана - этапы производства
  const [kanbanData, setKanbanData] = useState({
    columns: [
      { id: 1, title: "КБ", color: "#d1fae5", cards: [] },
      { id: 2, title: "Столярный цех", color: "#fef3c7", cards: [] },
      { id: 3, title: "Формовка ППУ", color: "#e0e7ff", cards: [] },
      { id: 4, title: "Швейный цех", color: "#f3e8ff", cards: [] },
      { id: 5, title: "Сборка и упаковка", color: "#fce7f3", cards: [] },
      { id: 6, title: "Готов к отгрузке", color: "#d1fae5", cards: [] },
      { id: 7, title: "Отгружен", color: "#e0f7f7", cards: [] }
    ]
  });

  // Загрузка данных канбана
  const { isLoading, error, refetch } = useQuery(
    ['kanban'],
    () => ordersAPI.getKanbanData(),
    {
      onSuccess: (data) => {
        console.log('Kanban data loaded:', data);
        setKanbanData(data);
      },
      refetchInterval: 30000, // Обновляем каждые 30 секунд
    }
  );

  // Мутация для обновления статуса заказа
  const updateOrderStatusMutation = useMutation(
    ({ orderId, status }) => ordersAPI.update(orderId, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders', 'production']);
      }
    }
  );

  // Получить ID статуса для колонки
  const getOrderStatusId = (status) => {
    const statusMap = {
      'confirmed': 1,      // Заказ принят
      'in_production': 2,  // Закупка
      'design': 3,         // КБ
      'woodwork': 4,       // Столярный цех
      'sewing': 5,         // Швейный цех
      'upholstery': 6,     // Обивочный цех
      'ready': 7           // Склад ГП
    };
    return statusMap[status] || 1;
  };

  // Получить название статуса по ID
  const getStatusName = (statusId) => {
    const column = kanbanData.columns.find(c => c.id === statusId);
    return column ? column.title : 'Неизвестно';
  };

  // Проверка просроченности
  const isOverdue = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const getColumnPrepaymentTotal = (cards) => {
    return cards.reduce((total, card) => total + (card.prepayment || 0), 0);
  };

  // Получить цвет статуса
  const getStatusColor = (statusId) => {
    const statusColors = {
      1: '#0ea5a5', // Заказ принят
      2: '#3b82f6', // Закупка
      3: '#8b5cf6', // КБ
      4: '#f59e0b', // Столярный цех
      5: '#ec4899', // Швейный цех
      6: '#10b981', // Обивочный цех
      7: '#64748b'  // Склад ГП
    };
    return statusColors[statusId] || '#0ea5a5';
  };



  // Поиск карточки по ID
  const findCardById = (cardId) => {
    for (const column of kanbanData.columns) {
      const card = column.cards.find(c => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  // Загрузка предпочтений вида
  useEffect(() => {
    const savedView = localStorage.getItem('kanbanView');
    if (savedView) {
      setAppState(prev => ({ ...prev, currentView: savedView }));
    }
  }, []);




  // Настройка горизонтальной прокрутки
  const setupHorizontalScroll = useCallback(() => {
    if (!kanbanContainerRef.current) return;

    const container = kanbanContainerRef.current;

    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Только левая кнопка мыши
      setAppState(prev => ({
        ...prev,
        isDragging: true,
        startX: e.pageX - container.offsetLeft,
        scrollLeft: container.scrollLeft
      }));
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
      setAppState(prev => ({ ...prev, isDragging: false }));
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    };

    const handleMouseMove = (e) => {
      if (!appState.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - appState.startX) * 2; // Умножаем для более быстрой прокрутки
      container.scrollLeft = appState.scrollLeft - walk;
      updateScrollIndicators();
    };

    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      container.scrollLeft += e.deltaY;
      updateScrollIndicators();
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', updateScrollIndicators);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', updateScrollIndicators);
    };
  }, [appState.isDragging, appState.startX, appState.scrollLeft]);

  // Обновление индикаторов прокрутки
  const updateScrollIndicators = useCallback(() => {
    if (!kanbanContainerRef.current) return;
    
    const container = kanbanContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setAppState(prev => ({
        ...prev,
      showLeftIndicator: scrollLeft > 10,
      showRightIndicator: scrollLeft < scrollWidth - clientWidth - 10 || scrollWidth > clientWidth
    }));
  }, []);

  // Инициализация приложения
  useEffect(() => {
    const cleanup = setupHorizontalScroll();
    updateScrollIndicators();
    loadViewPreference();
    
    return cleanup;
  }, [setupHorizontalScroll, updateScrollIndicators]);

  // Обновление индикаторов при изменении размера окна
  useEffect(() => {
    const handleResize = () => updateScrollIndicators();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollIndicators]);

  // Функции для работы с модальными окнами
  const showAddColumnModal = () => {
      setAppState(prev => ({
        ...prev,
      editingColumn: null,
      showAddColumnModal: true,
      newColumnTitle: '',
      selectedColumnColor: "#f1f5f9"
    }));
  };

  const showEditColumnModal = (column) => {
      setAppState(prev => ({
        ...prev,
      editingColumn: column,
        showEditColumnModal: true,
        editingColumnData: {
          id: column.id,
          title: column.title,
          color: column.color
      },
      selectedColumnColor: column.color
      }));
  };

  const showAddCardModal = (columnId) => {
    setAppState(prev => ({
        ...prev,
      editingCard: { status: columnId },
      showAddCardModal: true,
      newCardData: { client: '', price: 0, deadline: '' },
      selectedCardColor: "#ffffff"
    }));
  };

  const showEditCardModal = (card) => {
      setAppState(prev => ({
        ...prev,
      editingCard: card,
      showEditCardModal: true,
      editingCardData: {
        id: card.id,
        client: card.client,
        price: card.price,
        deadline: card.deadline,
        color: card.color
      },
      selectedCardColor: card.color
    }));
  };

  const closeModal = () => {
    setAppState(prev => ({
      ...prev,
      showAddColumnModal: false,
        showEditColumnModal: false,
      editingColumn: null,
        editingColumnData: { id: null, title: '', color: '#f1f5f9' }
      }));
  };

  const closeCardModal = () => {
    setAppState(prev => ({
        ...prev,
      showAddCardModal: false,
      showEditCardModal: false,
      editingCard: null,
      editingCardData: { id: null, client: '', price: 0, deadline: '', color: '#ffffff' }
    }));
  };

  const saveColumn = () => {
    const title = appState.editingColumn ? appState.editingColumnData.title : appState.newColumnTitle;
    
    if (!title.trim()) {
      alert('Введите название колонки');
      return;
    }
    
    if (appState.editingColumn) {
      // Редактирование существующей колонки
      setKanbanData(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
          col.id === appState.editingColumn.id
            ? { ...col, title: title, color: appState.selectedColumnColor }
            : col
        )
      }));
    } else {
      // Добавление новой колонки
      const newId = kanbanData.columns.length > 0 
        ? Math.max(...kanbanData.columns.map(c => c.id)) + 1 
        : 1;
      
      setKanbanData(prev => ({
        ...prev,
        columns: [...prev.columns, {
          id: newId,
          title: title,
          color: appState.selectedColumnColor,
          cards: []
        }]
      }));
    }
    
    closeModal();
  };

  const saveCard = () => {
    const client = appState.editingCard.id ? appState.editingCardData.client : appState.newCardData.client;
    const price = appState.editingCard.id ? appState.editingCardData.price : appState.newCardData.price;
    const deadline = appState.editingCard.id ? appState.editingCardData.deadline : appState.newCardData.deadline;
    
    if (!client.trim() || !price || !deadline) {
      alert('Заполните все поля');
      return;
    }
    
    if (appState.editingCard.id) {
      // Редактирование существующей карточки
      setKanbanData(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          cards: col.cards.map(card =>
            card.id === appState.editingCard.id
              ? {
                  ...card,
                  client: client,
                  price: price,
                  deadline: deadline,
                  color: appState.selectedCardColor,
                  overdue: isOverdue(deadline)
                }
              : card
          )
        }))
      }));
    } else {
      // Добавление новой карточки
      const newId = kanbanData.columns.reduce((maxId, column) => {
        const columnMax = column.cards.reduce((max, card) => Math.max(max, card.id), 0);
        return Math.max(maxId, columnMax);
      }, 0) + 1;
      
      const newCard = {
        id: newId,
        client: client,
        price: price,
        deadline: deadline,
        status: appState.editingCard.status,
        color: appState.selectedCardColor,
        overdue: isOverdue(deadline)
      };
      
      setKanbanData(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
          col.id === appState.editingCard.status
            ? { ...col, cards: [...col.cards, newCard] }
            : col
        )
      }));
    }
    
    closeCardModal();
  };

  const deleteColumn = (columnId) => {
    if (!window.confirm('Удалить колонку? Все карточки в ней будут также удалены.')) {
      return;
    }
    
      setKanbanData(prev => ({
        ...prev,
      columns: prev.columns.filter(col => col.id !== columnId)
    }));
  };

  const showOrderDetails = (orderId) => {
    console.log('showOrderDetails called with orderId:', orderId);
    const order = findCardById(orderId);
    console.log('Found order:', order);
    if (!order) {
      console.log('Order not found');
      return;
    }
    
    console.log('Setting selectedOrder:', order);
    setAppState(prev => {
      const newState = { ...prev, selectedOrder: order };
      console.log('New appState after setAppState:', newState);
      return newState;
    });
  };

  const hideOrderDetail = () => {
    setAppState(prev => ({ ...prev, selectedOrder: null }));
  };

  const switchView = (viewType) => {
    setAppState(prev => ({ ...prev, currentView: viewType }));
    localStorage.setItem('kanbanView', viewType);
  };

  const loadViewPreference = () => {
    const savedView = localStorage.getItem('kanbanView');
    if (savedView) {
      setAppState(prev => ({ ...prev, currentView: savedView }));
    }
  };

  // Drag and Drop обработчики
  const handleDragStart = (e, cardId) => {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', cardId.toString());
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('text/plain'));
    const card = findCardById(cardId);
    
    if (card && card.status !== columnId) {
      updateCardStatus(card.id, columnId);
    }
  };

  const updateCardStatus = async (cardId, newStatus) => {
    try {
      const targetColumn = kanbanData.columns.find(col => col.id === newStatus);
      if (!targetColumn) return;
      
      // Обновляем этап производства на сервере
      await ordersAPI.updateProductionStage(cardId, targetColumn.title);
      
      // Обновляем локальное состояние
      let cardToMove = null;
      const updatedColumns = kanbanData.columns.map(column => {
        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          cardToMove = column.cards[cardIndex];
          return {
            ...column,
            cards: column.cards.filter(c => c.id !== cardId)
          };
        }
        return column;
      });

      // Обновляем статус и добавляем в новую колонку
      if (cardToMove) {
        cardToMove.status = newStatus;
        const finalColumns = updatedColumns.map(column => {
          if (column.id === newStatus) {
            return {
              ...column,
              cards: [...column.cards, cardToMove]
            };
          }
          return column;
        });
        setKanbanData(prev => ({ ...prev, columns: finalColumns }));
      }
      
      // Обновляем данные с сервера
      refetch();
    } catch (error) {
      console.error('Ошибка обновления этапа производства:', error);
      // В случае ошибки можно показать уведомление пользователю
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки заказов</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary btn-md"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">Sofany Pro CRM</div>
        <div className="user-info">
          <span>Менеджер: </span>
          <span style={{color: 'var(--primary)', fontWeight: 600}}>Анна Петрова</span>
        </div>
      </header>

      {/* Controls */}
      <div className="controls">
        <h2>Канбан-доска заказов</h2>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${appState.currentView === 'normal' ? 'active' : ''}`}
            onClick={() => switchView('normal')}
          >
            Обычный вид
          </button>
          <button 
            className={`toggle-btn ${appState.currentView === 'compact' ? 'active' : ''}`}
            onClick={() => switchView('compact')}
          >
            Компактный вид
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-container-wrapper" ref={kanbanWrapperRef}>
        <div className={`scroll-indicator left ${appState.showLeftIndicator ? 'visible' : ''}`}>
          <div className="scroll-indicator-icon" onClick={() => {
            if (kanbanContainerRef.current) {
              kanbanContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
            }
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </div>
        </div>
        
        <div 
          className="kanban-container"
          ref={kanbanContainerRef}
          style={{ cursor: appState.isDragging ? 'grabbing' : 'grab' }}
      >
        {kanbanData.columns.map((column) => (
          <div 
            key={column.id}
              className="kanban-column"
            style={{ backgroundColor: column.color }}
          >
              <div className="kanban-column-header">
                <div className="kanban-column-title-section">
                  <h3 className="kanban-column-title">{column.title}</h3>
                  {getColumnPrepaymentTotal(column.cards) > 0 && (
                    <div className="kanban-column-total">
                      Предоплата: {getColumnPrepaymentTotal(column.cards).toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
                <div className="kanban-column-actions">
                <button 
                    className="column-action-btn edit-column"
                    title="Редактировать"
                    onClick={() => showEditColumnModal(column)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="icon-thin">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button 
                    className="column-action-btn delete-column"
                    title="Удалить"
                  onClick={() => deleteColumn(column.id)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="icon-thin">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
              </div>
            </div>

            <div 
                className="kanban-cards"
              data-column-id={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {column.cards.length === 0 ? (
                  <div className="kanban-card-placeholder">Перетащите карточку сюда</div>
              ) : (
                column.cards.map((card) => (
                  <div
                    key={card.id}
                      className={`kanban-card ${appState.currentView === 'compact' ? 'compact-view' : ''}`}
                    style={{ 
                      backgroundColor: card.color,
                      borderLeftColor: getStatusColor(card.status),
                      zIndex: 10,
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    draggable="true"
                    data-card-id={card.id}
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      console.log('Card clicked:', card.id);
                      showOrderDetails(card.id);
                    }}
                  >
                      <div className="kanban-card-header">
                        <span className="kanban-card-id">#{card.id}</span>
                        <button 
                          className="column-action-btn edit-card"
                          title="Редактировать"
                          onClick={(e) => {
                            e.stopPropagation();
                            showEditCardModal(card);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" className="icon-thin">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                      <div className="kanban-card-client">
                        {card.order_number && `#${card.order_number} - `}{card.client}
                      </div>
                      {card.product_name && (
                        <div className="kanban-card-product">
                          <strong>Изделие:</strong> {card.product_name}
                        </div>
                      )}
                      <div className="kanban-card-price">{card.price.toLocaleString('ru-RU')} ₽</div>
                      {card.prepayment > 0 && (
                        <div className="kanban-card-prepayment">
                          <strong>Предоплата:</strong> {card.prepayment.toLocaleString('ru-RU')} ₽
                        </div>
                      )}
                      {card.priority && (
                        <div className="kanban-card-priority">
                          <span className={`badge ${
                            card.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            card.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            card.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {card.priority === 'urgent' ? 'Срочно' : 
                             card.priority === 'high' ? 'Высокий' :
                             card.priority === 'normal' ? 'Обычный' : 'Низкий'}
                          </span>
                        </div>
                      )}
                      <div className={`kanban-card-deadline ${card.overdue ? 'kanban-card-overdue' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" className="icon-thin">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(card.deadline)} {card.overdue ? '(Просрочен)' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
                className="btn btn-secondary"
                style={{marginTop: '0.75rem', width: '100%'}}
                onClick={() => showAddCardModal(column.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="icon-thin">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              Добавить карточку
            </button>
          </div>
        ))}

        {/* Add Column Button */}
        <div className="kanban-column">
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
            <button 
              className="btn btn-primary"
              style={{width: '100%'}}
              onClick={() => setAppState(prev => ({ ...prev, showAddColumnModal: true }))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" className="icon-thin">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить колонку
            </button>
          </div>
        </div>
        </div>
        
        <div className={`scroll-indicator right ${appState.showRightIndicator ? 'visible' : ''}`}>
          <div className="scroll-indicator-icon" onClick={() => {
            if (kanbanContainerRef.current) {
              kanbanContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Order Edit Panel */}
      {console.log('Current appState.selectedOrder:', appState.selectedOrder)}
      {appState.selectedOrder && (
        <>
          {console.log('Rendering OrderEditPanel with:', appState.selectedOrder)}
          <OrderEditPanel 
            orderId={appState.selectedOrder.id}
            orderData={appState.selectedOrder}
            onClose={hideOrderDetail}
          />
        </>
      )}
      {!appState.selectedOrder && console.log('No selectedOrder - OrderEditPanel not rendered')}


      {/* Модальное окно для добавления/редактирования колонки */}
      {(appState.showAddColumnModal || appState.showEditColumnModal) && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {appState.editingColumn ? 'Редактировать колонку' : 'Добавить колонку'}
              </h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="column-name">Название колонки</label>
                <input
                  type="text"
                  className="form-input" 
                  id="column-name" 
                  placeholder="Введите название"
                  value={appState.editingColumn ? appState.editingColumnData.title : appState.newColumnTitle}
                  onChange={(e) => {
                    if (appState.editingColumn) {
                      setAppState(prev => ({
                    ...prev,
                        editingColumnData: { ...prev.editingColumnData, title: e.target.value }
                      }));
                    } else {
                      setAppState(prev => ({ ...prev, newColumnTitle: e.target.value }));
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Цвет колонки</label>
                <div className="color-palette">
                  {[
                    '#f1f5f9', '#e5e7eb', '#d1d5db', '#9ca3af',
                    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
                    '#d1fae5', '#a7f3d0', '#6ee7b7', '#fef3c7',
                    '#fde68a', '#fcd34d', '#fed7aa', '#fdba74'
                  ].map((color) => (
                    <div
                      key={color}
                      className={`color-option ${appState.selectedColumnColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setAppState(prev => ({ ...prev, selectedColumnColor: color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={closeModal}>Отмена</button>
                <button className="btn btn-primary" onClick={saveColumn}>Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для редактирования карточки */}
      {(appState.showAddCardModal || appState.showEditCardModal) && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {appState.editingCard?.id ? 'Редактировать карточку' : 'Добавить карточку'}
              </h3>
              <button className="modal-close" onClick={closeCardModal}>&times;</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="card-client">Клиент</label>
                <input
                  type="text"
                  className="form-input" 
                  id="card-client" 
                  placeholder="Имя клиента"
                  value={appState.editingCard?.id ? appState.editingCardData.client : appState.newCardData.client}
                  onChange={(e) => {
                    if (appState.editingCard?.id) {
                      setAppState(prev => ({
                    ...prev,
                    editingCardData: { ...prev.editingCardData, client: e.target.value }
                      }));
                    } else {
                      setAppState(prev => ({
                        ...prev,
                        newCardData: { ...prev.newCardData, client: e.target.value }
                      }));
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card-price">Стоимость (₽)</label>
                <input
                  type="number"
                  className="form-input" 
                  id="card-price" 
                  placeholder="Стоимость"
                  value={appState.editingCard?.id ? appState.editingCardData.price : appState.newCardData.price}
                  onChange={(e) => {
                    if (appState.editingCard?.id) {
                      setAppState(prev => ({
                    ...prev,
                    editingCardData: { ...prev.editingCardData, price: parseFloat(e.target.value) || 0 }
                      }));
                    } else {
                      setAppState(prev => ({
                        ...prev,
                        newCardData: { ...prev.newCardData, price: parseFloat(e.target.value) || 0 }
                      }));
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card-deadline">Дедлайн</label>
                <input
                  type="date"
                  className="form-input" 
                  id="card-deadline"
                  value={appState.editingCard?.id ? appState.editingCardData.deadline : appState.newCardData.deadline}
                  onChange={(e) => {
                    if (appState.editingCard?.id) {
                      setAppState(prev => ({
                    ...prev,
                    editingCardData: { ...prev.editingCardData, deadline: e.target.value }
                      }));
                    } else {
                      setAppState(prev => ({
                        ...prev,
                        newCardData: { ...prev.newCardData, deadline: e.target.value }
                      }));
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Цвет карточки</label>
                <div className="color-palette">
                  {[
                    '#ffffff', '#f8fafc', '#f1f5f9', '#e5e7eb',
                    '#dbeafe', '#d1fae5', '#fef3c7', '#fed7aa',
                    '#f3e8ff', '#fce7f3', '#fee2e2', '#e0e7ff'
                  ].map((color) => (
                    <div
                      key={color}
                      className={`color-option ${appState.selectedCardColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setAppState(prev => ({ ...prev, selectedCardColor: color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={closeCardModal}>Отмена</button>
                <button className="btn btn-primary" onClick={saveCard}>Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
