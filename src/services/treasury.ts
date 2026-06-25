// Treasury Management System - Accounting Module
import { authApi } from './supabase';

// Journal Entry Types
export type JournalEntryType =
  | 'sale'           // بيع
  | 'purchase'       // شراء
  | 'expense'        // مصروف
  | 'deposit'        // إيداع
  | 'withdrawal'     // سحب
  | 'return'         // مرتجع
  | 'salary'         // راتب
  | 'tax'            // ضريبة
  | 'transfer';      // تحويل

export interface Account {
  id: string;
  code: string;       // رقم الحساب
  name: string;      // اسم الحساب
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debit: number;     // مدين
  credit: number;    // داين
  accountCode: string;
  entryType: JournalEntryType;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: JournalEntry[];
  closedBy: string;
  closedAt: string;
  notes?: string;
}

export interface TaxRecord {
  id: string;
  period: string;           // الفترة الضريبية
  taxableAmount: number;    // المبلغ الخاضع للضريبة
  taxRate: number;         // نسبة الضريبة
  taxAmount: number;       // مبلغ الضريبة
  status: 'pending' | 'paid' | 'exempt';
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

// Default Chart of Accounts (Libyan jewelry business)
const defaultAccounts: Account[] = [
  // الأصول
  { id: '1', code: '1001', name: 'الصندوق', type: 'asset', balance: 0 },
  { id: '2', code: '1002', name: 'البنك', type: 'asset', balance: 0 },
  { id: '3', code: '1003', name: 'العملاء', type: 'asset', balance: 0 },
  { id: '4', code: '1004', name: 'المخزون', type: 'asset', balance: 0 },
  { id: '5', code: '1005', name: 'الأصول الثابتة', type: 'asset', balance: 0 },

  // الالتزامات
  { id: '6', code: '2001', name: 'الموردين', type: 'liability', balance: 0 },
  { id: '7', code: '2002', name: 'الضرائب المستحقة', type: 'liability', balance: 0 },
  { id: '8', code: '2003', name: 'القروض', type: 'liability', balance: 0 },

  // الإيرادات
  { id: '9', code: '3001', name: 'إيرادات المبيعات', type: 'revenue', balance: 0 },
  { id: '10', code: '3002', name: 'إيرادات أخرى', type: 'revenue', balance: 0 },

  // المصروفات
  { id: '11', code: '4001', name: 'تكلفة البضاعة المباعة', type: 'expense', balance: 0 },
  { id: '12', code: '4002', name: 'مصروفات تشغيلية', type: 'expense', balance: 0 },
  { id: '13', code: '4003', name: 'رواتب وأجور', type: 'expense', balance: 0 },
  { id: '14', code: '4004', name: 'إيجارات', type: 'expense', balance: 0 },
  { id: '15', code: '4005', name: 'مصروفات أخرى', type: 'expense', balance: 0 },

  // حقوق الملكية
  { id: '16', code: '5001', name: 'رأس المال', type: 'equity', balance: 0 },
  { id: '17', code: '5002', name: 'الأرباح المحتجزة', type: 'equity', balance: 0 },
];

const ACCOUNTS_KEY = 'treasury_accounts';
const JOURNAL_KEY = 'treasury_journal';
const CLOSING_KEY = 'daily_closings';
const TAX_KEY = 'tax_records';

// Initialize accounts
const initAccounts = (): Account[] => {
  const existing = localStorage.getItem(ACCOUNTS_KEY);
  if (existing) return JSON.parse(existing);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
  return defaultAccounts;
};

// Get all accounts
export const getAccounts = (): Account[] => {
  return initAccounts();
};

// Get account by code
export const getAccountByCode = (code: string): Account | null => {
  const accounts = getAccounts();
  return accounts.find(a => a.code === code) || null;
};

// Update account balance - respects account type (asset/liability/equity/revenue/expense)
export const updateAccountBalance = (code: string, amount: number, isDebit: boolean): void => {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.code === code);
  if (index !== -1) {
    const type = accounts[index].type;
    if (type === 'asset' || type === 'expense') {
      // Debit increases, credit decreases
      accounts[index].balance += isDebit ? amount : -amount;
    } else {
      // liability, equity, revenue: credit increases, debit decreases
      accounts[index].balance += isDebit ? -amount : amount;
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
};

// Journal Entries
export const getJournalEntries = (date?: string): JournalEntry[] => {
  const data = localStorage.getItem(JOURNAL_KEY);
  const entries = data ? JSON.parse(data) : [];
  if (date) {
    return entries.filter((e: JournalEntry) => e.date.startsWith(date));
  }
  return entries;
};

// Add journal entry
export const addJournalEntry = (
  entry: Omit<JournalEntry, 'id' | 'createdAt'>
): JournalEntry => {
  const entries = getJournalEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  entries.unshift(newEntry);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries.slice(0, 1000)));

