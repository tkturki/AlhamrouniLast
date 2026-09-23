// خدمة نشرة الأسعار اليومية
// Company: شركة أعمال للصرافة والحوالات (内外)

import { formatNumber } from './supabase';

export interface BankCheckPrice {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  lastUpdate: string;
}

export interface ParallelGoldPrice {
  goldBroken18: number;
  goldBroken21: number;
  goldBroken22: number;
  goldBroken24: number;
  goldSpun18: number;
  silverNormal: number;
  silverLocal: number;
  lastUpdate: string;
}

export interface HawalaPrice {
  turkeyHawalaUSD: number;
  dubaiHawalaUSD: number;
  turkeyHawalaEUR: number;
  lastUpdate: string;
}

export interface CurrencyPrice {
  poundSterling: number;
  tunisianDinar: number;
  turkishLira: number;
  egyptianDinar: number;
  lydToEGP: number;
  lastUpdate: string;
}

export interface PriceBulletin {
  id: string;
  date: string;
  gold24k: number;
  gold22k: number;
  gold21k: number;
  gold18k: number;
  silver: number;
  bankChecks: BankCheckPrice[];
  parallelGold: ParallelGoldPrice;
  hawala: HawalaPrice;
  currency: CurrencyPrice;
  createdAt: string;
}

