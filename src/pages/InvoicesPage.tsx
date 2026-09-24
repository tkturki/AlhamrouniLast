import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Eye, Printer, Calendar, User, Edit2, Save, X, Trash2 } from 'lucide-react';
import { SaleInvoice, supabase, isSupabaseAvailable } from '../services/supabase';
import { printInvoice } from '../services/invoiceTemplate';
import { numberToArabicWords } from '../utils/arabic';
import { getSystemSettings, archiveInvoice, getArchivedInvoices, restoreInvoice, ArchivedInvoice } from '../services/settings';
import { getInvoices as getGoldInvoices, getReceiptByNumber, restoreUnifiedInvoicesFromServer, getUnifiedInvoices } from '../services/goldOrdersStorage';
import { realtimeSync } from '../services/realtimeSync';
import { QRCodeSVG } from 'qrcode.react';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<SaleInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editSellerName, setEditSellerName] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedInvoices, setArchivedInvoices] = useState<ArchivedInvoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [printPageSize, setPrintPageSize] = useState('A5');
  const [printOrientation, setPrintOrientation] = useState('landscape');

  const handlePrint = () => {
    const s = selectedInvoice;
    if (!s) return;

    printInvoice({
      invoice_number: s.invoice_number,
      customer_name: s.customer_name,
      items: s.items,
      total_amount: s.total_amount,
      seller_name: s.seller_name,
      created_at: s.created_at,
      invoice_type: 'final',
      payment_method: s.payment_method,
      transfer_number: (s as any).transfer_number,
      bank_name: (s as any).bank_name,
      card_receipt_number: (s as any).card_receipt_number,
      card_receipt_date: (s as any).card_receipt_date,
      print_config: (s as any).print_config,
    }, printPageSize, printOrientation);
  };

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const restoredInvoices = await restoreUnifiedInvoicesFromServer();
      const baseInvoices = restoredInvoices.length > 0 ? restoredInvoices : getUnifiedInvoices();
      try {
        const versionsResponse = await fetch('/api/invoice-versions');
        if (versionsResponse.ok) {
          const versionsResult = await versionsResponse.json();
          const versions = versionsResult.data || {};
          if (Array.isArray(versions.original)) localStorage.setItem('original_invoices', JSON.stringify(versions.original));
          if (Array.isArray(versions.modified)) localStorage.setItem('modified_invoices', JSON.stringify(versions.modified));
        }
      } catch {
        // Keep local original and modified copies when the server is unavailable.
      }

      const normalizedInvoices = baseInvoices.map((invoice: any) => {
        const isGold = invoice.invoice_type === 'gold' || invoice.receipt_number || invoice.total_workmanship;
        return {
          ...invoice,
          invoice_type: isGold ? 'gold' : 'sale',
          seller_name: invoice.seller_name || 'غير محدد',
          items: Array.isArray(invoice.items) ? invoice.items : [],
          payment_method: invoice.payment_method || 'cash',
        };
      });

      setInvoices(normalizedInvoices);
      setLoading(false);

      // Sync with Supabase in background (non-blocking)
      if (isSupabaseAvailable() && supabase) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          );
          const fetchPromise = supabase
            .from('sale_invoices')
            .select('*')
            .order('created_at', { ascending: false });

          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

          if (!error && data && data.length > 0) {
            localStorage.setItem('saved_invoices', JSON.stringify(data));
          }
        } catch (e) {
          // Silent fail - localStorage data already loaded
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
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
      const relatedText = getInvoiceLinkText(invoice) || '';
      return (
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer_name?.toLowerCase().includes(searchLower) ||
        invoice.seller_name?.toLowerCase().includes(searchLower) ||
        relatedText.toLowerCase().includes(searchLower) ||
        (invoice as any).invoice_link_key?.toLowerCase().includes(searchLower)
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

  const getInvoiceLinkText = (invoice: any) => {
    const related = invoice.related_order_number || invoice.related_sale_invoice_number || invoice.linked_gold_invoice_number || invoice.linked_sale_invoice_number;
    if (!related) return null;
    return `مرتبط: ${related}`;
  };

  const startEditing = () => {
    if (!selectedInvoice) return;
    setEditCustomerName(selectedInvoice.customer_name || '');
    setEditSellerName(selectedInvoice.seller_name || '');
    setEditItems((selectedInvoice.items || []).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      weight: Number(item.weight) || 0,
      price: Number(item.price ?? item.price_per_gram) || 0,
      total: Number(item.total) || 0,
    })));
    setIsEditing(true);
  };

  const updateEditItem = (index: number, field: string, value: string) => {
    setEditItems(previous => previous.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item };
      if (['quantity', 'weight', 'price', 'price_per_gram'].includes(field)) {
        next[field] = value === '' ? 0 : Number(value);
      } else {
        next[field] = value;
      }
      if (field === 'price') next.price_per_gram = next.price;
      if (['quantity', 'price', 'price_per_gram'].includes(field)) {
        next.total = (Number(next.quantity) || 1) * (Number(next.price ?? next.price_per_gram) || 0);
      }
      return next;
    }));
  };

  const saveEdit = async () => {
    if (!selectedInvoice) return;
    const normalizedItems = editItems.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      weight: Number(item.weight) || 0,
      price: Number(item.price ?? item.price_per_gram) || 0,
      price_per_gram: Number(item.price ?? item.price_per_gram) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.price ?? item.price_per_gram) || 0),
    }));
    const updatedInvoice = {
      ...selectedInvoice,
      customer_name: editCustomerName,
      seller_name: editSellerName,
      items: normalizedItems,
      total_amount: normalizedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    };
    const originalVersions = JSON.parse(localStorage.getItem('original_invoices') || '[]');
    const modifiedVersions = JSON.parse(localStorage.getItem('modified_invoices') || '[]');
    if (!originalVersions.some((invoice: SaleInvoice) => invoice.invoice_number === selectedInvoice.invoice_number)) {
      originalVersions.push({ ...selectedInvoice, version: 'original', saved_at: new Date().toISOString() });
    }
    const modifiedVersion = { ...updatedInvoice, version: 'modified', original_invoice_number: selectedInvoice.invoice_number, saved_at: new Date().toISOString() };
    const modifiedIndex = modifiedVersions.findIndex((invoice: SaleInvoice) => invoice.invoice_number === selectedInvoice.invoice_number);
    if (modifiedIndex === -1) modifiedVersions.push(modifiedVersion);
    else modifiedVersions[modifiedIndex] = modifiedVersion;
    localStorage.setItem('original_invoices', JSON.stringify(originalVersions));
    localStorage.setItem('modified_invoices', JSON.stringify(modifiedVersions));
    const allInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
    const index = allInvoices.findIndex((inv: SaleInvoice) => inv.invoice_number === selectedInvoice.invoice_number);
    if (index === -1) allInvoices.unshift(updatedInvoice);
    else allInvoices[index] = updatedInvoice;
    localStorage.setItem('saved_invoices', JSON.stringify(allInvoices));
    setInvoices(previous => {
      const existingIndex = previous.findIndex(invoice => invoice.invoice_number === selectedInvoice.invoice_number);
      if (existingIndex === -1) return [updatedInvoice, ...previous];
      return previous.map((invoice, invoiceIndex) => invoiceIndex === existingIndex ? updatedInvoice : invoice);
    });
    setSelectedInvoice(updatedInvoice);
    void fetch('/api/invoices/' + encodeURIComponent(selectedInvoice.invoice_number), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInvoice),
    }).catch(() => undefined);
    void fetch('/api/invoice-versions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original: originalVersions, modified: modifiedVersions }),
    }).catch(() => undefined);
    setIsEditing(false);
  };

  const handleArchive = (invoiceNumber: string) => {
    if (!confirm('هل تريد أرشفة هذه الفاتورة؟')) return;
    archiveInvoice(invoiceNumber);
    loadInvoices();
    setSelectedInvoice(null);
  };

  const handleCancelInvoice = (invoiceNumber: string) => {
    if (!confirm('هل تريد إلغاء هذه الفاتورة؟')) return;

    const invoice = invoices.find(
      (inv) => inv.invoice_number === invoiceNumber
    );
    if (!invoice) return;

    const allInvoices = JSON.parse(
      localStorage.getItem('saved_invoices') || '[]'
    );
    const cancelledInvoices = JSON.parse(
      localStorage.getItem('cancelled_invoices') || '[]'
    );

    const invoiceIndex = allInvoices.findIndex(
      (inv: any) => inv.invoice_number === invoiceNumber
    );
    if (invoiceIndex === -1) return;

    const invoiceData = allInvoices[invoiceIndex];

    const jewelryItems = JSON.parse(
      localStorage.getItem('jewelry_items') || '[]'
    );
    if (invoiceData.items) {
      invoiceData.items.forEach((item: any) => {
        const jewelryItem = jewelryItems.find(
          (j: any) => j.item_code === item.item_code
        );
        if (jewelryItem) {
          jewelryItem.stock_qty =
            (jewelryItem.stock_qty || 0) + (item.quantity || 1);
        }
      });
      localStorage.setItem('jewelry_items', JSON.stringify(jewelryItems));
    }

    import('../services/treasury').then((mod) => {
      // قيد 1: إلغاء الإيراد (مدين إيرادات)
      mod.addJournalEntry({
        date: new Date().toISOString().split('T')[0],
        description: `إلغاء فاتورة - إيراد - ${invoiceData.customer_name || 'عميل'} - فاتورة ${invoiceNumber}`,
        debit: invoiceData.total_amount || 0,
        credit: 0,
        accountCode: '3001',
        entryType: 'return',
        reference: invoiceNumber,
        createdBy: 'نظام',
      });
      // قيد 2: إرجاع النقدية (دائن الصندوق)
      mod.addJournalEntry({
        date: new Date().toISOString().split('T')[0],
        description: `إلغاء فاتورة - إرجاع نقدي - ${invoiceData.customer_name || 'عميل'} - فاتورة ${invoiceNumber}`,
        debit: 0,
        credit: invoiceData.total_amount || 0,
        accountCode: '1001',
        entryType: 'return',
        reference: invoiceNumber,
        createdBy: 'نظام',
      });
    });

    cancelledInvoices.push({
      ...invoiceData,
      cancelled_at: new Date().toISOString(),
    });
    localStorage.setItem(
      'cancelled_invoices',
      JSON.stringify(cancelledInvoices)
    );

    allInvoices.splice(invoiceIndex, 1);
    localStorage.setItem('saved_invoices', JSON.stringify(allInvoices));

    loadInvoices();
    setSelectedInvoice(null);
  };

  const handleRestore = (invoiceNumber: string) => {
    if (!confirm('هل تريد استعادة هذه الفاتورة من الأرشيف؟')) return;
    restoreInvoice(invoiceNumber);
    setArchivedInvoices(getArchivedInvoices());
    loadInvoices();
  };

  const loadArchived = () => {
    setArchivedInvoices(getArchivedInvoices());
    setShowArchived(true);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id?.toString() || inv.invoice_number));
    }
  };

  const handleConfirmBatchDelete = () => {
    // Delete from saved_invoices (sale invoices)
    const allSaleInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
    const goldInvs = getGoldInvoices();
    
    // Separate gold invoices from sale invoices
    const goldIds = goldInvs.map(g => g.id);
    const saleIds = selectedIds.filter(id => !goldIds.includes(id));
    const goldSelectedIds = selectedIds.filter(id => goldIds.includes(id));
    
    // Delete sale invoices
    const remainingSale = allSaleInvoices.filter((inv: any) => {
      const invId = inv.id?.toString() || inv.invoice_number;
      return !saleIds.includes(invId);
    });
    localStorage.setItem('saved_invoices', JSON.stringify(remainingSale));
    
    // Delete gold invoices
    if (goldSelectedIds.length > 0) {
      const remainingGold = goldInvs.filter(g => !goldSelectedIds.includes(g.id));
      localStorage.setItem('gold_invoices', JSON.stringify(remainingGold));
    }
    
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    loadInvoices();
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-yellow-400">سجل الفواتير</h1>
          <p className="text-gray-400">جميع الفواتير المحفوظة للمراجعة</p>
        </div>
        <button
          onClick={loadArchived}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          📁 الأرشيف
        </button>
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
          {/* Batch actions bar */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3 border border-gray-700">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 accent-yellow-500"
              />
              <span className="text-gray-400 text-sm">
                {selectedIds.length > 0 ? `تم تحديد ${selectedIds.length} من ${filteredInvoices.length}` : `تحديد الكل (${filteredInvoices.length})`}
              </span>
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
              >
                <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedIds.length})
              </button>
            )}
          </div>

          {filteredInvoices.map((invoice) => {
            const invId = invoice.id?.toString() || invoice.invoice_number;
            return (
            <div
              key={invoice.id || invoice.invoice_number}
              className={`bg-gray-800/50 rounded-2xl p-4 border transition-all cursor-pointer ${
                selectedIds.includes(invId) ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-yellow-600/50'
              }`}
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(invId)}
                    onChange={(e) => { e.stopPropagation(); handleToggleSelect(invId); }}
                    className="w-4 h-4 accent-yellow-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-400 font-mono">{invoice.invoice_number}</p>
                    <p className="text-gray-400 text-sm">
                      {invoice.customer_name || 'عميل غير محدد'}
                    </p>
                    {getInvoiceLinkText(invoice) && (
                      <p className="text-xs text-blue-300 mt-1">{getInvoiceLinkText(invoice)}</p>
                    )}
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
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-400 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-300 mb-6">
              هل تريد حذف {selectedIds.length} فاتورة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setSelectedIds([]); }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                حذف {selectedIds.length} فاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const settings = getSystemSettings();
        const date = new Date(selectedInvoice.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const displayItems = isEditing ? editItems : (selectedInvoice.items || []);
        const totalAmount = isEditing
          ? displayItems.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.price ?? item.price_per_gram) || 0)), 0)
          : (selectedInvoice.total_amount || 0);
        const getItemWeight = (item: any, field: 'gemstone' | 'stone' | 'gemarat') => {
          if (field === 'gemstone') return Number(item.weight_with_gems ?? item.gemstone_weight ?? 0) || 0;
          if (field === 'stone') return Number(item.stone_weight ?? item.weight_with_stones ?? 0) || 0;
          return Number(item.gem_weight ?? item.gemarat_weight ?? 0) || 0;
        };
        const getItemGemaratCount = (item: any) => Number(item.gem_count ?? item.gemarat_count ?? 0) || 0;
        const getItemTotalWeight = (item: any) => (Number(item.weight || 0) + getItemWeight(item, 'gemstone') + getItemWeight(item, 'stone') + getItemWeight(item, 'gemarat')) * (Number(item.quantity) || 1);
        const totalInvoiceWeight = displayItems.reduce((sum, item) => sum + getItemTotalWeight(item), 0);
        const totalInWords = totalAmount > 0 ? numberToArabicWords(totalAmount) : 'صفر';
        return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white text-gray-900 rounded max-w-[148mm] w-full max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-h-none print:overflow-visible" onClick={(e) => e.stopPropagation()}>

            {/* الفاتورة - نموذج ليبي أصلي */}
            <div id="invoice-print" className="p-4 print:p-0" dir="rtl">

              {/* الهيدر: الشعار في الوسط + الاسم */}
              <div className="text-center mb-3">
                <img src="/logo1.png" alt="الحمروني" className="w-24 h-24 mx-auto mb-1 rounded-full border-2 border-gray-300" />
                <h1 className="text-2xl font-black text-gray-900 tracking-wide">مجوهرات الحمروني</h1>
                <p className="text-[10px] text-gray-600">للمجوهرات والأحجار الكريمة والمعادن الثمينة (ذ.م.م)</p>
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
                {isEditing ? (
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="border border-blue-400 rounded px-2 py-1 text-[10px] font-bold w-48"
                    placeholder="اسم العميل"
                  />
                ) : (
                  <span className="border-b border-gray-400 px-4 font-bold">{selectedInvoice.customer_name || '─────────────────────────────'}</span>
                )}
              </div>

              {/* خط فاصل */}
              <div className="border-t-2 border-gray-900 mb-0"></div>

              {/* جدول القطع */}
              <div>
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="py-1.5 px-1 text-right font-bold border-l border-gray-900">الصنف</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">العيار</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">العدد/الوزن<br/>(جـرام)</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">وزن الجوهر<br/>(جـرام)</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">وزن الأحجار<br/>(جـرام)</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">وزن المجارات<br/>(جـرام)</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">عدد المجارات</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">السعر<br/>(د.ل)</th>
                      <th className="py-1.5 px-1 text-center font-bold border-l border-gray-900">الكمية<br/>(د.ل)</th>
                      <th className="py-1.5 px-1 text-center font-bold">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-1.5 px-1 border-l border-gray-300 text-right">
                          {isEditing ? (
                            <input value={item.model_name || item.category || ''} onChange={(e) => updateEditItem(index, 'model_name', e.target.value)} className="w-full border border-blue-400 rounded px-1 py-0.5 text-[10px]" />
                          ) : <span>{item.model_name || item.category || '────'}</span>}
                        </td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">
                          {isEditing ? <input value={item.karat || ''} onChange={(e) => updateEditItem(index, 'karat', e.target.value)} className="w-12 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px]" /> : (item.karat || '21')}
                        </td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 items-center">
                              <input type="text" inputMode="decimal" dir="ltr" lang="en" min="1" step="1" value={String(item.quantity ?? 1)} onChange={(e) => updateEditItem(index, 'quantity', e.target.value)} className="w-16 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px] font-mono" />
                              <input type="text" inputMode="decimal" dir="ltr" lang="en" step="0.01" value={String(item.weight ?? 0)} onChange={(e) => updateEditItem(index, 'weight', e.target.value)} className="w-16 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px] font-mono" />
                            </div>
                          ) : `${Number(item.quantity || 1)} / ${(Number(item.weight || 0)).toFixed(2)}`}
                        </td>
                        {(['gemstone', 'stone', 'gemarat'] as const).map((field) => (
                          <td key={field} className="py-1.5 px-1 text-center border-l border-gray-300">
                            {isEditing ? <input type="text" inputMode="decimal" dir="ltr" lang="en" step="0.01" value={String(getItemWeight(item, field))} onChange={(e) => updateEditItem(index, field === 'gemstone' ? 'weight_with_gems' : field === 'stone' ? 'stone_weight' : 'gem_weight', e.target.value)} className="w-16 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px] font-mono" /> : getItemWeight(item, field).toFixed(2)}
                          </td>
                        ))}
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">
                          {isEditing ? <input type="text" inputMode="numeric" dir="ltr" lang="en" min="0" step="1" value={String(getItemGemaratCount(item))} onChange={(e) => updateEditItem(index, 'gem_count', e.target.value)} className="w-14 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px] font-mono" /> : getItemGemaratCount(item)}
                        </td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">
                          {isEditing ? <input type="text" inputMode="decimal" dir="ltr" lang="en" step="0.01" value={String(item.price ?? item.price_per_gram ?? 0)} onChange={(e) => updateEditItem(index, 'price', e.target.value)} className="w-20 border border-blue-400 rounded px-1 py-0.5 text-center text-[10px] font-mono" /> : (item.price_per_gram ? Number(item.price_per_gram).toLocaleString('en-US') : ((item.total || 0) / ((item.weight || 1) * (item.quantity || 1))).toFixed(2))}
                        </td>
                        <td className="py-1.5 px-1 text-center border-l border-gray-300">{((Number(item.quantity) || 1) * (Number(item.price ?? item.price_per_gram) || 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-1.5 px-1 text-center">
                          {isEditing ? <input value={item.notes || ''} onChange={(e) => updateEditItem(index, 'notes', e.target.value)} className="w-full border border-blue-400 rounded px-1 py-0.5 text-[10px]" /> : (item.notes || '')}
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 6 - displayItems.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-gray-300 h-7">
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
                        <td className="border-l border-gray-300"></td>
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
                        <td colSpan={8} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">اجمالي الفاتورة:</td>
                      <td className="py-1.5 px-1 text-center border-l border-gray-300 font-bold">{totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td colSpan={9} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">إجمالي الوزن:</td>
                      <td className="py-1.5 px-1 text-center font-bold">{totalInvoiceWeight.toFixed(2)} جرام</td>
                    </tr>
                    {/* المدة / النوع */}
                    <tr className="border-b border-gray-300">
                      <td colSpan={8} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">المدة /نوع:</td>
                      <td className="border-l border-gray-300"></td>
                      <td></td>
                    </tr>
                    {/* الرسوم */}
                    <tr className="border-b border-gray-300">
                      <td colSpan={8} className="py-1.5 px-1 border-l border-gray-300 text-center font-bold">الرسوم:</td>
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
              {!isEditing ? (
                <>
                  <button
                    onClick={startEditing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleArchive(selectedInvoice.invoice_number)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    📁 أرشفة
                  </button>
                  <button
                    onClick={() => handleCancelInvoice(selectedInvoice.invoice_number)}
                    className="flex-1 bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    إلغاء فاتورة
                  </button>
                  {/* Print Settings */}
                  <div className="w-full flex gap-2">
                    <select value={printPageSize} onChange={(e) => setPrintPageSize(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white px-2 py-1 rounded text-xs">
                      <option value="A5">A5</option>
                      <option value="A4">A4</option>
                    </select>
                    <select value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white px-2 py-1 rounded text-xs">
                      <option value="landscape">أفقي</option>
                      <option value="portrait">عمودي</option>
                    </select>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedInvoice) return;
                      import('../services/paymentReceipt').then(({ printPaymentReceipt }) => {
                        const inv = selectedInvoice;
                        printPaymentReceipt({
                          receipt_number: `PAY-${Date.now()}`,
                          invoice_number: inv.invoice_number,
                          customer_name: inv.customer_name || '',
                          total_amount: inv.total_amount || 0,
                          amount_paid: inv.total_amount || 0,
                          remaining: 0,
                          payment_date: new Date().toISOString(),
                          page_size: printPageSize,
                          orientation: printOrientation as any,
                        });
                      });
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    💰 إيصال سداد
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedInvoice) return;
                      import('../services/monetaryReceipt').then(({ printMonetaryReceipt }) => {
                        const inv = selectedInvoice;
                        const linkedReceipt = (inv as any).receipt_number ? getReceiptByNumber((inv as any).receipt_number) : null;
                        printMonetaryReceipt({
                          receipt_number: `MON-${Date.now()}`,
                          invoice_number: inv.invoice_number,
                          customer_name: inv.customer_name || '',
                          customer_title: (inv as any).customer_title || '',
                          total_amount: inv.total_amount || 0,
                          payment_date: new Date().toISOString(),
                          items: linkedReceipt?.items?.map((it: any, i: number) => ({
                            serial: i + 1,
                            description: it.description || it.metal_type || '',
                            item_type: it.item_type || 'metal',
                            metal_type: it.metal_type || '',
                            karat: it.karat || '',
                            weight: it.weight || 0,
                            count: it.count || 0,
                            price_per_gram: it.price_per_gram || 0,
                            amount: it.item_type === 'monetary' ? (it.total_lyd || it.monetary_value || 0) : (it.metal_value || 0),
                            notes: it.notes || '',
                          })),
                        });
                      });
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    📋 ايصال استلام قيمة مالية
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 rounded text-sm transition-all"
                  >
                    إغلاق
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 rounded text-sm transition-all"
                  >
                    إلغاء
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* نافذة الأرشيف */}
      {showArchived && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto border border-gray-600">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-yellow-400">📁 الفواتير المؤرشفة</h3>
              <button onClick={() => setShowArchived(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {archivedInvoices.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا توجد فواتير مؤرشفة</p>
              ) : (
                <div className="space-y-3">
                  {archivedInvoices.map((inv) => (
                    <div key={inv.invoice_number} className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-yellow-400 font-bold font-mono">{inv.invoice_number}</p>
                        <p className="text-gray-400 text-sm">{inv.customer_name}</p>
                        <p className="text-gray-500 text-xs">أُرشف في: {new Date(inv.archived_at).toLocaleDateString('en-CA')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 font-bold">{(inv.total_amount || 0).toLocaleString()} د.ل</span>
                        <button
                          onClick={() => handleRestore(inv.invoice_number)}
                          className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 text-sm"
                        >
                          استعادة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;