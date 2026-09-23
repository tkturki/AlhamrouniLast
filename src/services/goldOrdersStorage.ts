// Gold Orders Storage - receipts and invoices linked together

export interface StoredReceiptItem {
  serial: number;
  item_type: 'metal' | 'monetary';
  metal_type: string;
  description: string;
  count: number;
  weight: number;
  stone_weight?: number;
  gem_weight?: number;
  notes?: string;
  price_per_gram: number;
  metal_value: number;
  currency?: string;
  exchange_rate?: number;
  monetary_value?: number;
  total_lyd?: number;
  purchase_mode?: 'gold_by_gram';
}

export interface StoredReceipt {
  id: string;
  receipt_number: string;
  customer_name: string;
  customer_title?: string;
  customer_phone: string;
  delivery_date: string;
  items: StoredReceiptItem[];
  total_weight: number;
  total_count: number;
  total_value: number;
  arabon?: number;
  created_at: string;
}

export interface StoredInvoiceItem {
  serial: number;
  description: string;
  metal_type: string;
  karat?: string;
  weight: number;
  pieces_count: number;
  workmanship: number;
  weight_with_stones: number;
  weight_with_gems: number;
  stone_weight?: number;
  gem_weight?: number;
  stone_price: number;
  gem_price: number;
  stone_count: number;
  gem_count: number;
  gold_price: number;
  value_stones: number;
  value_gems: number;
  total: number;
  notes: string;
  total_weight?: number;
}

export interface StoredInvoice {
  id: string;
  invoice_number: string;
  receipt_number: string;
  customer_name: string;
  customer_title?: string;
  seller_name: string;
  delivery_date: string;
  items: StoredInvoiceItem[];
  total_weight: number;
  total_pieces: number;
  total_workmanship: number;
  total_stones_value: number;
  total_gems_value: number;
  total_metal_value: number;
  total_amount: number;
  received_weight: number;
  remaining_weight: number;
  other_add_desc?: string;
  other_add_value?: number;
  sum_columns?: string[];
  manual_gems?: number;
  manual_stones?: number;
  related_sale_invoice_number?: string;
  related_receipt_number?: string;
  linked_sale_invoice_number?: string;
  invoice_link_key?: string;
  created_at: string;
}

export interface StoredOrderRegularInvoice {
  id: string;
  invoice_number: string;
  source_invoice_id: string;
  source_order_number: string;
  receipt_number?: string;
  customer_name: string;
  seller_name?: string;
  delivery_date?: string;
  items: StoredInvoiceItem[];
  total_amount: number;
  visible_columns: string[];
  column_labels: Record<string, string>;
  sum_columns: string[];
  visible_breakdown: Record<string, boolean>;
  invoice_title?: string;
  header_mode?: 'custom' | 'sales';
  header_customer_label?: string;
  header_invoice_label?: string;
  header_date_label?: string;
  notes?: string;
  invoice_link_key: string;
  created_at: string;
}

const RECEIPTS_KEY = 'gold_receipts';
const INVOICES_KEY = 'gold_invoices';
const ARCHIVE_KEY = 'archived_invoices';
const ORDER_REGULAR_INVOICES_KEY = 'order_regular_invoices';
const GOLD_ORDERS_API = '/api/gold-orders';

const syncGoldOrdersToServer = (): void => {
  void fetch(GOLD_ORDERS_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipts: getReceipts(),
      invoices: getInvoices(),
      regular_invoices: getOrderRegularInvoices(),
      archived: JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'),
    }),
  }).catch(() => {
    // Keep local storage available when the server is temporarily offline.
  });
};

