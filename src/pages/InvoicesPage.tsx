import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Eye, Printer, Calendar, User } from 'lucide-react';
import { SaleInvoice } from '../services/supabase';
import { numberToArabicWords } from '../utils/arabic';
import { getSystemSettings } from '../services/settings';
import { QRCodeSVG } from 'qrcode.react';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<SaleInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);

  const handlePrint = () => {
    const s = selectedInvoice;
    if (!s) return;

    const date = new Date(s.created_at);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const total = s.total_amount || 0;
    const words = total > 0 ? numberToArabicWords(total) : 'صفر';

    const rows = (s.items || []).map(it => `
      <tr>
        <td style="border:1px solid #333;padding:4px 6px;text-align:right;width:22%">${it.model_name || it.category || '----'}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:10%;font-weight:bold">${it.karat || '21'}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:15%">${(it.weight || 0).toFixed(2)}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:15%">${it.price_per_gram ? Number(it.price_per_gram).toLocaleString('en-US') : ((it.total || 0) / ((it.weight || 1) * (it.quantity || 1))).toFixed(2)}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:18%">${(it.total || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:20%"></td>
      </tr>`).join('');

    const emptyRows = Array.from({length: Math.max(0, 6 - (s.items?.length || 0))}).map(() => `
      <tr style="height:24px">
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
      </tr>`).join('');

    const qrSvg = document.querySelector('#invoice-print svg');
    const qrData = qrSvg ? qrSvg.outerHTML : '';

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة تفصيلية ${s.invoice_number}</title>
  <style>
    @page { size: A5 landscape; margin: 3mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
    body { margin: 0; padding: 5mm; font-family: Arial, sans-serif; color: #000; background: #fff; width: 190mm; }
    table { width: 100%; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>

  <!-- الهيدر -->
  <div style="text-align:center;margin-bottom:8px">
    <img src="/logo.png" style="width:70px;height:70px;border-radius:50%;border:2px solid #ccc" />
    <div style="font-size:18px;font-weight:900;letter-spacing:0.05em;margin:4px 0">مجوهرات الحمروني</div>
    <div style="font-size:9px;color:#555">لإستيراد الحُليّ والمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ-م-م)</div>
    <div style="margin:4px auto">${qrData}</div>
  </div>

  <!-- التاريخ ورقم الفاتورة -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:10px">
    <div><b>التاريخ: </b><span style="border-bottom:1px solid #999;padding:0 6px">${year} / ${month} / ${day}</span></div>
    <div><b>فاتورة تفصيلية رقم: </b><span style="color:#dc2626;font-weight:bold;font-size:12px;font-family:monospace">${s.invoice_number}</span></div>
  </div>

  <!-- السيد -->
  <div style="margin-bottom:8px;font-size:10px">
    <b>السيد: </b><span style="border-bottom:1px solid #999;padding:0 12px;font-weight:bold">${s.customer_name || '─────────────────────────────'}</span>
  </div>

  <!-- خط فاصل -->
  <div style="border-top:2px solid #000;margin-bottom:2px"></div>

  <!-- جدول القطع -->
  <table>
    <thead>
      <tr style="border-bottom:2px solid #000">
        <th style="border:1px solid #333;padding:5px 6px;text-align:right;width:22%;font-weight:bold">الصنف</th>
        <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:10%;font-weight:bold">العيار</th>
        <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:15%;font-weight:bold">العدد/الوزن<br>(جـرام)</th>
        <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:15%;font-weight:bold">السعر<br>(د.ل)</th>
        <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:18%;font-weight:bold">الكمية<br>(د.ل)</th>
        <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:20%;font-weight:bold">ملاحظات</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${emptyRows}
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">اجمالي الفاتورة:</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">${total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="border:1px solid #333"></td>
      </tr>
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">المدة /نوع:</td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
      </tr>
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">الرسوم:</td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
      </tr>
    </tbody>
  </table>

  <!-- بالحروف -->
  <div style="margin-top:8px;font-size:10px;border:1px solid #999;padding:5px 8px">
    <b>بالحروف: </b><b style="color:#1f2937">${words}</b>
  </div>

  <!-- التوقيعات -->
  <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:10px">
    <div style="text-align:center">
      <div style="border-top:1px solid #999;width:120px;margin-top:20px"></div>
      <div style="font-size:9px;color:#555">توقيع العميل</div>
    </div>
    <div style="text-align:center">
      <div style="border-top:1px solid #999;width:120px;margin-top:20px"></div>
      <div style="font-size:9px;color:#555">يعتمد المدير العام</div>
    </div>
  </div>

  <!-- خط فاصل -->
  <div style="border-top:2px solid #000;margin:12px 0 6px"></div>

  <!-- الفوتر -->
  <div style="display:flex;justify-content:space-between;font-size:8px;color:#555">
    <div style="text-align:right">
      <div>الهاتف: +218912133218</div>
      <div>البريد الإلكتروني: osama_hamruni@yahoo.com</div>
    </div>
    <div style="text-align:center">
      <div>ف.ت. ${s.invoice_number}</div>
    </div>
    <div style="text-align:left">
      <div>العنوان: ليبيا - طرابلس - شارع جرابة</div>
    </div>
  </div>

</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };

  const loadInvoices = useCallback(() => {
    try {
      setLoading(true);
      const localData = localStorage.getItem('saved_invoices');
      if (localData) {
        const localInvoices = JSON.parse(localData);
        setInvoices(localInvoices);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, invoices]);

  const filterInvoices = () => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer_name?.toLowerCase().includes(searchLower) ||
        invoice.seller_name?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInvoices(filtered);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalItems = (items: any[]) => {
    return items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-yellow-400 text-xl animate-pulse">جاري تحميل الفواتير...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
          <FileText className="w-8 h-8 text-gray-900" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">سجل الفواتير</h1>
          <p className="text-gray-400">جميع الفواتير المحفوظة للمراجعة</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم الفاتورة أو اسم العميل أو البائع..."
            className="w-full bg-gray-800 border border-gray-700 text-white px-12 py-4 rounded-xl focus:outline-none focus:border-yellow-500 transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">إجمالي الفواتير</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{invoices.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm">إجمالي المبيعات</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toLocaleString()} د.ل
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">هذا الشهر</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {invoices.filter(inv => {
              const date = new Date(inv.created_at);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">لا توجد فواتير</p>
          <p className="text-gray-500 text-sm mt-2">قم بعملية بيع لإضافة فاتورة جديدة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id || invoice.invoice_number}
              className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 hover:border-yellow-600/50 transition-all cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-400 font-mono">{invoice.invoice_number}</p>
                    <p className="text-gray-400 text-sm">
                      {invoice.customer_name || 'عميل غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">عدد القطع</p>
                    <p className="font-bold text-white">{getTotalItems(invoice.items)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">الإجمالي</p>
                    <p className="font-bold text-green-400">{(invoice.total_amount || 0).toLocaleString()} د.ل</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">التاريخ</p>
                    <p className="font-bold text-gray-300 text-sm">{formatDate(invoice.created_at)}</p>
                  </div>
                  <button className="p-2 bg-yellow-600/20 rounded-lg hover:bg-yellow-600/40 transition-all">
                    <Eye className="w-5 h-5 text-yellow-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const settings = getSystemSettings();
        const date = new Date(selectedInvoice.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const totalAmount = selectedInvoice.total_amount || 0;
        const totalInWords = totalAmount > 0 ? numberToArabicWords(totalAmount) : 'صفر';
        return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white text-gray-900 rounded max-w-[148mm] w-full max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-h-none print:overflow-visible" onClick={(e) => e.stopPropagation()}>

            {/* الفاتورة - نموذج ليبي أصلي */}
            <div id="invoice-print" className="p-4 print:p-0" dir="rtl">

              {/* الهيدر: الشعار في الوسط + الاسم */}
              <div className="text-center mb-3">
                <img src="/logo.png" alt="الحمروني" className="w-24 h-24 mx-auto mb-1 rounded-full border-2 border-gray-300" />
                <h1 className="text-2xl font-black text-gray-900 tracking-wide">مجوهرات الحمروني</h1>
                <p className="text-[10px] text-gray-600">لإستيراد الحُليّ والمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ-م-م)</p>
                <div className="mt-2 flex justify-center">
                  <QRCodeSVG
                    value={`INV-${selectedInvoice.invoice_number}-${totalAmount}-${selectedInvoice.customer_name || 'CASH'}`}
                    size={60}
                    bgColor="white"
                    fgColor="black"
                    level="M"
                  />
                </div>
              </div>

              {/* التاريخ ورقم الفاتورة */}
              <div className="flex justify-between items-center mb-2 text-[10px]">
                <div>
                  <span className="font-bold">التاريخ: </span>
                  <span className="border-b border-gray-400 px-2">{year} / {month} / {day}</span>
                </div>
                <div>
                  <span className="font-bold">فاتورة تفصيلية رقم: </span>
                  <span className="text-red-600 font-bold text-sm font-mono">{selectedInvoice.invoice_number}</span>
                </div>
              </div>

              {/* السيد / اسم العميل */}
              <div className="mb-3 text-[10px]">
                <span className="font-bold">السيد: </span>
                <span className="border-b border-gray-400 px-4 font-bold">{selectedInvoice.customer_name || '─────────────────────────────'}</span>
              </div>

              {/* خط فاصل */}
              <div className="border-t-2 border-gray-900 mb-0"></div>

              {/* جدول القطع */}
              <div>
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
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-1.5 px-1 border-l border-gray-300 text-right">
                          <span>{item.model_name || item.category || '────'}</span>
                        </td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">{item.karat || '21'}</td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">{(item.weight || 0).toFixed(2)}</td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">{item.price_per_gram ? Number(item.price_per_gram).toLocaleString('en-US') : ((item.total || 0) / ((item.weight || 1) * (item.quantity || 1))).toFixed(2)}</td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">{(item.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-1.5 px-1 text-center"></td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 6 - (selectedInvoice.items?.length || 0)) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-gray-300 h-7">
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td></td>
                      </tr>
                    ))}
                    {/* صف الإجمالي */}
                    <tr className="border-b border-gray-300">
                      <td colSpan={4} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">اجمالي الفاتورة:</td>
                      <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">{totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td></td>
                    </tr>
                    {/* المدة / النوع */}
                    <tr className="border-b border-gray-300">
                      <td colSpan={4} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">المدة /نوع:</td>
                      <td className="border-l border-gray-300"></td>
                      <td></td>
                    </tr>
                    {/* الرسوم */}
                    <tr className="border-b border-gray-300">
                      <td colSpan={4} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">الرسوم:</td>
                      <td className="border-l border-gray-300"></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* بالحروف - التفقيط */}
              <div className="mt-3 text-[10px] border border-gray-400 p-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold">بالحروف:</span>
                  <span className="font-bold text-gray-800">{totalInWords}</span>
                </div>
              </div>

              {/* التوقيعات */}
              <div className="mt-4 text-[10px]">
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32 mt-6"></div>
                    <p className="text-[9px] text-gray-600">توقيع العميل</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32 mt-6"></div>
                    <p className="text-[9px] text-gray-600">يعتمد المدير العام</p>
                  </div>
                </div>
              </div>

              {/* خط فاصل سفلي */}
              <div className="border-t-2 border-gray-900 mt-4 mb-2"></div>

              {/* الفوتر - معلومات الاتصال */}
              <div className="text-[8px] text-gray-600 flex justify-between">
                <div className="text-right">
                  <p>الهاتف: +218912133218</p>
                  <p>البريد الإلكتروني: osama_hamruni@yahoo.com</p>
                </div>
                <div className="text-center">
                  <p>ف.ت. {selectedInvoice.invoice_number}</p>
                </div>
                <div className="text-left">
                  <p>العنوان: ليبيا - طرابلس - شارع جرابة</p>
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="p-3 flex gap-3 bg-gray-100 border-t border-gray-200 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 rounded text-sm transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default InvoicesPage;