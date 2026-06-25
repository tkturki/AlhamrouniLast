import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Gem,
  Coins,
  BarChart3,
  PieChart,
  Brain,
  Target,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
  Facebook,
  Clock,
  Zap,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import {
  fetchGoldPrices,
  calculateKaratPrices,
  analyzePriceChange,
  analyzeMarketSentiment,
  predictNextPrice,
  getPriceHistory,
  GoldPriceData,
  PriceHistory,
} from '../services/goldPriceApi';
import { getSystemSettings } from '../services/settings';
import { jewelryApi, formatNumber, formatCurrency } from '../services/supabase';
import { JewelryItem } from '../services/supabase';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  avgSaleValue: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  salesByKarat: Record<string, number>;
  salesTrend: Array<{ date: string; amount: number }>;
}

const DashboardPage: React.FC = () => {
  const [goldPrices, setGoldPrices] = useState<GoldPriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [marketAnalysis, setMarketAnalysis] = useState<{
    sentiment: string;
    score: number;
    trend: string;
    recommendation: string;
  }>({
    sentiment: 'neutral',
    score: 50,
    trend: '0',
    recommendation: 'جاري التحميل...',
  });
  const [prediction, setPrediction] = useState<{
    tomorrow: number;
    nextWeek: number;
    confidence: string;
  } | null>(null);
  const [visitorStats, setVisitorStats] = useState({
    todayViews: 0,
    totalViews: 0,
    avgTime: '0:00',
    topItems: [] as string[],
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadGoldPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadGoldPrices(), loadSalesStats(), loadVisitorStats()]);
    setLoading(false);
  };

  const loadGoldPrices = async () => {
    // Fetch real prices from API with fallback
    const prices = await fetchGoldPrices();
    setGoldPrices(prices);

    // Get price history (real or generated)
    const history = getPriceHistory(30);
    setPriceHistory(history);
    setLastUpdate(new Date());

    // Analyze market sentiment with real data
    const analysis = analyzeMarketSentiment(history, history);
    setMarketAnalysis({
      sentiment: analysis.sentiment,
      score: analysis.score,
      trend: analysis.trend,
      recommendation: analysis.recommendation,
    });

    // Get price prediction
    const pred = predictNextPrice(history);
    setPrediction(pred);
  };

  
  const loadSalesStats = async () => {
    // Load REAL sales data from localStorage
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
      const draftInvoices = JSON.parse(localStorage.getItem('draft_invoices') || '[]');
      const allInvoices = [...savedInvoices, ...draftInvoices];

      if (allInvoices.length === 0) {
        setSalesStats({
          totalSales: 0,
          totalRevenue: 0,
          avgSaleValue: 0,
          topItems: [],
          salesByKarat: { '24': 0, '21': 0, '18': 0, 'فضة': 0 },
          salesTrend: [],
        });
        return;
      }

      // Calculate real stats
      const totalSales = allInvoices.length;
      const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const avgSaleValue = totalRevenue / totalSales;

      // Calculate sales by karat
      const salesByKarat: Record<string, number> = { '24': 0, '21': 0, '18': 0, 'فضة': 0 };
      const itemCountByName: Record<string, { count: number; revenue: number }> = {};

      allInvoices.forEach(inv => {
        (inv.items || []).forEach((item: any) => {
          const karat = item.karat || '21';
          if (salesByKarat[karat] !== undefined) {
            salesByKarat[karat] += item.quantity || 1;
          }
          if (!itemCountByName[item.model_name]) {
            itemCountByName[item.model_name] = { count: 0, revenue: 0 };
          }
          itemCountByName[item.model_name].count += item.quantity || 1;
          itemCountByName[item.model_name].revenue += item.total || 0;
        });
      });

      // Top items
      const topItems = Object.entries(itemCountByName)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sales trend by day
      const salesTrend: Record<string, number> = {};
      allInvoices.forEach(inv => {
        const date = new Date(inv.created_at).toLocaleDateString('ar-LY', { month: 'short', day: 'numeric' });
        if (!salesTrend[date]) salesTrend[date] = 0;
        salesTrend[date] += inv.total_amount || 0;
      });

      const salesTrendArray = Object.entries(salesTrend).map(([date, amount]) => ({ date, amount }));

      setSalesStats({
        totalSales,
        totalRevenue,
        avgSaleValue,
        topItems,
        salesByKarat,
        salesTrend: salesTrendArray,
      });
    } catch (error) {
      console.error('Error loading sales stats:', error);
      setSalesStats({
        totalSales: 0,
        totalRevenue: 0,
        avgSaleValue: 0,
        topItems: [],
        salesByKarat: { '24': 0, '21': 0, '18': 0, 'فضة': 0 },
        salesTrend: [],
      });
    }
  };

  const loadVisitorStats = () => {
    // Load real visitor stats from localStorage
    try {
      const orders = JSON.parse(localStorage.getItem('order_data') || '[]');
      // Get items from localStorage
      const localItems = localStorage.getItem('jewelry_items');
      const items = localItems ? JSON.parse(localItems) : [];

      // Calculate real inventory stats
      const totalPieces = items.reduce((sum: number, i: any) => sum + (i.stock_qty || 0), 0);
      const goldPieces = items.filter((i: any) => i.item_type === 'G').length;
      const silverPieces = items.filter((i: any) => i.item_type === 'S').length;
      const outOfStock = items.filter((i: any) => i.stock_qty <= 0).length;

      setVisitorStats({
        todayViews: orders.length,
        totalViews: totalPieces,
        avgTime: '0:00',
        topItems: items.slice(0, 3).map((i: any) => i.model_name),
      });
    } catch {
      setVisitorStats({
        todayViews: 0,
        totalViews: 0,
        avgTime: '0:00',
        topItems: [],
      });
    }
  };

  const karatPrices = goldPrices ? calculateKaratPrices(goldPrices.gold24k, goldPrices.usdToLyd || 4.85) : null;

  const pieData = salesStats
    ? [
        { name: 'عيار 24', value: salesStats.salesByKarat['24'], color: '#FFD700' },
        { name: 'عيار 21', value: salesStats.salesByKarat['21'], color: '#FFC107' },
        { name: 'عيار 18', value: salesStats.salesByKarat['18'], color: '#FFA000' },
        { name: 'فضة', value: salesStats.salesByKarat['فضة'], color: '#C0C0C0' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">لوحة التحكم الذكية</h1>
          <p className="text-gray-400 text-sm">تحليلات متقدمة بالذكاء الاصطناعي</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* AI Market Analysis */}
      {marketAnalysis && (
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">تحليل السوق بالذكاء الاصطناعي</h2>
              <p className="text-purple-300 text-sm">آخر تحديث: {lastUpdate.toLocaleTimeString('ar-LY')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {marketAnalysis.sentiment === 'bullish' ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : marketAnalysis.sentiment === 'bearish' ? (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                ) : (
                  <Minus className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <p className="text-purple-300 text-xs">المزاج العام</p>
              <p className="text-xl font-bold text-white">
                {marketAnalysis.sentiment === 'bullish'
                  ? 'صاعد 📈'
                  : marketAnalysis.sentiment === 'bearish'
                  ? 'هابط 📉'
                  : 'مستقر ➡️'}
              </p>
            </div>

            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <p className="text-purple-300 text-xs">درجة الثقة</p>
              <p className="text-3xl font-bold text-white">{marketAnalysis.score}%</p>
            </div>

            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <p className="text-purple-300 text-xs">نسبة التغيير</p>
              <p className={`text-xl font-bold ${parseFloat(marketAnalysis.trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(marketAnalysis.trend) >= 0 ? '+' : ''}
                {marketAnalysis.trend}%
              </p>
            </div>

            <div className="bg-purple-900/30 rounded-xl p-4 text-center">
              <p className="text-purple-300 text-xs">التوصية</p>
              <p className="text-sm font-bold text-yellow-400">{marketAnalysis.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Gold Prices & Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Gold Prices */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-400">أسعار الذهب الحالي</h3>
            </div>
            <span className="text-xs text-gray-500">د.ل / غرام</span>
          </div>

          {karatPrices && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-yellow-600/20 rounded-xl p-4 text-center border border-yellow-600/30">
                <p className="text-yellow-300 text-sm">عيار 24</p>
                <p className="text-2xl font-bold text-yellow-400">{formatNumber(karatPrices.price24kLyd)}</p>
              </div>
              <div className="bg-yellow-600/20 rounded-xl p-4 text-center border border-yellow-600/30">
                <p className="text-yellow-300 text-sm">عيار 21</p>
                <p className="text-2xl font-bold text-yellow-400">{formatNumber(karatPrices.price21kLyd)}</p>
              </div>
              <div className="bg-yellow-600/20 rounded-xl p-4 text-center border border-yellow-600/30">
                <p className="text-yellow-300 text-sm">عيار 18</p>
                <p className="text-2xl font-bold text-yellow-400">{formatNumber(karatPrices.price18kLyd)}</p>
              </div>
            </div>
          )}

          <div className="mt-4 bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Coins className="w-4 h-4" />
              <span>الفضة:</span>
              <span className="font-bold text-white">
                {goldPrices ? formatNumber(goldPrices.silver) : '---'} د.ل/غ
              </span>
            </div>
          </div>
        </div>

        {/* Price Prediction */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-green-400">توقعات الأسعار</h3>
            <span className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded-full">
              {prediction?.confidence === 'high' ? 'ثقة عالية' : 'ثقة متوسطة'}
            </span>
          </div>

          {prediction && (
            <div className="space-y-4">
              <div className="bg-green-900/30 rounded-xl p-4 border border-green-600/30">
                <p className="text-green-300 text-sm mb-1"> السعر المتوقع غداً</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatNumber(prediction.tomorrow)} د.ل
                </p>
              </div>
              <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-600/30">
                <p className="text-blue-300 text-sm mb-1"> السعر المتوقع الأسبوع القادم</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatNumber(prediction.nextWeek)} د.ل
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gold Price Chart */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-400">مخطط أسعار الذهب (30 يوم)</h3>
          </div>
          <div className="flex gap-2">
            <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">30 يوم</button>
            <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm">7 أيام</button>
            <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm">سنة</button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={['dataMin - 20', 'dataMax + 20']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area type="monotone" dataKey="gold24k" stroke="#FFD700" strokeWidth={2} fill="url(#goldGradient)" name="ذهب 24" />
              <Area type="monotone" dataKey="gold21k" stroke="#FFC107" strokeWidth={2} fill="none" name="ذهب 21" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Summary */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-blue-400">ملخص المبيعات</h3>
          </div>

          {salesStats && (
            <div className="space-y-4">
              <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-600/30">
                <p className="text-blue-300 text-sm">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-white">{salesStats.totalSales} فاتورة</p>
              </div>
              <div className="bg-green-900/30 rounded-xl p-4 border border-green-600/30">
                <p className="text-green-300 text-sm">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(salesStats.totalRevenue)}</p>
              </div>
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-600/30">
                <p className="text-purple-300 text-sm">متوسط قيمة الفاتورة</p>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(salesStats.avgSaleValue)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sales by Karat */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-400">المبيعات حسب العينة</h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-green-400">الأكثر مبيعاً</h3>
          </div>

          {salesStats && (
            <div className="space-y-3">
              {salesStats.topItems.map((item, index) => (
                <div key={item.name} className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                    <span className="text-green-400 font-bold">{item.count} قطعة</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{ width: `${(item.count / salesStats.topItems[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-bold text-blue-400">اتجاه المبيعات (30 يوم)</h3>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesStats?.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => [formatCurrency(value), 'المبيعات']}
              />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
