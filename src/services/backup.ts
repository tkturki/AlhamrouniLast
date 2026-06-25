// Backup and Restore Service - Manages system data backup and restore
import { logActivity, notificationSystem } from './supabase';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    items: any[];
    invoices: any[];
    users: any[];
    settings: any;
    treasury: any;
    suppliers: any[];
    orders: any[];
    activityLogs: any[];
  };
}

// Keys for localStorage data
const DATA_KEYS = {
  items: 'jewelry_items',
  invoices: 'invoices',
  users: 'users',
  settings: 'system_settings',
  treasury: 'treasury',
  suppliers: 'suppliers',
  orders: 'orders',
  activityLogs: 'activity_logs',
};

const BACKUP_KEY = 'system_backup';
const AUTO_BACKUP_KEY = 'auto_backup_enabled';
const BACKUP_VERSION = '1.0.0';

// Get all data for backup
export const getAllSystemData = (): BackupData['data'] => {
  return {
    items: JSON.parse(localStorage.getItem(DATA_KEYS.items) || '[]'),
    invoices: JSON.parse(localStorage.getItem(DATA_KEYS.invoices) || '[]'),
    users: JSON.parse(localStorage.getItem(DATA_KEYS.users) || '[]'),
    settings: JSON.parse(localStorage.getItem(DATA_KEYS.settings) || '{}'),
    treasury: JSON.parse(localStorage.getItem(DATA_KEYS.treasury) || '{}'),
    suppliers: JSON.parse(localStorage.getItem(DATA_KEYS.suppliers) || '[]'),
    orders: JSON.parse(localStorage.getItem(DATA_KEYS.orders) || '[]'),
    activityLogs: JSON.parse(localStorage.getItem(DATA_KEYS.activityLogs) || '[]'),
  };
};

// Create backup
export const createBackup = (): boolean => {
  try {
    const backup: BackupData = {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      data: getAllSystemData(),
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

    // Also save to backup history (keep last 10)
    const history = getBackupHistory();
    history.unshift({
      timestamp: backup.timestamp,
      size: JSON.stringify(backup).length,
    });
    localStorage.setItem('backup_history', JSON.stringify(history.slice(0, 10)));

    logActivity('BACKUP', 'نسخ احتياطي يدوي');
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
};

// Get backup history
export const getBackupHistory = (): Array<{timestamp: string; size: number}> => {
  try {
    const history = localStorage.getItem('backup_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

// Restore from backup
export const restoreFromBackup = (confirm: boolean = false): boolean => {
  if (!confirm) {
    return false;
  }

  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) {
      notificationSystem.error('خطأ', 'لا يوجد نسخ احتياطي للحذف');
      return false;
    }

    const backup: BackupData = JSON.parse(backupStr);

    // Restore all data
    localStorage.setItem(DATA_KEYS.items, JSON.stringify(backup.data.items));
    localStorage.setItem(DATA_KEYS.invoices, JSON.stringify(backup.data.invoices));
    localStorage.setItem(DATA_KEYS.users, JSON.stringify(backup.data.users));
    localStorage.setItem(DATA_KEYS.settings, JSON.stringify(backup.data.settings));
    localStorage.setItem(DATA_KEYS.treasury, JSON.stringify(backup.data.treasury));
    localStorage.setItem(DATA_KEYS.suppliers, JSON.stringify(backup.data.suppliers));
    localStorage.setItem(DATA_KEYS.orders, JSON.stringify(backup.data.orders));
    localStorage.setItem(DATA_KEYS.activityLogs, JSON.stringify(backup.data.activityLogs));

    logActivity('RESTORE', `استعادة من نسخ احتياطي: ${backup.timestamp}`);
    notificationSystem.success('تم الاستعادة', 'تم استعادة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    notificationSystem.error('خطأ', 'فشل في استعادة البيانات');
    return false;
  }
};

// Auto backup on logout
export const autoBackup = (): void => {
  const autoBackupEnabled = localStorage.getItem(AUTO_BACKUP_KEY);
  if (autoBackupEnabled !== 'false') { // Default is true
    createBackup();
  }
};

// Set auto backup preference
export const setAutoBackup = (enabled: boolean): void => {
  localStorage.setItem(AUTO_BACKUP_KEY, enabled ? 'true' : 'false');
};

// Get auto backup status
export const isAutoBackupEnabled = (): boolean => {
  const status = localStorage.getItem(AUTO_BACKUP_KEY);
  return status !== 'false'; // Default is true
};

// Export backup to file (download)
export const exportBackupToFile = (): void => {
  const backup = {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    data: getAllSystemData(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alhumroni_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logActivity('EXPORT', 'تصدير نسخ احتياطي');
};

// Import backup from file
export const importBackupFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup: BackupData = JSON.parse(e.target?.result as string);

        // Validate backup structure
        if (!backup.version || !backup.data) {
          notificationSystem.error('خطأ', 'ملف النسخ الاحتياطي غير صالح');
          resolve(false);
          return;
        }

        // Save as current backup
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

        notificationSystem.success('تم الاستيراد', 'تم استيراد النسخ الاحتياطي. اضغط استعادة لتطبيقه.');
        logActivity('IMPORT', `استيراد نسخ احتياطي: ${backup.timestamp}`);
        resolve(true);
      } catch (error) {
        notificationSystem.error('خطأ', 'فشل في قراءة الملف');
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

// Get backup info
export const getBackupInfo = (): { timestamp: string; size: number } | null => {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) return null;

    const backup: BackupData = JSON.parse(backupStr);
    return {
      timestamp: backup.timestamp,
      size: new Blob([backupStr]).size,
    };
  } catch {
    return null;
  }
};