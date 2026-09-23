import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, ArrowRight, Printer, FileText, Plus, Edit3, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNumber, authApi } from '../services/supabase';
import { getQuoteNumber, getCurrentSeller, setCurrentSeller } from '../services/invoiceBooks';
import { printQuote, QuoteData, QuoteItem } from '../services/quoteTemplate';

interface QuoteCartItem {
  model_name: string;
  item_code: string;
  karat: string;
  weight: number;
  price_per_gram: number;
  total: number;
  notes: string;
  auto_calculate: boolean;
}

const QuotePage: React.FC = () => {
  const navigate = useNavigate();

  const [sellerName, setSellerName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pageSize, setPageSize] = useState('A5');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');

  const [model_name, setModelName] = useState('');
  const [item_code, setItemCode] = useState('0000');
  const [karat, setKarat] = useState('21');
  const [weight, setWeight] = useState<number>(0);
  const [price_per_gram, setPricePerGram] = useState<number>(0);
  const [auto_calculate, setAutoCalculate] = useState(true);
  const [manualTotal, setManualTotal] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const getDisplayTotal = () => {
    if (auto_calculate) {
      return weight * price_per_gram;
    }
    return manualTotal;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentSeller = getCurrentSeller();
        if (currentSeller) {
          setSellerName(currentSeller);
        } else {
          const user = authApi.getCurrentUser();
          if (user?.name) {
            setSellerName(user.name);
            setCurrentSeller(user.name);
          }
        }
      } catch {
        // ignore
      }
      const num = getQuoteNumber();
      if (num) setQuoteNumber(num);
    };
    loadInitialData();
  }, []);

  const resetForm = () => {
    setModelName('');
    setItemCode('0000');
    setKarat('21');
    setWeight(0);
    setPricePerGram(0);
    setAutoCalculate(true);
    setManualTotal(0);
    setNotes('');
    setEditingIndex(null);
  };

  const handleAddItem = () => {
    if (!model_name.trim()) return;

    const total = auto_calculate ? weight * price_per_gram : manualTotal;
    const newItem: QuoteCartItem = {
      model_name: model_name.trim(),
      item_code: item_code.trim() || '0000',
      karat,
      weight,
      price_per_gram,
      total,
      notes: notes.trim(),
      auto_calculate,
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = newItem;
      setItems(updated);
    } else {
      setItems([...items, newItem]);
    }

    resetForm();
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setModelName(item.model_name);
    setItemCode(item.item_code);
    setKarat(item.karat);
    setWeight(item.weight);
    setPricePerGram(item.price_per_gram);
    setAutoCalculate(item.auto_calculate);
    setManualTotal(item.auto_calculate ? 0 : item.total);
    setNotes(item.notes);
    setEditingIndex(index);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      resetForm();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handlePrintOnly = () => {
    const quoteData: QuoteData = {
      quote_number: quoteNumber,
      seller_name: sellerName,
      customer_name: customerName,
      items: items.map((item): QuoteItem => ({
        model_name: item.model_name,
        item_code: item.item_code,
        karat: item.karat,
        weight: item.weight,
        price_per_gram: item.price_per_gram,
        total: item.total,
        notes: item.notes,
      })),
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      page_size: pageSize,
      orientation,
    };
    printQuote(quoteData, 2);
  };

  const handleSaveAndPrint = () => {
    const quoteData: QuoteData = {
      quote_number: quoteNumber,
      seller_name: sellerName,
      customer_name: customerName,
      items: items.map((item): QuoteItem => ({
        model_name: item.model_name,
        item_code: item.item_code,
        karat: item.karat,
        weight: item.weight,
        price_per_gram: item.price_per_gram,
        total: item.total,
        notes: item.notes,
      })),
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      page_size: pageSize,
      orientation,
    };

    const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes') || '[]');
    savedQuotes.push({
      ...quoteData,
      date: new Date().toISOString(),
      type: 'quote',
    });
    localStorage.setItem('saved_quotes', JSON.stringify(savedQuotes));

    printQuote(quoteData, 2);
    setShowSuccess(true);
  };

  const handleNewQuote = () => {
    setShowSuccess(false);
    resetForm();
    setItems([]);
    setCustomerName('');
    const num = getQuoteNumber();
    if (num) setQuoteNumber(num);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold text-yellow-400">إنشاء عرض سعر</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">رقم عرض السعر</label>
              <input
                type="text"
                value={quoteNumber}
                readOnly
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم البائع</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم العميل</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">
            {editingIndex !== null ? 'تعديل الصنف' : 'إضافة صنف'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">البيان</label>
              <input
                type="text"
                value={model_name}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الكود</label>
              <input
                type="text"
                value={item_code}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">العيار</label>
              <select
                value={karat}
                onChange={(e) => setKarat(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="24">24</option>
                <option value="21">21</option>
                <option value="18">18</option>
                <option value="0000">0000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الوزن بالجرام</label>
              <input
                type="text" inputMode="decimal"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">سعر الجرام</label>
              <input
                type="text" inputMode="decimal"
                value={price_per_gram || ''}
                onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={auto_calculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <span className="text-sm text-gray-400">حساب تلقائي</span>
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الإجمالي / القيمة</label>
              <input
                type="text" inputMode="decimal"
                value={auto_calculate ? (weight * price_per_gram || '') : (manualTotal || '')}
                onChange={(e) => setManualTotal(parseFloat(e.target.value) || 0)}
                disabled={auto_calculate}
                min="0"
                step="0.01"
                className={`w-full border border-gray-600 rounded px-3 py-2 text-white ${
                  auto_calculate ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded"
            >
              {editingIndex !== null ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  حفظ التعديل
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  إضافة
                </>
              )}
            </button>
            {editingIndex !== null && (
              <button
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">الأصناف المضافة</h2>
            <div className="overflow-x-auto">
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
                    <th className="text-right py-2 px-2 text-gray-400">ملاحظات</th>
                    <th className="text-center py-2 px-2 text-gray-400">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 px-2">{index + 1}</td>
                      <td className="py-2 px-2">{item.model_name}</td>
                      <td className="py-2 px-2">{item.item_code || '-'}</td>
                      <td className="py-2 px-2">{item.karat}</td>
                      <td className="py-2 px-2">{formatNumber(item.weight)}</td>
                      <td className="py-2 px-2">{formatNumber(item.price_per_gram)}</td>
                      <td className="py-2 px-2 text-yellow-400 font-bold">{formatNumber(item.total)}</td>
                      <td className="py-2 px-2">{item.notes || '-'}</td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleEditItem(index)}
                          className="text-blue-400 hover:text-blue-300 mx-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-300 mx-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
              <div className="text-gray-400">
                عدد الأصناف: <span className="text-white font-bold">{items.length}</span>
              </div>
              <div className="flex gap-6">
                <div className="text-gray-400">
                  الوزن الإجمالي: <span className="text-white font-bold">{formatNumber(totalWeight)} جرام</span>
                </div>
                <div className="text-gray-400">
                  الإجمالي: <span className="text-yellow-400 font-bold text-lg">{formatNumber(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">حجم الورقة</label>
                <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                  <option value="A5">A5</option>
                  <option value="A4">A4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">اتجاه الطباعة</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                  <option value="landscape">أفقي</option>
                  <option value="portrait">عمودي</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePrintOnly}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold px-4 py-2 rounded"
              >
                <Printer className="w-4 h-4" />
                طباعة عرض سعر
              </button>
              <button
                onClick={handleSaveAndPrint}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-2 rounded"
              >
                <Printer className="w-5 h-5" />
                حفظ وطباعة
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
            رجوع
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-sm w-full text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">تم الحفظ والطباعة بنجاح</h3>
            <p className="text-gray-400 mb-6">رقم العرض: {quoteNumber}</p>
            <button
              onClick={handleNewQuote}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-2 rounded"
            >
              عرض سعر جديد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotePage;