// Default bank checks
export const DEFAULT_BANK_CHECKS: BankCheckPrice[] = [
  { id: 'check1', name: 'صك التنمية', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check2', name: 'صك الوحدة', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check3', name: 'صك شمال أفريقيا', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check4', name: 'صك الجمهورية', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check5', name: 'صك الإسلامي', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check6', name: 'صك النوران', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check7', name: 'صك اليقين', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check8', name: 'صك الأمان', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check9', name: 'صك التجاري الوطني', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check10', name: 'صك الصحراء', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check11', name: 'صك المتحد', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
  { id: 'check12', name: 'صك السراي', buyPrice: 0, sellPrice: 0, lastUpdate: '' },
];

// Get/Set bulletin from localStorage
const STORAGE_KEY = 'price_bulletin_data';

export const getBulletinData = (): Record<string, PriceBulletin> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveBulletinData = (data: Record<string, PriceBulletin>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getTodayBulletin = (): PriceBulletin | null => {
  const today = new Date().toISOString().split('T')[0];
  const all = getBulletinData();
  return all[today] || null;
};

export const saveTodayBulletin = (bulletin: Omit<PriceBulletin, 'id' | 'date' | 'createdAt'>): PriceBulletin => {
  const today = new Date().toISOString().split('T')[0];
  const all = getBulletinData();
  const newBulletin: PriceBulletin = {
    ...bulletin,
    id: `bulletin_${today}`,
    date: today,
    createdAt: new Date().toISOString(),
  };
  all[today] = newBulletin;
  saveBulletinData(all);
  return newBulletin;
};

// Generate bulletin date string for display
export const getBulletinDateArabic = (dateStr?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();
  const dayName = arabicDays[date.getDay()];
  
  return `${dayName} ${day} ${month} ${year}`;
};

// Generate HTML for printable bulletin
export const generateBulletinHTML = (bulletin: PriceBulletin): string => {
  const dateArabic = getBulletinDateArabic(bulletin.date);
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>نشرة الأسعار - ${dateArabic}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #000; }
        .container { max-width: 800px; margin: 0 auto; padding: 15px; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .company-name { font-size: 22px; font-weight: bold; color: #000; }
        .subtitle { font-size: 12px; color: #333; margin-top: 3px; }
        .date { font-size: 14px; font-weight: bold; margin-top: 5px; color: #000; }
        .section { margin-bottom: 12px; }
        .section-title { background: #000; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 13px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 5px 8px; text-align: center; }
        th { background: #f0f0f0; font-weight: bold; color: #000; }
        .price-col { font-weight: bold; }
        .gold-price { background: #fffde7; }
        .silver-price { background: #f5f5f5; }
        .check-price { background: #fafafa; }
        .hawala-price { background: #fff8e1; }
        .currency-price { background: #f3e5f5; }
        .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-size: 10px; color: #666; }
        @media print { body { padding: 0; } .container { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">شركة أعمال للصرافة والحوالات</div>
          <div class="subtitle">( داخلية وخارجية )</div>
          <div class="date">نشرة الأسعار ليوم ${dateArabic}</div>
        </div>

        <!-- أسعار الذهب الرسمية -->
        <div class="section">
          <div class="section-title">أسعار الذهب الرسمية</div>
          <table>
            <tr>
              <th>العيار</th>
              <th>السعر (د.ل/غ)</th>
            </tr>
            <tr class="gold-price">
              <td>عيار 24</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.gold24k)}</td>
            </tr>
            <tr class="gold-price">
              <td>عيار 22</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.gold22k)}</td>
            </tr>
            <tr class="gold-price">
              <td>عيار 21</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.gold21k)}</td>
            </tr>
            <tr class="gold-price">
              <td>عيار 18</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.gold18k)}</td>
            </tr>
            <tr class="silver-price">
              <td>الفضة</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.silver)}</td>
            </tr>
          </table>
        </div>

        <!-- صكوك مصرفية -->
        <div class="section">
          <div class="section-title">صكوك مصرفية</div>
          <table>
            <tr>
              <th>الصك</th>
              <th>سعر الشراء</th>
              <th>سعر البيع</th>
            </tr>
            ${bulletin.bankChecks.map(check => `
            <tr class="check-price">
              <td>${check.name}</td>
              <td class="price-col" lang="en">${check.buyPrice > 0 ? formatNumber(check.buyPrice) : '—'}</td>
              <td class="price-col" lang="en">${check.sellPrice > 0 ? formatNumber(check.sellPrice) : '—'}</td>
            </tr>
            `).join('')}
          </table>
        </div>

        <!-- أسعار الذهب الموازي -->
        <div class="section">
          <div class="section-title">أسعار الذهب والفضة (السوق الموازي)</div>
          <table>
            <tr>
              <th>النوع</th>
              <th>السعر (د.ل/غ)</th>
            </tr>
            <tr class="gold-price">
              <td>ذهب كسر عيار 18</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.goldBroken18)}</td>
            </tr>
            <tr class="gold-price">
              <td>ذهب كسر عيار 21</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.goldBroken21)}</td>
            </tr>
            <tr class="gold-price">
              <td>ذهب كسر عيار 22</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.goldBroken22)}</td>
            </tr>
            <tr class="gold-price">
              <td>ذهب كسر عيار 24</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.goldBroken24)}</td>
            </tr>
            <tr class="gold-price">
              <td>ذهب مسبوك عيار 18</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.goldSpun18)}</td>
            </tr>
            <tr class="silver-price">
              <td>فضة مسبوك عادي</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.silverNormal)}</td>
            </tr>
            <tr class="silver-price">
              <td>فضة مسبوك محلي</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.parallelGold.silverLocal)}</td>
            </tr>
          </table>
        </div>

        <!-- أسعار الحوالات -->
        <div class="section">
          <div class="section-title">أسعار الحوالات</div>
          <table>
            <tr>
              <th>النوع</th>
              <th>السعر (د.ل)</th>
            </tr>
            <tr class="hawala-price">
              <td>دولار حوالة تركيا</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.hawala.turkeyHawalaUSD)}</td>
            </tr>
            <tr class="hawala-price">
              <td>حوالة دبي دولار</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.hawala.dubaiHawalaUSD)}</td>
            </tr>
            <tr class="hawala-price">
              <td>حوالة تركيا يورو</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.hawala.turkeyHawalaEUR)}</td>
            </tr>
          </table>
        </div>

        <!-- أسعار العملات -->
        <div class="section">
          <div class="section-title">أسعار العملات</div>
          <table>
            <tr>
              <th>العملة</th>
              <th>السعر (د.ل)</th>
            </tr>
            <tr class="currency-price">
              <td>الجنيه الإسترليني</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.currency.poundSterling)}</td>
            </tr>
            <tr class="currency-price">
              <td>الدينار التونسي</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.currency.tunisianDinar)}</td>
            </tr>
            <tr class="currency-price">
              <td>الليرة التركية</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.currency.turkishLira)}</td>
            </tr>
            <tr class="currency-price">
              <td>الدينار المصري</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.currency.egyptianDinar)}</td>
            </tr>
            <tr class="currency-price">
              <td>الدينار الليبي مقابل الدينار المصري</td>
              <td class="price-col" lang="en">${formatNumber(bulletin.currency.lydToEGP)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>جميع الأسعار بالدينار الليبي</p>
          <p>آخر تحديث: ${new Date().toLocaleString('ar-LY')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
