import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Package,
  DollarSign,
  FileText,
  Search,
  Printer,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { JewelryItem, SaleInvoice, supabase, isSupabaseAvailable } from '../services/supabase';
import { getReturns, Return } from '../services/returns';
import { formatNumber } from '../services/supabase';
import { getInvoices as getGoldInvoices, StoredInvoice } from '../services/goldOrdersStorage';

type Tab = 'sales' | 'inventory' | 'profit' | 'surprise';

const AuditReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [goldInvoices, setGoldInvoices] = useState<StoredInvoice[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [actualCounts, setActualCounts] = useState<{ [code: string]: number }>({});
  const [auditTimestamp, setAuditTimestamp] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    // Load invoices from Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data: invData, error: invError } = await supabase
          .from('sale_invoices')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!invError && invData && invData.length > 0) {
          localStorage.setItem('saved_invoices', JSON.stringify(invData));
          setInvoices(invData);
        } else {
          setInvoices(JSON.parse(localStorage.getItem('saved_invoices') || '[]'));
        }
        
        const { data: itemData, error: itemError } = await supabase
          .from('jewelry_items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!itemError && itemData && itemData.length > 0) {
          localStorage.setItem('jewelry_items', JSON.stringify(itemData));
          setItems(itemData);
        } else {
          setItems(JSON.parse(localStorage.getItem('jewelry_items') || '[]'));
        }
      } catch (e) {
        console.log('Supabase error, using cache:', e);
        setInvoices(JSON.parse(localStorage.getItem('saved_invoices') || '[]'));
        setItems(JSON.parse(localStorage.getItem('jewelry_items') || '[]'));
      }
    } else {
      setInvoices(JSON.parse(localStorage.getItem('saved_invoices') || '[]'));
      setItems(JSON.parse(localStorage.getItem('jewelry_items') || '[]'));
    }
    
    setReturns(getReturns());
    setGoldInvoices(getGoldInvoices());
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const d = new Date(inv.created_at);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const filteredReturns = returns.filter((r) => {
    const d = new Date(r.return_date);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const filteredGoldInvoices = goldInvoices.filter((inv) => {
    const d = new Date(inv.created_at);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.total_amount || 0),
    0
  );
  const totalGoldRevenue = filteredGoldInvoices.reduce(
    (sum, inv) => sum + (inv.total_amount || 0),
    0
  );
  const totalReturns = filteredReturns.reduce(
    (sum, r) => sum + (r.total_amount || 0),
    0
  );
  const netRevenue = totalRevenue + totalGoldRevenue - totalReturns;
  const avgInvoice =
    filteredInvoices.length + filteredGoldInvoices.length > 0 ? (totalRevenue + totalGoldRevenue) / (filteredInvoices.length + filteredGoldInvoices.length) : 0;

  const dailyBreakdown = () => {
    const days: { [date: string]: { count: number; total: number } } = {};
    filteredInvoices.forEach((inv) => {
      const day = new Date(inv.created_at).toLocaleDateString('en-CA');
      if (!days[day]) days[day] = { count: 0, total: 0 };
      days[day].count++;
      days[day].total += inv.total_amount || 0;
    });
    filteredGoldInvoices.forEach((inv) => {
      const day = new Date(inv.created_at).toLocaleDateString('en-CA');
      if (!days[day]) days[day] = { count: 0, total: 0 };
      days[day].count++;
      days[day].total += inv.total_amount || 0;
    });
    return Object.entries(days).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const handleSurpriseAudit = (code: string, value: number) => {
    setActualCounts((prev) => ({ ...prev, [code]: value }));
  };

  const runSurpriseAudit = () => {
    setAuditTimestamp(new Date().toLocaleString('ar-LY'));
  };

  const printSalesSummary = () => {
    const rows = dailyBreakdown()
      .map(
        ([date, data]) =>
          `<tr><td>${date}</td><td>${data.count}</td><td>${formatNumber(data.total)} د.ل</td></tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>ملخص المبيعات</title>
<style>body{font-family:Arial;padding:20px;direction:rtl}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:center}th{background:#333;color:#fff}h1{text-align:center}</style>
</head><body>
<h1>ملخص المبيعات والتصنيع</h1>
<p>من: ${dateFrom || '----'} إلى: ${dateTo || '----'}</p>
<p>إجمالي الفواتير: ${filteredInvoices.length + filteredGoldInvoices.length}</p>
<p>إجمالي الإيرادات: ${formatNumber(totalRevenue + totalGoldRevenue)} د.ل</p>
<p>متوسط الفاتورة: ${formatNumber(avgInvoice)} د.ل</p>
<table><thead><tr><th>التاريخ</th><th>عدد الفواتير</th><th>الإجمالي</th></tr></thead>
<tbody>${rows || '<tr><td colspan="3">لا توجد بيانات</td></tr>'}</tbody></table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const printInventoryAudit = () => {
    const rows = items
      .map(
        (item) =>
          `<tr><td>${item.item_code}</td><td>${item.model_name}</td><td>${item.stock_qty}</td><td>${formatNumber(item.weight * item.price)} د.ل</td></tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>جرد المخزون</title>
<style>body{font-family:Arial;padding:20px;direction:rtl}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:center}th{background:#333;color:#fff}h1{text-align:center}</style>
</head><body>
<h1>جرد المخزون</h1>
<p>إجمالي القطع: ${items.length}</p>
<p>القيمة الإجمالية: ${formatNumber(items.reduce((s, i) => s + i.price * i.stock_qty, 0))} د.ل</p>
<table><thead><tr><th>الكود</th><th>الاسم</th><th>الكمية</th><th>القيمة</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const printProfitReport = () => {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>تقرير الأرباح</title>
<style>body{font-family:Arial;padding:20px;direction:rtl}h1{text-align:center}</style>
</head><body>
<h1>تقرير الأرباح - المبيعات والتصنيع</h1>
<p>من: ${dateFrom || '----'} إلى: ${dateTo || '----'}</p>
<p>إجمالي المبيعات والتصنيع: ${formatNumber(totalRevenue + totalGoldRevenue)} د.ل</p>
<p>إجمالي المرتجعات: ${formatNumber(totalReturns)} د.ل</p>
<p><strong>صافي الإيرادات: ${formatNumber(netRevenue)} د.ل</strong></p>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const printSurpriseAudit = () => {
    const rows = items
      .map((item) => {
        const actual = actualCounts[item.item_code] ?? item.stock_qty;
        const diff = actual - item.stock_qty;
        return `<tr style="${diff !== 0 ? 'background:#fee2e2;color:#991b1b' : ''}"><td>${item.item_code}</td><td>${item.model_name}</td><td>${item.stock_qty}</td><td>${actual}</td><td>${diff}</td></tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>جرد مفاجئ</title>
<style>body{font-family:Arial;padding:20px;direction:rtl}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:center}th{background:#333;color:#fff}h1{text-align:center}</style>
</head><body>
<h1>جرد مفاجئ</h1>
<p>التاريخ: ${auditTimestamp || new Date().toLocaleString('ar-LY')}</p>
<table><thead><tr><th>الكود</th><th>الاسم</th><th>المخزون بالنظام</th><th>العدد الفعلي</th><th>الفرق</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'sales', label: 'ملخص المبيعات', icon: BarChart3 },
    { key: 'inventory', label: 'جرد المخزون', icon: Package },
    { key: 'profit', label: 'تقرير الأرباح', icon: DollarSign },
    { key: 'surprise', label: 'جرد مفاجئ', icon: AlertTriangle },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
          <BarChart3 className="w-8 h-8 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-yellow-400">
            التقرير المالي والجرد
          </h1>
          <p className="text-gray-400">ملخصات وتقارير مالية شاملة</p>
        </div>
        <button
          onClick={loadData}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Date Range */}
      <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold">من تاريخ</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg"
            lang="en"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">إلى تاريخ</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg"
            lang="en"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales Summary */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {filteredInvoices.length + filteredGoldInvoices.length}
              </p>
              <p className="text-gray-400 text-sm">عدد الفواتير</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">
                {formatNumber(totalRevenue + totalGoldRevenue)} د.ل
              </p>
              <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">
                {formatNumber(avgInvoice)} د.ل
              </p>
              <p className="text-gray-400 text-sm">متوسط الفاتورة</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <Package className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">
                {filteredInvoices.reduce(
                  (sum, inv) =>
                    sum +
                    (inv.items?.reduce(
                      (s, it) => s + (it.quantity || 1),
                      0
                    ) || 0),
                  0
                ) + filteredGoldInvoices.reduce((sum, inv) => sum + (inv.total_pieces || 0), 0)}
              </p>
              <p className="text-gray-400 text-sm">إجمالي القطع</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-yellow-400 font-bold">التفصيل اليومي</h3>
              <button
                onClick={printSalesSummary}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-right text-yellow-400 font-bold">
                      التاريخ
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      عدد الفواتير
                    </th>
                    <th className="p-3 text-left text-yellow-400 font-bold">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBreakdown().length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-6 text-center text-gray-500"
                      >
                        لا توجد بيانات في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    dailyBreakdown().map(([date, data]) => (
                      <tr
                        key={date}
                        className="border-t border-gray-700 hover:bg-gray-700/50"
                      >
                        <td className="p-3 text-right text-white">{date}</td>
                        <td className="p-3 text-center text-gray-300">
                          {data.count}
                        </td>
                        <td className="p-3 text-left text-green-400 font-bold">
                          {formatNumber(data.total)} د.ل
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gold Manufacturing Invoices */}
          {filteredGoldInvoices.length > 0 && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-yellow-400 font-bold">فواتير التصنيع ({filteredGoldInvoices.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="p-3 text-right text-yellow-400 font-bold">رقم الفاتورة</th>
                      <th className="p-3 text-right text-yellow-400 font-bold">رقم الإيصال</th>
                      <th className="p-3 text-right text-yellow-400 font-bold">العميل</th>
                      <th className="p-3 text-center text-yellow-400 font-bold">التاريخ</th>
                      <th className="p-3 text-center text-yellow-400 font-bold">الوزن</th>
                      <th className="p-3 text-center text-yellow-400 font-bold">العدد</th>
                      <th className="p-3 text-left text-yellow-400 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoldInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-3 text-yellow-400 font-mono font-bold">{inv.invoice_number}</td>
                        <td className="p-3 text-green-400 font-mono">{inv.receipt_number}</td>
                        <td className="p-3 text-white">{inv.customer_name}</td>
                        <td className="p-3 text-center text-gray-300">{new Date(inv.created_at).toLocaleDateString('en-CA')}</td>
                        <td className="p-3 text-center text-gray-300">{(inv.total_weight || 0).toFixed(2)} جرام</td>
                        <td className="p-3 text-center text-gray-300">{inv.total_pieces || 0}</td>
                        <td className="p-3 text-left text-green-400 font-bold">{formatNumber(inv.total_amount)} د.ل</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <Package className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{items.length}</p>
              <p className="text-gray-400 text-sm">إجمالي الأصناف</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-green-400">
                {items.filter((i) => i.stock_qty > 0).length}
              </p>
              <p className="text-gray-400 text-sm">متوفر</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-red-400">
                {items.filter((i) => i.stock_qty <= 0).length}
              </p>
              <p className="text-gray-400 text-sm">نفذ</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-blue-400">
                {formatNumber(
                  items.reduce((s, i) => s + i.price * i.stock_qty, 0)
                )}{' '}
                د.ل
              </p>
              <p className="text-gray-400 text-sm">قيمة المخزون</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-yellow-400 font-bold">جرد المخزون</h3>
              <button
                onClick={printInventoryAudit}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-right text-yellow-400 font-bold">
                      الكود
                    </th>
                    <th className="p-3 text-right text-yellow-400 font-bold">
                      الاسم
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      الكمية
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      القيمة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.item_code}
                      className="border-t border-gray-700 hover:bg-gray-700/50"
                    >
                      <td className="p-3 text-right font-mono text-yellow-400">
                        {item.item_code}
                      </td>
                      <td className="p-3 text-right text-white">
                        {item.model_name}
                      </td>
                      <td
                        className={`p-3 text-center font-bold ${
                          item.stock_qty <= 0 ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        {item.stock_qty}
                      </td>
                      <td className="p-3 text-center text-green-400">
                        {formatNumber(item.price * item.stock_qty)} د.ل
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Profit Report */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <p className="text-gray-400 mb-1">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-green-400">
                {formatNumber(totalRevenue + totalGoldRevenue)} د.ل
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <p className="text-gray-400 mb-1">إجمالي المرتجعات</p>
              <p className="text-2xl font-bold text-red-400">
                {formatNumber(totalReturns)} د.ل
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/30">
              <p className="text-gray-400 mb-1">صافي الإيرادات</p>
              <p className="text-3xl font-bold text-yellow-400">
                {formatNumber(netRevenue)} د.ل
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-yellow-400 font-bold">تفاصيل الأرباح</h3>
              <button
                onClick={printProfitReport}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-300">المبيعات + التصنيع في الفترة</span>
                <span className="text-green-400 font-bold">
                  {formatNumber(totalRevenue + totalGoldRevenue)} د.ل
                </span>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-300">المرتجعات في الفترة</span>
                <span className="text-red-400 font-bold">
                  -{formatNumber(totalReturns)} د.ل
                </span>
              </div>
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 flex justify-between items-center">
                <span className="text-white font-bold text-lg">
                  صافي الإيرادات
                </span>
                <span className="text-yellow-400 font-bold text-2xl">
                  {formatNumber(netRevenue)} د.ل
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Surprise Audit */}
      {activeTab === 'surprise' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-yellow-400 font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                جرد مفاجئ
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={runSurpriseAudit}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  بدء الجرد
                </button>
                <button
                  onClick={printSurpriseAudit}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
              </div>
            </div>
            {auditTimestamp && (
              <div className="p-3 bg-gray-700/50 text-center text-gray-400 text-sm">
                تاريخ الجرد: {auditTimestamp}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-right text-yellow-400 font-bold">
                      الكود
                    </th>
                    <th className="p-3 text-right text-yellow-400 font-bold">
                      الاسم
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      المخزون بالنظام
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      العدد الفعلي
                    </th>
                    <th className="p-3 text-center text-yellow-400 font-bold">
                      الفرق
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const actual =
                      actualCounts[item.item_code] !== undefined
                        ? actualCounts[item.item_code]
                        : item.stock_qty;
                    const diff = actual - item.stock_qty;
                    return (
                      <tr
                        key={item.item_code}
                        className={`border-t border-gray-700 ${
                          diff !== 0 ? 'bg-red-900/30' : 'hover:bg-gray-700/50'
                        }`}
                      >
                        <td className="p-3 text-right font-mono text-yellow-400">
                          {item.item_code}
                        </td>
                        <td className="p-3 text-right text-white">
                          {item.model_name}
                        </td>
                        <td className="p-3 text-center text-gray-300">
                          {item.stock_qty}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="text" inputMode="decimal"
                            min={0}
                            value={
                              actualCounts[item.item_code] !== undefined
                                ? actualCounts[item.item_code]
                                : item.stock_qty
                            }
                            onChange={(e) =>
                              handleSurpriseAudit(
                                item.item_code,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-20 text-center bg-gray-700 border rounded px-2 py-1 text-white font-bold ${
                              diff !== 0
                                ? 'border-red-500'
                                : 'border-gray-600'
                            }`}
                          />
                        </td>
                        <td
                          className={`p-3 text-center font-bold ${
                            diff > 0
                              ? 'text-green-400'
                              : diff < 0
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditReportPage;
