// System Settings Service - Stores system configuration including gold prices and exchange rates
import { authApi } from './supabase';

export interface GoldPricesSettings {
  gold24k: number;      // Price per gram in LYD
  gold21k: number;
  gold18k: number;
  silver: number;
  lastUpdated: string;
  isCustom: boolean;   // If true, uses manually set prices
}

export interface ExchangeRateSettings {
  usdToLyd: number;      // USD to LYD exchange rate
  lastUpdated: string;
  isCustom: boolean;
}

export interface SystemSettings {
  goldPrices: GoldPricesSettings;
  exchangeRate: ExchangeRateSettings;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  taxRate: number;      // Tax percentage
  currency: string;     // LYD, USD, etc.
}

const SETTINGS_KEY = 'system_settings';

// Default settings - NO hardcoded demo prices
const DEFAULT_SETTINGS: SystemSettings = {
  goldPrices: {
    gold24k: 0,      // No demo price - must be entered manually
    gold21k: 0,
    gold18k: 0,
    silver: 0,
    lastUpdated: new Date().toISOString(),
    isCustom: false,
  },
  exchangeRate: {
    usdToLyd: 0,      // No demo rate - must be entered manually
    lastUpdated: new Date().toISOString(),
    isCustom: false,
  },
  storeName: 'مجوهرات الحمروني',
  storePhone: '218XXXXXXXXX',
  storeAddress: 'ليبيا',
  taxRate: 0,
  currency: 'LYD',
};

// Get system settings
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

// Save system settings
export const saveSystemSettings = (settings: Partial<SystemSettings>): boolean => {
  try {
    const current = getSystemSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving system settings:', error);
    return false;
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
    return saveSystemSettings({ goldPrices: updatedPrices });
  } catch (error) {
    console.error('Error updating gold prices:', error);
    return false;
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

// Reset to API prices
export const resetToApiPrices = (): boolean => {
  try {
    const current = getSystemSettings();
    const updatedPrices: GoldPricesSettings = {
      ...DEFAULT_SETTINGS.goldPrices,
      lastUpdated: new Date().toISOString(),
      isCustom: false,
    };
    return saveSystemSettings({ goldPrices: updatedPrices });
  } catch (error) {
    console.error('Error resetting gold prices:', error);
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

