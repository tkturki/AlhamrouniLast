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
import SplashPage from './pages/SplashPage';
import AdminPanel from './pages/AdminPanel';
import PrintLabelsPage from './pages/PrintLabelsPage';
import DashboardPage from './pages/DashboardPage';
import DraftInvoicesPage from './pages/DraftInvoicesPage';
import SuppliersPage from './pages/SuppliersPage';
import OrdersPage from './pages/OrdersPage';
import OrdersHubPage from './pages/OrdersHubPage';
import GoldOrdersPage from './pages/GoldOrdersPage';
import InventoryTabsPage from './pages/InventoryTabsPage';
import DailyAccountsPage from './pages/DailyAccountsPage';
import TreasuryPage from './pages/TreasuryPage';
import MobileDashboard from './pages/MobileDashboard';
import PriceBulletinPage from './pages/PriceBulletinPage';
import OrderDataPage from './pages/OrderDataPage';
import ContactPage from './pages/ContactPage';
import ReturnsPage from './pages/ReturnsPage';
import AuditReportPage from './pages/AuditReportPage';
import AdvancesPage from './pages/AdvancesPage';
import InventoryCountPage from './pages/InventoryCountPage';
import InvoicesHubPage from './pages/InvoicesHubPage';
import ManufacturingPage from './pages/ManufacturingPage';
import SocialMediaPage from './pages/SocialMediaPage';
import CompetitorAnalyticsPage from './pages/CompetitorAnalyticsPage';
import CompetitorOnlineUpdatePage from './pages/CompetitorOnlineUpdatePage';
import HRPage from './pages/HRPage';
import { authApi } from './services/supabase';
import { useState, useEffect } from 'react';

// Global: prevent scroll wheel from changing number inputs
const useWheelGuard = () => {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handler, { passive: false });
    return () => document.removeEventListener('wheel', handler);
  }, []);
};

// Global: Enter key moves to next input
const useEnterNavigation = () => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'INPUT') {
          e.preventDefault();
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
          const index = inputs.indexOf(target);
          if (index >= 0 && index < inputs.length - 1) {
            (inputs[index + 1] as HTMLElement).focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
};

// مكون الحماية - تسجيل دخول فقط
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

// مكون حماية بالصلاحية
const PermissionRoute: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (!user) {
      setAllowed(false);
    } else if (user.role === 'admin') {
      setAllowed(true);
    } else {
      setAllowed((user.permissions as any)?.[permission] ?? false);
    }
  }, [permission]);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/home" replace />;
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
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

function App() {
  useWheelGuard();
  useEnterNavigation();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let alertIntervalId: ReturnType<typeof setInterval> | undefined;
    const initBackup = async () => {
      try {
        const { createAutoBackup: backupFn, restoreAutoBackup } = await import('./services/autoBackup');
        restoreAutoBackup();
        backupFn();
        intervalId = setInterval(backupFn, 5 * 60 * 1000);
      } catch (e) {}
    };
    initBackup();

    const checkAlerts = async () => {
      try {
        const { checkDeliveryAlerts } = await import('./services/deliveryAlerts');
        checkDeliveryAlerts();
      } catch (e) {}
    };
    checkAlerts();
    alertIntervalId = setInterval(checkAlerts, 60 * 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (alertIntervalId) clearInterval(alertIntervalId);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* صفحات نظام البيع */}
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/" element={<SplashPage />} />
        <Route path="/home" element={<ProtectedRoute><Layout><HomePage /></Layout></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><PermissionRoute permission="canAddItems"><Layout><AddItemPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><PermissionRoute permission="canCreateInvoice"><Layout><SalesPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/invoice" element={<ProtectedRoute><Layout><InvoicePage /></Layout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><PermissionRoute permission="canSearch"><Layout><SearchPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute><PermissionRoute permission="canSearch"><Layout><ItemsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><PermissionRoute permission="canPrintInvoices"><Layout><InvoicesPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/invoices-hub" element={<ProtectedRoute><PermissionRoute permission="canPrintInvoices"><Layout><InvoicesHubPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Layout><AdminPanel /></Layout></AdminRoute>} />
        <Route path="/print-labels" element={<ProtectedRoute><PermissionRoute permission="canPrintInvoices"><Layout><PrintLabelsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PermissionRoute permission="canViewAnalysis"><Layout><DashboardPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/draft-invoices" element={<ProtectedRoute><PermissionRoute permission="canCreateInvoice"><Layout><DraftInvoicesPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/suppliers" element={<AdminRoute><Layout><SuppliersPage /></Layout></AdminRoute>} />
        <Route path="/orders" element={<ProtectedRoute><PermissionRoute permission="canManageOrders"><Layout><OrdersHubPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/gold-orders" element={<ProtectedRoute><PermissionRoute permission="canManageOrders"><Layout><GoldOrdersPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/order-data" element={<ProtectedRoute><PermissionRoute permission="canEnterData"><Layout><OrderDataPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/treasury" element={<AdminRoute><Layout><TreasuryPage /></Layout></AdminRoute>} />
        <Route path="/returns" element={<ProtectedRoute><PermissionRoute permission="canReturns"><Layout><ReturnsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><PermissionRoute permission="canViewReports"><Layout><AuditReportPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/advances" element={<AdminRoute><Layout><AdvancesPage /></Layout></AdminRoute>} />
        <Route path="/inventory-count" element={<ProtectedRoute><PermissionRoute permission="canSearch"><Layout><InventoryCountPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/inventory-tabs" element={<ProtectedRoute><PermissionRoute permission="canSearch"><Layout><InventoryTabsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/daily-accounts" element={<ProtectedRoute><PermissionRoute permission="canViewReports"><Layout><DailyAccountsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/manufacturing" element={<ProtectedRoute><Layout><ManufacturingPage /></Layout></ProtectedRoute>} />
        <Route path="/competitors" element={<ProtectedRoute><PermissionRoute permission="canViewAnalysis"><Layout><CompetitorAnalyticsPage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/competitors-online" element={<ProtectedRoute><PermissionRoute permission="canViewAnalysis"><Layout><CompetitorOnlineUpdatePage /></Layout></PermissionRoute></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute><Layout><HRPage /></Layout></ProtectedRoute>} />
        <Route path="/mobile" element={<AdminRoute><MobileDashboard /></AdminRoute>} />
        <Route path="/price-bulletin" element={<ProtectedRoute><Layout><PriceBulletinPage /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
