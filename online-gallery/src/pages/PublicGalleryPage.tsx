import React, { useEffect, useState } from 'react';
import { Search, Grid, List, X, Gem, Eye, Phone, Video, ChevronLeft, ChevronRight, Heart, Share2, Star, MessageCircle } from 'lucide-react';

interface JewelryItem {
  id: string;
  item_code: string;
  model_name: string;
  karat: string;
  weight: number;
  category: string;
  stock_qty: number;
  image_url: string;
  show_in_gallery: boolean;
  created_at?: string;
}

interface GalleryImage {
  id: string;
  item_code: string;
  url: string;
  type: 'image' | 'video';
  is_primary: boolean;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const PublicGalleryPage: React.FC = () => {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKarat, setSelectedKarat] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [itemImages, setItemImages] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchItems();
    loadFavorites();
    trackVisitor();
  }, []);

  const fetchItems = () => {
    try {
      setLoading(true);
      const storedItems = localStorage.getItem('gallery_items');
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        setItems(parsed.filter((item: JewelryItem) => item.show_in_gallery && item.stock_qty > 0));
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const loadFavorites = () => {
    const favs = localStorage.getItem('gallery_favorites');
    if (favs) setFavorites(JSON.parse(favs));
  };

  const trackVisitor = () => {
    const visits = parseInt(localStorage.getItem('gallery_visits') || '0');
    localStorage.setItem('gallery_visits', String(visits + 1));
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category || 'أخرى')))];
  const karats = ['all', '24', '21', '18', '14'];

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKarat = selectedKarat === 'all' || item.karat === selectedKarat;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesKarat && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'popular') return ((b as any).view_count || 0) - ((a as any).view_count || 0);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const getKaratLabel = (karat: string) => {
    const labels: Record<string, string> = { '24': 'عيار 24', '21': 'عيار 21', '18': 'عيار 18', '14': 'عيار 14' };
    return labels[karat] || karat;
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'R': 'خاتم', 'BR': 'سوار', 'NL': 'قلادة', 'ER': 'حلق',
      'خاتم': 'خاتم', 'سوار': 'سوار', 'قلادة': 'قلادة', 'حلق': 'حلق',
      'سلسلة': 'سلسلة', 'عثرة': 'عثرة', 'أخرى': 'أخرى',
    };
    return labels[cat] || cat;
  };

  const getItemImage = (item: JewelryItem): string => {
    const galleryImages = JSON.parse(localStorage.getItem('gallery_images') || '[]') as GalleryImage[];
    const primary = galleryImages.filter(img => img.item_code === item.item_code && img.is_primary);
    if (primary.length > 0) return primary[0].url;
    return item.image_url || '';
  };

  const toggleFavorite = (itemCode: string) => {
    const newFavs = favorites.includes(itemCode) ? favorites.filter(f => f !== itemCode) : [...favorites, itemCode];
    setFavorites(newFavs);
    localStorage.setItem('gallery_favorites', JSON.stringify(newFavs));
  };

  const handleOpenItem = (item: JewelryItem) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    const images: { url: string; type: 'image' | 'video' }[] = [];
    const mainImg = getItemImage(item);
    if (mainImg) images.push({ url: mainImg, type: 'image' });
    const galleryImages = JSON.parse(localStorage.getItem('gallery_images') || '[]') as GalleryImage[];
    galleryImages.filter(img => img.item_code === item.item_code && !img.is_primary).forEach(img => {
      images.push({ url: img.url, type: img.type });
    });
    if (images.length === 0) images.push({ url: '', type: 'image' });
    setItemImages(images);
  };

  const shareItem = (item: JewelryItem) => {
    if (navigator.share) {
      navigator.share({ title: `${item.model_name} - مجوهرات الحمروني`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط!');
    }
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.phone) { alert('يرجى ملء الاسم ورقم الهاتف'); return; }
    const phone = '218912133218';
    const message = encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${selectedItem?.model_name} (${selectedItem?.item_code})`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    setShowContactModal(false);
    setContactForm({ name: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-6 shadow-2xl">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                <Gem className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">معرض مجوهرات الحمروني</h1>
                <p className="text-gray-800">استعرض أحدث المجوهرات الفاخرة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2">
              <Eye className="w-5 h-5 text-gray-900" />
              <span className="text-gray-900 font-bold">{localStorage.getItem('gallery_visits') || 0} زائر</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <a href="tel:+218912133218" className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-gray-900 hover:bg-white/30 transition-all">
              <Phone className="w-5 h-5" /><span className="font-medium">اتصل بنا</span>
            </a>
            <a href="https://wa.me/218912133218" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl text-white transition-all">
              <WhatsAppIcon className="w-5 h-5" /><span className="font-medium">واتساب</span>
            </a>
            <a href="/contact" className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-gray-900 hover:bg-white/30 transition-all">
              <MessageCircle className="w-5 h-5" /><span className="font-medium">أرسل رسالة</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/80 backdrop-blur p-4 sticky top-0 z-30 border-b border-gray-700">
        <div className="container mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث بالكود أو الاسم..."
              className="w-full bg-gray-700/80 border border-gray-600 rounded-xl px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={selectedKarat} onChange={(e) => setSelectedKarat(e.target.value)} className="bg-gray-700/80 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="all">كل العيارات</option>
              {karats.filter(k => k !== 'all').map(k => <option key={k} value={k}>{getKaratLabel(k)}</option>)}
            </select>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-700/80 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="all">كل الأصناف</option>
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-gray-700/80 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر مشاهدة</option>
            </select>
            <div className="flex gap-1 mr-auto">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-yellow-600 text-white' : 'bg-gray-700/80 text-gray-400'}`}><Grid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-yellow-600 text-white' : 'bg-gray-700/80 text-gray-400'}`}><List className="w-5 h-5" /></button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">{filteredItems.length} قطعة من أصل {items.length}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"></div></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Gem className="w-24 h-24 mx-auto mb-4 opacity-30" />
            <p className="text-2xl">لا توجد قطع متوفرة</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-gray-800/80 backdrop-blur rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all group shadow-xl">
                <div className="relative aspect-square bg-gray-700 cursor-pointer overflow-hidden" onClick={() => handleOpenItem(item)}>
                  {getItemImage(item) ? (
                    <img src={getItemImage(item)} alt={item.model_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-600/20 to-yellow-800/20"><Gem className="w-20 h-20 text-yellow-600/50" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <span className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> عرض التفاصيل</span>
                  </div>
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.item_code); }} className={`p-2 rounded-full transition-all ${favorites.includes(item.item_code) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white'}`}>
                      <Heart className={`w-5 h-5 ${favorites.includes(item.item_code) ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); shareItem(item); }} className="p-2 rounded-full bg-white/80 text-gray-700 hover:bg-blue-500 hover:text-white transition-all"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-yellow-400 line-clamp-1">{item.model_name}</h3>
                      <p className="text-gray-500 text-sm font-mono">{item.item_code}</p>
                    </div>
                    <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-sm whitespace-nowrap mr-2">{getKaratLabel(item.karat)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <p className="text-gray-400 text-xs">الوزن</p>
                      <p className="font-bold text-white">{item.weight} غ</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <p className="text-gray-400 text-xs">الصنف</p>
                      <p className="font-bold text-white text-xs">{getCategoryLabel(item.category)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleOpenItem(item)} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <Phone className="w-4 h-4" /> اطلب الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-gray-800/80 backdrop-blur rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all flex cursor-pointer" onClick={() => handleOpenItem(item)}>
                <div className="w-40 h-40 bg-gray-700 flex-shrink-0 relative">
                  {getItemImage(item) ? <img src={getItemImage(item)} alt={item.model_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-600/20 to-yellow-800/20"><Gem className="w-12 h-12 text-yellow-600/50" /></div>}
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="font-bold text-lg text-yellow-400">{item.model_name}</h3>
                      <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-sm">{getKaratLabel(item.karat)}</span>
                    </div>
                    <p className="text-gray-500 text-sm font-mono mb-2">{item.item_code}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>الوزن: <span className="text-white font-medium">{item.weight}غ</span></span>
                      <span>الصنف: <span className="text-white font-medium">{getCategoryLabel(item.category)}</span></span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleOpenItem(item); }} className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl flex items-center gap-2 mr-4 transition-all">
                    <Phone className="w-5 h-5" /> اطلب الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gray-900 aspect-square md:aspect-video">
              {itemImages[currentImageIndex]?.url ? (
                itemImages[currentImageIndex]?.type === 'video' ? (
                  <video src={itemImages[currentImageIndex].url} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={itemImages[currentImageIndex].url} alt={selectedItem.model_name} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-600/20 to-yellow-800/20"><Gem className="w-32 h-32 text-yellow-600/50" /></div>
              )}
              {itemImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex(prev => (prev === 0 ? itemImages.length - 1 : prev - 1))} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"><ChevronRight className="w-6 h-6" /></button>
                  <button onClick={() => setCurrentImageIndex(prev => (prev === itemImages.length - 1 ? 0 : prev + 1))} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                </>
              )}
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"><X className="w-6 h-6" /></button>
              <div className="absolute top-4 left-4 flex gap-2">
                <button onClick={() => toggleFavorite(selectedItem.item_code)} className={`p-2 rounded-full transition-all ${favorites.includes(selectedItem.item_code) ? 'bg-red-500 text-white' : 'bg-black/50 text-white'}`}>
                  <Heart className={`w-6 h-6 ${favorites.includes(selectedItem.item_code) ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => shareItem(selectedItem)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"><Share2 className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400">{selectedItem.model_name}</h2>
                  <p className="text-gray-400 font-mono">{selectedItem.item_code}</p>
                </div>
                <span className="bg-yellow-600 text-white px-4 py-2 rounded-full font-bold">{getKaratLabel(selectedItem.karat)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">الوزن</p>
                  <p className="text-2xl font-bold text-white">{selectedItem.weight} غ</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">الصنف</p>
                  <p className="text-2xl font-bold text-white">{getCategoryLabel(selectedItem.category)}</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">المخزون</p>
                  <p className="text-2xl font-bold text-white">{selectedItem.stock_qty}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowContactModal(true)} className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <Phone className="w-5 h-5" /> تواصل معنا
                </button>
                <a href={`https://wa.me/218912133218?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${selectedItem.model_name} (${selectedItem.item_code})`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <WhatsAppIcon className="w-5 h-5" /> واتساب
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-yellow-400">طلب قطعة</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <p className="text-white font-bold">{selectedItem.model_name}</p>
              <p className="text-gray-400 text-sm">{selectedItem.item_code}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">الاسم الكامل *</label>
                <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="أدخل اسمك" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">رقم الهاتف *</label>
                <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="09XXXXXXXX" />
              </div>
              <button onClick={handleContactSubmit} className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <WhatsAppIcon className="w-5 h-5" /> إرسال عبر واتساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gem className="w-8 h-8 text-yellow-500" />
            <span className="text-xl font-bold text-yellow-500">مجوهرات الحمروني</span>
          </div>
          <p className="text-gray-500 mb-4">أفضل أنواع الذهب والمجوهرات الفاخرة</p>
          <div className="flex justify-center gap-6 mb-6">
            <a href="tel:+218912133218" className="text-gray-400 hover:text-yellow-500 flex items-center gap-2"><Phone className="w-5 h-5" /><span>+218912133218</span></a>
            <a href="https://wa.me/218912133218" className="text-gray-400 hover:text-green-500 flex items-center gap-2"><WhatsAppIcon className="w-5 h-5" /><span>واتساب</span></a>
            <a href="/contact" className="text-gray-400 hover:text-yellow-500 flex items-center gap-2"><MessageCircle className="w-5 h-5" /><span>أرسل رسالة</span></a>
          </div>
          <p className="text-gray-600 text-sm">جميع الحقوق محفوظة © {new Date().getFullYear()} مجوهرات الحمروني</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicGalleryPage;
