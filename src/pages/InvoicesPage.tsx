import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Eye, Printer, Calendar, User, DollarSign } from 'lucide-react';
import { jewelryApi } from '../services/supabase';
import { SaleInvoice } from '../services/supabase';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<SaleInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await jewelryApi.getAllInvoices();
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Try to load from localStorage as fallback
      const savedInvoices = localStorage.getItem('saved_invoices');
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }
    } finally {
      setLoading(false);
    }
  };

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
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-4 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-bold text-gray-900">فاتورة رقم: {selectedInvoice.invoice_number}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-900 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">العميل</p>
                  <p className="font-bold">{selectedInvoice.customer_name || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">التاريخ</p>
                  <p className="font-bold">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">البائع</p>
                  <p className="font-bold">{selectedInvoice.seller_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">كود البائع</p>
                  <p className="font-bold font-mono">{selectedInvoice.seller_code}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold mb-2">القطع:</h3>
                <div className="space-y-2">
                  {selectedInvoice.items?.map((item, index) => (
                    <div key={index} className="bg-gray-100 rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="font-bold">{item.model_name}</p>
                        <p className="text-sm text-gray-500 font-mono">{item.item_code}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-yellow-600">{item.total?.toLocaleString()} د.ل</p>
                        <p className="text-sm text-gray-500">الوزن: {item.weight}غ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">الإجمالي:</span>
                  <span className="text-2xl font-bold text-green-600">{(selectedInvoice.total_amount || 0).toLocaleString()} د.ل</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  طباعة
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;