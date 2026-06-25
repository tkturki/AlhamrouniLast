import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Home, CheckCircle } from 'lucide-react';
import { SaleInvoice } from '../services/supabase';
import { numberToArabicWords } from '../utils/arabic';
import { getSystemSettings } from '../services/settings';
import { QRCodeSVG } from 'qrcode.react';

const InvoicePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SaleInvoice | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (location.state?.invoice) {
      setInvoice(location.state.invoice);
    } else {
      navigate('/sales');
    }
  }, [location.state, navigate]);

  const handlePrint = () => {
    if (!invoice) return;
    const s = getSystemSettings();
    const date = new Date(invoice.created_at);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const total = invoice.total_amount || 0;
    const words = total > 0 ? numberToArabicWords(total) : 'صفر';

    const rows = (invoice.items || []).map((it, i) => `
      <tr>
        <td style="border:1px solid #333;padding:4px 6px;text-align:right;width:22%">${it.model_name || it.category || '----'}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:10%;font-weight:bold">${it.karat || '21'}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:15%">${(it.weight || 0).toFixed(2)}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:15%">${it.price_per_gram ? Number(it.price_per_gram).toLocaleString('en-US') : ((it.total || 0) / ((it.weight || 1) * (it.quantity || 1))).toFixed(2)}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:18%">${(it.total || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;width:20%"></td>
      </tr>`).join('');

    const emptyRows = Array.from({length: Math.max(0, 6 - (invoice.items?.length || 0))}).map(() => `
      <tr style="height:24px">
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
        <td style="border:1px solid #333"></td>
      </tr>`).join('');

    const qrSvg = document.querySelector('#invoice-qr svg');
    const qrData = qrSvg ? qrSvg.outerHTML : '';

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"><title>فاتورة ${invoice.invoice_number}</title>
  <style>
    @page{size:A5 landscape;margin:3mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    body{margin:0;padding:5mm;font-family:Arial,sans-serif;color:#000;background:#fff;width:190mm}
    table{width:100%;border-collapse:collapse}tr{page-break-inside:avoid}
  </style>
</head><body>
  <div style="text-align:center;margin-bottom:8px">
    <img src="/logo.png" style="width:70px;height:70px;border-radius:50%;border:2px solid #ccc"/>
    <div style="font-size:18px;font-weight:900;letter-spacing:0.05em;margin:4px 0">مجوهرات الحمروني</div>
    <div style="font-size:9px;color:#555">لإستيراد الحُليّ والمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ-م-م)</div>
    <div style="margin:4px auto">${qrData}</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:10px">
    <div><b>التاريخ: </b><span style="border-bottom:1px solid #999;padding:0 6px">${year}/${month}/${day}</span></div>
    <div><b>فاتورة تفصيلية رقم: </b><span style="color:#dc2626;font-weight:bold;font-size:12px;font-family:monospace">${invoice.invoice_number}</span></div>
  </div>
  <div style="margin-bottom:8px;font-size:10px"><b>السيد: </b><span style="border-bottom:1px solid #999;padding:0 12px;font-weight:bold">${invoice.customer_name || '─────────────────────────────'}</span></div>
  <div style="border-top:2px solid #000;margin-bottom:2px"></div>
  <table>
    <thead><tr style="border-bottom:2px solid #000">
      <th style="border:1px solid #333;padding:5px 6px;text-align:right;width:22%;font-weight:bold">الصنف</th>
      <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:10%;font-weight:bold">العيار</th>
      <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:15%;font-weight:bold">العدد/الوزن<br>(جـرام)</th>
      <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:15%;font-weight:bold">السعر<br>(د.ل)</th>
      <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:18%;font-weight:bold">الكمية<br>(د.ل)</th>
      <th style="border:1px solid #333;padding:5px 6px;text-align:center;width:20%;font-weight:bold">ملاحظات</th>
    </tr></thead>
    <tbody>
      ${rows}${emptyRows}
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">اجمالي الفاتورة:</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">${total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="border:1px solid #333"></td>
      </tr>
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">المدة /نوع:</td>
        <td style="border:1px solid #333"></td><td style="border:1px solid #333"></td>
      </tr>
      <tr style="border-bottom:1px solid #333">
        <td colspan="4" style="border:1px solid #333;padding:4px 6px;text-align:center;font-weight:bold">الرسوم:</td>
        <td style="border:1px solid #333"></td><td style="border:1px solid #333"></td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:8px;font-size:10px;border:1px solid #999;padding:5px 8px"><b>بالحروف: </b><b style="color:#1f2937">${words}</b></div>
  <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:10px">
    <div style="text-align:center"><div style="border-top:1px solid #999;width:120px;margin-top:20px"></div><div style="font-size:9px;color:#555">توقيع العميل</div></div>
    <div style="text-align:center"><div style="border-top:1px solid #999;width:120px;margin-top:20px"></div><div style="font-size:9px;color:#555">يعتمد المدير العام</div></div>
  </div>
  <div style="border-top:2px solid #000;margin:12px 0 6px"></div>
  <div style="display:flex;justify-content:space-between;font-size:8px;color:#555">
    <div style="text-align:right"><div>الهاتف: +218912133218</div><div>البريد: osama_hamruni@yahoo.com</div></div>
    <div style="text-align:center"><div>ف.ت. ${invoice.invoice_number}</div></div>
    <div style="text-align:left"><div>العنوان: ليبيا - طرابلس - شارع جرابة</div></div>
  </div>
</body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
    setPrinted(true);
  };

  const handleNewSale = () => {
    navigate('/sales');
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  // التفقيط - التحقق من القيمة
  const totalInWords = invoice.total_amount > 0 ? numberToArabicWords(invoice.total_amount) : 'صفر';

  return (
    <div className="max-w-4xl mx-auto" id="invoice-container">
      {/* أزرار التحكم */}
      <div className="hidden print:hidden gap-4 mb-6">
        {!printed ? (
          <>
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
          <div id="invoice-qr" className="hidden"></div>
          <img src="/logo.png" alt="الحمروني" className="w-20 h-20 mx-auto mb-1 rounded-full border-2 border-gray-300" />
          <h1 className="text-2xl font-black text-gray-900 tracking-wide">مجوهرات الحمروني</h1>
          <p className="text-[10px] text-gray-600">لإستيراد الحُليّ والمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ-م-م)</p>
          <div className="mt-2 flex justify-center">
            <QRCodeSVG value={`INV-${invoice.invoice_number}-${invoice.total_amount}-${invoice.customer_name || 'CASH'}`} size={60} bgColor="white" fgColor="black" level="M" />
          </div>
        </div>

        {/* التاريخ ورقم الفاتورة */}
        <div className="flex justify-between items-center mb-2 text-[10px] px-4">
          <div><span className="font-bold">التاريخ: </span><span className="border-b border-gray-400 px-2">{new Date(invoice.created_at).getFullYear()} / {String(new Date(invoice.created_at).getMonth()+1).padStart(2,'0')} / {String(new Date(invoice.created_at).getDate()).padStart(2,'0')}</span></div>
          <div><span className="font-bold">فاتورة تفصيلية رقم: </span><span className="text-red-600 font-bold text-sm font-mono">{invoice.invoice_number}</span></div>
        </div>

        {/* السيد */}
        <div className="mb-3 text-[10px] px-4">
          <span className="font-bold">السيد: </span>
          <span className="border-b border-gray-400 px-4 font-bold">{invoice.customer_name || '─────────────────────────────'}</span>
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
            </tbody>
          </table>
        </div>

        {/* بالحروف */}
        <div className="mx-4 mt-3 text-[10px] border border-gray-400 p-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">بالحروف:</span>
            <span className="font-bold text-gray-800">{totalInWords}</span>
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