// Order Invoice Template - matches the desired format exactly
import { numberToArabicWords, numberToArabicWeightWords } from "../utils/arabic";
import { getSystemSettings } from "./settings";

export interface OrderItem {
  serial: number;
  description: string;
  metal_type: string;
  karat?: string;
  weight_pure: number;
  workmanship_per_gram: number;
  weight_with_stones: number;
  weight_with_gems: number;
  stone_weight?: number;
  gem_weight?: number;
  total: number;
  notes: string;
  pieces_count?: number;
  price_per_gram?: number;
  value_stones?: number;
  value_gems?: number;
  workmanship_total?: number;
  metal_value?: number;
  stone_count?: number;
  gem_count?: number;
  stone_price?: number;
  gem_price?: number;
  gold_price?: number;
  total_weight?: number;
}

export interface OrderData {
  order_number: string;
  receipt_number?: string;
  customer_name: string;
  customer_title?: string;
  delivery_date: string;
  items: OrderItem[];
  total_amount: number;
  total_weight: number;
  total_workmanship: number;
  seller_name: string;
  created_at: string;
  page_size?: string;
  orientation?: "portrait" | "landscape";
  total_stones_value?: number;
  total_gems_value?: number;
  total_metal_value?: number;
  received_quantity?: number;
  received_weight?: number;
  remaining_weight?: number;
  total_pieces?: number;
  received_pieces?: number;
  ingot_weight?: number;
  other_add_desc?: string;
  other_add_value?: number;
  manual_gems?: number;
  manual_stones?: number;
  visibleBreakdown?: Record<string, boolean>;
  sum_columns?: string[];
  invoice_title?: string;
  column_labels?: Record<string, string>;
  invoice_total?: number;
  header_mode?: 'custom' | 'sales';
  header_customer_label?: string;
  header_invoice_label?: string;
  header_date_label?: string;
  invoice_notes?: string;
}

