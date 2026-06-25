import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Printer, ShoppingBag, Calendar, DollarSign, Filter, ChevronDown } from 'lucide-react';
import { getOrders, addOrder, updateOrder, deleteOrder, searchOrders, getOrderById, Order, OrderStatus, printOrderReceipt } from '../services/orders';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const data = getOrders();
    setOrders(data);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setOrders(searchOrders(query));
    } else {
      loadOrders();
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const orderData = {
      orderType: formData.get('orderType') as string,
      karat: formData.get('karat') as string,
      totalValue: parseFloat(formData.get('totalValue') as string) || 0,
      deposit: parseFloat(formData.get('deposit') as string) || 0,
      status: formData.get('status') as OrderStatus,
      paymentStatus: formData.get('paymentStatus') as Order['paymentStatus'],
      receiveDate: formData.get('receiveDate') as string,
      deliveryDate: formData.get('deliveryDate') as string,
      notes: formData.get('notes') as string,
      customerName: formData.get('customerName') as string,
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
    } else {
      addOrder(orderData);
    }

    setShowModal(false);
    setEditingOrder(null);
    loadOrders();
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    setShowDeleteConfirm(null);
    loadOrders();
  };

  const handlePrintReceipt = (orderId: string) => {
    const order = getOrderById(orderId);
    if (order) {
      printOrderReceipt(order);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'تم التجهيز';
      case 'pending': return 'لم يتم التجهيز';
      case 'in_progress': return 'جاري التجهيز';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">الطلبيات</h1>
          <p className="text-gray-400 mt-1">إدارة طلبات العملاء</p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة طلبية</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي الطرود</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">القيمة الإجمالية</p>
              <p className="text-lg font-bold text-white">{orders.reduce((sum, o) => sum + o.totalValue, 0).toLocaleString()} د.ل</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">العربون</p>
              <p className="text-lg font-bold text-white">{orders.reduce((sum, o) => sum + o.deposit, 0).toLocaleString()} د.ل</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">معلق</p>
              <p className="text-lg font-bold text-white">{orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث برقم الطلبية أو اسم الزبون..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pr-10 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white pr-10 focus:outline-none focus:border-yellow-500 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="completed">تم التجهيز</option>
            <option value="pending">لم يتم التجهيز</option>
            <option value="in_progress">جاري التجهيز</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">رقم الطلبية</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الزبون</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">النوع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">العيار</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">القيمة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">العربون</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">تاريخ التسليم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    لا يوجد طلبات
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-yellow-400 font-mono">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-white">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-300">{order.orderType}</td>
                    <td className="px-4 py-3 text-gray-300">{order.karat}</td>
                    <td className="px-4 py-3 text-green-400">{order.totalValue.toLocaleString()} د.ل</td>
                    <td className="px-4 py-3 text-blue-400">{order.deposit.toLocaleString()} د.ل</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(order.deliveryDate).toLocaleDateString('ar-LY')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintReceipt(order.id)}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                          title="طباعة الاستلام"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(order.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400">
                {editingOrder ? 'تعديل الطلبية' : 'إضافة طلبية جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">اسم الزبون *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    defaultValue={editingOrder?.customerName}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع الطلبية *</label>
                  <input
                    type="text"
                    name="orderType"
                    required
                    defaultValue={editingOrder?.orderType}
                    placeholder="مثل: خاتم، سوار، غضور..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">العيار *</label>
                  <select
                    name="karat"
                    required
                    defaultValue={editingOrder?.karat || '21'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="18">عيار 18</option>
                    <option value="21">عيار 21</option>
                    <option value="22">عيار 22</option>
                    <option value="24">عيار 24</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">تاريخ الاستلام *</label>
                  <input
                    type="date"
                    name="receiveDate"
                    required
                    defaultValue={editingOrder?.receiveDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">تاريخ التسليم *</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    required
                    defaultValue={editingOrder?.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">القيمة الإجمالية (د.ل)</label>
                  <input
                    type="number"
                    name="totalValue"
                    step="0.01"
                    defaultValue={editingOrder?.totalValue}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">العربون (د.ل)</label>
                  <input
                    type="number"
                    name="deposit"
                    step="0.01"
                    defaultValue={editingOrder?.deposit}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">حالة الطلبية</label>
                  <select
                    name="status"
                    defaultValue={editingOrder?.status || 'pending'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="pending">لم يتم التجهيز</option>
                    <option value="in_progress">جاري التجهيز</option>
                    <option value="completed">تم التجهيز</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">حالة الدفع</label>
                  <select
                    name="paymentStatus"
                    defaultValue={editingOrder?.paymentStatus || 'unpaid'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="unpaid">لم يتم الدفع</option>
                    <option value="partial">دفع جزء</option>
                    <option value="paid">تم الدفع الكامل</option>
                    <option value="returned">مرتجع</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingOrder?.notes}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-lg font-medium transition-all"
                >
                  {editingOrder ? 'حفظ التعديلات' : 'إضافة الطلبية'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                  }}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-300 mb-6">هل أنت متأكد من حذف هذه الطلبية؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-all"
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all"
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

export default OrdersPage;
