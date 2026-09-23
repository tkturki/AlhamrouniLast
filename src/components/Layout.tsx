import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, Package, QrCode, FileText, LogOut, User, Shield, Printer, BarChart3, FilePlus, Users, ShoppingBag, Wallet, PieChart, Menu, RotateCcw, DollarSign, ClipboardList, Factory, Target, Globe } from 'lucide-react';
import { authApi, User as UserType } from '../services/supabase';
import { exportFullBackup } from '../services/backup';
import { loadSettingsFromSupabase } from '../services/settings';
import { realtimeSync } from '../services/realtimeSync';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setCurrentUser(user);
    // Load settings from Supabase on app start
    loadSettingsFromSupabase().catch(() => {});
    // Start realtime sync - data lives on Supabase server
    realtimeSync.start();
    return () => {
      realtimeSync.stop();
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    const confirmed = window.confirm('هل تريد تحميل نسخة احتياطية قبل الخروج؟\n\nاضغط "موافق" للتحميل ثم الخروج، أو "إلغاء" للخروج مباشرة.');

    if (confirmed) {
      exportFullBackup();
    }

    authApi.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const hasPermission = (perm: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return (currentUser.permissions as any)?.[perm] ?? false;
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام',
    accountant: 'محاسب',
    seller: 'بائع',
    data_entry: 'مدخل بيانات',
  };

  const navItems = [
    { path: '/home', icon: Home, label: 'الرئيسية', perm: null },
    { path: '/add', icon: QrCode, label: 'التكويد', perm: 'canAddItems' },
    { path: '/sales', icon: ShoppingCart, label: 'إنشاء فاتورة', perm: 'canCreateInvoice' },
    { path: '/invoices-hub', icon: FileText, label: 'الفواتير', perm: 'canPrintInvoices' },
    { path: '/orders', icon: ShoppingBag, label: 'الطلبيات', perm: 'canManageOrders' },
    { path: '/search', icon: Search, label: 'البحث', perm: 'canSearch' },
    { path: '/items', icon: Package, label: 'المخزن', perm: 'canSearch' },
    { path: '/inventory-tabs', icon: Package, label: 'عرض الطلبيات', perm: 'canSearch' },
    { path: '/daily-accounts', icon: Wallet, label: 'الحسابات اليومية', perm: 'canViewReports' },
    { path: '/returns', icon: RotateCcw, label: 'المرتجعات', perm: 'canReturns' },
    { path: '/dashboard', icon: BarChart3, label: 'التحليلات', perm: 'canViewAnalysis' },
    { path: '/competitors', icon: Target, label: 'تحليل المنافسين', perm: 'canViewAnalysis' },
    { path: '/competitors-online', icon: Globe, label: 'التحديث الأونلاين', perm: 'canViewAnalysis' },
    { path: '/audit', icon: BarChart3, label: 'التقرير المالي', perm: 'canViewReports' },
    { path: '/print-labels', icon: Printer, label: 'طباعة الليبل', perm: 'canPrintInvoices' },
    { path: '/inventory-count', icon: ClipboardList, label: 'الجرد', perm: 'canSearch' },
    { path: '/manufacturing', icon: Factory, label: 'التصنيع', perm: null },
    { path: '/price-bulletin', icon: ClipboardList, label: 'نشرة الأسعار', perm: null },
    ...(hasPermission('canManageUsers') ? [
      { path: '/suppliers', icon: Users, label: 'الموردين', perm: null },
      { path: '/treasury', icon: Wallet, label: 'المالية', perm: null },
      { path: '/advances', icon: DollarSign, label: 'العهد', perm: null },
      { path: '/hr', icon: Users, label: 'الموظفين', perm: null },
      { path: '/admin', icon: Shield, label: 'لوحة التحكم', perm: null },
    ] : []),
  ].filter(item => !item.perm || hasPermission(item.perm));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex" dir="rtl">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} overflow-y-auto`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/logo1.png" alt="شعار" className="w-10 h-10 rounded-lg" />
            <span className="text-lg font-bold text-yellow-400">مجوهرات الحمروني</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${
                  isActive
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-yellow-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-700 mt-auto">
          {currentUser ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <User className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-yellow-400 font-bold text-sm">{currentUser.name}</p>
                <p className="text-gray-400 text-xs">{roleLabels[currentUser.role] || currentUser.role}</p>
              </div>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-yellow-400 hover:bg-gray-800 transition-all">
              <User className="w-5 h-5" />
              <span className="font-medium text-sm">تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 shadow-lg">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-gray-900">مجوهرات الحمروني</span>
            <div className="w-6" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
