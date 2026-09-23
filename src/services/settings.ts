// System Settings Service - Stores system configuration including gold prices and exchange rates
import { authApi } from './supabase';
import { supabase, isSupabaseAvailable } from './supabase';

export interface GoldPricesSettings {
  gold24k: number;      // Price per gram in LYD
  gold22k: number;
  gold21k: number;
  gold18k: number;
  silver: number;
  lastUpdated: string;
  isCustom: boolean;   // If true, uses manually set prices
}

export interface ExchangeRateSettings {
  usdToLyd: number;      // USD to LYD official rate
  parallelUsd: number;   // USD parallel market price in LYD
  lastUpdated: string;
  isCustom: boolean;
}

export interface DeliveryAlertSettings {
  enabled: boolean;
  daysBeforeDelivery: number;
  phoneNumbers: string[];
}

export interface SystemSettings {
  goldPrices: GoldPricesSettings;
  exchangeRate: ExchangeRateSettings;
  deliveryAlerts: DeliveryAlertSettings;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeDescription?: string;
  managerName?: string;
  taxRate: number;      // Tax percentage
  currency: string;     // LYD, USD, etc.
}

const SETTINGS_KEY = 'system_settings';

// Default settings - NO hardcoded demo prices
const DEFAULT_SETTINGS: SystemSettings = {
  goldPrices: {
    gold24k: 0,      // No demo price - must be entered manually
    gold22k: 0,
    gold21k: 0,
    gold18k: 0,
    silver: 0,
    lastUpdated: new Date().toISOString(),
    isCustom: false,
  },
  exchangeRate: {
    usdToLyd: 0,      // No demo rate - must be entered manually
    parallelUsd: 0,   // Parallel market rate - must be entered manually
    lastUpdated: new Date().toISOString(),
    isCustom: false,
  },
  deliveryAlerts: {
    enabled: true,
    daysBeforeDelivery: 20,
    phoneNumbers: ['+218912133218', '+218913157496'],
  },
  storeName: 'مجوهرات الحمروني',
  storePhone: '218XXXXXXXXX',
  storeAddress: 'ليبيا',
  taxRate: 0,
  currency: 'LYD',
};

// Get system settings (reads from localStorage - must call loadSettingsFromSupabase first)
export const getSystemSettings = (): SystemSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading system settings:', error);
  }
  return DEFAULT_SETTINGS;
};

// Load settings from Supabase and save to localStorage
export const loadSettingsFromSupabase = async (): Promise<SystemSettings> => {
  if (isSupabaseAvailable() && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single();

      if (!error && data?.value) {
        const remoteSettings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(remoteSettings));
        return remoteSettings;
      }
    } catch (e) {
      console.log('Could not load settings from Supabase:', e);
    }
  }
  return getSystemSettings();
};

// Save system settings
export const saveSystemSettings = (settings: Partial<SystemSettings>): boolean => {
  try {
    const current = getSystemSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Also save to Supabase for other devices (fire and forget)
    syncSettingsToSupabase(updated).catch(() => {});

    return true;
  } catch (error) {
    console.error('Error saving system settings:', error);
    return false;
  }
};

// Sync settings to Supabase
const syncSettingsToSupabase = async (settings: SystemSettings): Promise<void> => {
  if (isSupabaseAvailable() && supabase) {
    try {
      await supabase.from('system_settings').upsert({
        key: SETTINGS_KEY,
        value: JSON.stringify(settings),
      }, { onConflict: 'key' });
    } catch (e) {
      console.log('Supabase error syncing settings');
    }
  }
};

// Update gold prices
export const updateGoldPrices = (prices: Partial<GoldPricesSettings>): boolean => {
  try {
    const current = getSystemSettings();
    const updatedPrices: GoldPricesSettings = {
      ...current.goldPrices,
      ...prices,
      lastUpdated: new Date().toISOString(),
      isCustom: true, // Mark as custom since admin manually set it
    };
    const saved = saveSystemSettings({ goldPrices: updatedPrices });
    if (saved) {
      // Update all inventory item prices based on new gold prices
      recalculateItemPrices(updatedPrices).catch(() => {});
    }
    return saved;
  } catch (error) {
    console.error('Error updating gold prices:', error);
    return false;
  }
};

