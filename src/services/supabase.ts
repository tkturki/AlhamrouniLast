import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here';

// Create Supabase client (or null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

// Simple hash for localStorage passwords (NOT cryptographically secure, but better than plaintext)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const seed = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let h2 = seed;
  for (let i = 0; i < str.length; i++) {
    h2 = ((h2 << 5) + h2 + str.charCodeAt(i)) & 0xffffffff;
  }
  return `h${Math.abs(hash).toString(36)}${Math.abs(h2).toString(36)}`;
};

// Hash password before storing (for localStorage fallback)
export const hashPassword = (password: string): string => simpleHash(password);

// Verify password against stored hash
export const verifyPassword = (password: string, storedHash: string): boolean => {
  return simpleHash(password) === storedHash;
};

// Log Supabase status
if (isSupabaseConfigured) {
  console.log('Supabase connected:', supabaseUrl);
} else {
  console.log('Supabase not configured - using localStorage fallback');
}

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

// Permissions System - unified comprehensive permissions
export interface UserPermissions {
  // فواتير
  canCreateInvoice: boolean;     // إنشاء فاتورة
  canPrintInvoices: boolean;     // طباعة الفواتير
  canReturns: boolean;           // مرتجعات
  // مخزون
  canAddItems: boolean;          // إضافة قطع
  canEditItems: boolean;         // تعديل قطع
  canDeleteItems: boolean;       // حذف قطع
  canSearch: boolean;            // بحث وعرض المخزون
  canEnterData: boolean;         // إدخال بيانات
  // مالي
  canViewFinancials: boolean;    // الاطلاع على المالية
  canEditFinancials: boolean;    // تعديل المالية
  canViewTreasury: boolean;      // الاطلاع على الخزينة
  canViewAnalysis: boolean;      // الاطلاع على التحليلات
  canViewReports: boolean;       // الاطلاع على التقارير
  canAdjustPrices: boolean;      // تعديل الأسعار
  // إدارة
  canManageUsers: boolean;       // إدارة المستخدمين
  canManageOrders: boolean;      // إدارة الطلبيات
  canArchive: boolean;           // الأرشفة
  canPrintInventory: boolean;    // طباعة المخزون
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'accountant' | 'seller' | 'data_entry';
  seller_code: string;
  isActive: boolean;
  permissions: UserPermissions;
  created_at?: string;
  last_login?: string;
}

// Internal user with password hash (not exposed outside this module)
interface UserWithPassword extends User {
  password_hash: string;
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
const defaultAdminPermissions: UserPermissions = {
  canCreateInvoice: true,
  canPrintInvoices: true,
  canReturns: true,
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: true,
  canSearch: true,
  canEnterData: true,
  canViewFinancials: true,
  canEditFinancials: true,
  canViewTreasury: true,
  canViewAnalysis: true,
  canViewReports: true,
  canAdjustPrices: true,
  canManageUsers: true,
  canManageOrders: true,
  canArchive: true,
  canPrintInventory: true,
};

const defaultSellerPermissions: UserPermissions = {
  canCreateInvoice: true,
  canPrintInvoices: true,
  canReturns: true,
  canAddItems: false,
  canEditItems: false,
  canDeleteItems: false,
  canSearch: true,
  canEnterData: false,
  canViewFinancials: false,
  canEditFinancials: false,
  canViewTreasury: false,
  canViewAnalysis: false,
  canViewReports: false,
  canAdjustPrices: false,
  canManageUsers: false,
  canManageOrders: false,
  canArchive: false,
  canPrintInventory: true,
};

const defaultAccountantPermissions: UserPermissions = {
  canCreateInvoice: false,
  canPrintInvoices: true,
  canReturns: true,
  canAddItems: false,
  canEditItems: false,
  canDeleteItems: false,
  canSearch: true,
  canEnterData: false,
  canViewFinancials: true,
  canEditFinancials: true,
  canViewTreasury: true,
  canViewAnalysis: true,
  canViewReports: true,
  canAdjustPrices: false,
  canManageUsers: false,
  canManageOrders: false,
  canArchive: true,
  canPrintInventory: false,
};

const defaultDataEntryPermissions: UserPermissions = {
  canCreateInvoice: false,
  canPrintInvoices: true,
  canReturns: false,
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: true,
  canSearch: true,
  canEnterData: true,
  canViewFinancials: false,
  canEditFinancials: false,
  canViewTreasury: false,
  canViewAnalysis: true,
  canViewReports: false,
  canAdjustPrices: false,
  canManageUsers: false,
  canManageOrders: true,
  canArchive: false,
  canPrintInventory: false,
};

// Auth API with enhanced features
export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const users = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      logActivity('LOGIN_FAILED', `محاولة دخول فاشلة لـ: ${email}`);
      throw new Error('البريد أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      logActivity('LOGIN_BLOCKED', `محاولة دخول من مستخدم موقوف: ${user.name}`);
      throw new Error('تم توقيف حسابك. يرجى التواصل مع الإدارة.');
    }

