import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, Upload, PieChart, Share2, ExternalLink, Eye, Gem, BarChart3, MessageCircle } from 'lucide-react';
import { authApi } from '../services/supabase';

const GalleryPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalItems: 0, inGallery: 0, totalImages: 0 });

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());
    loadStats();
  }, []);

  const loadStats = () => {
    const items = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
    const images = JSON.parse(localStorage.getItem('gallery_images') || '[]');
    setStats({
      totalItems: items.length,
      inGallery: items.filter((i: any) => i.show_in_gallery).length,
      totalImages: images.length,
    });
  };

  const publicLinks = [
    {
      path: '/shop',
      icon: Gem,
      title: 'المعرض العام',
      desc: 'عرض المجوهرات للعملاء بدون أسعار',
      color: 'from-yellow-600 to-yellow-700',
      external: true,
    },
    {
      path: '/contact',
      icon: MessageCircle,
      title: 'التواصل معنا',
      desc: 'نموذج التواصل وواتساب',
      color: 'from-green-600 to-green-700',
      external: true,
    },
  ];

  const adminLinks = [
    {
      path: '/gallery-manage',
      icon: Upload,
      title: 'إدارة المعرض',
      desc: 'إضافة وتعديل صور وفيديو للقطع',
      color: 'from-purple-600 to-purple-700',
    },
    {
      path: '/gallery-stats',
      icon: PieChart,
      title: 'إحصائيات المعرض',
      desc: 'مراقبة زيارات وتفاعل الجمهور',
      color: 'from-blue-600 to-blue-700',
    },
    {
      path: '/social-media',
      icon: Share2,
      title: 'التواصل الاجتماعي',
      desc: 'إدارة الحسابات والمنشورات',
      color: 'from-green-600 to-green-700',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl flex items-center justify-center shadow-xl">
          <Image className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">المعرض</h1>
          <p className="text-gray-400">إدارة وعرض المجوهرات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <Gem className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
          <p className="text-gray-400 text-sm">إجمالي القطع</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <Eye className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.inGallery}</p>
          <p className="text-gray-400 text-sm">في المعرض</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <Image className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalImages}</p>
          <p className="text-gray-400 text-sm">الصور</p>
        </div>
      </div>

      {/* Public Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-yellow-400" />
          صفحات عامة (للجمهور)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.path}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-gradient-to-br ${link.color} rounded-2xl p-6 text-white hover:scale-[1.02] transition-all shadow-xl block`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{link.title}</h3>
                    <p className="text-white/80 text-sm">{link.desc}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Admin Section */}
      {currentUser?.role === 'admin' && (
        <div>
          <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            إدارة المعرض (للمدير فقط)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`bg-gradient-to-br ${link.color} rounded-2xl p-6 text-white hover:scale-[1.02] transition-all shadow-xl`}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{link.title}</h3>
                  <p className="text-white/80 text-sm">{link.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
