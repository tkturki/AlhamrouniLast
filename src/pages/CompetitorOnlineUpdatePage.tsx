import React, { useState, useEffect } from 'react';
import { Globe, Wifi, WifiOff, RefreshCw, Download, CheckCircle, AlertTriangle, ExternalLink, ArrowLeft, Users, TrendingUp, Search, Clock, Database, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCompetitors, saveCompetitors, getCompetitorPosts, saveCompetitorPost, type Competitor, type CompetitorPost } from '../services/competitorAnalysis';
import { updateGoldPrices } from '../services/settings';
import { fetchGoldPrices as fetchGoldPricesFromAPI } from '../services/goldPriceApi';
import { formatNumber } from '../services/supabase';

type UpdateSource = 'gold_prices' | 'competitors' | 'all';

interface UpdateLog {
  id: string;
  source: UpdateSource;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: string;
}

const CompetitorOnlineUpdatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [selectedSources, setSelectedSources] = useState<UpdateSource[]>(['gold_prices']);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCompetitor, setManualCompetitor] = useState({
    competitorId: '',
    postUrl: '',
    content: '',
    likes: 0,
    comments: 0,
    shares: 0,
    postedAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    setCompetitors(getCompetitors());
    const stored = localStorage.getItem('last_online_update');
    if (stored) setLastUpdate(stored);
  }, []);

  const addLog = (source: UpdateSource, status: 'success' | 'error' | 'pending', message: string) => {
    const log: UpdateLog = {
      id: `log_${Date.now()}`,
      source,
      status,
      message,
      timestamp: new Date().toLocaleString('en-CA'),
    };
    setUpdateLogs(prev => [log, ...prev].slice(0, 50));
  };

  const fetchGoldPrices = async (): Promise<boolean> => {
    try {
      addLog('gold_prices', 'pending', 'جاري جلب أسعار الذهب من MetalPriceAPI...');
      
      const prices = await fetchGoldPricesFromAPI();
      
      if (!prices || prices.gold24k === 0) {
        addLog('gold_prices', 'error', '⚠️ تعذر جلب الأسعار - تحقق من الاتصال بالإنترنت');
        return false;
      }

      // Save to system settings
      const saved = updateGoldPrices({
        gold24k: prices.gold24k,
        gold21k: prices.gold21k,
        gold18k: prices.gold18k,
        silver: prices.silver,
      });

      if (saved) {
        addLog('gold_prices', 'success', `✅ تم جلب وحفظ الأسعار بنجاح`);
        addLog('gold_prices', 'success', `   24 قيراط: ${formatNumber(prices.gold24k)} د.ل/جرام`);
        addLog('gold_prices', 'success', `   21 قيراط: ${formatNumber(prices.gold21k)} د.ل/جرام`);
        addLog('gold_prices', 'success', `   18 قيراط: ${formatNumber(prices.gold18k)} د.ل/جرام`);
        addLog('gold_prices', 'success', `   الفضة: ${formatNumber(prices.silver)} د.ل/جرام`);
        addLog('gold_prices', 'success', `   دولار/دينار: ${formatNumber(prices.usdToLyd)}`);
        return true;
      } else {
        addLog('gold_prices', 'error', '⚠️ تم جلب الأسعار لكن فشل الحفظ');
        return false;
      }
    } catch (error) {
      addLog('gold_prices', 'error', `خطأ في جلب الأسعار: ${error}`);
      return false;
    }
  };

  const fetchCompetitorData = async (): Promise<boolean> => {
    try {
      addLog('competitors', 'pending', 'جاري فتح صفحات المنافسين...');
      
      // Get competitors with real Facebook URLs
      const competitors = getCompetitors();
      const socialCompetitors = competitors.filter(c => c.facebookUrl);
      
      if (socialCompetitors.length === 0) {
        addLog('competitors', 'error', '⚠️ لا توجد صفحات فيسبوك مسجلة للمنافسين');
        return false;
      }

      // Show competitor list and open their pages
      addLog('competitors', 'success', `تم العثور على ${socialCompetitors.length} منافس:`);
      for (const comp of socialCompetitors) {
        addLog('competitors', 'success', `  - ${comp.name}: ${comp.facebookUrl}`);
        // Open each competitor page in a new tab for manual review
        if (comp.facebookUrl) {
          window.open(comp.facebookUrl, '_blank', 'noopener,noreferrer');
        }
      }

      addLog('competitors', 'success', `✅ تم فتح ${socialCompetitors.length} صفحة - البيانات تُضاف يدوياً من صفحة التحديث`);
      return true;
    } catch (error) {
      addLog('competitors', 'error', `خطأ: ${error}`);
      return false;
    }
  };

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const testResponse = await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) 
      });
      return true;
    } catch {
      return false;
    }
  };

  const startOnlineUpdate = async () => {
    setIsUpdating(true);
    setUpdateLogs([]);
    
    addLog('all', 'pending', 'جاري فحص الاتصال بالإنترنت...');
    
    // Check connectivity
    const connected = await checkConnectivity();
    if (!connected) {
      addLog('all', 'error', '❌ لا يوجد اتصال بالإنترنت - تأكد من تفعيل الواي فاي أو البيانات');
      setIsUpdating(false);
      return;
    }

    setIsOnline(true);
    addLog('all', 'success', '✅ تم الاتصال بالإنترنت بنجاح');

    // Fetch selected sources
    for (const source of selectedSources) {
      switch (source) {
        case 'gold_prices':
          await fetchGoldPrices();
          break;
        case 'competitors':
          await fetchCompetitorData();
          break;
      }
    }

    localStorage.setItem('last_online_update', new Date().toISOString());
    setLastUpdate(new Date().toISOString());
    setIsUpdating(false);
    addLog('all', 'success', '✓ اكتملت عملية التحديث بنجاح - يمكنك فصل الاتصال الآن');
  };

  const handleManualCompetitorPost = () => {
    if (!manualCompetitor.competitorId || !manualCompetitor.content) return;
    
    saveCompetitorPost({
      competitorId: manualCompetitor.competitorId,
      platform: 'facebook',
      postUrl: manualCompetitor.postUrl || '',
      content: manualCompetitor.content,
      mediaType: 'text',
      likes: manualCompetitor.likes,
      comments: manualCompetitor.comments,
      shares: manualCompetitor.shares,
      postedAt: new Date(manualCompetitor.postedAt).toISOString(),
      promotedItems: [],
    });

    addLog('competitors', 'success', 'تم حفظ منشور المنافس يدوياً');
    setManualCompetitor({
      competitorId: '', postUrl: '', content: '', likes: 0, comments: 0, shares: 0,
      postedAt: new Date().toISOString().slice(0, 16),
    });
  };

  const clearUpdateLogs = () => {
    setUpdateLogs([]);
  };

  const handleDisconnect = () => {
    setIsOnline(false);
    addLog('all', 'success', '🔌 تم فصل الاتصال - العودة للوضع أوفلاين');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-5 h-5" />رجوع
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${isOnline ? 'bg-gradient-to-br from-green-600 to-green-500' : 'bg-gradient-to-br from-blue-600 to-blue-500'}`}>
          {isOnline ? <Wifi className="w-8 h-8 text-white" /> : <Globe className="w-8 h-8 text-white" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">التحديث الأونلاين</h1>
          <p className="text-gray-400">اتصل بالإنترنت ← جلب البيانات ← افصل الاتصال</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`rounded-2xl p-4 mb-6 border ${isOnline ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800 border-gray-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="w-6 h-6 text-green-400" /> : <WifiOff className="w-6 h-6 text-gray-400" />}
            <div>
              <p className={`font-bold ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
              </p>
              {lastUpdate && <p className="text-gray-500 text-sm">آخر تحديث: {new Date(lastUpdate).toLocaleString('en-CA')}</p>}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${isOnline ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Update Controls */}
        <div className="space-y-6">
          {/* Source Selection */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />مصادر البيانات
            </h3>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border ${selectedSources.includes('gold_prices') ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-gray-700/50 border-gray-600'}`}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes('gold_prices')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSources(prev => [...prev, 'gold_prices']);
                    else setSelectedSources(prev => prev.filter(s => s !== 'gold_prices'));
                  }}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-bold text-white">أسعار الذهب</p>
                  <p className="text-gray-400 text-sm">جلب أسعار الذهب من الإنترنت</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border ${selectedSources.includes('competitors') ? 'bg-purple-500/10 border-purple-500/50' : 'bg-gray-700/50 border-gray-600'}`}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes('competitors')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSources(prev => [...prev, 'competitors']);
                    else setSelectedSources(prev => prev.filter(s => s !== 'competitors'));
                  }}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-bold text-white">بيانات المنافسين</p>
                  <p className="text-gray-400 text-sm">منشورات وتقييمات المنافسين</p>
                </div>
              </label>
            </div>
          </div>

          {/* Update Button */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <button
              onClick={isOnline ? handleDisconnect : startOnlineUpdate}
              disabled={isUpdating}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                isUpdating
                  ? 'bg-gray-700 text-gray-400 cursor-wait'
                  : isOnline
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white'
                    : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white'
              }`}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />جاري التحديث...
                </>
              ) : isOnline ? (
                <>
                  <WifiOff className="w-6 h-6" />فصل الاتصال
                </>
              ) : (
                <>
                  <Wifi className="w-6 h-6" />اتصل وحدّث
                </>
              )}
            </button>
            <p className="text-gray-500 text-sm text-center mt-3">
              {selectedSources.length === 0 ? 'اختر مصدر بيانات أولاً' : `سيتم تحديث ${selectedSources.length} مصدر`}
            </p>
          </div>

          {/* Manual Competitor Entry */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <button onClick={() => setShowManualForm(!showManualForm)} className="w-full flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" />إدخال يدوي لمنشور منافس</span>
              <span className={`transform transition ${showManualForm ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showManualForm && (
              <div className="mt-4 space-y-3">
                <select
                  value={manualCompetitor.competitorId}
                  onChange={(e) => setManualCompetitor({ ...manualCompetitor, competitorId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg"
                >
                  <option value="">اختر المنافس</option>
                  {competitors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <textarea
                  value={manualCompetitor.content}
                  onChange={(e) => setManualCompetitor({ ...manualCompetitor, content: e.target.value })}
                  placeholder="محتوى المنشور..."
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg h-24"
                />
                <input
                  type="text"
                  value={manualCompetitor.postUrl}
                  onChange={(e) => setManualCompetitor({ ...manualCompetitor, postUrl: e.target.value })}
                  placeholder="رابط المنشور (اختياري)"
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs">إعجابات</label>
                    <input type="text" inputMode="decimal" value={manualCompetitor.likes} onChange={(e) => setManualCompetitor({ ...manualCompetitor, likes: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">تعليقات</label>
                    <input type="text" inputMode="decimal" value={manualCompetitor.comments} onChange={(e) => setManualCompetitor({ ...manualCompetitor, comments: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">مشاركات</label>
                    <input type="text" inputMode="decimal" value={manualCompetitor.shares} onChange={(e) => setManualCompetitor({ ...manualCompetitor, shares: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={manualCompetitor.postedAt}
                  onChange={(e) => setManualCompetitor({ ...manualCompetitor, postedAt: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg"
                  lang="en"
                />
                <button
                  onClick={handleManualCompetitorPost}
                  disabled={!manualCompetitor.competitorId || !manualCompetitor.content}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                >
                  حفظ المنشور
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Update Logs & Competitors */}
        <div className="space-y-6">
          {/* Update Logs */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />سجل التحديث
              </h3>
              {updateLogs.length > 0 && (
                <button onClick={clearUpdateLogs} className="text-gray-400 hover:text-red-400 text-sm">مسح</button>
              )}
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {updateLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد سجلات بعد</p>
              ) : (
                updateLogs.map(log => (
                  <div key={log.id} className={`p-3 rounded-lg border ${
                    log.status === 'success' ? 'bg-green-900/30 border-green-500/30' :
                    log.status === 'error' ? 'bg-red-900/30 border-red-500/30' :
                    'bg-yellow-900/30 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                       log.status === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                       <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />}
                      <span className="text-white text-sm">{log.message}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{log.timestamp}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Competitors List */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />المنافسين ({competitors.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {competitors.map(comp => {
                const posts = getCompetitorPosts(comp.id);
                return (
                  <div key={comp.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{comp.name}</p>
                        <p className="text-gray-400 text-sm">{comp.location} · {comp.category === 'gold' ? 'ذهب' : comp.category === 'silver' ? 'فضة' : comp.category === 'gemstones' ? 'أحجار' : 'متنوع'}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-purple-400 font-bold" lang="en">{posts.length} منشور</p>
                        <p className="text-gray-500 text-xs">{comp.platform === 'physical' ? 'محل فعلي' : comp.platform}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />كيفية التحديث
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wifi className="w-6 h-6 text-green-400" />
            </div>
            <p className="font-bold text-white">1. اتصل بالإنترنت</p>
            <p className="text-gray-400 text-sm">فعّل الواي فاي أو البيانات</p>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
            <p className="font-bold text-white">2. جلب البيانات</p>
            <p className="text-gray-400 text-sm">اضغط "اتصل وحدث" لجلب البيانات</p>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <WifiOff className="w-6 h-6 text-red-400" />
            </div>
            <p className="font-bold text-white">3. افصل الاتصال</p>
            <p className="text-gray-400 text-sm">أوقف الاتصال وتاب العمل أوفلاين</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitorOnlineUpdatePage;