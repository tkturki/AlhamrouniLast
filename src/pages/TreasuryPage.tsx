import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Printer, Wallet, Calculator, FileText, ChevronDown, Receipt, DollarSign, Calendar } from 'lucide-react';
import {
  getAccounts,
  getJournalEntries,
  addJournalEntry,
  getDailyClosings,
  performDailyClosing,
  generateDailyReport,
  printDailyReport,
  getTaxRecords,
  addTaxRecord,
  updateTaxStatus,
  Account,
  JournalEntry,
  JournalEntryType,
  TaxRecord,
} from '../services/treasury';

const TreasuryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journal' | 'accounts' | 'closing' | 'tax'>('journal');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailyClosings, setDailyClosings] = useState<any[]>([]);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingNotes, setClosingNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(getAccounts());
    setJournalEntries(getJournalEntries());
    setDailyClosings(getDailyClosings());
    setTaxRecords(getTaxRecords());
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
                        <td className="px-4 py-3 text-gray-300">{new Date(entry.date).toLocaleDateString('ar-LY')}</td>
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
            <div className="flex gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              />
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
                        <td className="px-4 py-3 text-yellow-400">{new Date(closing.date).toLocaleDateString('ar-LY')}</td>
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
                        <td className="px-4 py-3 text-gray-300">{new Date(record.dueDate).toLocaleDateString('ar-LY')}</td>
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
                    type="number"
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
            <p className="text-gray-300 mb-4">هل أنت متأكد من إجراء إقفال يومي للتاريخ: {new Date(selectedDate).toLocaleDateString('ar-LY')}</p>

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
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">المبلغ الخاضع للضريبة (د.ل)</label>
                  <input
                    type="number"
                    name="taxableAmount"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">مبلغ الضريبة (د.ل)</label>
                  <input
                    type="number"
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
