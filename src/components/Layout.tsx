import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, Package, QrCode, FileText, LogOut, User, Image as ImageIcon, Shield, Printer, BarChart3, FilePlus, Users, ShoppingBag, Wallet, Database, MessageCircle, ExternalLink, Eye, Upload, PieChart, Share2, Menu, X } from 'lucide-react';
import { authApi, User as UserType } from '../services/supabase';
import { autoBackup } from '../services/backup';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    const confirmed = window.confirm('هل تريد نسخ البيانات احتياطياً قبل الخروج؟\n\nاضغط "موافق" للنسخ ثم الخروج، أو "إلغاء" للخروج مباشرة.');

    if (confirmed) {
      autoBackup();
      alert('تم إنشاء نسخ احتياطي بنجاح!');
    }

    authApi.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/add', icon: QrCode, label: 'التكويد' },
    { path: '/order-data', icon: FilePlus, label: 'بيانات الطلبية' },
    { path: '/sales', icon: ShoppingCart, label: 'إنشاء فاتورة' },
    { path: '/draft-invoices', icon: FilePlus, label: 'الفواتير المبدئية' },
    { path: '/invoices', icon: FileText, label: 'الفواتير' },
    { path: '/orders', icon: ShoppingBag, label: 'الطلبيات' },
    { path: '/search', icon: Search, label: 'البحث' },
    { path: '/items', icon: Package, label: 'المخزن' },
    { path: '/dashboard', icon: BarChart3, label: 'التحليلات' },
    { path: '/print-labels', icon: Printer, label: 'طباعة الليبل' },
    ...(currentUser?.role === 'admin' ? [
      { path: '/suppliers', icon: Users, label: 'الموردين' },
      { path: '/treasury', icon: Wallet, label: 'المالية' },
      { path: '/admin', icon: Shield, label: 'لوحة التحكم' },
    ] : []),
  ];

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
            <img src="/logo.png" alt="شعار" className="w-10 h-10 rounded-lg" />
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
                <p className="text-gray-400 text-xs">{currentUser.role === 'admin' ? 'مدير' : 'بائع'}</p>
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