export const restoreGoldOrdersFromServer = async (): Promise<void> => {
  try {
    const response = await fetch(GOLD_ORDERS_API);
    if (!response.ok) return;
    const result = await response.json();
    const data = result.data || {};
    const localReceipts = getReceipts();
    const localInvoices = getInvoices();
    const localRegularInvoices = getOrderRegularInvoices();
    const serverReceipts = Array.isArray(data.receipts) ? data.receipts : [];
    const serverInvoices = Array.isArray(data.invoices) ? data.invoices : [];
    const serverRegularInvoices = Array.isArray(data.regular_invoices) ? data.regular_invoices : [];
    const mergedReceipts = [...serverReceipts];
    const mergedInvoices = [...serverInvoices];

    localReceipts.forEach(receipt => {
      if (!mergedReceipts.some(item => item.id === receipt.id || item.receipt_number === receipt.receipt_number)) {
        mergedReceipts.push(receipt);
      }
    });
    localInvoices.forEach(invoice => {
      if (!mergedInvoices.some(item => item.id === invoice.id || item.invoice_number === invoice.invoice_number)) {
        mergedInvoices.push(invoice);
      }
    });
    const mergedRegularInvoices = [...serverRegularInvoices];
    localRegularInvoices.forEach(invoice => {
      if (!mergedRegularInvoices.some(item => item.id === invoice.id || item.invoice_number === invoice.invoice_number)) {
        mergedRegularInvoices.push(invoice);
      }
    });

    if (mergedReceipts.length > 0) {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(mergedReceipts));
    }
    if (mergedInvoices.length > 0) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(mergedInvoices));
    }
    if (mergedRegularInvoices.length > 0) {
      localStorage.setItem(ORDER_REGULAR_INVOICES_KEY, JSON.stringify(mergedRegularInvoices));
    }
    if (!localStorage.getItem(ARCHIVE_KEY) && Array.isArray(data.archived)) {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(data.archived));
    }
    if (localReceipts.length > serverReceipts.length || localInvoices.length > serverInvoices.length || localRegularInvoices.length > serverRegularInvoices.length) {
      syncGoldOrdersToServer();
    }
  } catch {
    // Local storage remains the fallback when the server is unavailable.
  }
};

export const getUnifiedInvoices = (): any[] => {
  const regularInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
  const goldInvoices = getInvoices();
  const orderRegularInvoices = getOrderRegularInvoices();

  const all = [...regularInvoices, ...goldInvoices, ...orderRegularInvoices];
  const byKey = new Map<string, any>();

  all.forEach((invoice: any) => {
    const key = String(invoice.invoice_number || invoice.id || '');
    if (!key) return;
    if (!byKey.has(key)) {
      byKey.set(key, {
        ...invoice,
        invoice_type: invoice.source_order_number ? 'order-regular' : invoice.receipt_number || invoice.total_workmanship ? 'gold' : 'sale',
        source: invoice.source_order_number ? 'order-regular' : invoice.receipt_number || invoice.total_workmanship ? 'gold' : 'sale',
      });
    }
  });

  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
};

export const restoreUnifiedInvoicesFromServer = async (): Promise<any[]> => {
  const localUnified = getUnifiedInvoices();

  try {
    const [saleResponse, goldOrdersResponse] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/gold-orders')
    ]);

    const saleData = saleResponse.ok ? await saleResponse.json() : { success: false, data: [] };
    const goldData = goldOrdersResponse.ok ? await goldOrdersResponse.json() : { success: false, data: {} };

    const serverSaleInvoices = Array.isArray(saleData.data) ? saleData.data : [];
    const serverGoldInvoices = Array.isArray(goldData?.data?.invoices) ? goldData.data.invoices : [];
    const serverOrderRegularInvoices = Array.isArray(goldData?.data?.regular_invoices) ? goldData.data.regular_invoices : [];
    const merged = [...serverSaleInvoices, ...serverGoldInvoices, ...serverOrderRegularInvoices, ...localUnified];
    const deduped = new Map<string, any>();

    merged.forEach((invoice: any) => {
      const key = String(invoice.invoice_number || invoice.id || '');
      if (!key) return;
      if (!deduped.has(key)) {
        deduped.set(key, {
          ...invoice,
          invoice_type: invoice.source_order_number ? 'order-regular' : invoice.receipt_number || invoice.total_workmanship ? 'gold' : 'sale',
          source: invoice.source_order_number ? 'order-regular' : invoice.receipt_number || invoice.total_workmanship ? 'gold' : 'sale',
        });
      }
    });

    const result = Array.from(deduped.values()).sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });

    if (serverSaleInvoices.length > 0) {
      localStorage.setItem('saved_invoices', JSON.stringify(serverSaleInvoices));
    }
    if (serverGoldInvoices.length > 0) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(serverGoldInvoices));
    }
    if (serverOrderRegularInvoices.length > 0) {
      localStorage.setItem(ORDER_REGULAR_INVOICES_KEY, JSON.stringify(serverOrderRegularInvoices));
    }

    return result;
  } catch {
    return localUnified;
  }
};

