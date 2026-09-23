import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit, Trash2, X, CheckCircle, AlertTriangle, Search, UserPlus, Key, Eye, EyeOff, Activity, Bell, ToggleLeft, ToggleRight, FileText, Printer, Gem, RefreshCw, Save, Database, Download, Upload, Trash, Play, Square, DollarSign, Settings, Store, Phone, MapPin, FolderOpen, Hash } from 'lucide-react';
import { authApi, getUsersList, getActivityLogs, clearActivityLogs, logActivity, notificationSystem, User, UserPermissions, ActivityLog, formatNumber } from '../services/supabase';
import { getSystemSettings, updateGoldPrices, resetToApiPrices, getGoldPrices, updateExchangeRate, updateParallelUsd, updateDeliveryAlerts, getExchangeRate, resetExchangeRate, saveSystemSettings } from '../services/settings';
import { exportFullBackup, importFullBackup, getBackupStats, getAllLocalStorageData } from '../services/backup';
import { resetAllSerialNumbers, getStorageCounts } from '../services/goldOrdersStorage';
import { addDemoData, removeDemoData, hasDemoDataSimulation, getDemoDataStats } from '../services/demoData';
import { realtimeSync } from '../services/realtimeSync';
import { sendDeliveryAlerts, getUpcomingDeliveries } from '../services/deliveryAlerts';

const AdminPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'settings' | 'backup' | 'demo'>('users');
  const canEditGoldPrices = currentUser?.role === 'admin' || currentUser?.role === 'seller';
  const canManageUsers = currentUser?.role === 'admin';
  const [users, setUsers] = useState<User[]>([]);
  const [goldPrices, setGoldPrices] = useState<any>(null);
  const [priceForm, setPriceForm] = useState({ gold24k: 0, gold22k: 0, gold21k: 0, gold18k: 0, silver: 0, storeName: '', storePhone: '', storeAddress: '' });
  const [exchangeRate, setExchangeRate] = useState(4.85);
  const [exchangeFormStr, setExchangeFormStr] = useState('4.85');
  const [parallelUsd, setParallelUsd] = useState(0);
  const [parallelFormStr, setParallelFormStr] = useState('');
  const [deliveryAlertsEnabled, setDeliveryAlertsEnabled] = useState(true);
  const [deliveryDaysBefore, setDeliveryDaysBefore] = useState('20');
  const [deliveryPhones, setDeliveryPhones] = useState('+218912133218\n+218913157496');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [backupStats, setBackupStats] = useState<{ keysCount: number; totalSizeKB: number; itemsCount: number } | null>(null);
  const [imagesFolderPath, setImagesFolderPath] = useState('');
  const [tempFolderPath, setTempFolderPath] = useState('');
  const [storageCounts, setStorageCounts] = useState({ receipts: 0, invoices: 0 });

  const [formData, setFormData] = useState({
    email: '', password: '', name: '', role: 'seller' as 'admin' | 'accountant' | 'seller' | 'data_entry', seller_code: '', isActive: true,
    permissions: {
      canCreateInvoice: true, canPrintInvoices: true, canReturns: true, canAddItems: true, canEditItems: true,
      canDeleteItems: false, canSearch: true, canEnterData: true, canViewFinancials: false, canEditFinancials: false,
      canViewTreasury: false, canViewAnalysis: false, canViewReports: true, canAdjustPrices: false,
      canManageUsers: false, canManageOrders: false, canArchive: false, canPrintInventory: false,
    } as UserPermissions,
  });

  useEffect(() => { 
    loadData(); 
    
    // Listen for realtime updates from other devices
    const unsubSettings = realtimeSync.on('settings_updated', () => {
      console.log('⚙️ Settings updated from another device - refreshing...');
      const settings = getSystemSettings();
      setGoldPrices(settings.goldPrices);
      setPriceForm({ gold24k: settings.goldPrices.gold24k, gold22k: settings.goldPrices.gold22k, gold21k: settings.goldPrices.gold21k, gold18k: settings.goldPrices.gold18k, silver: settings.goldPrices.silver, storeName: settings.storeName, storePhone: settings.storePhone, storeAddress: settings.storeAddress });
    });
    const unsubUsers = realtimeSync.on('users_updated', () => {
      console.log('👥 Users updated from another device - refreshing...');
      loadData();
    });
    
    return () => {
      unsubSettings();
      unsubUsers();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setCurrentUser(authApi.getCurrentUser());
    try {
      const allUsers = await authApi.getUsersList();
      const usersList = allUsers.map((u: any) => { const { password: _, ...userWithoutPassword } = u; return userWithoutPassword; });
      setUsers(usersList);
    } catch (e) {
      console.error('Error loading users:', e);
    }
    setLogs(getActivityLogs(100));
    const settings = getSystemSettings();
    setGoldPrices(settings.goldPrices);
    setPriceForm({ gold24k: settings.goldPrices.gold24k, gold22k: settings.goldPrices.gold22k, gold21k: settings.goldPrices.gold21k, gold18k: settings.goldPrices.gold18k, silver: settings.goldPrices.silver, storeName: settings.storeName, storePhone: settings.storePhone, storeAddress: settings.storeAddress });
    const rate = getExchangeRate();
    setExchangeRate(rate);
    setExchangeFormStr(rate.toString());
    setParallelUsd(settings.exchangeRate.parallelUsd || 0);
    setParallelFormStr(settings.exchangeRate.parallelUsd?.toString() || '');
    setDeliveryAlertsEnabled(settings.deliveryAlerts?.enabled ?? true);
    setDeliveryDaysBefore(settings.deliveryAlerts?.daysBeforeDelivery?.toString() || '20');
    setDeliveryPhones(settings.deliveryAlerts?.phoneNumbers?.join('\n') || '+218912133218\n+218913157496');
    setStorageCounts(getStorageCounts());

    // Load images folder path from server
    try {
      const response = await fetch('/api/images/folder-path');
      const result = await response.json();
      if (result.success) {
        setImagesFolderPath(result.data.path || '');
        setTempFolderPath(result.data.path || '');
      }
    } catch (e) { /* ignore */ }
    const allData = getAllLocalStorageData();
    setBackupStats(getBackupStats(allData));
    setLoading(false);
  };

  const handleSaveGoldPrices = () => {
    const success = updateGoldPrices({ gold24k: priceForm.gold24k, gold21k: priceForm.gold21k, gold18k: priceForm.gold18k, silver: priceForm.silver });
    if (success) {
      notificationSystem.success('تم الحفظ', 'تم تحديث أسعار الذهب بنجاح');
      logActivity('PRICE_UPDATE', `تحديث أسعار الذهب: 24k=${priceForm.gold24k} د.ل`);
      loadData();
    } else {
      notificationSystem.error('خطأ', 'حدث خطأ أثناء حفظ الأسعار');
    }
  };

  const handleResetPrices = async () => {
    if (confirm('هل تريد جلب الأسعار من MetalPriceAPI؟')) {
      const success = await resetToApiPrices();
      if (success) { 
        notificationSystem.success('تم التحديث', 'تم جلب الأسعار من API بنجاح'); 
        loadData(); 
      } else {
        notificationSystem.error('خطأ', 'فشل جلب الأسعار - تحقق من الاتصال بالإنترنت');
      }
    }
  };

  const handleSaveExchangeRate = () => {
    const n = parseFloat(exchangeFormStr);
    if (isNaN(n)) return;
    const success = updateExchangeRate(n);
    if (success) {
      notificationSystem.success('تم الحفظ', 'تم تحديث سعر الصرف بنجاح');
      logActivity('EXCHANGE_UPDATE', `تحديث سعر الصرف: ${exchangeFormStr} د.ل/$`);
      setExchangeRate(n);
    } else { notificationSystem.error('خطأ', 'حدث خطأ أثناء حفظ سعر الصرف'); }
  };

  const handleSaveImagesFolderPath = async () => {
    try {
      const response = await fetch('/api/images/folder-path', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: tempFolderPath }),
      });
      const result = await response.json();
      if (result.success) {
        setImagesFolderPath(tempFolderPath);
        notificationSystem.success('تم الحفظ', 'تم تحديث مسار مجلد الصور');
      }
    } catch (e) {
      notificationSystem.error('خطأ', 'حدث خطأ أثناء حفظ المسار');
    }
  };

  const handleResetExchangeRate = () => {
    if (confirm('هل تريد إعادة سعر الصرف الافتراضي؟')) {
      const success = resetExchangeRate();
      if (success) {
        notificationSystem.success('تم التحديث', 'تم إعادة سعر الصرف الافتراضي');
        const defaultRate = 4.85;
        setExchangeRate(defaultRate);
        setExchangeFormStr(defaultRate.toString());
        loadData();
      }
    }
  };

  const handleExportBackup = () => {
    exportFullBackup();
    notificationSystem.success('تم التصدير', 'تم تحميل ملف النسخة الاحتياطية الكاملة');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية بالبيانات من الملف.')) { e.target.value = ''; return; }
    const result = await importFullBackup(file);
    if (result.success) {
      notificationSystem.success('تم الاستعادة', result.message);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      notificationSystem.error('خطأ', result.message);
    }
    e.target.value = '';
  };

  const handleAddDemoData = () => {
    if (confirm('هل تريد إضافة بيانات تجريبية؟ سيتم إضافة 50 قطعة و 20 فاتورة.')) {
      if (addDemoData({ items: 50, invoices: 20, users: 0 })) loadData();
    }
  };

  const handleRemoveDemoData = () => {
    if (confirm('هل أنت متأكد من إزالة جميع البيانات التجريبية؟')) {
      if (removeDemoData()) loadData();
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, password: '', name: user.name, role: user.role, seller_code: user.seller_code || '', isActive: user.isActive, permissions: user.permissions || { canCreateInvoice: true, canPrintInvoices: true, canReturns: true, canAddItems: true, canEditItems: true, canDeleteItems: false, canSearch: true, canEnterData: true, canViewFinancials: false, canEditFinancials: false, canViewTreasury: false, canViewAnalysis: false, canViewReports: true, canAdjustPrices: false, canManageUsers: false, canManageOrders: false, canArchive: false, canPrintInventory: false } });
    } else {
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'seller', seller_code: '', isActive: true, permissions: { canCreateInvoice: true, canPrintInvoices: true, canReturns: true, canAddItems: true, canEditItems: true, canDeleteItems: false, canSearch: true, canEnterData: true, canViewFinancials: false, canEditFinancials: false, canViewTreasury: false, canViewAnalysis: false, canViewReports: true, canAdjustPrices: false, canManageUsers: false, canManageOrders: false, canArchive: false, canPrintInventory: false } });
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingUser(null); setShowPassword(false); };

  const handleSaveUser = async () => {
    if (!formData.email || !formData.name) { notificationSystem.error('خطأ', 'يرجى ملء جميع الحقول المطلوبة'); return; }
    if (!editingUser && !formData.password) { notificationSystem.error('خطأ', 'يرجى إدخال كلمة مرور للمستخدم الجديد'); return; }
    
    try {
      if (editingUser) {
        const updates: any = { email: formData.email, name: formData.name, role: formData.role, seller_code: formData.seller_code, isActive: formData.isActive, permissions: formData.permissions };
        if (formData.password) updates.password = formData.password;
        await authApi.updateUser(editingUser.id, updates);
        notificationSystem.success('تم الحفظ', 'تم تحديث بيانات المستخدم');
      } else {
        await authApi.addUser({ email: formData.email, password: formData.password, name: formData.name, role: formData.role, seller_code: formData.seller_code, isActive: formData.isActive, permissions: formData.permissions });
        notificationSystem.success('تم الإضافة', 'تم إضافة المستخدم الجديد');
      }
      loadData();
      handleCloseModal();
    } catch (err: any) {
      notificationSystem.error('خطأ', err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await authApi.toggleUserStatus(userId, newStatus);
      if (newStatus) { notificationSystem.success('تم التفعيل', 'تم تفعيل الحساب'); }
      else { notificationSystem.warning('تم الإيقاف', 'تم إيقاف الحساب'); }
      loadData();
    } catch (err: any) {
      notificationSystem.error('خطأ', err.message || 'حدث خطأ');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await authApi.deleteUser(id);
      notificationSystem.warning('تم الحذف', 'تم حذف المستخدم');
      loadData();
      setDeleteConfirm(null);
    } catch (err: any) {
      notificationSystem.error('خطأ', err.message || 'لا يمكن حذف المستخدم');
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع سجلات الأحداث؟')) { clearActivityLogs(); loadData(); notificationSystem.info('تم المسح', 'تم مسح سجلات الأحداث'); }
  };

  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return (<span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><Shield className="w-4 h-4" />مدير</span>);
      case 'accountant': return (<span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><DollarSign className="w-4 h-4" />محاسب</span>);
      case 'seller': return (<span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><Users className="w-4 h-4" />بائع</span>);
      case 'data_entry': return (<span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><Edit className="w-4 h-4" />مدخل بيانات</span>);
      default: return (<span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">{role}</span>);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('LOGIN')) return '🔐'; if (action.includes('LOGOUT')) return '🚪'; if (action.includes('ITEM')) return '💎';
    if (action.includes('INVOICE')) return '📄'; if (action.includes('USER')) return '👤'; if (action.includes('PERMISSION')) return '🔑';
    if (action.includes('PRINT')) return '🖨️'; return '📝';
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">لوحة التحكم</h1>
          <p className="text-gray-400">إدارة المستخدمين والصلاحيات</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-xl overflow-x-auto">
        <button onClick={() => setActiveTab('users')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}><Users className="w-5 h-5" />المستخدمين</button>
        <button onClick={() => setActiveTab('logs')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}><Activity className="w-5 h-5" />السجلات</button>
        <button onClick={() => setActiveTab('settings')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}><Settings className="w-5 h-5" />الإعدادات</button>
        <button onClick={() => setActiveTab('backup')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'backup' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}><Database className="w-5 h-5" />النسخ</button>
        <button onClick={() => setActiveTab('demo')} className={`py-3 px-4 rounded-lg flex items-center gap-2 font-bold whitespace-nowrap ${activeTab === 'demo' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}><Play className="w-5 h-5" />تجريبي</button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-400" /></div>
                <div><p className="text-3xl font-bold text-white">{users.length}</p><p className="text-gray-400 text-sm">إجمالي المستخدمين</p></div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center"><ToggleRight className="w-6 h-6 text-green-400" /></div>
                <div><p className="text-3xl font-bold text-white">{users.filter(u => u.isActive).length}</p><p className="text-gray-400 text-sm">مفعلين</p></div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center"><ToggleLeft className="w-6 h-6 text-red-400" /></div>
                <div><p className="text-3xl font-bold text-white">{users.filter(u => !u.isActive).length}</p><p className="text-gray-400 text-sm">موقوفين</p></div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن مستخدم..." className="w-full bg-gray-700 border border-gray-600 rounded-xl px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2"><UserPlus className="w-5 h-5" />إضافة مستخدم</button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-900"><th className="px-6 py-4 text-right text-gray-400 font-medium">المستخدم</th><th className="px-6 py-4 text-center text-gray-400 font-medium">البريد</th><th className="px-6 py-4 text-center text-gray-400 font-medium">الصلاحية</th><th className="px-6 py-4 text-center text-gray-400 font-medium">الحالة</th><th className="px-6 py-4 text-center text-gray-400 font-medium">الإجراءات</th></tr></thead>
                <tbody>
                  {loading ? (<tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div></td></tr>) : filteredUsers.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500"><Users className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>لا يوجد مستخدمين</p></td></tr>) : filteredUsers.map((user, index) => (
                    <tr key={user.id} className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}>
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isActive ? 'bg-green-600/20' : 'bg-red-600/20'}`}><span className={`font-bold ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>{user.name.charAt(0)}</span></div><div><span className="font-bold text-white">{user.name}</span><p className="text-gray-500 text-sm">{user.seller_code}</p></div></div></td>
                      <td className="px-6 py-4 text-center text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-center">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-center"><button onClick={() => handleToggleUserStatus(user.id, user.isActive)} className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 mx-auto ${user.isActive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{user.isActive ? (<><ToggleRight className="w-4 h-4" />مفعل</>) : (<><ToggleLeft className="w-4 h-4" />موقوف</>)}</button></td>
                      <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => handleOpenModal(user)} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 p-2 rounded-lg"><Edit className="w-4 h-4" /></button>{user.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1 ? (<button onClick={() => setDeleteConfirm(user.id)} className="bg-red-600/20 hover:bg-red-600 text-red-400 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>) : null}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" />سجلات الأحداث</h3><button onClick={handleClearLogs} className="bg-red-600/20 hover:bg-red-600 text-red-400 px-4 py-2 rounded-lg text-sm">مسح السجلات</button></div>
          <div className="max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (<div className="text-center py-12 text-gray-500"><Activity className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>لا توجد سجلات</p></div>) : (
              <div className="divide-y divide-gray-700">{logs.map((log) => (<div key={log.id} className="p-4 hover:bg-gray-700/50"><div className="flex items-start gap-3"><span className="text-2xl">{getActivityIcon(log.action)}</span><div className="flex-1"><p className="text-white font-medium">{log.description}</p><div className="flex items-center gap-4 mt-1 text-sm text-gray-400"><span>بواسطة: {log.user_name}</span><span>•</span><span>{formatDate(log.timestamp)}</span></div></div></div></div>))}</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <>
          {/* Gold Prices - Admin and Seller only */}
          {canEditGoldPrices && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-yellow-600 to-yellow-500"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Gem className="w-5 h-5" />إعدادات أسعار الذهب</h3><span className={`px-3 py-1 rounded-full text-sm font-bold ${goldPrices?.isCustom ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>{goldPrices?.isCustom ? 'مُحددة يدوياً' : 'من API'}</span></div>
            <div className="p-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6"><p className="text-yellow-400 text-sm"><span className="font-bold">ملاحظة:</span> هذه الأسعار تُستخدم لحساب قيمة القطع في النظام.</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 rounded-xl p-5 border border-yellow-500/30"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center"><span className="text-gray-900 font-bold text-xs">24</span></div><span className="text-yellow-400 font-medium">عيار 24</span></div><div className="mt-2"><input type="text" inputMode="decimal" value={priceForm.gold24k} onChange={(e) => setPriceForm({ ...priceForm, gold24k: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" /><span className="text-gray-400 text-sm">د.ل / غرام</span></div></div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 rounded-xl p-5 border border-yellow-500/30"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">22</span></div><span className="text-yellow-400 font-medium">عيار 22</span></div><div className="mt-2"><input type="text" inputMode="decimal" value={priceForm.gold22k} onChange={(e) => setPriceForm({ ...priceForm, gold22k: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" /><span className="text-gray-400 text-sm">د.ل / غرام</span></div></div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 rounded-xl p-5 border border-yellow-500/30"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center"><span className="text-gray-900 font-bold text-xs">21</span></div><span className="text-yellow-400 font-medium">عيار 21</span></div><div className="mt-2"><input type="text" inputMode="decimal" value={priceForm.gold21k} onChange={(e) => setPriceForm({ ...priceForm, gold21k: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" /><span className="text-gray-400 text-sm">د.ل / غرام</span></div></div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 rounded-xl p-5 border border-yellow-500/30"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-yellow-700 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">18</span></div><span className="text-yellow-400 font-medium">عيار 18</span></div><div className="mt-2"><input type="text" inputMode="decimal" value={priceForm.gold18k} onChange={(e) => setPriceForm({ ...priceForm, gold18k: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" /><span className="text-gray-400 text-sm">د.ل / غرام</span></div></div>
                <div className="bg-gradient-to-br from-gray-500/20 to-gray-400/10 rounded-xl p-5 border border-gray-500/30"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center"><span className="text-gray-900 font-bold text-xs">AG</span></div><span className="text-gray-300 font-medium">الفضة</span></div><div className="mt-2"><input type="text" inputMode="decimal" value={priceForm.silver} onChange={(e) => setPriceForm({ ...priceForm, silver: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-gray-500" /><span className="text-gray-400 text-sm">د.ل / غرام</span></div></div>
              </div>
              {goldPrices?.lastUpdated && <div className="text-center text-gray-400 text-sm mb-4">آخر تحديث: {new Date(goldPrices.lastUpdated).toLocaleString('ar-SA')}</div>}
              <div className="flex gap-4"><button onClick={handleSaveGoldPrices} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Save className="w-5 h-5" />حفظ الأسعار</button><button onClick={handleResetPrices} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2"><RefreshCw className="w-5 h-5" />إعادة من API</button></div>
            </div>
          </div>
          )}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6"><h3 className="text-lg font-bold text-white mb-4">ملخص الأسعار الحالية</h3><div className="grid grid-cols-2 md:grid-cols-6 gap-4"><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">عيار 24</p><p className="text-2xl font-bold text-yellow-400" lang="en">{formatNumber(priceForm.gold24k)} د.ل</p></div><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">عيار 22</p><p className="text-2xl font-bold text-yellow-400" lang="en">{formatNumber(priceForm.gold22k)} د.ل</p></div><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">عيار 21</p><p className="text-2xl font-bold text-yellow-400" lang="en">{formatNumber(priceForm.gold21k)} د.ل</p></div><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">عيار 18</p><p className="text-2xl font-bold text-yellow-400" lang="en">{formatNumber(priceForm.gold18k)} د.ل</p></div><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">الفضة</p><p className="text-2xl font-bold text-gray-300" lang="en">{formatNumber(priceForm.silver)} د.ل</p></div><div className="bg-gray-700/50 rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">الدولار Parallel</p><p className="text-2xl font-bold text-orange-400" lang="en">{formatNumber(parallelUsd)} د.ل</p></div></div></div>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6"><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />أسعار الصرف</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-gray-400 text-sm mb-2">سعر صرف الدولار Official (د.ل)</label><div className="flex gap-2"><input type="text" inputMode="decimal" value={exchangeFormStr} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setExchangeFormStr(v); }} onBlur={() => { const n = parseFloat(exchangeFormStr); setExchangeFormStr(isNaN(n) ? '0' : n.toString()); }} className="flex-1 bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500" dir="ltr" /><button onClick={() => { const n = parseFloat(exchangeFormStr); updateExchangeRate(isNaN(n) ? 0 : n); notificationSystem.success('تم', 'تم حفظ سعر الصرف'); logActivity('EXCHANGE_RATE_UPDATED', `تحديث سعر الصرف: ${exchangeFormStr}`); }} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-3 rounded-lg"><Save className="w-5 h-5" /></button></div></div>
            <div><label className="block text-gray-400 text-sm mb-2">سعر صرف الدولار Parallel (د.ل)</label><div className="flex gap-2"><input type="text" inputMode="decimal" value={parallelFormStr} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setParallelFormStr(v); }} onBlur={() => { const n = parseFloat(parallelFormStr); setParallelFormStr(isNaN(n) ? '' : n.toString()); }} className="flex-1 bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" dir="ltr" placeholder="سعر السوق الموازي" /><button onClick={() => { const n = parseFloat(parallelFormStr); updateParallelUsd(n || 0); setParallelUsd(n || 0); notificationSystem.success('تم', 'تم حفظ سعر السوق الموازي'); logActivity('PARALLEL_USD_UPDATED', `تحديث سعر السوق الموازي: ${parallelFormStr}`); }} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-3 rounded-lg"><Save className="w-5 h-5" /></button></div></div>
          </div><button onClick={handleResetExchangeRate} className="text-gray-400 hover:text-white text-sm">إعادة افتراضي</button>{goldPrices?.lastUpdated && <p className="text-gray-500 text-sm mt-3">آخر تحديث: {new Date(goldPrices.lastUpdated).toLocaleString('en-CA')}</p>}</div>
          {/* Images Folder Path */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-400" />مجلد الصور
            </h3>
            <p className="text-gray-400 text-sm mb-4">حدد مسار المجلد الذي يحتوي على صور المجوهرات على الهارد ديسك لعرضها في متصفح الصور</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={tempFolderPath}
                onChange={(e) => setTempFolderPath(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="مثال: D:\صور المجوهرات"
                dir="ltr"
              />
              <button onClick={handleSaveImagesFolderPath}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />حفظ
              </button>
            </div>
            {imagesFolderPath && <p className="text-green-400 text-sm mt-2">✓ المسار الحالي: <span className="font-mono" dir="ltr">{imagesFolderPath}</span></p>}
          </div>
          {/* Delivery Alerts Settings */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />تنبيهات التسليم (واتساب)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">تفعيل التنبيهات</span>
                <button onClick={() => setDeliveryAlertsEnabled(!deliveryAlertsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${deliveryAlertsEnabled ? 'bg-green-600' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${deliveryAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">أيام قبل التسليم للتنبيه</label>
                <input type="text" inputMode="decimal" value={deliveryDaysBefore} onChange={(e) => setDeliveryDaysBefore(e.target.value)}
                  className="w-32 bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-orange-500" dir="ltr" />
                <span className="text-gray-500 text-sm mr-2">يوم</span>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">أرقام الواتساب (سطر لكل رقم)</label>
                <textarea value={deliveryPhones} onChange={(e) => setDeliveryPhones(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  dir="ltr" placeholder="+218912133218" />
              </div>
              <button onClick={() => {
                const phones = deliveryPhones.split('\n').map(p => p.trim()).filter(p => p);
                updateDeliveryAlerts({
                  enabled: deliveryAlertsEnabled,
                  daysBeforeDelivery: parseInt(deliveryDaysBefore) || 20,
                  phoneNumbers: phones,
                });
                notificationSystem.success('تم', 'تم حفظ إعدادات التنبيهات');
                logActivity('DELIVERY_ALERTS_UPDATED', 'تحديث إعدادات تنبيهات التسليم');
              }} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />حفظ الإعدادات
              </button>
              <button onClick={() => {
                const results = sendDeliveryAlerts();
                if (results.sent > 0) {
                  notificationSystem.success('تم الإرسال', `تم إرسال ${results.sent} تنبيه واتساب`);
                } else {
                  notificationSystem.info('لا تنبيهات', 'لا توجد طلبيات تحتاج تنبيه الآن');
                }
              }} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                <Bell className="w-5 h-5" />إرسال تنبيهات الآن
              </button>
            </div>
            {/* Upcoming deliveries */}
            <div className="mt-4 p-4 bg-gray-700/50 rounded-xl">
              <h4 className="text-white font-bold mb-2">الطلبيات القادمة (خلال {deliveryDaysBefore} يوم)</h4>
              {getUpcomingDeliveries(parseInt(deliveryDaysBefore) || 20).length === 0 ? (
                <p className="text-gray-400 text-sm">لا توجد طلبيات قادمة</p>
              ) : (
                <div className="space-y-2">
                  {getUpcomingDeliveries(parseInt(deliveryDaysBefore) || 20).slice(0, 5).map(({ order, daysRemaining }) => (
                    <div key={order.receipt_number} className="flex justify-between items-center text-sm">
                      <span className="text-white">{order.customer_name} - {order.receipt_number}</span>
                      <span className={`font-bold ${daysRemaining <= 7 ? 'text-red-400' : daysRemaining <= 14 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {daysRemaining <= 0 ? `متأخر ${Math.abs(daysRemaining)} يوم` : `باقي ${daysRemaining} يوم`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Store Info Settings */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-yellow-400" />معلومات المحل</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">اسم المحل</label>
                <input type="text" value={priceForm.storeName || getSystemSettings().storeName} onChange={(e) => setPriceForm({ ...priceForm, storeName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">رقم الهاتف</label>
                <input type="text" value={priceForm.storePhone || getSystemSettings().storePhone} onChange={(e) => setPriceForm({ ...priceForm, storePhone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">العنوان</label>
                <input type="text" value={priceForm.storeAddress || getSystemSettings().storeAddress} onChange={(e) => setPriceForm({ ...priceForm, storeAddress: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
            </div>
            <button onClick={() => {
              const s = getSystemSettings();
              saveSystemSettings({ storeName: priceForm.storeName || s.storeName, storePhone: priceForm.storePhone || s.storePhone, storeAddress: priceForm.storeAddress || s.storeAddress });
              notificationSystem.success('تم الحفظ', 'تم تحديث معلومات المحل بنجاح');
              logActivity('STORE_INFO_UPDATED', 'تحديث معلومات المحل');
            }} className="mt-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> حفظ معلومات المحل
            </button>
          </div>
          {/* Serial Number Reset */}
          <div className="bg-gray-800 rounded-2xl border border-red-500/30 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Hash className="w-5 h-5 text-red-400" />صفير الأرقام التسلسلية
            </h3>
            <p className="text-gray-400 text-sm mb-4">إعادة تعيين جميع أرقام الإيصالات والفواتير للتسلسل الصحي</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{storageCounts.receipts}</p>
                <p className="text-gray-400 text-sm">إيصالات</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{storageCounts.invoices}</p>
                <p className="text-gray-400 text-sm">فواتير</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{storageCounts.receipts + storageCounts.invoices}</p>
                <p className="text-gray-400 text-sm">المجموع</p>
              </div>
            </div>
            <button onClick={() => {
              if (!confirm('هل أنت متأكد من صفير جميع الأرقام التسلسلية؟ هذا لا يحذف البيانات، فقط يعيد ترقيمها.')) return;
              const result = resetAllSerialNumbers();
              setStorageCounts({ receipts: result.receipts, invoices: result.invoices });
              notificationSystem.success('تم', `تم إعادة ترقيم ${result.receipts} إيصال و ${result.invoices} فاتورة`);
              logActivity('SERIAL_RESET', 'صفير الأرقام التسلسلية');
            }} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" /> صفير الأرقام التسلسلية
            </button>
          </div>
        </>
      )}

      {activeTab === 'backup' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Database className="w-6 h-6 text-blue-400" />نسخ احتياطي واستعادة شاملة</h3>

          {backupStats && (
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div><p className="text-blue-400 font-bold">البيانات الحالية</p><p className="text-white">{backupStats.keysCount} عنصر | {backupStats.totalSizeKB} KB</p></div>
                <div className="text-left"><p className="text-gray-400 text-sm">العناصر المخزنة</p><p className="text-white">{backupStats.itemsCount}</p></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button onClick={handleExportBackup} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> تصدير نسخة احتياطية كاملة
            </button>
            <label className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" /> استيراد واستعادة من ملف
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
            <p className="text-green-400 text-sm"><span className="font-bold">النسخة الاحتياطية تشمل:</span> جميع الأصناف، الفواتير، الإيصالات، الطلبيات، العهد، التسويات، الخزينة، الموظفين، إعدادات النظام، أسعار الذهب، أسعار الصرف، سجل النشاطات، وجميع بيانات النظام الأخرى.</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-400 text-sm"><span className="font-bold">تنبيه:</span> عند الاستيراد، سيتم استبدال جميع البيانات الحالية بالبيانات من الملف. تأكد من احتواء الملف على جميع البيانات المطلوبة قبل الاستيراد.</p>
          </div>
        </div>
      )}

      {activeTab === 'demo' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Play className="w-6 h-6 text-orange-400" />البيانات التجريبية</h3>
          {hasDemoDataSimulation() ? (<div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 mb-6"><div className="flex items-center justify-between"><div><p className="text-green-400 font-bold">البيانات التجريبية موجودة</p><p className="text-white">يوجد {getDemoDataStats().itemsCount} قطعة و {getDemoDataStats().invoicesCount} فاتورة</p></div><button onClick={handleRemoveDemoData} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Trash className="w-4 h-4" /> إزالة</button></div></div>) : (<div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-6"><p className="text-blue-400">لا توجد بيانات تجريبية</p><p className="text-gray-400 text-sm mt-1">اضغط على الزر أدناه لإضافة بيانات تجريبية للاختبار</p></div>)}
          <div className="bg-gray-700/50 rounded-xl p-6 mb-6"><h4 className="text-white font-bold mb-4">ما سيتم إضافته:</h4><ul className="text-gray-300 space-y-2"><li className="flex items-center gap-2"><Square className="w-4 h-4 text-yellow-400" /> 50 قطعة مجوهرات تجريبية</li><li className="flex items-center gap-2"><Square className="w-4 h-4 text-blue-400" /> 20 فاتورة مبيعات تجريبية</li><li className="flex items-center gap-2"><Square className="w-4 h-4 text-purple-400" /> قطع بمختلف العيارات (24، 21، 18)</li></ul></div>
          <button onClick={handleAddDemoData} disabled={hasDemoDataSimulation()} className={`w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 ${hasDemoDataSimulation() ? 'opacity-50 cursor-not-allowed' : ''}`}><Play className="w-5 h-5" /> إضافة البيانات التجريبية</button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-6"><p className="text-red-400 text-sm"><span className="font-bold">تحذير:</span> هذه البيانات للاختبار فقط.</p></div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 flex items-center justify-between sticky top-0"><h2 className="text-xl font-bold text-white">{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h2><button onClick={handleCloseModal} className="text-white"><X className="w-6 h-6" /></button></div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                <h3 className="text-purple-400 font-bold flex items-center gap-2"><Users className="w-4 h-4" />البيانات الأساسية</h3>
                <div><label className="block text-gray-400 text-sm mb-2">الاسم</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="اسم المستخدم" className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="example@email.com" className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-gray-400 text-sm mb-2">{editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء عليها)' : 'كلمة المرور'}</label><div className="relative"><Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? 'أدخل كلمة مرور جديدة' : 'كلمة المرور'} className="w-full bg-gray-700 border border-gray-600 text-white px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-gray-400 text-sm mb-2">الصلاحية</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'accountant' | 'seller' | 'data_entry' })} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="admin">مدير النظام</option><option value="accountant">محاسب</option><option value="seller">بائع</option><option value="data_entry">مدخل بيانات</option></select></div><div><label className="block text-gray-400 text-sm mb-2">كود البائع</label><input type="text" value={formData.seller_code} onChange={(e) => setFormData({ ...formData, seller_code: e.target.value })} placeholder="مثال: S001" className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /></div></div>
                {editingUser && (<div className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 accent-purple-500" /><label htmlFor="isActive" className="text-white cursor-pointer">حساب مفعل</label>{!formData.isActive && <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs mr-auto">المستخدم موقوف</span>}</div>)}
              </div>
              <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                <h3 className="text-purple-400 font-bold flex items-center gap-2"><Shield className="w-4 h-4" />الصلاحيات</h3>
                <div className="grid grid-cols-2 gap-3">{[{ key: 'canCreateInvoice', label: 'إصدار فاتورة', icon: FileText }, { key: 'canPrintInventory', label: 'طباعة المخزون', icon: Printer }, { key: 'canAddItems', label: 'إضافة القطع', icon: Plus }, { key: 'canEditItems', label: 'تعديل البيانات', icon: Edit }, { key: 'canDeleteItems', label: 'حذف القطع', icon: Trash2 }, { key: 'canManageUsers', label: 'إدارة المستخدمين', icon: Users }, { key: 'canViewReports', label: 'عرض التقارير', icon: Activity }, { key: 'canAdjustPrices', label: 'تعديل الأسعار', icon: Key }].map((perm) => (<div key={perm.key} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg"><input type="checkbox" id={perm.key} checked={formData.permissions[perm.key as keyof UserPermissions]} onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, [perm.key]: e.target.checked } })} className="w-5 h-5 accent-purple-500" /><label htmlFor={perm.key} className="text-white cursor-pointer flex items-center gap-2"><perm.icon className="w-4 h-4 text-gray-400" />{perm.label}</label></div>))}</div>
              </div>
              <div className="flex gap-3 pt-4"><button onClick={handleSaveUser} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />{editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}</button><button onClick={handleCloseModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">إلغاء</button></div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
            <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-gray-400 mb-6">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع.</p>
            <div className="flex gap-3"><button onClick={() => handleDeleteUser(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">نعم، احذف</button><button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">إلغاء</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;