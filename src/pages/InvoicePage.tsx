import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Home, CheckCircle } from 'lucide-react';
import { SaleInvoice } from '../services/supabase';
import { numberToArabicWords } from '../utils/arabic';

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
    window.print();
    setPrinted(true);
  };

  const handleNewSale = () => {
    navigate('/sales');
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

      {/* الفاتورة الاحترافية */}
      <div className="bg-white text-gray-900 shadow-2xl overflow-hidden" id="invoice">

        {/* الهيدر الذهبي الفاخر */}
        <div className="relative">
          {/* خلفية ذهبية متدرجة */}
          <div className="bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-500 p-8 text-center relative overflow-hidden">
            {/* زخارف ذهبية */}
            <div className="absolute top-0 left-0 w-24 h-24 opacity-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0,0 L100,0 L100,10 L10,10 L10,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20 transform scale-x-[-1]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0,0 L100,0 L100,10 L10,10 L10,100 L0,100 Z" fill="currentColor"/>
              </svg>
            </div>

            <img src="/logo.png" alt="مجوهرات الحمروني" className="w-24 h-24 mx-auto mb-3 rounded-full shadow-2xl border-4 border-yellow-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-wide">مجوهرات الحمروني</h1>
            <p className="text-gray-800 text-lg">أجود المجوهرات وأفخرها</p>
            <div className="flex justify-center gap-4 mt-3">
              <span className="bg-gray-900 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">عيار 24</span>
              <span className="bg-gray-900 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">عيار 21</span>
              <span className="bg-gray-900 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">عيار 18</span>
            </div>
          </div>

          {/* حدود ذهبية زخرفية */}
          <div className="h-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
        </div>

        {/* معلومات الفاتورة */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-2 gap-6">
            <div className="border-r-4 border-yellow-500 pr-4">
              <p className="text-gray-500 text-sm font-medium">رقم الفاتورة</p>
              <p className="text-2xl font-bold font-mono text-yellow-600">{invoice.invoice_number}</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 text-left">
              <p className="text-gray-500 text-sm font-medium">التاريخ والوقت</p>
              <p className="text-xl font-bold">{formatDate(invoice.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="border-r-4 border-gray-300 pr-4">
              <p className="text-gray-500 text-sm font-medium">اسم العميل</p>
              <p className="text-xl font-bold border-b-2 border-dashed border-gray-300 pb-1">{invoice.customer_name || '────────────────'}</p>
            </div>
            <div className="border-l-4 border-gray-300 pl-4 text-left">
              <p className="text-gray-500 text-sm font-medium">البائع</p>
              <p className="text-xl font-bold border-b-2 border-dashed border-gray-300 pb-1">{invoice.seller_name}</p>
            </div>
          </div>
        </div>

        {/* خط ذهبي فاصل */}
        <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>

        {/* جدول القطع الفاخر */}
        <div className="p-6">
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                  <th className="py-4 px-3 text-right border-b border-gray-600">#</th>
                  <th className="py-4 px-3 text-right border-b border-r border-gray-600">اسم الصنف</th>
                  <th className="py-4 px-3 text-center border-b border-r border-gray-600">الكود</th>
                  <th className="py-4 px-3 text-center border-b border-r border-gray-600">العيار</th>
                  <th className="py-4 px-3 text-center border-b border-r border-gray-600">الوزن (غ)</th>
                  <th className="py-4 px-3 text-center border-b border-r border-gray-600">الكمية</th>
                  <th className="py-4 px-3 text-left border-b">المجموع (د.ل)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-3 border-r border-gray-200">{index + 1}</td>
                    <td className="py-3 px-3 border-r border-gray-200">
                      <div className="font-bold text-gray-900">{item.model_name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </td>
                    <td className="py-3 px-3 text-center border-r border-gray-200 font-mono text-sm bg-yellow-50">{item.item_code}</td>
                    <td className="py-3 px-3 text-center border-r border-gray-200 font-bold text-yellow-600">{item.karat || '21'}</td>
                    <td className="py-3 px-3 text-center border-r border-gray-200">{item.weight.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center border-r border-gray-200">{item.quantity}</td>
                    <td className="py-3 px-3 text-left font-bold text-green-700 text-lg">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ملخص الفاتورة */}
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-yellow-500 rounded-xl p-6">
            {/* الإجمالي */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-yellow-300">
              <span className="text-2xl font-bold text-gray-800">الإجمالي:</span>
              <span className="text-4xl font-bold text-green-700">{invoice.total_amount.toLocaleString()} د.ل</span>
            </div>

            {/* التفقيط - الخانة الذهبية */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-yellow-100 via-yellow-50 to-white border-2 border-yellow-500 rounded-xl p-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500"></div>
                  <span className="px-4 text-yellow-700 font-bold text-sm">المبلغ كتابةً</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500"></div>
                </div>
                <p className="text-2xl font-bold text-yellow-800 text-center leading-relaxed tracking-wide">
                  {totalInWords}
                </p>
                <div className="flex items-center justify-center mt-2">
                  <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* التوقيعات */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center border-t-2 border-gray-300 pt-4">
              <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-bold text-gray-700">توقيع العميل</p>
              <p className="text-sm text-gray-500">{invoice.customer_name || 'العميل'}</p>
            </div>
            <div className="text-center border-t-2 border-gray-300 pt-4">
              <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-bold text-gray-700">توقيع البائع</p>
              <p className="text-sm text-gray-500">{invoice.seller_name}</p>
            </div>
          </div>
        </div>

        {/* الفوتر الفاخر */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 text-center">
          <div className="flex justify-center items-center gap-4 mb-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-xl font-bold">شكراً لتعاملكم معنا</p>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          <p className="text-gray-400 text-sm">القطع المباعة لا يمكن استبدالها أو إرجاعها</p>
          <div className="mt-4 flex justify-center items-center gap-6 text-xs text-gray-500">
            <span>رقم الفاتورة: {invoice.invoice_number}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>البائع: {invoice.seller_code}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>{invoice.items.length} قطع</span>
          </div>
        </div>

        {/* خط ذهبي سفلي */}
        <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
      </div>

      {/* أزرار ما بعد الطباعة */}
      {printed && (
        <div className="mt-6 flex gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-6 h-6" />
            طباعة أخرى
          </button>
          <button
            onClick={handleNewSale}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-6 h-6" />
            العودة للرئيسية
          </button>
        </div>
      )}

      {/* CSS للطباعة */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #invoice-container {
            max-width: none !important;
            padding: 0 !important;
          }
          .hidden\\:print\\:hidden {
            display: none !important;
          }
          #invoice {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;