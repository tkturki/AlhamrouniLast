import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Factory, Save } from 'lucide-react';
import { serverManufacturingApi, serverItemsApi } from '../services/serverApi';
import { getSystemSettings } from '../services/settings';

interface ManufacturingItem {
  id: string;
  manufacturerName: string;
  description: string;
  pieceType: string;
  pieceName: string;
  requiredWeight: number;
  karat: string;
  image?: string;
  paidValue: number;
  laborCost: number;
  receiptDate: string;
  deliveryDate: string;
  location: 'internal' | 'external';
  notes: string;
  created_at: string;
  netPrice?: number;
}

const PIECE_TYPES = ['فضة', 'ذهب مستعمل', 'سبيكة', 'ذهب ابيض', 'ذهب اصفر', 'ذهب جديد', 'قيمة مالية', 'أخرى'];
const KARAT_OPTIONS = ['24', '21', '18', '14', '12', '9'];

const ManufacturingPage: React.FC = () => {
  const [items, setItems] = useState<ManufacturingItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ManufacturingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    loadItems();
    loadInventoryItems();
  }, []);

  const loadItems = async () => {
    try {
      const result = await serverManufacturingApi.getAll();
      if (result && result.length > 0) {
        setItems(result);
      }
    } catch {
      const stored = localStorage.getItem('manufacturing_items');
      if (stored) setItems(JSON.parse(stored));
    }
  };

  const loadInventoryItems = async () => {
    try {
      const result = await serverItemsApi.getAll();
      if (result) setInventoryItems(result);
    } catch {
      const stored = localStorage.getItem('jewelry_items');
      if (stored) setInventoryItems(JSON.parse(stored));
    }
  };

  const calculateNetPrice = (item: Partial<ManufacturingItem>): number => {
    const settings = getSystemSettings();
    const karat = item.karat || '21';
    let goldPricePerGram = 0;
    if (karat === '24') goldPricePerGram = settings.goldPrices?.gold24k || 0;
    else if (karat === '21') goldPricePerGram = settings.goldPrices?.gold21k || 0;
    else if (karat === '18') goldPricePerGram = settings.goldPrices?.gold18k || 0;
    else goldPricePerGram = settings.goldPrices?.silver || 0;
    const laborCost = item.laborCost || 0;
    const weight = item.requiredWeight || 0;
    const goldValue = weight * goldPricePerGram;
    return goldValue + laborCost;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const itemData: Partial<ManufacturingItem> = {
      manufacturerName: formData.get('manufacturerName') as string,
      description: formData.get('description') as string,
      pieceType: formData.get('pieceType') as string,
      pieceName: formData.get('pieceName') as string,
      requiredWeight: parseFloat(formData.get('requiredWeight') as string) || 0,
      karat: formData.get('karat') as string,
      paidValue: parseFloat(formData.get('paidValue') as string) || 0,
      laborCost: parseFloat(formData.get('laborCost') as string) || 0,
      receiptDate: formData.get('receiptDate') as string,
      deliveryDate: formData.get('deliveryDate') as string,
      location: formData.get('location') as 'internal' | 'external',
      notes: formData.get('notes') as string,
    };

    itemData.netPrice = calculateNetPrice(itemData);

    if (editingItem) {
      try {
        await serverManufacturingApi.update(editingItem.id, itemData);
      } catch {
        const updated = items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i);
        setItems(updated);
        localStorage.setItem('manufacturing_items', JSON.stringify(updated));
      }
    } else {
      const newItem: ManufacturingItem = {
        ...itemData,
        id: `mfg_${Date.now()}`,
        created_at: new Date().toISOString(),
      } as ManufacturingItem;
      try {
        await serverManufacturingApi.add(newItem);
      } catch {
        setItems(prev => [newItem, ...prev]);
        localStorage.setItem('manufacturing_items', JSON.stringify([newItem, ...items]));
      }
    }

    setShowModal(false);
    setEditingItem(null);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    try {
      await serverManufacturingApi.delete(id);
    } catch {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      localStorage.setItem('manufacturing_items', JSON.stringify(updated));
    }
    setShowDeleteConfirm(null);
  };

  const handleEdit = (item: ManufacturingItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const filteredItems = items.filter(item =>
    item.manufacturerName?.includes(searchQuery) ||
    item.pieceName?.includes(searchQuery) ||
    item.pieceType?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
            <Factory className="w-8 h-8" />
            التصنيع
          </h1>
          <p className="text-gray-400 mt-1">إدارة قطع التصنيع والتصنيع الخارجي</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة قطعة</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو النوع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pr-10 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
            <Factory className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد قطع تصنيع</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-yellow-500/50 transition-all">
              {item.image && (
                <div className="h-40 bg-gray-900 flex items-center justify-center">
                  <img src={item.image} alt={item.pieceName} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-yellow-400 font-bold">{item.pieceName}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.location === 'internal' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {item.location === 'internal' ? 'داخلي' : 'خارجي'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{item.manufacturerName}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">النوع: </span><span className="text-white">{item.pieceType}</span></div>
                  <div><span className="text-gray-500">العيار: </span><span className="text-white">{item.karat}K</span></div>
                  <div><span className="text-gray-500">الوزن: </span><span className="text-white">{item.requiredWeight || 0}g</span></div>
                  <div><span className="text-gray-500">أجرة اليد: </span><span className="text-green-400">{(item.laborCost || 0).toLocaleString('en-US')} د.ل</span></div>
                </div>
                {item.netPrice != null && item.netPrice > 0 && (
                  <div className="bg-gray-900 rounded-lg p-2 text-center">
                    <span className="text-gray-400 text-xs">السعر الصافي: </span>
                    <span className="text-yellow-400 font-bold">{item.netPrice.toLocaleString('en-US')} د.ل</span>
                  </div>
                )}
                {item.deliveryDate && (
                  <p className="text-gray-500 text-xs">التسليم: {item.deliveryDate}</p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={() => handleEdit(item)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm transition-all">
                    <Edit2 className="w-4 h-4 inline ml-1" />تعديل
                  </button>
                  <button onClick={() => setShowDeleteConfirm(item.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm transition-all">
                    <Trash2 className="w-4 h-4 inline ml-1" />حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400">
                {editingItem ? 'تعديل القطعة' : 'إضافة قطعة تصنيع'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">اسم المُصنّع *</label>
                  <input type="text" name="manufacturerName" required defaultValue={editingItem?.manufacturerName}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">اسم القطعة *</label>
                  <select name="pieceName" required defaultValue={editingItem?.pieceName}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500">
                    <option value="">اختر القطعة</option>
                    {inventoryItems.map((item: any) => (
                      <option key={item.id} value={item.model_name || item.name}>
                        {item.model_name || item.name} - {item.category || ''}
                      </option>
                    ))}
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع القطعة *</label>
                  <select name="pieceType" required defaultValue={editingItem?.pieceType}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500">
                    <option value="">اختر النوع</option>
                    {PIECE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">العيار *</label>
                  <select name="karat" required defaultValue={editingItem?.karat}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500">
                    <option value="">اختر العيار</option>
                    {KARAT_OPTIONS.map(k => <option key={k} value={k}>{k}K</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الوزن المطلوب (غ) *</label>
                  <input type="text" inputMode="decimal" step="0.01" name="requiredWeight" required defaultValue={editingItem?.requiredWeight}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الموقع *</label>
                  <select name="location" required defaultValue={editingItem?.location}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500">
                    <option value="internal">داخلي</option>
                    <option value="external">خارجي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">القيمة المدفوعة (د.ل)</label>
                  <input type="text" inputMode="decimal" step="0.01" name="paidValue" defaultValue={editingItem?.paidValue}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">أجرة يد المصنعية (د.ل)</label>
                  <input type="text" inputMode="decimal" step="0.01" name="laborCost" defaultValue={editingItem?.laborCost}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">تاريخ الاستلام</label>
                  <input type="date" name="receiptDate" defaultValue={editingItem?.receiptDate} lang="en"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">تاريخ التسليم</label>
                  <input type="date" name="deliveryDate" defaultValue={editingItem?.deliveryDate} lang="en"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                <textarea name="description" rows={3} defaultValue={editingItem?.description}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                <textarea name="notes" rows={2} defaultValue={editingItem?.notes}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {editingItem ? 'تحديث' : 'حفظ'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 text-center">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-4">هل أنت متأكد من حذف هذه القطعة؟</h3>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl">نعم، حذف</button>
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingPage;