    const { password_hash: _, ...userWithoutPassword } = user as UserWithPassword;

    // Update last login
    user.last_login = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    // Update in Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        await supabase.from('users').update({ last_login: user.last_login }).eq('email', user.email);
      } catch (e) {
        console.log('Supabase error updating last login');
      }
    }

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

  hasPermission: (permission: keyof UserPermissions): boolean => {
    const user = authApi.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[permission] ?? false;
  },

  toggleUserStatus: async (userId: string, isActive: boolean): Promise<boolean> => {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].isActive = isActive;
    localStorage.setItem('users', JSON.stringify(users));

    // Update in Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        await supabase.from('users').update({ is_active: isActive }).eq('email', users[userIndex].email);
      } catch (e) {
        console.log('Supabase error toggling user status');
      }
    }

    logActivity(
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      `${isActive ? 'تفعيل' : 'توقيف'} حساب: ${users[userIndex].name}`
    );

    return true;
  },

  updateUserPermissions: async (userId: string, permissions: Partial<UserPermissions>): Promise<boolean> => {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].permissions = {
      ...users[userIndex].permissions,
      ...permissions,
    };
    localStorage.setItem('users', JSON.stringify(users));

    // Update in Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        await supabase.from('users').update({ permissions: users[userIndex].permissions }).eq('email', users[userIndex].email);
      } catch (e) {
        console.log('Supabase error updating permissions');
      }
    }

    logActivity(
      'PERMISSIONS_UPDATED',
      `تحديث صلاحيات: ${users[userIndex].name}`,
      permissions
    );

    return true;
  },

  addUser: async (userData: Omit<User, 'id' | 'created_at'> & { password: string }): Promise<User> => {
    const users = await getUsers();
    const passwordHash = hashPassword(userData.password);
    const { password: _, ...userDataWithoutPassword } = userData;

    // Save to Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            seller_code: userData.seller_code,
            is_active: userData.isActive,
            permissions: userData.permissions,
          })
          .select()
          .single();

        if (error) throw error;

        const newUser: UserWithPassword = {
          id: data.id,
          ...userDataWithoutPassword,
          password_hash: passwordHash,
          created_at: data.created_at,
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        logActivity('USER_CREATED', `إنشاء مستخدم جديد: ${newUser.name}`);
        return newUser;
      } catch (e) {
        console.log('Supabase error, saving to localStorage');
      }
    }

    // Fallback to localStorage
    const newUser: UserWithPassword = {
      ...userDataWithoutPassword,
      id: Date.now().toString(),
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    logActivity('USER_CREATED', `إنشاء مستخدم جديد: ${newUser.name}`);
    return newUser;
  },

  updateUser: async (userId: string, updates: Partial<User & { password: string }>): Promise<boolean> => {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    // Hash password if provided
    const { password, ...restUpdates } = updates as any;
    const finalUpdates: any = { ...restUpdates };
    if (password) {
      finalUpdates.password_hash = hashPassword(password);
    }

    users[userIndex] = { ...users[userIndex], ...finalUpdates };
    localStorage.setItem('users', JSON.stringify(users));

    // Update in Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        const supabaseUpdates: any = {
          email: users[userIndex].email,
          name: users[userIndex].name,
          role: users[userIndex].role,
          seller_code: users[userIndex].seller_code,
          is_active: users[userIndex].isActive,
          permissions: users[userIndex].permissions,
        };
        await supabase.from('users').update(supabaseUpdates).eq('email', users[userIndex].email);
      } catch (e) {
        console.log('Supabase error updating user');
      }
    }

    logActivity('USER_UPDATED', `تحديث بيانات المستخدم: ${users[userIndex].name}`);
    return true;
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const users = await getUsers();
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return false;

    // Prevent deleting last admin
    const admins = users.filter(u => u.role === 'admin');
    if (userToDelete.role === 'admin' && admins.length <= 1) {
      throw new Error('لا يمكن حذف آخر مدير');
    }

    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(filtered));

    // Delete from Supabase
    if (isSupabaseAvailable() && supabase) {
      try {
        await supabase.from('users').delete().eq('email', userToDelete.email);
      } catch (e) {
        console.log('Supabase error deleting user');
      }
    }

    logActivity('USER_DELETED', `حذف مستخدم: ${userToDelete.name}`);
    return true;
  },

  getUsersList: async (): Promise<UserWithPassword[]> => {
    return await getUsers();
  },
};

