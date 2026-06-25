// Draft Invoice System - Provisional Invoice before Final Invoice
import { CartItem, SaleInvoice } from './supabase';
import { generateInvoiceNumber } from './supabase';

const DRAFT_INVOICES_KEY = 'draft_invoices';

export interface DraftInvoice {
  id: string;
  draftNumber: string;
  finalInvoiceNumber?: string; // Link to final invoice when issued
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  sellerName: string;
  sellerCode: string;
  notes?: string;
  status: 'draft' | 'converted' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Auto-expire after X days
}

// Generate draft invoice number
const generateDraftNumber = (): string => {
  const now = new Date();
  const prefix = `DR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

// Get all draft invoices
export const getDraftInvoices = (): DraftInvoice[] => {
  const data = localStorage.getItem(DRAFT_INVOICES_KEY);
  return data ? JSON.parse(data) : [];
};

// Get draft by ID
export const getDraftById = (id: string): DraftInvoice | null => {
  const drafts = getDraftInvoices();
  return drafts.find(d => d.id === id) || null;
};

// Get draft by number
export const getDraftByNumber = (draftNumber: string): DraftInvoice | null => {
  const drafts = getDraftInvoices();
  return drafts.find(d => d.draftNumber === draftNumber) || null;
};

// Create new draft invoice
export const createDraftInvoice = (
  customerName: string,
  items: CartItem[],
  totalAmount: number,
  sellerName: string,
  sellerCode: string,
  notes?: string
): DraftInvoice => {
  const drafts = getDraftInvoices();

  const newDraft: DraftInvoice = {
    id: Date.now().toString(),
    draftNumber: generateDraftNumber(),
    customerName,
    items: [...items],
    totalAmount,
    sellerName,
    sellerCode,
    notes,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
  };

  drafts.unshift(newDraft);
  localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(drafts.slice(0, 100)));

  return newDraft;
};

// Update draft invoice (only seller/admin can edit)
export const updateDraftInvoice = (
  id: string,
  updates: Partial<Omit<DraftInvoice, 'id' | 'draftNumber' | 'createdAt'>>
): DraftInvoice | null => {
  const drafts = getDraftInvoices();
  const index = drafts.findIndex(d => d.id === id);

  if (index === -1) return null;

  // Cannot update converted or cancelled drafts
  if (drafts[index].status !== 'draft') return null;

  drafts[index] = {
    ...drafts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(drafts));
  return drafts[index];
};

// Delete draft invoice (only admin can delete)
export const deleteDraftInvoice = (id: string): boolean => {
  const drafts = getDraftInvoices();
  const filtered = drafts.filter(d => d.id !== id);

  if (filtered.length === drafts.length) return false;

  localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(filtered));
  return true;
};

// Convert draft to final invoice
export const convertDraftToFinal = (draftId: string): { success: boolean; draft?: DraftInvoice; finalInvoice?: SaleInvoice } => {
  const drafts = getDraftInvoices();
  const index = drafts.findIndex(d => d.id === draftId);

  if (index === -1) {
    return { success: false };
  }

  const draft = drafts[index];

  // Cannot convert already converted or cancelled
  if (draft.status !== 'draft') {
    return { success: false };
  }

  // Generate final invoice number
  const finalInvoiceNumber = generateInvoiceNumber();

  // Update draft status
  draft.status = 'converted';
  draft.finalInvoiceNumber = finalInvoiceNumber;
  draft.updatedAt = new Date().toISOString();

  drafts[index] = draft;
  localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(drafts));

  // Create final invoice object
  const finalInvoice: SaleInvoice = {
    id: Date.now(),
    invoice_number: finalInvoiceNumber,
    customer_name: draft.customerName,
    items: draft.items,
    total_amount: draft.totalAmount,
    seller_name: draft.sellerName,
    seller_code: draft.sellerCode,
    created_at: new Date().toISOString(),
  };

  // Add draft link to invoice metadata
  (finalInvoice as any).draftNumber = draft.draftNumber;

  return {
    success: true,
    draft,
    finalInvoice,
  };
};

// Cancel draft invoice (only seller/admin can cancel)
export const cancelDraftInvoice = (id: string, reason?: string): boolean => {
  const drafts = getDraftInvoices();
  const index = drafts.findIndex(d => d.id === id);

  if (index === -1) return false;

  // Cannot cancel already converted
  if (drafts[index].status === 'converted') return false;

  drafts[index].status = 'cancelled';
  drafts[index].notes = reason || 'ملغاة';
  drafts[index].updatedAt = new Date().toISOString();

  localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(drafts));
  return true;
};

// Get drafts by customer
export const getDraftsByCustomer = (customerName: string): DraftInvoice[] => {
  const drafts = getDraftInvoices();
  return drafts.filter(d =>
    d.customerName.includes(customerName) &&
    d.status === 'draft'
  );
};

// Get active drafts (not expired, not converted/cancelled)
export const getActiveDrafts = (): DraftInvoice[] => {
  const drafts = getDraftInvoices();
  const now = new Date();

  return drafts.filter(d => {
    if (d.status !== 'draft') return false;
    if (d.expiresAt && new Date(d.expiresAt) < now) return false;
    return true;
  });
};

// Clean expired drafts (run periodically)
export const cleanExpiredDrafts = (): number => {
  const drafts = getDraftInvoices();
  const now = new Date();
  const initialLength = drafts.length;

  const valid = drafts.filter(d => {
    if (d.status !== 'draft') return true;
    if (d.expiresAt && new Date(d.expiresAt) < now) return false;
    return true;
  });

  if (valid.length < initialLength) {
    localStorage.setItem(DRAFT_INVOICES_KEY, JSON.stringify(valid));
  }

  return initialLength - valid.length;
};

// Search drafts
export const searchDrafts = (query: string): DraftInvoice[] => {
  const drafts = getDraftInvoices();
  const lowerQuery = query.toLowerCase();

  return drafts.filter(d =>
    d.draftNumber.toLowerCase().includes(lowerQuery) ||
    d.customerName.toLowerCase().includes(lowerQuery) ||
    (d.notes && d.notes.toLowerCase().includes(lowerQuery))
  );
};

// Get draft statistics
export const getDraftStats = (): {
  total: number;
  active: number;
  converted: number;
  cancelled: number;
  totalValue: number;
} => {
  const drafts = getDraftInvoices();

  return {
    total: drafts.length,
    active: drafts.filter(d => d.status === 'draft').length,
    converted: drafts.filter(d => d.status === 'converted').length,
    cancelled: drafts.filter(d => d.status === 'cancelled').length,
    totalValue: drafts.reduce((sum, d) => sum + d.totalAmount, 0),
  };
};