// Recalculate all item prices based on new gold prices
const recalculateItemPrices = async (goldPrices: GoldPricesSettings): Promise<void> => {
  try {
    const response = await fetch('/api/items');
    const result = await response.json();
    if (!result.success || !result.data) return;

    const items = result.data;
    let hasChanges = false;

    const updatedItems = items.map((item: any) => {
      const karat = item.karat || '21';
      let pricePerGram = 0;
      if (karat === '24') pricePerGram = goldPrices.gold24k;
      else if (karat === '21') pricePerGram = goldPrices.gold21k;
      else if (karat === '18') pricePerGram = goldPrices.gold18k;
      else if (karat === 'silver') pricePerGram = goldPrices.silver;

      if (pricePerGram > 0 && item.weight > 0) {
        const newPrice = item.weight * pricePerGram;
        if (Math.abs(newPrice - item.price) > 0.01) {
          hasChanges = true;
          return { ...item, price: newPrice, price_per_gram: pricePerGram };
        }
      }
      return item;
    });

    if (hasChanges) {
      await fetch('/api/items/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
    }
  } catch (e) {
    console.error('Error recalculating item prices:', e);
  }
};

// Get gold prices (returns custom if set, otherwise null to use API)
export const getCustomGoldPrices = (): GoldPricesSettings | null => {
  const settings = getSystemSettings();
  if (settings.goldPrices.isCustom) {
    return settings.goldPrices;
  }
  return null;
};

// Reset to API prices - actually fetches from MetalPriceAPI
export const resetToApiPrices = async (): Promise<boolean> => {
  try {
    const { fetchGoldPrices } = await import('./goldPriceApi');
    const prices = await fetchGoldPrices();
    if (prices && prices.gold24k > 0) {
      return updateGoldPrices({
        gold24k: prices.gold24k,
        gold21k: prices.gold21k,
        gold18k: prices.gold18k,
        silver: prices.silver,
      });
    }
    return false;
  } catch (error) {
    console.error('Error fetching from API:', error);
    return false;
  }
};

// Check if user is admin
export const isAdmin = (): boolean => {
  const user = authApi.getCurrentUser();
  return user?.role === 'admin';
};

// API for gold prices - checks custom prices first
export const getGoldPrices = async (): Promise<GoldPricesSettings> => {
  const custom = getCustomGoldPrices();
  if (custom) {
    return custom;
  }
  return DEFAULT_SETTINGS.goldPrices;
};

// Update exchange rate
export const updateExchangeRate = (rate: number): boolean => {
  try {
    const current = getSystemSettings();
    const updatedRate: ExchangeRateSettings = {
      ...current.exchangeRate,
      usdToLyd: rate,
      lastUpdated: new Date().toISOString(),
      isCustom: true,
    };
    return saveSystemSettings({ exchangeRate: updatedRate });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return false;
  }
};

// Get exchange rate
export const getExchangeRate = (): number => {
  const settings = getSystemSettings();
  return settings.exchangeRate.usdToLyd;
};

// Update parallel market USD price
export const updateParallelUsd = (price: number): boolean => {
  try {
    const current = getSystemSettings();
    const updatedRate: ExchangeRateSettings = {
      ...current.exchangeRate,
      parallelUsd: price,
      lastUpdated: new Date().toISOString(),
      isCustom: true,
    };
    return saveSystemSettings({ exchangeRate: updatedRate });
  } catch (error) {
    console.error('Error updating parallel USD price:', error);
    return false;
  }
};

export const updateDeliveryAlerts = (alerts: Partial<DeliveryAlertSettings>): boolean => {
  try {
    const current = getSystemSettings();
    const updatedAlerts: DeliveryAlertSettings = {
      ...current.deliveryAlerts,
      ...alerts,
    };
    return saveSystemSettings({ deliveryAlerts: updatedAlerts });
  } catch (error) {
    console.error('Error updating delivery alerts:', error);
    return false;
  }
};

// Reset exchange rate to default
export const resetExchangeRate = (): boolean => {
  try {
    const current = getSystemSettings();
    const updatedRate: ExchangeRateSettings = {
      ...DEFAULT_SETTINGS.exchangeRate,
      lastUpdated: new Date().toISOString(),
      isCustom: false,
    };
    return saveSystemSettings({ exchangeRate: updatedRate });
  } catch (error) {
    console.error('Error resetting exchange rate:', error);
    return false;
  }
};

// ======== Invoice Archive System ========
const ARCHIVE_KEY = 'archived_invoices';

export interface ArchivedInvoice {
  invoice_number: string;
  customer_name: string;
  seller_name: string;
  total_amount: number;
  items: any[];
  created_at: string;
  archived_at: string;
}

// Get all archived invoices
export const getArchivedInvoices = (): ArchivedInvoice[] => {
  try {
    const data = localStorage.getItem(ARCHIVE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Archive an invoice (move from gold_invoices to archived_invoices)
export const archiveInvoice = (invoiceNumber: string): boolean => {
  try {
    const allInvoices = JSON.parse(localStorage.getItem('gold_invoices') || '[]');
    const invoiceIndex = allInvoices.findIndex((inv: any) => inv.invoice_number === invoiceNumber);
    if (invoiceIndex === -1) return false;

    const invoice = allInvoices[invoiceIndex];
    const archived: ArchivedInvoice = {
      ...invoice,
      archived_at: new Date().toISOString(),
    };

    const archivedInvoices = getArchivedInvoices();
    archivedInvoices.push(archived);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedInvoices));

    allInvoices.splice(invoiceIndex, 1);
    localStorage.setItem('gold_invoices', JSON.stringify(allInvoices));

    return true;
  } catch {
    return false;
  }
};

// Restore an archived invoice
export const restoreInvoice = (invoiceNumber: string): boolean => {
  try {
    const archivedInvoices = getArchivedInvoices();
    const index = archivedInvoices.findIndex(inv => inv.invoice_number === invoiceNumber);
    if (index === -1) return false;

    const invoice = archivedInvoices[index];
    const allInvoices = JSON.parse(localStorage.getItem('gold_invoices') || '[]');
    const { archived_at, ...rest } = invoice;
    allInvoices.push(rest);
    localStorage.setItem('gold_invoices', JSON.stringify(allInvoices));

    archivedInvoices.splice(index, 1);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedInvoices));

    return true;
  } catch {
    return false;
  }
};

