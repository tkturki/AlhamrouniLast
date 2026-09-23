import { addJournalEntry } from './treasury';

export interface ReturnItem {
  item_code: string;
  model_name: string;
  weight: number;
  price: number;
  quantity: number;
  reason: string;
}

export interface Return {
  id: string;
  invoice_number: string;
  customer_name: string;
  items: ReturnItem[];
  total_amount: number;
  return_date: string;
  type: 'full' | 'partial';
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  processed_by: string;
}

const STORAGE_KEY = 'product_returns';

export const getReturns = (): Return[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addReturn = (returnData: Omit<Return, 'id'>): Return => {
  const returns = getReturns();
  const newReturn: Return = {
    ...returnData,
    id: Date.now().toString(),
  };
  returns.unshift(newReturn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(returns));
  return newReturn;
};

export const updateReturnStatus = (id: string, status: Return['status']): boolean => {
  const returns = getReturns();
  const index = returns.findIndex(r => r.id === id);
  if (index === -1) return false;
  returns[index].status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(returns));
  return true;
};

export const processReturn = (
  invoiceNumber: string,
  items: ReturnItem[],
  reason: string,
  returnType: 'full' | 'partial'
): Return => {
  const invoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
  const invoice = invoices.find((inv: any) => inv.invoice_number === invoiceNumber);

  const customerName = invoice?.customer_name || 'عميل غير محدد';

  const totalAmount = returnType === 'full'
    ? (invoice?.total_amount || 0)
    : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const returnItems: ReturnItem[] = returnType === 'full' && invoice
    ? invoice.items.map((item: any) => ({
        item_code: item.item_code,
        model_name: item.model_name,
        weight: item.weight || 0,
        price: item.price,
        quantity: item.quantity || 1,
        reason,
      }))
    : items;

  const newReturn = addReturn({
    invoice_number: invoiceNumber,
    customer_name: customerName,
    items: returnItems,
    total_amount: totalAmount,
    return_date: new Date().toISOString(),
    type: returnType,
    status: 'approved',
    notes: reason,
    processed_by: JSON.parse(localStorage.getItem('current_user') || '{}').name || 'نظام',
  });

  const localData = localStorage.getItem('jewelry_items');
  if (localData) {
    const localItems = JSON.parse(localData);
    for (const returnItem of returnItems) {
      const itemIndex = localItems.findIndex((i: any) => i.item_code === returnItem.item_code);
      if (itemIndex !== -1) {
        localItems[itemIndex].stock_qty = (localItems[itemIndex].stock_qty || 0) + returnItem.quantity;
      } else {
        localItems.push({
          item_code: returnItem.item_code,
          model_name: returnItem.model_name,
          weight: returnItem.weight,
          price: returnItem.price,
          stock_qty: returnItem.quantity,
          karat: '21',
          origin: 'L',
          category: 'أخرى',
          status: 'مستعمل',
          item_type: 'G',
        });
      }
    }
    localStorage.setItem('jewelry_items', JSON.stringify(localItems));
  }

  try {
    addJournalEntry({
      date: new Date().toISOString().split('T')[0],
      description: `مرتجع - فاتورة ${invoiceNumber} - ${customerName}`,
      debit: 0,
      credit: totalAmount,
      accountCode: '3001',
      entryType: 'return',
      reference: invoiceNumber,
      createdBy: JSON.parse(localStorage.getItem('current_user') || '{}').name || 'نظام',
    });
    addJournalEntry({
      date: new Date().toISOString().split('T')[0],
      description: `مرتجع نقدي - فاتورة ${invoiceNumber} - ${customerName}`,
      debit: totalAmount,
      credit: 0,
      accountCode: '1001',
      entryType: 'return',
      reference: invoiceNumber,
      createdBy: JSON.parse(localStorage.getItem('current_user') || '{}').name || 'نظام',
    });
  } catch (e) {
    console.log('Treasury journal entry failed for return');
  }

  return newReturn;
};
