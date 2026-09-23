import React, { useState, useEffect } from 'react';
import { Trash2, Printer, Edit3, Plus, ArrowRight, Search, FileText, X, CheckCircle } from 'lucide-react';
import { formatNumber, authApi } from '../services/supabase';
import { printQuote, QuoteData, QuoteItem } from '../services/quoteTemplate';

interface SavedQuoteItem {
  model_name: string;
  item_code: string;
  karat: string;
  weight: number;
  price_per_gram: number;
  total: number;
  notes: string;
}

interface SavedQuote {
  quote_number: string;
  customer_name: string;
  seller_name: string;
  items: SavedQuoteItem[];
  total_amount: number;
  created_at: string;
  page_size?: string;
  orientation?: string;
  date: string;
  type: string;
}

const SavedQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuote, setEditingQuote] = useState<SavedQuote | null>(null);
  const [editItems, setEditItems] = useState<SavedQuoteItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<SavedQuoteItem>({
    model_name: '', item_code: '0000', karat: '21', weight: 0, price_per_gram: 0, total: 0, notes: ''
  });
  const [autoCalc, setAutoCalc] = useState(true);
  const [manualTotal, setManualTotal] = useState(0);

  const currentUser = authApi.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_quotes') || '[]');
    setQuotes(saved.sort((a: SavedQuote, b: SavedQuote) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    const allQuotes = JSON.parse(localStorage.getItem('saved_quotes') || '[]');
    const quoteIndex = quotes[index];
    const realIndex = allQuotes.findIndex((q: SavedQuote) => q.quote_number === quoteIndex.quote_number && q.date === quoteIndex.date);
    if (realIndex !== -1) {
      allQuotes.splice(realIndex, 1);
      localStorage.setItem('saved_quotes', JSON.stringify(allQuotes));
      setQuotes(allQuotes.sort((a: SavedQuote, b: SavedQuote) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const handleEdit = (quote: SavedQuote) => {
    setEditingQuote(quote);
    setEditItems([...quote.items]);
  };

  const handleUpdateQuote = () => {
    if (!editingQuote) return;
    const totalAmount = editItems.reduce((sum, it) => sum + it.total, 0);
    const updatedQuote = { ...editingQuote, items: editItems, total_amount: totalAmount };

    const allQuotes = JSON.parse(localStorage.getItem('saved_quotes') || '[]');
    const realIndex = allQuotes.findIndex((q: SavedQuote) => q.quote_number === editingQuote.quote_number && q.date === editingQuote.date);
    if (realIndex !== -1) {
      allQuotes[realIndex] = updatedQuote;
      localStorage.setItem('saved_quotes', JSON.stringify(allQuotes));
      setQuotes(allQuotes.sort((a: SavedQuote, b: SavedQuote) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    setEditingQuote(null);
    setEditItems([]);
  };

  const handleAddItemToQuote = () => {
    if (!newItem.model_name.trim()) return;
    const total = autoCalc ? newItem.weight * newItem.price_per_gram : manualTotal;
    setEditItems([...editItems, { ...newItem, total }]);
    setNewItem({ model_name: '', item_code: '0000', karat: '21', weight: 0, price_per_gram: 0, total: 0, notes: '' });
    setManualTotal(0);
    setShowAddItem(false);
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handlePrint = (quote: SavedQuote) => {
    const quoteData: QuoteData = {
      quote_number: quote.quote_number,
      seller_name: quote.seller_name,
      customer_name: quote.customer_name,
      items: quote.items.map((it): QuoteItem => ({
        model_name: it.model_name, item_code: it.item_code, karat: it.karat,
        weight: it.weight, price_per_gram: it.price_per_gram, total: it.total, notes: it.notes,
      })),
      total_amount: quote.total_amount,
      created_at: quote.created_at,
      page_size: quote.page_size,
      orientation: quote.orientation as 'landscape' | 'portrait',
    };
    printQuote(quoteData, 2);
  };

  const filtered = quotes.filter(q =>
    q.quote_number?.includes(searchTerm) ||
    q.customer_name?.includes(searchTerm) ||
    q.seller_name?.includes(searchTerm)
  );

  if (editingQuote) {
    const editTotal = editItems.reduce((sum, it) => sum + it.total, 0);
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Edit3 className="w-7 h-7 text-yellow-400" />
              <h1 className="text-2xl font-bold text-yellow-400">تعديل عرض السعر: {editingQuote.quote_number}</h1>
            </div>
            <button onClick={() => { setEditingQuote(null); setEditItems([]); }} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowRight className="w-5 h-5" /> رجوع
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-400">العميل: </span><span className="text-white font-bold">{editingQuote.customer_name}</span></div>
            <div><span className="text-gray-400">البائع: </span><span className="text-white font-bold">{editingQuote.seller_name}</span></div>
            <div><span className="text-gray-400">التاريخ: </span><span className="text-white">{new Date(editingQuote.created_at).toLocaleDateString('en-GB')}</span></div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-yellow-400">الأصناف ({editItems.length})</h2>
              <button onClick={() => setShowAddItem(!showAddItem)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded text-sm">
                <Plus className="w-4 h-4" /> إضافة صنف
              </button>
            </div>

            {showAddItem && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <input type="text" placeholder="البيان" value={newItem.model_name} onChange={e => setNewItem({...newItem, model_name: e.target.value})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm" />
                <input type="text" placeholder="الكود" value={newItem.item_code} onChange={e => setNewItem({...newItem, item_code: e.target.value})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm" />
                <select value={newItem.karat} onChange={e => setNewItem({...newItem, karat: e.target.value})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm">
                  <option value="24">24</option><option value="21">21</option><option value="18">18</option><option value="0000">0000</option>
                </select>
                <input type="text" inputMode="decimal" placeholder="الوزن" value={newItem.weight || ''} onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value) || 0})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm" />
                <input type="text" inputMode="decimal" placeholder="سعر الجرام" value={newItem.price_per_gram || ''} onChange={e => setNewItem({...newItem, price_per_gram: parseFloat(e.target.value) || 0})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={autoCalc} onChange={e => setAutoCalc(e.target.checked)} className="accent-yellow-400" />
                  <span className="text-xs text-gray-400">حساب تلقائي</span>
                </div>
                <input type="text" inputMode="decimal" placeholder="القيمة" value={autoCalc ? (newItem.weight * newItem.price_per_gram || '') : (manualTotal || '')} onChange={e => setManualTotal(parseFloat(e.target.value) || 0)} disabled={autoCalc} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm disabled:opacity-50" />
                <input type="text" placeholder="ملاحظات" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm" />
                <div className="col-span-2 md:col-span-4 flex gap-2">
                  <button onClick={handleAddItemToQuote} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">حفظ</button>
                  <button onClick={() => setShowAddItem(false)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">إلغاء</button>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-right py-2 px-2 text-gray-400">#</th>
                  <th className="text-right py-2 px-2 text-gray-400">البيان</th>
                  <th className="text-right py-2 px-2 text-gray-400">الكود</th>
                  <th className="text-right py-2 px-2 text-gray-400">العيار</th>
                  <th className="text-right py-2 px-2 text-gray-400">الوزن</th>
                  <th className="text-right py-2 px-2 text-gray-400">سعر الجرام</th>
                  <th className="text-right py-2 px-2 text-gray-400">الإجمالي</th>
                  <th className="text-center py-2 px-2 text-gray-400">حذف</th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{item.model_name}</td>
                    <td className="py-2 px-2">{item.item_code}</td>
                    <td className="py-2 px-2">{item.karat}</td>
                    <td className="py-2 px-2">{formatNumber(item.weight)}</td>
                    <td className="py-2 px-2">{formatNumber(item.price_per_gram)}</td>
                    <td className="py-2 px-2 text-yellow-400 font-bold">{formatNumber(item.total)}</td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => handleRemoveEditItem(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
              <div className="text-gray-400">الأصناف: <span className="text-white font-bold">{editItems.length}</span></div>
              <div className="text-gray-400">الإجمالي: <span className="text-yellow-400 font-bold text-lg">{formatNumber(editTotal)}</span></div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setEditingQuote(null); setEditItems([]); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-4 py-2 rounded">إلغاء</button>
            <button onClick={handleUpdateQuote} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-2 rounded">حفظ التعديلات</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-yellow-400" />
          <h1 className="text-2xl font-bold text-yellow-400">عروض الأسعار المحفوظة</h1>
          <span className="text-gray-400 text-sm">({filtered.length})</span>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="بحث برقم العرض أو اسم العميل أو البائع..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد عرو أسعار محفوظة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((quote, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-yellow-400 font-bold text-lg">عرض سعر رقم: {quote.quote_number}</span>
                      <span className="text-gray-500 text-sm">{new Date(quote.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>العميل: <span className="text-white">{quote.customer_name || '---'}</span></span>
                      <span>البائع: <span className="text-white">{quote.seller_name || '---'}</span></span>
                      <span>الأصناف: <span className="text-white">{quote.items?.length || 0}</span></span>
                      <span className="text-yellow-400 font-bold">الإجمالي: {formatNumber(quote.total_amount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button onClick={() => handleEdit(quote)} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 p-2 rounded-lg" title="تعديل">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => handlePrint(quote)} className="bg-green-600/20 hover:bg-green-600 text-green-400 p-2 rounded-lg" title="طباعة">
                      <Printer className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(index)} className="bg-red-600/20 hover:bg-red-600 text-red-400 p-2 rounded-lg" title="حذف">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedQuotesPage;
