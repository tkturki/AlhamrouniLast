import React, { useState, useEffect } from 'react';
import {
  Eye, Heart, ShoppingCart, Users, TrendingUp, Calendar,
  BarChart3, PieChart, Download, RefreshCw, Gem,
  Filter, ChevronDown, ArrowUp, ArrowDown, MessageSquare,
  Image as ImageIcon, Video, Clock, Star, Search
} from 'lucide-react';
import { supabase, JewelryItem } from '../services/supabase';

interface GalleryStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  totalViews: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
}

interface ItemStats {
  item: JewelryItem;
  views: number;
  favorites: number;
  requests: number;
  lastViewed: string;
}

interface ContactRequest {
  id: number;
  name: string;
  phone: string;
  message: string;
  item_code: string;
  item_name: string;
  timestamp: string;
  status: 'pending' | 'contacted' | 'completed';
}

const GalleryStatsPage: React.FC = () => {
  const [stats, setStats] = useState<GalleryStats>({
    totalVisitors: 0,
    todayVisitors: 0,
    weekVisitors: 0,
    monthVisitors: 0,
    totalViews: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [topItems, setTopItems] = useState<ItemStats[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'requests' | 'trends'>('overview');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStats();
    loadRequests();
  }, [dateRange]);

  const loadStats = async () => {
    setLoading(true);

    try {
      // Load visitor stats from localStorage
      const totalVisits = parseInt(localStorage.getItem('gallery_visits') || '0');
      const lastVisit = localStorage.getItem('last_visit');
      const today = new Date().toDateString();

      // Calculate date ranges
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Load items with their stats
      let items: JewelryItem[] = [];
      try {
        const { data } = await supabase
          .from('jewelry_items')
          .select('*')
          .order('created_at', { ascending: false });
        items = data || [];
      } catch (e) {
        const stored = localStorage.getItem('jewelry_items');
        if (stored) items = JSON.parse(stored);
      }

      // Calculate item stats
      const itemStats: ItemStats[] = items.map(item => {
        const views = parseInt(localStorage.getItem(`view_${item.item_code}`) || '0');
        const favorites = getFavoriteCount(item.item_code);
        const itemRequests = getItemRequestCount(item.item_code);
        const lastView = localStorage.getItem(`last_view_${item.item_code}`) || '';

        return {
          item,
          views,
          favorites,
          requests: itemRequests,
          lastViewed: lastView,
        };
      });

      // Sort by views
      itemStats.sort((a, b) => b.views - a.views);
      setTopItems(itemStats.slice(0, 20));

      // Load contact requests
      const contactRequests = JSON.parse(localStorage.getItem('contact_requests') || '[]');

      // Calculate stats
      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('gallery_visit_')) {
          const timestamp = localStorage.getItem(key);
          if (timestamp) {
            const date = new Date(timestamp);
            if (date.toDateString() === today) todayCount++;
            if (date >= weekAgo) weekCount++;
            if (date >= monthAgo) monthCount++;
          }
        }
      }

      // If no granular data, estimate
      if (todayCount === 0 && totalVisits > 0) {
        todayCount = Math.ceil(totalVisits / 30);
        weekCount = Math.ceil(totalVisits / 4);
        monthCount = totalVisits;
      }

      const totalViews = itemStats.reduce((sum, item) => sum + item.views, 0);

      setStats({
        totalVisitors: totalVisits,
        todayVisitors: todayCount,
        weekVisitors: weekCount,
        monthVisitors: monthCount,
        totalViews,
        totalRequests: contactRequests.length,
        pendingRequests: contactRequests.filter((r: ContactRequest) => r.status === 'pending').length,
        completedRequests: contactRequests.filter((r: ContactRequest) => r.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }

    setLoading(false);
  };

  const getFavoriteCount = (itemCode: string): number => {
    const favs = JSON.parse(localStorage.getItem('gallery_favorites') || '[]');
    return favs.filter((f: string) => f === itemCode).length;
  };

  const getItemRequestCount = (itemCode: string): number => {
    const requests = JSON.parse(localStorage.getItem('contact_requests') || '[]');
    return requests.filter((r: ContactRequest) => r.item_code === itemCode).length;
  };

  const loadRequests = () => {
    const data = JSON.parse(localStorage.getItem('contact_requests') || '[]');
    setRequests(data.sort((a: ContactRequest, b: ContactRequest) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const updateRequestStatus = (id: number, status: 'pending' | 'contacted' | 'completed') => {
    const updated = requests.map((r: ContactRequest) =>
      r.id === id ? { ...r, status } : r
    );
    localStorage.setItem('contact_requests', JSON.stringify(updated));
    setRequests(updated);

    // Update stats
    setStats(prev => ({
      ...prev,
      pendingRequests: updated.filter((r: ContactRequest) => r.status === 'pending').length,
      completedRequests: updated.filter((r: ContactRequest) => r.status === 'completed').length,
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportStats = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      topItems,
      requests,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallery-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const filteredRequests = requests.filter((r: ContactRequest) =>
    !searchQuery ||
    r.name.includes(searchQuery) ||
    r.phone.includes(searchQuery) ||
    r.item_name?.includes(searchQuery)
  );

  const filteredItems = topItems.filter(item =>
    !searchQuery ||
    item.item.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item.item_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">إحصائيات المعرض</h1>
            <p className="text-gray-400">تحليل أداء المعرض والقطع الأكثر طلباً</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="all">كل الوقت</option>
          </select>
          <button
            onClick={exportStats}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            تصدير
          </button>
          <button
            onClick={loadStats}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-400 text-sm flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> +12%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalVisitors}</p>
          <p className="text-blue-200 text-sm">إجمالي الزوار</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
          <p className="text-yellow-200 text-sm">إجمالي المشاهدات</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {topItems.reduce((sum, item) => sum + item.favorites, 0)}
          </p>
          <p className="text-red-200 text-sm">المفضلة</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            {stats.pendingRequests > 0 && (
              <span className="bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                {stats.pendingRequests} جديد
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRequests}</p>
          <p className="text-green-200 text-sm">طلبات التواصل</p>
        </div>
      </div>

      {/* Date Range Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">اليوم</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.todayVisitors}</p>
          <p className="text-gray-500 text-sm">زائر</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">هذا الأسبوع</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.weekVisitors}</p>
          <p className="text-gray-500 text-sm">زائر</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">هذا الشهر</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.monthVisitors}</p>
          <p className="text-gray-500 text-sm">زائر</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'items' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          القطع الأكثر مشاهدة
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'requests' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          طلبات التواصل
          {stats.pendingRequests > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{stats.pendingRequests}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'trends' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          الاتجاهات
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Items */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                القطع الأكثر مشاهدة
              </h3>
            </div>
            <div className="divide-y divide-gray-700">
              {topItems.slice(0, 5).map((item, index) => (
                <div key={item.item.item_code} className="p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-all">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-gray-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                    {item.item.image_url ? (
                      <img src={item.item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gem className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.item.model_name}</p>
                    <p className="text-gray-500 text-sm">{item.item.item_code}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-yellow-400 flex items-center gap-1">
                      <Eye className="w-5 h-5" /> {item.views}
                    </p>
                    <p className="text-gray-500 text-sm">{item.requests} طلب</p>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Gem className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد بيانات بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                آخر الطلبات
              </h3>
              <span className="text-gray-500 text-sm">{requests.length} طلب</span>
            </div>
            <div className="divide-y divide-gray-700">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-700/50 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white">{request.name}</p>
                      <p className="text-gray-500 text-sm">{request.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      request.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                      request.status === 'contacted' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {request.status === 'pending' ? 'قيد الانتظار' :
                       request.status === 'contacted' ? 'تم التواصل' :
                       'مكتمل'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    قطعة: <span className="text-yellow-400">{request.item_name || request.item_code}</span>
                  </p>
                  {request.message && (
                    <p className="text-gray-500 text-sm mt-1 truncate">{request.message}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-2">{formatDate(request.timestamp)}</p>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طلبات بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن قطعة..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-400 font-medium">#</th>
                  <th className="px-4 py-3 text-right text-gray-400 font-medium">الصورة</th>
                  <th className="px-4 py-3 text-right text-gray-400 font-medium">القطعة</th>
                  <th className="px-4 py-3 text-center text-gray-400 font-medium">المشاهدات</th>
                  <th className="px-4 py-3 text-center text-gray-400 font-medium">المفضلة</th>
                  <th className="px-4 py-3 text-center text-gray-400 font-medium">الطلبات</th>
                  <th className="px-4 py-3 text-center text-gray-400 font-medium">آخر مشاهدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredItems.map((item, index) => (
                  <tr key={item.item.item_code} className="hover:bg-gray-700/50 transition-all">
                    <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                        {item.item.image_url ? (
                          <img src={item.item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gem className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{item.item.model_name}</p>
                      <p className="text-gray-500 text-sm">{item.item.item_code}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                        <Eye className="w-5 h-5" /> {item.views}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xl font-bold text-red-400 flex items-center justify-center gap-1">
                        <Heart className="w-5 h-5" /> {item.favorites}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        item.requests > 0 ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {item.requests}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-sm">
                      {item.lastViewed ? formatDate(item.lastViewed) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Gem className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد قطع</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف أو اسم القطعة..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Requests List */}
          <div className="divide-y divide-gray-700">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-700/50 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-white text-lg">{request.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                        request.status === 'contacted' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {request.status === 'pending' ? 'قيد الانتظار' :
                         request.status === 'contacted' ? 'تم التواصل' :
                         'مكتمل'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-2">
                      <a href={`tel:${request.phone}`} className="hover:text-yellow-400 flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {request.phone}
                      </a>
                      <span className="flex items-center gap-1">
                        <Gem className="w-4 h-4" />
                        {request.item_name || request.item_code}
                      </span>
                    </div>
                    {request.message && (
                      <p className="text-gray-500 text-sm bg-gray-700/50 rounded-lg p-3 mt-2">
                        {request.message}
                      </p>
                    )}
                    <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(request.timestamp)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'contacted')}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          تم التواصل
                        </button>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'completed')}
                          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          مكتمل
                        </button>
                      </>
                    )}
                    {request.status === 'contacted' && (
                      <button
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        مكتمل
                      </button>
                    )}
                    <a
                      href={`https://wa.me/${request.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      واتساب
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد طلبات</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-yellow-500" />
              توزيع الأصناف
            </h3>
            <div className="space-y-4">
              {Object.entries(
                topItems.reduce((acc, item) => {
                  const cat = item.item.category || 'أخرى';
                  acc[cat] = (acc[cat] || 0) + item.views;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([category, views], index) => {
                  const total = topItems.reduce((sum, item) => sum + item.views, 0) || 1;
                  const percentage = ((views / total) * 100).toFixed(1);
                  const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500'];
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">{category}</span>
                        <span className="text-gray-400 text-sm">{views} مشاهدة ({percentage}%)</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[index % colors.length]} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Karat Distribution */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Gem className="w-5 h-5 text-yellow-500" />
              توزيع العيارات
            </h3>
            <div className="space-y-4">
              {Object.entries(
                topItems.reduce((acc, item) => {
                  const karat = `عيار ${item.item.karat}` || 'غير محدد';
                  acc[karat] = (acc[karat] || 0) + item.views;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([karat, views], index) => {
                  const total = topItems.reduce((sum, item) => sum + item.views, 0) || 1;
                  const percentage = ((views / total) * 100).toFixed(1);
                  const colors = ['bg-yellow-400', 'bg-yellow-600', 'bg-yellow-700', 'bg-gray-400'];
                  return (
                    <div key={karat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">{karat}</span>
                        <span className="text-gray-400 text-sm">{views} مشاهدة ({percentage}%)</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[index % colors.length]} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Phone icon to lucide imports if not present
const Phone: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export default GalleryStatsPage;
