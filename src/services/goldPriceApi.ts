// Gold Price API - Using MetalPriceAPI.com as provided by user
// API Key: e9721b5be44589c4beacac8703b5127d
import { updateGoldPrices, updateExchangeRate } from './settings';

const GOLD_API_KEY = 'e9721b5be44589c4beacac8703b5127d';
const METALPRICE_API_URL = `https://api.metalpriceapi.com/v1/latest?api_key=${GOLD_API_KEY}&base=USD&currencies=LYD,EUR,XAU,XAG`;

// Cache configuration
const CACHE_KEY = 'gold_prices_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface GoldPriceCache {
  prices: GoldPriceData;
  timestamp: number;
  source: 'api' | 'fallback';
}

export interface GoldPriceData {
  gold24k: number;      // Price per gram in LYD
  gold21k: number;      // Price per gram in LYD
  gold18k: number;      // Price per gram in LYD
  silver: number;       // Price per gram in LYD
  usdToLyd: number;     // Exchange rate
  goldPriceUsd: number; // Gold price per oz in USD
  updated: Date;
  source: string;
}

export interface PriceHistory {
  date: string;
  gold24k: number;
  gold21k: number;
  gold18k: number;
  silver: number;
}

// Initialize with NO fallback prices - user must enter manually or use API
const FALLBACK_PRICES: GoldPriceData = {
  gold24k: 0,
  gold21k: 0,
  gold18k: 0,
  silver: 0,
  usdToLyd: 0,
  goldPriceUsd: 0,
  updated: new Date(),
  source: 'none',
};

// Get cached prices
const getCachedPrices = (): GoldPriceCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

// Save prices to cache
const saveToCache = (prices: GoldPriceData, source: 'api' | 'fallback'): void => {
  try {
    const cache: GoldPriceCache = {
      prices,
      timestamp: Date.now(),
      source,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
};

// Fetch with timeout wrapper
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Fetch gold prices from MetalPriceAPI
export const fetchGoldPrices = async (): Promise<GoldPriceData> => {
  try {
    console.log('Fetching gold prices from MetalPriceAPI...');

    const response = await fetchWithTimeout(METALPRICE_API_URL);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('MetalPriceAPI Response:', data);

    if (!data.success) {
      throw new Error('API call was not successful');
    }

    // Extract rates from the response
    const rates = data.rates || {};

    // XAU rate from API = how many oz per 1 USD (inverted)
    // USDXAU = price of 1 oz gold in USD
    const goldPricePerOz = rates.USDXAU || (rates.XAU ? 1 / rates.XAU : 0);
    const silverPricePerOz = rates.USDXAG || (rates.XAG ? 1 / rates.XAG : 0);
    const usdToLyd = rates.LYD || 4.85; // USD to LYD exchange rate

    if (!goldPricePerOz || goldPricePerOz === 0) {
      throw new Error('Invalid gold price from API');
    }

    // Convert from per oz to per gram (1 troy oz = 31.1035g)
    const goldPricePerGramUsd = goldPricePerOz / 31.1035;
    const silverPricePerGramUsd = silverPricePerOz / 31.1035;

    // Convert to LYD
    const gold24kLyd = goldPricePerGramUsd * usdToLyd;
    const gold21kLyd = gold24kLyd * 0.875; // 21/24 = 0.875
    const gold18kLyd = gold24kLyd * 0.75;  // 18/24 = 0.75
    const silverLyd = silverPricePerGramUsd * usdToLyd;

    const prices: GoldPriceData = {
      gold24k: Math.round(gold24kLyd * 100) / 100,
      gold21k: Math.round(gold21kLyd * 100) / 100,
      gold18k: Math.round(gold18kLyd * 100) / 100,
      silver: Math.round(silverLyd * 100) / 100,
      usdToLyd: Math.round(usdToLyd * 100) / 100,
      goldPriceUsd: goldPricePerOz,
      updated: new Date(),
      source: 'metalpriceapi',
    };

    console.log('Calculated prices:', prices);
    saveToCache(prices, 'api');
    
    // Also save to system settings so Dashboard and other pages can use them
    try {
      updateGoldPrices({
        gold24k: prices.gold24k,
        gold21k: prices.gold21k,
        gold18k: prices.gold18k,
        silver: prices.silver,
      });
      // Also update exchange rate
      updateExchangeRate(prices.usdToLyd);
    } catch (e) {
      console.log('Failed to save to settings:', e);
    }
    
    return prices;

  } catch (error) {
    console.error('MetalPriceAPI Error:', error);

    // Try to get cached prices
    const cached = getCachedPrices();
    if (cached) {
      console.log('Using cached gold prices');
      return cached.prices;
    }

    // NO fallback - return empty prices
    return { ...FALLBACK_PRICES, updated: new Date() };
  }
};

// Calculate karat prices in LYD
export const calculateKaratPrices = (gold24kLyd: number, usdToLyd: number = 4.85) => {
  return {
    price24kLyd: Math.round(gold24kLyd * 100) / 100,
    price22kLyd: Math.round(gold24kLyd * 0.9167 * 100) / 100,
    price21kLyd: Math.round(gold24kLyd * 0.875 * 100) / 100,
    price18kLyd: Math.round(gold24kLyd * 0.75 * 100) / 100,
    price14kLyd: Math.round(gold24kLyd * 0.5833 * 100) / 100,
    price10kLyd: Math.round(gold24kLyd * 0.4167 * 100) / 100,
  };
};

// Get real historical data from localStorage (accumulated over time)
export const getPriceHistory = (days: number = 30): PriceHistory[] => {
  const historyKey = 'gold_price_history';
  try {
    const stored = localStorage.getItem(historyKey);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.history && Array.isArray(data.history)) {
        return data.history.slice(-days);
      }
    }
  } catch {
    // Ignore errors
  }
  return [];
};

