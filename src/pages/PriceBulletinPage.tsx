import React, { useState, useEffect } from 'react';
import { Save, Printer, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  getTodayBulletin, saveTodayBulletin, 
  DEFAULT_BANK_CHECKS, getBulletinDateArabic,
  generateBulletinHTML, PriceBulletin,
  BankCheckPrice
} from '../services/priceBulletin';
import { getSystemSettings } from '../services/settings';
import { notificationSystem, formatNumber } from '../services/supabase';

interface CheckPrices {
  [key: string]: { buy: string; sell: string };
}

export default function PriceBulletinPage() {
  const [gold24k, setGold24k] = useState('');
  const [gold22k, setGold22k] = useState('');
  const [gold21k, setGold21k] = useState('');
  const [gold18k, setGold18k] = useState('');
  const [silver, setSilver] = useState('');

  const [checkPrices, setCheckPrices] = useState<CheckPrices>({});
  const [showChecks, setShowChecks] = useState(true);

  const [parallelGold, setParallelGold] = useState({
    goldBroken18: '',
    goldBroken21: '',
    goldBroken22: '',
    goldBroken24: '',
    goldSpun18: '',
    silverNormal: '',
    silverLocal: '',
  });

  const [hawala, setHawala] = useState({
    turkeyHawalaUSD: '',
    dubaiHawalaUSD: '',
    turkeyHawalaEUR: '',
  });

  const [currency, setCurrency] = useState({
    poundSterling: '',
    tunisianDinar: '',
    turkishLira: '',
    egyptianDinar: '',
    lydToEGP: '',
  });

  // Load existing data
  useEffect(() => {
    const existing = getTodayBulletin();
    if (existing) {
      setGold24k(existing.gold24k > 0 ? existing.gold24k.toString() : '');
      setGold22k(existing.gold22k > 0 ? existing.gold22k.toString() : '');
      setGold21k(existing.gold21k > 0 ? existing.gold21k.toString() : '');
      setGold18k(existing.gold18k > 0 ? existing.gold18k.toString() : '');
      setSilver(existing.silver > 0 ? existing.silver.toString() : '');
      
      const cp: CheckPrices = {};
      existing.bankChecks.forEach(c => {
        cp[c.id] = { buy: c.buyPrice > 0 ? c.buyPrice.toString() : '', sell: c.sellPrice > 0 ? c.sellPrice.toString() : '' };
      });
      setCheckPrices(cp);
      
      setParallelGold({
        goldBroken18: existing.parallelGold.goldBroken18 > 0 ? existing.parallelGold.goldBroken18.toString() : '',
        goldBroken21: existing.parallelGold.goldBroken21 > 0 ? existing.parallelGold.goldBroken21.toString() : '',
        goldBroken22: existing.parallelGold.goldBroken22 > 0 ? existing.parallelGold.goldBroken22.toString() : '',
        goldBroken24: existing.parallelGold.goldBroken24 > 0 ? existing.parallelGold.goldBroken24.toString() : '',
        goldSpun18: existing.parallelGold.goldSpun18 > 0 ? existing.parallelGold.goldSpun18.toString() : '',
        silverNormal: existing.parallelGold.silverNormal > 0 ? existing.parallelGold.silverNormal.toString() : '',
        silverLocal: existing.parallelGold.silverLocal > 0 ? existing.parallelGold.silverLocal.toString() : '',
      });
      
      setHawala({
        turkeyHawalaUSD: existing.hawala.turkeyHawalaUSD > 0 ? existing.hawala.turkeyHawalaUSD.toString() : '',
        dubaiHawalaUSD: existing.hawala.dubaiHawalaUSD > 0 ? existing.hawala.dubaiHawalaUSD.toString() : '',
        turkeyHawalaEUR: existing.hawala.turkeyHawalaEUR > 0 ? existing.hawala.turkeyHawalaEUR.toString() : '',
      });
      
      setCurrency({
        poundSterling: existing.currency.poundSterling > 0 ? existing.currency.poundSterling.toString() : '',
        tunisianDinar: existing.currency.tunisianDinar > 0 ? existing.currency.tunisianDinar.toString() : '',
        turkishLira: existing.currency.turkishLira > 0 ? existing.currency.turkishLira.toString() : '',
        egyptianDinar: existing.currency.egyptianDinar > 0 ? existing.currency.egyptianDinar.toString() : '',
        lydToEGP: existing.currency.lydToEGP > 0 ? existing.currency.lydToEGP.toString() : '',
      });
    } else {
      // Load gold prices from system settings
      const settings = getSystemSettings();
      if (settings.goldPrices) {
        setGold24k(settings.goldPrices.gold24k > 0 ? settings.goldPrices.gold24k.toString() : '');
        setGold21k(settings.goldPrices.gold21k > 0 ? settings.goldPrices.gold21k.toString() : '');
        setGold18k(settings.goldPrices.gold18k > 0 ? settings.goldPrices.gold18k.toString() : '');
        setSilver(settings.goldPrices.silver > 0 ? settings.goldPrices.silver.toString() : '');
      }
    }
  }, []);

  const handleSave = () => {
    const bankChecks = DEFAULT_BANK_CHECKS.map(c => ({
      ...c,
      buyPrice: parseFloat(checkPrices[c.id]?.buy) || 0,
      sellPrice: parseFloat(checkPrices[c.id]?.sell) || 0,
      lastUpdate: new Date().toISOString(),
    }));

    saveTodayBulletin({
      gold24k: parseFloat(gold24k) || 0,
      gold22k: parseFloat(gold22k) || 0,
      gold21k: parseFloat(gold21k) || 0,
      gold18k: parseFloat(gold18k) || 0,
      silver: parseFloat(silver) || 0,
      bankChecks,
      parallelGold: {
        goldBroken18: parseFloat(parallelGold.goldBroken18) || 0,
        goldBroken21: parseFloat(parallelGold.goldBroken21) || 0,
        goldBroken22: parseFloat(parallelGold.goldBroken22) || 0,
        goldBroken24: parseFloat(parallelGold.goldBroken24) || 0,
        goldSpun18: parseFloat(parallelGold.goldSpun18) || 0,
        silverNormal: parseFloat(parallelGold.silverNormal) || 0,
        silverLocal: parseFloat(parallelGold.silverLocal) || 0,
        lastUpdate: new Date().toISOString(),
      },
      hawala: {
        turkeyHawalaUSD: parseFloat(hawala.turkeyHawalaUSD) || 0,
        dubaiHawalaUSD: parseFloat(hawala.dubaiHawalaUSD) || 0,
        turkeyHawalaEUR: parseFloat(hawala.turkeyHawalaEUR) || 0,
        lastUpdate: new Date().toISOString(),
      },
      currency: {
        poundSterling: parseFloat(currency.poundSterling) || 0,
        tunisianDinar: parseFloat(currency.tunisianDinar) || 0,
        turkishLira: parseFloat(currency.turkishLira) || 0,
        egyptianDinar: parseFloat(currency.egyptianDinar) || 0,
        lydToEGP: parseFloat(currency.lydToEGP) || 0,
        lastUpdate: new Date().toISOString(),
      },
    });

    notificationSystem.success('تم الحفظ', 'تم حفظ نشرة الأسعار لليوم');
  };

  const handlePrint = () => {
    const bulletin = getTodayBulletin();
    if (!bulletin) {
      notificationSystem.error('خطأ', 'يجب حفظ الأسعار أولاً');
      return;
    }
    const html = generateBulletinHTML(bulletin);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleExport = () => {
    const bulletin = getTodayBulletin();
    if (!bulletin) {
      notificationSystem.error('خطأ', 'يجب حفظ الأسعار أولاً');
      return;
    }
    const html = generateBulletinHTML(bulletin);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price_bulletin_${bulletin.date}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notificationSystem.success('تم التصدير', 'تم تحميل ملف النشرة');
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center";
  const labelClass = "text-gray-400 text-xs mb-1 block";

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-white text-center">نشرة الأسعار اليومية</h1>
          <p className="text-gray-400 text-center mt-1">شركة أعمال للصرافة والحوالات (داخلية وخارجية)</p>
          <p className="text-yellow-400 text-center mt-2 font-bold" dir="ltr">{getBulletinDateArabic()}</p>
        </div>

        {/* Gold Prices */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">أسعار الذهب والفضة الرسمية</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className={labelClass}>عيار 24</label>
              <input type="text" inputMode="decimal" dir="ltr" value={gold24k} onChange={(e) => setGold24k(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>عيار 22</label>
              <input type="text" inputMode="decimal" dir="ltr" value={gold22k} onChange={(e) => setGold22k(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>عيار 21</label>
              <input type="text" inputMode="decimal" dir="ltr" value={gold21k} onChange={(e) => setGold21k(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>عيار 18</label>
              <input type="text" inputMode="decimal" dir="ltr" value={gold18k} onChange={(e) => setGold18k(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الفضة</label>
              <input type="text" inputMode="decimal" dir="ltr" value={silver} onChange={(e) => setSilver(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Bank Checks */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowChecks(!showChecks)}>
            <h2 className="text-lg font-bold text-yellow-400">صكوك مصرفية</h2>
            {showChecks ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {showChecks && (
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-gray-400 text-right py-2 px-3">الصك</th>
                    <th className="text-gray-400 text-center py-2 px-3">سعر الشراء</th>
                    <th className="text-gray-400 text-center py-2 px-3">سعر البيع</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_BANK_CHECKS.map((check) => (
                    <tr key={check.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                      <td className="text-white py-2 px-3 font-medium">{check.name}</td>
                      <td className="py-2 px-3">
                        <input type="text" inputMode="decimal" dir="ltr" 
                          value={checkPrices[check.id]?.buy || ''} 
                          onChange={(e) => setCheckPrices({...checkPrices, [check.id]: {...checkPrices[check.id], buy: e.target.value}})} 
                          className={inputClass + ' text-xs'} />
                      </td>
                      <td className="py-2 px-3">
                        <input type="text" inputMode="decimal" dir="ltr" 
                          value={checkPrices[check.id]?.sell || ''} 
                          onChange={(e) => setCheckPrices({...checkPrices, [check.id]: {...checkPrices[check.id], sell: e.target.value}})} 
                          className={inputClass + ' text-xs'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Parallel Gold */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">أسعار الذهب والفضة (السوق الموازي)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>ذهب كسر عيار 18</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.goldBroken18} onChange={(e) => setParallelGold({...parallelGold, goldBroken18: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ذهب كسر عيار 21</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.goldBroken21} onChange={(e) => setParallelGold({...parallelGold, goldBroken21: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ذهب كسر عيار 22</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.goldBroken22} onChange={(e) => setParallelGold({...parallelGold, goldBroken22: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ذهب كسر عيار 24</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.goldBroken24} onChange={(e) => setParallelGold({...parallelGold, goldBroken24: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ذهب مسبوك عيار 18</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.goldSpun18} onChange={(e) => setParallelGold({...parallelGold, goldSpun18: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>فضة مسبوك عادي</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.silverNormal} onChange={(e) => setParallelGold({...parallelGold, silverNormal: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>فضة مسبوك محلي</label>
              <input type="text" inputMode="decimal" dir="ltr" value={parallelGold.silverLocal} onChange={(e) => setParallelGold({...parallelGold, silverLocal: e.target.value})} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Hawala */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">أسعار الحوالات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>دولار حوالة تركيا</label>
              <input type="text" inputMode="decimal" dir="ltr" value={hawala.turkeyHawalaUSD} onChange={(e) => setHawala({...hawala, turkeyHawalaUSD: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>حوالة دبي دولار</label>
              <input type="text" inputMode="decimal" dir="ltr" value={hawala.dubaiHawalaUSD} onChange={(e) => setHawala({...hawala, dubaiHawalaUSD: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>حوالة تركيا يورو</label>
              <input type="text" inputMode="decimal" dir="ltr" value={hawala.turkeyHawalaEUR} onChange={(e) => setHawala({...hawala, turkeyHawalaEUR: e.target.value})} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">أسعار العملات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>الجنيه الإسترليني</label>
              <input type="text" inputMode="decimal" dir="ltr" value={currency.poundSterling} onChange={(e) => setCurrency({...currency, poundSterling: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الدينار التونسي</label>
              <input type="text" inputMode="decimal" dir="ltr" value={currency.tunisianDinar} onChange={(e) => setCurrency({...currency, tunisianDinar: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الليرة التركية</label>
              <input type="text" inputMode="decimal" dir="ltr" value={currency.turkishLira} onChange={(e) => setCurrency({...currency, turkishLira: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الدينار المصري</label>
              <input type="text" inputMode="decimal" dir="ltr" value={currency.egyptianDinar} onChange={(e) => setCurrency({...currency, egyptianDinar: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الليبي مقابل المصري</label>
              <input type="text" inputMode="decimal" dir="ltr" value={currency.lydToEGP} onChange={(e) => setCurrency({...currency, lydToEGP: e.target.value})} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />حفظ نشرة اليوم
          </button>
          <button onClick={handlePrint} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" />طباعة
          </button>
          <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />تصدير
          </button>
        </div>
      </div>
    </div>
  );
}
