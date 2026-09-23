import React, { useState, useEffect } from 'react';
import { FolderOpen, Image, X, Search, RefreshCw, Settings, Check } from 'lucide-react';

interface GalleryImage {
  filename: string;
  url: string;
  size: number;
  created: string;
}

interface ImageBrowserProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

const ImageBrowser: React.FC<ImageBrowserProps> = ({ onSelect, onClose }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [tempPath, setTempPath] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFolderPath();
  }, []);

  const loadFolderPath = async () => {
    try {
      const response = await fetch('/api/images/folder-path');
      const result = await response.json();
      if (result.success) {
        setFolderPath(result.data.path || '');
        setTempPath(result.data.path || '');
        if (result.data.path) {
          loadImages();
        } else {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Error loading folder path:', e);
      setLoading(false);
    }
  };

  const loadImages = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/images/gallery');
      const result = await response.json();
      if (result.success) {
        setImages(result.data);
        if (result.message) setMessage(result.message);
      }
    } catch (e) {
      console.error('Error loading images:', e);
      setMessage('خطأ في تحميل الصور');
    }
    setLoading(false);
  };

  const saveFolderPath = async () => {
    try {
      const response = await fetch('/api/images/folder-path', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: tempPath }),
      });
      const result = await response.json();
      if (result.success) {
        setFolderPath(tempPath);
        setEditMode(false);
        loadImages();
      }
    } catch (e) {
      console.error('Error saving folder path:', e);
    }
  };

  const handleDoubleClick = async (img: GalleryImage) => {
    // Copy to temp and get URL
    try {
      const response = await fetch('/api/images/copy-to-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: img.filename }),
      });
      const result = await response.json();
      if (result.success) {
        onSelect(result.data.url);
        onClose();
      } else {
        alert('خطأ في نقل الصورة: ' + (result.error || ''));
      }
    } catch (e) {
      alert('خطأ في الاتصال بالسيرفر');
    }
  };

  const filteredImages = images.filter(img =>
    img.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-yellow-400" />
            متصفح الصور
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Folder Path Settings */}
        <div className="p-4 border-b border-gray-700 bg-gray-700/30">
          {editMode ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={tempPath}
                onChange={(e) => setTempPath(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                placeholder="مثال: D:\صور المجوهرات"
                dir="ltr"
              />
              <button onClick={saveFolderPath} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                حفظ
              </button>
              <button onClick={() => { setTempPath(folderPath); setEditMode(false); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">
                إلغاء
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-400">مجلد الصور: </span>
                <span className="text-white font-mono" dir="ltr">{folderPath || 'غير محدد'}</span>
                {folderPath && <span className="text-gray-400 mr-3">({images.length} صورة)</span>}
              </div>
              <div className="flex gap-2">
                {folderPath && (
                  <button onClick={loadImages} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                  </button>
                )}
                <button onClick={() => setEditMode(true)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  {folderPath ? 'تغيير' : 'تحديد مجلد'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        {folderPath && (
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث في الصور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white pr-10 pl-4 py-2 rounded-lg"
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">اضغط مرتين على الصورة لتضاف مباشرة إلى شاشة التكويد</p>
          </div>
        )}

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!folderPath ? (
            <div className="flex flex-col items-center justify-center h-60 text-gray-400">
              <FolderOpen className="w-20 h-20 mb-4 opacity-30" />
              <p className="text-lg mb-2">لم يتم تحديد مجلد الصور</p>
              <p className="text-sm mb-4">حدد مسار مجلد الصور على الهارد ديسك لعرضها هنا</p>
              <button onClick={() => setEditMode(true)} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
                تحديد المجلد
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Image className="w-16 h-16 mb-4 opacity-30" />
              <p>{searchQuery ? 'لا توجد صور مطابقة' : message || 'لا توجد صور في هذا المجلد'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredImages.map((img) => (
                <div
                  key={img.filename}
                  className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                    selectedImage === img.url
                      ? 'border-yellow-500 ring-2 ring-yellow-500/30'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedImage(img.url)}
                  onDoubleClick={() => handleDoubleClick(img)}
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="text-white text-xs truncate" dir="ltr">{img.filename}</p>
                    <p className="text-gray-400 text-xs">{formatSize(img.size)}</p>
                  </div>
                  {selectedImage === img.url && (
                    <div className="absolute top-1 right-1">
                      <div className="p-1 bg-yellow-500 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <span className="text-gray-400 text-sm">{filteredImages.length} صورة</span>
          <button
            onClick={() => { if (selectedImage) { handleDoubleClick({ url: selectedImage, filename: '', size: 0, created: '' }); }}}
            disabled={!selectedImage}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50"
          >
            اختيار الصورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageBrowser;