// Delete an archived invoice permanently
export const deleteArchivedInvoice = (invoiceNumber: string): boolean => {
  try {
    const archivedInvoices = getArchivedInvoices();
    const filtered = archivedInvoices.filter(inv => inv.invoice_number !== invoiceNumber);
    if (filtered.length === archivedInvoices.length) return false;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

// Get archive statistics
export const getArchiveStats = () => {
  const archived = getArchivedInvoices();
  return {
    count: archived.length,
    totalValue: archived.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
  };
};

// Batch archive multiple invoices
export const batchArchiveInvoices = (invoiceNumbers: string[]): number => {
  const allInvoices = JSON.parse(localStorage.getItem('gold_invoices') || '[]');
  const archivedInvoices = getArchivedInvoices();
  let count = 0;

  for (const invoiceNumber of invoiceNumbers) {
    const index = allInvoices.findIndex((inv: any) => inv.invoice_number === invoiceNumber);
    if (index === -1) continue;
    const invoice = allInvoices[index];
    archivedInvoices.push({ ...invoice, archived_at: new Date().toISOString() });
    allInvoices.splice(index, 1);
    count++;
  }

  localStorage.setItem('gold_invoices', JSON.stringify(allInvoices));
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedInvoices));
  return count;
};

// Batch delete multiple invoices
export const batchDeleteInvoices = (ids: string[]): number => {
  const invoices = JSON.parse(localStorage.getItem('gold_invoices') || '[]');
  const filtered = invoices.filter((inv: any) => !ids.includes(inv.id));
  const deleted = invoices.length - filtered.length;
  localStorage.setItem('gold_invoices', JSON.stringify(filtered));
  return deleted;
};

