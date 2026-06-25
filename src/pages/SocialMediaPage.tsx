import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, MessageCircle, Send, BarChart3, Users, Heart, MessageSquare, Share2, Eye, TrendingUp, Calendar, Image, Video, Globe, ThumbsUp, Clock, CheckCircle, X, Plus, Trash2, Edit, Save } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'snapchat';
  name: string;
  username: string;
  connected: boolean;
  followers: number;
  engagement: number;
  lastPost: string;
}

interface ScheduledPost {
  id: string;
  platforms: string[];
  content: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'none';
  scheduledFor: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
}

const SocialMediaPage: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'posts' | 'analytics'>('dashboard');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', platforms: [] as string[], scheduleDate: '', mediaType: 'none' as 'image' | 'video' | 'none' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedAccounts = localStorage.getItem('social_accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      const defaults: SocialAccount[] = [
        { id: 'fb1', platform: 'facebook', name: 'فيسبوك', username: 'AlhamrouniJewelry', connected: false, followers: 0, engagement: 0, lastPost: '' },
        { id: 'ig1', platform: 'instagram', name: 'انستغرام', username: 'alhamrouni_jewelry', connected: false, followers: 0, engagement: 0, lastPost: '' },
        { id: 'tt1', platform: 'tiktok', name: 'تيك توك', username: '@alhamrouni', connected: false, followers: 0, engagement: 0, lastPost: '' },
        { id: 'sc1', platform: 'snapchat', name: 'سناب شات', username: 'alhamrouni_j', connected: false, followers: 0, engagement: 0, lastPost: '' },
      ];
      setAccounts(defaults);
      localStorage.setItem('social_accounts', JSON.stringify(defaults));
    }

    const savedPosts = localStorage.getItem('social_posts');
    if (savedPosts) setPosts(JSON.parse(savedPosts));
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: <Facebook className="w-6 h-6 text-blue-500" />,
      instagram: <Instagram className="w-6 h-6 text-pink-500" />,
      tiktok: <MessageCircle className="w-6 h-6 text-white" />,
      snapchat: <Globe className="w-6 h-6 text-yellow-400" />,
    };
    return icons[platform] || null;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-600 hover:bg-blue-500',
      instagram: 'bg-gradient-to-r from-purple-600 to-pink-500',
      tiktok: 'bg-gray-900 hover:bg-gray-800 border border-gray-600',
      snapchat: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    };
    return colors[platform] || 'bg-gray-700';
  };

  const toggleAccount = (id: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, connected: !acc.connected } : acc
    ));
    localStorage.setItem('social_accounts', JSON.stringify(accounts.map(acc =>
      acc.id === id ? { ...acc, connected: !acc.connected } : acc
    )));
  };

  const handleSchedulePost = () => {
    if (!newPost.content.trim() || newPost.platforms.length === 0) return;

    const post: ScheduledPost = {
      id: `post_${Date.now()}`,
      platforms: newPost.platforms,
      content: newPost.content,
      mediaUrl: '',
      mediaType: newPost.mediaType,
      scheduledFor: newPost.scheduleDate || new Date().toISOString(),
      status: newPost.scheduleDate ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
    };

    const updated = [post, ...posts];
    setPosts(updated);
    localStorage.setItem('social_posts', JSON.stringify(updated));
    setShowScheduleModal(false);
    setNewPost({ content: '', platforms: [], scheduleDate: '', mediaType: 'none' });
  };

  const deletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('social_posts', JSON.stringify(updated));
  };

  const totalFollowers = accounts.reduce((sum, a) => sum + (a.connected ? a.followers : 0), 0);
  const totalEngagement = accounts.reduce((sum, a) => sum + (a.connected ? a.engagement : 0), 0);
  const connectedCount = accounts.filter(a => a.connected).length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Share2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">إدارة وسائل التواصل</h1>
          <p className="text-gray-400">تواصل مع جمهورك عبر جميع المنصات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Globe className="w-4 h-4" /><span className="text-sm">متصل</span></div>
          <p className="text-2xl font-bold text-green-400">{connectedCount}/{accounts.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Users className="w-4 h-4" /><span className="text-sm">المتابعون</span></div>
          <p className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Heart className="w-4 h-4" /><span className="text-sm">التفاعل</span></div>
          <p className="text-2xl font-bold text-pink-400">{totalEngagement}%</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Calendar className="w-4 h-4" /><span className="text-sm">مجدولة</span></div>
          <p className="text-2xl font-bold text-yellow-400">{scheduledCount}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-sm">منشورة</span></div>
          <p className="text-2xl font-bold text-blue-400">{publishedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><BarChart3 className="w-5 h-5" />لوحة البيانات</button>
        <button onClick={() => setActiveTab('accounts')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Globe className="w-5 h-5" />الحسابات</button>
        <button onClick={() => setActiveTab('posts')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'posts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Send className="w-5 h-5" />المنشورات</button>
        <button onClick={() => setActiveTab('analytics')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><TrendingUp className="w-5 h-5" />التحليلات</button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accounts Overview */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">حالة الحسابات</h3>
            <div className="space-y-4">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(account.platform)}
                    <div>
                      <p className="text-white font-bold">{account.name}</p>
                      <p className="text-gray-400 text-sm">{account.username}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${account.connected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                    {account.connected ? 'متصل' : 'غير متصل'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowScheduleModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-xl flex flex-col items-center gap-2 hover:from-blue-700 hover:to-blue-600 transition-all">
                <Send className="w-8 h-8" />
                <span className="font-bold">إنشاء منشور</span>
              </button>
              <button onClick={() => setActiveTab('accounts')} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 rounded-xl flex flex-col items-center gap-2 hover:from-purple-700 hover:to-purple-600 transition-all">
                <Globe className="w-8 h-8" />
                <span className="font-bold">إدارة الحسابات</span>
              </button>
              <button onClick={() => setActiveTab('analytics')} className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-xl flex flex-col items-center gap-2 hover:from-green-700 hover:to-green-600 transition-all">
                <TrendingUp className="w-8 h-8" />
                <span className="font-bold">عرض التحليلات</span>
              </button>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="lg:col-span-2 bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">آخر المنشورات</h3>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد منشورات بعد</p>
                <button onClick={() => setShowScheduleModal(true)} className="mt-4 text-blue-400 hover:text-blue-300 font-bold">إنشاء أول منشور</button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {posts.slice(0, 10).map(post => (
                  <div key={post.id} className="bg-gray-700/50 rounded-xl p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.platforms.map(p => (
                          <span key={p} className={`px-2 py-0.5 rounded text-xs ${p === 'facebook' ? 'bg-blue-600/20 text-blue-400' : p === 'instagram' ? 'bg-pink-600/20 text-pink-400' : 'bg-gray-600/20 text-gray-400'}`}>{p}</span>
                        ))}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${post.status === 'published' ? 'bg-green-600/20 text-green-400' : post.status === 'scheduled' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>{post.status === 'published' ? 'منشور' : post.status === 'scheduled' ? 'مجدول' : 'مسودة'}</span>
                      </div>
                      <p className="text-white line-clamp-2">{post.content}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(post.createdAt).toLocaleString('ar-LY')}</p>
                    </div>
                    <button onClick={() => deletePost(post.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map(account => (
            <div key={account.id} className={`bg-gray-800 rounded-2xl border ${account.connected ? 'border-green-600/30' : 'border-gray-700'} overflow-hidden transition-all`}>
              <div className={`p-6 ${getPlatformColor(account.platform)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(account.platform)}
                    <div>
                      <h3 className="text-xl font-bold text-white">{account.name}</h3>
                      <p className="text-white/80 text-sm">@{account.username}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleAccount(account.id)} className={`px-4 py-2 rounded-lg font-bold text-sm ${account.connected ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                    {account.connected ? 'متصل' : 'توصيل'}
                  </button>
                </div>
              </div>
              {account.connected && (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-gray-400 text-sm">المتابعون</p><p className="text-2xl font-bold text-white">{account.followers.toLocaleString()}</p></div>
                    <div><p className="text-gray-400 text-sm">التفاعل</p><p className="text-2xl font-bold text-pink-400">{account.engagement}%</p></div>
                    <div><p className="text-gray-400 text-sm">آخر منشور</p><p className="text-sm text-white mt-2">{account.lastPost || 'لا يوجد'}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"><Edit className="w-4 h-4" />تعديل</button>
                    <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"><BarChart3 className="w-4 h-4" />تحليلات</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">المنشورات</h3>
            <button onClick={() => setShowScheduleModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
              <Plus className="w-5 h-5" /> منشور جديد
            </button>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-2xl border border-gray-700">
              <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl mb-2">لا توجد منشورات</p>
              <p className="text-gray-400 mb-6">انشئ أول منشور للتواصل مع جمهورك</p>
              <button onClick={() => setShowScheduleModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl">إنشاء منشور</button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <Send className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {post.platforms.map(p => (
                            <span key={p} className={`px-2 py-0.5 rounded text-xs ${p === 'facebook' ? 'bg-blue-600/20 text-blue-400' : p === 'instagram' ? 'bg-pink-600/20 text-pink-400' : 'bg-gray-600/20 text-gray-400'}`}>{p}</span>
                          ))}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{new Date(post.createdAt).toLocaleString('ar-LY')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${post.status === 'published' ? 'bg-green-600/20 text-green-400' : post.status === 'scheduled' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {post.status === 'published' ? 'منشور' : post.status === 'scheduled' ? 'مجدول' : 'مسودة'}
                      </span>
                      <button onClick={() => deletePost(post.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-600/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{post.content}</p>
                  {post.scheduledFor && post.status === 'scheduled' && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>مجدول للنشر في: {new Date(post.scheduledFor).toLocaleString('ar-LY')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-400" />التفاعل الإجمالي</h3>
              <p className="text-4xl font-bold text-pink-400">{totalEngagement}%</p>
              <p className="text-gray-400 text-sm mt-2">معدل التفاعل عبر جميع المنصات</p>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />إجمالي المتابعين</h3>
              <p className="text-4xl font-bold text-blue-400">{totalFollowers.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">إجمالي المتابعين عبر جميع المنصات</p>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-green-400" />إجمالي المنشورات</h3>
              <p className="text-4xl font-bold text-green-400">{posts.length}</p>
              <p className="text-gray-400 text-sm mt-2">إجمالي المنشورات المنشورة والمجدولة</p>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">تفصيل المنصات</h3>
            <div className="space-y-4">
              {accounts.map(account => (
                <div key={account.id} className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(account.platform)}
                      <span className="font-bold text-white">{account.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${account.connected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {account.connected ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                  {account.connected && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">المتابعون</p>
                        <p className="text-2xl font-bold text-white">{account.followers.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">معدل التفاعل</p>
                        <p className="text-2xl font-bold text-pink-400">{account.engagement}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">الوصول المقدر</p>
                        <p className="text-2xl font-bold text-blue-400">{(account.followers * account.engagement / 100).toFixed(0)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-blue-400" />منشور جديد</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-gray-400 text-sm mb-3">النشر إلى</label>
                <div className="flex flex-wrap gap-3">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setNewPost(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(acc.platform)
                          ? prev.platforms.filter(p => p !== acc.platform)
                          : [...prev.platforms, acc.platform]
                      }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        newPost.platforms.includes(acc.platform)
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {getPlatformIcon(acc.platform)}
                      <span className="font-medium">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">محتوى المنشور</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="اكتب محتوى المنشور..."
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Media Type */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">نوع المرفق</label>
                <div className="flex gap-3">
                  {(['none', 'image', 'video'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewPost(prev => ({ ...prev, mediaType: type }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        newPost.mediaType === type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {type === 'none' ? <X className="w-4 h-4" /> : type === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      {type === 'none' ? 'بدون' : type === 'image' ? 'صورة' : 'فيديو'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">جدولة النشر (اختياري)</label>
                <input
                  type="datetime-local"
                  value={newPost.scheduleDate}
                  onChange={(e) => setNewPost(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">اتركه فارغاً للحفظ كمسودة</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={handleSchedulePost} disabled={!newPost.content.trim() || newPost.platforms.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send className="w-5 h-5" />
                  {newPost.scheduleDate ? 'جدولة النشر' : 'حفظ كمسودة'}
                </button>
                <button onClick={() => setShowScheduleModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaPage;
