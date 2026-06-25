import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddItemPage from './pages/AddItemPage';
import SalesPage from './pages/SalesPage';
import InvoicePage from './pages/InvoicePage';
import SearchPage from './pages/SearchPage';
import ItemsPage from './pages/ItemsPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import PrintLabelsPage from './pages/PrintLabelsPage';
import DashboardPage from './pages/DashboardPage';
import DraftInvoicesPage from './pages/DraftInvoicesPage';
import SuppliersPage from './pages/SuppliersPage';
import OrdersPage from './pages/OrdersPage';
import TreasuryPage from './pages/TreasuryPage';
import MobileDashboard from './pages/MobileDashboard';
import OrderDataPage from './pages/OrderDataPage';
import ContactPage from './pages/ContactPage';
import { authApi } from './services/supabase';
import { useState, useEffect } from 'react';

// مكون الحماية
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// مكون للأدمن فقط
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    setUser(authApi.getCurrentUser());
  }, []);

  if (user === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* صفحات عامة - بدون تسجيل دخول */}
        <Route path="/contact" element={<ContactPage />} />

        {/* صفحات نظام البيع - تحتاج تسجيل دخول */}
        <Route path="/" element={<ProtectedRoute><Layout><HomePage /></Layout></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><Layout><AddItemPage /></Layout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Layout><SalesPage /></Layout></ProtectedRoute>} />
        <Route path="/invoice" element={<ProtectedRoute><Layout><InvoicePage /></Layout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute><Layout><ItemsPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Layout><InvoicesPage /></Layout></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Layout><AdminPanel /></Layout></AdminRoute>} />
        <Route path="/print-labels" element={<ProtectedRoute><Layout><PrintLabelsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/draft-invoices" element={<ProtectedRoute><Layout><DraftInvoicesPage /></Layout></ProtectedRoute>} />
        <Route path="/suppliers" element={<AdminRoute><Layout><SuppliersPage /></Layout></AdminRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>} />
        <Route path="/order-data" element={<ProtectedRoute><Layout><OrderDataPage /></Layout></ProtectedRoute>} />
        <Route path="/treasury" element={<AdminRoute><Layout><TreasuryPage /></Layout></AdminRoute>} />
        <Route path="/mobile" element={<AdminRoute><MobileDashboard /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
