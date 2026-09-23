import React, { useState, useEffect } from 'react';
import { Package, Search, Trash2, Eye, Printer } from 'lucide-react';
import { formatNumber } from '../services/supabase';
import { getReceipts, StoredReceipt, deleteReceipt } from '../services/goldOrdersStorage';
import { getInvoices, StoredInvoice, deleteInvoice } from '../services/goldOrdersStorage';
import { getOrders, Order } from '../services/orders';
import { printReceipt } from '../services/receiptTemplate';
import { printOrderInvoice } from '../services/orderTemplate';

const InventoryTabsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts' | 'invoices'>('orders');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'orders' as const, label: 'الطلبيات', icon: Package },
    { id: 'receipts' as const, label: 'الإيصالات المستلمة', icon: Package },
    { id: 'invoices' as const, label: 'فواتير الطلبيات', icon: Package },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400">المخزون</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pr-10 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
        />
      </div>

      {/* Tab Content */}
      <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
        <OrdersTab searchQuery={searchQuery} />
      </div>
      <div style={{ display: activeTab === 'receipts' ? 'block' : 'none' }}>
        <ReceiptsTab searchQuery={searchQuery} />
      </div>
      <div style={{ display: activeTab === 'invoices' ? 'block' : 'none' }}>
        <InvoicesTab searchQuery={searchQuery} />
      </div>
    </div>
  );
};

// ===================== ORDERS TAB =====================
const OrdersTab: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const filtered = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.customerName?.toLowerCase().includes(q) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.orderType?.toLowerCase().includes(q) ||
      o.karat?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذه الطلبية؟')) {
      const { deleteOrder } = require('../services/orders');
      deleteOrder(id);
      setOrders(getOrders());
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'تم التسليم';
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'قيد التنفيذ';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-center text-sm text-gray-400">رقم الطلبية</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">العميل</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">النوع</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">القيمة</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">العربون</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">الحالة</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">لا توجد طلبيات</td></tr>
            ) : filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 text-center text-yellow-400 font-mono">{order.orderNumber}</td>
                <td className="px-4 py-3 text-center text-white">{order.customerName}</td>
                <td className="px-4 py-3 text-center text-gray-300">{order.orderType}</td>
                <td className="px-4 py-3 text-center text-green-400">{order.totalValue.toLocaleString()} د.ل</td>
                <td className="px-4 py-3 text-center text-blue-400">{order.deposit.toLocaleString()} د.ل</td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={order.status}
                    onChange={(e) => {
                      const { updateOrder } = require('../services/orders');
                      updateOrder(order.id, { status: e.target.value });
                      setOrders(getOrders());
                    }}
                    className={`px-2 py-1 rounded-full text-xs text-white border-0 ${
                      order.status === 'completed' ? 'bg-green-600' :
                      order.status === 'pending' ? 'bg-yellow-600' :
                      order.status === 'in_progress' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(order.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================== RECEIPTS TAB =====================
const ReceiptsTab: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);

  useEffect(() => {
    setReceipts(getReceipts());
  }, []);

  const filtered = receipts.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.receipt_number?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.customer_phone?.includes(q)
    );
  });

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذا الإيصال؟')) {
      deleteReceipt(id);
      setReceipts(getReceipts());
    }
  };

  const handlePrint = (receipt: StoredReceipt) => {
    const receiptItems = (receipt.items || []).map((it, i) => ({
      serial: i + 1,
      item_name: it.description || it.metal_type,
      metal_type: it.metal_type,
      weight: it.weight,
      quantity: it.count || 1,
      unit: 'جرام',
      market_value: it.metal_value,
      notes: '',
      price_per_gram: it.price_per_gram,
    }));
    printReceipt({
      receipt_number: receipt.receipt_number,
      customer_name: receipt.customer_name,
      customer_phone: receipt.customer_phone,
      delivery_date: receipt.delivery_date,
      items: receiptItems,
      total_weight: receipt.total_weight,
      total_value: receipt.total_value,
      created_at: receipt.created_at,
      total_count: receipt.total_count,
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-center text-sm text-gray-400">رقم الإيصال</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">العميل</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">الهاتف</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">الوزن</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">القيمة</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">التاريخ</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">لا توجد إيصالات</td></tr>
            ) : filtered.slice().reverse().map((r) => (
              <tr key={r.id} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 text-center text-yellow-400 font-mono font-bold">{r.receipt_number}</td>
                <td className="px-4 py-3 text-center text-white">{r.customer_name}</td>
                <td className="px-4 py-3 text-center text-gray-300">{r.customer_phone || '---'}</td>
                <td className="px-4 py-3 text-center text-gray-300">{r.total_weight.toFixed(2)} جرام</td>
                <td className="px-4 py-3 text-center text-green-400">{formatNumber(r.total_value)} د.ل</td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-CA')}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handlePrint(r)} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="طباعة">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================== INVOICES TAB =====================
const InvoicesTab: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const filtered = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.receipt_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذه الفاتورة؟')) {
      deleteInvoice(id);
      setInvoices(getInvoices());
    }
  };

  const handlePrint = (inv: StoredInvoice) => {
    const orderItems = (inv.items || []).map((it, i) => ({
      serial: i + 1,
      description: it.description,
      metal_type: it.metal_type,
      weight_pure: it.weight,
      workmanship_per_gram: 0,
      weight_with_stones: it.weight_with_stones,
      weight_with_gems: it.weight_with_gems,
      total: it.total,
      notes: it.notes,
      pieces_count: it.pieces_count,
      price_per_gram: 0,
      value_stones: it.value_stones,
      value_gems: it.value_gems,
      workmanship_total: it.workmanship,
      metal_value: 0,
    }));
    printOrderInvoice({
      order_number: inv.invoice_number,
      customer_name: inv.customer_name,
      delivery_date: inv.delivery_date,
      items: orderItems,
      total_amount: inv.total_amount || 0,
      total_weight: inv.total_weight || 0,
      total_workmanship: inv.total_workmanship || 0,
      seller_name: inv.seller_name || '',
      created_at: inv.created_at,
      total_stones_value: inv.total_stones_value || 0,
      total_gems_value: inv.total_gems_value || 0,
      total_metal_value: 0,
      received_quantity: inv.received_weight || 0,
      remaining_weight: inv.remaining_weight || 0,
      total_pieces: inv.total_pieces || 0,
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-center text-sm text-gray-400">رقم الفاتورة</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">رقم الإيصال</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">العميل</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">الوزن</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">المتبقي</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">الإجمالي</th>
              <th className="px-4 py-3 text-center text-sm text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">لا توجد فواتير</td></tr>
            ) : filtered.slice().reverse().map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 text-center text-yellow-400 font-mono font-bold">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-center text-blue-400 font-mono">{inv.receipt_number}</td>
                <td className="px-4 py-3 text-center text-white">{inv.customer_name}</td>
                <td className="px-4 py-3 text-center text-gray-300">{(inv.total_weight || 0).toFixed(2)} جرام</td>
                <td className="px-4 py-3 text-center text-gray-300">{(inv.remaining_weight || 0).toFixed(2)} جرام</td>
                <td className="px-4 py-3 text-center text-green-400">{formatNumber(inv.total_amount || 0)} د.ل</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handlePrint(inv)} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="طباعة">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTabsPage;
