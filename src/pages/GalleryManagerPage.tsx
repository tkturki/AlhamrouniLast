import React, { useState, useEffect, useRef } from 'react';
import {
  Image, Video, Upload, Trash2, Edit, Check, X, Plus,
  Search, Filter, Grid, List, Eye, EyeOff, Gem,
  Star, ArrowUp, ArrowDown, Save, FolderOpen, Camera,
  FileImage, FileVideo, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { supabase, JewelryItem, isSupabaseAvailable } from '../services/supabase';

interface GalleryImage {
  id: string;
  item_code: string;
  url: string;
  type: 'image' | 'video';
  is_primary: boolean;
  created_at: string;
}

const GalleryManagerPage: React.FC = () => {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInGallery, setShowInGallery] = useState<boolean | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchImages, setBatchImages] = useState<{ file: File; itemCode: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      // Load from Supabase first
      if (isSupabaseAvailable() && supabase) {
        try {
          const { data, error } = await supabase
            .from('jewelry_items')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            setItems(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Supabase not available, using localStorage');
        }
      }
      // Fallback to localStorage
      const stored = localStorage.getItem('jewelry_items');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setLoading(false);
  };

  const loadGalleryImages = async (itemCode: string) => {
    try {
      // Load from localStorage
      const allImages = JSON.parse(localStorage.getItem('gallery_images') || '[]');
      const itemImages = allImages.filter((img: GalleryImage) => img.item_code === itemCode);
      setGalleryImages(itemImages);
    } catch (e) {
      setGalleryImages([]);
    }
  };

  const handleSelectItem = (item: JewelryItem) => {
    setSelectedItem(item);
    loadGalleryImages(item.item_code);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesUpload(e.target.files);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesUpload = async (files: FileList) => {
    if (!selectedItem) return;

    setUploading(true);
    const uploadedImages: GalleryImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        alert(`الملف ${file.name} ليس صورة أو فيديو`);
        continue;
      }

      try {
        const url = await fileToBase64(file);

        const newImage: GalleryImage = {
          id: `img_${Date.now()}_${i}`,
          item_code: selectedItem.item_code,
          url,
          type: isVideo ? 'video' : 'image',
          is_primary: galleryImages.length === 0 && i === 0,
          created_at: new Date().toISOString(),
        };

        uploadedImages.push(newImage);
      } catch (e) {
        console.error('Error uploading file:', e);
      }
    }

    if (uploadedImages.length > 0) {
      const allImages = JSON.parse(localStorage.getItem('gallery_images') || '[]');
      const updated = [...allImages.filter((img: GalleryImage) => img.item_code !== selectedItem.item_code), ...uploadedImages];
      localStorage.setItem('gallery_images', JSON.stringify(updated));
      setGalleryImages(prev => [...prev, ...uploadedImages]);
    }

    setUploading(false);
  };

  const handleRemoveImage = (imageId: string) => {
    // Remove from state
    const updated = galleryImages.filter(img => img.id !== imageId);
    setGalleryImages(updated);

    // Update localStorage - remove from ALL images, then add back remaining
    const allImages = JSON.parse(localStorage.getItem('gallery_images') || '[]');
    const otherItemImages = allImages.filter((img: GalleryImage) => img.item_code !== selectedItem?.item_code);
    localStorage.setItem('gallery_images', JSON.stringify([...otherItemImages, ...updated]));
  };

  const handleSetPrimary = (imageId: string) => {
    const updated = galleryImages.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    }));
    setGalleryImages(updated);

    // Update localStorage
    const allImages = JSON.parse(localStorage.getItem('gallery_images') || '[]');
    const filtered = allImages.filter((img: GalleryImage) => img.item_code !== selectedItem?.item_code);
    localStorage.setItem('gallery_images', JSON.stringify([...filtered, ...updated]));
  };

  const handleToggleGalleryVisibility = async (item: JewelryItem) => {
    const newValue = !(item as any).show_in_gallery;

    // Update Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        await supabase
          .from('jewelry_items')
          .update({ show_in_gallery: newValue })
          .eq('item_code', item.item_code);
      } catch (e) {
        console.log('Supabase update failed');
      }
    }

    // Update localStorage
    const stored = localStorage.getItem('jewelry_items');
    if (stored) {
      const itemsList = JSON.parse(stored);
      const updated = itemsList.map((i: JewelryItem) =>
        i.item_code === item.item_code ? { ...i, show_in_gallery: newValue } : i
      );
      localStorage.setItem('jewelry_items', JSON.stringify(updated));
    }

    // Update state
    setItems(prev => prev.map(i =>
      i.item_code === item.item_code ? { ...i, show_in_gallery: newValue } : i
    ));

    if (selectedItem?.item_code === item.item_code) {
      setSelectedItem(prev => prev ? { ...prev, show_in_gallery: newValue } : null);
    }
  };

  const handleBatchUpload = async () => {
    if (batchImages.length === 0) return;

    setUploading(true);
    const allImages = JSON.parse(localStorage.getItem('gallery_images') || '[]');
    const newImages: GalleryImage[] = [];

    for (const { file, itemCode } of batchImages) {
      const url = await fileToBase64(file);
      newImages.push({
        id: `img_${Date.now()}_${Math.random()}`,
        item_code: itemCode || 'unassigned',
        url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        is_primary: false,
        created_at: new Date().toISOString(),
      });
    }

    localStorage.setItem('gallery_images', JSON.stringify([...allImages, ...newImages]));
    setUploading(false);
    setBatchImages([]);
    setShowBatchModal(false);

    if (selectedItem) {
      loadGalleryImages(selectedItem.item_code);
    }
  };

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newBatch = files.map(file => ({
        file,
        itemCode: '',
      }));
      setBatchImages(newBatch);
      setShowBatchModal(true);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchQuery.toLowerCase());

    if (showInGallery === null) return matchesSearch;
    return matchesSearch && ((item as any).show_in_gallery === showInGallery);
  });

  const getItemImage = (item: JewelryItem): string => {
    const itemImages = JSON.parse(localStorage.getItem('gallery_images') || '[]')
      .filter((img: GalleryImage) => img.item_code === item.item_code && img.is_primary);

    if (itemImages.length > 0) {
      return itemImages[0].url;
    }

    return item.image_url || '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl">
            <Image className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">إدارة المعرض</h1>
            <p className="text-gray-400">إضافة صور وفيديو للقطع</p>
          </div>
        </div>
        <div className="flex gap-3">
          <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
            <FolderOpen className="w-5 h-5" />
            رفع جماعي
            <input
              ref={batchInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleBatchFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Gem className="w-4 h-4" />
            <span className="text-sm">إجمالي القطع</span>
          </div>
          <p className="text-2xl font-bold text-white">{items.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-sm">في المعرض</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {items.filter(i => (i as any).show_in_gallery).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Image className="w-4 h-4" />
            <span className="text-sm">الصور</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {JSON.parse(localStorage.getItem('gallery_images') || '[]').filter((i: any) => i.type === 'image').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Video className="w-4 h-4" />
            <span className="text-sm">الفيديو</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {JSON.parse(localStorage.getItem('gallery_images') || '[]').filter((i: any) => i.type === 'video').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-1 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {/* Search & Filter */}
          <div className="p-4 border-b border-gray-700 space-y-3">
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowInGallery(null)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  showInGallery === null ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setShowInGallery(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  showInGallery === true ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                ظاهر
              </button>
              <button
                onClick={() => setShowInGallery(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  showInGallery === false ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                مخفي
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredItems.map((item) => {
              const hasImages = (JSON.parse(localStorage.getItem('gallery_images') || '[]') as GalleryImage[])
                .some(img => img.item_code === item.item_code);

              return (
                <div
                  key={item.item_code}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-r-4 ${
                    selectedItem?.item_code === item.item_code
                      ? 'bg-yellow-600/20 border-yellow-500'
                      : 'hover:bg-gray-700/50 border-transparent'
                  }`}
                >
                  <div className="w-14 h-14 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {getItemImage(item) ? (
                      <img src={getItemImage(item)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gem className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.model_name}</p>
                    <p className="text-gray-500 text-sm">{item.item_code}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {(item as any).show_in_gallery ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    )}
                    {hasImages && (
                      <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs">
                        <Image className="w-3 h-3 inline" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gallery Editor */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600/20 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">{selectedItem.model_name}</h3>
                    <p className="text-gray-500 text-sm">{selectedItem.item_code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleGalleryVisibility(selectedItem)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        (selectedItem as any).show_in_gallery
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {(selectedItem as any).show_in_gallery ? (
                        <>
                          <Eye className="w-4 h-4" /> ظاهر في المعرض
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" /> مخفي
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

                {/* Upload Area */}
                <div className="mb-4">
                  <label className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-3 shadow-lg">
                    <Camera className="w-6 h-6" />
                    <span className="font-bold text-lg">اختر صور أو فيديو</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                      <p className="text-gray-400">جاري الرفع...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-10 h-10 mx-auto mb-2 ${dragActive ? 'text-yellow-500' : 'text-gray-500'}`} />
                      <p className="text-gray-400 text-sm">
                        {dragActive ? 'أفلت الملفات هنا' : 'أو اسحب الصور والفيديو وأفلتها هنا'}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">PNG, JPG, WEBP, MP4 (حتى 50MB)</p>
                    </>
                  )}
                </div>

              {/* Images Grid */}
              <div className="p-4">
                {galleryImages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد صور أو فيديو لهذه القطعة</p>
                    <p className="text-sm mt-1">قم برفع الصور والفيديو أعلاه</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                          image.is_primary ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-gray-700'
                        }`}
                      >
                        {image.type === 'video' ? (
                          <video
                            src={image.url}
                            className="w-full aspect-square object-cover"
                            muted
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.pause();
                              video.currentTime = 0;
                            }}
                          />
                        ) : (
                          <img
                            src={image.url}
                            alt=""
                            className="w-full aspect-square object-cover"
                          />
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!image.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(image.id)}
                              className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-lg"
                              title="تحديد كصورة رئيسية"
                            >
                              <Star className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveImage(image.id)}
                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 right-2">
                          {image.type === 'video' ? (
                            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <Video className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <Image className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Primary Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-yellow-500 text-gray-900 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              رئيسية
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 text-sm">العيار</p>
                    <p className="text-white font-bold">{selectedItem.karat}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الوزن</p>
                    <p className="text-white font-bold">{selectedItem.weight} غ</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الصنف</p>
                    <p className="text-white font-bold">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">المخزون</p>
                    <p className="text-white font-bold">{selectedItem.stock_qty}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-12 text-center">
              <Image className="w-20 h-20 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">اختر قطعة لإدارتها</h3>
              <p className="text-gray-500">اختر قطعة من القائمة على اليسار لإضافة أو تعديل صورها</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Upload Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">رفع جماعي - {batchImages.length} ملف</h3>
                  <p className="text-gray-400 text-sm">اختر قطعة لكل صورة ثم اضغط رفع</p>
                </div>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="space-y-3">
                {batchImages.map((batchItem, index) => {
                  const previewUrl = URL.createObjectURL(batchItem.file);
                  const isVideo = batchItem.file.type.startsWith('video/');
                  return (
                    <div key={index} className="flex items-center gap-4 bg-gray-700/50 p-3 rounded-xl border border-gray-600">
                      <div className="w-20 h-20 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {isVideo ? (
                          <>
                            <video src={previewUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium truncate">{batchItem.file.name}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {(batchItem.file.size / 1024 / 1024).toFixed(2)} MB - {isVideo ? 'فيديو' : 'صورة'}
                        </p>
                        <select
                          value={batchItem.itemCode}
                          onChange={(e) => {
                            const newBatch = [...batchImages];
                            newBatch[index].itemCode = e.target.value;
                            setBatchImages(newBatch);
                          }}
                          className="w-full mt-2 bg-gray-600 border border-gray-500 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">اختر قطعة...</option>
                          {items.map(item => (
                            <option key={item.item_code} value={item.item_code}>
                              {item.item_code} - {item.model_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {batchItem.itemCode && (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
              <div className="flex gap-3">
                <button
                  onClick={handleBatchUpload}
                  disabled={uploading || batchImages.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      رفع {batchImages.length} ملف
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-gray-500 text-sm text-center mt-2">
                يمكنك رفع الصور ثم تعيين القطعة لاحقاً من قائمة الصور
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagerPage;
