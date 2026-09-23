import React, { useState, useEffect } from 'react';
import {
  Eye, Heart, Users, TrendingUp, Calendar,
  BarChart3, Download, RefreshCw, Gem,
  Search, MessageSquare, Share2, Phone
} from 'lucide-react';
import { JewelryItem, supabase, isSupabaseAvailable } from '../services/supabase';

interface MeasurableStats {
  totalViews: number;
  whatsappClicks: number;
  shareClicks: number;
  totalFavorites: number;
  totalContactRequests: number;
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
  const [stats, setStats] = useState<MeasurableStats>({
    totalViews: 0,
    whatsappClicks: 0,
    shareClicks: 0,
    totalFavorites: 0,
    totalContactRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [topItems, setTopItems] = useState<ItemStats[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'requests'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStats();
    loadRequests();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    try {
      let items: JewelryItem[] = [];
      // Try Supabase first
      if (isSupabaseAvailable() && supabase) {
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
      } else {
        const stored = localStorage.getItem('jewelry_items');
        if (stored) items = JSON.parse(stored);
      }

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

      itemStats.sort((a, b) => b.views - a.views);
      setTopItems(itemStats.slice(0, 20));

      const contactRequests = JSON.parse(localStorage.getItem('contact_requests') || '[]');
      const whatsappClicks = parseInt(localStorage.getItem('whatsapp_clicks') || '0');
      const shareClicks = parseInt(localStorage.getItem('share_clicks') || '0');
      const totalViews = itemStats.reduce((sum, item) => sum + item.views, 0);
      const totalFavorites = itemStats.reduce((sum, item) => sum + item.favorites, 0);

      setStats({
        totalViews,
        whatsappClicks,
        shareClicks,
        totalFavorites,
        totalContactRequests: contactRequests.length,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">إحصائيات المعرض</h1>
            <p className="text-gray-400">بيانات قابلة للقياس فعلياً</p>
          </div>
        </div>
        <div className="flex gap-3">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
          <p className="text-yellow-200 text-sm">مشاهدات الصور</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.whatsappClicks}</p>
          <p className="text-green-200 text-sm">ضغطات واتساب</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.shareClicks}</p>
          <p className="text-blue-200 text-sm">ضغطات مشاركة</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalFavorites}</p>
          <p className="text-red-200 text-sm">المفضلة</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            {stats.pendingRequests > 0 && (
              <span className="bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                {stats.pendingRequests}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalContactRequests}</p>
          <p className="text-purple-200 text-sm">طلبات التواصل</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completedRequests}</p>
          <p className="text-emerald-200 text-sm">تم التواصل</p>
        </div>
      </div>

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
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Gem className="w-5 h-5 text-yellow-500" />
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

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
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
                    <p className="text-gray-600 text-xs mt-2">
                      {formatDate(request.timestamp)}
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
    </div>
  );
};

export default GalleryStatsPage;
