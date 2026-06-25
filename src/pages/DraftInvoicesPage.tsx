import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Printer, ArrowRight, Clock, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDraftInvoices, getActiveDrafts, getDraftStats, getDraftById, createDraftInvoice, updateDraftInvoice, deleteDraftInvoice, convertDraftToFinal, cancelDraftInvoice, DraftInvoice } from '../services/draftInvoice';
import { cartStorage, formatNumber, formatCurrency, authApi } from '../services/supabase';

const DraftInvoicesPage: React.FC = () => {
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, converted: 0, cancelled: 0, totalValue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'converted' | 'cancelled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<DraftInvoice | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const navigate = useNavigate();

  // Load drafts
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    let allDrafts = filter === 'all' ? getDraftInvoices() : getDraftInvoices().filter(d => d.status === filter);
    if (searchQuery) {
      allDrafts = allDrafts.filter(d =>
        d.draftNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setDrafts(allDrafts);
    setStats(getDraftStats());
  };

  // Create new draft from cart
  const handleCreateFromCart = () => {
    const cart = cartStorage.getCart();
    if (cart.length === 0) {
      alert('السلة فارغة!');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const user = authApi.getCurrentUser();

    const draft = createDraftInvoice(
      customerName || 'عميل',
      cart,
      total,
      user?.name || 'بائع',
      user?.seller_code || '001'
    );

    // Clear cart after creating draft
    cartStorage.clearCart();

    alert(`تم إنشاء فاتورة مبدئية رقم: ${draft.draftNumber}`);
    loadDrafts();
    setShowCreateModal(false);
    setCustomerName('');
  };

  // Convert draft to final invoice
  const handleConvertDraft = (draft: DraftInvoice) => {
    if (confirm(`هل تريد تحويل الفاتورة المبدئية ${draft.draftNumber} إلى فاتورة نهائية؟`)) {
      const result = convertDraftToFinal(draft.draftNumber);
      if (result.success) {
        alert('تم تحويل الفاتورة بنجاح');
        // Navigate to sales page with the invoice
        navigate('/sales', { state: { convertDraft: result } });
      } else {
        alert('فشل في تحويل الفاتورة');
      }
      loadDrafts();
    }
  };

  // Cancel draft
  const handleCancelDraft = (draft: DraftInvoice) => {
    if (confirm(`هل تريد إلغاء الفاتورة المبدئية ${draft.draftNumber}؟`)) {
      if (cancelDraftInvoice(draft.id)) {
        alert('تم إلغاء الفاتورة');
        loadDrafts();
      }
    }
  };

  // Delete draft (admin only)
  const handleDeleteDraft = (draft: DraftInvoice) => {
    if (!authApi.hasPermission('canDeleteItems')) {
      alert('ليس لديك صلاحية الحذف');
      return;
    }

    if (confirm(`هل تريد حذف الفاتورة المبدئية ${draft.draftNumber} نهائياً؟`)) {
      if (deleteDraftInvoice(draft.id)) {
        alert('تم حذف الفاتورة');
        loadDrafts();
      }
    }
  };

  // Update draft notes
  const handleSaveNotes = () => {
    if (selectedDraft) {
      updateDraftInvoice(selectedDraft.id, { notes: editNotes });
      alert('تم تحديث الملاحظات');
      setShowEditModal(false);
      loadDrafts();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-600';
      case 'converted': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مبدئية';
      case 'converted': return 'نهائية';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          الفواتير المبدئية
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:from-yellow-700 hover:to-yellow-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          إنشاء فاتورة مبدئية
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-yellow-600/20">
          <div className="text-gray-400 text-sm">الإجمالي</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-yellow-600/20">
          <div className="text-gray-400 text-sm">نشطة</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.active}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-green-600/20">
          <div className="text-gray-400 text-sm">تم التحويل</div>
          <div className="text-2xl font-bold text-green-400">{stats.converted}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-red-600/20">
          <div className="text-gray-400 text-sm">القيمة الإجمالية</div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-600/20">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم أو اسم العميل..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pr-12 pl-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">الكل</option>
            <option value="active">نشطة</option>
            <option value="converted">تم التحويل</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <button
            onClick={loadDrafts}
            className="bg-gray-700 px-4 py-2 rounded-lg text-white hover:bg-gray-600"
          >
            تحديث
          </button>
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-yellow-600/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-gray-300">الرقم</th>
                <th className="px-4 py-3 text-right text-gray-300">العميل</th>
                <th className="px-4 py-3 text-center text-gray-300">عدد القطع</th>
                <th className="px-4 py-3 text-left text-gray-300">القيمة</th>
                <th className="px-4 py-3 text-center text-gray-300">الحالة</th>
                <th className="px-4 py-3 text-center text-gray-300">التاريخ</th>
                <th className="px-4 py-3 text-center text-gray-300">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    لا توجد فواتير مبدئية
                  </td>
                </tr>
              ) : (
                drafts.map((draft) => (
                  <tr key={draft.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-yellow-400">{draft.draftNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{draft.customerName}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{draft.items.length}</td>
                    <td className="px-4 py-3 text-left text-green-400 font-bold">{formatCurrency(draft.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`${getStatusColor(draft.status)} text-white px-3 py-1 rounded-full text-sm`}>
                        {getStatusText(draft.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-sm">
                      {new Date(draft.createdAt).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDraft(draft);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {draft.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleConvertDraft(draft)}
                              className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40"
                              title="تحويل لفاتورة نهائية"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDraft(draft);
                                setEditNotes(draft.notes || '');
                                setShowEditModal(true);
                              }}
                              className="p-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/40"
                              title="تعديل الملاحظات"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelDraft(draft)}
                              className="p-2 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/40"
                              title="إلغاء"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {authApi.hasPermission('canDeleteItems') && (
                          <button
                            onClick={() => handleDeleteDraft(draft)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-yellow-600/30">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-yellow-400">إنشاء فاتورة مبدئية</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">اسم العميل</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <p className="text-gray-400 text-sm">
                سيتم تحويل القطع من السلة إلى فاتورة مبدئية جديدة.
              </p>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateFromCart}
                className="flex-1 bg-yellow-600 text-gray-900 py-3 rounded-lg font-bold hover:bg-yellow-500"
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-yellow-600/30">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-yellow-400">تعديل الملاحظات</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedDraft.draftNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">ملاحظات</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="أضف ملاحظات..."
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex-1 bg-yellow-600 text-gray-900 py-3 rounded-lg font-bold hover:bg-yellow-500"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-yellow-600/30 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-yellow-400">تفاصيل الفاتورة</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">{selectedDraft.draftNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">العميل</div>
                  <div className="text-white font-bold">{selectedDraft.customerName}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">البائع</div>
                  <div className="text-white">{selectedDraft.sellerName}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">تاريخ الإنشاء</div>
                  <div className="text-white">{new Date(selectedDraft.createdAt).toLocaleDateString('ar-LY')}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">الحالة</div>
                  <div>
                    <span className={`${getStatusColor(selectedDraft.status)} text-white px-2 py-0.5 rounded-full text-sm`}>
                      {getStatusText(selectedDraft.status)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDraft.notes && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">ملاحظات</div>
                  <div className="text-white">{selectedDraft.notes}</div>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4">
                <div className="text-gray-300 font-bold mb-2">القطع ({selectedDraft.items.length})</div>
                <div className="space-y-2">
                  {selectedDraft.items.map((item, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-yellow-400 font-bold">{item.model_name}</div>
                        <div className="text-gray-400 text-xs">{item.item_code}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-white">{item.weight} غ</div>
                        <div className="text-green-400 text-sm">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-600/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">المجموع</span>
                  <span className="text-2xl font-bold text-yellow-400">{formatCurrency(selectedDraft.totalAmount)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftInvoicesPage;
