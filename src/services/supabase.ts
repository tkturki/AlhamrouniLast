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
  gold_category?: string;  // arabic, foreign, silver
  gold_item?: string;     // قلادة، خاتم، etc.
  metal_type?: string;    // ذهب ابيض، اصفر، etc.
  category: string;
  status: string;
  model_name: string;
  weight: number;
  price: number;           // السعر الأساسي
  purchase_price?: number;  // سعر الشراء
  sale_price?: number;      // سعر البيع
  price_per_gram?: number; // سعر الجرام
  stock_qty: number;
  image_url?: string;
  created_at?: string;
}

// Permissions System
export interface UserPermissions {
  canCreateInvoice: boolean;    // إصدار فاتورة
  canPrintInventory: boolean;  // طباعة المخزون
  canAddItems: boolean;       // إضافة القطع
  canEditItems: boolean;       // تعديل البيانات
  canDeleteItems: boolean;    // حذف
  canManageUsers: boolean;      // إدارة المستخدمين
  canViewReports: boolean;     // عرض التقارير
  canAdjustPrices: boolean;    // تعديل الأسعار
}

// User types with full permissions
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  seller_code: string;
  isActive: boolean;           // حساب مفعل/موقوف
  permissions: UserPermissions;
  created_at?: string;
  last_login?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  description: string;
  details?: any;
  timestamp: string;
  ip_address?: string;
}

// Notification System
export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Default Permissions
const defaultSellerPermissions: UserPermissions = {
  canCreateInvoice: true,
  canPrintInventory: false,
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: false,
  canManageUsers: false,
  canViewReports: true,
  canAdjustPrices: false,
};

const defaultAdminPermissions: UserPermissions = {
  canCreateInvoice: true,
  canPrintInventory: true,
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: true,
  canManageUsers: true,
  canViewReports: true,
  canAdjustPrices: true,
};

// Auth API with enhanced features
export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      // تسجيل محاولة دخول فاشلة
      logActivity('LOGIN_FAILED', `محاولة دخول فاشلة لـ: ${email}`);
      throw new Error('البريد أو كلمة المرور غير صحيحة');
    }

    // التحقق من حالة الحساب
    if (!user.isActive) {
      logActivity('LOGIN_BLOCKED', `محاولة دخول من مستخدم موقوف: ${user.name}`);
      throw new Error('تم توقيف حسابك. يرجى التواصل مع الإدارة.');
    }

    const { password: _, ...userWithoutPassword } = user;

    // تحديث آخر تسجيل دخول
    user.last_login = new Date().toISOString();
    saveUsers(users);

    // تسجيل الدخول الناجح
    logActivity('LOGIN_SUCCESS', `تسجيل دخول ناجح: ${user.name}`);

    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },

  logout: () => {
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      logActivity('LOGOUT', `تسجيل خروج: ${currentUser.name}`);
    }
    localStorage.removeItem('current_user');
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('current_user');
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated: (): boolean => {
    return authApi.getCurrentUser() !== null;
  },

  // التحقق من صلاحية معينة
  hasPermission: (permission: keyof UserPermissions): boolean => {
    const user = authApi.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true; // الأدمن له كل الصلاحيات
    return user.permissions?.[permission] ?? false;
  },

  // تفعيل/إيقاف المستخدم
  toggleUserStatus: async (userId: string, isActive: boolean): Promise<boolean> => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].isActive = isActive;
    saveUsers(users);

    logActivity(
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      `${isActive ? 'تفعيل' : 'توقيف'} حساب: ${users[userIndex].name}`
    );

    return true;
  },

  // تحديث صلاحيات المستخدم
  updateUserPermissions: async (userId: string, permissions: Partial<UserPermissions>): Promise<boolean> => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].permissions = {
      ...users[userIndex].permissions,
      ...permissions,
    };
    saveUsers(users);

    logActivity(
      'PERMISSIONS_UPDATED',
      `تحديث صلاحيات: ${users[userIndex].name}`,
      permissions
    );

    return true;
  },
};

