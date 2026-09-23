import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, MapPin, X, DollarSign, Scale, Truck, Filter, ChevronDown } from 'lucide-react';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, searchSuppliers, Supplier } from '../services/suppliers';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    const data = getSuppliers();
    setSuppliers(data);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setSuppliers(searchSuppliers(query));
    } else {
      loadSuppliers();
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const supplierData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      totalValue: parseFloat(formData.get('totalValue') as string) || 0,
      totalWeight: parseFloat(formData.get('totalWeight') as string) || 0,
      status: formData.get('status') as Supplier['status'],
      notes: formData.get('notes') as string,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }

    setShowModal(false);
    setEditingSupplier(null);
    loadSuppliers();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteSupplier(id);
    setShowDeleteConfirm(null);
    loadSuppliers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'unpaid': return 'bg-red-500';
      case 'partial': return 'bg-yellow-500';
      case 'returned': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'تم السداد';
      case 'unpaid': return 'لم يتم السداد';
      case 'partial': return 'دفع جزء';
      case 'returned': return 'تم الإرجاع';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">الموردون</h1>
          <p className="text-gray-400 mt-1">إدارة بيانات الموردين</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مورد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي الموردين</p>
              <p className="text-2xl font-bold text-white">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي القيمة</p>
              <p className="text-lg font-bold text-white">{suppliers.reduce((sum, s) => sum + s.totalValue, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">إجمالي الوزن</p>
              <p className="text-lg font-bold text-white">{suppliers.reduce((sum, s) => sum + s.totalWeight, 0).toFixed(2)} غم</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">غير المسدد</p>
              <p className="text-lg font-bold text-white">
                {suppliers.filter(s => s.status === 'unpaid').reduce((sum, s) => sum + s.totalValue, 0).toLocaleString()}
              </p>
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
            placeholder="البحث بالكود أو الاسم أو الهاتف..."
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
            <option value="paid">تم السداد</option>
            <option value="unpaid">لم يتم السداد</option>
            <option value="partial">دفع جزء</option>
            <option value="returned">تم الإرجاع</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الكود</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الاسم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الهاتف</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الصفة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">القيمة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الوزن</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    لا يوجد موردين
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-yellow-400 font-mono">{supplier.code}</td>
                    <td className="px-4 py-3 text-white">{supplier.name}</td>
                    <td className="px-4 py-3 text-gray-300">{supplier.phone}</td>
                    <td className="px-4 py-3 text-gray-300">{supplier.description}</td>
                    <td className="px-4 py-3 text-green-400">{supplier.totalValue.toLocaleString()} د.ل</td>
                    <td className="px-4 py-3 text-gray-300">{supplier.totalWeight.toFixed(2)} غم</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(supplier.status)}`}>
                        {getStatusLabel(supplier.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(supplier.id)}
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
                {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الاسم *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingSupplier?.name}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingSupplier?.phone}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الصفة</label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingSupplier?.description}
                    placeholder="مثل: تاجر جملة، مصنع..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingSupplier?.address}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">القيمة الإجمالية (د.ل)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="totalValue"
                    step="0.01"
                    defaultValue={editingSupplier?.totalValue}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الوزن الإجمالي (غم)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="totalWeight"
                    step="0.01"
                    defaultValue={editingSupplier?.totalWeight}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الحالة</label>
                  <select
                    name="status"
                    defaultValue={editingSupplier?.status || 'unpaid'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="paid">تم السداد</option>
                    <option value="unpaid">لم يتم السداد</option>
                    <option value="partial">دفع جزء</option>
                    <option value="returned">تم الإرجاع</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingSupplier?.notes}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-lg font-medium transition-all"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
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
            <p className="text-gray-300 mb-6">هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.</p>
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

export default SuppliersPage;