// إدارة المستخدمين - Supabase + localStorage fallback
const mapSupabaseUser = (u: any): UserWithPassword => ({
  id: u.id,
  email: u.email,
  password_hash: u.password_hash || hashPassword(u.password || ''),
  name: u.name,
  role: u.role,
  seller_code: u.seller_code || '',
  isActive: u.is_active,
  permissions: u.permissions || defaultSellerPermissions,
  created_at: u.created_at,
  last_login: u.last_login,
});

const getUsers = async (): Promise<UserWithPassword[]> => {
  // Try Supabase first
  if (isSupabaseAvailable() && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const mappedUsers = data.map(mapSupabaseUser);
        // Sync to localStorage
        localStorage.setItem('users', JSON.stringify(mappedUsers));
        return mappedUsers;
      }
    } catch (e) {
      console.log('Supabase error loading users, falling back to localStorage');
    }
  }

  // Fallback to localStorage
  const localData = localStorage.getItem('users');
  if (localData) return JSON.parse(localData);

  // Create default users
  const defaultUsers: UserWithPassword[] = [
    {
      id: '1',
      email: 'admin',
      password_hash: hashPassword('admin123'),
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
      password_hash: hashPassword('User456'),
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
  
  // Try to save defaults to Supabase
  if (isSupabaseAvailable() && supabase) {
    try {
      for (const u of defaultUsers) {
        await supabase.from('users').upsert({
          email: u.email,
          name: u.name,
          role: u.role,
          seller_code: u.seller_code,
          is_active: u.isActive,
          permissions: u.permissions,
        }, { onConflict: 'email' });
      }
    } catch (e) {
      console.log('Could not save default users to Supabase');
    }
  }
  
  return defaultUsers;
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

export const getUsersList = async (): Promise<UserWithPassword[]> => {
  return await getUsers();
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
  payment_method?: "cash" | "card" | "transfer";
}

// LocalStorage fallback functions
const getLocalStorageItems = (): JewelryItem[] => {
  const data = localStorage.getItem('jewelry_items');
  return data ? JSON.parse(data) : [];
};

const saveLocalStorageItems = (items: JewelryItem[]): void => {
  localStorage.setItem('jewelry_items', JSON.stringify(items));
};

// API Functions
export const jewelryApi = {
  // جلب كل القطع
  getAllItems: async (): Promise<JewelryItem[]> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('jewelry_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    return getLocalStorageItems();
  },

  // إضافة قطعة جديدة
  addItem: async (item: Partial<JewelryItem>): Promise<JewelryItem> => {
    // توليد الكود
    const prefix = `${item.karat || '21'}${item.item_type || 'G'}${item.origin || 'L'}${item.category || 'R'}`;

    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
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
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    let num = 1001;
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      const lastNum = parseInt(lastItem.item_code.split('-').pop() || '0');
      num = lastNum + 1;
    }

    const item_code = `${prefix}-${num}`;
    const newItem: JewelryItem = {
      id: Date.now(),
      item_code,
      item_type: item.item_type || 'G',
      karat: item.karat || '21',
      origin: item.origin || 'L',
      category: item.category || 'R',
      status: item.status || 'جديد',
      model_name: item.model_name || '',
      weight: item.weight || 0,
      price: item.price || 0,
      price_per_gram: item.price_per_gram || (item.weight ? item.price! / item.weight : 0),
      stock_qty: item.stock_qty || 1,
      created_at: new Date().toISOString(),
    };

    items.push(newItem);
    saveLocalStorageItems(items);

    logActivity('ITEM_ADDED', `إضافة قطعة جديدة: ${item.model_name}`, { item_code });
    notificationSystem.success('تمت الإضافة', `تمت إضافة القطعة ${item_code} بنجاح`);

    return newItem;
  },

  // جلب قطعة بالكود
  getItemByCode: async (code: string): Promise<JewelryItem | null> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('jewelry_items')
          .select('*')
          .eq('item_code', code)
          .single();

        if (error) throw error;
        return data;
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    return items.find(i => i.item_code === code) || null;
  },

  // تحديث المخزون بعد البيع
  updateStock: async (code: string, quantity: number): Promise<boolean> => {
    // Prevent negative stock
    if (quantity <= 0) return false;

    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data: item } = await supabase
          .from('jewelry_items')
          .select('stock_qty')
          .eq('item_code', code)
          .single();

        if (item) {
          if (item.stock_qty < quantity) {
            console.log(`Insufficient stock for ${code}: available ${item.stock_qty}, requested ${quantity}`);
            return false;
          }
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
    }

    // Fallback to local storage
    const itemsData = localStorage.getItem('jewelry_items');
    if (itemsData) {
      const items = JSON.parse(itemsData);
      const itemIndex = items.findIndex((i: any) => i.item_code === code);
      if (itemIndex !== -1) {
        if (items[itemIndex].stock_qty < quantity) {
          console.log(`Insufficient stock for ${code}`);
          return false;
        }
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
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
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
        console.log('Supabase error, falling back to localStorage');
      }
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
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
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
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    return getLocalInvoices();
  },

  // البحث
  searchItems: async (query: string): Promise<JewelryItem[]> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('jewelry_items')
          .select('*')
          .or(`item_code.ilike.%${query}%,model_name.ilike.%${query}%,category.ilike.%${query}%`);

        if (error) throw error;
        return data || [];
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(i => 
      i.item_code.toLowerCase().includes(lowerQuery) ||
      i.model_name.toLowerCase().includes(lowerQuery) ||
      i.category.toLowerCase().includes(lowerQuery)
    );
  },

  // تحديث قطعة
  updateItem: async (item: JewelryItem): Promise<JewelryItem> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
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
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    const index = items.findIndex(i => i.item_code === item.item_code);
    if (index === -1) throw new Error('Item not found');

    items[index] = { ...items[index], ...item };
    saveLocalStorageItems(items);

    logActivity('ITEM_UPDATED', `تعديل قطعة: ${item.item_code}`, item);
    notificationSystem.success('تم التعديل', `تم تحديث القطعة ${item.item_code}`);

    return items[index];
  },

  // حذف قطعة
  deleteItem: async (code: string): Promise<boolean> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { error } = await supabase
          .from('jewelry_items')
          .delete()
          .eq('item_code', code);

        if (error) throw error;

        logActivity('ITEM_DELETED', `حذف قطعة: ${code}`);
        notificationSystem.warning('تم الحذف', `تم حذف القطعة ${code}`);
        return true;
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    const filtered = items.filter(i => i.item_code !== code);
    if (filtered.length === items.length) return false;

    saveLocalStorageItems(filtered);
    logActivity('ITEM_DELETED', `حذف قطعة: ${code}`);
    notificationSystem.warning('تم الحذف', `تم حذف القطعة ${code}`);
    return true;
  },

  // البحث عن قطع مطابقة
  findMatchingItems: async (item: Partial<JewelryItem>): Promise<JewelryItem[]> => {
    // Try Supabase first
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from('jewelry_items')
          .select('*')
          .eq('model_name', item.model_name)
          .eq('karat', item.karat)
          .eq('category', item.category)
          .eq('weight', item.weight);

        if (error) throw error;
        return data || [];
      } catch (e) {
        console.log('Supabase error, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const items = getLocalStorageItems();
    return items.filter(i => 
      i.model_name === item.model_name &&
      i.karat === item.karat &&
      i.category === item.category &&
      i.weight === item.weight
    );
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
export const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
};

// Utility: Format date with English numerals
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', options);
};

// Utility: Format date-time with English numerals
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA') + ' ' + d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
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