// إدارة المستخدمين
const getUsers = (): (User & { password: string })[] => {
  const data = localStorage.getItem('users');
  if (data) return JSON.parse(data);

  // إنشاء المستخدمين الافتراضيين
  const defaultUsers: (User & { password: string })[] = [
    {
      id: '1',
      email: 'admin',
      password: 'admin123',
      name: 'مدير النظام',
      role: 'admin',
      seller_code: 'ADMIN',
      isActive: true,
      permissions: defaultAdminPermissions,
      created_at: new Date().toISOString(),
      last_login: undefined,
    },
    {
      id: '2',
      email: 'User1',
      password: 'User456',
      name: 'مستخدم 1',
      role: 'seller',
      seller_code: 'U001',
      isActive: true,
      permissions: defaultSellerPermissions,
      created_at: new Date().toISOString(),
      last_login: undefined,
    },
  ];
  localStorage.setItem('users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

const saveUsers = (usersList: (User & { password: string })[]) => {
  localStorage.setItem('users', JSON.stringify(usersList));
};

// Activity Log Functions
export const logActivity = (
  action: string,
  description: string,
  details?: any
): void => {
  const logs = getActivityLogs();
  const currentUser = authApi.getCurrentUser();

  const newLog: ActivityLog = {
    id: Date.now().toString(),
    user_id: currentUser?.id || 'system',
    user_name: currentUser?.name || 'النظام',
    action,
    description,
    details,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(newLog);
  // الاحتفاظ بآخر 500 سجل
  localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 500)));
};

export const getActivityLogs = (limit?: number): ActivityLog[] => {
  const data = localStorage.getItem('activity_logs');
  const logs = data ? JSON.parse(data) : [];
  return limit ? logs.slice(0, limit) : logs;
};

export const clearActivityLogs = (): void => {
  localStorage.removeItem('activity_logs');
  logActivity('LOGS_CLEARED', 'تم مسح سجل الأحداث');
};

export const getUsersList = (): (User & { password: string })[] => {
  return getUsers();
};

// Get notifications helper
const getNotificationsList = (): SystemNotification[] => {
  const data = localStorage.getItem('notifications');
  return data ? JSON.parse(data) : [];
};

// Notification System
export const notificationSystem = {
  show: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const notifications = getNotificationsList();
    const newNotification: SystemNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)));

    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('notification_added', { detail: newNotification }));

    return newNotification;
  },

  success: (title: string, message: string) => {
    return notificationSystem.show({ type: 'success', title, message });
  },

  error: (title: string, message: string) => {
    return notificationSystem.show({ type: 'error', title, message });
  },

  warning: (title: string, message: string) => {
    return notificationSystem.show({ type: 'warning', title, message });
  },

  info: (title: string, message: string) => {
    return notificationSystem.show({ type: 'info', title, message });
  },

  getAll: (): SystemNotification[] => {
    return getNotificationsList();
  },

  markAsRead: (id: string) => {
    const notifications = getNotificationsList();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  },

  markAllAsRead: () => {
    const notifications = getNotificationsList().map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(notifications));
  },

  clear: () => {
    localStorage.removeItem('notifications');
  },

  getUnreadCount: (): number => {
    return notificationSystem.getAll().filter(n => !n.read).length;
  },
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
        price_per_gram: item.price_per_gram || (item.weight > 0 ? item.price / item.weight : 0),
        stock_qty: item.stock_qty || 1,
      }])
      .select()
      .single();

    if (error) throw error;

    // تسجيل الحدث
    logActivity('ITEM_ADDED', `إضافة قطعة جديدة: ${item.model_name}`, { item_code });
    notificationSystem.success('تمت الإضافة', `تمت إضافة القطعة ${item_code} بنجاح`);

    // تنبيه عند المخزون المنخفض
    if ((item.stock_qty || 1) <= 5) {
      notificationSystem.warning('مخزون منخفض', `القطعة ${item_code} المخزون: ${item.stock_qty || 1}`);
    }

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
    try {
      // Try Supabase first
      const { data: item } = await supabase
        .from('jewelry_items')
        .select('stock_qty')
        .eq('item_code', code)
        .single();

      if (item) {
        const newQty = item.stock_qty - quantity;
        await supabase
          .from('jewelry_items')
          .update({ stock_qty: newQty })
          .eq('item_code', code);

        // تنبيه عند المخزون المنخفض
        if (newQty <= 1 && newQty > 0) {
          notificationSystem.warning('مخزون منخفض جداً', `القطعة ${code} المخزون: ${newQty}`);
        } else if (newQty === 0) {
          notificationSystem.error('نفد المخزون', `القطعة ${code} نفدت من المخزون`);
        }
        return true;
      }
    } catch (e) {
      console.log('Supabase not available, using local storage');
    }

    // Fallback to local storage
    const itemsData = localStorage.getItem('jewelry_items');
    if (itemsData) {
      const items = JSON.parse(itemsData);
      const itemIndex = items.findIndex((i: any) => i.item_code === code);
      if (itemIndex !== -1) {
        const newQty = items[itemIndex].stock_qty - quantity;
        items[itemIndex].stock_qty = newQty;
        localStorage.setItem('jewelry_items', JSON.stringify(items));

        // تنبيه عند المخزون المنخفض
        if (newQty <= 1 && newQty > 0) {
          notificationSystem.warning('مخزون منخفض جداً', `القطعة ${code} المخزون: ${newQty}`);
        } else if (newQty === 0) {
          notificationSystem.error('نفد المخزون', `القطعة ${code} نفدت من المخزون`);
        }
        return true;
      }
    }
    return false;
  },

  // تأكيد البيع وحفظ الفاتورة
  confirmSale: async (invoice: SaleInvoice): Promise<SaleInvoice> => {
    try {
      // Try Supabase first
      await supabase
        .from('sale_invoices')
        .insert([{
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          total_amount: invoice.total_amount,
          seller_name: invoice.seller_name,
          seller_code: invoice.seller_code,
          items: invoice.items,
        }]);
    } catch (e) {
      console.log('Supabase not available, using local storage');
    }

    // Always save to local storage as fallback
    saveInvoiceToLocal(invoice);
    logActivity('INVOICE_CREATED', `إنشاء فاتورة: ${invoice.invoice_number}`, {
      customer: invoice.customer_name,
      total: invoice.total_amount,
      items: invoice.items.length,
    });
    notificationSystem.success('تم البيع', `تم إنشاء الفاتورة ${invoice.invoice_number}`);

    return invoice;
  },

  // جلب كل الفواتير
  getAllInvoices: async (): Promise<SaleInvoice[]> => {
    try {
      const { data, error } = await supabase
        .from('sale_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const localInvoices = getLocalInvoices();
      const mergedInvoices = [...(data || [])];

      localInvoices.forEach(local => {
        if (!mergedInvoices.find(inv => inv.invoice_number === local.invoice_number)) {
          mergedInvoices.unshift(local);
        }
      });

      return mergedInvoices;
    } catch (error) {
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

    logActivity('ITEM_UPDATED', `تعديل قطعة: ${item.item_code}`, item);
    notificationSystem.success('تم التعديل', `تم تحديث القطعة ${item.item_code}`);

    return data;
  },

  // حذف قطعة
  deleteItem: async (code: string): Promise<boolean> => {
    const { error } = await supabase
      .from('jewelry_items')
      .delete()
      .eq('item_code', code);

    if (!error) {
      logActivity('ITEM_DELETED', `حذف قطعة: ${code}`);
      notificationSystem.warning('تم الحذف', `تم حذف القطعة ${code}`);
    }

    return !error;
  },

  // البحث عن قطع مطابقة
  findMatchingItems: async (item: Partial<JewelryItem>): Promise<JewelryItem[]> => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('*')
      .eq('model_name', item.model_name)
      .eq('karat', item.karat)
      .eq('category', item.category)
      .eq('weight', item.weight);

    if (error) return [];
    return data || [];
  },
};

