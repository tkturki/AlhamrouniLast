import React, { useState } from 'react';
import { Facebook, Instagram, MessageCircle, Send, ExternalLink, Copy, CheckCircle, X, Image, Globe, Hash, FileText, Eye } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  url: string;
  postUrl: string;
  maxChars: number;
  templates: string[];
}

const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'فيسبوك',
    icon: <Facebook className="w-6 h-6 text-blue-400" />,
    color: 'bg-blue-600 hover:bg-blue-500',
    url: 'https://www.facebook.com',
    postUrl: 'https://www.facebook.com/sharer/sharer.php?u=',
    maxChars: 63206,
    templates: [
      'جديد في مجوهرات الحمروني!\n\n✨ {item_name}\n⚖️ الوزن: {weight} غ\n💰 السعر: {price} د.ل\n\nللاستفسار والطلب: واتساب 0912133218\n\n#مجوهرات #ذهب #ليبيا',
      'عرض خاص اليوم!\n\n🔥 {item_name}\n📏 العيار: {karat}\n⚖️ الوزن: {weight} غ\n\nالكمية محدودة!\n\n#ذهب #مجوهرات_ليبية #حمروني',
    ],
  },
  {
    id: 'instagram',
    name: 'انستغرام',
    icon: <Instagram className="w-6 h-6 text-pink-400" />,
    color: 'bg-gradient-to-r from-purple-600 to-pink-500',
    url: 'https://www.instagram.com',
    postUrl: 'https://www.instagram.com',
    maxChars: 2200,
    templates: [
      '✨ {item_name} ✨\n\n⚖️ الوزن: {weight} غ\n💰 السعر: {price} د.ل\n\n#مجوهرات #ذهب #ليبيا #حمروني #تصميم_فريد',
      '🔥 قطعة جديدة في معرضنا!\n\n{item_name}\n📏 العيار: {karat}\n⚖️ الوزن: {weight} غ\n\nللطلب: الرابط في البايو\n\n#ذهب_أصفر #مجوهرات #تاج #خاتم',
    ],
  },
  {
    id: 'tiktok',
    name: 'تيك توك',
    icon: <MessageCircle className="w-6 h-6 text-white" />,
    color: 'bg-gray-900 hover:bg-gray-800 border border-gray-600',
    url: 'https://www.tiktok.com',
    postUrl: 'https://www.tiktok.com',
    maxChars: 4000,
    templates: [
      'شوف هالقطعة! 🔥\n\n{item_name}\n{weight} غ ذهب {karat}\n\n#مجوهرات #ذهب #ليبيا #فيرا #trending',
      'جديد عندنا! ✨\n\n{item_name} - {karat} عيار\nالوزن: {weight} غ\n\n#ذهب #مجوهرات_ليبية #fyp',
    ],
  },
  {
    id: 'snapchat',
    name: 'سناب شات',
    icon: <Globe className="w-6 h-6 text-yellow-400" />,
    color: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    url: 'https://www.snapchat.com',
    postUrl: 'https://www.snapchat.com',
    maxChars: 300,
    templates: [
      '✨ {item_name}\n⚖️ {weight} غ | 💰 {price} د.ل\n📞 واتساب: 0912133218',
    ],
  },
];

const SocialMediaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'publish' | 'templates' | 'links'>('publish');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('facebook');
  const [postText, setPostText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentPlatform = platforms.find(p => p.id === selectedPlatform) || platforms[0];
  const charCount = postText.length;
  const isOverLimit = charCount > currentPlatform.maxChars;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = postText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPlatform = () => {
    window.open(currentPlatform.url, '_blank');
  };

  const handleOpenWithImage = () => {
    window.open(currentPlatform.postUrl, '_blank');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleUseTemplate = (template: string) => {
    setPostText(template);
    setActiveTab('publish');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle className="w-5 h-5" />
          تم فتح المنصة!
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Send className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">مساعد النشر</h1>
          <p className="text-gray-400">جهز منشورك وانشره مباشرة على المنصات</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl overflow-x-auto">
        <button onClick={() => setActiveTab('publish')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'publish' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <Send className="w-5 h-5" />إنشاء منشور
        </button>
        <button onClick={() => setActiveTab('templates')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'templates' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <FileText className="w-5 h-5" />قوالب جاهزة
        </button>
        <button onClick={() => setActiveTab('links')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'links' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <ExternalLink className="w-5 h-5" />روابط المنصات
        </button>
      </div>

      {activeTab === 'publish' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">اختر المنصة</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedPlatform === platform.id
                      ? 'border-yellow-500 bg-yellow-600/20'
                      : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  {platform.icon}
                  <span className="font-bold text-white text-sm">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">اكتب المنشور</h3>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className={`text-sm font-medium ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
                  {charCount}/{currentPlatform.maxChars}
                </span>
              </div>
            </div>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={`اكتب منشورك هنا... (${currentPlatform.name})`}
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
            <p className="text-gray-500 text-xs mt-2">
              استخدم: {'{item_name}'} {'{weight}'} {'{karat}'} {'{price}'} لملء البيانات تلقائياً
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleCopyText}
              disabled={!postText.trim()}
              className={`p-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
              } disabled:opacity-50`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'تم النسخ!' : 'نسخ النص'}
            </button>
            <button
              onClick={handleOpenWithImage}
              className={`p-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all ${currentPlatform.color}`}
            >
              <Image className="w-5 h-5" />
              فتح مع صورة
            </button>
            <button
              onClick={handleOpenPlatform}
              className="p-4 rounded-xl bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center gap-2 font-bold transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              فتح المنصة
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          {platforms.map(platform => (
            <div key={platform.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                {platform.icon}
                <h3 className="font-bold text-white">{platform.name}</h3>
                <span className="text-gray-500 text-sm mr-auto">{platform.maxChars} حرف كحد أقصى</span>
              </div>
              <div className="p-4 space-y-3">
                {platform.templates.map((template, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">{template}</p>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />استخدام هذا القالب
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(platform => (
            <div key={platform.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                {platform.icon}
                <div>
                  <h3 className="font-bold text-white text-lg">{platform.name}</h3>
                  <p className="text-gray-400 text-sm">{platform.url}</p>
                </div>
              </div>
              <div className="space-y-3">
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full p-3 rounded-xl bg-gray-700/50 text-white hover:bg-gray-700 transition-all text-center font-medium"
                >
                  <Eye className="w-4 h-4 inline ml-2" />
                  عرض الصفحة
                </a>
                <button
                  onClick={() => window.open(platform.postUrl, '_blank')}
                  className={`block w-full p-3 rounded-xl text-white transition-all text-center font-medium ${platform.color}`}
                >
                  <Send className="w-4 h-4 inline ml-2" />
                  فتح لكتابة منشور
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialMediaPage;
