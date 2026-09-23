// Comprehensive Backup and Restore Service
// Captures ALL localStorage data across the entire system

export interface FullBackupData {
  version: string;
  timestamp: string;
  appVersion: string;
  localStorage: Record<string, string>;
}

const BACKUP_VERSION = '2.0.0';

// Get every single key from localStorage
export const getAllLocalStorageData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    }
  }
  return data;
};

// Get backup stats
export const getBackupStats = (data: Record<string, string>) => {
  const keys = Object.keys(data);
  let totalSize = 0;
  let itemsCount = 0;

  keys.forEach(key => {
    const val = data[key];
    totalSize += key.length + val.length;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) itemsCount += parsed.length;
    } catch {}
  });

  return {
    keysCount: keys.length,
    totalSizeKB: Math.round(totalSize / 1024),
    itemsCount,
  };
};

// Create full backup and download as file
export const exportFullBackup = (): void => {
  const allData = getAllLocalStorageData();
  const backup: FullBackupData = {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    appVersion: '2.0',
    localStorage: allData,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  a.download = `hamrouni_full_backup_${date}_${time}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import full backup from file and restore ALL data
export const importFullBackup = (file: File): Promise<{ success: boolean; keysCount: number; message: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup: FullBackupData = JSON.parse(e.target?.result as string);

        if (!backup.localStorage || typeof backup.localStorage !== 'object') {
          resolve({ success: false, keysCount: 0, message: 'ملف النسخة الاحتياطية غير صالح' });
          return;
        }

        // Restore every key
        let count = 0;
        Object.entries(backup.localStorage).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, value);
            count++;
          } catch {}
        });

        resolve({
          success: true,
          keysCount: count,
          message: `تم استعادة ${count} عنصر بنجاح من نسخة ${backup.timestamp || 'غير معروفة'}`,
        });
      } catch {
        resolve({ success: false, keysCount: 0, message: 'فشل في قراءة الملف - تأكد من صحته' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, keysCount: 0, message: 'فشل في قراءة الملف' });
    };
    reader.readAsText(file);
  });
};

// Clear ALL localStorage data (for fresh restore)
export const clearAllData = (): void => {
  localStorage.clear();
};

// Download empty template for manual restore
export const downloadEmptyTemplate = (): void => {
  const backup: FullBackupData = {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    appVersion: '2.0',
    localStorage: {},
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hamrouni_backup_template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
