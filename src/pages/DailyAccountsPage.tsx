import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Wallet, DollarSign, Printer } from 'lucide-react';
import { formatNumber } from '../services/supabase';
import { getReceipts, getInvoices } from '../services/goldOrdersStorage';
import { getOrders } from '../services/orders';

interface DayEntry {
  date: string;
  receipts: { count: number; totalWeight: number; totalValue: number };
  invoices: { count: number; totalWorkmanship: number; totalStones: number; totalGems: number; totalAmount: number; details: { invoice_number: string; receipt_number: string; customer_name: string; total_amount: number }[] };
  orders: { count: number; totalValue: number; deposits: number };
}

const DailyAccountsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const receipts = getReceipts();
  const invoices = getInvoices();
  const orders = getOrders();

  // Group by date
  const dailyData = useMemo(() => {
    const data: Record<string, DayEntry> = {};

    receipts.forEach(r => {
      const date = r.created_at?.split('T')[0] || '';
      if (!data[date]) data[date] = { date, receipts: { count: 0, totalWeight: 0, totalValue: 0 }, invoices: { count: 0, totalWorkmanship: 0, totalStones: 0, totalGems: 0, totalAmount: 0, details: [] }, orders: { count: 0, totalValue: 0, deposits: 0 } };
      data[date].receipts.count++;
      data[date].receipts.totalWeight += r.total_weight || 0;
      data[date].receipts.totalValue += r.total_value || 0;
    });

    invoices.forEach(inv => {
      const date = inv.created_at?.split('T')[0] || '';
      if (!data[date]) data[date] = { date, receipts: { count: 0, totalWeight: 0, totalValue: 0 }, invoices: { count: 0, totalWorkmanship: 0, totalStones: 0, totalGems: 0, totalAmount: 0, details: [] }, orders: { count: 0, totalValue: 0, deposits: 0 } };
      data[date].invoices.count++;
      data[date].invoices.totalWorkmanship += inv.total_workmanship || 0;
      data[date].invoices.totalStones += inv.total_stones_value || 0;
      data[date].invoices.totalGems += inv.total_gems_value || 0;
      data[date].invoices.totalAmount += inv.total_amount || 0;
      data[date].invoices.details.push({
        invoice_number: inv.invoice_number,
        receipt_number: inv.receipt_number,
        customer_name: inv.customer_name,
        total_amount: inv.total_amount || 0,
      });
    });

    orders.forEach(o => {
      const date = o.createdAt?.split('T')[0] || '';
      if (!data[date]) data[date] = { date, receipts: { count: 0, totalWeight: 0, totalValue: 0 }, invoices: { count: 0, totalWorkmanship: 0, totalStones: 0, totalGems: 0, totalAmount: 0, details: [] }, orders: { count: 0, totalValue: 0, deposits: 0 } };
      data[date].orders.count++;
      data[date].orders.totalValue += o.totalValue || 0;
      data[date].orders.deposits += o.deposit || 0;
    });

    return data;
  }, [receipts, invoices, orders]);

  const selectedData = dailyData[selectedDate];

  // Monthly totals
  const monthlyData = useMemo(() => {
    const month = selectedDate.substring(0, 7); // YYYY-MM
    let totalReceipts = { count: 0, weight: 0, value: 0 };
    let totalInvoices = { count: 0, workmanship: 0, stones: 0, gems: 0, amount: 0 };
    let totalOrders = { count: 0, value: 0, deposits: 0 };

    Object.entries(dailyData).forEach(([date, data]) => {
      if (date.startsWith(month)) {
        totalReceipts.count += data.receipts.count;
        totalReceipts.weight += data.receipts.totalWeight;
        totalReceipts.value += data.receipts.totalValue;
        totalInvoices.count += data.invoices.count;
        totalInvoices.workmanship += data.invoices.totalWorkmanship;
        totalInvoices.stones += data.invoices.totalStones;
        totalInvoices.gems += data.invoices.totalGems;
        totalInvoices.amount += data.invoices.totalAmount;
        totalOrders.count += data.orders.count;
        totalOrders.value += data.orders.totalValue;
        totalOrders.deposits += data.orders.deposits;
      }
    });

    return { totalReceipts, totalInvoices, totalOrders };
  }, [dailyData, selectedDate]);

  const allDates = Object.keys(dailyData).sort().reverse();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400">الحسابات اليومية</h2>

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-400 mb-1">التاريخ</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('daily')} className={`px-4 py-2 rounded font-bold ${viewMode === 'daily' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400'}`}>
              يومي
            </button>
            <button onClick={() => setViewMode('monthly')} className={`px-4 py-2 rounded font-bold ${viewMode === 'monthly' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400'}`}>
              شهري
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* Daily Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">إيصالات مستلمة</p>
                  <p className="text-xl font-bold text-white">{selectedData?.receipts.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">فواتير تصنيع</p>
                  <p className="text-xl font-bold text-white">{selectedData?.invoices.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">طلبيات</p>
                  <p className="text-xl font-bold text-white">{selectedData?.orders.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">أيام مسجلة</p>
                  <p className="text-xl font-bold text-white">{allDates.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Details */}
          {selectedData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Receipts */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <h3 className="text-green-400 font-bold mb-3">الإيصالات المستلمة</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{selectedData.receipts.count}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">إجمالي الوزن</span><span className="text-yellow-400 font-bold">{selectedData.receipts.totalWeight.toFixed(2)} جرام</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">إجمالي القيمة</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.receipts.totalValue)} د.ل</span></div>
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-blue-400 font-bold mb-3">فواتير التصنيع</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{selectedData.invoices.count}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">اليد العاملة</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.invoices.totalWorkmanship)} د.ل</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">الأحجار</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.invoices.totalStones)} د.ل</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">الجوهر</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.invoices.totalGems)} د.ل</span></div>
                  <div className="flex justify-between border-t border-blue-500/30 pt-2"><span className="text-gray-400 font-bold">الإجمالي</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.invoices.totalAmount)} د.ل</span></div>
                  {selectedData.invoices.details.length > 0 && (
                    <div className="mt-3 border-t border-blue-500/20 pt-2">
                      <p className="text-gray-500 text-xs mb-1">تفاصيل الفواتير:</p>
                      {selectedData.invoices.details.map((d, i) => (
                        <div key={i} className="text-xs text-gray-400 flex justify-between">
                          <span>{d.invoice_number} - {d.customer_name}</span>
                          <span className="text-green-400">{formatNumber(d.total_amount)} د.ل</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Orders */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="text-yellow-400 font-bold mb-3">الطلبيات</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{selectedData.orders.count}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">القيمة الإجمالية</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.orders.totalValue)} د.ل</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">العربون</span><span className="text-yellow-400 font-bold">{formatNumber(selectedData.orders.deposits)} د.ل</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center text-gray-400">
              لا توجد بيانات لهذا التاريخ
            </div>
          )}

          {/* Dates with data */}
          {allDates.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">التواريخ المسجلة</h3>
              <div className="flex flex-wrap gap-2">
                {allDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-3 py-2 rounded text-sm font-bold ${selectedDate === date ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {date}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Monthly View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-green-400 font-bold mb-3">إجمالي الشهر - الإيصالات</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{monthlyData.totalReceipts.count}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">إجمالي الوزن</span><span className="text-yellow-400 font-bold">{monthlyData.totalReceipts.weight.toFixed(2)} جرام</span></div>
              <div className="flex justify-between"><span className="text-gray-400">إجمالي القيمة</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalReceipts.value)} د.ل</span></div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h3 className="text-blue-400 font-bold mb-3">إجمالي الشهر - الفواتير</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{monthlyData.totalInvoices.count}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">اليد العاملة</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalInvoices.workmanship)} د.ل</span></div>
              <div className="flex justify-between"><span className="text-gray-400">الأحجار + الجوهر</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalInvoices.stones + monthlyData.totalInvoices.gems)} د.ل</span></div>
              <div className="flex justify-between border-t border-blue-500/30 pt-2"><span className="text-gray-400 font-bold">الإجمالي</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalInvoices.amount)} د.ل</span></div>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <h3 className="text-yellow-400 font-bold mb-3">إجمالي الشهر - الطلبيات</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">العدد</span><span className="text-white">{monthlyData.totalOrders.count}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">القيمة الإجمالية</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalOrders.value)} د.ل</span></div>
              <div className="flex justify-between"><span className="text-gray-400">العربون</span><span className="text-yellow-400 font-bold">{formatNumber(monthlyData.totalOrders.deposits)} د.ل</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAccountsPage;
