import { getReceipts, getInvoices } from "./goldOrdersStorage";
import { getSystemSettings, getArchivedInvoices } from "./settings";

const BACKUP_KEY = 'auto_backup_data';
const BACKUP_TIME_KEY = 'auto_backup_last_time';

export const createAutoBackup = (): void => {
  try {
    const data = {
      receipts: getReceipts(),
      invoices: getInvoices(),
      archived: getArchivedInvoices(),
      system_settings: getSystemSettings(),
      gold_prices: localStorage.getItem('gold_prices_cache'),
      exchange_rate: localStorage.getItem('exchange_rate_data'),
      price_bulletin: localStorage.getItem('price_bulletin_data'),
      orders: localStorage.getItem('order_data'),
      saved_invoices: localStorage.getItem('saved_invoices'),
      treasury_accounts: localStorage.getItem('treasury_accounts'),
      treasury_journal: localStorage.getItem('treasury_journal'),
      daily_closings: localStorage.getItem('daily_closings'),
      backup_time: new Date().toISOString(),
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    localStorage.setItem(BACKUP_KEY, jsonStr);
    localStorage.setItem(BACKUP_TIME_KEY, new Date().toISOString());
    
    console.log('Auto backup created:', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('Auto backup failed:', error);
  }
};

export const restoreAutoBackup = (): boolean => {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) return false;

    const backup = JSON.parse(backupStr);

    const isEmpty = (val: any) => val === null || val === undefined || val === '' || 
      (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0);

    if (backup.receipts && (isEmpty(localStorage.getItem('gold_receipts')) || !localStorage.getItem('gold_receipts'))) {
      localStorage.setItem('gold_receipts', JSON.stringify(backup.receipts));
    }
    if (backup.invoices && (isEmpty(localStorage.getItem('gold_invoices')) || !localStorage.getItem('gold_invoices'))) {
      localStorage.setItem('gold_invoices', JSON.stringify(backup.invoices));
    }
    if (backup.archived && (isEmpty(localStorage.getItem('archived_invoices')) || !localStorage.getItem('archived_invoices'))) {
      localStorage.setItem('archived_invoices', JSON.stringify(backup.archived));
    }
    if (backup.system_settings && (isEmpty(localStorage.getItem('system_settings')) || !localStorage.getItem('system_settings'))) {
      localStorage.setItem('system_settings', JSON.stringify(backup.system_settings));
    }
    if (backup.gold_prices && (isEmpty(localStorage.getItem('gold_prices_cache')) || !localStorage.getItem('gold_prices_cache'))) {
      localStorage.setItem('gold_prices_cache', backup.gold_prices);
    }
    if (backup.exchange_rate && (isEmpty(localStorage.getItem('exchange_rate_data')) || !localStorage.getItem('exchange_rate_data'))) {
      localStorage.setItem('exchange_rate_data', backup.exchange_rate);
    }
    if (backup.price_bulletin && (isEmpty(localStorage.getItem('price_bulletin_data')) || !localStorage.getItem('price_bulletin_data'))) {
      localStorage.setItem('price_bulletin_data', backup.price_bulletin);
    }
    if (backup.orders && (isEmpty(localStorage.getItem('order_data')) || !localStorage.getItem('order_data'))) {
      localStorage.setItem('order_data', JSON.stringify(backup.orders));
    }

    console.log('Auto backup restored from:', backup.backup_time);
    return true;
  } catch (error) {
    console.error('Auto backup restore failed:', error);
    return false;
  }
};

export const getBackupData = (): string | null => {
  return localStorage.getItem(BACKUP_KEY);
};

export const getBackupTime = (): string | null => {
  return localStorage.getItem(BACKUP_TIME_KEY);
};

export const downloadBackup = (): void => {
  const data = getBackupData();
  if (!data) return;
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
