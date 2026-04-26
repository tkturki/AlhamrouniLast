import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Search, ShoppingCart, Package, TrendingUp, DollarSign, RefreshCw, Crown, Gem, Coins } from 'lucide-react';
import { jewelryApi } from '../services/supabase';
import { JewelryItem } from '../services/supabase';
import { fetchGoldPrice, fetchExchangeRate } from '../utils/arabic';

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

const HomePage: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    gold: 0,
    silver: 0,
    outOfStock: 0,
    totalWeight24k: 0,
    totalWeight21k: 0,
    totalWeight18k: 0,
    totalWeightSilver: 0,
    totalValue: 0,
  });
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // جلب أسعار الذهب والصرف
      const [gold, rate, items] = await Promise.all([
        fetchGoldPrice(),
        fetchExchangeRate(),
        jewelryApi.getAllItems(),
      ]);
      setGoldPrice(gold);
      setExchangeRate(rate);

      // حساب الإحصائيات
      const goldItems = items.filter((i) => i.item_type === 'G');
      const silverItems = items.filter((i) => i.item_type === 'S');

      const weight24k = goldItems.filter((i) => i.karat === '24').reduce((sum, i) => sum + i.weight * i.stock_qty, 0);
      const weight21k = goldItems.filter((i) => i.karat === '21').reduce((sum, i) => sum + i.weight * i.stock_qty, 0);
      const weight18k = goldItems.filter((i) => i.karat === '18').reduce((sum, i) => sum + i.weight * i.stock_qty, 0);
      const weightSilver = silverItems.reduce((sum, i) => sum + i.weight * i.stock_qty, 0);

      const totalValue = items.reduce((sum, i) => sum + (i.price * i.weight * i.stock_qty), 0);

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
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
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
          <button onClick={loadData} className="text-yellow-400 hover:text-yellow-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
            <p className="text-yellow-300 text-xs mb-1">عيار 24</p>
            <p className="text-2xl font-bold text-yellow-400">{goldPrice?.price24k.toFixed(2) || '---'} <span className="text-sm">د.ل/غ</span></p>
          </div>
          <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
            <p className="text-yellow-300 text-xs mb-1">عيار 21</p>
            <p className="text-2xl font-bold text-yellow-400">{goldPrice?.price21k.toFixed(2) || '---'} <span className="text-sm">د.ل/غ</span></p>
          </div>
          <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
            <p className="text-yellow-300 text-xs mb-1">عيار 18</p>
            <p className="text-2xl font-bold text-yellow-400">{goldPrice?.price18k.toFixed(2) || '---'} <span className="text-sm">د.ل/غ</span></p>
          </div>
        </div>
      </div>

      {/* سعر الصرف */}
      <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-5 border border-blue-600/30">
        <div className="flex items-center gap-2 text-blue-400 mb-4">
          <DollarSign className="w-5 h-5" />
          <span className="font-bold">سعر الصرف</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-600/20 rounded-xl p-3 text-center">
            <p className="text-blue-300 text-xs mb-1">الدولار</p>
            <p className="text-2xl font-bold text-blue-400">{exchangeRate?.usdToLyd.toFixed(3) || '---'} <span className="text-sm">د.ل</span></p>
          </div>
          <div className="bg-blue-600/20 rounded-xl p-3 text-center">
            <p className="text-blue-300 text-xs mb-1">اليورو</p>
            <p className="text-2xl font-bold text-blue-400">{(exchangeRate ? (exchangeRate.usdToLyd * 1.08).toFixed(3) : '---')} <span className="text-sm">د.ل</span></p>
          </div>
        </div>
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
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">إجمالي القطع</p>
          </div>
          <div className="bg-yellow-600/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.gold}</p>
            <p className="text-xs text-gray-400">ذهب</p>
          </div>
          <div className="bg-gray-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-300">{stats.silver}</p>
            <p className="text-xs text-gray-400">فضة</p>
          </div>
          <div className="bg-red-600/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.outOfStock}</p>
            <p className="text-xs text-gray-400">نفد</p>
          </div>
        </div>

        {/* الوزن حسب العيار */}
        <div className="bg-gray-700/30 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            الوزن حسب العيار
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{stats.totalWeight24k.toFixed(2)} غ</p>
              <p className="text-gray-400 text-xs">عيار 24</p>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{stats.totalWeight21k.toFixed(2)} غ</p>
              <p className="text-gray-400 text-xs">عيار 21</p>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">{stats.totalWeight18k.toFixed(2)} غ</p>
              <p className="text-gray-400 text-xs">عيار 18</p>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 text-center">
              <p className="text-gray-300 font-bold text-lg">{stats.totalWeightSilver.toFixed(2)} غ</p>
              <p className="text-gray-400 text-xs">فضة</p>
            </div>
          </div>
        </div>

        {/* القيمة الإجمالية */}
        <div className="mt-4 bg-green-600/20 border border-green-600/30 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">القيمة الإجمالية للمخزون</p>
          <p className="text-3xl font-bold text-green-400">{stats.totalValue.toLocaleString()} د.ل</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;