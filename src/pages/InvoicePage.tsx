import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Home, CheckCircle, Edit2, Save } from 'lucide-react';
import { SaleInvoice } from '../services/supabase';
import { DEFAULT_INVOICE_PRINT_CONFIG, InvoiceColumnId, InvoicePrintConfig, printInvoice } from '../services/invoiceTemplate';
import { numberToArabicWords } from '../utils/arabic';

const InvoicePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SaleInvoice | null>(null);
  const [printed, setPrinted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [printPageSize, setPrintPageSize] = useState('A5');
  const [printOrientation, setPrintOrientation] = useState('portrait');
  const [printConfig, setPrintConfig] = useState<InvoicePrintConfig>(() => {
    try {
      const saved = localStorage.getItem('invoice_print_config');
      return saved ? { ...DEFAULT_INVOICE_PRINT_CONFIG, ...JSON.parse(saved), columnLabels: { ...DEFAULT_INVOICE_PRINT_CONFIG.columnLabels, ...JSON.parse(saved).columnLabels } } : DEFAULT_INVOICE_PRINT_CONFIG;
    } catch {
      return DEFAULT_INVOICE_PRINT_CONFIG;
    }
  });

  const columnOptions: { id: InvoiceColumnId; label: string }[] = [
    { id: 'serial', label: '#' }, { id: 'item', label: 'الصنف' }, { id: 'code', label: 'الكود' },
    { id: 'karat', label: 'العيار' }, { id: 'weight', label: 'الوزن' }, { id: 'quantity', label: 'العدد' },
    { id: 'unit_price', label: 'السعر' }, { id: 'total', label: 'الإجمالي' }, { id: 'notes', label: 'ملاحظات' },
  ];

  const updatePrintConfig = (patch: Partial<InvoicePrintConfig>) => {
    setPrintConfig(current => {
      const next = { ...current, ...patch };
      localStorage.setItem('invoice_print_config', JSON.stringify(next));
      return next;
    });
  };

  const toggleColumn = (column: InvoiceColumnId) => {
    const columns = printConfig.columns.includes(column)
      ? printConfig.columns.filter(item => item !== column)
      : [...printConfig.columns, column];
    if (columns.length > 0) updatePrintConfig({ columns });
  };

  useEffect(() => {
    if (location.state?.invoice) {
      setInvoice(location.state.invoice);
    } else {
      navigate('/sales');
    }
  }, [location.state, navigate]);

  const handlePrint = () => {
    if (!invoice) return;
    printInvoice({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      items: invoice.items,
      total_amount: invoice.total_amount,
      seller_name: invoice.seller_name,
      created_at: invoice.created_at,
      invoice_type: 'final',
      payment_method: invoice.payment_method,
      transfer_number: (invoice as any).transfer_number,
      bank_name: (invoice as any).bank_name,
      card_receipt_number: (invoice as any).card_receipt_number,
      card_receipt_date: (invoice as any).card_receipt_date,
      print_config: printConfig,
    }, printPageSize, printOrientation);
    setPrinted(true);
  };

  const handleNewSale = () => {
    navigate('/sales');
  };

  const startEditing = () => {
    if (!invoice) return;
    setEditCustomerName(invoice.customer_name || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!invoice) return;
    const updated = { ...invoice, customer_name: editCustomerName };
    const allInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
    const index = allInvoices.findIndex((inv: SaleInvoice) => inv.invoice_number === invoice.invoice_number);
    if (index !== -1) {
      allInvoices[index] = updated;
      localStorage.setItem('saved_invoices', JSON.stringify(allInvoices));
    }
    setInvoice(updated);
    setIsEditing(false);
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" id="invoice-container">
      {/* أزرار التحكم */}
      <div className="print:hidden grid gap-4 mb-6">
        {!printed ? (
          <>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-white">
              <h2 className="font-bold text-yellow-400 mb-3">إعداد فاتورة حسب الطلب</h2>
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <label className="text-sm">عنوان الفاتورة
                  <input value={printConfig.title} onChange={e => updatePrintConfig({ title: e.target.value })} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
                </label>
                <label className="text-sm">اسم التوقيع
                  <input value={printConfig.signatureName} onChange={e => updatePrintConfig({ signatureName: e.target.value })} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
                </label>
                <label className="text-sm">صفة التوقيع
                  <input value={printConfig.signatureTitle} onChange={e => updatePrintConfig({ signatureTitle: e.target.value })} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
                </label>
                <label className="text-sm">ملاحظات آخر الفاتورة
                  <textarea value={printConfig.notes} onChange={e => updatePrintConfig({ notes: e.target.value })} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" rows={2} placeholder="تظهر في آخر الفاتورة" />
                </label>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={printConfig.showTotal} onChange={e => updatePrintConfig({ showTotal: e.target.checked })} /> إظهار الإجمالي</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={printConfig.showWeight} onChange={e => updatePrintConfig({ showWeight: e.target.checked })} /> إظهار إجمالي الوزن</label>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {columnOptions.map(column => {
                  const selected = printConfig.columns.includes(column.id);
                  return <div key={column.id} className="flex items-center gap-2">
                    <label className="flex items-center gap-2 min-w-24"><input type="checkbox" checked={selected} onChange={() => toggleColumn(column.id)} /> {column.label}</label>
                    {selected && <input value={printConfig.columnLabels[column.id] || ''} onChange={e => updatePrintConfig({ columnLabels: { ...printConfig.columnLabels, [column.id]: e.target.value } })} className="flex-1 min-w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" placeholder="عنوان الطباعة" />}
                  </div>;
                })}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">حجم الورقة</label>
                  <select value={printPageSize} onChange={(e) => setPrintPageSize(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm">
                    <option value="A5">A5</option>
                    <option value="A4">A4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">اتجاه الطباعة</label>
                  <select value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm">
                    <option value="portrait">عمودي</option>
                    <option value="landscape">أفقي</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:from-yellow-700 hover:to-yellow-600 transition-all"
            >
              <Printer className="w-6 h-6" />
              طباعة وحفظ الفاتورة
            </button>
            <button
              onClick={handleNewSale}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <ArrowRight className="w-6 h-6" />
              بيع جديد
            </button>
          </>
        ) : (
          <button
            onClick={handleNewSale}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle className="w-6 h-6" />
            تم البيع بنجاح - بيع جديد
          </button>
        )}
      </div>

      {/* الفاتورة */}
      <div className="bg-white text-gray-900 shadow-2xl overflow-hidden print:shadow-none" id="invoice">
        {/* الهيدر */}
        <div className="text-center p-4">
          <img src="/logo1.png" alt="الحمروني" className="w-20 h-20 mx-auto mb-1 rounded-full border-2 border-gray-300" />
          <h1 className="text-2xl font-black text-gray-900 tracking-wide">مجوهرات الحمروني</h1>
          <p className="text-[10px] text-gray-600">للمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ.م.م)</p>
        </div>

        {/* التاريخ ورقم الفاتورة */}
        <div className="flex justify-between items-center mb-2 text-[10px] px-4">
          <div><span className="font-bold">التاريخ: </span><span className="border-b border-gray-400 px-2">{new Date(invoice.created_at).getFullYear()} / {String(new Date(invoice.created_at).getMonth()+1).padStart(2,'0')} / {String(new Date(invoice.created_at).getDate()).padStart(2,'0')}</span></div>
          <div><span className="font-bold">فاتورة تفصيلية رقم: </span><span className="text-red-600 font-bold text-sm font-mono">{invoice.invoice_number}</span></div>
        </div>

        {/* السيد */}
        <div className="mb-3 text-[10px] px-4">
          <span className="font-bold">السيد: </span>
          {isEditing ? (
            <span className="inline-flex items-center gap-1">
              <input
                type="text"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="border border-blue-400 rounded px-2 py-1 text-[10px] font-bold w-48"
                placeholder="اسم العميل"
                autoFocus
              />
              <button onClick={saveEdit} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                <Save className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditing(false)} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
                ✕
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="border-b border-gray-400 px-4 font-bold">{invoice.customer_name || '─────────────────────────────'}</span>
              <button onClick={startEditing} className="p-1 text-blue-500 hover:text-blue-700" title="تعديل اسم العميل">
                <Edit2 className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="border-t-2 border-gray-900 mx-4 mb-0"></div>

        {/* جدول القطع */}
        <div className="px-4">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-1.5 px-1 text-right font-bold border-l border-gray-900 w-[22%]">الصنف</th>
                <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900 w-[10%]">العيار</th>
                <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900 w-[15%]">العدد/الوزن<br/>(جـرام)</th>
                <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900 w-[15%]">السعر<br/>(د.ل)</th>
                <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900 w-[18%]">الكمية<br/>(د.ل)</th>
                <th className="py-1.5 px-1 text-center font-bold w-[20%]">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-1.5 px-1 border-l border-gray-300 text-right">{item.model_name || item.category || '────'}</td>
                  <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">{item.karat || '21'}</td>
                  <td className="py-1.5 px-1 text-center border-l border-gray-300">{(item.weight || 0).toFixed(2)}</td>
                  <td className="py-1.5 px-1 text-center border-l border-gray-300">{item.price_per_gram ? Number(item.price_per_gram).toLocaleString('en-US') : ((item.total || 0) / ((item.weight || 1) * (item.quantity || 1))).toFixed(2)}</td>
                  <td className="py-1.5 px-1 text-center border-l border-gray-300">{(item.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-1.5 px-1 text-center"></td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 6 - (invoice.items?.length || 0)) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-300 h-7">
                  <td className="border-l border-gray-300"></td><td className="border-l border-gray-300"></td><td className="border-l border-gray-300"></td>
                  <td className="border-l border-gray-300"></td><td className="border-l border-gray-300"></td><td></td>
                </tr>
              ))}
              <tr className="border-b border-gray-300">
                <td colSpan={4} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">اجمالي الفاتورة:</td>
                <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">{invoice.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td colSpan={4} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">إجمالي الوزن (غ):</td>
                <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">
                  {invoice.items.reduce((sum, it) => sum + (it.weight || 0) * (it.quantity || 1), 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* بالحروف */}
        <div className="mx-4 mt-3 text-[10px] border border-gray-400 p-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">بالحروف:</span>
            <span className="font-bold text-gray-800">{invoice.total_amount > 0 ? numberToArabicWords(invoice.total_amount) : 'صفر'}</span>
          </div>
        </div>

        {/* التوقيعات */}
        <div className="mx-4 mt-4 text-[10px]">
          <div className="flex justify-between">
            <div className="text-center"><div className="border-t border-gray-400 w-32 mt-6"></div><p className="text-[9px] text-gray-600">توقيع العميل</p></div>
            <div className="text-center"><div className="border-t border-gray-400 w-32 mt-6"></div><p className="text-[9px] text-gray-600">يعتمد المدير العام</p></div>
          </div>
        </div>

        <div className="border-t-2 border-gray-900 mx-4 mt-4 mb-2"></div>

        {/* الفوتر */}
        <div className="mx-4 text-[8px] text-gray-600 flex justify-between pb-3">
          <div className="text-right"><p>الهاتف: +218912133218</p><p>البريد: osama_hamruni@yahoo.com</p></div>
          <div className="text-center"><p>ف.ت. {invoice.invoice_number}</p></div>
          <div className="text-left"><p>العنوان: ليبيا - طرابلس - شارع جرابة</p></div>
        </div>
      </div>

      {/* أزرار ما بعد الطباعة */}
      {printed && (
        <div className="mt-6 flex gap-4 print:hidden">
          <button onClick={() => handlePrint()} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            <Printer className="w-6 h-6" /> طباعة أخرى
          </button>
          <button onClick={handleNewSale} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            <Home className="w-6 h-6" /> العودة للرئيسية
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicePage;