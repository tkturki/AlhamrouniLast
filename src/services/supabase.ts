import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lreczhonyvgygsddzkmo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tcms3RU402ApPwUoRbEZ7A_l2xlg_eQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface JewelryItem {
  id?: number;
  item_code: string;
  item_type: string;
  karat: string;
  origin: string;
  category: string;
  status: string;
  model_name: string;
  weight: number;
  price: number;
  stock_qty: number;
  image_url?: string;
  created_at?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  seller_code: string;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    // محاكاة تسجيل الدخول - في الإنتاج يستخدم Supabase Auth
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('البريد أو كلمة المرور غير صحيحة');
    }

    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },

  logout: () => {
    localStorage.removeItem('current_user');
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('current_user');
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated: (): boolean => {
    return authApi.getCurrentUser() !== null;
  },
};

// إدارة المستخدمين
const getUsers = (): (User & { password: string })[] => {
  const data = localStorage.getItem('users');
  if (data) return JSON.parse(data);

  // إنشاء مستخدم افتراضي
  const defaultUsers = [
    { id: '1', email: 'admin@alhumroni.com', password: 'admin123', name: 'مدير النظام', role: 'admin' as const, seller_code: 'ADMIN' },
    { id: '2', email: 'seller@alhumroni.com', password: 'seller123', name: 'خالد تركي', role: 'seller' as const, seller_code: '001' },
  ];
  localStorage.setItem('users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

export interface CartItem extends JewelryItem {
  quantity: number;
  total: number;
}

export interface SaleInvoice {
  id?: number;
  invoice_number: string;
  customer_name: string;
  items: CartItem[];
  total_amount: number;
  seller_name: string;
  seller_code: string;
  created_at: string;
}

// API Functions
export const jewelryApi = {
  // جلب كل القطع
  getAllItems: async (): Promise<JewelryItem[]> => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // إضافة قطعة جديدة
  addItem: async (item: Partial<JewelryItem>): Promise<JewelryItem> => {
    // توليد الكود
    const prefix = `${item.karat || '21'}${item.item_type || 'G'}${item.origin || 'L'}${item.category || 'R'}`;

    // البحث عن آخر كود
    const { data: lastItems } = await supabase
      .from('jewelry_items')
      .select('item_code')
      .ilike('item_code', `${prefix}-%`)
      .order('id', { ascending: false })
      .limit(1);

    let num = 1001;
    if (lastItems && lastItems.length > 0) {
      const lastCode = lastItems[0].item_code;
      const lastNum = parseInt(lastCode.split('-').pop() || '0');
      num = lastNum + 1;
    }

    const item_code = `${prefix}-${num}`;

    const { data, error } = await supabase
      .from('jewelry_items')
      .insert([{
        item_code,
        item_type: item.item_type || 'G',
        karat: item.karat || '21',
        origin: item.origin || 'L',
        category: item.category || 'R',
        status: item.status || 'جديد',
        model_name: item.model_name,
        weight: item.weight,
        price: item.price,
        stock_qty: item.stock_qty || 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // جلب قطعة بالكود
  getItemByCode: async (code: string): Promise<JewelryItem | null> => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('*')
      .eq('item_code', code)
      .single();

    if (error) return null;
    return data;
  },

  // تحديث المخزون بعد البيع
  updateStock: async (code: string, quantity: number): Promise<boolean> => {
    // جلب القطعة الحالية
    const { data: item } = await supabase
      .from('jewelry_items')
      .select('stock_qty')
      .eq('item_code', code)
      .single();

    if (!item) return false;

    const newQty = item.stock_qty - quantity;

    const { error } = await supabase
      .from('jewelry_items')
      .update({ stock_qty: newQty })
      .eq('item_code', code);

    return !error;
  },

  // تأكيد البيع وحفظ الفاتورة
  confirmSale: async (invoice: SaleInvoice): Promise<SaleInvoice> => {
    const { data, error } = await supabase
      .from('sale_invoices')
      .insert([{
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        total_amount: invoice.total_amount,
        seller_name: invoice.seller_name,
        seller_code: invoice.seller_code,
        items: invoice.items,
      }])
      .select()
      .single();

    if (error) throw error;

    // حفظ نسخة في localStorage كنسخة احتياطية
    saveInvoiceToLocal(invoice);

    // إرسال إيميل للإدارة (placeholder - يمكن تفعيله لاحقاً)
    sendInvoiceEmail(invoice);

    return data;
  },

  // جلب كل الفواتير
  getAllInvoices: async (): Promise<SaleInvoice[]> => {
    try {
      const { data, error } = await supabase
        .from('sale_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // دمج مع النسخ المحلية
      const localInvoices = getLocalInvoices();
      const mergedInvoices = [...(data || [])];

      // إضافة الفواتير المحلية التي ليست موجودة في السحابة
      localInvoices.forEach(local => {
        if (!mergedInvoices.find(inv => inv.invoice_number === local.invoice_number)) {
          mergedInvoices.unshift(local);
        }
      });

      return mergedInvoices;
    } catch (error) {
      // في حالة فشل الاتصال، جلب من localStorage
      return getLocalInvoices();
    }
  },

  // البحث
  searchItems: async (query: string): Promise<JewelryItem[]> => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('*')
      .or(`item_code.ilike.%${query}%,model_name.ilike.%${query}%,category.ilike.%${query}%`);

    if (error) throw error;
    return data || [];
  },

  // تحديث قطعة
  updateItem: async (item: JewelryItem): Promise<JewelryItem> => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .update({
        model_name: item.model_name,
        karat: item.karat,
        weight: item.weight,
        price: item.price,
        stock_qty: item.stock_qty,
        category: item.category,
        status: item.status,
      })
      .eq('item_code', item.item_code)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // حذف قطعة
  deleteItem: async (code: string): Promise<boolean> => {
    const { error } = await supabase
      .from('jewelry_items')
      .delete()
      .eq('item_code', code);

    return !error;
  },
};

// حفظ الفاتورة في localStorage
const saveInvoiceToLocal = (invoice: SaleInvoice) => {
  const invoices = getLocalInvoices();
  invoices.unshift(invoice);
  localStorage.setItem('saved_invoices', JSON.stringify(invoices.slice(0, 100))); // حفظ آخر 100 فاتورة
};

// جلب الفواتير من localStorage
const getLocalInvoices = (): SaleInvoice[] => {
  const data = localStorage.getItem('saved_invoices');
  return data ? JSON.parse(data) : [];
};

// إرسال إيميل (placeholder - يتطلب خدمة إيميل حقيقية)
// يمكن تفعيله لاحقاً مع Supabase Edge Functions أو خدمة خارجية
const sendInvoiceEmail = async (invoice: SaleInvoice) => {
  // TODO: تفعيل إرسال الإيميل
  // يمكن استخدام:
  // 1. Supabase Edge Functions مع خدمات إيميل (SendGrid, Mailgun)
  // 2. خدمات مثل EmailJS أو Formspree
  // 3. Zapier أو Integromat لربط الأحداث

  console.log('📧 Invoice Email Notification (placeholder):');
  console.log(`  To: manager@alhumroni.com`);
  console.log(`  Invoice: ${invoice.invoice_number}`);
  console.log(`  Amount: ${invoice.total_amount} د.ل`);
  console.log(`  Customer: ${invoice.customer_name || 'غير محدد'}`);
  console.log(`  Seller: ${invoice.seller_name}`);
  console.log(`  Items: ${invoice.items.length} قطع`);

  // في الإنتاج، يمكن حفظ الطلب في جدول لإرساله لاحقاً
  const emailQueue = JSON.parse(localStorage.getItem('email_queue') || '[]');
  emailQueue.push({
    to: 'manager@alhumroni.com',
    invoice: invoice.invoice_number,
    amount: invoice.total_amount,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('email_queue', JSON.stringify(emailQueue.slice(-50)));
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

// توليد QR Code URL
export const generateQRCodeUrl = (code: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`;
};