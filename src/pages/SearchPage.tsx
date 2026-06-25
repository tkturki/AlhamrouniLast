import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit, Trash2, AlertTriangle, CheckCircle, X, Package, QrCode, Image, ShoppingCart } from 'lucide-react';
import { JewelryItem, formatNumber, formatCurrency, generateQRCodeUrl, cartStorage } from '../services/supabase';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState<JewelryItem[]>([]);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    try {
      setLoading(true);
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
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

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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

  const handleSaveEdit = () => {
    if (!editingItem) return;

    try {
      // Get existing items
      const storedItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');

      // Find and update the item
      const index = storedItems.findIndex((i: any) => i.item_code === editingItem.item_code);
      if (index !== -1) {
        storedItems[index] = {
          ...storedItems[index],
          model_name: editingItem.model_name,
          karat: editingItem.karat,
          weight: editingItem.weight,
          price: editingItem.price,
          stock_qty: editingItem.stock_qty,
          category: editingItem.category,
          status: editingItem.status,
        };
        localStorage.setItem('jewelry_items', JSON.stringify(storedItems));

        // Update local state
        setItems(storedItems);
        setShowEditModal(false);
        setEditingItem(null);
      }
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

  return (
    <div className="max-w-4xl mx-auto">
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
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالكود أو الموديل أو الصنف أو العيار..."
            className="w-full bg-gray-700 border border-yellow-600/30 rounded-xl px-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
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
                      onClick={() => setEditingItem({ ...item })}
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-yellow-600 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">تعديل القطعة</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Preview in Modal */}
              <div className="flex items-center gap-4 mb-4 bg-gray-800 rounded-lg p-3">
                <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {editingItem.image_url ? (
                    <img src={editingItem.image_url} alt={editingItem.model_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-yellow-400 font-bold">{editingItem.model_name}</p>
                  <p className="text-gray-400 text-sm font-mono">{editingItem.item_code}</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم الموديل</label>
                <input
                  type="text"
                  value={editingItem.model_name}
                  onChange={(e) => setEditingItem({ ...editingItem, model_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">العينة</label>
                  <select
                    value={editingItem.karat}
                    onChange={(e) => setEditingItem({ ...editingItem, karat: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="24">24 قيراط</option>
                    <option value="21">21 قيراط</option>
                    <option value="18">18 قيراط</option>
                    <option value="14">14 قيراط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">الوزن (غ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.weight}
                    onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">السعر (د.ل)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">المخزون</label>
                  <input
                    type="number"
                    value={editingItem.stock_qty}
                    onChange={(e) => setEditingItem({ ...editingItem, stock_qty: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">الحالة</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="جديد">جديد</option>
                  <option value="تكسير">تكسير</option>
                  <option value="مستعمل">مستعمل</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
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