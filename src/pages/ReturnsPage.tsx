import React, { useState, useEffect } from 'react';
import { Plus, X, Printer, AlertTriangle, CheckCircle, RotateCcw, Search } from 'lucide-react';
import { getReturns, addReturn, updateReturnStatus, processReturn, Return } from '../services/returns';
import { getPermissions } from '../services/permissions';
import { formatNumber, formatCurrency, supabase, isSupabaseAvailable } from '../services/supabase';

interface InvoiceItem {
  item_code: string;
  model_name: string;
  karat: string;
  weight: number;
  price: number;
  quantity: number;
  total: number;
}

interface SavedInvoice {
  invoice_number: string;
  customer_name: string;
  items: InvoiceItem[];
  total_amount: number;
  created_at: string;
}

const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnType, setReturnType] = useState<'full' | 'partial'>('partial');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const permissions = getPermissions();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReturns();
  }, [searchTerm, returns]);

  const loadData = async () => {
    const savedReturns = getReturns();
    setReturns(savedReturns);
    
    // Load invoices from Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('sale_invoices')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          localStorage.setItem('saved_invoices', JSON.stringify(data));
          setInvoices(data);
          return;
        }
      } catch (e) {
        console.log('Supabase error, using cache:', e);
      }
    }
    
    // Fallback to localStorage cache
    const localInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
    setInvoices(localInvoices);
  };

  const filterReturns = () => {
    if (!searchTerm.trim()) {
      setFilteredReturns(returns);
      return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = returns.filter(r =>
      r.invoice_number?.toLowerCase().includes(searchLower) ||
      r.customer_name?.toLowerCase().includes(searchLower)
    );
    setFilteredReturns(filtered);
  };

  const getSelectedInvoiceData = () => {
    return invoices.find(inv => inv.invoice_number === selectedInvoice) || null;
  };

  const handleSubmit = () => {
    if (!selectedInvoice) {
      alert('يرجى اختيار فاتورة');
      return;
    }
    if (returnType === 'partial' && selectedItems.length === 0) {
      alert('يرجى اختيار القطع المراد إرجاعها');
      return;
    }
    if (!reason.trim()) {
      alert('يرجى إدخال سبب المرتجع');
      return;
    }

    const invoice = getSelectedInvoiceData();
    if (!invoice) return;

    const itemsToReturn = returnType === 'full'
      ? []
      : selectedItems.map(index => ({
          item_code: invoice.items[index].item_code,
          model_name: invoice.items[index].model_name,
          weight: invoice.items[index].weight,
          price: invoice.items[index].price,
          quantity: invoice.items[index].quantity,
          reason,
        }));

    processReturn(selectedInvoice, itemsToReturn, reason, returnType);

    setShowModal(false);
    setSelectedInvoice('');
    setSelectedItems([]);
    setReturnType('partial');
    setReason('');
    setNotes('');
    loadData();
    alert('تم إنشاء المرتجع وتسجيل القيد المحاسبي بنجاح');
  };

  const handleApprove = (id: string) => {
    if (!confirm('هل تريد تأكيد هذا المرتجع؟')) return;
    updateReturnStatus(id, 'approved');
    loadData();
  };

  const handleReject = (id: string) => {
    if (!confirm('هل تريد رفض هذا المرتجع؟')) return;
    updateReturnStatus(id, 'rejected');
    loadData();
  };

  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getStatusBadge = (status: Return['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">قيد المراجعة</span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600/20 text-green-400 border border-green-600/30">تم التأكيد</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30">مرفوض</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalReturns = returns.reduce((sum, r) => sum + r.total_amount, 0);
  const pendingReturns = returns.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
          <RotateCcw className="w-8 h-8 text-gray-900" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">المرتجعات</h1>
          <p className="text-gray-400">إدارة مرتجعات المبيعات وإعادة المخزون</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-3">
          <div className="bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
            <p className="text-gray-400 text-xs">إجمالي المرتجعات</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(totalReturns)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
            <p className="text-gray-400 text-xs">قيد المراجعة</p>
            <p className="text-lg font-bold text-yellow-400">{pendingReturns}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
            <p className="text-gray-400 text-xs">إجمالي المرتجعات</p>
            <p className="text-lg font-bold text-white">{returns.length}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          إضافة مرتجع جديد
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم الفاتورة أو اسم العميل..."
            className="w-full bg-gray-800 border border-gray-700 text-white px-12 py-4 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
          />
        </div>
      </div>

      {filteredReturns.length === 0 ? (
        <div className="bg-gray-800/80 rounded-2xl p-12 text-center border border-gray-700">
          <RotateCcw className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">لا توجد مرتجعات</p>
          <p className="text-gray-500 text-sm mt-2">قم بإضافة مرتجع جديد من زر "إضافة مرتجع جديد"</p>
        </div>
      ) : (
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/80">
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">التاريخ</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">رقم الفاتورة</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">العميل</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">النوع</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">المبلغ</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">الحالة</th>
                <th className="py-4 px-6 text-right text-yellow-400 font-bold text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-all">
                  <td className="py-4 px-6 text-white text-sm">{formatDate(ret.return_date)}</td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-yellow-400 font-bold text-sm">{ret.invoice_number}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-sm">{ret.customer_name || 'عميل غير محدد'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      ret.type === 'full'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-purple-600/20 text-purple-400'
                    }`}>
                      {ret.type === 'full' ? 'كامل' : 'جزئي'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-red-400 font-bold text-sm">{formatCurrency(ret.total_amount)}</td>
                  <td className="py-4 px-6">{getStatusBadge(ret.status)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {ret.status === 'pending' && (permissions.canReturns || permissions.role === 'admin') && (
                        <>
                          <button
                            onClick={() => handleApprove(ret.id)}
                            className="p-2 bg-green-600/20 rounded-lg hover:bg-green-600/40 transition-all"
                            title="تأكيد"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={() => handleReject(ret.id)}
                            className="p-2 bg-red-600/20 rounded-lg hover:bg-red-600/40 transition-all"
                            title="رفض"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          const html = `<!DOCTYPE html><html lang="en" dir="rtl"><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;direction:rtl}h1{text-align:center;margin-bottom:20px;color:#333}.info{margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:8px}.table{width:100%;border-collapse:collapse;margin-bottom:20px}.table th{background:#333;color:white;padding:10px;text-align:right}.table td{border-bottom:1px solid #ddd;padding:8px}.status{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold}.pending{background:#fef3c7;color:#92400e}.approved{background:#d1fae5;color:#065f46}.rejected{background:#fee2e2;color:#991b1b}</style></head><body><h1>إيصال مرتجع</h1><div class="info"><p><strong>رقم الفاتورة:</strong> ${ret.invoice_number}</p><p><strong>العميل:</strong> ${ret.customer_name}</p><p><strong>التاريخ:</strong> ${new Date(ret.return_date).toLocaleDateString('en-US')}</p><p><strong>النوع:</strong> ${ret.type === 'full' ? 'كامل' : 'جزئي'}</p><p><strong>السبب:</strong> ${ret.notes}</p></div><table class="table"><thead><tr><th>كود القطعة</th><th>الموديل</th><th>الوزن</th><th>السعر</th><th>الكمية</th></tr></thead><tbody>${ret.items.map(item => `<tr><td>${item.item_code}</td><td>${item.model_name}</td><td>${item.weight}</td><td>${item.price}</td><td>${item.quantity}</td></tr>`).join('')}</tbody></table><p style="font-size:18px;font-weight:bold;text-align:left;color:#dc2626">الإجمالي: ${formatCurrency(ret.total_amount)}</p><p style="text-align:center;margin-top:30px;color:#666">المحل: مجوهرات الحمروني</p></body></html>`;
                          printWindow.document.write(html);
                          printWindow.document.close();
                          printWindow.onload = () => printWindow.print();
                        }}
                        className="p-2 bg-gray-600/20 rounded-lg hover:bg-gray-600/40 transition-all"
                        title="طباعة"
                      >
                        <Printer className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-600">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <RotateCcw className="w-6 h-6" />
                إضافة مرتجع جديد
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">اختر الفاتورة</label>
                <select
                  value={selectedInvoice}
                  onChange={(e) => {
                    setSelectedInvoice(e.target.value);
                    setSelectedItems([]);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
                >
                  <option value="">-- اختر فاتورة --</option>
                  {invoices.map((inv) => (
                    <option key={inv.invoice_number} value={inv.invoice_number}>
                      {inv.invoice_number} - {inv.customer_name || 'عميل'} - {formatCurrency(inv.total_amount)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-3">نوع المرتجع</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setReturnType('full');
                        setSelectedItems([]);
                      }}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                        returnType === 'full'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      مرتجع كامل
                    </button>
                    <button
                      onClick={() => setReturnType('partial')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                        returnType === 'partial'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      مرتجع جزئي
                    </button>
                  </div>
                </div>
              )}

              {selectedInvoice && returnType === 'partial' && getSelectedInvoiceData() && (
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-3">اختر القطع المراد إرجاعها</label>
                  <div className="bg-gray-700/50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    {getSelectedInvoiceData()?.items.map((item, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedItems.includes(index)
                            ? 'bg-yellow-600/20 border border-yellow-600/50'
                            : 'bg-gray-700/30 border border-transparent hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(index)}
                          onChange={() => toggleItemSelection(index)}
                          className="w-4 h-4 accent-yellow-500"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">{item.model_name || item.item_code}</p>
                          <p className="text-gray-400 text-xs">{item.item_code} - {item.karat} عيار - {item.weight}غ</p>
                        </div>
                        <span className="text-yellow-400 font-bold text-sm">{formatCurrency(item.total)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">سبب المرتجع</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: عيب في الصنف، رغبة العميل..."
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 transition-all resize-none"
                />
              </div>

              {selectedInvoice && (
                <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                  <p className="text-gray-400 text-xs mb-1">المبلغ الإجمالي للمرتجع</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(
                      returnType === 'full'
                        ? (getSelectedInvoiceData()?.total_amount || 0)
                        : selectedItems.reduce((sum, idx) => {
                            const inv = getSelectedInvoiceData();
                            return sum + (inv?.items[idx]?.total || 0);
                          }, 0)
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-700 flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                تأكيد المرتجع
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 rounded-xl transition-all"
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

export default ReturnsPage;
