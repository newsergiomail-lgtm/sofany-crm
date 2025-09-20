import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import OrderDetail from './pages/Orders/OrderDetail';
import CreateOrderNew from './pages/Orders/CreateOrderNew';
import CreateOrderWizard from './pages/Orders/CreateOrderWizard';
import OrderSpecification from './pages/Orders/OrderSpecification';
import Customers from './pages/Customers/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import Materials from './pages/Materials/Materials';
import MaterialDetail from './pages/Materials/MaterialDetail';
import Production from './pages/Production/Production';
import FinanceDashboard from './pages/Finance/FinanceDashboard';
import OrderFinancialDetail from './pages/Finance/OrderFinancialDetail';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';
import CalculatorOrders from './pages/Calculator/CalculatorOrders';
import CalculatorOrderDetail from './pages/Calculator/CalculatorOrderDetail';
import CalculatorTest from './pages/Calculator/CalculatorTest';
import Kanban from './pages/Kanban/Kanban';
import KanbanSettings from './pages/KanbanSettings';
import Employees from './pages/Employees/Employees';
import SimpleWork from './pages/SimpleWork/SimpleWork';
import Purchases from './pages/Purchases/Purchases';
import PurchaseDetail from './pages/Purchases/PurchaseDetail';
import Suppliers from './pages/Suppliers/Suppliers';
import AdminSettings from './pages/AdminSettings/AdminSettings';
import DesignSystem from './pages/DesignSystem/DesignSystem';
import ModernDesignSystem from './pages/DesignSystem/ModernDesignSystem';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/kanban-direct" element={<Navigate to="/kanban-direct.html" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/create" element={<CreateOrderWizard />} />
        <Route path="/orders/new" element={<CreateOrderWizard />} />
        <Route path="/orders/create-old" element={<CreateOrderNew />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/orders/:id/specification" element={<OrderSpecification />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/kanban/settings" element={<KanbanSettings />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/materials/:id" element={<MaterialDetail />} />
        <Route path="/production" element={<Production />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/simple-work" element={<SimpleWork />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/:id" element={<PurchaseDetail />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/finance/orders/:id" element={<OrderFinancialDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
               <Route path="/admin-settings" element={<AdminSettings />} />
               <Route path="/design-system" element={<DesignSystem />} />
               <Route path="/modern-design-system" element={<ModernDesignSystem />} />
        <Route path="/calculator" element={<CalculatorOrders />} />
        <Route path="/calculator/orders" element={<CalculatorOrders />} />
        <Route path="/calculator/orders/:id" element={<CalculatorOrderDetail />} />
        <Route path="/calculator/test" element={<CalculatorTest />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
