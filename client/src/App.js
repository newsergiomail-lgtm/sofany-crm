import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import './styles/theme.css';
import Login from './pages/Auth/Login';
import AutoLogin from './pages/Auth/AutoLogin';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import OrderTableNew from './components/Orders/OrderTableNew';
import OrdersNew from './pages/Orders/OrdersNew';
import OrderDetail from './pages/Orders/OrderDetail';
import OrderDetailNew from './pages/Orders/OrderDetailNew';
import CreateOrderNew from './pages/Orders/CreateOrderNew';
import OrderWorkOrder from './pages/Orders/OrderWorkOrder';
import Customers from './pages/Customers/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import Materials from './pages/Materials/Materials';
import Production from './pages/Production/Production';
import FinanceDashboard from './pages/Finance/FinanceDashboard';
import OrderFinancialDetail from './pages/Finance/OrderFinancialDetail';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';
import Kanban from './pages/Kanban/Kanban';
import MobileKanbanTest from './pages/Test/MobileKanbanTest';
import Employees from './pages/Employees/Employees';
import SimpleWork from './pages/SimpleWork/SimpleWork';
import PayrollReports from './pages/PayrollReports/PayrollReports';
import Purchases from './pages/Purchases/Purchases';
import PurchaseDetail from './pages/Purchases/PurchaseDetail';
import PurchaseRequests from './pages/Purchases/PurchaseRequests';
import PurchaseRequestDetail from './pages/Purchases/PurchaseRequestDetail';
import Suppliers from './pages/Suppliers/Suppliers';
import AdminSettings from './pages/AdminSettings/AdminSettings';
import WorkOrderPage from './pages/Production/WorkOrderPage';
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
        <Route path="/auto-login" element={<AutoLogin />} />
        <Route path="/kanban-direct" element={<Navigate to="/kanban-direct.html" replace />} />
        <Route path="*" element={<Navigate to="/auto-login" replace />} />
      </Routes>
    );
  };

  return (
    <ThemeProvider>
      <Layout>
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
        <Route path="/orders/create" element={<CreateOrderNew />} />
        <Route path="/orders/create/:id" element={<CreateOrderNew />} />
        <Route path="/orders/create-new" element={<CreateOrderNew />} />
        <Route path="/orders/:id" element={<OrderDetailNew />} />
        <Route path="/orders/:id/work-order" element={<OrderWorkOrder />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/mobile-kanban-test" element={<MobileKanbanTest />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/materials" element={<Materials />} />
        <Route path="/production" element={<Production />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/simple-work" element={<SimpleWork />} />
        <Route path="/payroll-reports" element={<PayrollReports />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/:id" element={<PurchaseDetail />} />
        <Route path="/purchases/requests" element={<PurchaseRequests />} />
        <Route path="/purchases/requests/:id" element={<PurchaseRequestDetail />} />
        <Route path="/purchases/requests/:id/edit" element={<PurchaseRequestDetail />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/finance/orders/:id" element={<OrderFinancialDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