// حفظ الفاتورة في localStorage
const saveInvoiceToLocal = (invoice: SaleInvoice) => {
  const invoices = getLocalInvoices();
  invoices.unshift(invoice);
  localStorage.setItem('saved_invoices', JSON.stringify(invoices.slice(0, 100)));
};

const getLocalInvoices = (): SaleInvoice[] => {
  const data = localStorage.getItem('saved_invoices');
  return data ? JSON.parse(data) : [];
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

// Model names storage (for combobox)
export const modelNamesStorage = {
  getAll: (): string[] => {
    const data = localStorage.getItem('model_names');
    return data ? JSON.parse(data) : [];
  },

  add: (name: string) => {
    const names = modelNamesStorage.getAll();
    if (!names.includes(name)) {
      names.push(name);
      localStorage.setItem('model_names', JSON.stringify(names));
    }
  },

  remove: (name: string) => {
    const names = modelNamesStorage.getAll().filter(n => n !== name);
    localStorage.setItem('model_names', JSON.stringify(names));
  },
};

// Categories storage
export const categoriesStorage = {
  getAll: (): string[] => {
    const data = localStorage.getItem('categories');
    return data ? JSON.parse(data) : [
      'خاتم', 'سوار', 'قلادة', 'حلق', 'سلسلة', 'عثرة', 'أخرى'
    ];
  },

  add: (category: string) => {
    const categories = categoriesStorage.getAll();
    if (!categories.includes(category)) {
      categories.push(category);
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  },
};

// Utility: Format number with English digits and commas
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Utility: Parse formatted number
export const parseFormattedNumber = (str: string): number => {
  return parseFloat(str.replace(/,/g, '')) || 0;
};

// Utility: Format currency
export const formatCurrency = (amount: number): string => {
  return `${formatNumber(amount)} د.ل`;
};

// Utility: Format weight
export const formatWeight = (weight: number): string => {
  return `${formatNumber(weight, 2)} غ`;
};

// Utility: Format percentage
export const formatPercentage = (value: number): string => {
  return `${formatNumber(value, 2)}%`;
};
