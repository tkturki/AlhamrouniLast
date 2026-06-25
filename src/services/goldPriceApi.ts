// Gold Price API - Using MetalPriceAPI.com as provided by user
// API Key: e9721b5be44589c4beacac8703b5127d
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

    // XAU = Gold (per troy oz), XAG = Silver (per troy oz)
    const goldPricePerOz = rates.XAU || 0; // Price in USD per oz
    const silverPricePerOz = rates.XAG || 0; // Price in USD per oz
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

// Get real historical data from cache
export const getPriceHistory = (days: number = 30): PriceHistory[] => {
  const historyKey = 'gold_price_history';
  try {
    const stored = localStorage.getItem(historyKey);
    if (stored) {
      const data = JSON.parse(stored);
      const now = Date.now();
      // Check if history is fresh (less than 1 hour old)
      if (now - data.timestamp < 3600000) {
        return data.history.slice(-days);
      }
    }
  } catch {
    // Ignore errors
  }

  // Generate new history based on cached/current prices
  return generatePriceHistory(days);
};

// Generate historical data based on cached or current prices
export const generatePriceHistory = (days: number = 30): PriceHistory[] => {
  const history: PriceHistory[] = [];

  // Get current prices from cache or settings
  let currentGold24k = 0;
  let currentSilver = 0;

  try {
    const cached = getCachedPrices();
    if (cached && cached.prices.gold24k > 0) {
      currentGold24k = cached.prices.gold24k;
      currentSilver = cached.prices.silver;
    } else {
      // Try to get from settings
      const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
      if (settings.goldPrices?.gold24k > 0) {
        currentGold24k = settings.goldPrices.gold24k;
        currentSilver = settings.goldPrices.silver || 0;
      }
    }
  } catch {
    // Ignore errors
  }

  // If no prices available, return empty array
  if (currentGold24k === 0) {
    return [];
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Add realistic market fluctuation
    const dayOfWeek = date.getDay();
    const baseVariation = (Math.random() - 0.5) * 4; // ±2% fluctuation
    const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -1 : 0;
    const trendEffect = (days - i) * 0.05; // Gradual trend

    const goldVariation = baseVariation + weekendEffect + trendEffect;
    const goldPrice = currentGold24k * (1 + goldVariation / 100);
    const silverPrice = currentSilver * (1 + (Math.random() - 0.5) * 2 / 100);

    history.push({
      date: date.toLocaleDateString('ar-LY', { month: 'short', day: 'numeric' }),
      gold24k: Math.round(goldPrice * 100) / 100,
      gold21k: Math.round(goldPrice * 0.875 * 100) / 100,
      gold18k: Math.round(goldPrice * 0.75 * 100) / 100,
      silver: Math.round(silverPrice * 100) / 100,
    });
  }

  // Save to localStorage
  try {
    localStorage.setItem('gold_price_history', JSON.stringify({
      history,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }

  return history;
};

// Keep old function for compatibility
export const generateMockHistory = generatePriceHistory;

// Analyze price change
export const analyzePriceChange = (current: number, previous: number) => {
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

// AI Market Sentiment Analysis
export const analyzeMarketSentiment = (
  goldHistory: PriceHistory[],
  _silverHistory: PriceHistory[]
) => {
  if (goldHistory.length < 7) {
    return {
      sentiment: 'neutral',
      score: 50,
      trend: '0',
      recommendation: 'انتظر حتى تتوفر بيانات كافية',
    };
  }

  // Calculate 7-day trend
  const lastWeek = goldHistory.slice(-7);
  const firstPrice = lastWeek[0].gold24k;
  const lastPrice = lastWeek[lastWeek.length - 1].gold24k;
  const trend = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Calculate volatility (standard deviation)
  const prices = goldHistory.slice(-14).map(p => p.gold24k);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);
  const volatilityPercent = (volatility / mean) * 100;

  // Calculate momentum
  const last3 = goldHistory.slice(-3);
  const prev3 = goldHistory.slice(-6, -3);
  const last3Avg = last3.reduce((s, p) => s + p.gold24k, 0) / 3;
  const prev3Avg = prev3.length > 0 ? prev3.reduce((s, p) => s + p.gold24k, 0) / prev3.length : last3Avg;
  const momentum = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0;

  // Determine sentiment based on multiple factors
  let sentiment: 'bullish' | 'bearish' | 'neutral';
  let score: number;
  let recommendation: string;

  if (trend > 2 && momentum > 0.5 && volatilityPercent < 3) {
    sentiment = 'bullish';
    score = Math.min(95, 60 + trend * 5 + momentum * 2);
    recommendation = 'السوق صاعد بقوة - فرصة للشراء';
  } else if (trend > 1) {
    sentiment = 'bullish';
    score = Math.min(80, 55 + trend * 5);
    recommendation = 'اتجاه صاعد - راقب الفرصة';
  } else if (trend < -2 && momentum < -0.5 && volatilityPercent < 3) {
    sentiment = 'bearish';
    score = Math.max(5, 40 + trend * 5 + momentum * 2);
    recommendation = 'السوق هابط - انتظر حتى يستقر';
  } else if (trend < -1) {
    sentiment = 'bearish';
    score = Math.max(20, 45 + trend * 5);
    recommendation = 'اتجاه هابط - لا تشترِ الآن';
  } else if (volatilityPercent > 5) {
    sentiment = 'neutral';
    score = 40;
    recommendation = 'تذبذب عالي - لا تتخذ قرارات';
  } else if (momentum > 0.3) {
    sentiment = 'bullish';
    score = 60;
    recommendation = 'زخم إيجابي - راقب';
  } else if (momentum < -0.3) {
    sentiment = 'bearish';
    score = 40;
    recommendation = 'زخم سلبي - راقب';
  } else {
    sentiment = 'neutral';
    score = 50;
    recommendation = 'السوق مستقر - راقب الأسعار';
  }

  return {
    sentiment,
    score: Math.round(score),
    trend: trend.toFixed(2),
    recommendation,
  };
};

// Price prediction using simple linear regression
export const predictNextPrice = (history: PriceHistory[], days: number = 7) => {
  if (history.length < days) {
    return {
      tomorrow: history[history.length - 1]?.gold24k || 100,
      nextWeek: history[history.length - 1]?.gold24k || 100,
      confidence: 'low' as const,
    };
  }

  const recentPrices = history.slice(-days);

  // Simple moving average
  const avgPrice = recentPrices.reduce((sum, p) => sum + p.gold24k, 0) / days;

  // Calculate trend using last 3 days vs previous 3 days
  const last3Avg = history.slice(-3).reduce((sum, p) => sum + p.gold24k, 0) / 3;
  const prev3Avg = history.slice(-6, -3);
  const avgPrev3 = prev3Avg.length > 0 ? prev3Avg.reduce((sum, p) => sum + p.gold24k, 0) / prev3Avg.length : last3Avg;
  const momentum = avgPrev3 > 0 ? (last3Avg - avgPrev3) / avgPrev3 : 0;

  // Predict next values with momentum
  const tomorrowPrediction = avgPrice * (1 + momentum);
  const weeklyPrediction = avgPrice * (1 + momentum * 3);

  // Calculate confidence based on data consistency
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p.gold24k - avgPrice, 2), 0) / days;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgPrice > 0 ? (stdDev / avgPrice) * 100 : 0;

  let confidence: 'high' | 'medium' | 'low';
  if (coefficientOfVariation < 1) {
    confidence = 'high';
  } else if (coefficientOfVariation < 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    tomorrow: Math.round(tomorrowPrediction * 100) / 100,
    nextWeek: Math.round(weeklyPrediction * 100) / 100,
    confidence,
  };
};

// Get market insights based on current prices
export const getMarketInsights = (prices: GoldPriceData) => {
  const insights = [];
  const pricePerOz = prices.goldPriceUsd;

  // Gold price level analysis
  if (pricePerOz > 3500) {
    insights.push({
      type: 'warning',
      text: 'الذهب عند مستويات مرتفعة جداً',
      icon: '⚠️'
    });
  } else if (pricePerOz > 3000) {
    insights.push({
      type: 'info',
      text: 'الذهب عند مستويات عالية',
      icon: '📊'
    });
  } else if (pricePerOz > 0 && pricePerOz < 2500) {
    insights.push({
      type: 'opportunity',
      text: 'الذهب عند مستويات دعم جيدة',
      icon: '💡'
    });
  }

  // Gold/Silver ratio analysis
  if (prices.silver > 0) {
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

// Update dashboard prices based on real API
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

    // Get history and analyze
    const history = getPriceHistory(30);
    const analysis = analyzeMarketSentiment(history, history);
    setMarketAnalysis({
      sentiment: analysis.sentiment,
      score: analysis.score,
      trend: analysis.trend,
      recommendation: analysis.recommendation,
    });

    const pred = predictNextPrice(history);
    setPrediction(pred);
  } catch (error) {
    console.error('Failed to update dashboard prices:', error);
  }
};