export const generateOrderInvoiceHTML = (data: OrderData, visibleCols?: string[]): string => {
  const settings = getSystemSettings();
  const formatCurrency = (value: number): string => value > 0
    ? `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل`
    : '';
  const date = new Date(data.created_at);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const pageSize = data.page_size || "A4";
  const orientation = data.orientation || "landscape";

  const tStonesVal = data.total_stones_value || (data.items || []).reduce((s, it) => s + (it.value_stones || 0), 0);
  const tGemsVal = data.total_gems_value || (data.items || []).reduce((s, it) => s + (it.value_gems || 0), 0);
  const tWorkVal = (data.items || []).reduce((s, it) => s + ((it.workmanship_per_gram || 0) * (Number(it.weight_pure) || 0)), 0);
  const tMetalVal = (data.items || []).reduce((s, it) => s + ((it.gold_price || 0) * (it.weight_pure || 0)), 0);
  const tStonesCount = (data.items || []).reduce((s, it) => s + (it.stone_count || 0), 0);
  const tGemsCount = (data.items || []).reduce((s, it) => s + (it.gem_count || 0), 0);
  //const total = data.invoice_total ?? tWorkVal;
  
 // const words = total > 0 ? numberToArabicWords(total) : "";
 // const weightWords = numberToArabicWeightWords(totalCombinedWeight);

 // تصحيح المجموع المالي ومنع الجمع المزدوج للبند المقابل للشراء
  const uniqueTotal = (data.items || []).reduce((sum: number, item: any) => {
    const isConversion = item.description && item.description.includes('الوزن المبين');
    if (isConversion) {
      return sum;
    }
    return sum + Number(item.total || item.amount || item.invoice_total || 0);
  }, 0);

  const total = uniqueTotal > 0 ? uniqueTotal : (data.invoice_total ?? tWorkVal);
  const words = total > 0 ? numberToArabicWords(total) : "";
  const tPieces = data.total_pieces || (data.items || []).reduce((s, it) => s + (it.pieces_count || 0), 0);
  const totalWeight = (data.items || []).reduce((s, it) => s + (it.weight_pure || 0), 0);
  const totalStonesWeight = (data.items || []).reduce((s, it) => s + (Number(it.stone_weight) || 0), 0);
  const totalGemsWeight = (data.items || []).reduce((s, it) => s + (Number(it.gem_weight) || 0), 0);
  const totalWithStones = (data.items || []).reduce((s, it) => s + (Number(it.weight_with_stones) || 0), 0);
  const totalWithGems = (data.items || []).reduce((s, it) => s + (Number(it.weight_with_gems) || 0), 0);
  const totalCombinedWeight = (data.items || []).reduce((s, it) => s + (Number(it.total_weight) || ((it.weight_pure || 0) + (Number(it.stone_weight) || 0) + (Number(it.gem_weight) || 0) + (Number(it.weight_with_gems) || 0))), 0);

  const hasSilver = (data.items || []).some(it => (it.metal_type || '').includes('فضة'));
  const metalLabel = hasSilver ? 'فضة' : 'ذهب';

  const allCols = [
    { key: 'num', label: '#', w: '3%' },
    { key: 'pieces', label: 'العدد', w: '3%' },
    { key: 'desc', label: 'الصنف والبيان', w: '14%' },
    { key: 'karat', label: 'العيار', w: '5%' },
    { key: 'pureW', label: `وزن ${metalLabel}`, w: '7%' },
    { key: 'withStones', label: 'وزن بالأحجار', w: '7%' },
    { key: 'withGems', label: 'وزن الجوهر', w: '7%' },
    { key: 'stoneW', label: 'وزن الأحجار', w: '6%' },
    { key: 'gemW', label: 'وزن المجارات', w: '6%' },
    { key: 'totalW', label: 'إجمالي الوزن', w: '8%' },
    { key: 'stoneCount', label: 'عدد الأحجار', w: '4%' },
    { key: 'gemCount', label: 'عدد المجارات', w: '4%' },
    { key: 'goldPrice', label: 'سعر الجرام', w: '7%' },
    { key: 'workPrice', label: 'سعر اليد للجرام', w: '6%' },
    { key: 'total', label: 'الإجمالي (د.ل)', w: '10%' },
    { key: 'notes', label: 'ملاحظات', w: '10%' },
  ];
  const cols = (visibleCols
    ? allCols.filter(c => visibleCols.includes(c.key) || c.key === 'total')
    : allCols).map(c => ({ ...c, label: data.column_labels?.[c.key] || c.label }));
  // إعادة توزيع عرض الأعمدة ليملأ الجدول بالكامل بغض النظر عن عدد الأعمدة الظاهرة
  const widthTotal = cols.reduce((s, c) => s + (parseFloat(c.w) || 0), 0) || 100;
  cols.forEach(c => { c.w = `${(((parseFloat(c.w) || 0) / widthTotal) * 100).toFixed(2)}%`; });

  const fixedSumCols = ['pureW', 'withStones', 'withGems', 'stoneW', 'gemW', 'totalW', 'total'];
  const sumColumns = data.sum_columns || fixedSumCols;
  const colSpan = cols.length;

  const getCell = (col: string, it: any, pureW: number, stoneW: number, gemW: number, metalVal: number): string => {
    switch (col) {
      case 'num': return `${it.serial}`;
      case 'pieces': return `${it.pieces_count || '-'}`;
      case 'desc': return `${it.description || "----"}`;
      case 'karat': return `${it.karat || '-'}`;
      case 'pureW': return `<span style="font-weight:bold;color:#b45309">${pureW.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
      case 'withStones': return `${(Number(it.weight_with_stones) || 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
      case 'withGems': return `${(Number(it.weight_with_gems) || 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
      case 'stoneW': return `<span style="color:#2563eb;font-weight:bold">${stoneW.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
      case 'gemW': return `<span style="color:#9333ea;font-weight:bold">${gemW.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
      case 'totalW': return `<span style="font-weight:bold;color:#065f46">${(Number(it.total_weight) || (pureW + stoneW + gemW + (Number(it.weight_with_gems) || 0))).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
      case 'stoneCount': return `${(it.stone_count || 0) > 0 ? it.stone_count : '-'}`;
      case 'gemCount': return `${(it.gem_count || 0) > 0 ? it.gem_count : '-'}`;
      case 'goldPrice': return it.gold_price > 0 ? `${it.gold_price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` : '';
      case 'workPrice': return it.workmanship_per_gram > 0 ? `${it.workmanship_per_gram.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})}` : '';
      case 'total': return `<span style="font-weight:bold;color:#b45309">${formatCurrency(it.invoice_total ?? ((it.workmanship_per_gram || 0) * (Number(it.weight_pure) || 0)))}</span>`;
      case 'notes': return `${it.notes || ""}`;
      default: return '';
    }
  };

  const rows = (data.items || []).map((it) => {
    const pureW = it.weight_pure || 0;
    const stoneW = Number(it.stone_weight) || 0;
    const gemW = Number(it.gem_weight) || 0;
    const metalVal = (it.gold_price || 0) * pureW;
    const tds = cols.map(c => `<td style="text-align:center;width:${c.w};font-size:10px">${getCell(c.key, it, pureW, stoneW, gemW, metalVal)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join("");

  const hasReceivedGold = (data.received_quantity || 0) > 0;
  const remaining = data.remaining_weight || 0;

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${data.invoice_title || 'فاتورة طلبية'} رقم ${data.order_number}</title>
<style>
@page{size:${pageSize} ${orientation};margin:2mm 3mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0}
body{margin:0;padding:2mm 3mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff;font-size:10px}

.header{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:2px;padding-bottom:2px;border-bottom:3px double #1a1a1a}
.header .h-left{flex:0 0 auto;text-align:right}
.header .h-left img{display:block;max-height:80px;width:auto}
.header .h-center{flex:1 1 auto;text-align:center;padding:0 10px}
.header .h-center img{display:block;max-height:90px;width:auto;margin:0 auto}
.header .h-right{flex:0 0 auto;text-align:left;font-size:10px;line-height:1.5}

.info-bar{display:flex;justify-content:space-between;align-items:center;margin:2px 0;font-size:11px}
.customer-box{background:#f0f0f0;border:2px solid #1a1a1a;border-radius:4px;padding:5px 11px;font-size:11px;font-weight:900}

table.main{width:100%;border-collapse:collapse;margin-top:2px}
table.main{table-layout:fixed}
table.main th{background:#2d2d2d;color:#fff;padding:3px 2px;font-size:9px;font-weight:bold;border:1px solid #1a1a1a;text-align:center}
table.main td{padding:3px 2px;font-size:10px;border:1px solid #555;text-align:center}
table.main tr.even{background:#f8f8f8}
table.main tr{page-break-inside:avoid}

.section-row td{background:#e8e8e8;font-weight:bold;font-size:12px;text-align:center;padding:3px;border:1px solid #999;color:#1a1a1a}

.total-row td{padding:3px 4px;font-weight:bold;font-size:10px;border:1px solid #333}
.total-yellow{background:#fef3c7!important;color:#92400e!important;text-align:center!important}
.total-green{background:#d1fae5!important;color:#065f46!important;text-align:center!important}

.footer-section{margin-top:2px}
.breakdown-box{border:2px solid #333;border-radius:4px;margin-top:2px}
.breakdown-title{background:#f0f0f0;padding:2px 6px;font-weight:bold;font-size:11px;border-bottom:1px solid #333}
.breakdown-content{display:flex;gap:0}
.breakdown-details{flex:1;padding:4px 8px}
.breakdown-detail-row{display:flex;justify-content:space-between;padding:1px 0;font-size:10px;border-bottom:1px dotted #ccc}
.breakdown-detail-row:last-child{border-bottom:none}
.detail-green{background:#d1fae5;padding:2px 8px;font-weight:bold;color:#065f46}
.detail-label{font-weight:bold;color:#333}
.detail-value{font-weight:900;color:#b45309}

.stamp-section{flex:0 0 150px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;border-right:1px solid #ccc}
.stamp-img{width:100px;height:100px;border-radius:50%;border:2px solid #b45309}

.remaining-bar{background:#f5f0e6;color:#333;padding:3px 10px;font-weight:bold;font-size:11px;border-radius:4px;margin-top:3px;display:flex;justify-content:space-between;border:1px solid #c9b99a}

.signature-section{display:flex;justify-content:space-between;margin-top:3px;padding-top:3px;border-top:2px solid #1a1a1a}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #1a1a1a;margin-top:20px;padding-top:2px}
.sig-name{font-weight:bold;font-size:10px}
.sig-title{font-size:9px;color:#666}
.sig-img{height:30px;margin-top:-18px}
.sig-date{text-align:center;font-size:11px;margin-top:4px}

.bottom-line{border-top:2px solid #1a1a1a;margin-top:3px;padding-top:2px;display:flex;justify-content:space-between;font-size:9px;color:#555}
${pageSize === 'A5' || pageSize === 'B5' ? `
body{padding:1mm 2mm;font-size:8px;overflow:hidden}
.header{margin-bottom:1px;padding-bottom:1px}.header .h-left img,.header .h-center img{max-height:42px!important}
.info-bar{font-size:9px;margin:1px 0}.customer-box{padding:3px 6px;font-size:9px}
table.main th{padding:2px 1px;font-size:7px;line-height:1.05;word-break:break-word}
table.main td{padding:2px 1px;font-size:7px;line-height:1.05;word-break:break-word;overflow-wrap:anywhere}
.total-row td{padding:2px 1px;font-size:8px}.breakdown-title{font-size:9px;padding:1px 4px}
.breakdown-detail-row{font-size:8px}.remaining-bar{font-size:9px;padding:2px 5px}
` : ''}
</style>
</head><body>

<div class="header">
  <div class="h-left"><img src="${window.location.origin}/R_H1.png" onerror="this.style.display='none'" style="max-height:60px"/></div>
  <div class="h-center"><img src="${window.location.origin}/logo1.png" onerror="this.style.display='none'" style="max-height:90px"/><div style="font-size:15px;font-weight:900;margin-top:2px">${data.invoice_title || 'فاتورة طلبية'}</div></div>
  <div class="h-right">
    <div style="text-align:left"><b>${data.header_invoice_label || `${data.invoice_title || 'فاتورة طلبية'} رقم`}: </b><span style="color:#dc2626;font-weight:900;font-size:12px;font-family:monospace">${data.order_number}</span></div>
    ${data.receipt_number ? `<div style="text-align:left"><b>رقم الإيصال: </b><span style="color:#2563eb;font-weight:700;font-family:monospace">${data.receipt_number}</span></div>` : ''}
    <div style="text-align:left"><b>${data.header_date_label || 'التاريخ'}: </b><span style="border-bottom:1px solid #000;padding:0 4px">${day} / ${month} / ${year}</span></div>
  </div>
</div>

<div class="info-bar">
  <div class="customer-box"> ${data.header_customer_label || data.customer_title || 'العميل'}: / ${data.customer_name || "────────────────────────────"}</div>
</div>

<table class="main">
  <thead>
    <tr>
      ${cols.map(c => `<th style="width:${c.w}">${c.label}</th>`).join('\n      ')}
    </tr>
  </thead>
  <tbody>
    
    ${rows}
    <tr class="total-row">
      ${cols.map(col => {
        switch(col.key) {
          case 'num': return `<td class="total-yellow"></td>`;
          case 'pieces': return `<td class="total-yellow">${sumColumns.includes('pieces') ? tPieces : ''}</td>`;
          case 'desc': return `<td class="total-yellow">المجموع</td>`;
          case 'pureW': return `<td class="total-yellow">${sumColumns.includes('pureW') ? totalWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'withStones': return `<td class="total-yellow">${sumColumns.includes('withStones') ? totalWithStones.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'withGems': return `<td class="total-yellow">${sumColumns.includes('withGems') ? (data.items || []).reduce((s, it) => s + (Number(it.weight_with_gems) || 0), 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'stoneW': return `<td class="total-yellow">${sumColumns.includes('stoneW') ? totalStonesWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'gemW': return `<td class="total-yellow">${sumColumns.includes('gemW') ? totalGemsWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'totalW': return `<td class="total-yellow">${sumColumns.includes('totalW') ? totalCombinedWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'stoneCount': return `<td class="total-yellow">${sumColumns.includes('stoneCount') ? tStonesCount : ''}</td>`;
          case 'gemCount': return `<td class="total-yellow">${sumColumns.includes('gemCount') ? tGemsCount : ''}</td>`;
          case 'goldPrice': return `<td class="total-yellow">${sumColumns.includes('goldPrice') ? (data.items || []).reduce((s, it) => s + (it.gold_price || 0), 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>`;
          case 'workPrice': return `<td class="total-yellow">${sumColumns.includes('workPrice') ? (data.items || []).reduce((s, it) => s + (it.workmanship_per_gram || 0), 0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2}) : ''}</td>`;
          case 'total': return `<td class="total-green">${formatCurrency(total)}</td>`;
          default: return `<td></td>`;
        }
      }).join('')}
    </tr>
  </tbody>
</table>

<div class="remaining-bar"><span><span style="color:#7c6c4a">إجمالي الوزن بالحروف: </span><span style="color:#333">${numberToArabicWeightWords(totalWeight)}</span></span></div>

  <div class="footer-section">
  <div class="breakdown-box">
    <div class="breakdown-title">تفصيل القيمة:</div>
    <div class="breakdown-content">
      <div class="breakdown-details">
        ${!data.visibleBreakdown || data.visibleBreakdown.weight_pure !== false ? `<div class="breakdown-detail-row"><span class="detail-green">وزن الذهب صافي:</span><span class="detail-green">${(data.received_weight || totalWeight).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.weight_with_stones !== false ? `<div class="breakdown-detail-row"><span class="detail-green">وزن ${metalLabel} بالأحجار:</span><span class="detail-green">${totalWithStones.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.weight_with_gems !== false ? `<div class="breakdown-detail-row"><span class="detail-green">وزن ${metalLabel} بالجوهر:</span><span class="detail-green">${totalWithGems.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.stones_weight !== false ? `<div class="breakdown-detail-row"><span class="detail-green">وزن الأحجار:</span><span class="detail-green">${totalStonesWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.gems_weight !== false ? `<div class="breakdown-detail-row"><span class="detail-green">وزن المجارات:</span><span class="detail-green">${totalGemsWeight.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.gems_count !== false ? `<div class="breakdown-detail-row"><span class="detail-green">عدد المجارات:</span><span class="detail-green">${tGemsCount}</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.metal_value !== false ? `<div class="breakdown-detail-row"><span class="detail-green">قيمة المعدن (${metalLabel}):</span><span class="detail-green">${formatCurrency(tMetalVal)}</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.stones_value !== false ? `<div class="breakdown-detail-row"><span class="detail-green">قيمة الأحجار المضافة:</span><span class="detail-green">${formatCurrency(tStonesVal)}</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.gems_value !== false ? `<div class="breakdown-detail-row"><span class="detail-green">قيمة الجوهر المضاف:</span><span class="detail-green">${formatCurrency(tGemsVal)}</span></div>` : ''}
        ${!data.visibleBreakdown || data.visibleBreakdown.workmanship !== false ? `<div class="breakdown-detail-row" style="border-top:1px solid #999;padding-top:2px;margin-top:2px"><span class="detail-green">قيمة يد عاملة (المصنعية):</span><span class="detail-green">${formatCurrency(tWorkVal)}</span></div>` : ''}
        ${(data.manual_gems || 0) > 0 && (!data.visibleBreakdown || data.visibleBreakdown.manual_gems !== false) ? `<div class="breakdown-detail-row"><span class="detail-green">جوهر يدوي مضاف:</span><span class="detail-green">${formatCurrency(data.manual_gems || 0)}</span></div>` : ''}
        ${(data.manual_stones || 0) > 0 && (!data.visibleBreakdown || data.visibleBreakdown.manual_stones !== false) ? `<div class="breakdown-detail-row"><span class="detail-green">أحجار يدوية مضافة:</span><span class="detail-green">${formatCurrency(data.manual_stones || 0)}</span></div>` : ''}
        ${(data.other_add_value || 0) > 0 && (!data.visibleBreakdown || data.visibleBreakdown.other_additions !== false) ? `<div class="breakdown-detail-row"><span class="detail-green">${data.other_add_desc || 'إضافات أخرى'}:</span><span class="detail-green">${formatCurrency(data.other_add_value || 0)}</span></div>` : ''}
        <div class="breakdown-detail-row" style="border-top:2px solid #065f46;padding-top:4px;margin-top:2px"><span class="detail-green" style="font-size:13px">إجمالي القيمة النهائية:</span><span class="detail-green" style="font-size:13px">${formatCurrency(total)}</span></div>
        <div style="border:2px solid #065f46;border-radius:4px;padding:8px;margin-top:6px;background:#f0fdf4">
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px dotted #ccc"><span style="color:#065f46;font-weight:bold">قيمة المصنعية:</span><span style="color:#065f46;font-weight:bold">${formatCurrency(tWorkVal)}</span></div>
          ${totalWeight > 0 && (!data.visibleBreakdown || data.visibleBreakdown.added_weight !== false) ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px dotted #ccc"><span style="color:#065f46;font-weight:bold">الوزن المضاف:</span><span style="color:#065f46;font-weight:bold">${Math.abs(remaining).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} جرام</span></div>` : ''}
        </div>
        ${data.invoice_notes ? `<div class="breakdown-box" style="margin-top:4px"><div class="breakdown-title">ملاحظة:</div><div style="padding:5px 8px;font-size:10px;white-space:pre-wrap">${data.invoice_notes}</div></div>` : ''}
      </div>
      <div class="stamp-section">
        <div style="position:relative;width:130px;height:150px">
          <div style="text-align:center;font-weight:bold;font-size:10px;position:absolute;bottom:0;width:100%">أسامة علي الحمروني</div>
          <div style="text-align:center;font-size:9px;color:#666;position:absolute;bottom:14px;width:100%">يعتمد المدير العام</div>
          <img src="${window.location.origin}/stamp.png" onerror="this.style.display='none'" style="width:120px;height:120px;border-radius:50%;position:absolute;top:0;left:50%;transform:translateX(-50%);opacity:0.75"/>
          <img src="${window.location.origin}/signature.png" onerror="this.style.display='none'" style="height:45px;position:absolute;top:122px;left:50%;transform:translateX(-50%)"/>
        </div>
      </div>
    </div>
  </div>

  <div class="remaining-bar">
    <span><span style="color:#7c6c4a">القيمة الإجمالية بالحروف: </span><span style="color:#333">${words}</span></span>
  </div>
</div>

<div class="bottom-line">
  <div style="text-align:right"><b>الهاتف:</b> ${settings.storePhone || '+218912133218'}</div>
  <div style="text-align:center"><b>ف.ت. ${data.order_number}</b></div>
  <div style="text-align:left"><b>البريد:</b> osama_hamruni@yahoo.com</div>
</div>

</body></html>`;
};

const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

const preloadImages = async (html: string): Promise<string> => {
  const baseUrl = window.location.origin;
  const imgs = [
    { pattern: /src="([^"]*logo1\.png[^"]*)"/, url: `${baseUrl}/logo1.png` },
    { pattern: /src="([^"]*L_H1\.png[^"]*)"/, url: `${baseUrl}/L_H1.png` },
    { pattern: /src="([^"]*R_H1\.png[^"]*)"/, url: `${baseUrl}/R_H1.png` },
    { pattern: /src="([^"]*stamp\.png[^"]*)"/, url: `${baseUrl}/stamp.png` },
    { pattern: /src="([^"]*signature\.png[^"]*)"/, url: `${baseUrl}/signature.png` },
  ];
  let result = html;
  for (const { pattern, url } of imgs) {
    if (result.match(pattern)) {
      const base64 = await imageToBase64(url);
      result = result.replace(pattern, `src="${base64}"`);
    }
  }
  return result;
};

export const printOrderInvoice = async (data: OrderData, pageSize?: string, orientation?: string, visibleCols?: string[]): Promise<void> => {
  let html = generateOrderInvoiceHTML({...data, page_size: pageSize, orientation: orientation as any}, visibleCols);
  const baseUrl = window.location.origin;
  html = html.replace(/src="\/(logo1|L_H1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  html = await preloadImages(html);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
};

export const saveOrderInvoicePDF = async (data: OrderData, pageSize?: string, orientation?: string, visibleCols?: string[]): Promise<void> => {
  const html2pdf = (await import('html2pdf.js')).default;
  let html = generateOrderInvoiceHTML({...data, page_size: pageSize, orientation: orientation as any}, visibleCols);
  const baseUrl = window.location.origin;
  html = html.replace(/src="\/(logo1|L_H1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  html = await preloadImages(html);

  const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
  const container = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = Array.from(parsedDocument.querySelectorAll('style'))
    .map(styleElement => styleElement.textContent || '')
    .join('\n');
  container.appendChild(style);
  Array.from(parsedDocument.body.childNodes).forEach(node => container.appendChild(node.cloneNode(true)));
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = orientation === 'landscape' ? '297mm' : '210mm';
  container.style.background = '#fff';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.opacity = '1';
  container.style.zIndex = '99999';
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    await html2pdf().set({
      margin: [3, 3, 3, 3],
      filename: `${data.order_number || 'invoice'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: orientation === 'landscape' ? 'landscape' : 'portrait' }
    }).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};
