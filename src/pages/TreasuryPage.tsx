import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Printer, Wallet, Calculator, FileText, ChevronDown, Receipt, DollarSign, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import {
  getAccounts,
  getJournalEntries,
  addJournalEntry,
  getDailyClosings,
  performDailyClosing,
  generateDailyReport,
  printDailyReport,
  printJournalEntries,
  getTaxRecords,
  addTaxRecord,
  updateTaxStatus,
  Account,
  JournalEntry,
  JournalEntryType,
  TaxRecord,
  BudgetItem,
  MonthlyClosing,
  getBudgets,
  saveBudget,
  updateBudgetActuals,
  performMonthlyClosing,
  getMonthlyClosing,
  getMonthlyClosings,
  generateProfitLoss,
  generateBalanceSheet,
  generateMonthlySummary,
} from '../services/treasury';

const TreasuryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journal' | 'accounts' | 'closing' | 'tax' | 'budget' | 'monthly'>('journal');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailyClosings, setDailyClosings] = useState<any[]>([]);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>([]);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [closingNotes, setClosingNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(getAccounts());
    setJournalEntries(getJournalEntries());
    setDailyClosings(getDailyClosings());
    setTaxRecords(getTaxRecords());
    updateBudgetActuals(selectedMonth);
    setBudgets(getBudgets(selectedMonth));
    setMonthlyClosings(getMonthlyClosings());
  };

  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const direction = formData.get('entryDirection') as string;
    const amount = parseFloat(formData.get('amount') as string) || 0;

    addJournalEntry({
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      debit: direction === 'debit' ? amount : 0,
      credit: direction === 'credit' ? amount : 0,
      accountCode: formData.get('accountCode') as string,
      entryType: formData.get('entryType') as JournalEntryType,
      createdBy: 'Admin',
    });

    setShowEntryModal(false);
    loadData();
  };

  const handleDailyClosing = () => {
    performDailyClosing(selectedDate, closingNotes);
    setShowClosingModal(false);
    setClosingNotes('');
    loadData();
  };

  const handlePrintReport = () => {
    printDailyReport(selectedDate);
  };

  const handlePrintJournalEntries = () => {
    printJournalEntries(selectedDate);
  };

  const handleAddTax = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    addTaxRecord({
      period: formData.get('period') as string,
      taxableAmount: parseFloat(formData.get('taxableAmount') as string) || 0,
      taxRate: parseFloat(formData.get('taxRate') as string) || 0,
      taxAmount: parseFloat(formData.get('taxAmount') as string) || 0,
      status: 'pending',
      dueDate: formData.get('dueDate') as string,
    });

    setShowTaxModal(false);
    loadData();
  };

  const handleAddBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    saveBudget({
      accountCode: formData.get('accountCode') as string,
      month: selectedMonth,
      planned: parseFloat(formData.get('planned') as string) || 0,
      notes: formData.get('budgetNotes') as string,
    });
    setShowBudgetModal(false);
    loadData();
  };

  const handleMonthlyClosing = () => {
    try {
      performMonthlyClosing(selectedMonth, closingNotes);
      setShowClosingModal(false);
      setClosingNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const printMonthlyReport = (month: string) => {
    const summary = generateMonthlySummary(month);
    const pl = generateProfitLoss(month);
    const bs = generateBalanceSheet();
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>تقرير شهري - ${month}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Tahoma,sans-serif;padding:20px;color:#1a1a1a}
.header{text-align:center;border-bottom:3px double #333;padding-bottom:15px;margin-bottom:20px}
.header h1{font-size:22px}
.section{margin:15px 0;border:1px solid #ccc;border-radius:6px;overflow:hidden}
.section-title{background:#f0f0f0;padding:8px 12px;font-weight:bold;border-bottom:1px solid #ccc}
table{width:100%;border-collapse:collapse}
th{background:#333;color:#fff;padding:8px;text-align:right;font-size:12px}
td{padding:8px;border-bottom:1px solid #eee;font-size:12px}
.total{background:#f5f5f5;font-weight:bold}
.green{color:#16a34a}.red{color:#dc2626}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin:15px 0}
.summary-box{background:#f8f8f8;padding:15px;border-radius:6px;text-align:center}
.summary-box label{display:block;color:#666;font-size:12px;margin-bottom:5px}
.summary-box span{font-size:18px;font-weight:bold}
@media print{body{padding:0}}
</style></head><body>
<div class="header">
<h1>التقرير الشهري - ${month}</h1>
<p>مجوهرات الحمروني</p>
<p>تاريخ الطباعة: ${new Date().toLocaleDateString('en-CA')}</p>
</div>
<div class="summary">
<div class="summary-box"><label>إجمالي الإيرادات</label><span class="green">${pl.totalRevenue.toLocaleString()} د.ل</span></div>
<div class="summary-box"><label>إجمالي المصروفات</label><span class="red">${pl.totalExpenses.toLocaleString()} د.ل</span></div>
<div class="summary-box"><label>صافي الربح</label><span style="color:${pl.netProfit>=0?'#16a34a':'#dc2626'}">${pl.netProfit.toLocaleString()} د.ل</span></div>
</div>
<div class="section"><div class="section-title">قائمة الدخل (الأرباح والخسائر)</div>
<table><tr><th>البيان</th><th>المبلغ</th></tr>
${pl.revenue.map(r => `<tr><td>${r.name}</td><td class="green">${r.amount.toLocaleString()} د.ل</td></tr>`).join('')}
<tr class="total"><td>إجمالي الإيرادات</td><td class="green">${pl.totalRevenue.toLocaleString()} د.ل</td></tr>
${pl.expenses.map(e => `<tr><td>${e.name}</td><td class="red">${e.amount.toLocaleString()} د.ل</td></tr>`).join('')}
<tr class="total"><td>إجمالي المصروفات</td><td class="red">${pl.totalExpenses.toLocaleString()} د.ل</td></tr>
<tr class="total"><td>صافي الربح</td><td style="color:${pl.netProfit>=0?'#16a34a':'#dc2626'};font-size:16px">${pl.netProfit.toLocaleString()} د.ل</td></tr>
</table></div>
<div class="section"><div class="section-title">الميزانية العمومية</div>
<table><tr><th>الأصول</th><th>المبلغ</th></tr>
${bs.assets.map(a => `<tr><td>${a.name}</td><td>${a.balance.toLocaleString()} د.ل</td></tr>`).join('')}
<tr class="total"><td>إجمالي الأصول</td><td>${bs.totalAssets.toLocaleString()} د.ل</td></tr>
<tr><th>الالتزامات</th><th>المبلغ</th></tr>
${bs.liabilities.map(l => `<tr><td>${l.name}</td><td>${l.balance.toLocaleString()} د.ل</td></tr>`).join('')}
<tr class="total"><td>إجمالي الالتزامات</td><td>${bs.totalLiabilities.toLocaleString()} د.ل</td></tr>
<tr><th>حقوق الملكية</th><th>المبلغ</th></tr>
${bs.equity.map(eq => `<tr><td>${eq.name}</td><td>${eq.balance.toLocaleString()} د.ل</td></tr>`).join('')}
<tr class="total"><td>إجمالي حقوق الملكية</td><td>${bs.totalEquity.toLocaleString()} د.ل</td></tr>
</table></div>
<div class="section"><div class="section-title">ملخص النشاط</div>
<table>
<tr><td>عدد المبيعات</td><td>${summary.salesCount}</td></tr>
<tr><td>قيمة المبيعات</td><td class="green">${summary.totalSales.toLocaleString()} د.ل</td></tr>
<tr><td>عدد المرتجعات</td><td>${summary.returnCount}</td></tr>
<tr><td>قيمة المرتجعات</td><td class="red">${summary.totalReturns.toLocaleString()} د.ل</td></tr>
<tr class="total"><td>صافي المبيعات</td><td>${(summary.totalSales - summary.totalReturns).toLocaleString()} د.ل</td></tr>
</table></div>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  const getEntryTypeLabel = (type: JournalEntryType) => {
    const labels: Record<JournalEntryType, string> = {
      sale: 'بيع',
      purchase: 'شراء',
      expense: 'مصروف',
      deposit: 'إيداع',
      withdrawal: 'سحب',
      return: 'مرتجع',
      salary: 'راتب',
      tax: 'ضريبة',
      transfer: 'تحويل',
    };
    return labels[type] || type;
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asset: 'أصول',
      liability: 'التزامات',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات',
    };
    return labels[type] || type;
  };

  const cashBalance = accounts.find(a => a.code === '1001')?.balance || 0;
  const todayEntries = getJournalEntries(selectedDate);
  const todayTotalDebit = todayEntries.filter(e => e.debit > 0).reduce((sum, e) => sum + e.debit, 0);
  const todayTotalCredit = todayEntries.filter(e => e.credit > 0).reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">الخزينة</h1>
          <p className="text-gray-400 mt-1">إدارة الحسابات والقيد اليومي</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-green-100 text-sm">رصيد الصندوق</p>
            <p className="text-4xl font-bold text-white">{cashBalance.toLocaleString()} د.ل</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'journal' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>سجل القيد</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'accounts' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>الحسابات</span>
        </button>
        <button
          onClick={() => setActiveTab('closing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'closing' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>الإقفال اليومي</span>
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'tax' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>الضرائب</span>
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'budget' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>الميزانية</span>
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'monthly' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>التقارير الشهرية</span>
        </button>
      </div>

      {/* Journal Tab */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">سجل القيد المحاسبي</h2>
            <button
              onClick={() => setShowEntryModal(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة قيد</span>
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الوصف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">نوع القيد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحساب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">مدين</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        لا يوجد قيود محاسبية
                      </td>
                    </tr>
                  ) : (
                    journalEntries.slice(0, 50).map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-300">{new Date(entry.date).toLocaleDateString('en-CA')}</td>
                        <td className="px-4 py-3 text-white">{entry.description}</td>
                        <td className="px-4 py-3 text-yellow-400">{getEntryTypeLabel(entry.entryType)}</td>
                        <td className="px-4 py-3 text-blue-400">{entry.accountCode}</td>
                        <td className="px-4 py-3 text-green-400">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-red-400">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">خطة الحسابات</h2>

          {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => (
            <div key={type} className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
              <div className="bg-gray-900/50 px-4 py-3">
                <h3 className="font-bold text-yellow-400">{getAccountTypeLabel(type)}</h3>
              </div>
              <div className="divide-y divide-gray-700">
                {accounts.filter(a => a.type === type).map((account) => (
                  <div key={account.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-700/30">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 font-mono">{account.code}</span>
                      <span className="text-white">{account.name}</span>
                    </div>
                    <span className={`font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {account.balance.toLocaleString()} د.ل
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Closing Tab */}
      {activeTab === 'closing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-white">الإقفال اليومي</h2>
            <div className="flex gap-3 flex-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                lang="en"
              />
              <button
                onClick={handlePrintJournalEntries}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة القيودات</span>
              </button>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة التقرير</span>
              </button>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">إجمالي المدين</p>
              <p className="text-2xl font-bold text-green-400">{todayTotalDebit.toLocaleString()} د.ل</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">إجمالي الدائن</p>
              <p className="text-2xl font-bold text-red-400">{todayTotalCredit.toLocaleString()} د.ل</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">عدد الحركات</p>
              <p className="text-2xl font-bold text-white">{todayEntries.length}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">الرصيد الحالي</p>
              <p className="text-2xl font-bold text-yellow-400">{cashBalance.toLocaleString()} د.ل</p>
            </div>
          </div>

          <button
            onClick={() => setShowClosingModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all font-medium"
          >
            <Calculator className="w-5 h-5" />
            <span>إجراء إقفال يومي</span>
          </button>

          {/* Journal entries for selected date */}
          <h3 className="text-lg font-bold text-white mt-6">قيودات التاريخ: {new Date(selectedDate).toLocaleDateString('en-CA')}</h3>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الوصف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">نوع القيد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحساب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">مدين</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {todayEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        لا توجد قيودات في هذا التاريخ
                      </td>
                    </tr>
                  ) : (
                    todayEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-white">{entry.description}</td>
                        <td className="px-4 py-3 text-yellow-400">{getEntryTypeLabel(entry.entryType)}</td>
                        <td className="px-4 py-3 text-blue-400">{entry.accountCode}</td>
                        <td className="px-4 py-3 text-green-400">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-red-400">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closings History */}
          <h3 className="text-lg font-bold text-white mt-6">سجل الإقفال</h3>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الرصيد الافتتاحي</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">إجمالي المدين</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">إجمالي الدائن</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الرصيد الختامي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dailyClosings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        لا يوجد إقفال يومي
                      </td>
                    </tr>
                  ) : (
                    dailyClosings.slice(0, 30).map((closing) => (
                      <tr key={closing.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-yellow-400">{new Date(closing.date).toLocaleDateString('en-CA')}</td>
                        <td className="px-4 py-3 text-gray-300">{closing.openingBalance.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-green-400">{closing.totalDebit.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-red-400">{closing.totalCredit.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-white font-bold">{closing.closingBalance.toLocaleString()} د.ل</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Tab */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">سجل التخليص الضريبي</h2>
            <button
              onClick={() => setShowTaxModal(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة سجل ضريبي</span>
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الفترة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">المبلغ الخاضع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">نسبة الضريبة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">مبلغ الضريبة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">تاريخ الاستحقاق</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {taxRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        لا يوجد سجلات ضريبية
                      </td>
                    </tr>
                  ) : (
                    taxRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-white">{record.period}</td>
                        <td className="px-4 py-3 text-gray-300">{record.taxableAmount.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-blue-400">{record.taxRate}%</td>
                        <td className="px-4 py-3 text-red-400">{record.taxAmount.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-gray-300">{new Date(record.dueDate).toLocaleDateString('en-CA')}</td>
                        <td className="px-4 py-3">
                          <select
                            value={record.status}
                            onChange={(e) => updateTaxStatus(record.id, e.target.value as any, record.paidDate)}
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white cursor-pointer ${
                              record.status === 'paid' ? 'bg-green-500' :
                              record.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                          >
                            <option value="pending">معلق</option>
                            <option value="paid">مدفوع</option>
                            <option value="exempt">معفى</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-white">الميزانية الشهرية</h2>
            <div className="flex gap-3 flex-wrap items-center">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); loadData(); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة بند</span>
              </button>
            </div>
          </div>

          {/* Budget vs Actual */}
          {budgets.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الحساب</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">المخطط</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الفعلي</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الفرق</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {budgets.map((b) => {
                      const account = accounts.find(a => a.code === b.accountCode);
                      const diff = b.planned > 0 ? ((b.actual - b.planned) / b.planned * 100) : 0;
                      const isOver = b.actual > b.planned && b.planned > 0;
                      return (
                        <tr key={b.id} className="hover:bg-gray-700/30">
                          <td className="px-4 py-3 text-white">{account?.name || b.accountCode}</td>
                          <td className="px-4 py-3 text-blue-400">{b.planned.toLocaleString()} د.ل</td>
                          <td className="px-4 py-3 text-yellow-400">{b.actual.toLocaleString()} د.ل</td>
                          <td className={`px-4 py-3 font-bold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                            {(b.actual - b.planned).toLocaleString()} د.ل
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(Math.abs(diff), 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {budgets.length === 0 && (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center text-gray-400">
              لا توجد بنود ميزانية لهذا الشهر. اضغط "إضافة بند" لبدء التخطيط.
            </div>
          )}
        </div>
      )}

      {/* Monthly Reports Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-white">التقارير الشهرية</h2>
            <div className="flex gap-3 flex-wrap items-center">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={() => printMonthlyReport(selectedMonth)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة التقرير</span>
              </button>
              <button
                onClick={() => setShowClosingModal(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all font-medium"
              >
                <Calculator className="w-5 h-5" />
                <span>إقفال شهري</span>
              </button>
            </div>
          </div>

          {/* Monthly Summary Cards */}
          {(() => {
            const summary = generateMonthlySummary(selectedMonth);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-green-400">{summary.totalSales.toLocaleString()} د.ل</p>
                  <p className="text-xs text-gray-500 mt-1">{summary.salesCount} فاتورة</p>
                </div>
                <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">المرتجعات</p>
                  <p className="text-2xl font-bold text-red-400">{summary.totalReturns.toLocaleString()} د.ل</p>
                  <p className="text-xs text-gray-500 mt-1">{summary.returnCount} مرتجع</p>
                </div>
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">المصروفات</p>
                  <p className="text-2xl font-bold text-blue-400">{summary.totalExpenses.toLocaleString()} د.ل</p>
                  <p className="text-xs text-gray-500 mt-1">{summary.expenseCount} مصروف</p>
                </div>
                <div className={`rounded-xl p-4 border ${summary.netProfit >= 0 ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                  <p className="text-gray-400 text-sm">صافي الربح</p>
                  <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {summary.netProfit.toLocaleString()} د.ل
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{summary.transactionCount} حركة</p>
                </div>
              </div>
            );
          })()}

          {/* P&L Preview */}
          {(() => {
            const pl = generateProfitLoss(selectedMonth);
            if (pl.totalRevenue === 0 && pl.totalExpenses === 0) return null;
            return (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-900/50 px-4 py-3">
                  <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> قائمة الدخل
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-green-400 font-bold mb-2">الإيرادات</h4>
                      {pl.revenue.map(r => (
                        <div key={r.code} className="flex justify-between py-1 border-b border-gray-700">
                          <span className="text-gray-300">{r.name}</span>
                          <span className="text-green-400">{r.amount.toLocaleString()} د.ل</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold border-t border-green-500 mt-2">
                        <span className="text-green-400">الإجمالي</span>
                        <span className="text-green-400">{pl.totalRevenue.toLocaleString()} د.ل</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-bold mb-2">المصروفات</h4>
                      {pl.expenses.map(e => (
                        <div key={e.code} className="flex justify-between py-1 border-b border-gray-700">
                          <span className="text-gray-300">{e.name}</span>
                          <span className="text-red-400">{e.amount.toLocaleString()} د.ل</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold border-t border-red-500 mt-2">
                        <span className="text-red-400">الإجمالي</span>
                        <span className="text-red-400">{pl.totalExpenses.toLocaleString()} د.ل</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-center mt-4 p-3 rounded-lg ${pl.netProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <span className="text-gray-400">صافي الربح: </span>
                    <span className={`text-2xl font-bold ${pl.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pl.netProfit.toLocaleString()} د.ل
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Balance Sheet Preview */}
          {(() => {
            const bs = generateBalanceSheet();
            if (bs.totalAssets === 0 && bs.totalLiabilities === 0) return null;
            return (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-900/50 px-4 py-3">
                  <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> الميزانية العمومية
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">الأصول</h4>
                    {bs.assets.map(a => (
                      <div key={a.code} className="flex justify-between py-1 border-b border-gray-700 text-sm">
                        <span className="text-gray-300">{a.name}</span>
                        <span className="text-white">{a.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-t border-blue-500 mt-2 text-sm">
                      <span className="text-blue-400">الإجمالي</span>
                      <span className="text-blue-400">{bs.totalAssets.toLocaleString()} د.ل</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold mb-2">الالتزامات</h4>
                    {bs.liabilities.map(l => (
                      <div key={l.code} className="flex justify-between py-1 border-b border-gray-700 text-sm">
                        <span className="text-gray-300">{l.name}</span>
                        <span className="text-white">{l.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-t border-red-500 mt-2 text-sm">
                      <span className="text-red-400">الإجمالي</span>
                      <span className="text-red-400">{bs.totalLiabilities.toLocaleString()} د.ل</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-bold mb-2">حقوق الملكية</h4>
                    {bs.equity.map(eq => (
                      <div key={eq.code} className="flex justify-between py-1 border-b border-gray-700 text-sm">
                        <span className="text-gray-300">{eq.name}</span>
                        <span className="text-white">{eq.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-t border-yellow-500 mt-2 text-sm">
                      <span className="text-yellow-400">الإجمالي</span>
                      <span className="text-yellow-400">{bs.totalEquity.toLocaleString()} د.ل</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Monthly Closings History */}
          {monthlyClosings.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
              <div className="bg-gray-900/50 px-4 py-3">
                <h3 className="font-bold text-yellow-400">سجل الإقفال الشهري</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الشهر</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الإيرادات</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">المصروفات</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">صافي الربح</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الأصول</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">بواسطة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {monthlyClosings.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-yellow-400 font-bold">{c.month}</td>
                        <td className="px-4 py-3 text-green-400">{c.totalRevenue.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-red-400">{c.totalExpenses.toLocaleString()} د.ل</td>
                        <td className={`px-4 py-3 font-bold ${c.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {c.netProfit.toLocaleString()} د.ل
                        </td>
                        <td className="px-4 py-3 text-white">{c.totalAssets.toLocaleString()} د.ل</td>
                        <td className="px-4 py-3 text-gray-400">{c.closedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400">إضافة بند ميزانية - {selectedMonth}</h2>
              <button onClick={() => setShowBudgetModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">الحساب *</label>
                <select name="accountCode" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  {accounts.map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">المبلغ المخطط (د.ل) *</label>
                <input type="text" inputMode="decimal" name="planned" step="0.01" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                <input type="text" name="budgetNotes" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-lg font-medium">إضافة</button>
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400">إضافة قيد محاسبي</h2>
              <button onClick={() => setShowEntryModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={selectedDate}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    lang="en"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع القيد</label>
                  <select
                    name="entryType"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="sale">بيع</option>
                    <option value="purchase">شراء</option>
                    <option value="expense">مصروف</option>
                    <option value="deposit">إيداع</option>
                    <option value="withdrawal">سحب</option>
                    <option value="return">مرتجع</option>
                    <option value="salary">راتب</option>
                    <option value="tax">ضريبة</option>
                    <option value="transfer">تحويل</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">الوصف *</label>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="وصف العملية..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">رقم الحساب</label>
                  <select
                    name="accountCode"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="1001">1001 - الصندوق</option>
                    <option value="1002">1002 - البنك</option>
                    <option value="1003">1003 - العملاء</option>
                    <option value="2001">2001 - الموردين</option>
                    <option value="3001">3001 - الإيرادات</option>
                    <option value="4002">4002 - المصروفات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع الرصيد</label>
                  <select
                    name="entryDirection"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="debit">مدين (+)</option>
                    <option value="credit">دائن (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">المبلغ (د.ل)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-lg font-medium">
                  إضافة القيد
                </button>
                <button type="button" onClick={() => setShowEntryModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">إجراء الإقفال اليومي</h2>
            <p className="text-gray-300 mb-4">هل أنت متأكد من إجراء إقفال يومي للتاريخ: {new Date(selectedDate).toLocaleDateString('en-CA')}</p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">ملاحظات (اختياري)</label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={handleDailyClosing} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium">
                تأكيد الإقفال
              </button>
              <button onClick={() => setShowClosingModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400">إضافة سجل ضريبي</h2>
              <button onClick={() => setShowTaxModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTax} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الفترة الضريبية *</label>
                  <input
                    type="text"
                    name="period"
                    required
                    placeholder="مثل: الربع الأول 2024"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    lang="en"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">المبلغ الخاضع للضريبة (د.ل)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="taxableAmount"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نسبة الضريبة (%)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="taxRate"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">مبلغ الضريبة (د.ل)</label>
                  <input
                    type="text" inputMode="decimal"
                    name="taxAmount"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-lg font-medium">
                  إضافة السجل
                </button>
                <button type="button" onClick={() => setShowTaxModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryPage;
