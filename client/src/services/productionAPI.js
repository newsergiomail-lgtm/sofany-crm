import api from './api';

// API для системы управления производством через QR-коды

export const productionAPI = {
  // 1. Получение всех этапов производства
  getStages: () => api.get('/production/stages'),

  // 2. Генерация QR-кода для заказа
  generateQR: (orderId, stageId, headers = {}) => 
    api.post(`/production/generate-qr/${orderId}`, { stageId }, { headers }),

  // 3. Сканирование QR-кода
  scanQR: (qrCode, headers = {}) => 
    api.post('/production/scan-qr', { qrCode }, { headers }),

  // 4. Подтверждение принятия заказа
  confirmOrder: (orderId, stageId, notes, headers = {}) => 
    api.post('/production/confirm-order', { orderId, stageId, notes }, { headers }),

  // 5. Отметка заказа как готового
  markReady: (orderId, notes, headers = {}) => 
    api.post('/production/mark-ready', { orderId, notes }, { headers }),

  // 6. Возврат заказа на доработку
  returnOrder: (orderId, fromStageId, toStageId, returnType, reason, headers = {}) => 
    api.post('/production/return-order', { 
      orderId, fromStageId, toStageId, returnType, reason 
    }, { headers }),

  // 7. Фиксация времени работы
  logWorkTime: (orderId, stageId, startedAt, finishedAt, hourlyRate, notes, headers = {}) => 
    api.post('/production/log-work-time', { 
      orderId, stageId, startedAt, finishedAt, hourlyRate, notes 
    }, { headers }),

  // 8. Получение статистики производства
  getStats: (headers = {}) => api.get('/production/stats', { headers }),

  // 9. Получение отчетов по сотрудникам
  getWorkerReports: (params = {}, headers = {}) => 
    api.get('/production/worker-reports', { params, headers }),

  // 10. Получение уведомлений пользователя
  getNotifications: (isRead, headers = {}) => 
    api.get('/production/notifications', { 
      params: { isRead }, 
      headers 
    }),

  // 11. Отметка уведомления как прочитанного
  markNotificationRead: (notificationId, headers = {}) => 
    api.put(`/production/notifications/${notificationId}/read`, {}, { headers }),

  // 12. Получение заказов по этапу
  getOrdersByStage: (stageId, headers = {}) => 
    api.get(`/production/stages/${stageId}/orders`, { headers }),

  // 13. Получение истории перемещений заказа
  getOrderHistory: (orderId, headers = {}) => 
    api.get(`/production/orders/${orderId}/history`, { headers }),

  // 14. Получение времени работы сотрудника
  getWorkerTimeLogs: (workerId, dateFrom, dateTo, headers = {}) => 
    api.get('/production/worker-time-logs', { 
      params: { workerId, dateFrom, dateTo }, 
      headers 
    }),

  // 15. Создание уведомления
  createNotification: (userId, orderId, type, title, message, headers = {}) => 
    api.post('/production/notifications', { 
      userId, orderId, type, title, message 
    }, { headers })
};

// Утилиты для работы с QR-кодами
export const qrUtils = {
  // Генерация QR-кода на клиенте (для отображения)
  generateQRCode: async (data) => {
    try {
      const QRCode = await import('qrcode');
      return await QRCode.toDataURL(JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      throw error;
    }
  },

  // Валидация QR-кода
  validateQRCode: (qrCode) => {
    try {
      const data = JSON.parse(qrCode);
      return {
        isValid: true,
        data: data
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Неверный формат QR-кода'
      };
    }
  },

  // Проверка срока действия QR-кода
  isQRCodeExpired: (timestamp, maxAgeDays = 30) => {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // в миллисекундах
    return (Date.now() - timestamp) > maxAge;
  }
};

// Константы для системы производства
export const PRODUCTION_CONSTANTS = {
  STAGES: {
    DESIGN: 1,        // Конструкторское Бюро
    CARPENTRY: 2,     // Столярный Цех
    FOAMING: 3,       // Формовка ППУ
    SEWING: 4,        // Швейный Цех
    UPHOLSTERY: 5,    // Обивочный Цех
    ASSEMBLY: 6,      // Сборка и упаковка
    SHIPPING: 7       // Отгрузка
  },
  
  STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    READY: 'ready',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold'
  },

  TRANSFER_TYPES: {
    NORMAL: 'normal',
    REWORK: 'rework',
    DEFECT: 'defect',
    PARALLEL: 'parallel'
  },

  RETURN_TYPES: {
    REWORK: 'rework',
    DEFECT: 'defect'
  },

  ROLES: {
    MANAGER: 'manager',
    PRODUCTION_CHIEF: 'production_chief',
    MASTER: 'master',
    WORKER: 'worker',
    QUALITY_CONTROLLER: 'quality_controller'
  },

  NOTIFICATION_TYPES: {
    ORDER_TRANSFERRED: 'order_transferred',
    ORDER_READY: 'order_ready',
    ORDER_RETURNED: 'order_returned',
    WORK_TIME_LOGGED: 'work_time_logged'
  }
};

export default productionAPI;