// Export all data as JSON file
export const exportAllData = (): void => {
  const data = {
    receipts: getReceipts(),
    invoices: getInvoices(),
    archived: JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'),
    exported_at: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import data from JSON file
export const importAllData = (jsonText: string): { receipts: number; invoices: number } => {
  try {
    const data = JSON.parse(jsonText);
    if (data.receipts) localStorage.setItem(RECEIPTS_KEY, JSON.stringify(data.receipts));
    if (data.invoices) localStorage.setItem(INVOICES_KEY, JSON.stringify(data.invoices));
    if (data.archived) localStorage.setItem(ARCHIVE_KEY, JSON.stringify(data.archived));
    return { receipts: (data.receipts || []).length, invoices: (data.invoices || []).length };
  } catch { return { receipts: 0, invoices: 0 }; }
};

const getNextNumber = (prefix: string, items: { receipt_number?: string; invoice_number?: string; created_at: string }[], key: 'receipt_number' | 'invoice_number'): string => {
  const year = new Date().getFullYear();
  const yearItems = items.filter(item => {
    const num = item[key] || '';
    return num.startsWith(`${prefix}-${year}-`);
  });
  let maxNum = 0;
  yearItems.forEach(item => {
    const num = item[key] || '';
    const match = num.match(/-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `${prefix}-${year}-${(maxNum + 1).toString().padStart(4, '0')}`;
};

export const createInvoiceLinkKey = (invoice: { invoice_number?: string; receipt_number?: string; customer_name?: string; created_at?: string }): string => {
  const keySource = [
    invoice.invoice_number || invoice.receipt_number || 'unknown',
    invoice.customer_name || 'unknown-customer',
    invoice.created_at ? new Date(invoice.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  ].join('|');
  return `inv-link:${btoa(unescape(encodeURIComponent(keySource))).replace(/=+$/, '')}`;
};

export const findRelatedRegularInvoice = (customerName: string, receiptNumber?: string): any | null => {
  const invoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
  if (!customerName && !receiptNumber) return null;

  return invoices.find((inv: any) => {
    if (receiptNumber && inv.related_receipt_number === receiptNumber) return true;
    if (receiptNumber && inv.invoice_link_key && inv.invoice_link_key === `sale-link:${customerName}|${new Date().toISOString().slice(0, 10)}|${receiptNumber}`) return true;
    if (inv.customer_name === customerName) return true;
    return false;
  }) || null;
};

export const findLinkedInvoiceRecord = (invoice: any): any | null => {
  if (!invoice) return null;

  const key = invoice.invoice_link_key;
  const linkedNumber = invoice.related_order_number || invoice.related_sale_invoice_number || invoice.linked_gold_invoice_number || invoice.linked_sale_invoice_number;

  if (!key && !linkedNumber) return null;

  const candidates = [
    ...JSON.parse(localStorage.getItem('saved_invoices') || '[]'),
    ...getInvoices(),
  ];

  return candidates.find((candidate: any) => {
    if (key && candidate.invoice_link_key && candidate.invoice_link_key === key) return true;
    if (linkedNumber && (candidate.invoice_number === linkedNumber || candidate.related_order_number === linkedNumber || candidate.related_sale_invoice_number === linkedNumber)) return true;
    if (candidate.customer_name === invoice.customer_name && candidate.invoice_number !== invoice.invoice_number) return true;
    return false;
  }) || null;
};

// Receipt operations
export const getReceipts = (): StoredReceipt[] => {
  try {
    return JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]');
  } catch { return []; }
};

export const saveReceipt = (receipt: Omit<StoredReceipt, 'id'>): StoredReceipt => {
  const receipts = getReceipts();
  const newReceipt: StoredReceipt = {
    ...receipt,
    id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  receipts.push(newReceipt);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  syncGoldOrdersToServer();
  return newReceipt;
};

export const getNextReceiptNumber = (): string => {
  return getNextNumber('REC', getReceipts(), 'receipt_number');
};

export const getReceiptByNumber = (number: string): StoredReceipt | undefined => {
  return getReceipts().find(r => r.receipt_number === number);
};

export const searchReceipts = (query: string): StoredReceipt[] => {
  const q = query.toLowerCase();
  return getReceipts().filter(r =>
    r.receipt_number.toLowerCase().includes(q) ||
    r.customer_name.toLowerCase().includes(q) ||
    r.customer_phone?.includes(q)
  );
};

export const updateReceipt = (id: string, updates: Partial<StoredReceipt>): StoredReceipt | null => {
  const receipts = getReceipts();
  const index = receipts.findIndex(r => r.id === id);
  if (index === -1) return null;
  receipts[index] = { ...receipts[index], ...updates };
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  syncGoldOrdersToServer();
  return receipts[index];
};

export const deleteReceipt = (id: string): void => {
  const receipts = getReceipts().filter(r => r.id !== id);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  syncGoldOrdersToServer();
};

// Invoice operations
export const getInvoices = (): StoredInvoice[] => {
  try {
    return JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  } catch { return []; }
};

export const saveInvoice = (invoice: Omit<StoredInvoice, 'id'>): StoredInvoice => {
  const invoices = getInvoices();
  const newInvoice: StoredInvoice = {
    ...invoice,
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  invoices.push(newInvoice);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  syncGoldOrdersToServer();
  return newInvoice;
};

export const updateInvoice = (id: string, updates: Partial<StoredInvoice>): StoredInvoice | null => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return null;
  invoices[index] = { ...invoices[index], ...updates };
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  syncGoldOrdersToServer();
  return invoices[index];
};

export const getNextInvoiceNumber = (): string => {
  return getNextNumber('INV', getInvoices(), 'invoice_number');
};

export const getInvoicesByReceipt = (receiptNumber: string): StoredInvoice[] => {
  return getInvoices().filter(i => i.receipt_number === receiptNumber);
};

export const deleteInvoice = (id: string): void => {
  const invoices = getInvoices().filter(i => i.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  syncGoldOrdersToServer();
};

// Batch delete multiple invoices at once (much faster)
export const batchDeleteInvoices = (ids: string[]): number => {
  const invoices = getInvoices();
  const filtered = invoices.filter(i => !ids.includes(i.id));
  const deleted = invoices.length - filtered.length;
  localStorage.setItem(INVOICES_KEY, JSON.stringify(filtered));
  syncGoldOrdersToServer();
  return deleted;
};

export const getOrderRegularInvoices = (): StoredOrderRegularInvoice[] => {
  try {
    return JSON.parse(localStorage.getItem(ORDER_REGULAR_INVOICES_KEY) || '[]');
  } catch { return []; }
};

export const saveOrderRegularInvoice = (invoice: Omit<StoredOrderRegularInvoice, 'id'>): StoredOrderRegularInvoice => {
  const invoices = getOrderRegularInvoices();
  const newInvoice: StoredOrderRegularInvoice = {
    ...invoice,
    id: `order_regular_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  invoices.push(newInvoice);
  localStorage.setItem(ORDER_REGULAR_INVOICES_KEY, JSON.stringify(invoices));
  syncGoldOrdersToServer();
  return newInvoice;
};

// Batch archive multiple invoices
export const batchArchiveInvoices = (ids: string[]): number => {
  const invoices = getInvoices();
  const archived = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
  let count = 0;

  const remaining = invoices.filter(inv => {
    if (ids.includes(inv.id)) {
      archived.push({ ...inv, archived_at: new Date().toISOString() });
      count++;
      return false;
    }
    return true;
  });

  localStorage.setItem(INVOICES_KEY, JSON.stringify(remaining));
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived));
  syncGoldOrdersToServer();
  return count;
};

// Reset all serial numbers (admin only)
export const resetAllSerialNumbers = (): { receipts: number; invoices: number } => {
  const receipts = getReceipts();
  const invoices = getInvoices();

  // Renumber receipts
  const renumberedReceipts = receipts.map((r, i) => ({
    ...r,
    receipt_number: `REC-${new Date(r.created_at).getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
  }));

  // Renumber invoices
  const renumberedInvoices = invoices.map((inv, i) => ({
    ...inv,
    invoice_number: `INV-${new Date(inv.created_at).getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
  }));

  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(renumberedReceipts));
  localStorage.setItem(INVOICES_KEY, JSON.stringify(renumberedInvoices));

  return { receipts: renumberedReceipts.length, invoices: renumberedInvoices.length };
};

// Get counts for admin display
export const getStorageCounts = (): { receipts: number; invoices: number; orders: number } => {
  return {
    receipts: getReceipts().length,
    invoices: getInvoices().length,
    orders: 0,
  };
};
