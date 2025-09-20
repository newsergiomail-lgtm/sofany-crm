import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API методы для заказов
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`).then(response => response.data.order),
  create: (data) => api.post('/orders', data).then(response => response.data),
  update: (id, data) => api.put(`/orders/${id}`, data).then(response => response.data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data).then(response => response.data),
  delete: (id) => api.delete(`/orders/${id}`).then(response => response.data),
  getStats: (params) => api.get('/orders/stats/overview', { params }).then(response => response.data),
  updateCustomer: (id, data) => api.put(`/orders/${id}/customer`, data).then(response => response.data),
  getKanbanData: () => api.get('/orders/kanban').then(response => response.data),
  updateProductionStage: (orderId, stage) => api.put(`/orders/kanban/${orderId}/stage`, { stage }).then(response => response.data),
  createProductionOperation: (orderId, data) => api.post('/production', { order_id: orderId, ...data }).then(response => response.data),
  
  // Методы для работы с чертежами
  getDrawings: (orderId) => api.get(`/orders/${orderId}/drawings`).then(response => response.data.drawings),
  uploadDrawing: (orderId, formData) => api.post(`/orders/${orderId}/drawings`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(response => response.data),
  getDrawing: (orderId, drawingId) => api.get(`/orders/${orderId}/drawings/${drawingId}`, {
    responseType: 'blob',
  }),
  downloadDrawing: (orderId, drawingId) => api.get(`/orders/${orderId}/drawings/${drawingId}`, {
    responseType: 'blob',
  }),
  deleteDrawing: (orderId, drawingId) => api.delete(`/orders/${orderId}/drawings/${drawingId}`).then(response => response.data),

  // Получить заказы для страницы производства
  getProductionOrders: (params) => {
    return api.get('/production/orders', { params }).then(response => {
      console.log('API Production Orders Response:', response.data);
      return response.data;
    });
  },
};

// API методы для клиентов
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getStats: () => api.get('/customers/stats/overview'),
};

// API методы для материалов
export const materialsAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  updateStock: (id, data) => api.put(`/materials/${id}/stock`, data),
  getCategories: () => api.get('/materials/categories/list'),
  createCategory: (data) => api.post('/materials/categories', data),
  getStats: () => api.get('/materials/stats/overview'),
};

// API методы для производства
export const productionAPI = {
  getAll: (params) => api.get('/production', { params }),
  getById: (id) => api.get(`/production/${id}`),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.put(`/production/${id}`, data),
  complete: (id, data) => api.put(`/production/${id}/complete`, data),
  getByOrder: (orderId) => api.get(`/production/order/${orderId}`),
  getStats: (params) => api.get('/production/stats/overview', { params }),
};

// API методы для финансов
export const financeAPI = {
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  createTransaction: (data) => api.post('/finance/transactions', data),
  getReports: (params) => api.get('/finance/reports/overview', { params }),
  getKPI: (params) => api.get('/finance/reports/kpi', { params }),
  getOrderCost: (orderId) => api.get(`/finance/orders/${orderId}/cost`),
  export: (params) => api.get('/finance/export', { params }),
};

// API методы для уведомлений
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  create: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  sendEmail: (data) => api.post('/notifications/send-email', data),
  sendTelegram: (data) => api.post('/notifications/send-telegram', data),
  getStats: () => api.get('/notifications/stats'),
};

// API методы для аутентификации
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// API методы для калькулятора
export const calculatorAPI = {
  getOrders: (params) => api.get('/calculator/orders', { params }),
  getOrderById: (id) => api.get(`/calculator/orders/${id}`),
  getStats: (params) => api.get('/calculator/stats', { params }),
  importToOrder: (calculatorOrderId, orderId) => api.post(`/calculator/orders/${calculatorOrderId}/import-to-order/${orderId}`),
};

// API методы для закупок
export const purchaseAPI = {
  checkMaterials: (orderId) => api.post(`/purchase/check-materials/${orderId}`),
  createPurchaseList: (orderId, data) => api.post(`/purchase/create-purchase-list/${orderId}`, data),
  getPurchaseLists: (orderId) => api.get(`/purchase/purchase-lists/${orderId}`),
  getPurchaseListItems: (purchaseListId) => api.get(`/purchase/purchase-list-items/${purchaseListId}`),
  updatePurchaseListItem: (itemId, data) => api.put(`/purchase/purchase-list-items/${itemId}`, data),
};

export const suppliersAPI = {
  getAll: (params = {}) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getAnalytics: () => api.get('/suppliers/analytics/overview'),
};

// API методы для маппинга материалов
export const materialMappingAPI = {
  processCalculatorMaterials: (materials) => api.post('/material-mapping/process-calculator-materials', { materials }),
  suggestMappings: (unmappedMaterials) => api.post('/material-mapping/suggest-mappings', { unmappedMaterials }),
  createMapping: (data) => api.post('/material-mapping/create-mapping', data),
  getMappings: () => api.get('/material-mapping/mappings'),
  updateMapping: (id, data) => api.put(`/material-mapping/mappings/${id}`, data),
  deleteMapping: (id) => api.delete(`/material-mapping/mappings/${id}`),
  searchMaterials: (query) => api.get(`/materials/search?q=${encodeURIComponent(query)}`)
};

export const libraryAPI = {
  // Материалы
  getMaterials: (params = {}) => api.get('/library/materials', { params }),
  getMaterialById: (id) => api.get(`/library/materials/${id}`),
  createMaterial: (data) => api.post('/library/materials', data),
  updateMaterial: (id, data) => api.put(`/library/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/library/materials/${id}`),
  
  // Операции
  getOperations: (params = {}) => api.get('/library/operations', { params }),
  getOperationById: (id) => api.get(`/library/operations/${id}`),
  createOperation: (data) => api.post('/library/operations', data),
  updateOperation: (id, data) => api.put(`/library/operations/${id}`, data),
  deleteOperation: (id) => api.delete(`/library/operations/${id}`),
  
  // Справочные данные
  getReferenceData: (params = {}) => api.get('/library/reference-data', { params }),
  getReferenceDataById: (id) => api.get(`/library/reference-data/${id}`),
  createReferenceData: (data) => api.post('/library/reference-data', data),
  updateReferenceData: (id, data) => api.put(`/library/reference-data/${id}`, data),
  deleteReferenceData: (id) => api.delete(`/library/reference-data/${id}`),
  
  // Расценки
  getRates: (params = {}) => api.get('/library/rates', { params }),
  getRateById: (id) => api.get(`/library/rates/${id}`),
  createRate: (data) => api.post('/library/rates', data),
  updateRate: (id, data) => api.put(`/library/rates/${id}`, data),
  deleteRate: (id) => api.delete(`/library/rates/${id}`),
  
  // Категории материалов
  getMaterialCategories: () => api.get('/library/material-categories'),
  createMaterialCategory: (data) => api.post('/library/material-categories', data),
  updateMaterialCategory: (id, data) => api.put(`/library/material-categories/${id}`, data),
  deleteMaterialCategory: (id) => api.delete(`/library/material-categories/${id}`),
  
  // Категории операций
  getOperationCategories: () => api.get('/library/operation-categories'),
  createOperationCategory: (data) => api.post('/library/operation-categories', data),
  updateOperationCategory: (id, data) => api.put(`/library/operation-categories/${id}`, data),
  deleteOperationCategory: (id) => api.delete(`/library/operation-categories/${id}`),
  
  // Категории справочных данных
  getReferenceCategories: () => api.get('/library/reference-categories'),
  createReferenceCategory: (data) => api.post('/library/reference-categories', data),
  updateReferenceCategory: (id, data) => api.put(`/library/reference-categories/${id}`, data),
  deleteReferenceCategory: (id) => api.delete(`/library/reference-categories/${id}`),
  
  // Категории расценок
  getRateCategories: () => api.get('/library/rate-categories'),
  createRateCategory: (data) => api.post('/library/rate-categories', data),
  updateRateCategory: (id, data) => api.put(`/library/rate-categories/${id}`, data),
  deleteRateCategory: (id) => api.delete(`/library/rate-categories/${id}`),
  
  // Настройки калькулятора
  getCalculatorSettings: () => api.get('/library/calculator-settings'),
  getCalculatorSettingById: (id) => api.get(`/library/calculator-settings/${id}`),
  createCalculatorSetting: (data) => api.post('/library/calculator-settings', data),
  updateCalculatorSetting: (id, data) => api.put(`/library/calculator-settings/${id}`, data),
  deleteCalculatorSetting: (id) => api.delete(`/library/calculator-settings/${id}`),
  updateCalculatorSettings: (data) => api.put('/library/calculator-settings', data),
  
  // Импорт/Экспорт
  exportData: (params) => api.get('/library/export', { 
    params,
    responseType: 'blob'
  }),
  importData: (formData) => api.post('/library/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Аналитика
  getAnalytics: (params) => api.get('/library/analytics', { params }),
};

// API методы для остатков на складе (новая архитектура)
export const warehouseStockAPI = {
  // Получить все остатки
  getAll: (params = {}) => api.get('/warehouse-stock', { params }),
  
  // Получить остаток по ID
  getById: (id) => api.get(`/warehouse-stock/${id}`),
  
  // Создать новый остаток
  create: (data) => api.post('/warehouse-stock', data),
  
  // Обновить остаток
  update: (id, data) => api.put(`/warehouse-stock/${id}`, data),
  
  // Списание материалов
  consume: (id, data) => api.post(`/warehouse-stock/${id}/consume`, data),
  
  // Поступление материалов
  receive: (id, data) => api.post(`/warehouse-stock/${id}/receive`, data),
  
  // Корректировка остатка
  adjust: (id, data) => api.post(`/warehouse-stock/${id}/adjust`, data),
  
  // Удалить остаток
  delete: (id) => api.delete(`/warehouse-stock/${id}`),
  
  // Проверка остатков для заказа
  checkOrderMaterials: (materials) => api.post('/warehouse-stock/check-order-materials', { materials }),
};

// API методы для позиций заказа
export const orderItemsAPI = {
  // Сохранить позиции заказа
  save: (orderId, items) => api.post(`/purchase/save-order-items/${orderId}`, { items }),
  
  // Получить позиции заказа
  get: (orderId) => api.get(`/purchase/order-items/${orderId}`),
};

export const purchaseRequestAPI = {
  // Создать заявку на закупку
  create: (data) => api.post('/purchase/requests', data),
  
  // Получить заявки на закупку
  getAll: (params = {}) => api.get('/purchase/requests', { params }),
  
  // Получить заявку по ID
  getById: (id) => api.get(`/purchase/requests/${id}`),
  
  // Обновить заявку
  update: (id, data) => api.put(`/purchase/requests/${id}`, data),
  
  // Удалить заявку
  delete: (id) => api.delete(`/purchase/requests/${id}`),
};

export default api;


