import React, { useState, useEffect } from 'react';
import {
  Package, Receipt, BarChart3, Users, ShoppingBag, Wallet,
  Search, Eye, ChevronRight, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jewelryApi, formatCurrency, formatNumber, SaleInvoice } from '../services/supabase';
import { getOrders } from '../services/orders';
import { getSuppliers } from '../services/suppliers';
import { authApi } from '../services/supabase';

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    items: 0,
    invoices: 0,
    orders: 0,
    suppliers: 0,
    treasury: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<SaleInvoice[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    setUser(currentUser);
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const items = await jewelryApi.getAllItems();
      const invoices = await jewelryApi.getAllInvoices();
      const orders = getOrders();
      const suppliers = getSuppliers();

      setStats({
        items: items.length,
        invoices: invoices?.length || 0,
        orders: orders.length,
        suppliers: suppliers.length,
        treasury: 0,
      });

      // Get 5 most recent invoices
      const recent = [...(invoices || [])].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
      setRecentInvoices(recent);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      authApi.logout();
      navigate('/login');
    }
  };

  const mobileMenuItems = [
    { icon: Package, label: 'القطع', path: '/items', color: 'bg-yellow-500' },
    { icon: Receipt, label: 'الفواتير', path: '/invoices', color: 'bg-green-500' },
    { icon: BarChart3, label: 'التحليلات', path: '/dashboard', color: 'bg-blue-500' },
    { icon: ShoppingBag, label: 'الطلبيات', path: '/orders', color: 'bg-purple-500' },
    { icon: Users, label: 'الموردين', path: '/suppliers', color: 'bg-orange-500' },
    { icon: Wallet, label: 'الخزينة', path: '/treasury', color: 'bg-teal-500' },
    { icon: Search, label: 'البحث', path: '/search', color: 'bg-pink-500' },
    { icon: Settings, label: 'الإعدادات', path: '/admin', color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-yellow-400">الحلي الذهبية</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{user?.name || 'Admin'}</span>
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-gray-900 font-bold">
            {user?.name?.charAt(0) || 'A'}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">القطع</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.items)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">الفواتير</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.invoices)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">الطلبيات</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.orders)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-gray-400 text-sm">الخزينة</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(stats.treasury)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-yellow-400 mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-3 gap-3">
          {mobileMenuItems.slice(0, 6).map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center gap-2 hover:bg-gray-700 active:scale-95 transition-all"
            >
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-yellow-400">آخر الفواتير</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-sm text-yellow-400 flex items-center gap-1"
          >
            عرض الكل <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
            لا توجد فواتير حتى الآن
          </div>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-400">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(invoice.created_at).toLocaleDateString('ar-LY')}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-400">{formatCurrency(invoice.total_amount || 0)}</p>
                  <p className="text-xs text-gray-400">{invoice.items?.length || 0} قطعة</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Menu Button */}
      <div className="p-4 pb-8">
        <button
          onClick={() => setShowMenu(true)}
          className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between"
        >
          <span className="font-bold">قائمة الصفحات الكاملة</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-800 shadow-xl">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400">القائمة</h2>
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-140px)]">
              {mobileMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-700 rounded-xl mb-2 transition-all"
                >
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 mr-auto text-gray-400" />
                </button>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 p-4 rounded-xl hover:bg-red-500/30 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;