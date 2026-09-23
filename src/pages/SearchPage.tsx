import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Edit, Trash2, AlertTriangle, CheckCircle, X, Package, QrCode, Image, ShoppingCart } from 'lucide-react';
import { JewelryItem, formatNumber, formatCurrency, generateQRCodeUrl, cartStorage, jewelryApi, isSupabaseAvailable } from '../services/supabase';
import { imageStorage } from '../services/imageStorage';
import { getSystemSettings, GoldPricesSettings, loadSettingsFromSupabase } from '../services/settings';
import { realtimeSync } from '../services/realtimeSync';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState<JewelryItem[]>([]);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [goldPrices, setGoldPrices] = useState<GoldPricesSettings>(getSystemSettings().goldPrices);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try local server first
      try {
        const response = await fetch('/api/items');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const serverItems = result.data;
          for (const item of serverItems) {
            if (!item.image_url) {
              const img = await imageStorage.get(item.item_code);
              if (img) item.image_url = img;
            }
          }
          setItems(serverItems);
          setFilteredItems(serverItems);
          localStorage.setItem('jewelry_items', JSON.stringify(serverItems));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Server error, trying localStorage:', err);
      }

      // Fallback to localStorage
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        for (const item of parsedItems) {
          if (!item.image_url) {
            const img = await imageStorage.get(item.item_code);
            if (img) item.image_url = img;
          }
        }
        setItems(parsedItems);
        setFilteredItems(parsedItems);
      } else {
        setItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
      setFilteredItems([]);
    }
    setLoading(false);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingItem(prev => prev ? { ...prev, image_url: base64 } : null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadPrices = async () => {
      await loadSettingsFromSupabase();
      setGoldPrices(getSystemSettings().goldPrices);
    };
    loadPrices();
    loadItems();

    // Listen for realtime updates from other devices
    const unsubItems = realtimeSync.on('items_updated', () => {
      console.log('📦 Items updated from another device - refreshing...');
      loadItems();
    });
    const unsubSettings = realtimeSync.on('settings_updated', () => {
      setGoldPrices(getSystemSettings().goldPrices);
    });

    return () => {
      unsubItems();
      unsubSettings();
    };
  }, [loadItems]);

  // Arabic keyboard → English using charCode
  const arabicCharCodeToEnglish: Record<number, string> = {
    0x0636:'Q',0x0635:'W',0x062B:'E',0x0642:'R',0x0641:'T',0x063A:'Y',0x0639:'U',0x0647:'I',0x062E:'O',0x062C:'P',
    0x0634:'A',0x0633:'S',0x064A:'D',0x0628:'F',0x0644:'G',0x0627:'H',0x062A:'J',0x0646:'K',0x0645:'L',
    0x0626:'Z',0x0621:'X',0x0624:'C',0x0631:'V',0x0649:'N',0x0629:'M',
    0x0623:'A',0x0625:'I',0x0622:'A',0x0643:';',
    0x0640:'-',0x064B:'-',0x064C:'-',0x064D:'-',
    0x0660:'0',0x0661:'1',0x0662:'2',0x0663:'3',0x0664:'4',
    0x0665:'5',0x0666:'6',0x0667:'7',0x0668:'8',0x0669:'9',
    0x0610:'0',0x0611:'1',0x0612:'2',0x0613:'3',0x0614:'4',
  };

  const convertArabicToEnglish = (val: string): string => {
    let fixed = '';
    for (let i = 0; i < val.length; i++) {
      const code = val.charCodeAt(i);
      fixed += arabicCharCodeToEnglish[code] ?? val[i];
    }
    // Normalize: convert / and diacritics to -, collapse multiple dashes
    return fixed.replace(/[\/\u0640\u064B\u064C\u064D~]/g, '-').replace(/-+/g, '-');
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  queryRef.current = query;
  const [scanResult, setScanResult] = useState('');

  // Handle barcode scan — search and auto-add to cart
  const handleBarcodeSearch = useCallback((code: string) => {
    const q = code.toLowerCase();
    const found = items.find(
      (item) =>
        item.item_code?.toLowerCase() === q ||
        item.item_code?.toLowerCase().includes(q)
    );
    if (found) {
      const newCart = cartStorage.addToCart(found);
      cartStorage.saveCart(newCart.map(c => ({ ...c, total: c.quantity * c.price })));
      setScanResult(`✓ تمت إضافة: ${found.model_name} (${found.item_code})`);
      setTimeout(() => setScanResult(''), 2000);
    } else {
      setScanResult(`❌ غير موجود: ${code}`);
      setTimeout(() => setScanResult(''), 3000);
    }
  }, [items]);

  // Native input listener — converts Arabic → English on UNCONTROLLED input
  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;

    let ignoreInput = false;

    const handleInput = () => {
      if (ignoreInput) return;
      const raw = input.value;
      const converted = convertArabicToEnglish(raw);
      if (converted !== raw) {
        ignoreInput = true;
        input.value = converted;
        ignoreInput = false;
      }
      queryRef.current = input.value;
      setQuery(input.value);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = convertArabicToEnglish(input.value.trim());
        if (val) {
          handleBarcodeSearch(val);
          ignoreInput = true;
          input.value = '';
          ignoreInput = false;
          queryRef.current = '';
          setQuery('');
        }
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, [items]);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = items.filter(
      (item) =>
        item.item_code?.toLowerCase().includes(q) ||
        item.model_name?.toLowerCase().includes(q) ||
        item.gold_item?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.karat?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
    );
    setFilteredItems(filtered);
  }, [query, items]);

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      // Save to Supabase first
      if (isSupabaseAvailable()) {
        try {
          await jewelryApi.updateItem({
            ...editingItem,
            model_name: editingItem.model_name,
            karat: editingItem.karat,
            weight: editingItem.weight,
            price: editingItem.price,
            purchase_price: editingItem.purchase_price,
            sale_price: editingItem.sale_price,
            stock_qty: editingItem.stock_qty,
            category: editingItem.category,
            status: editingItem.status,
            gold_category: editingItem.gold_category,
            gold_item: editingItem.gold_item,
            metal_type: editingItem.metal_type,
          } as JewelryItem);
          console.log('Updated in Supabase:', editingItem.item_code);
        } catch (err) {
          console.log('Supabase error, updating localStorage:', err);
        }
      }

      // Also update localStorage as backup
      const storedItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
      const index = storedItems.findIndex((i: any) => i.item_code === editingItem.item_code);
      if (index !== -1) {
        storedItems[index] = {
          ...storedItems[index],
          model_name: editingItem.model_name,
          karat: editingItem.karat,
          weight: editingItem.weight,
          price: editingItem.price,
          purchase_price: editingItem.purchase_price || 0,
          sale_price: editingItem.sale_price || 0,
          stock_qty: editingItem.stock_qty,
          category: editingItem.category,
          status: editingItem.status,
          gold_category: editingItem.gold_category,
          gold_item: editingItem.gold_item,
          metal_type: editingItem.metal_type,
          image_url: editingItem.image_url || storedItems[index].image_url,
        };
        localStorage.setItem('jewelry_items', JSON.stringify(storedItems));
      }

      if (editingItem.image_url && editingItem.image_url.startsWith('data:image')) {
        await imageStorage.save(editingItem.item_code, editingItem.image_url);
      }

      setItems(JSON.parse(localStorage.getItem('jewelry_items') || '[]'));
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('حدث خطأ أثناء التعديل');
    }
  };

  const handleDelete = async (code: string) => {
    try {
      // Get existing items
      const storedItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');

      // Filter out the item to delete
      const filteredItems = storedItems.filter((i: any) => i.item_code !== code);
      localStorage.setItem('jewelry_items', JSON.stringify(filteredItems));

      // Update local state
      setItems(filteredItems);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleAddToCart = (item: JewelryItem) => {
    cartStorage.addToCart(item);
    alert(`تمت إضافة "${item.model_name}" إلى سلة المبيعات`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد':
        return 'bg-green-600';
      case 'تكسير':
        return 'bg-orange-600';
      case 'مستعمل':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'R': 'خاتم',
      'BR': 'سوار',
      'NL': 'قلادة',
      'ER': 'حلق',
      'NK': 'غريل',
      'CH': 'سلسلة',
      'BT': 'عثرة',
      'SW': 'اسوارة',
      'ST': 'طقم',
      'OT': 'أخرى',
      'خاتم': 'خاتم',
      'سوار': 'سوار',
      'قلادة': 'قلادة',
      'حلق': 'حلق',
      'سلسلة': 'سلسلة',
      'غريل': 'غريل',
      'اسوارة': 'اسوارة',
      'طقم': 'طقم',
      'عثرة': 'عثرة',
      'أخرى': 'أخرى',
    };
    return labels[cat] || cat;
  };

  const getTypeLabel = (type: string) => {
    return type === 'G' ? 'ذهب' : 'فضة';
  };

  const getPricePerGram = (karat: string, metalType: string): number => {
    const isSilver = metalType === 'فضة' || metalType === 'فضة مطلي' || metalType === 'فضة عادي';
    if (isSilver) return goldPrices.silver;
    switch (karat) {
      case '24': return goldPrices.gold24k;
      case '21': return goldPrices.gold21k;
      case '18': return goldPrices.gold18k;
      default: return goldPrices.gold21k;
    }
  };

  const calculateTotalPrice = (item: JewelryItem): number => {
    const ppg = getPricePerGram(item.karat || '21', item.metal_type || '');
    return (item.weight || 0) * ppg;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {scanResult && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce z-50 ${scanResult.startsWith('✓') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {scanResult}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Search className="w-8 h-8 text-gray-900" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">البحث والتعديل</h1>
          <p className="text-gray-400">ابحث عن القطع وعدل أو احذف</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-yellow-600/20">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ابحث بالكود أو الموديل أو الصنف أو العيار..."
            className="w-full bg-gray-700 border border-yellow-600/30 rounded-xl px-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            autoFocus
            dir="ltr"
            lang="en"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); if (searchInputRef.current) searchInputRef.current.value = ''; }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-3">
          {filteredItems.length} قطعة من أصل {items.length}
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">جاري التحميل...</p>
        </div>
      )}

      {!loading && filteredItems.length === 0 && query && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>لا توجد نتائج لـ "{query}"</p>
        </div>
      )}

      {!loading && !query && items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>لا توجد قطع في المخزون</p>
          <p className="text-sm mt-2">استخدم صفحة التكويد لإضافة قطع جديدة</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.item_code || item.id}
              className={`bg-gray-800 rounded-2xl p-4 border-r-4 ${
                item.stock_qty > 0 ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Image Section - Shows actual item image if available */}
                <div className="w-28 h-28 bg-gray-700 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.model_name}
                      className="w-full h-full object-cover cursor-pointer"
                      onDoubleClick={() => { setEditingItem({ ...item }); setShowEditModal(true); }}
                      title="دبل كليك للتعديل"
                    />
                  ) : (
                    <div
                      className="flex flex-col items-center text-gray-500 cursor-pointer hover:bg-gray-600 w-full h-full justify-center"
                      onDoubleClick={() => { setEditingItem({ ...item }); setShowEditModal(true); }}
                      title="دبل كليك للتعديل"
                    >
                      <img
                        src={generateQRCodeUrl(item.item_code)}
                        alt="QR"
                        className="w-20 h-20"
                      />
                      <span className="text-xs mt-1">QR Code</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-yellow-400">{item.model_name}</h3>
                      <p className="text-gray-400 font-mono text-sm">{item.item_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.stock_qty <= 1 && item.stock_qty > 0 && (
                        <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          مخزون منخفض
                        </span>
                      )}
                      <span className={`${getStatusColor(item.status || 'جديد')} text-white px-2 py-0.5 rounded text-xs`}>
                        {item.status || 'جديد'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="text-gray-400 text-xs block">النوع</span>
                      <span className="font-bold">{getTypeLabel(item.item_type || 'G')}</span>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="text-gray-400 text-xs block">العيار</span>
                      <span className="font-bold">{item.karat} ق</span>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="text-gray-400 text-xs block">الوزن</span>
                      <span className="font-bold">{formatNumber(item.weight)} غ</span>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="text-gray-400 text-xs block">السعر</span>
                      <span className="font-bold text-green-400">{formatCurrency(item.price)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      title="إضافة إلى سلة المبيعات"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      إضافة للسلة
                    </button>
                    <button
                      onClick={() => { setEditingItem({ ...item }); setShowEditModal(true); }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.item_code)}
                      className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-yellow-600 px-3 py-2 flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <h2 className="text-sm font-bold text-gray-900">تعديل القطعة</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2 bg-gray-800 rounded-lg p-2">
                <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                  {editingItem.image_url ? (
                    <img src={editingItem.image_url} alt={editingItem.model_name} className="w-full h-full object-cover" />
                  ) : (
                    <QrCode className="w-5 h-5 text-gray-500" />
                  )}
                  <label className="absolute bottom-0 right-0 w-full bg-black/70 text-white text-[8px] text-center py-0.5 cursor-pointer">
                    صورة
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="text-yellow-400 font-bold text-xs truncate">{editingItem.model_name}</p>
                  <p className="text-gray-400 text-[10px] font-mono truncate">{editingItem.item_code}</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-0.5">اسم الموديل</label>
                <input type="text" value={editingItem.model_name} onChange={(e) => setEditingItem({ ...editingItem, model_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">العيار</label>
                  <select value={editingItem.karat} onChange={(e) => {
                    const newKarat = e.target.value;
                    const updatedItem = { ...editingItem, karat: newKarat };
                    const newPrice = calculateTotalPrice(updatedItem);
                    setEditingItem({ ...updatedItem, price: newPrice });
                  }}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
                    <option value="24">24</option><option value="21">21</option><option value="18">18</option><option value="14">14</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">الوزن (غ)</label>
                  <input type="text" inputMode="decimal" step="0.01" value={editingItem.weight} onChange={(e) => {
                    const newWeight = parseFloat(e.target.value) || 0;
                    const updatedItem = { ...editingItem, weight: newWeight };
                    const newPrice = calculateTotalPrice(updatedItem);
                    setEditingItem({ ...updatedItem, price: newPrice });
                  }}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">السعر (د.ل) - محسوب تلقائياً</label>
                  <input type="text" inputMode="decimal" step="0.01" value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-green-600 text-green-400 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    سعر الجرام: {formatCurrency(getPricePerGram(editingItem.karat || '21', editingItem.metal_type || ''))}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">المخزون</label>
                  <input type="text" inputMode="decimal" value={editingItem.stock_qty} onChange={(e) => setEditingItem({ ...editingItem, stock_qty: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-2 text-center">
                <span className="text-gray-400 text-[10px]">الإجمالي: </span>
                <span className="text-green-400 font-bold text-xs">{formatCurrency(editingItem.price * (editingItem.stock_qty || 1))}</span>
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-0.5">نوع المعدن</label>
                <select value={editingItem.metal_type || ''} onChange={(e) => {
                  const newMetalType = e.target.value;
                  const updatedItem = { ...editingItem, metal_type: newMetalType };
                  const newPrice = calculateTotalPrice(updatedItem);
                  setEditingItem({ ...updatedItem, price: newPrice });
                }}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
                  <option value="">اختر...</option>
                  <option value="ذهب ابيض">ذهب أبيض</option><option value="اصفر">أصفر</option><option value="فضة">فضة</option>
                  <option value="فضة مطلي">فضة مطلي</option><option value="احجار كريمة">أحجار كريمة</option><option value="جوهر">جوهر</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">سعر الشراء (د.ل)</label>
                  <input type="text" inputMode="decimal" step="0.01" value={editingItem.purchase_price || 0} onChange={(e) => setEditingItem({ ...editingItem, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">سعر البيع (د.ل)</label>
                  <input type="text" inputMode="decimal" step="0.01" value={editingItem.sale_price || 0} onChange={(e) => setEditingItem({ ...editingItem, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-0.5">التصنيف</label>
                <select value={editingItem.category || ''} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
                  <option value="">اختر...</option>
                  <option value="R">خاتم</option><option value="BR">سوار</option><option value="NL">قلادة</option>
                  <option value="ER">حلق</option><option value="NK">غريل</option><option value="CH">سلسلة</option>
                  <option value="BT">عثرة</option><option value="SW">اسوارة</option><option value="ST">طقم</option><option value="OT">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">الحالة</label>
                  <select value={editingItem.status} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
                    <option value="جديد">جديد</option><option value="تكسير">تكسير</option><option value="مستعمل">مستعمل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[11px] mb-0.5">الصنف</label>
                  <input type="text" value={editingItem.gold_item || ''} onChange={(e) => setEditingItem({ ...editingItem, gold_item: e.target.value })}
                    placeholder="قلادة، خاتم..." className="w-full bg-gray-800 border border-gray-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                </div>
              </div>

              <div className="flex gap-2 pt-1 sticky bottom-0 bg-gray-900 py-2 -mx-3 px-3 rounded-b-xl">
                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> حفظ
                </button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-xs">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-gray-400 mb-6">هل أنت متأكد من حذف هذه القطعة؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;