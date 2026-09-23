import React, { useState, useEffect } from 'react';
import { Plus, Search, Printer, CheckCircle, AlertTriangle, Package, Calendar, FileText, X, BarChart3 } from 'lucide-react';
import { serverInventoryApi, serverItemsApi, onServerEvent } from '../services/serverApi';
import { formatNumber, JewelryItem } from '../services/supabase';

interface InventoryCountItem {
  item_code: string;
  model_name: string;
  karat: string;
  system_qty: number;
  actual_qty: number;
  difference: number;
}

interface InventoryCount {
  id: string;
  count_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  count_date: string;
  items: InventoryCountItem[];
  total_items: number;
  total_differences: number;
  notes: string;
  created_at: string;
  status: 'draft' | 'completed';
}

const InventoryCountPage: React.FC = () => {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [allItems, setAllItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCount, setShowNewCount] = useState(false);
  const [currentCount, setCurrentCount] = useState<InventoryCount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const [newCountForm, setNewCountForm] = useState({
    count_type: 'daily' as InventoryCount['count_type'],
    notes: '',
  });

  const countTypeLabels: Record<string, string> = {
    daily: 'جرد يومي',
    weekly: 'جرد أسبوعي',
    monthly: 'جرد شهري',
    quarterly: 'جرد ربع سنوي',
    half_yearly: 'جرد نصف سنوي',
    yearly: 'جرد سنوي',
  };

  const countTypeColors: Record<string, string> = {
    daily: 'bg-blue-500',
    weekly: 'bg-green-500',
    monthly: 'bg-yellow-500',
    quarterly: 'bg-purple-500',
    half_yearly: 'bg-orange-500',
    yearly: 'bg-red-500',
  };

  useEffect(() => {
    loadData();
    
    const unsub = onServerEvent('inventory_counts_updated', () => {
      loadData();
    });
    
    return () => unsub();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [countsData, itemsData] = await Promise.all([
        serverInventoryApi.getAll(),
        serverItemsApi.getAll(),
      ]);
      setCounts(countsData);
      setAllItems(itemsData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const startNewCount = () => {
    const items: InventoryCountItem[] = allItems.map(item => ({
      item_code: item.item_code,
      model_name: item.model_name || item.category || '',
      karat: item.karat || '',
      system_qty: item.stock_qty || 0,
      actual_qty: 0,
      difference: 0 - (item.stock_qty || 0),
    }));

    const newCount: InventoryCount = {
      id: Date.now().toString(),
      count_type: newCountForm.count_type,
      count_date: new Date().toISOString().split('T')[0],
      items,
      total_items: items.length,
      total_differences: items.reduce((sum, i) => sum + Math.abs(i.difference), 0),
      notes: newCountForm.notes,
      created_at: new Date().toISOString(),
      status: 'draft',
    };

    setCurrentCount(newCount);
    setShowNewCount(false);
  };

  const updateActualQty = (itemCode: string, qty: number) => {
    if (!currentCount) return;

    const updatedItems = currentCount.items.map(item => {
      if (item.item_code === itemCode) {
        const difference = qty - item.system_qty;
        return { ...item, actual_qty: qty, difference };
      }
      return item;
    });

    setCurrentCount({
      ...currentCount,
      items: updatedItems,
      total_differences: updatedItems.reduce((sum, i) => sum + Math.abs(i.difference), 0),
    });
  };

  const saveCount = async () => {
    if (!currentCount) return;
    
    await serverInventoryApi.add(currentCount);
    setCurrentCount(null);
    loadData();
  };

  const printCount = () => {
    if (!currentCount) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const rows = currentCount.items.map(item => `
      <tr>
        <td style="border:1px solid #333;padding:6px;text-align:right">${item.item_code}</td>
        <td style="border:1px solid #333;padding:6px;text-align:right">${item.model_name}</td>
        <td style="border:1px solid #333;padding:6px;text-align:center">${item.karat}</td>
        <td style="border:1px solid #333;padding:6px;text-align:center;font-weight:bold">${item.system_qty}</td>
        <td style="border:1px solid #333;padding:6px;text-align:center;font-weight:bold;color:#2563eb">${item.actual_qty}</td>
        <td style="border:1px solid #333;padding:6px;text-align:center;font-weight:bold;color:${item.difference !== 0 ? '#dc2626' : '#16a34a'}">${item.difference > 0 ? '+' : ''}${item.difference}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الجرد</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .store-name { font-size: 22px; font-weight: bold; }
          .count-type { font-size: 16px; color: #666; margin-top: 5px; }
          .info { display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f0f0f0; font-weight: bold; }
          .summary { margin-top: 20px; padding: 15px; background: #f5f5f5; border: 1px solid #ccc; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">مجوهرات الحمروني</div>
          <div class="count-type">${countTypeLabels[currentCount.count_type]} - ${currentCount.count_date}</div>
        </div>
        <div class="info">
          <span>إجمالي الأصناف: ${currentCount.total_items}</span>
          <span>عدد الفروقات: ${currentCount.items.filter(i => i.difference !== 0).length}</span>
          <span>الحالة: ${currentCount.status === 'completed' ? 'مكتمل' : 'مسودة'}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="border:1px solid #333;padding:8px;text-align:right">كود الصنف</th>
              <th style="border:1px solid #333;padding:8px;text-align:right">اسم الصنف</th>
              <th style="border:1px solid #333;padding:8px;text-align:center">العيار</th>
              <th style="border:1px solid #333;padding:8px;text-align:center">الكمية بالنظام</th>
              <th style="border:1px solid #333;padding:8px;text-align:center">الكمية الفعلية</th>
              <th style="border:1px solid #333;padding:8px;text-align:center">الفروق</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${currentCount.notes ? `<div class="summary"><strong>ملاحظات:</strong> ${currentCount.notes}</div>` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredItems = currentCount?.items.filter(item => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return item.item_code?.toLowerCase().includes(q) ||
             item.model_name?.toLowerCase().includes(q);
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-yellow-400" />
            الجرد
          </h1>
          <p className="text-gray-400 text-sm mt-1">جرد يومي - أسبوعي - شهري - ربع سنوي - نصف سنوي - سنوي</p>
        </div>
        <div className="flex gap-2">
          {currentCount && (
            <>
              <button
                onClick={printCount}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                طباعة
              </button>
              <button
                onClick={saveCount}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                حفظ الجرد
              </button>
              <button
                onClick={() => setCurrentCount(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                إلغاء
              </button>
            </>
          )}
          {!currentCount && (
            <button
              onClick={() => setShowNewCount(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              جرد جديد
            </button>
          )}
        </div>
      </div>

      {/* Current Count */}
      {currentCount && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {countTypeLabels[currentCount.count_type]} - {currentCount.count_date}
              </h2>
              <p className="text-gray-400 text-sm">
                إجمالي الأصناف: {currentCount.total_items} |
                فروقات: {currentCount.items.filter(i => i.difference !== 0).length}
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث في الأصناف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white pr-10 pl-4 py-2 rounded-lg"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-4 py-3 text-right text-sm text-gray-300">كود الصنف</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-300">اسم الصنف</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-300">العيار</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-300">الكمية بالنظام</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-300">الكمية الفعلية</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-300">الفروق</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.item_code} className={`border-t border-gray-700 ${item.difference !== 0 ? 'bg-red-500/10' : ''}`}>
                    <td className="px-4 py-3 text-white font-mono text-sm">{item.item_code}</td>
                    <td className="px-4 py-3 text-white">{item.model_name}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{item.karat}</td>
                    <td className="px-4 py-3 text-center text-gray-300 font-bold">{item.system_qty}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text" inputMode="decimal"
                        lang="en"
                        min="0"
                        value={item.actual_qty || ''}
                        onChange={(e) => updateActualQty(item.item_code, parseInt(e.target.value) || 0)}
                        className="w-20 bg-gray-700 border border-gray-600 text-white text-center px-2 py-1 rounded"
                      />
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${item.difference !== 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Counts */}
      {!currentCount && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white">سجل الجرود السابقة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-4 py-3 text-right text-sm text-gray-300">نوع الجرد</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-300">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-300">عدد الأصناف</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-300">الفروقات</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-300">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {counts.map(count => (
                  <tr key={count.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${countTypeColors[count.count_type]}`}>
                        {countTypeLabels[count.count_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{count.count_date}</td>
                    <td className="px-4 py-3 text-gray-300">{count.total_items}</td>
                    <td className="px-4 py-3 text-red-400">{count.items.filter(i => i.difference !== 0).length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${count.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {count.status === 'completed' ? 'مكتمل' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {counts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      لا توجد جرود سابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Count Modal */}
      {showNewCount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">جرد جديد</h3>
              <button onClick={() => setShowNewCount(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">نوع الجرد *</label>
                <select
                  value={newCountForm.count_type}
                  onChange={(e) => setNewCountForm({ ...newCountForm, count_type: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <option value="daily">جرد يومي</option>
                  <option value="weekly">جرد أسبوعي</option>
                  <option value="monthly">جرد شهري</option>
                  <option value="quarterly">جرد ربع سنوي</option>
                  <option value="half_yearly">جرد نصف سنوي</option>
                  <option value="yearly">جرد سنوي</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={newCountForm.notes}
                  onChange={(e) => setNewCountForm({ ...newCountForm, notes: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"
                  placeholder="ملاحظات على الجرد..."
                />
              </div>
              <p className="text-gray-400 text-sm">
                سيتم جرد جميع الأصناف الموجودة في المخزن ({allItems.length} صنف)
              </p>
              <button
                onClick={startNewCount}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold"
              >
                بدء الجرد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCountPage;
