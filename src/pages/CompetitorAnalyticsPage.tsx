import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  PieChart,
  AlertTriangle,
  Zap,
  Target,
  Calendar,
  Clock,
  MapPin,
  Facebook,
  Instagram,
  Globe,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Trophy,
  Shield,
  Activity,
  ExternalLink,
  MessageCircle,
  Share2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  getCompetitors,
  saveCompetitors,
  upsertCompetitor,
  deleteCompetitor,
  getCompetitorPosts,
  calculateCompetitorAnalytics,
  getAllCompetitorsAnalytics,
  generateMarketInsights,
  openCompetitorPage,
  exportCompetitorData,
  importCompetitorData,
  Competitor,
  CompetitorPost,
  CompetitorAnalytics,
  MarketInsight,
  TRIPOLI_COMPETITORS,
} from '../services/competitorAnalysis';
import { formatNumber } from '../services/supabase';

const CompetitorAnalyticsPage: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analytics, setAnalytics] = useState<CompetitorAnalytics[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'posts' | 'insights' | 'settings'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [newCompetitor, setNewCompetitor] = useState<{
    name: string;
    platform: 'facebook' | 'instagram' | 'website' | 'physical';
    location: string;
    category: 'gold' | 'silver' | 'gemstones' | 'mixed';
    facebookUrl: string;
    instagramUrl: string;
    websiteUrl: string;
    phone: string;
    notes: string;
    isActive: boolean;
  }>({
    name: '',
    platform: 'facebook',
    location: '',
    category: 'gold',
    facebookUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    phone: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const comps = getCompetitors();
    setCompetitors(comps);
    const analyticsData = getAllCompetitorsAnalytics(period);
    setAnalytics(analyticsData);
    setInsights(generateMarketInsights());
  };

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly') => {
    setPeriod(newPeriod);
    const analyticsData = getAllCompetitorsAnalytics(newPeriod);
    setAnalytics(analyticsData);
  };

  const handleOpenAllCompetitors = () => {
    const competitors = getCompetitors().filter(c => c.isActive);
    for (const comp of competitors) {
      openCompetitorPage(comp);
    }
    alert(`تم فتح ${competitors.length} صفحة منافس في المتصفح`);
  };

  const handleOpenCompetitor = (competitor: Competitor) => {
    openCompetitorPage(competitor);
  };

  const handleSaveCompetitor = () => {
    if (!newCompetitor.name.trim() || !newCompetitor.location.trim()) {
      alert('يرجى ملء الاسم والموقع');
      return;
    }
    const saved = upsertCompetitor(newCompetitor);
    if (editingCompetitor) {
      alert('تم تحديث المنافس');
    } else {
      alert('تم إضافة المنافس');
    }
    setShowAddModal(false);
    setEditingCompetitor(null);
    setNewCompetitor({ name: '', platform: 'facebook', location: '', category: 'gold', facebookUrl: '', instagramUrl: '', websiteUrl: '', phone: '', notes: '', isActive: true });
    loadData();
  };

  const handleEditCompetitor = (comp: Competitor) => {
    setEditingCompetitor(comp);
    setNewCompetitor({
      name: comp.name,
      platform: comp.platform as 'facebook' | 'instagram' | 'website' | 'physical',
      location: comp.location,
      category: comp.category as 'gold' | 'silver' | 'gemstones' | 'mixed',
      facebookUrl: comp.facebookUrl || '',
      instagramUrl: comp.instagramUrl || '',
      websiteUrl: comp.websiteUrl || '',
      phone: comp.phone || '',
      notes: comp.notes || '',
      isActive: comp.isActive,
    });
    setShowAddModal(true);
  };

  const handleDeleteCompetitor = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنافس؟')) {
      deleteCompetitor(id);
      loadData();
    }
  };

  const handleExport = () => {
    const data = exportCompetitorData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitors-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (importCompetitorData(result)) {
          alert('تم استيراد البيانات بنجاح');
          loadData();
        } else {
          alert('فشل في استيراد البيانات');
        }
      };
      reader.readAsText(file);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      gold: 'bg-yellow-600 text-white',
      silver: 'bg-gray-400 text-gray-900',
      gemstones: 'bg-purple-600 text-white',
      mixed: 'bg-blue-600 text-white',
    };
    return colors[category] || 'bg-gray-600 text-white';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      gold: 'ذهب',
      silver: 'فضة',
      gemstones: 'أحجار كريمة',
      mixed: 'مختلط',
    };
    return labels[category] || category;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'website': return <Globe className="w-4 h-4 text-green-500" />;
      default: return <MapPin className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'opportunity': return <Target className="w-4 h-4 text-green-400" />;
      case 'threat': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'price_alert': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-900/20 text-red-400';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20 text-yellow-400';
      default: return 'border-blue-500 bg-blue-900/20 text-blue-400';
    }
  };

  // Overview Tab
  if (activeTab === 'overview') {
    const totalCompetitors = competitors.filter(c => c.isActive).length;
    const totalPosts = analytics.reduce((sum, a) => sum + a.totalPosts, 0);
    const avgEngagement = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.avgEngagementRate, 0) / analytics.length
      : 0;
    const topCompetitor = analytics.reduce((max, a) => a.totalPosts > max.totalPosts ? a : max, analytics[0]);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">تحليل المنافسين</h1>
            <p className="text-gray-400">مراقبة السوق الليبي - طرابلس</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" /> تصدير
            </button>
            <label className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> استيراد
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={handleOpenAllCompetitors} disabled={scraping} className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 px-4 py-2 rounded-lg flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'جاري السحب...' : 'فتح صفحات المنافسين'}
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة منافس
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'overview', label: 'نظرة عامة' },
            { key: 'competitors', label: 'المنافسين' },
            { key: 'posts', label: 'المنشورات' },
            { key: 'insights', label: 'الرؤى' },
            { key: 'settings', label: 'الإعدادات' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === t.key
                  ? 'bg-yellow-500 text-gray-900 shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period Selector */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">الفترة:</span>
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p === 'daily' ? 'يومي' : p === 'weekly' ? 'أسبوعي' : 'شهري'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المنافسون النشطون</p>
                <p className="text-3xl font-bold text-white">{totalCompetitors}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">إجمالي المنشورات</p>
                <p className="text-3xl font-bold text-white">{totalPosts}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">متوسط معدل التفاعل</p>
                <p className="text-3xl font-bold text-pink-400">{avgEngagement.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">الأكثر نشاطاً</p>
                <p className="text-xl font-bold text-yellow-400">{topCompetitor?.competitorName || '---'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            رؤى السوق التلقائية
          </h3>
          {insights.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد رؤى حالياً. افتح صفحات المنافسين أولاً.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight, i) => (
                <div key={i} className={`rounded-xl p-4 border ${getSeverityColor(insight.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{insight.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(insight.detectedAt).toLocaleString('ar-LY')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitors Performance Chart */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            أداء المنافسين - المنشورات والتفاعل
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="competitorName" type="category" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={140} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="totalPosts" fill="#3B82F6" radius={[0, 4, 4, 0]} name="المنشورات" />
                <Bar dataKey="totalLikes" fill="#10B981" radius={[0, 4, 4, 0]} name="الإعجابات" />
                <Bar dataKey="totalComments" fill="#F59E0B" radius={[0, 4, 4, 0]} name="التعليقات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Rate Chart */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            معدل التفاعل حسب المنافس
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="competitorName" type="category" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={140} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'معدل التفاعل']}
                />
                <Bar dataKey="avgEngagementRate" fill="#EC4899" radius={[0, 4, 4, 0]} name="معدل التفاعل %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // Competitors Tab
  if (activeTab === 'competitors') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">إدارة المنافسين</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة منافس
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map(comp => (
            <div key={comp.id} className={`bg-gray-800 rounded-2xl border p-6 transition-all ${comp.isActive ? 'border-green-600/30' : 'border-gray-700 opacity-60'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(comp.category)}`}>
                    {getPlatformIcon(comp.platform)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{comp.name}</h3>
                    <p className="text-gray-400 text-sm">{comp.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${comp.isActive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  {comp.isActive ? 'نشط' : 'غير نشط'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className={`px-2 py-0.5 rounded ${getCategoryColor(comp.category)} text-xs`}>
                    {getCategoryLabel(comp.category)}
                  </span>
                  {getPlatformIcon(comp.platform)}
                </div>
                {comp.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="w-4 h-4" />
                    <span>{comp.phone}</span>
                  </div>
                )}
                {comp.facebookUrl && (
                  <a href={comp.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                    <Facebook className="w-4 h-4" /> فيسبوك
                  </a>
                )}
                {comp.instagramUrl && (
                  <a href={comp.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-400 hover:text-pink-300">
                    <Instagram className="w-4 h-4" /> انستغرام
                  </a>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                <button onClick={() => handleOpenCompetitor(comp)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                  <RefreshCw className="w-4 h-4" /> فتح الصفحة
                </button>
                <button onClick={() => handleEditCompetitor(comp)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => handleDeleteCompetitor(comp.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {competitors.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500 bg-gray-800 rounded-2xl border border-gray-700">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl mb-2">لا يوجد منافسون</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl">إضافة أول منافس</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Posts Tab
  if (activeTab === 'posts') {
    const allPosts: (CompetitorPost & { competitorName: string })[] = [];
    competitors.forEach(c => {
      const posts = getCompetitorPosts(c.id);
      posts.forEach(p => allPosts.push({ ...p, competitorName: c.name }));
    });
    allPosts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">منشورات المنافسين</h1>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <option value="daily">آخر 24 ساعة</option>
              <option value="weekly">آخر أسبوع</option>
              <option value="monthly">آخر شهر</option>
            </select>
            <button onClick={handleOpenAllCompetitors} disabled={scraping} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {allPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-2xl border border-gray-700">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">لا توجد منشورات</p>
            <p className="text-gray-400 mb-6">افتح صفحات المنافسين لعرض منشورات المنافسين</p>
            <button onClick={handleOpenAllCompetitors} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl">فتح صفحات المنافسين</button>
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.slice(0, 50).map(post => {
              const competitor = competitors.find(c => c.id === post.competitorId);
              return (
                <div key={post.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(competitor?.category || 'gold')}`}>
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{post.competitorName}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                            {post.platform === 'facebook' ? 'فيسبوك' : 'انستغرام'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{new Date(post.postedAt).toLocaleString('ar-LY')}</p>
                      </div>
                    </div>
                    <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 p-2">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-white mb-4 line-clamp-3">{post.content}</p>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">{formatNumber(post.likes)}</span>
                      <span className="text-gray-400">إعجاب</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-bold">{formatNumber(post.comments)}</span>
                      <span className="text-gray-400">تعليق</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Share2 className="w-4 h-4" />
                      <span className="font-bold">{formatNumber(post.shares)}</span>
                      <span className="text-gray-400">مشاركة</span>
                    </div>
                    {post.views && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Eye className="w-4 h-4" />
                        <span className="font-bold">{formatNumber(post.views)}</span>
                        <span className="text-gray-400">مشاهدة</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-pink-400">
                      <Activity className="w-4 h-4" />
                      <span className="font-bold">{post.engagementRate.toFixed(1)}%</span>
                      <span className="text-gray-400">معدل تفاعل</span>
                    </div>
                  </div>

                  {post.promotedItems && post.promotedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.promotedItems.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Insights Tab
  if (activeTab === 'insights') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">رؤى وتحليلات السوق</h1>
          <button onClick={handleOpenAllCompetitors} disabled={scraping} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
            تحديث الرؤى
          </button>
        </div>

        {insights.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-2xl border border-gray-700">
            <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">لا توجد رؤى متاحة</p>
            <p className="text-gray-400 mb-6">اسحب بيانات المنافسين لتوليد رؤى تلقائية</p>
            <button onClick={handleOpenAllCompetitors} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl">فتح صفحات المنافسين</button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className={`bg-gray-800 rounded-2xl border p-6 ${getSeverityColor(insight.severity)}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(insight.severity)}`}>
                        {insight.severity === 'high' ? 'عالي' : insight.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-2">{insight.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(insight.detectedAt).toLocaleString('ar-LY')}
                      </span>
                      {insight.competitorName && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {insight.competitorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Distribution */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            توزيع الفئات المروج لها
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={analytics.flatMap(a => Object.entries(a.promotedCategories).map(([name, value]) => ({ name, value }))).reduce((acc, curr) => {
                    const existing = acc.find(item => item.name === curr.name);
                    if (existing) existing.value += curr.value;
                    else acc.push(curr);
                    return acc;
                  }, [] as Array<{name: string, value: number}>)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {['#FFD700', '#C0C0C0', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Posting Times */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            أفضل أوقات النشر (بناءً على نشاط المنافسين)
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, h) => {
              // Calculate count for this hour
              let count = 0;
              competitors.forEach(c => {
                const posts = getCompetitorPosts(c.id);
                posts.forEach(p => {
                  if (new Date(p.postedAt).getHours() === h) count++;
                });
              });

              // Calculate max across all hours for percentage
              const hourCounts: Record<number, number> = {};
              competitors.forEach(c => {
                const posts = getCompetitorPosts(c.id);
                posts.forEach(p => {
                  const hour = new Date(p.postedAt).getHours();
                  hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                });
              });
              const maxCount = Math.max(...Object.values(hourCounts), 1);

              return (
                <div key={h} className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">{h}:00</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <div className="h-2 bg-gray-600 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${count > 0 ? Math.max(10, (count / maxCount) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-yellow-400">إعدادات تحليل المنافسين</h1>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">استيراد منافسين محددين مسبقاً (طرابلس)</h3>
          <p className="text-gray-400 mb-4">هذه قائمة بالمنافسين الرئيسيين في سوق طرابلس بناءً على بياناتك</p>
          <button
            onClick={() => {
              const existing = getCompetitors();
              const newOnes = TRIPOLI_COMPETITORS.filter(
                t => !existing.some(e => e.name === t.name && e.location === t.location)
              );
              newOnes.forEach(c => upsertCompetitor(c));
              loadData();
              alert(`تم إضافة ${newOnes.length} منافس جديد`);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <Users className="w-5 h-5" /> استيراد منافسي طرابلس ({TRIPOLI_COMPETITORS.length})
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">نسخ احتياطي واستعادة</h3>
          <div className="flex gap-4 flex-wrap">
            <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl flex items-center gap-2">
              <Download className="w-5 h-5" /> تصدير جميع البيانات
            </button>
            <label className="bg-green-700 hover:bg-green-600 px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" /> استيراد بيانات
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">معلومات النظام</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">إجمالي المنافسين:</span> <span className="text-white ml-2">{competitors.length}</span></div>
            <div><span className="text-gray-400">منافسون نشطون:</span> <span className="text-green-400 ml-2">{competitors.filter(c => c.isActive).length}</span></div>
            <div><span className="text-gray-400">إجمالي المنشورات المخزنة:</span> <span className="text-white ml-2">{getCompetitorPosts().length}</span></div>
            <div><span className="text-gray-400">فترة التحليل الحالية:</span> <span className="text-yellow-400 ml-2">{period === 'daily' ? 'يومي' : period === 'weekly' ? 'أسبوعي' : 'شهري'}</span></div>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-600/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ بيانات قديمة</h3>
          <p className="text-gray-300 mb-4">
            هذه البيانات من منشورات قديمة مخزنة. لإظهار بيانات حقيقية، قم بإدخال منشورات يدوياً عبر تبويب "المنشورات".
          </p>
          <button
            onClick={() => {
              if (window.confirm('هل تريد مسح جميع المنشورات المخزنة؟ سيتم ضبط العدادات على صفر.')) {
                localStorage.removeItem('competitor_posts_data');
                loadData();
                alert('تم مسح جميع المنشورات. الآن أدخل منشورات جديدة يدوياً.');
              }
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg"
          >
            🗑️ مسح جميع المنشورات القديمة
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CompetitorAnalyticsPage;