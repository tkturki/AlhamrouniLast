// Supplier Management System
export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  description: string; // الصفة
  address: string;
  totalValue: number; // إجمالي القيمة
  totalWeight: number; // إجمالي الوزن
  status: 'paid' | 'unpaid' | 'partial' | 'returned'; // حالة السداد
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const SUPPLIERS_KEY = 'suppliers';

// Generate supplier code
const generateSupplierCode = (): string => {
  const now = new Date();
  const prefix = `SUP-${now.getFullYear()}`;
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${random}`;
};

// Get all suppliers
export const getSuppliers = (): Supplier[] => {
  const data = localStorage.getItem(SUPPLIERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Get supplier by ID
export const getSupplierById = (id: string): Supplier | null => {
  const suppliers = getSuppliers();
  return suppliers.find(s => s.id === id) || null;
};

// Add new supplier
export const addSupplier = (supplier: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Supplier => {
  const suppliers = getSuppliers();
  const newSupplier: Supplier = {
    ...supplier,
    id: Date.now().toString(),
    code: generateSupplierCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  suppliers.unshift(newSupplier);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  return newSupplier;
};

// Update supplier
export const updateSupplier = (id: string, updates: Partial<Supplier>): Supplier | null => {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex(s => s.id === id);
  if (index === -1) return null;

  suppliers[index] = {
    ...suppliers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  return suppliers[index];
};

// Delete supplier
export const deleteSupplier = (id: string): boolean => {
  const suppliers = getSuppliers();
  const filtered = suppliers.filter(s => s.id !== id);
  if (filtered.length === suppliers.length) return false;
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(filtered));
  return true;
};

// Search suppliers
export const searchSuppliers = (query: string): Supplier[] => {
  const suppliers = getSuppliers();
  const lowerQuery = query.toLowerCase();
  return suppliers.filter(s =>
    s.code.toLowerCase().includes(lowerQuery) ||
    s.name.toLowerCase().includes(lowerQuery) ||
    s.phone.includes(query)
  );
};

// Get supplier statistics
export const getSupplierStats = (): {
  total: number;
  totalValue: number;
  paid: number;
  unpaid: number;
  partial: number;
  returned: number;
} => {
  const suppliers = getSuppliers();
  return {
    total: suppliers.length,
    totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0),
    paid: suppliers.filter(s => s.status === 'paid').length,
    unpaid: suppliers.filter(s => s.status === 'unpaid').length,
    partial: suppliers.filter(s => s.status === 'partial').length,
    returned: suppliers.filter(s => s.status === 'returned').length,
  };
};