import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, Package, QrCode, FileText, LogOut, User, Image as ImageIcon } from 'lucide-react';
import { authApi, User as UserType } from '../services/supabase';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  // تم إضافة "المعرض" هنا ليتناسب مع القائمة
  const navItems = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/add', icon: QrCode, label: 'التكويد' },
    { path: '/sales', icon: ShoppingCart, label: 'إنشاء فاتورة' },
    { path: '/invoices', icon: FileText, label: 'الفواتير' },
    { path: '/search', icon: Search, label: 'البحث' },
    { path: '/items', icon: Package, label: 'المخزن' },
    { path: '/gallery', icon: ImageIcon, label: 'المعرض' }, // الزر الجديد
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 shadow-2xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="شعار" className="w-10 h-10 rounded-lg" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">مجوهرات الحمروني</span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-gray-900/20 hover:bg-gray-900/30 px-3 py-2 rounded-lg transition-all"
              >
                <User className="w-5 h-5 text-gray-900" />
                <span className="text-gray-900 font-medium hidden sm:block">
                  {currentUser?.name || 'ضيف'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden min-w-[180px]">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-yellow-400 font-bold">{currentUser.name}</p>
                        <p className="text-gray-400 text-sm">{currentUser.role === 'admin' ? 'مدير' : 'بائع'}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-right text-red-400 hover:bg-gray-700 flex items-center gap-2 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-yellow-400 hover:bg-gray-700 transition-all"
                    >
                      تسجيل الدخول
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 pb-3 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-900 text-yellow-400 shadow-lg'
                      : 'text-gray-900 hover:bg-yellow-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-600/30 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isActive ? 'text-yellow-400' : 'text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