  // Update account balance
  updateAccountBalance(entry.accountCode, entry.debit || entry.credit, entry.debit > 0);

  return newEntry;
};

// Record a sale (debit cash/bank, credit revenue)
export const recordSale = (
  amount: number,
  customerName: string,
  invoiceNumber: string
): void => {
  const user = authApi.getCurrentUser();
  addJournalEntry({
    date: new Date().toISOString().split('T')[0],
    description: `بيع نقدي - ${customerName} - فاتورة ${invoiceNumber}`,
    debit: amount,
    credit: 0,
    accountCode: '1001', // الصندوق
    entryType: 'sale',
    reference: invoiceNumber,
    createdBy: user?.name || 'نظام',
  });
  addJournalEntry({
    date: new Date().toISOString().split('T')[0],
    description: `إيرادات مبيعات - ${customerName} - فاتورة ${invoiceNumber}`,
    debit: 0,
    credit: amount,
    accountCode: '3001', // الإيرادات
    entryType: 'sale',
    reference: invoiceNumber,
    createdBy: user?.name || 'نظام',
  });
};

// Record expense (debit expense, credit cash/bank)
export const recordExpense = (
  amount: number,
  description: string,
  expenseType: string
): void => {
  const user = authApi.getCurrentUser();
  addJournalEntry({
    date: new Date().toISOString().split('T')[0],
    description: `${expenseType} - ${description}`,
    debit: amount,
    credit: 0,
    accountCode: '4002', // مصروفات تشغيلية
    entryType: 'expense',
    createdBy: user?.name || 'نظام',
  });
  addJournalEntry({
    date: new Date().toISOString().split('T')[0],
    description: `سداد مصروف - ${description}`,
    debit: 0,
    credit: amount,
    accountCode: '1001', // الصندوق
    entryType: 'expense',
    createdBy: user?.name || 'نظام',
  });
};

// Daily Closing
export const performDailyClosing = (date: string, notes?: string): DailyClosing => {
  // Prevent duplicate closing for same date
  const existing = getDailyClosing(date);
  if (existing) {
    throw new Error('تم إجراء الإغلاق لهذا التاريخ مسبقاً');
  }

  const user = authApi.getCurrentUser();
  const entries = getJournalEntries(date);

  const accounts = getAccounts();
  const cashAccount = accounts.find(a => a.code === '1001');
  const currentBalance = cashAccount?.balance || 0;

  const totalDebit = entries
    .filter(e => e.debit > 0)
    .reduce((sum, e) => sum + e.debit, 0);

  const totalCredit = entries
    .filter(e => e.credit > 0)
    .reduce((sum, e) => sum + e.credit, 0);

  // Opening balance = current balance minus today's net activity (avoid double-counting)
  const openingBalance = currentBalance - totalDebit + totalCredit;
  const closingBalance = currentBalance;

  const closing: DailyClosing = {
    id: Date.now().toString(),
    date,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance,
    entries: [...entries],
    closedBy: user?.name || 'نظام',
    closedAt: new Date().toISOString(),
    notes,
  };

  const closings = JSON.parse(localStorage.getItem(CLOSING_KEY) || '[]');
  closings.unshift(closing);
  localStorage.setItem(CLOSING_KEY, JSON.stringify(closings.slice(0, 365)));

  return closing;
};

// Get daily closing for a date
export const getDailyClosing = (date: string): DailyClosing | null => {
  const closings = JSON.parse(localStorage.getItem(CLOSING_KEY) || '[]');
  return closings.find((c: DailyClosing) => c.date === date) || null;
};

// Get daily closings list
export const getDailyClosings = (): DailyClosing[] => {
  return JSON.parse(localStorage.getItem(CLOSING_KEY) || '[]');
};

