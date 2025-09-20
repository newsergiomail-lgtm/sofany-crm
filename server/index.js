const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Устанавливаем JWT_SECRET если не задан
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'sofany-crm-super-secret-key-2024';
  console.log('⚠️  JWT_SECRET не найден, используется значение по умолчанию');
}

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const customersRoutes = require('./routes/customers');
const materialsRoutes = require('./routes/materials');
const categoriesRoutes = require('./routes/categories');
const productionRoutes = require('./routes/production');
const financeRoutes = require('./routes/finance');
const { router: notificationsRoutes } = require('./routes/notifications');
const calculatorRoutes = require('./routes/calculator');
const kanbanRoutes = require('./routes/kanban');
const employeesRoutes = require('./routes/employees');
const simpleWorkRoutes = require('./routes/simple-work');
const qrCodesRoutes = require('./routes/qr-codes');
const orderIntegrationRoutes = require('./routes/order-integration');
const purchaseRoutes = require('./routes/purchase');
const purchasesRoutes = require('./routes/purchases');
const purchaseRequestsRoutes = require('./routes/purchase-requests');
const productionBlocksRoutes = require('./routes/production-blocks');
const furnitureLibraryRoutes = require('./routes/furniture-library');
const adminSettingsRoutes = require('./routes/admin-settings');
const suppliersRoutes = require('./routes/suppliers');
const libraryRoutes = require('./routes/library');
const libraryImportExportRoutes = require('./routes/library-import-export');
const calculatorLibraryRoutes = require('./routes/calculator-library-simple');
const warehouseStockRoutes = require('./routes/warehouse-stock');
const testQROrdersRoutes = require('./routes/test-qr-orders');
const orderQRRoutes = require('./routes/order-qr');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/order-qr', orderQRRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/simple-work', simpleWorkRoutes);
app.use('/api/qr-codes', qrCodesRoutes);
app.use('/api/order-integration', orderIntegrationRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/purchase-requests', purchaseRequestsRoutes);
app.use('/api/production-blocks', productionBlocksRoutes);
app.use('/api/furniture-library', furnitureLibraryRoutes);
app.use('/api/admin-settings', adminSettingsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/library', libraryImportExportRoutes);
app.use('/api/calculator-library', calculatorLibraryRoutes);
app.use('/api/warehouse-stock', warehouseStockRoutes);
app.use('/api/purchase/requests', purchaseRequestsRoutes);
app.use('/api/test-qr-orders', testQROrdersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Что-то пошло не так!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

// Database connection and server start
db.connect()
  .then(() => {
    console.log('✅ База данных подключена');
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📊 CRM Sofany готов к работе!`);
    });
  })
  .catch((error) => {
    console.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  });


