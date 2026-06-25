import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Search, ShoppingCart, Package, DollarSign, RefreshCw, Crown, Gem, Coins, Edit3, Save } from 'lucide-react';
import { jewelryApi } from '../services/supabase';
import { formatNumber, formatCurrency } from '../services/supabase';
import { getSystemSettings, saveSystemSettings } from '../services/settings';

interface GoldPrice {
  price24k: number;
  price21k: number;
  price18k: number;
  updated: string;
}

interface ExchangeRate {
  usdToLyd: number;
  updated: string;
}

interface Stats {
  total: number;
  gold: number;
  silver: number;
  outOfStock: number;
  totalWeight24k: number;
  totalWeight21k: number;
  totalWeight18k: number;
  totalWeightSilver: number;
  totalValue: number;
  totalPieces: number;
  totalWeightAll: number;
}

const HomePage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    gold: 0,
    silver: 0,
    outOfStock: 0,
    totalWeight24k: 0,
    totalWeight21k: 0,
    totalWeight18k: 0,
    totalWeightSilver: 0,
    totalValue: 0,
    totalPieces: 0,
    totalWeightAll: 0,
  });
  const [goldPrice, setGoldPrice] = useState<GoldPrice>({
    price24k: 0,
    price21k: 0,
    price18k: 0,
    updated: '',
  });
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    usdToLyd: 0,
    updated: '',
  });
  const [loading, setLoading] = useState(true);

  // Manual input states
  const [manualGold24k, setManualGold24k] = useState('');
  const [manualGold21k, setManualGold21k] = useState('');
  const [manualGold18k, setManualGold18k] = useState('');
  const [manualExchangeRate, setManualExchangeRate] = useState('');
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings from localStorage
      const settings = getSystemSettings();

      const gold = {
        price24k: settings.goldPrices.gold24k,
        price21k: settings.goldPrices.gold21k,
        price18k: settings.goldPrices.gold18k,
        updated: settings.goldPrices.lastUpdated,
      };

      const rate = {
        usdToLyd: settings.exchangeRate.usdToLyd,
        updated: settings.exchangeRate.lastUpdated,
      };

      setGoldPrice(gold);
      setExchangeRate(rate);

      // Set manual input values
      setManualGold24k(gold.price24k.toString());
      setManualGold21k(gold.price21k.toString());
      setManualGold18k(gold.price18k.toString());
      setManualExchangeRate(rate.usdToLyd.toString());

      // Fetch items from localStorage first (more reliable)
      let items: any[] = [];
      const localItems = localStorage.getItem('jewelry_items');
      if (localItems) {
        items = JSON.parse(localItems);
      } else {
        // Fallback to API if localStorage is empty
        try {
          items = await jewelryApi.getAllItems();
        } catch (e) {
          console.log('Using empty items list');
        }
      }

      const goldItems = items.filter((i) => i.item_type === 'G');
      const silverItems = items.filter((i) => i.item_type === 'S');

      const weight24k = goldItems
        .filter((i) => i.karat === '24' && i.stock_qty > 0)
        .reduce((sum, i) => sum + i.weight, 0);
      const weight21k = goldItems
        .filter((i) => i.karat === '21' && i.stock_qty > 0)
        .reduce((sum, i) => sum + i.weight, 0);
      const weight18k = goldItems
        .filter((i) => i.karat === '18' && i.stock_qty > 0)
        .reduce((sum, i) => sum + i.weight, 0);
      const weightSilver = silverItems
        .filter((i) => i.stock_qty > 0)
        .reduce((sum, i) => sum + i.weight, 0);

      const totalWeightAll = goldItems
        .filter((i) => i.stock_qty > 0)
        .reduce((sum, i) => sum + i.weight, 0) + weightSilver;

      const totalValue = items
        .filter((i) => i.stock_qty > 0)
        .reduce((sum, i) => sum + (i.price * i.stock_qty), 0);

      const totalPieces = items
        .filter((i) => i.stock_qty > 0)
        .reduce((sum, i) => sum + i.stock_qty, 0);

      setStats({
        total: items.length,
        gold: goldItems.length,
        silver: silverItems.length,
        outOfStock: items.filter((i) => i.stock_qty <= 0).length,
        totalWeight24k: weight24k,
        totalWeight21k: weight21k,
        totalWeight18k: weight18k,
        totalWeightSilver: weightSilver,
        totalValue: totalValue,
        totalPieces: totalPieces,
        totalWeightAll: totalWeightAll,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleSaveGoldPrices = () => {
    const newGold24k = parseFloat(manualGold24k) || 0;
    const newGold21k = parseFloat(manualGold21k) || 0;
    const newGold18k = parseFloat(manualGold18k) || 0;

    saveSystemSettings({
      goldPrices: {
        gold24k: newGold24k,
        gold21k: newGold21k,
        gold18k: newGold18k,
        silver: getSystemSettings().goldPrices.silver,
        lastUpdated: new Date().toISOString(),
        isCustom: true,
      }
    });

    setGoldPrice({
      price24k: newGold24k,
      price21k: newGold21k,
      price18k: newGold18k,
      updated: new Date().toISOString(),
    });
    setIsEditingPrices(false);
  };

  const handleSaveExchangeRate = () => {
    const newRate = parseFloat(manualExchangeRate) || 0;

    saveSystemSettings({
      exchangeRate: {
        usdToLyd: newRate,
        lastUpdated: new Date().toISOString(),
        isCustom: true,
      }
    });

    setExchangeRate({
      usdToLyd: newRate,
      updated: new Date().toISOString(),
    });
    setIsEditingRate(false);
  };

  const menuItems = [
    {
      path: '/add',
      icon: QrCode,
      title: 'التكويد',
      description: 'إضافة قطع جديدة',
      color: 'from-yellow-600 to-yellow-500',
    },
    {
      path: '/sales',
      icon: ShoppingCart,
      title: 'البيع',
      description: 'إنشاء فاتورة جديدة',
      color: 'from-green-600 to-green-500',
    },
    {
      path: '/invoices',
      icon: Package,
      title: 'الفواتير',
      description: 'عرض الفواتير',
      color: 'from-blue-600 to-blue-500',
    },
    {
      path: '/search',
      icon: Search,
      title: 'البحث',
      description: 'البحث والتعديل',
      color: 'from-purple-600 to-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="مجوهرات الحمروني" className="w-24 h-24 mx-auto mb-3 rounded-xl shadow-lg" />
        <h1 className="text-3xl font-bold text-yellow-400">مجوهرات الحمروني</h1>
        <p className="text-gray-400">أجود المجوهرات وأفضل الأسعار</p>
      </div>

      {/* أسعار الذهب */}
      <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-2xl p-5 border border-yellow-600/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Crown className="w-5 h-5" />
            <span className="font-bold">أسعار الذهب اليوم</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingPrices ? (
              <button
                onClick={() => setIsEditingPrices(true)}
                className="text-yellow-400 hover:text-yellow-300 p-1"
                title="تعديل الأسعار"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveGoldPrices}
                className="text-green-400 hover:text-green-300 p-1"
                title="حفظ"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
            <button onClick={loadData} className="text-yellow-400 hover:text-yellow-300">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isEditingPrices ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-yellow-300 text-sm w-20">عيار 24:</label>
              <input
                type="number"
                step="0.01"
                value={manualGold24k}
                onChange={(e) => setManualGold24k(e.target.value)}
                className="flex-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="سعر عيار 24"
              />
              <span className="text-gray-400 text-sm">د.ل/غ</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-yellow-300 text-sm w-20">عيار 21:</label>
              <input
                type="number"
                step="0.01"
                value={manualGold21k}
                onChange={(e) => setManualGold21k(e.target.value)}
                className="flex-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="سعر عيار 21"
              />
              <span className="text-gray-400 text-sm">د.ل/غ</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-yellow-300 text-sm w-20">عيار 18:</label>
              <input
                type="number"
                step="0.01"
                value={manualGold18k}
                onChange={(e) => setManualGold18k(e.target.value)}
                className="flex-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="سعر عيار 18"
              />
              <span className="text-gray-400 text-sm">د.ل/غ</span>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setManualGold24k(goldPrice.price24k.toString());
                  setManualGold21k(goldPrice.price21k.toString());
                  setManualGold18k(goldPrice.price18k.toString());
                  setIsEditingPrices(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
              <p className="text-yellow-300 text-xs mb-1">عيار 24</p>
              <p className="text-2xl font-bold text-yellow-400">{goldPrice.price24k > 0 ? goldPrice.price24k.toFixed(2) : '---'} <span className="text-sm">د.ل/غ</span></p>
            </div>
            <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
              <p className="text-yellow-300 text-xs mb-1">عيار 21</p>
              <p className="text-2xl font-bold text-yellow-400">{goldPrice.price21k > 0 ? goldPrice.price21k.toFixed(2) : '---'} <span className="text-sm">د.ل/غ</span></p>
            </div>
            <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
              <p className="text-yellow-300 text-xs mb-1">عيار 18</p>
              <p className="text-2xl font-bold text-yellow-400">{goldPrice.price18k > 0 ? goldPrice.price18k.toFixed(2) : '---'} <span className="text-sm">د.ل/غ</span></p>
            </div>
          </div>
        )}
      </div>

      {/* سعر الصرف */}
      <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-5 border border-blue-600/30">
        <div className="flex items-center gap-2 text-blue-400 mb-4">
          <DollarSign className="w-5 h-5" />
          <span className="font-bold">سعر الصرف</span>
          <div className="flex items-center gap-2 mr-auto">
            {!isEditingRate ? (
              <button
                onClick={() => setIsEditingRate(true)}
                className="text-blue-400 hover:text-blue-300 p-1"
                title="تعديل السعر"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveExchangeRate}
                className="text-green-400 hover:text-green-300 p-1"
                title="حفظ"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isEditingRate ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-blue-300 text-sm w-28">1 دولار أمريكي =</label>
              <input
                type="number"
                step="0.001"
                value={manualExchangeRate}
                onChange={(e) => setManualExchangeRate(e.target.value)}
                className="flex-1 bg-blue-600/20 border border-blue-600/30 rounded-lg px-3 py-2 text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="سعر الدولار"
              />
              <span className="text-gray-400 text-sm">د.ل</span>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setManualExchangeRate(exchangeRate.usdToLyd.toString());
                  setIsEditingRate(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-600/20 rounded-xl p-3 text-center">
              <p className="text-blue-300 text-xs mb-1">1 دولار أمريكي =</p>
              <p className="text-2xl font-bold text-blue-400">{exchangeRate.usdToLyd.toFixed(3) || '---'} <span className="text-sm">د.ل</span></p>
            </div>
            <div className="bg-blue-600/20 rounded-xl p-3 text-center">
              <p className="text-blue-300 text-xs mb-1">1 يورو =</p>
              <p className="text-2xl font-bold text-blue-400">{(exchangeRate ? (exchangeRate.usdToLyd * 1.08).toFixed(3) : '---')} <span className="text-sm">د.ل</span></p>
            </div>
          </div>
        )}
      </div>

      {/* القائمة */}
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bg-gradient-to-br ${item.color} p-5 rounded-2xl text-gray-900 transition-all hover:scale-105 hover:shadow-xl flex flex-col items-center gap-2`}
            >
              <Icon className="w-8 h-8" />
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm opacity-80 text-center">{item.description}</p>
            </Link>
          );
        })}
      </div>

      {/* إحصائيات المخزون */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <div className="flex items-center gap-2 text-yellow-400 mb-4">
          <Gem className="w-5 h-5" />
          <span className="font-bold">إحصائيات المخزون</span>
        </div>

        {/* ملخص عام */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{formatNumber(stats.total, 0)}</p>
            <p className="text-xs text-gray-400">أنواع القطع</p>
          </div>
          <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{formatNumber(stats.totalPieces, 0)}</p>
            <p className="text-xs text-gray-400">إجمالي القطع</p>
          </div>
          <div className="bg-green-600/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{formatNumber(stats.gold, 0)}</p>
            <p className="text-xs text-gray-400">ذهب</p>
          </div>
          <div className="bg-red-600/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{formatNumber(stats.outOfStock, 0)}</p>
            <p className="text-xs text-gray-400">نفد</p>
          </div>
        </div>

        {/* الوزن الإجمالي */}
        <div className="bg-gray-700/30 rounded-xl p-4 mb-4">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            الوزن الإجمالي للمخزون
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{formatNumber(stats.totalWeightAll)} غ</p>
              <p className="text-gray-400 text-xs">الإجمالي</p>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{formatNumber(stats.totalWeight24k)} غ</p>
              <p className="text-gray-400 text-xs">عيار 24</p>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{formatNumber(stats.totalWeight21k)} غ</p>
              <p className="text-gray-400 text-xs">عيار 21</p>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{formatNumber(stats.totalWeight18k)} غ</p>
              <p className="text-gray-400 text-xs">عيار 18</p>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 text-center">
              <p className="text-gray-300 font-bold text-lg">{formatNumber(stats.totalWeightSilver)} غ</p>
              <p className="text-gray-400 text-xs">فضة</p>
            </div>
          </div>
        </div>

        {/* القيمة الإجمالية */}
        <div className="mt-4 bg-green-600/20 border border-green-600/30 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">القيمة الإجمالية للمخزون</p>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalValue)}</p>
          {exchangeRate && exchangeRate.usdToLyd > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              ≈ {formatNumber(stats.totalValue / exchangeRate.usdToLyd)} دولار
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;