// Generate daily report
export const generateDailyReport = (date: string): {
  date: string;
  opening: number;
  totalDebit: number;
  totalCredit: number;
  closing: number;
  entries: JournalEntry[];
  accountBalances: Account[];
} => {
  const closing = getDailyClosing(date);
  const accounts = getAccounts();

  return {
    date,
    opening: closing?.openingBalance || 0,
    totalDebit: closing?.totalDebit || 0,
    totalCredit: closing?.totalCredit || 0,
    closing: closing?.closingBalance || accounts.find(a => a.code === '1001')?.balance || 0,
    entries: getJournalEntries(date),
    accountBalances: accounts,
  };
};

// Tax Records
export const getTaxRecords = (): TaxRecord[] => {
  const data = localStorage.getItem(TAX_KEY);
  return data ? JSON.parse(data) : [];
};

export const addTaxRecord = (
  record: Omit<TaxRecord, 'id'>
): TaxRecord => {
  const records = getTaxRecords();
  const newRecord: TaxRecord = {
    ...record,
    id: Date.now().toString(),
  };
  records.unshift(newRecord);
  localStorage.setItem(TAX_KEY, JSON.stringify(records));
  return newRecord;
};

export const updateTaxStatus = (
  id: string,
  status: TaxRecord['status'],
  paidDate?: string
): boolean => {
  const records = getTaxRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;

  records[index].status = status;
  if (paidDate) records[index].paidDate = paidDate;
  localStorage.setItem(TAX_KEY, JSON.stringify(records));
  return true;
};

// Print daily report
export const printDailyReport = (date: string): void => {
  const report = generateDailyReport(date);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 20px; }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .summary-box label { display: block; color: #666; font-size: 12px; margin-bottom: 5px; }
        .summary-box span { font-size: 20px; font-weight: bold; color: #333; }
        .entries-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .entries-table th { background: #333; color: white; padding: 12px; text-align: right; }
        .entries-table td { border-bottom: 1px solid #ddd; padding: 10px; }
        .accounts-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .accounts-table th { background: #555; color: white; padding: 10px; text-align: right; }
        .accounts-table td { border-bottom: 1px solid #ddd; padding: 8px; }
        .footer { text-align: center; padding-top: 20px; border-top: 2px solid #333; margin-top: 20px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير يومي - الخزينة</h1>
        <p>مجوهرات الحمروني</p>
        <p style="margin-top: 10px;">التاريخ: ${new Date(date).toLocaleDateString('ar-LY')}</p>
      </div>

      <div class="summary">
        <div class="summary-box">
          <label>الرصيد الافتتاحي</label>
          <span>${report.opening.toLocaleString()} د.ل</span>
        </div>
        <div class="summary-box">
          <label>إجمالي المدين</label>
          <span>${report.totalDebit.toLocaleString()} د.ل</span>
        </div>
        <div class="summary-box">
          <label>إجمالي الدائن</label>
          <span>${report.totalCredit.toLocaleString()} د.ل</span>
        </div>
        <div class="summary-box">
          <label>الرصيد الختامي</label>
          <span style="color: #2e7d32;">${report.closing.toLocaleString()} د.ل</span>
        </div>
      </div>

      <h3 style="margin-bottom: 10px;">الحركات المالية</h3>
      <table class="entries-table">
        <thead>
          <tr>
            <th>الوصف</th>
            <th>نوع القيد</th>
            <th>مدين</th>
            <th>دائن</th>
          </tr>
        </thead>
        <tbody>
          ${report.entries.map(e => `
            <tr>
              <td>${e.description}</td>
              <td>${e.entryType}</td>
              <td>${e.debit > 0 ? e.debit.toLocaleString() : '-'}</td>
              <td>${e.credit > 0 ? e.credit.toLocaleString() : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 style="margin-bottom: 10px;">أرصدة الحسابات</h3>
      <table class="accounts-table">
        <thead>
          <tr>
            <th>رقم الحساب</th>
            <th>اسم الحساب</th>
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          ${report.accountBalances.filter(a => a.balance !== 0).map(a => `
            <tr>
              <td>${a.code}</td>
              <td>${a.name}</td>
              <td>${a.balance.toLocaleString()} د.ل</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>تم إصدار التقرير بواسطة: ${report.entries[0]?.createdBy || 'نظام'}</p>
        <p style="margin-top: 10px;">توقيع المسؤول: _______________</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};

// Get treasury balance
export const getTreasuryBalance = (): number => {
  const accounts = getAccounts();
  const cashAccount = accounts.find(a => a.code === '1001');
  return cashAccount?.balance || 0;
};