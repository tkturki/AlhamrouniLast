import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Printer, Plus, Edit3, X, FileText, Receipt, Search, Link } from 'lucide-react';
import { formatNumber, notificationSystem } from '../services/supabase';
import { getCurrentSeller, setCurrentSeller } from '../services/invoiceBooks';
import { printOrderInvoice, saveOrderInvoicePDF, OrderItem } from '../services/orderTemplate';
import { printReceipt, ReceiptItem } from '../services/receiptTemplate';
import {
  StoredReceipt, StoredInvoice,
  getReceipts, saveReceipt, getNextReceiptNumber, getReceiptByNumber, searchReceipts, deleteReceipt, updateReceipt,
  getInvoices, saveInvoice, updateInvoice, getNextInvoiceNumber, getInvoicesByReceipt, deleteInvoice, batchDeleteInvoices, restoreGoldOrdersFromServer,
  getOrderRegularInvoices, saveOrderRegularInvoice,
} from '../services/goldOrdersStorage';

const METAL_TYPES = ['ذهب صافي', 'ذهب سبائك', 'ذهب مستعمل', 'ذهب كسر', 'فضة'];

// ===================== RECEIPT TAB =====================
const ReceiptTab: React.FC = () => {
  const [sellerName, setSellerName] = useState(getCurrentSeller());
  const [customerName, setCustomerName] = useState('');
  const [customerTitle, setCustomerTitle] = useState('السيد المحترم');
  const [customerPhone, setCustomerPhone] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<StoredReceipt[]>([]);

  // Form
  const [fItemType, setFItemType] = useState<'metal' | 'monetary'>('metal');
  const [fMetalType, setFMetalType] = useState('ذهب صافي');
  const [fDescription, setFDescription] = useState('');
  const [fCountStr, setFCountStr] = useState('');
  const [fWeightStr, setFWeightStr] = useState('');
  const [fStoneWeightStr, setFStoneWeightStr] = useState('');
  const [fGemWeightStr, setFGemWeightStr] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fPricePerGramStr, setFPricePerGramStr] = useState('');
  const [fCurrency, setFCurrency] = useState('LYD');
  const [fExchangeRateStr, setFExchangeRateStr] = useState('');
  const [fMonetaryValueStr, setFMonetaryValueStr] = useState('');
  const [fPurchaseByGram, setFPurchaseByGram] = useState(false);
  const [arabonStr, setArabonStr] = useState('');
  const [recVisibleCols, setRecVisibleCols] = useState<string[]>(['serial', 'metal_type', 'description', 'count', 'weight', 'stone_weight', 'gem_weight', 'value', 'notes']);

  const fCount = parseInt(fCountStr) || 0;
  const fWeight = parseFloat(fWeightStr) || 0;
  const fPricePerGram = parseFloat(fPricePerGramStr) || 0;
  const fMonetaryValue = parseFloat(fMonetaryValueStr) || 0;
  const fPurchaseWeight = fPurchaseByGram && fPricePerGram > 0 ? fMonetaryValue / fPricePerGram : 0;
  const fExchangeRate = parseFloat(fExchangeRateStr) || 0;
  const fMetalValue = fWeight * fPricePerGram;
  const fTotalLyd = fItemType === 'metal' ? fMetalValue : (fCurrency === 'LYD' ? fMonetaryValue : fMonetaryValue * fExchangeRate);

  useEffect(() => {
    setReceiptNumber(getNextReceiptNumber());
    setSavedReceipts(getReceipts());
  }, []);

  const resetForm = () => {
    setFItemType('metal');
    setFMetalType('ذهب صافي');
    setFDescription('');
    setFCountStr('');
    setFWeightStr('');
    setFStoneWeightStr('');
    setFGemWeightStr('');
    setFNotes('');
    setFPricePerGramStr('');
    setFCurrency('LYD');
    setFExchangeRateStr('');
    setFMonetaryValueStr('');
    setFPurchaseByGram(false);
    setEditingIndex(null);
  };

  const handleAddItem = () => {
    if (fItemType === 'metal' && fWeight <= 0) return;
    if (fItemType === 'monetary' && fMonetaryValue <= 0) return;
    if (fItemType === 'monetary' && fPurchaseByGram && fPricePerGram <= 0) return;
    const newItem = {
      item_type: fItemType,
      metal_type: fItemType === 'metal' ? fMetalType : 'قيمة مالية',
      description: fDescription,
      count: fCount,
      weight: fItemType === 'metal' ? fWeight : fPurchaseWeight,
      stone_weight: fItemType === 'metal' ? (parseFloat(fStoneWeightStr) || 0) : 0,
      gem_weight: fItemType === 'metal' ? (parseFloat(fGemWeightStr) || 0) : 0,
      notes: fNotes.trim(),
      price_per_gram: fItemType === 'metal' || fPurchaseByGram ? fPricePerGram : 0,
      metal_value: fItemType === 'metal' ? fMetalValue : 0,
      currency: fItemType === 'monetary' ? fCurrency : undefined,
      exchange_rate: fItemType === 'monetary' && fCurrency !== 'LYD' ? fExchangeRate : undefined,
      monetary_value: fItemType === 'monetary' ? fMonetaryValue : undefined,
      total_lyd: fItemType === 'monetary' ? fTotalLyd : undefined,
      purchase_mode: fItemType === 'monetary' && fPurchaseByGram ? 'gold_by_gram' : undefined,
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
    setFItemType(item.item_type || 'metal');
    setFMetalType(item.metal_type);
    setFDescription(item.description);
    setFCountStr(item.count ? item.count.toString() : '');
    setFWeightStr(item.weight.toString());
    setFStoneWeightStr((item.stone_weight ?? 0).toString());
    setFGemWeightStr((item.gem_weight ?? 0).toString());
    setFNotes(item.notes || '');
    setFPricePerGramStr(item.price_per_gram.toString());
    setFCurrency(item.currency || 'LYD');
    setFExchangeRateStr(item.exchange_rate?.toString() || '');
    setFMonetaryValueStr(item.monetary_value?.toString() || '');
    setFPurchaseByGram(item.purchase_mode === 'gold_by_gram');
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) resetForm();
  };

  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  const totalCount = items.reduce((sum, it) => sum + it.count, 0);
  const totalValue = items.reduce((sum, it) => sum + (it.item_type === 'monetary' ? (it.total_lyd || it.monetary_value || 0) : it.metal_value), 0);

  const handleSaveAndPrint = () => {
    if (items.length === 0 || !customerName.trim()) return;
    if (sellerName) setCurrentSeller(sellerName);

    // Save receipt
    const savedReceipt = saveReceipt({
      receipt_number: receiptNumber,
      customer_name: customerName,
      customer_title: customerTitle,
      customer_phone: customerPhone,
      delivery_date: deliveryDate,
      items: items.map((it, i) => ({
        serial: i + 1,
        item_type: it.item_type || 'metal',
        metal_type: it.metal_type,
        description: it.description,
        count: it.count,
        weight: it.weight,
        stone_weight: it.stone_weight || 0,
        gem_weight: it.gem_weight || 0,
        notes: it.notes || '',
        price_per_gram: it.price_per_gram,
        metal_value: it.metal_value,
        currency: it.currency,
        exchange_rate: it.exchange_rate,
        monetary_value: it.monetary_value,
        total_lyd: it.total_lyd,
        purchase_mode: it.purchase_mode,
      })),
      total_weight: totalWeight,
      total_count: totalCount,
      total_value: totalValue,
      arabon: parseFloat(arabonStr) || 0,
      created_at: new Date().toISOString(),
    });

    setSavedReceipts(getReceipts());

    // Print receipt
    const receiptItems: ReceiptItem[] = items.map((item, index) => ({
      serial: index + 1,
      item_name: item.description || item.metal_type,
      item_type: item.item_type || 'metal',
      metal_type: item.metal_type,
      weight: item.weight,
      stone_weight: item.stone_weight || 0,
      gem_weight: item.gem_weight || 0,
      quantity: item.count || 1,
      unit: 'جرام',
      market_value: item.item_type === 'monetary' ? (item.total_lyd || item.monetary_value || 0) : item.metal_value,
      notes: item.notes || '',
      price_per_gram: item.price_per_gram,
      currency: item.currency,
      exchange_rate: item.exchange_rate,
      monetary_value: item.monetary_value,
      total_lyd: item.total_lyd,
      description: item.description,
    }));
    printReceipt({
      receipt_number: receiptNumber,
      customer_name: customerName,
      customer_title: customerTitle,
      customer_phone: customerPhone,
      delivery_date: deliveryDate,
      items: receiptItems,
      total_weight: totalWeight,
      total_value: totalValue,
      created_at: new Date().toISOString(),
      page_size: pageSize,
      orientation,
      total_count: totalCount,
      arabon: parseFloat(arabonStr) || 0,
      remaining: totalValue - (parseFloat(arabonStr) || 0),
      visibleCols: recVisibleCols,
    });

    // Reset for next receipt
    setCustomerName('');
    setCustomerPhone('');
    setItems([]);
    setReceiptNumber(getNextReceiptNumber());
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm('هل تريد حذف هذا الإيصال؟')) {
      deleteReceipt(id);
      setSavedReceipts(getReceipts());
    }
  };

  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

  const handleEditSavedReceipt = (r: StoredReceipt) => {
    setEditingReceiptId(r.id);
    setCustomerName(r.customer_name);
    setCustomerPhone(r.customer_phone || '');
    setReceiptNumber(r.receipt_number);
    setDeliveryDate(r.delivery_date || new Date().toISOString().split('T')[0]);
    setArabonStr(r.arabon ? r.arabon.toString() : '');
    setItems((r.items || []).map((it, i) => ({
      ...it,
      serial: i + 1,
    })));
    // Set appropriate visible columns based on item types
    const hasMonetary = r.items?.some(it => it.item_type === 'monetary');
    const hasMetal = r.items?.some(it => it.item_type !== 'monetary');
    if (hasMonetary && !hasMetal) {
      setRecVisibleCols(['serial', 'description', 'currency', 'monetary_value', 'total_lyd']);
    } else {
      setRecVisibleCols(['serial', 'metal_type', 'description', 'count', 'weight', 'value']);
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateReceipt = () => {
    if (!editingReceiptId || items.length === 0 || !customerName.trim()) return;
    const updatedReceipt = {
      receipt_number: receiptNumber,
      customer_name: customerName,
      customer_title: customerTitle,
      customer_phone: customerPhone,
      delivery_date: deliveryDate,
      items: items.map((it, i) => ({
        serial: i + 1,
        item_type: it.item_type || 'metal',
        metal_type: it.metal_type,
        description: it.description,
        count: it.count,
        weight: it.weight,
        stone_weight: it.stone_weight || 0,
        gem_weight: it.gem_weight || 0,
        notes: it.notes || '',
        price_per_gram: it.price_per_gram,
        metal_value: it.metal_value,
        currency: it.currency,
        exchange_rate: it.exchange_rate,
        monetary_value: it.monetary_value,
        total_lyd: it.total_lyd,
      })),
      total_weight: totalWeight,
      total_count: totalCount,
      total_value: totalValue,
      arabon: parseFloat(arabonStr) || 0,
      created_at: new Date().toISOString(),
    };
    updateReceipt(editingReceiptId, updatedReceipt);
    setSavedReceipts(getReceipts());
    setEditingReceiptId(null);
    resetForm();
    setCustomerName('');
    setCustomerPhone('');
    setItems([]);
    setReceiptNumber(getNextReceiptNumber());
  };

  const handlePrintSavedReceipt = (r: StoredReceipt) => {
    const receiptItems: ReceiptItem[] = r.items.map((item, index) => ({
      serial: index + 1,
      item_name: item.description || item.metal_type,
      item_type: item.item_type || 'metal',
      metal_type: item.metal_type,
      weight: item.weight,
      stone_weight: item.stone_weight || 0,
      gem_weight: item.gem_weight || 0,
      quantity: item.count || 1,
      unit: 'جرام',
      market_value: item.item_type === 'monetary' ? (item.total_lyd || item.monetary_value || 0) : item.metal_value,
      notes: item.notes || '',
      price_per_gram: item.price_per_gram,
      currency: item.currency,
      exchange_rate: item.exchange_rate,
      monetary_value: item.monetary_value,
      total_lyd: item.total_lyd,
      description: item.description,
    }));
    printReceipt({
      receipt_number: r.receipt_number,
      customer_name: r.customer_name,
      customer_title: (r as any).customer_title || 'السيد المحترم',
      customer_phone: r.customer_phone,
      delivery_date: r.delivery_date,
      items: receiptItems,
      total_weight: r.total_weight,
      total_value: r.total_value,
      created_at: r.created_at,
      page_size: 'A4',
      orientation: 'landscape',
      total_count: r.total_count,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
          <Receipt className="w-5 h-5" /> بيانات إيصال الاستلام
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم البائع / المسؤول</label>
            <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">صفة العميل</label>
            <select value={customerTitle} onChange={(e) => setCustomerTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
              <option value="السيد المحترم">السيد المحترم</option>
              <option value="السيد/ة">السيد/ة</option>
              <option value="السيدة المحترمة">السيدة المحترمة</option>
              <option value="العميل">العميل</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم العميل *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">رقم هاتف العميل</label>
            <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">رقم الإيصال (تلقائي)</label>
            <input type="text" value={receiptNumber} readOnly className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-yellow-400 font-bold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">تاريخ الاستلام</label>
            <div className="flex gap-2">
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              {deliveryDate && (
                <button type="button" onClick={() => {
                  const daysLeft = Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24));
                  const msg = `📦 تنبيه طلبية\nالعميل: ${customerName || 'عميل'}\nرقم الإيصال: ${receiptNumber}\nتاريخ الاستلام: ${deliveryDate}\nباقي ${daysLeft} يوم`;
                  const phones = ['+218912133218', '+218913157496'];
                  phones.forEach(p => window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, '_blank'));
                }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm" title="إرسال تنبيه واتساب">📞 واتساب</button>
              )}
            </div>
            {deliveryDate && (
              <p className={`text-xs mt-1 ${Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24)) <= 20 ? 'text-orange-400' : 'text-gray-500'}`}>
                {(() => {
                  const d = Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24));
                  return d <= 0 ? `⚠️ تأخر ${Math.abs(d)} يوم` : d <= 20 ? `⏰ باقي ${d} يوم - تنبيه واتساب تلقائي` : `باقي ${d} يوم`;
                })()}
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">حجم الورقة *</label>
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="">اختر الحجم</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="B5">B5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاتجاه *</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="">اختر الاتجاه</option>
                <option value="portrait">عمودي</option>
                <option value="landscape">أفقي</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-yellow-400">{editingIndex !== null ? 'تعديل صنف' : 'إضافة صنف'}</h3>
        
        {/* Toggle: Metal or Monetary */}
        <div className="flex gap-4 mb-4">
          <button onClick={() => setFItemType('metal')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${fItemType === 'metal' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
            🪙 معدن
          </button>
          <button onClick={() => setFItemType('monetary')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${fItemType === 'monetary' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
            💰 قيمة مالية
          </button>
        </div>

        {fItemType === 'metal' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">نوع المعدن *</label>
              <select value={fMetalType} onChange={(e) => setFMetalType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                {METAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">البيان</label>
              <input type="text" value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="وصف المعدن" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">العدد (قطع)</label>
              <input type="text" inputMode="decimal" value={fCountStr} onChange={(e) => setFCountStr(e.target.value)} step="1" min="0" placeholder="0" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الوزن (جـرام) *</label>
              <input type="text" inputMode="decimal" value={fWeightStr} onChange={(e) => setFWeightStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">وزن الأحجار (جرام)</label>
              <input type="text" inputMode="decimal" value={fStoneWeightStr} onChange={(e) => setFStoneWeightStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">وزن الجوهر (جرام)</label>
              <input type="text" inputMode="decimal" value={fGemWeightStr} onChange={(e) => setFGemWeightStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">سعر اليوم للجرام (د.ل) *</label>
              <input type="text" inputMode="decimal" value={fPricePerGramStr} onChange={(e) => setFPricePerGramStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">قيمة المعدن (د.ل)</label>
              <input type="text" value={formatNumber(fMetalValue)} readOnly className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-white cursor-not-allowed font-bold text-yellow-400" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
              <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="إضافة ملاحظات خاصة بالقطعة" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">البيان *</label>
              <input type="text" value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="مثال: حوالة، صك، شراء..." className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div className="md:col-span-2 flex items-end">
              <label className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 rounded px-3 py-2 text-yellow-300 cursor-pointer w-full">
                <input type="checkbox" checked={fPurchaseByGram} onChange={(e) => setFPurchaseByGram(e.target.checked)} className="w-4 h-4 accent-yellow-500" />
                شراء ذهب حسب سعر الجرام وحساب الوزن تلقائياً
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">العملة *</label>
              <select value={fCurrency} onChange={(e) => setFCurrency(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="LYD">دينار ليبي (د.ل)</option>
                <option value="USD">دولار أمريكي ($)</option>
                <option value="EUR">يورو (€)</option>
                <option value="GBP">جنيه إسترليني (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">المبلغ *</label>
              <input type="text" inputMode="decimal" value={fMonetaryValueStr} onChange={(e) => setFMonetaryValueStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            {fPurchaseByGram && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سعر الجرام (د.ل) *</label>
                  <input type="text" inputMode="decimal" value={fPricePerGramStr} onChange={(e) => setFPricePerGramStr(e.target.value)} placeholder="مثال: 1300" className="w-full bg-gray-700 border border-yellow-500/50 rounded px-3 py-2 text-white" />
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <label className="block text-sm text-gray-400 mb-1">الوزن المتوقع للشراء</label>
                  <p className="text-xl font-bold text-yellow-400">{fPurchaseWeight.toFixed(2)} جرام</p>
                  <p className="text-xs text-gray-400 mt-1">المبلغ ÷ سعر الجرام</p>
                </div>
              </>
            )}
            {fCurrency !== 'LYD' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">سعر الصرف الموازي (د.ل/{fCurrency === 'USD' ? '$' : fCurrency === 'EUR' ? '€' : '£'}) *</label>
                <input type="text" inputMode="decimal" value={fExchangeRateStr} onChange={(e) => setFExchangeRateStr(e.target.value)} step="0.001" placeholder="0.000" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
            )}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <label className="block text-sm text-gray-400 mb-1">الإجمالي (د.ل)</label>
              <input type="text" value={formatNumber(fTotalLyd)} readOnly className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-white cursor-not-allowed font-bold text-green-400 text-lg" />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleAddItem} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded">
            <Plus className="w-4 h-4" /> {editingIndex !== null ? 'تحديث' : 'إضافة'}
          </button>
          {editingIndex !== null && (
            <button onClick={resetForm} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
              <X className="w-4 h-4" /> إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">#</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">النوع</th>
                  <th className="px-3 py-3 text-right text-sm text-gray-400">البيان</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">العدد</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">وزن الذهب الصافي</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">وزن الأحجار</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">وزن الجوهر</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">سعر الجرام</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">المبلغ</th>
                  <th className="px-3 py-3 text-right text-sm text-gray-400">ملاحظات</th>
                  <th className="px-3 py-3 text-center text-sm text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700/30">
                    <td className="px-3 py-3 text-gray-300 text-center">{index + 1}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.item_type === 'monetary' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {item.item_type === 'monetary' ? '💰 مالية' : item.metal_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white">{item.description || '---'}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{item.count || '-'}</td>
                    <td className="px-3 py-3 text-center font-bold text-yellow-400">{item.weight > 0 ? item.weight.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{(item.stone_weight ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{(item.gem_weight ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{item.price_per_gram > 0 ? formatNumber(item.price_per_gram) : '-'}</td>
                    <td className="px-3 py-3 text-center text-yellow-400 font-bold">
                      {item.item_type === 'monetary' ? (
                        <span>
                          {formatNumber(item.monetary_value)} {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : 'د.ل'}
                          {item.total_lyd && item.currency !== 'LYD' && <span className="text-xs text-gray-400 block">= {formatNumber(item.total_lyd)} د.ل</span>}
                        </span>
                      ) : formatNumber(item.metal_value)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-300 max-w-[160px] break-words">{item.notes || '-'}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEditItem(index)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-900/50 border-t border-gray-700">
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-yellow-400 font-bold text-center">الإجماليات</td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-400">{totalCount}</td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-400">{totalWeight.toFixed(2)}</td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-400">{items.reduce((s, i) => s + (i.stone_weight || 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-400">{items.reduce((s, i) => s + (i.gem_weight || 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-400 text-lg">{formatNumber(totalValue)} د.ل</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">إجمالي الذهب المستلم</p>
              <p className="text-xl font-bold text-yellow-400">{totalWeight.toFixed(2)} جرام</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي القطع</p>
              <p className="text-xl font-bold text-yellow-400">{totalCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-yellow-400">{formatNumber(totalValue)} د.ل</p>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {/* Arabon field */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">العربون (د.ل)</label>
                <input type="text" inputMode="decimal" value={arabonStr} onChange={(e) => setArabonStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">المتبقي (د.ل)</label>
                <input type="text" value={formatNumber(totalValue - (parseFloat(arabonStr) || 0))} readOnly className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-green-400 font-bold cursor-not-allowed" />
              </div>
            </div>
          </div>
          {/* Column selector */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">أعمدة الإيصال:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'serial', label: '#' },
                { id: 'metal_type', label: 'نوع المعدن' },
                { id: 'description', label: 'البيان' },
                { id: 'count', label: 'العدد' },
                { id: 'weight', label: 'وزن الذهب الصافي' },
                { id: 'stone_weight', label: 'وزن الأحجار' },
                { id: 'gem_weight', label: 'وزن المجارات' },
                { id: 'price_per_gram', label: 'سعر الجرام' },
                { id: 'value', label: 'المبلغ' },
                { id: 'currency', label: 'العملة' },
                { id: 'monetary_value', label: 'المبلغ بالعملة' },
                { id: 'total_lyd', label: 'الإجمالي د.ل' },
                { id: 'notes', label: 'ملاحظات' },
              ].map(col => (
                <label key={col.id} className={`flex items-center gap-1 px-3 py-1 rounded text-sm cursor-pointer ${recVisibleCols.includes(col.id) ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                  <input type="checkbox" checked={recVisibleCols.includes(col.id)} onChange={(e) => {
                    if (e.target.checked) setRecVisibleCols([...recVisibleCols, col.id]);
                    else setRecVisibleCols(recVisibleCols.filter(c => c !== col.id));
                  }} className="hidden" />
                  {col.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
          {editingReceiptId ? (
            <button
              onClick={handleUpdateReceipt}
              className="flex items-center gap-2 font-bold px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit3 className="w-5 h-5" /> تحديث الإيصال
            </button>
          ) : (
            <button
              onClick={handleSaveAndPrint}
              disabled={!pageSize || !orientation}
              className={`flex items-center gap-2 font-bold px-6 py-3 rounded-lg ${(!pageSize || !orientation) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              <Printer className="w-5 h-5" /> {!pageSize || !orientation ? 'اختر حجم الورقة والاتجاه أولاً' : 'حفظ وطباعة إيصال الاستلام'}
            </button>
          )}
          {editingReceiptId && (
            <button
              onClick={() => { setEditingReceiptId(null); resetForm(); setCustomerName(''); setCustomerPhone(''); setItems([]); setReceiptNumber(getNextReceiptNumber()); }}
              className="flex items-center gap-2 font-bold px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-500 text-white"
            >
              <X className="w-5 h-5" /> إلغاء
            </button>
          )}
        </div>
        </div>
      )}

      {/* Saved Receipts */}
      {savedReceipts.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-3">
          <h3 className="text-lg font-bold text-yellow-400">الإيصالات المحفوظة</h3>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center text-gray-400">رقم الإيصال</th>
                  <th className="px-3 py-2 text-center text-gray-400">العميل</th>
                  <th className="px-3 py-2 text-center text-gray-400">الوزن</th>
                  <th className="px-3 py-2 text-center text-gray-400">القيمة</th>
                  <th className="px-3 py-2 text-center text-gray-400">التاريخ</th>
                  <th className="px-3 py-2 text-center text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {savedReceipts.slice().reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-center text-yellow-400 font-mono font-bold">{r.receipt_number}</td>
                    <td className="px-3 py-2 text-center text-white">{r.customer_name}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{(r.total_weight || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{formatNumber(r.total_value)}</td>
                    <td className="px-3 py-2 text-center text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-CA')}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEditSavedReceipt(r)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="تعديل">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrintSavedReceipt(r)} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="طباعة">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => {
                          import('../services/monetaryReceipt').then(({ printMonetaryReceipt }) => {
                            printMonetaryReceipt({
                              receipt_number: `MON-${Date.now()}`,
                              invoice_number: r.receipt_number,
                              customer_name: r.customer_name || '',
                              customer_title: r.customer_title || '',
                              customer_phone: r.customer_phone || '',
                              total_amount: r.total_value || 0,
                              payment_date: r.created_at,
                              items: (r.items || []).map((it: any, i: number) => ({
                                serial: i + 1,
                                description: it.description || it.metal_type || '',
                                item_type: it.item_type || 'metal',
                                weight: it.weight || 0,
                                count: it.count || 0,
                                price_per_gram: it.price_per_gram || 0,
                                amount: it.item_type === 'monetary' ? (it.total_lyd || it.monetary_value || 0) : (it.metal_value || 0),
                                notes: it.notes || '',
                              })),
                            });
                          });
                        }} className="p-1 text-emerald-300 hover:bg-emerald-500/20 rounded" title="ايصال استلام قيمة مالية">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSaved(r.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== INVOICE TAB =====================
const InvoiceTab: React.FC = () => {
  const [sellerName, setSellerName] = useState(getCurrentSeller());
  const [receiptNumberInput, setReceiptNumberInput] = useState('');
  const [linkedReceipt, setLinkedReceipt] = useState<StoredReceipt | null>(null);
  const [receiptSearchResults, setReceiptSearchResults] = useState<StoredReceipt[]>([]);
  const [showReceiptSearch, setShowReceiptSearch] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerTitle, setCustomerTitle] = useState('السيد المحترم');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedInvoices, setSavedInvoices] = useState<StoredInvoice[]>([]);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invVisibleCols, setInvVisibleCols] = useState<string[]>([
    'num','pieces','desc','karat','pureW','withStones','withGems','stoneW','gemW','totalW','stoneCount','gemCount','goldPrice','workPrice','total','notes'
  ]);
  const fixedSumCols = ['pureW', 'withStones', 'withGems', 'stoneW', 'gemW', 'totalW', 'total'];
  const [invSumCols, setInvSumCols] = useState<string[]>(fixedSumCols);

  const [visibleBreakdown, setVisibleBreakdown] = useState<Record<string, boolean>>({
    weight_pure: true,
    weight_with_stones: true,
    stones_weight: true,
    gems_weight: true,
    metal_value: true,
    stones_value: true,
    gems_value: true,
    gems_count: true,
    added_weight: true,
    workmanship: true,
    manual_gems: true,
    manual_stones: true,
    other_additions: true,
  });

  // Form
  const [fDescription, setFDescription] = useState('');
  const [fMetalType, setFMetalType] = useState('ذهب صافي');
  const [fKarat, setFKarat] = useState('21');
  const [fWeightStr, setFWeightStr] = useState('');
  const [fPiecesCountStr, setFPiecesCountStr] = useState('');
  const [fWorkmanshipStr, setFWorkmanshipStr] = useState('');
  const [fWeightWithStonesStr, setFWeightWithStonesStr] = useState('');
  const [fWeightWithGemsStr, setFWeightWithGemsStr] = useState('');
  const [fStoneWeightStr, setFStoneWeightStr] = useState('');
  const [fGemWeightStr, setFGemWeightStr] = useState('');
  const [fValueStonesStr, setFValueStonesStr] = useState('');
  const [fValueGemsStr, setFValueGemsStr] = useState('');
  const [fStonePriceStr, setFStonePriceStr] = useState('');
  const [fGemPriceStr, setFGemPriceStr] = useState('');
  const [fStoneCountStr, setFStoneCountStr] = useState('');
  const [fGemCountStr, setFGemCountStr] = useState('');
  const [fGoldPriceStr, setFGoldPriceStr] = useState('');
  const [fItemNotes, setFItemNotes] = useState('');
  const [fManualGemsValueStr, setFManualGemsValueStr] = useState('');
  const [fManualStonesValueStr, setFManualStonesValueStr] = useState('');
  const [fOtherAddDesc, setFOtherAddDesc] = useState('');
  const [fOtherAddValueStr, setFOtherAddValueStr] = useState('');

  const fWeight = parseFloat(fWeightStr) || 0;
  const fWorkmanship = parseFloat(fWorkmanshipStr) || 0;
  const fWeightWithStones = parseFloat(fWeightWithStonesStr) || 0;
  const fWeightWithGems = parseFloat(fWeightWithGemsStr) || 0;
  const fEnteredStoneWeight = parseFloat(fStoneWeightStr) || 0;
  const fEnteredGemWeight = parseFloat(fGemWeightStr) || 0;
  const fStonePrice = parseFloat(fStonePriceStr) || 0;
  const fGemPrice = parseFloat(fGemPriceStr) || 0;
  const fStoneCount = parseInt(fStoneCountStr) || 0;
  const fGemCount = parseInt(fGemCountStr) || 0;
  const fGoldPrice = parseFloat(fGoldPriceStr) || 0;
  const fStoneWeight = Math.max(0, fEnteredStoneWeight);
  const fGemWeight = Math.max(0, fEnteredGemWeight);
  const fPureGoldWeight = fWeight;
  const fValueStones = parseFloat(fValueStonesStr) || 0;
  const fValueGems = parseFloat(fValueGemsStr) || 0;
  const fMetalValue = fGoldPrice * fPureGoldWeight;
  const fMaxWeight = fWeight;
  const fTotal = fWorkmanship * fMaxWeight;
  const fTotalWeight = fWeight + fStoneWeight + fGemWeight + fWeightWithGems;

  // Totals
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  const totalPureGoldWeight = totalWeight;
  const totalStonesWeight = items.reduce((sum, it) => sum + (Number(it.stone_weight) || 0), 0);
  const totalGemsWeight = items.reduce((sum, it) => sum + (Number(it.gem_weight) || 0), 0);
  const totalStonesCount = items.reduce((sum, it) => sum + (it.stone_count || 0), 0);
  const totalGemsCount = items.reduce((sum, it) => sum + (it.gem_count || 0), 0);
  const totalPieces = items.reduce((sum, it) => sum + it.pieces_count, 0);
  const totalWorkmanshipRate = items.reduce((sum, it) => sum + it.workmanship, 0);
  const totalWorkmanshipCost = items.reduce((sum, it) => sum + (it.workmanship * (Number(it.weight) || 0)), 0);
  const totalStonesValue = items.reduce((sum, it) => sum + it.value_stones, 0);
  const totalGemsValue = items.reduce((sum, it) => sum + it.value_gems, 0);
  const totalMetalValue = items.reduce((sum, it) => sum + ((it.gold_price || 0) * it.weight), 0);
  const totalAmountBase = totalWorkmanshipCost;
  const manualGems = parseFloat(fManualGemsValueStr) || 0;
  const manualStones = parseFloat(fManualStonesValueStr) || 0;
  const otherAddValue = parseFloat(fOtherAddValueStr) || 0;
  const totalAmount = totalAmountBase + manualGems + manualStones + otherAddValue;

  const receivedWeight = linkedReceipt?.total_weight || 0;
  const remainingWeight = receivedWeight > 0 ? receivedWeight - totalWeight : 0;
  const receivedPieces = linkedReceipt?.total_count || 0;
  const remainingPieces = receivedPieces > 0 ? receivedPieces - totalPieces : 0;

  useEffect(() => {
    void restoreGoldOrdersFromServer().finally(() => {
      setSavedInvoices(getInvoices());
    });
  }, []);

  // Cache invoices locally - no re-parse on every render
  const cachedInvoices = React.useRef<StoredInvoice[]>([]);
  useEffect(() => {
    cachedInvoices.current = savedInvoices;
  }, [savedInvoices]);

  // Generate invoice number when receipt is linked (only for new invoices)
  useEffect(() => {
    if (linkedReceipt && !editingInvoiceId) {
      setInvoiceNumber(getNextInvoiceNumber());
    }
  }, [linkedReceipt]);

  const handleReceiptSearch = useCallback((query: string) => {
    setReceiptNumberInput(query);
    if (query.length >= 2) {
      const results = searchReceipts(query);
      setReceiptSearchResults(results);
      setShowReceiptSearch(results.length > 0);
    } else {
      setReceiptSearchResults([]);
      setShowReceiptSearch(false);
    }
  }, []);

  const handleSelectReceipt = (receipt: StoredReceipt) => {
    // Check if this receipt already has an invoice
    const existingInvoices = getInvoices().filter(inv => inv.receipt_number === receipt.receipt_number);
    if (existingInvoices.length > 0) {
      // Load existing invoice for editing instead of creating new one
      const existingInv = existingInvoices[0];
      setEditingInvoiceId(existingInv.id);
      setLinkedReceipt(receipt);
      setCustomerName(existingInv.customer_name);
      setSellerName(existingInv.seller_name);
      setInvoiceNumber(existingInv.invoice_number);
      setDeliveryDate(existingInv.delivery_date);
      setInvSumCols(existingInv.sum_columns || fixedSumCols);
      setItems((existingInv.items || []).map((it, i) => ({
        ...it,
        serial: i + 1,
      })));
      setFManualGemsValueStr('');
      setFManualStonesValueStr('');
      setFOtherAddDesc('');
      setFOtherAddValueStr('');
      notificationSystem.info('فاتورة موجودة', `تم تحميل الفاتورة ${existingInv.invoice_number} للتعديل`);
    } else {
      // New invoice for this receipt
      setEditingInvoiceId(null);
      setLinkedReceipt(receipt);
      setCustomerName(receipt.customer_name);
      setInvoiceNumber(getNextInvoiceNumber());
    }
    setReceiptNumberInput(receipt.receipt_number);
    setShowReceiptSearch(false);
    setReceiptSearchResults([]);
  };

  const handleClearReceipt = () => {
    setLinkedReceipt(null);
    setReceiptNumberInput('');
    setCustomerName('');
    setInvoiceNumber('');
  };

  const resetForm = () => {
    setFDescription('');
    setFMetalType('ذهب صافي');
    setFKarat('21');
    setFWeightStr('');
    setFPiecesCountStr('');
    setFWorkmanshipStr('');
    setFWeightWithStonesStr('');
    setFWeightWithGemsStr('');
    setFStoneWeightStr('');
    setFGemWeightStr('');
    setFValueStonesStr('');
    setFValueGemsStr('');
    setFStonePriceStr('');
    setFGemPriceStr('');
    setFStoneCountStr('');
    setFGemCountStr('');
    setFGoldPriceStr('');
    setFItemNotes('');
    setEditingIndex(null);
  };

  const handleAddItem = () => {
    if (!fDescription.trim()) return;
    const newItem = {
      description: fDescription.trim(),
      metal_type: fMetalType,
      karat: fKarat,
      weight: fWeight,
      pieces_count: parseInt(fPiecesCountStr) || 0,
      workmanship: fWorkmanship,
      weight_with_stones: fWeightWithStones,
      weight_with_gems: fWeightWithGems,
      stone_weight: fStoneWeight,
      gem_weight: fGemWeight,
      stone_price: fStonePrice,
      gem_price: fGemPrice,
      stone_count: fStoneCount,
      gem_count: fGemCount,
      gold_price: fGoldPrice,
      value_stones: fValueStones,
      value_gems: fValueGems,
      total: fTotal,
      notes: fItemNotes,
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
    setFDescription(item.description);
    setFMetalType(item.metal_type);
    setFKarat(item.karat || '21');
    setFWeightStr(item.weight ? item.weight.toString() : '');
    setFPiecesCountStr(item.pieces_count ? item.pieces_count.toString() : '');
    setFWorkmanshipStr(item.workmanship ? item.workmanship.toString() : '');
    setFWeightWithStonesStr(item.weight_with_stones ? item.weight_with_stones.toString() : '');
    setFWeightWithGemsStr(item.weight_with_gems ? item.weight_with_gems.toString() : '');
    setFStoneWeightStr(item.stone_weight !== undefined ? item.stone_weight.toString() : '');
    setFGemWeightStr(item.gem_weight !== undefined ? item.gem_weight.toString() : '');
    setFStonePriceStr(item.stone_price ? item.stone_price.toString() : '');
    setFGemPriceStr(item.gem_price ? item.gem_price.toString() : '');
    setFStoneCountStr(item.stone_count ? item.stone_count.toString() : '');
    setFGemCountStr(item.gem_count ? item.gem_count.toString() : '');
    setFGoldPriceStr(item.gold_price ? item.gold_price.toString() : '');
    setFValueStonesStr(item.value_stones ? item.value_stones.toString() : '');
    setFValueGemsStr(item.value_gems ? item.value_gems.toString() : '');
    setFItemNotes(item.notes);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) resetForm();
  };

  const buildOrderData = () => {
    const orderItems: OrderItem[] = items.map((item, index) => ({
      serial: index + 1,
      description: item.description,
      metal_type: item.metal_type,
      karat: item.karat || '21',
      weight_pure: item.weight,
      workmanship_per_gram: item.workmanship,
      weight_with_stones: item.weight_with_stones,
      weight_with_gems: item.weight_with_gems,
      stone_weight: item.stone_weight,
      gem_weight: item.gem_weight,
      total: item.total,
      notes: item.notes,
      pieces_count: item.pieces_count,
      price_per_gram: item.gold_price || 0,
      value_stones: item.value_stones,
      value_gems: item.value_gems,
      workmanship_total: item.workmanship * item.weight,
      metal_value: (item.gold_price || 0) * item.weight,
      stone_count: item.stone_count || 0,
      gem_count: item.gem_count || 0,
      stone_price: item.stone_price || 0,
      gem_price: item.gem_price || 0,
      gold_price: item.gold_price || 0,
      total_weight: item.total_weight || (item.weight + (Number(item.stone_weight) || 0) + (Number(item.gem_weight) || 0) + (Number(item.weight_with_gems) || 0)),
    }));
    return {
      order_number: invoiceNumber,
      receipt_number: linkedReceipt?.receipt_number || receiptNumberInput,
      customer_name: customerName,
      customer_title: customerTitle,
      delivery_date: deliveryDate,
      items: orderItems,
      total_amount: totalAmount,
      total_weight: totalWeight,
      total_workmanship: totalWorkmanshipCost,
      seller_name: sellerName,
      created_at: new Date().toISOString(),
      page_size: pageSize,
      orientation,
      total_stones_value: totalStonesValue + manualStones,
      total_gems_value: totalGemsValue + manualGems,
      total_metal_value: totalMetalValue,
      received_quantity: receivedWeight,
      received_weight: receivedWeight,
      remaining_weight: remainingWeight,
      total_pieces: totalPieces,
      received_pieces: receivedPieces,
      ingot_weight: 1000,
      other_add_desc: fOtherAddDesc,
      other_add_value: otherAddValue,
      manual_gems: manualGems,
      manual_stones: manualStones,
      visibleBreakdown,
      sum_columns: invSumCols,
    };
  };

  const saveInvoiceData = () => {
    if (items.length === 0 || !customerName.trim()) return false;
    if (sellerName) setCurrentSeller(sellerName);

    const relationKey = createInvoiceLinkKey({
      invoice_number: invoiceNumber,
      receipt_number: linkedReceipt?.receipt_number || '',
      customer_name: customerName,
      created_at: new Date().toISOString(),
    });

    const relatedRegularInvoice = findRelatedRegularInvoice(customerName, linkedReceipt?.receipt_number || '');

    const invoiceData = {
      invoice_number: invoiceNumber,
      receipt_number: linkedReceipt?.receipt_number || '',
      customer_name: customerName,
      customer_title: customerTitle,
      seller_name: sellerName,
      delivery_date: deliveryDate,
      items: items.map((it, i) => ({
        serial: i + 1,
        description: it.description,
        metal_type: it.metal_type,
        karat: it.karat || '21',
        weight: it.weight,
        pieces_count: it.pieces_count,
        workmanship: it.workmanship,
        weight_with_stones: it.weight_with_stones,
        weight_with_gems: it.weight_with_gems,
        stone_weight: it.stone_weight,
        gem_weight: it.gem_weight,
        stone_price: it.stone_price || 0,
        gem_price: it.gem_price || 0,
        stone_count: it.stone_count || 0,
        gem_count: it.gem_count || 0,
        gold_price: it.gold_price || 0,
        value_stones: it.value_stones,
        value_gems: it.value_gems,
        total: it.total,
        notes: it.notes,
        total_weight: it.total_weight || (it.weight + (Number(it.stone_weight) || 0) + (Number(it.gem_weight) || 0) + (Number(it.weight_with_gems) || 0)),
      })),
      total_weight: totalWeight,
      total_pieces: totalPieces,
      total_workmanship: totalWorkmanshipCost,
      total_stones_value: totalStonesValue + manualStones,
      total_gems_value: totalGemsValue + manualGems,
      total_metal_value: totalMetalValue,
      total_amount: totalAmount,
      received_weight: receivedWeight,
      remaining_weight: remainingWeight,
      other_add_desc: fOtherAddDesc,
      other_add_value: otherAddValue,
      manual_gems: manualGems,
      manual_stones: manualStones,
      related_sale_invoice_number: relatedRegularInvoice?.invoice_number || '',
      related_receipt_number: linkedReceipt?.receipt_number || relatedRegularInvoice?.related_receipt_number || '',
      linked_sale_invoice_number: relatedRegularInvoice?.invoice_number || '',
      invoice_link_key: relationKey,
      created_at: new Date().toISOString(),
      sum_columns: invSumCols,
    };

    if (editingInvoiceId) {
      updateInvoice(editingInvoiceId, invoiceData);
      notificationSystem.success('تم التحديث', 'تم تحديث الفاتورة بنجاح');
    } else {
      saveInvoice(invoiceData);
    }

    setSavedInvoices(getInvoices());
    return true;
  };

  const resetInvoiceForm = () => {
    setItems([]);
    handleClearReceipt();
    setInvoiceNumber('');
    setFManualGemsValueStr('');
    setFManualStonesValueStr('');
    setFOtherAddDesc('');
    setFOtherAddValueStr('');
    setEditingInvoiceId(null);
    setCustomerName('');
    setSellerName('');
    setDeliveryDate('');
    setLinkedReceipt(null);
    setReceiptNumberInput('');
  };

  const handleSavePDF = async () => {
    if (!items.length || !customerName.trim()) return;
    try {
      await saveOrderInvoicePDF(buildOrderData(), pageSize, orientation, invVisibleCols);
      notificationSystem.success('تم الحفظ', 'تم حفظ الفاتورة كملف PDF');
    } catch {
      notificationSystem.error('خطأ', 'فشل في إنشاء ملف PDF');
    }
  };

  const handleSave = () => {
    if (!saveInvoiceData()) return;
    notificationSystem.success('تم الحفظ', 'تم حفظ الفاتورة بدون طباعة');
    resetInvoiceForm();
  };

  const handlePrint = async () => {
    if (!items.length || !customerName.trim()) return;
    await printOrderInvoice(buildOrderData(), pageSize, orientation, invVisibleCols);
  };

  const handleDeleteSaved = (id: string) => {
    setSelectedInvoiceIds([id]);
    setShowDeleteConfirm(true);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === savedInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(savedInvoices.map(inv => inv.id));
    }
  };

  const handleConfirmDelete = () => {
    batchDeleteInvoices(selectedInvoiceIds);
    setSavedInvoices(getInvoices());
    setSelectedInvoiceIds([]);
    setShowDeleteConfirm(false);
  };

  const handlePrintSaved = async (inv: StoredInvoice) => {
    const orderItems: OrderItem[] = (inv.items || []).map((it, i) => ({
      serial: i + 1,
      description: it.description || '',
      metal_type: it.metal_type || '',
      karat: it.karat || '21',
      weight_pure: it.weight || 0,
      workmanship_per_gram: it.workmanship || 0,
      weight_with_stones: it.weight_with_stones || 0,
      weight_with_gems: it.weight_with_gems || 0,
      stone_weight: it.stone_weight || 0,
      gem_weight: it.gem_weight || 0,
      total: it.total || 0,
      notes: it.notes || '',
      pieces_count: it.pieces_count || 0,
      value_stones: it.value_stones || 0,
      value_gems: it.value_gems || 0,
      workmanship_total: (it.workmanship || 0) * (it.weight || 0),
      metal_value: (it.gold_price || 0) * (it.weight || 0),
      stone_count: it.stone_count || 0,
      gem_count: it.gem_count || 0,
      stone_price: it.stone_price || 0,
      gem_price: it.gem_price || 0,
      gold_price: it.gold_price || 0,
      total_weight: it.total_weight || ((it.weight || 0) + (Number(it.stone_weight) || 0) + (Number(it.gem_weight) || 0) + (Number(it.weight_with_gems) || 0)),
    }));
    await printOrderInvoice({
      order_number: inv.invoice_number,
      receipt_number: inv.receipt_number || '',
      customer_name: inv.customer_name,
      customer_title: (inv as any).customer_title || 'السيد المحترم',
      delivery_date: inv.delivery_date,
      items: orderItems,
      total_amount: inv.total_amount || 0,
      total_weight: inv.total_weight || 0,
      total_workmanship: inv.total_workmanship || 0,
      seller_name: inv.seller_name || '',
      created_at: inv.created_at,
      page_size: 'A4',
      orientation: 'landscape',
      total_stones_value: inv.total_stones_value || 0,
      total_gems_value: inv.total_gems_value || 0,
      total_metal_value: inv.total_metal_value || 0,
      received_quantity: inv.received_weight || 0,
      received_weight: inv.received_weight || 0,
      remaining_weight: inv.remaining_weight || 0,
      total_pieces: inv.total_pieces || 0,
      received_pieces: 0,
      ingot_weight: 1000,
      sum_columns: (inv as any).sum_columns || fixedSumCols,
    }, 'A4', 'landscape', invVisibleCols);
  };

  const handleEditSaved = (inv: StoredInvoice) => {
    setEditingInvoiceId(inv.id);
    setCustomerName(inv.customer_name || '');
    setSellerName(inv.seller_name || '');
    setInvoiceNumber(inv.invoice_number || '');
    setDeliveryDate(inv.delivery_date || '');
    setInvSumCols(inv.sum_columns || fixedSumCols);
    setLinkedReceipt(inv.receipt_number ? getReceiptByNumber(inv.receipt_number) || null : null);
    setReceiptNumberInput(inv.receipt_number || '');
    setItems((inv.items || []).map((it, i) => ({
      ...it,
      serial: i + 1,
    })));
    setFManualGemsValueStr((inv.manual_gems || 0) > 0 ? String(inv.manual_gems) : '');
    setFManualStonesValueStr((inv.manual_stones || 0) > 0 ? String(inv.manual_stones) : '');
    setFOtherAddDesc(inv.other_add_desc || '');
    setFOtherAddValueStr((inv.other_add_value || 0) > 0 ? String(inv.other_add_value) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notificationSystem.info('تعديل', `جاري تعديل الفاتورة ${inv.invoice_number}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
          <FileText className="w-5 h-5" /> بيانات فاتورة التصنيع
          {editingInvoiceId && (
            <button
              onClick={() => {
                setEditingInvoiceId(null);
                setCustomerName('');
                setSellerName('');
                setInvoiceNumber('');
                setDeliveryDate('');
                setLinkedReceipt(null);
                setReceiptNumberInput('');
                setItems([]);
                setFManualGemsValueStr('');
                setFManualStonesValueStr('');
                setFOtherAddDesc('');
                setFOtherAddValueStr('');
              }}
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded mr-auto"
            >
              + فاتورة جديدة
            </button>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم البائع / المسؤول</label>
            <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div className="relative">
            <label className="block text-sm text-gray-400 mb-1">
              <Link className="w-3 h-3 inline ml-1" />
              رقم الإيصال (لربط الفاتورة بالإيصال) *
            </label>
            <input
              type="text"
              value={receiptNumberInput}
              onChange={(e) => handleReceiptSearch(e.target.value)}
              onFocus={() => {
                const all = searchReceipts('');
                setReceiptSearchResults(all);
                setShowReceiptSearch(true);
              }}
              placeholder="اضغط لعرض جميع الإيصالات..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
            {showReceiptSearch && (
              <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {receiptSearchResults.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400 text-center">لا توجد إيصالات</div>
                ) : (
                  receiptSearchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectReceipt(r)}
                      className="w-full px-4 py-3 text-right hover:bg-gray-600 border-b border-gray-600 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-bold font-mono">{r.receipt_number}</span>
                        <span className="text-white">{r.customer_name}</span>
                        <span className="text-gray-400 text-sm">{(r.total_weight || 0).toFixed(2)} جرام</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">صفة العميل</label>
            <select value={customerTitle} onChange={(e) => setCustomerTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
              <option value="السيد المحترم">السيد المحترم</option>
              <option value="السيد/ة">السيد/ة</option>
              <option value="السيدة المحترمة">السيدة المحترمة</option>
              <option value="العميل">العميل</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم العميل *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">رقم الفاتورة (تلقائي + رقم الإيصال)</label>
            <input type="text" value={invoiceNumber} readOnly className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-yellow-400 font-bold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">تاريخ التسليم</label>
            <div className="flex gap-2">
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              {deliveryDate && (
                <button type="button" onClick={() => {
                  const daysLeft = Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24));
                  const msg = `📦 تنبيه فاتورة طلبية\nالعميل: ${customerName || 'عميل'}\nرقم الفاتورة: ${invoiceNumber}\nتاريخ التسليم: ${deliveryDate}\nباقي ${daysLeft} يوم`;
                  const phones = ['+218912133218', '+218913157496'];
                  phones.forEach(p => window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, '_blank'));
                }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm" title="إرسال تنبيه واتساب">📞 واتساب</button>
              )}
            </div>
            {deliveryDate && (
              <p className={`text-xs mt-1 ${Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24)) <= 20 ? 'text-orange-400' : 'text-gray-500'}`}>
                {(() => {
                  const d = Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / (1000*60*60*24));
                  return d <= 0 ? `⚠️ تأخر ${Math.abs(d)} يوم` : d <= 20 ? `⏰ باقي ${d} يوم - تنبيه واتساب تلقائي` : `باقي ${d} يوم`;
                })()}
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">حجم الورقة *</label>
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="">اختر الحجم</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="B5">B5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الاتجاه *</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="">اختر الاتجاه</option>
                <option value="portrait">عمودي</option>
                <option value="landscape">أفقي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Linked Receipt Info */}
        {linkedReceipt && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-blue-400 font-bold flex items-center gap-2">
                <Link className="w-4 h-4" /> مرتبط بالإيصال: {linkedReceipt.receipt_number}
              </h4>
              <button onClick={handleClearReceipt} className="text-red-400 hover:text-red-300 text-sm">إلغاء الربط</button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-gray-400">العميل</p>
                <p className="text-white font-bold">{linkedReceipt.customer_name || ''}</p>
              </div>
              <div>
                <p className="text-gray-400">الوزن المستلم</p>
                <p className="text-yellow-400 font-bold">{(linkedReceipt.total_weight || 0).toFixed(2)} جرام</p>
              </div>
              <div>
                <p className="text-gray-400">القطع المستلمة</p>
                <p className="text-yellow-400 font-bold">{linkedReceipt.total_count || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-yellow-400">{editingIndex !== null ? 'تعديل صنف' : 'إضافة صنف'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم الصنف / البيان *</label>
            <input type="text" value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="مثال: خاتم، سلسلة..." className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">نوع المعدن</label>
            <input type="text" value={fMetalType} onChange={(e) => setFMetalType(e.target.value)} list="metalTypes2" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            <datalist id="metalTypes2">
              {METAL_TYPES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">العيار</label>
            <select value={fKarat} onChange={(e) => setFKarat(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
              <option value="24">24</option>
              <option value="21">21</option>
              <option value="18">18</option>
              <option value="14">14</option>
              <option value="12">12</option>
              <option value="9">9</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">سعر الذهب / جرام (د.ل)</label>
            <input type="text" inputMode="decimal" value={fGoldPriceStr} onChange={(e) => setFGoldPriceStr(e.target.value)} placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            {fGoldPrice > 0 && fPureGoldWeight > 0 && (
              <p className="text-xs text-yellow-400 mt-1">{fPureGoldWeight.toFixed(2)} × {fGoldPrice} = {formatNumber(fMetalValue)} د.ل</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">الوزن - الذهب الصافي (جـرام) *</label>
            <input type="text" inputMode="decimal" value={fWeightStr} onChange={(e) => setFWeightStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">عدد القطع المصنعة</label>
            <input type="text" inputMode="decimal" value={fPiecesCountStr} onChange={(e) => setFPiecesCountStr(e.target.value)} step="1" min="0" placeholder="0" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">قيمة اليد العاملة / جرام (د.ل) *</label>
            <input type="text" inputMode="decimal" value={fWorkmanshipStr} onChange={(e) => setFWorkmanshipStr(e.target.value)} step="0.01" placeholder="مثال: 135" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            {fWorkmanship > 0 && fMaxWeight > 0 && (
              <p className="text-xs text-yellow-400 mt-1">{fWorkmanship} × {fMaxWeight.toFixed(2)} = {formatNumber(fTotal)} د.ل</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">وزن بالأحجار (جـرام) — اختياري</label>
            <input type="text" inputMode="decimal" value={fWeightWithStonesStr} onChange={(e) => setFWeightWithStonesStr(e.target.value)} step="0.01" placeholder="أدخل الوزن مباشرة أو اتركه فارغًا" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">وزن الأحجار الفعلي (جـرام)</label>
            <input type="text" inputMode="decimal" value={fStoneWeightStr} onChange={(e) => setFStoneWeightStr(e.target.value)} step="0.01" placeholder="يُحسب تلقائيًا أو أدخل مباشرة" className="w-full bg-gray-700 border border-blue-500/50 rounded px-3 py-2 text-white" />
            <p className="text-xs text-blue-400 mt-1">الوزن المحفوظ: {fStoneWeight.toFixed(2)} جرام</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">عدد الأحجار</label>
            <input type="text" inputMode="decimal" value={fStoneCountStr} onChange={(e) => setFStoneCountStr(e.target.value)} step="1" placeholder="0" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">سعر الحجر (د.ل/جرام)</label>
            <input type="text" inputMode="decimal" value={fStonePriceStr} onChange={(e) => setFStonePriceStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            {fStonePrice > 0 && fStoneWeight > 0 && (
              <p className="text-xs text-blue-400 mt-1">{fStoneWeight.toFixed(2)} × {fStonePrice} = {formatNumber(fValueStones)} د.ل</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">وزن الجوهر (جـرام) — اختياري</label>
            <input type="text" inputMode="decimal" value={fWeightWithGemsStr} onChange={(e) => setFWeightWithGemsStr(e.target.value)} step="0.01" placeholder="أدخل الوزن مباشرة أو اتركه فارغًا" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">وزن المجارات الفعلي (جـرام)</label>
            <input type="text" inputMode="decimal" value={fGemWeightStr} onChange={(e) => setFGemWeightStr(e.target.value)} step="0.01" placeholder="يُحسب تلقائيًا أو أدخل مباشرة" className="w-full bg-gray-700 border border-purple-500/50 rounded px-3 py-2 text-white" />
            <p className="text-xs text-purple-400 mt-1">الوزن المحفوظ: {fGemWeight.toFixed(2)} جرام</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">عدد المجارات</label>
            <input type="text" inputMode="decimal" value={fGemCountStr} onChange={(e) => setFGemCountStr(e.target.value)} step="1" placeholder="0" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">سعر المجارة (د.ل/جرام)</label>
            <input type="text" inputMode="decimal" value={fGemPriceStr} onChange={(e) => setFGemPriceStr(e.target.value)} step="0.01" placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
            {fGemPrice > 0 && fGemWeight > 0 && (
              <p className="text-xs text-purple-400 mt-1">{fGemWeight.toFixed(2)} × {fGemPrice} = {formatNumber(fValueGems)} د.ل</p>
            )}
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
            <input type="text" value={fItemNotes} onChange={(e) => setFItemNotes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
        </div>
        {/* Inline Total */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-gray-400 font-bold">إجمالي هذا الصنف:</span>
          <span className="text-2xl font-bold text-yellow-400">{formatNumber(fTotal)} د.ل</span>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-gray-400 font-bold">إجمالي الوزن:</span>
          <span className="text-xl font-bold text-green-400">{formatNumber(fTotalWeight)} جرام</span>
        </div>
        <p className="text-xs text-gray-500">الأوزان والقيم تُحفظ كما تم إدخالها، بدون حساب تلقائي.</p>
        <div className="flex gap-2">
          <button onClick={handleAddItem} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded">
            <Plus className="w-4 h-4" /> {editingIndex !== null ? 'تحديث' : 'إضافة'}
          </button>
          {editingIndex !== null && (
            <button onClick={resetForm} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
              <X className="w-4 h-4" /> إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">#</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">العدد</th>
                  <th className="px-2 py-3 text-right text-xs text-gray-400">الصنف والبيان</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">العيار</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">وزن الذهب</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">وزن بالأحجار</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">وزن الجوهر</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">وزن الأحجار</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">وزن المجارات</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">إجمالي الوزن</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">عدد أحجار</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">عدد المجارات</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">سعر الذهب</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">اليد / جرام</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">الإجمالي</th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {items.map((item, index) => {
                  const stoneW = Number(item.stone_weight) || 0;
                  const gemW = Number(item.gem_weight) || 0;
                  return (
                  <tr key={index} className="hover:bg-gray-700/30">
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{index + 1}</td>
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{item.pieces_count || '-'}</td>
                    <td className="px-2 py-2 text-right text-white text-xs font-bold">{item.description}</td>
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{item.karat || '-'}</td>
                    <td className="px-2 py-2 text-center text-yellow-400 font-bold text-xs">{formatNumber(item.weight || 0)}</td>
                      <td className="px-2 py-2 text-center text-gray-300 text-xs">{formatNumber(item.weight_with_stones || 0)}</td>
                      <td className="px-2 py-2 text-center text-gray-300 text-xs">{formatNumber(item.weight_with_gems || 0)}</td>
                    <td className="px-2 py-2 text-center text-blue-400 font-bold text-xs">{formatNumber(stoneW)}</td>
                    <td className="px-2 py-2 text-center text-purple-400 font-bold text-xs">{formatNumber(gemW)}</td>
                    <td className="px-2 py-2 text-center text-green-400 font-bold text-xs">{formatNumber(item.total_weight || ((item.weight || 0) + stoneW + gemW + (Number(item.weight_with_gems) || 0)))}</td>
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{item.stone_count || '-'}</td>
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{item.gem_count || '-'}</td>
                    <td className="px-2 py-2 text-center text-yellow-400 font-bold text-xs">{(item.gold_price || 0) > 0 ? formatNumber(item.gold_price) : '-'}</td>
                    <td className="px-2 py-2 text-center text-gray-300 text-xs">{formatNumber(item.workmanship)}</td>
                    <td className="px-2 py-2 text-center text-yellow-400 font-bold text-xs">{formatNumber(item.workmanship * (Number(item.weight) || 0))}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEditItem(index)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteItem(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-900/50 border-t border-gray-700">
                <tr>
                  <td className="px-2 py-2 text-yellow-400 font-bold text-center text-xs"></td>
                  <td className="px-2 py-2 text-yellow-400 font-bold text-center text-xs">{invSumCols.includes('pieces') ? totalPieces : ''}</td>
                  <td className="px-2 py-2 text-yellow-400 font-bold text-center text-xs">الإجماليات</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs"></td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{formatNumber(totalWeight)}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{formatNumber(items.reduce((s, it) => s + (Number(it.weight_with_stones) || 0), 0))}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{formatNumber(items.reduce((s, it) => s + (Number(it.weight_with_gems) || 0), 0))}</td>
                  <td className="px-2 py-2 text-center font-bold text-blue-400 text-xs">{formatNumber(totalStonesWeight)}</td>
                  <td className="px-2 py-2 text-center font-bold text-purple-400 text-xs">{formatNumber(totalGemsWeight)}</td>
                  <td className="px-2 py-2 text-center font-bold text-green-400 text-xs">{formatNumber(items.reduce((s, it) => s + (Number(it.total_weight) || ((it.weight || 0) + (Number(it.stone_weight) || 0) + (Number(it.gem_weight) || 0) + (Number(it.weight_with_gems) || 0))), 0))}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{invSumCols.includes('stoneCount') ? totalStonesCount : ''}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{invSumCols.includes('gemCount') ? totalGemsCount : ''}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{invSumCols.includes('goldPrice') ? formatNumber(items.reduce((s, it) => s + (it.gold_price || 0), 0)) : ''}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-xs">{invSumCols.includes('workPrice') ? totalWorkmanshipRate : ''}</td>
                  <td className="px-2 py-2 text-center font-bold text-yellow-400 text-sm">{formatNumber(totalAmount)}</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">الوزن المستخدم</p>
              <p className="text-xl font-bold text-yellow-400">{totalWeight.toFixed(2)} جرام</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">القطع المصنعة</p>
              <p className="text-xl font-bold text-yellow-400">{totalPieces}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">اليد العاملة</p>
              <p className="text-xl font-bold text-yellow-400">{formatNumber(totalWorkmanshipCost)} د.ل</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">الأحجار + الجوهر</p>
              <p className="text-xl font-bold text-yellow-400">{formatNumber(totalStonesValue + totalGemsValue)} د.ل</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg">
              <p className="text-gray-400 text-sm">الإجمالي النهائي</p>
              <p className="text-2xl font-bold text-yellow-400">{formatNumber(totalAmount)} د.ل</p>
            </div>
          </div>

          {/* Manual Gem & Stone Value Inputs */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-bold text-gray-300 mb-3">إضافات يدوية (تُضاف للإجمالي)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">قيمة الجوهر المضاف (د.ل)</label>
                <input
                  type="text" inputMode="decimal"
                  step="0.01"
                  value={fManualGemsValueStr}
                  onChange={(e) => setFManualGemsValueStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">قيمة الأحجار المضافة (د.ل)</label>
                <input
                  type="text" inputMode="decimal"
                  step="0.01"
                  value={fManualStonesValueStr}
                  onChange={(e) => setFManualStonesValueStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            {(parseFloat(fManualGemsValueStr) > 0 || parseFloat(fManualStonesValueStr) > 0) && (
              <div className="mt-3 text-center text-sm text-gray-400">
                الإجمالي مع الإضافات: <span className="text-yellow-400 font-bold">{formatNumber(totalAmount)} د.ل</span>
              </div>
            )}
            {/* Other Additions */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-600">
              <div>
                <label className="block text-xs text-gray-400 mb-1">بيان الإضافة الأخرى</label>
                <input
                  type="text"
                  value={fOtherAddDesc}
                  onChange={(e) => setFOtherAddDesc(e.target.value)}
                  placeholder="مثال: توصيل، صيانة..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">قيمة الإضافة الأخرى (د.ل)</label>
                <input
                  type="text" inputMode="decimal"
                  step="0.01"
                  value={fOtherAddValueStr}
                  onChange={(e) => setFOtherAddValueStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            {otherAddValue > 0 && (
              <div className="mt-2 text-center text-sm text-green-400">
                الإجمالي النهائي: <span className="font-bold">{formatNumber(totalAmount)} د.ل</span>
              </div>
            )}
          </div>

          {/* Remaining Weight */}
          {linkedReceipt && receivedWeight > 0 && (
            <div className={`rounded-lg p-4 border ${remainingWeight < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-400">الوزن المستلم من الإيصال</p>
                  <p className="text-white font-bold">{receivedWeight.toFixed(2)} جرام</p>
                </div>
                <div>
                  <p className="text-gray-400">الذهب الصافي</p>
                  <p className="text-white font-bold">{totalWeight.toFixed(2)} جرام</p>
                </div>
                <div>
                  <p className="text-gray-400">وزن الأحجار</p>
                  <p className="text-blue-400 font-bold">{totalStonesWeight.toFixed(2)} جرام</p>
                </div>
                <div>
                  <p className="text-gray-400">وزن الجوهر</p>
                  <p className="text-purple-400 font-bold">{totalGemsWeight.toFixed(2)} جرام</p>
                </div>
                <div>
                  <p className="text-gray-400">عدد السبائك المستلمة</p>
                  <p className="text-white font-bold">{receivedWeight >= 1000 ? `${Math.floor(receivedWeight / 1000)} سبيكة` : 'أقل من سبيكة'}</p>
                </div>
                <div>
                  <p className="text-gray-400">عدد القطع المصنعة</p>
                  <p className="text-white font-bold">{totalPieces} قطعة</p>
                </div>
              </div>
              <div className={`text-center mt-3 pt-3 border-t ${remainingWeight < 0 ? 'border-red-500/30' : 'border-blue-500/30'}`}>
                <p className={`text-lg font-bold ${remainingWeight < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {remainingWeight > 0 ? (
                    (() => {
                      const INGOT_WEIGHT = 1000;
                      const fullIngots = Math.floor(remainingWeight / INGOT_WEIGHT);
                      const remainingGrams = remainingWeight % INGOT_WEIGHT;
                      const parts = [];
                      if (fullIngots > 0) parts.push(`${fullIngots} سبيكة`);
                      if (remainingGrams > 0) parts.push(`${remainingGrams.toFixed(2)} جرام`);
                      return `وزن الذهب المتبقي: ${remainingWeight.toFixed(2)} جرام | المتبقي: ${parts.join(' و ')}`;
                    })()
                  ) : remainingWeight === 0 ? (
                    'تم استخدام كامل وزن الذهب المستلم'
                  ) : (
                    `لم يتبقى باقي وتم اضافة وزن ${Math.abs(remainingWeight).toFixed(2)} جرام`
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Weight Breakdown Summary */}
          {items.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h4 className="text-sm font-bold text-yellow-400 mb-3">تفصيل الأوزان</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400">الوزن المستلم من الإيصال</p>
                  <p className="text-white font-bold">{receivedWeight > 0 ? `${receivedWeight.toFixed(2)} ج` : '-'}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400">الوزن الصافي (ذهب فقط)</p>
                  <p className="text-yellow-400 font-bold">{totalPureGoldWeight.toFixed(2)} ج</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400">إجمالي وزن الأحجار</p>
                  <p className="text-blue-400 font-bold">{totalStonesWeight.toFixed(2)} ج</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400">إجمالي وزن الجوهر</p>
                  <p className="text-purple-400 font-bold">{totalGemsWeight.toFixed(2)} ج</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">الوزن الصافي = وزن القطعة - وزن الأحجار - وزن الجوهر</p>
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-yellow-400">الأعمدة المطبوعة</span>
              <div className="flex gap-2">
                <button onClick={() => setInvVisibleCols(['num','pieces','desc','karat','pureW','withStones','withGems','stoneW','gemW','totalW','stoneCount','gemCount','goldPrice','workPrice','total','notes'])} className="text-xs text-green-400 hover:text-green-300">الكل</button>
                <button onClick={() => setInvVisibleCols([])} className="text-xs text-red-400 hover:text-red-300">إلغاء الكل</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {k:'num',l:'#'},{k:'pieces',l:'العدد'},{k:'desc',l:'الصنف والبيان'},{k:'karat',l:'العيار'},{k:'pureW',l:'وزن الذهب'},
                {k:'withStones',l:'وزن بالأحجار'},{k:'withGems',l:'وزن الجوهر'},{k:'stoneW',l:'وزن الأحجار'},
                {k:'gemW',l:'وزن المجارات'},{k:'totalW',l:'إجمالي الوزن'},{k:'stoneCount',l:'عدد الأحجار'},{k:'gemCount',l:'عدد المجارات'},
                {k:'goldPrice',l:'سعر الجرام'},{k:'workPrice',l:'سعر اليد'},{k:'total',l:'الإجمالي'},{k:'notes',l:'ملاحظات'}
              ].map(c => (
                <label key={c.k} className="flex items-center gap-1 bg-gray-600/50 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-500/50">
                  <input type="checkbox" checked={c.k === 'total' || invVisibleCols.includes(c.k)} disabled={c.k === 'total'} onChange={() => c.k !== 'total' && setInvVisibleCols(prev => prev.includes(c.k) ? prev.filter(x => x !== c.k) : [...prev, c.k])} className="w-3 h-3 accent-yellow-500" />
                  <span className="text-gray-300">{c.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-yellow-400">الأعمدة التي يتم جمعها</span>
              <span className="text-xs text-gray-400">الأوزان والإجمالي النهائي تجمع تلقائيًا</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: 'pieces', l: 'العدد' },
                { k: 'stoneCount', l: 'عدد الأحجار' },
                { k: 'gemCount', l: 'عدد المجارات' },
                { k: 'goldPrice', l: 'سعر الجرام' },
                { k: 'workPrice', l: 'سعر اليد' },
              ].map(c => (
                <label key={c.k} className="flex items-center gap-1 bg-gray-600/50 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-500/50">
                  <input type="checkbox" checked={invSumCols.includes(c.k)} onChange={() => setInvSumCols(prev => prev.includes(c.k) ? prev.filter(x => x !== c.k) : [...prev, c.k])} className="w-3 h-3 accent-yellow-500" />
                  <span className="text-gray-300">جمع {c.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Breakdown Visibility Controls */}
          <div className="bg-gray-700/50 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-yellow-400">تفاصيل القيمة المطبوعة</span>
              <div className="flex gap-2">
                <button onClick={() => setVisibleBreakdown(Object.fromEntries(Object.keys(visibleBreakdown).map(k => [k, true])))} className="text-xs text-green-400 hover:text-green-300">الكل</button>
                <button onClick={() => setVisibleBreakdown(Object.fromEntries(Object.keys(visibleBreakdown).map(k => [k, false])))} className="text-xs text-red-400 hover:text-red-300">إلغاء الكل</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                {k:'weight_pure',l:'وزن الذهب المستلم'},
                {k:'weight_with_stones',l:'وزن الذهب المصنع (صافي)'},
                {k:'weight_with_gems',l:'وزن الذهب المصنع (بعد التصنيع)'},
                {k:'stones_weight',l:'وزن الأحجار'},
                {k:'gems_weight',l:'وزن المجارات'},
                {k:'gems_count',l:'عدد المجارات'},
                {k:'added_weight',l:'الوزن المضاف'},
                {k:'metal_value',l:'قيمة المعدن'},
                {k:'stones_value',l:'قيمة الأحجار'},
                {k:'gems_value',l:'قيمة الجوهر'},
                {k:'workmanship',l:'قيمة اليد العاملة'},
                {k:'manual_gems',l:'جوهر يدوي'},
                {k:'manual_stones',l:'أحجار يدوية'},
                {k:'other_additions',l:'إضافات أخرى'},
              ] as const).map(c => (
                <label key={c.k} className="flex items-center gap-1 bg-gray-600/50 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-500/50">
                  <input type="checkbox" checked={visibleBreakdown[c.k]} onChange={() => setVisibleBreakdown(prev => ({...prev, [c.k]: !prev[c.k]}))} className="w-3 h-3 accent-yellow-500" />
                  <span className="text-gray-300">{c.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
          <button
            onClick={handleSavePDF}
            disabled={!pageSize || !orientation}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-lg ${(!pageSize || !orientation) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <FileText className="w-5 h-5" /> حفظ كـ PDF
          </button>
          <button
            onClick={handleSave}
            disabled={!pageSize || !orientation}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-lg ${(!pageSize || !orientation) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
          >
            <FileText className="w-5 h-5" /> حفظ فقط
          </button>
          <button
            onClick={handlePrint}
            disabled={!pageSize || !orientation}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-lg ${(!pageSize || !orientation) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            <Printer className="w-5 h-5" /> طباعة فقط
          </button>
          <button
            onClick={() => {
              if (!saveInvoiceData()) return;
              const inv = buildOrderData();
              import('../services/monetaryReceipt').then(({ printMonetaryReceipt }) => {
                printMonetaryReceipt({
                  receipt_number: `MON-${Date.now()}`,
                  invoice_number: inv.order_number,
                  customer_name: inv.customer_name || '',
                  total_amount: inv.total_amount || 0,
                  payment_date: new Date().toISOString(),
                });
              });
              resetInvoiceForm();
            }}
            disabled={!pageSize || !orientation}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-lg ${(!pageSize || !orientation) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            📋 ايصال استلام قيمة مالية
          </button>
        </div>
        </div>
      )}

      {/* Saved Invoices */}
      {savedInvoices.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-yellow-400">الفواتير المحفوظة ({savedInvoices.length})</h3>
            <div className="flex items-center gap-2">
              {selectedInvoiceIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                >
                  <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedInvoiceIds.length})
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.length === savedInvoices.length && savedInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-yellow-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-center text-gray-400">رقم الفاتورة</th>
                  <th className="px-3 py-2 text-center text-gray-400">رقم الإيصال</th>
                  <th className="px-3 py-2 text-center text-gray-400">العميل</th>
                  <th className="px-3 py-2 text-center text-gray-400">الوزن</th>
                  <th className="px-3 py-2 text-center text-gray-400">المتبقي</th>
                  <th className="px-3 py-2 text-center text-gray-400">الإجمالي</th>
                  <th className="px-3 py-2 text-center text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {savedInvoices.slice().reverse().map((inv) => (
                  <tr key={inv.id} className={`hover:bg-gray-700/30 ${selectedInvoiceIds.includes(inv.id) ? 'bg-yellow-500/10' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="w-4 h-4 accent-yellow-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-yellow-400 font-mono font-bold">{inv.invoice_number}</td>
                    <td className="px-3 py-2 text-center text-blue-400 font-mono">{inv.receipt_number}</td>
                    <td className="px-3 py-2 text-center text-white">{inv.customer_name}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{(inv.total_weight || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{(inv.remaining_weight || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{formatNumber(inv.total_amount || 0)}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEditSaved(inv)} className="p-1 text-yellow-400 hover:bg-yellow-500/20 rounded" title="تعديل">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrintSaved(inv)} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="طباعة">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSaved(inv.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-400 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-300 mb-6">
              هل تريد حذف {selectedInvoiceIds.length} فاتورة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setSelectedInvoiceIds([]); }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                حذف {selectedInvoiceIds.length} فاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const REGULAR_ORDER_COLUMNS = [
  { key: 'num', label: '#' },
  { key: 'pieces', label: 'العدد' },
  { key: 'desc', label: 'الصنف والبيان' },
  { key: 'karat', label: 'العيار' },
  { key: 'pureW', label: 'الوزن' },
  { key: 'totalW', label: 'إجمالي الوزن' },
  { key: 'withGems', label: 'وزن الجوهر' },
  { key: 'stoneW', label: 'وزن الأحجار' },
  { key: 'gemW', label: 'وزن المجارات' },
  { key: 'gemCount', label: 'عدد المجارات' },
  { key: 'goldPrice', label: 'سعر الجرام' },
  { key: 'workPrice', label: 'سعر اليد' },
  { key: 'total', label: 'الإجمالي' },
  { key: 'notes', label: 'ملاحظات' },
];

const RegularOrderInvoiceTab: React.FC = () => {
  const [orders, setOrders] = useState<StoredInvoice[]>(getInvoices());
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('فاتورة عادية');
  const [headerMode, setHeaderMode] = useState<'custom' | 'sales'>('custom');
  const [headerCustomerLabel, setHeaderCustomerLabel] = useState('اسم العميل');
  const [headerInvoiceLabel, setHeaderInvoiceLabel] = useState('رقم الفاتورة المرتبطة');
  const [headerDateLabel, setHeaderDateLabel] = useState('التاريخ');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(REGULAR_ORDER_COLUMNS.map(column => column.key));
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(
    Object.fromEntries(REGULAR_ORDER_COLUMNS.map(column => [column.key, column.label]))
  );
  const [sumColumns, setSumColumns] = useState(['pieces', 'pureW', 'totalW', 'withGems', 'stoneW', 'gemW', 'gemCount', 'total']);
  const [visibleBreakdown, setVisibleBreakdown] = useState<Record<string, boolean>>({
    weight_pure: true,
    weight_with_stones: true,
    stones_weight: true,
    gems_weight: true,
    gems_count: true,
    metal_value: true,
    stones_value: true,
    gems_value: true,
    workmanship: true,
    added_weight: true,
    manual_gems: true,
    manual_stones: true,
    other_additions: true,
  });
  const [notes, setNotes] = useState('');
  const breakdownLabels: Record<string, string> = {
    weight_pure: 'وزن الذهب الصافي', weight_with_stones: 'وزن الذهب بالأحجار', weight_with_gems: 'وزن الذهب بالجوهر',
    stones_weight: 'وزن الأحجار', gems_weight: 'وزن الجوهر', gems_count: 'عدد المجارات', metal_value: 'قيمة المعدن',
    stones_value: 'قيمة الأحجار', gems_value: 'قيمة الجوهر', workmanship: 'قيمة المصنعية', added_weight: 'الوزن المضاف',
    manual_gems: 'جوهر مضاف يدوياً', manual_stones: 'أحجار مضافة يدوياً', other_additions: 'إضافات أخرى',
  };
  const selectedOrder = orders.find(order => order.id === selectedOrderId) || null;
  const orderItems = selectedOrder?.items || [];
  const totalAmount = orderItems.reduce((sum, item) => sum + ((item.workmanship || 0) * (Number(item.weight) || 0)), 0)
    + (selectedOrder?.manual_gems || 0) + (selectedOrder?.manual_stones || 0) + (selectedOrder?.other_add_value || 0);

  useEffect(() => {
    void restoreGoldOrdersFromServer().then(() => setOrders(getInvoices()));
  }, []);

  const selectOrder = (orderId: string) => {
    const order = orders.find(item => item.id === orderId);
    setSelectedOrderId(orderId);
    if (!order) return;
    setInvoiceNumber(`SALE-${order.invoice_number}`);
  };

  const buildRegularOrderData = () => {
    if (!selectedOrder) return null;
    return {
      order_number: invoiceNumber || `SALE-${selectedOrder.invoice_number}`,
      receipt_number: selectedOrder.receipt_number,
      customer_name: selectedOrder.customer_name,
      customer_title: selectedOrder.customer_title,
      delivery_date: selectedOrder.delivery_date,
      seller_name: selectedOrder.seller_name,
      created_at: new Date().toISOString(),
      items: orderItems.map((item, index) => ({
        serial: index + 1,
        description: item.description,
        metal_type: item.metal_type,
        karat: item.karat,
        weight_pure: item.weight,
        workmanship_per_gram: item.workmanship,
        weight_with_stones: item.weight_with_stones,
        weight_with_gems: item.weight_with_gems,
        stone_weight: item.stone_weight,
        gem_weight: item.gem_weight,
        total: item.total,
        invoice_total: (item.workmanship || 0) * (Number(item.weight) || 0),
        notes: item.notes,
        pieces_count: item.pieces_count,
        gold_price: item.gold_price,
        value_stones: item.value_stones,
        value_gems: item.value_gems,
        stone_count: item.stone_count,
        gem_count: item.gem_count,
        total_weight: item.total_weight,
      })),
      total_amount: totalAmount,
      total_weight: selectedOrder.total_weight,
      total_workmanship: selectedOrder.total_workmanship,
      total_stones_value: selectedOrder.total_stones_value,
      total_gems_value: selectedOrder.total_gems_value,
      total_metal_value: selectedOrder.total_metal_value,
      received_weight: selectedOrder.received_weight,
      remaining_weight: selectedOrder.remaining_weight,
      other_add_desc: selectedOrder.other_add_desc,
      other_add_value: selectedOrder.other_add_value,
      manual_gems: selectedOrder.manual_gems,
      manual_stones: selectedOrder.manual_stones,
      visibleBreakdown,
      sum_columns: sumColumns,
      invoice_title: headerMode === 'sales' ? 'فاتورة مبيعات' : invoiceTitle,
      column_labels: columnLabels,
      invoice_total: totalAmount,
      header_mode: headerMode,
      header_customer_label: headerMode === 'sales' ? 'اسم العميل' : headerCustomerLabel,
      header_invoice_label: headerMode === 'sales' ? 'رقم الفاتورة' : headerInvoiceLabel,
      header_date_label: headerMode === 'sales' ? 'التاريخ' : headerDateLabel,
      invoice_notes: notes,
    };
  };

  const saveRegularOrderInvoice = () => {
    if (!selectedOrder || !invoiceNumber.trim()) return;
    saveOrderRegularInvoice({
      invoice_number: invoiceNumber.trim(),
      source_invoice_id: selectedOrder.id,
      source_order_number: selectedOrder.invoice_number,
      receipt_number: selectedOrder.receipt_number,
      customer_name: selectedOrder.customer_name,
      seller_name: selectedOrder.seller_name,
      delivery_date: selectedOrder.delivery_date,
      items: orderItems,
      total_amount: totalAmount,
      visible_columns: visibleColumns,
      column_labels: columnLabels,
      sum_columns: sumColumns,
      visible_breakdown: visibleBreakdown,
      invoice_title: headerMode === 'sales' ? 'فاتورة مبيعات' : invoiceTitle,
      header_mode: headerMode,
      header_customer_label: headerMode === 'sales' ? 'اسم العميل' : headerCustomerLabel,
      header_invoice_label: headerMode === 'sales' ? 'رقم الفاتورة' : headerInvoiceLabel,
      header_date_label: headerMode === 'sales' ? 'التاريخ' : headerDateLabel,
      notes,
      invoice_link_key: `order-regular:${selectedOrder.id}:${selectedOrder.invoice_number}`,
      created_at: new Date().toISOString(),
    });
    notificationSystem.success('تم الحفظ', 'تم حفظ الفاتورة العادية وربطها بفاتورة الطلبية');
  };

  const printRegularOrderInvoice = async () => {
    const data = buildRegularOrderData();
    if (!data) return;
    await printOrderInvoice(data, 'A4', 'landscape', visibleColumns);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><FileText className="w-5 h-5" /> إنشاء فاتورة عادية من فاتورة الطلبية</h3>
        <p className="text-sm text-gray-400">هذه الفاتورة مستقلة عن مبيعات المخزن، ومربوطة مباشرة بسجل فاتورة الطلبية المختار.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">فاتورة الطلبية المصدر *</label>
            <select value={selectedOrderId} onChange={event => selectOrder(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
              <option value="">اختر فاتورة طلبية</option>
              {orders.map(order => <option key={order.id} value={order.id}>{order.invoice_number} - {order.customer_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">عنوان الفاتورة</label>
            <input value={invoiceTitle} onChange={event => setInvoiceTitle(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">رقم الفاتورة العادية *</label>
            <input value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
        </div>
        {selectedOrder && <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">مرتبط بالطلبية: <b>{selectedOrder.invoice_number}</b> | الإيصال: <b>{selectedOrder.receipt_number || '-'}</b> | العميل: <b>{selectedOrder.customer_name}</b></div>}
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <h4 className="font-bold text-yellow-400">رأس الفاتورة</h4>
          <div className="flex gap-4 text-sm text-gray-300">
            <label><input type="radio" checked={headerMode === 'custom'} onChange={() => setHeaderMode('custom')} /> رأس مخصص</label>
            <label><input type="radio" checked={headerMode === 'sales'} onChange={() => setHeaderMode('sales')} /> فاتورة مبيعات فقط</label>
          </div>
          {headerMode === 'custom' && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm text-gray-400">عنوان جهة العميل<input value={headerCustomerLabel} onChange={event => setHeaderCustomerLabel(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1" /></label>
            <label className="text-sm text-gray-400">عنوان الرقم<input value={headerInvoiceLabel} onChange={event => setHeaderInvoiceLabel(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1" /></label>
            <label className="text-sm text-gray-400">عنوان التاريخ<input value={headerDateLabel} onChange={event => setHeaderDateLabel(event.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1" /></label>
          </div>}
        </div>
      </div>

      {selectedOrder && <>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h4 className="font-bold text-yellow-400">أعمدة الفاتورة</h4>
          <div className="flex flex-wrap gap-2">
            {REGULAR_ORDER_COLUMNS.map(column => <label key={column.key} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded text-sm"><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={column.key === 'total'} onChange={() => column.key !== 'total' && setVisibleColumns(previous => previous.includes(column.key) ? previous.filter(key => key !== column.key) : [...previous, column.key])} />{column.label}</label>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REGULAR_ORDER_COLUMNS.filter(column => visibleColumns.includes(column.key)).map(column => <label key={column.key} className="text-sm text-gray-400">اسم العمود {column.label}<input value={columnLabels[column.key] || ''} onChange={event => setColumnLabels(previous => ({ ...previous, [column.key]: event.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1" /></label>)}
          </div>
          <h4 className="font-bold text-yellow-400">الأعمدة التي يتم جمعها</h4>
          <div className="flex flex-wrap gap-2">{REGULAR_ORDER_COLUMNS.filter(column => ['pieces', 'pureW', 'totalW', 'withGems', 'stoneW', 'gemW', 'gemCount', 'goldPrice', 'workPrice', 'total'].includes(column.key)).map(column => <label key={column.key} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded text-sm"><input type="checkbox" checked={sumColumns.includes(column.key)} onChange={() => setSumColumns(previous => previous.includes(column.key) ? previous.filter(key => key !== column.key) : [...previous, column.key])} />جمع {column.label}</label>)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h4 className="font-bold text-yellow-400">البيانات الظاهرة أسفل الفاتورة</h4>
          <div className="flex flex-wrap gap-2">{Object.keys(visibleBreakdown).map(key => <label key={key} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded text-sm"><input type="checkbox" checked={visibleBreakdown[key]} onChange={() => setVisibleBreakdown(previous => ({ ...previous, [key]: !previous[key] }))} />{breakdownLabels[key] || key}</label>)}</div>
          <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="ملاحظات تظهر في تفاصيل الفاتورة" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" rows={3} />
          <div className="flex gap-3"><button onClick={saveRegularOrderInvoice} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded"><FileText className="w-4 h-4" /> حفظ الفاتورة وربطها</button><button onClick={printRegularOrderInvoice} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded"><Printer className="w-4 h-4" /> طباعة</button></div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-sm text-gray-300">الفواتير العادية المحفوظة من الطلبيات: <b className="text-green-400">{getOrderRegularInvoices().length}</b> | الإجمالي المتوقع: <b className="text-yellow-400">{formatNumber(totalAmount)} د.ل</b></div>
      </>}
    </div>
  );
};

// ===================== MAIN PAGE =====================
const GoldOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'invoice' | 'regular'>('receipt');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400">طلبيات ذهب وسبائك</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'receipt'
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Receipt className="w-5 h-5" /> إيصال استلام
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'invoice'
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" /> فاتورة تصنيع
        </button>
        <button
          onClick={() => setActiveTab('regular')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'regular'
              ? 'bg-green-500 text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" /> إنشاء فاتورة عادية للطلبية
        </button>
      </div>

      {activeTab === 'receipt' ? <ReceiptTab /> : activeTab === 'invoice' ? <InvoiceTab /> : <RegularOrderInvoiceTab />}
    </div>
  );
};

export default GoldOrdersPage;
