import { JewelryItem, CartItem, SaleInvoice } from '../types';

const API_BASE = 'http://localhost:5000/api';

export const jewelryApi = {
  // جلب كل القطع
  getAllItems: async (): Promise<JewelryItem[]> => {
    const res = await fetch(`${API_BASE}/items`);
    return res.json();
  },

  // إضافة قطعة جديدة
  addItem: async (item: Partial<JewelryItem>): Promise<JewelryItem> => {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  // جلب قطعة بالكود
  getItemByCode: async (code: string): Promise<JewelryItem | null> => {
    const res = await fetch(`${API_BASE}/items/${code}`);
    if (!res.ok) return null;
    return res.json();
  },

  // تحديث المخزون بعد البيع
  updateStock: async (code: string, quantity: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/items/${code}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return res.ok;
  },

  // تأكيد البيع وحفظ الفاتورة
  confirmSale: async (invoice: SaleInvoice): Promise<SaleInvoice> => {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    return res.json();
  },

  // جلب الفواتير
  getInvoices: async (): Promise<SaleInvoice[]> => {
    const res = await fetch(`${API_BASE}/sales`);
    return res.json();
  },

  // البحث
  searchItems: async (query: string): Promise<JewelryItem[]> => {
    const res = await fetch(`${API_BASE}/items/search?q=${query}`);
    return res.json();
  },
};

// إدارة السلة في LocalStorage
export const cartStorage = {
  getCart: (): CartItem[] => {
    const data = localStorage.getItem('alhumroni_cart');
    return data ? JSON.parse(data) : [];
  },

  saveCart: (items: CartItem[]) => {
    localStorage.setItem('alhumroni_cart', JSON.stringify(items));
  },

  clearCart: () => {
    localStorage.removeItem('alhumroni_cart');
  },

  addToCart: (item: JewelryItem) => {
    const cart = cartStorage.getCart();
    const existing = cart.find(c => c.item_code === item.item_code);

    if (existing) {
      if (existing.stock_qty > existing.quantity) {
        existing.quantity += 1;
        existing.total = existing.quantity * existing.price;
      }
    } else {
      cart.push({
        ...item,
        quantity: 1,
        total: item.price,
      });
    }

    cartStorage.saveCart(cart);
    return cart;
  },

  removeFromCart: (code: string) => {
    const cart = cartStorage.getCart().filter(c => c.item_code !== code);
    cartStorage.saveCart(cart);
    return cart;
  },

  updateQuantity: (code: string, quantity: number) => {
    const cart = cartStorage.getCart();
    const item = cart.find(c => c.item_code === code);
    if (item) {
      if (quantity <= 0) {
        return cartStorage.removeFromCart(code);
      }
      item.quantity = Math.min(quantity, item.stock_qty);
      item.total = item.quantity * item.price;
    }
    cartStorage.saveCart(cart);
    return cart;
  },

  getTotal: (): number => {
    return cartStorage.getCart().reduce((sum, item) => sum + item.total, 0);
  },
};

// توليد رقم فاتورة فريد
export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};