// Save current price to history (call this when fetching prices)
export const savePriceToHistory = (prices: GoldPriceData): void => {
  if (prices.gold24k <= 0) return;
  
  const historyKey = 'gold_price_history';
  const today = new Date().toLocaleDateString('en-CA');
  
  try {
    const stored = localStorage.getItem(historyKey);
    let data = { history: [] as PriceHistory[], timestamp: Date.now() };
    
    if (stored) {
      data = JSON.parse(stored);
    }
    
    // Check if today's entry already exists
    const existingIndex = data.history.findIndex((h: PriceHistory) => h.date === today);
    
    const entry: PriceHistory = {
      date: today,
      gold24k: prices.gold24k,
      gold21k: prices.gold21k,
      gold18k: prices.gold18k,
      silver: prices.silver,
    };
    
    if (existingIndex >= 0) {
      data.history[existingIndex] = entry;
    } else {
      data.history.push(entry);
    }
    
    data.timestamp = Date.now();
    localStorage.setItem(historyKey, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
};

// Price change analysis (real data only)
export const analyzePriceChange = (current: number, previous: number) => {
  if (previous === 0) return { change: '0', percentage: '0', direction: 'up', isPositive: true };
  const change = current - previous;
  const percentage = ((change / previous) * 100).toFixed(2);
  const direction = change >= 0 ? 'up' : 'down';

  return {
    change: Math.abs(change).toFixed(2),
    percentage: Math.abs(parseFloat(percentage)).toFixed(2),
    direction,
    isPositive: change >= 0,
  };
};

// Get market insights based on current prices (real data only)
export const getMarketInsights = (prices: GoldPriceData) => {
  const insights = [];
  const pricePerOz = prices.goldPriceUsd;

  // Gold price level analysis - based on real market data
  if (pricePerOz > 3500) {
    insights.push({
      type: 'warning',
      text: 'الذهب عند مستويات مرتفعة جداً عالمياً',
      icon: '⚠️'
    });
  } else if (pricePerOz > 3000) {
    insights.push({
      type: 'info',
      text: 'الذهب عند مستويات عالية عالمياً',
      icon: '📊'
    });
  } else if (pricePerOz > 0 && pricePerOz < 2500) {
    insights.push({
      type: 'opportunity',
      text: 'الذهب عند مستويات دعم جيدة عالمياً',
      icon: '💡'
    });
  }

  // Gold/Silver ratio analysis - based on real data
  if (prices.silver > 0 && prices.gold24k > 0) {
    const goldSilverRatio = prices.gold24k / prices.silver;
    if (goldSilverRatio > 85) {
      insights.push({
        type: 'info',
        text: `نسبة الذهب/الفضة مرتفعة (${goldSilverRatio.toFixed(1)})`,
        icon: '📈'
      });
    } else if (goldSilverRatio < 70) {
      insights.push({
        type: 'opportunity',
        text: `نسبة الذهب/الفضة منخفضة - الفضة قد ترتفع (${goldSilverRatio.toFixed(1)})`,
        icon: '💎'
      });
    }
  }

  return insights;
};

// Update dashboard prices based on real API only
export const updateDashboardPrices = async (
  setGoldPrices: (prices: GoldPriceData) => void,
  setLastUpdate: (date: Date) => void,
  setMarketAnalysis: (analysis: any) => void,
  setPrediction: (prediction: any) => void
) => {
  try {
    const prices = await fetchGoldPrices();
    setGoldPrices(prices);
    setLastUpdate(new Date());
    
    // Save to history for future reference
    savePriceToHistory(prices);

    // Get real insights (no fake analysis)
    const insights = getMarketInsights(prices);
    setMarketAnalysis({
      sentiment: 'neutral',
      score: 0,
      trend: '0',
      recommendation: insights.length > 0 ? insights[0].text : 'الأسعار مستقرة - لا توجد توقعات وهمية',
    });

    // No fake predictions - just show current price
    setPrediction({
      tomorrow: 0,
      nextWeek: 0,
      confidence: 'none',
    });
  } catch (error) {
    console.error('Failed to update dashboard prices:', error);
  }
};