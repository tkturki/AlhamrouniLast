// Delivery Receipt Template (وصل استلام)
import { getSystemSettings } from "./settings";
import { numberToArabicWords, numberToArabicWeightWords } from "../utils/arabic";

export interface ReceiptItem {
  serial: number;
  item_name: string;
  item_type?: 'metal' | 'monetary';
  metal_type: string;
  weight: number;
  stone_weight?: number;
  gem_weight?: number;
  quantity: number;
  unit: string;
  market_value: number;
  notes: string;
  price_per_gram?: number;
  currency?: string;
  exchange_rate?: number;
  monetary_value?: number;
  total_lyd?: number;
  purchase_mode?: 'gold_by_gram';
  description?: string;
}

export interface ReceiptData {
  receipt_number: string;
  customer_name: string;
  customer_title?: string;
  customer_phone?: string;
  delivery_date: string;
  items: ReceiptItem[];
  total_weight: number;
  total_value: number;
  created_at: string;
  page_size?: string;
  orientation?: "portrait" | "landscape";
  total_count?: number;
  arabon?: number;
  remaining?: number;
  visibleCols?: string[];
}

export const generateReceiptHTML = (data: ReceiptData): string => {
  const settings = getSystemSettings();
  const date = new Date(data.created_at);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const pageSize = data.page_size || "A5";
  const orientation = data.orientation || "portrait";

  const allMonetary = data.items?.every(it => it.item_type === 'monetary' && it.purchase_mode !== 'gold_by_gram') ?? false;
  const hasSilver = (data.items || []).some(it => (it.metal_type || '').includes('فضة'));

  const visibleCols = data.visibleCols || (allMonetary
    ? ['serial', 'description', 'currency', 'monetary_value', 'total_lyd']
    : ['serial', 'metal_type', 'description', 'count', 'weight', 'stone_weight', 'gem_weight', 'value', 'notes']);

  const allCols = [
    { id: 'serial', label: '#', width: '5%' },
    { id: 'metal_type', label: allMonetary ? 'نوع الاستلام' : 'نوع المعدن', width: '10%' },
    { id: 'description', label: 'البيان', width: '18%' },
    { id: 'count', label: 'العدد', width: '7%' },
    { id: 'weight', label: 'وزن الذهب الصافي', width: '10%' },
    { id: 'stone_weight', label: 'وزن الأحجار', width: '10%' },
    { id: 'gem_weight', label: 'وزن الجوهر', width: '10%' },
    { id: 'price_per_gram', label: 'سعر الجرام', width: '10%' },
    { id: 'value', label: allMonetary ? 'المبلغ' : 'قيمة المعدن (د.ل)', width: '12%' },
    { id: 'currency', label: 'العملة', width: '8%' },
    { id: 'monetary_value', label: 'المبلغ', width: '12%' },
    { id: 'total_lyd', label: 'الإجمالي (د.ل)', width: '12%' },
    { id: 'notes', label: 'ملاحظات', width: '16%' },
  ];

  const cols = allCols.filter(c => visibleCols.includes(c.id));

  const rows = (data.items || []).map((it) => {
    const isMonetary = it.item_type === 'monetary';
    const isGoldPurchase = it.purchase_mode === 'gold_by_gram';
    const curSym = it.currency === 'USD' ? '$' : it.currency === 'EUR' ? '€' : it.currency === 'GBP' ? '£' : 'د.ل';
    const curName = it.currency === 'USD' ? 'دولار' : it.currency === 'EUR' ? 'يورو' : it.currency === 'GBP' ? 'باوند' : 'دينار ليبي';
    const cells = cols.map(col => {
      switch(col.id) {
        case 'serial': return `<td style="text-align:center">${it.serial}</td>`;
        case 'metal_type': return `<td style="text-align:center">${isGoldPurchase ? 'شراء ذهب' : isMonetary ? '💰 مالية' : (it.metal_type || '-')}</td>`;
        case 'description': return `<td style="text-align:right;font-weight:bold">${it.item_name || it.description || '----'}</td>`;
        case 'count': return `<td style="text-align:center">${isMonetary && !isGoldPurchase ? '-' : (it.quantity || '-')}</td>`;
        case 'weight': return `<td style="text-align:center;font-weight:bold;color:#b45309">${isMonetary && !isGoldPurchase ? '-' : (it.weight || 0).toFixed(2)}</td>`;
        case 'stone_weight': return `<td style="text-align:center">${(it.stone_weight || 0).toFixed(2)}</td>`;
        case 'gem_weight': return `<td style="text-align:center">${(it.gem_weight || 0).toFixed(2)}</td>`;
        case 'price_per_gram': return `<td style="text-align:center">${isMonetary ? '-' : (it.price_per_gram || 0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>`;
        case 'value': return `<td style="text-align:center;font-weight:bold;color:#b45309">${isMonetary ? (it.monetary_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+' '+curSym : (it.market_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+' د.ل'}</td>`;
        case 'currency': return `<td style="text-align:center">${isMonetary ? curName : '-'}</td>`;
        case 'monetary_value': return `<td style="text-align:center;font-weight:bold">${(it.monetary_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} ${curSym}</td>`;
        case 'total_lyd': return `<td style="text-align:center;font-weight:bold;color:#16a34a">${(it.total_lyd||it.market_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+' د.ل'}</td>`;
        case 'notes': return `<td style="text-align:right;max-width:160px;white-space:normal">${(it.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '-'}</td>`;
        default: return `<td></td>`;
      }
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join("");

  const totalCells = cols.map(col => {
    if (col.id === 'serial' || col.id === 'metal_type' || col.id === 'currency') return '<td style="background:#e5e7eb"></td>';
    if (col.id === 'description') return `<td style="text-align:center;font-weight:bold;font-size:14px;background:#e5e7eb">الإجمالي:</td>`;
    if (col.id === 'count') return `<td style="text-align:center;font-weight:900;font-size:16px;color:#b45309;background:#fef3c7">${allMonetary ? '-' : (data.total_count||'-')}</td>`;
    if (col.id === 'weight') return `<td style="text-align:center;font-weight:900;font-size:16px;color:#b45309;background:#fef3c7">${allMonetary ? '-' : (data.total_weight||0).toFixed(2)}</td>`;
    if (col.id === 'price_per_gram') return '<td style="background:#e5e7eb"></td>';
    if (col.id === 'value') return `<td style="text-align:center;font-weight:900;font-size:16px;color:#b45309;background:#fef3c7">${allMonetary ? '-' : (data.total_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+' د.ل'}</td>`;
    if (col.id === 'monetary_value') return `<td style="text-align:center;font-weight:900;font-size:16px;color:#b45309;background:#fef3c7">${allMonetary ? (data.total_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</td>`;
    if (col.id === 'total_lyd') return `<td style="text-align:center;font-weight:900;font-size:16px;color:#16a34a;background:#d1fae5">${(data.total_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td>`;
    return '<td></td>';
  }).join("");

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>وصل استلام رقم ${data.receipt_number}</title>
<style>
@page{size:${pageSize} ${orientation};margin:3mm 4mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
body{margin:0;padding:3mm 4mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:2px;padding-bottom:2px;border-bottom:3px double #1a1a1a}
.hdr .hdr-brand{flex:0 0 auto;text-align:right}
.hdr .hdr-brand img{display:block;max-height:75px;width:auto}
.hdr .hdr-logo{flex:1 1 auto;text-align:center;padding:0 10px}
.hdr .hdr-logo img{display:block;max-height:80px;width:auto;margin:0 auto}
.hdr .hdr-info{flex:0 0 auto;text-align:left;font-size:11px;line-height:1.6}
.receipt-title{font-size:22px;font-weight:900;text-align:center;margin:8px 0;color:#1a1a1a;border:3px solid #1a1a1a;padding:6px;background:#fef3c7}
.cust-info{margin:6px 0}
.cust-box{background:#f8f8f8;border:2px solid #1a1a1a;border-radius:4px;padding:5px 14px;display:inline-block}
.cust{font-size:16px;font-weight:900;color:#1a1a1a}
.cust-phone{font-size:13px;color:#333;margin-top:2px}
.sline{border-top:3px solid #1a1a1a;margin:5px 0}
table.data{width:100%;border-collapse:collapse;margin-top:4px}
table.data th{background:#1a1a1a;color:#fff;padding:6px 5px;font-size:12px;font-weight:bold;border:1px solid #1a1a1a}
table.data td{padding:6px 5px;font-size:13px;border:1.5px solid #333}
table.data tr:nth-child(even){background:#f5f5f5}
table.data tr{page-break-inside:avoid}
.total-box{margin-top:10px;border:2px solid #1a1a1a;border-radius:6px;overflow:hidden}
.total-row{display:flex;justify-content:space-between;padding:8px 12px;font-size:14px;border-bottom:1px solid #ddd}
.total-row:last-child{border-bottom:none}
.total-grand{background:#1a1a1a;color:#fff;font-weight:900;font-size:16px}
.srow{display:flex;justify-content:space-between;margin-top:14px}
.sblk{text-align:center;width:42%}
.sln{border-top:2px solid #1a1a1a;margin-top:16px}
.slbl{font-size:12px;color:#333;margin-top:3px}
.fline{border-top:2px solid #1a1a1a;margin:6px 0}
.frow{display:flex;justify-content:space-between;font-size:11px;color:#333}
@media print{body{padding:2mm 3mm;zoom:0.8}}
</style></head><body>

<div class="hdr">
  <div class="hdr-brand"><img src="${window.location.origin}/R_H1.png" onerror="this.style.display='none'" style="max-height:75px"/></div>
  <div class="hdr-logo"><img src="${window.location.origin}/logo1.png" onerror="this.style.display='none'" style="max-height:80px"/></div>
  <div class="hdr-info">
    <div style="text-align:left"><b>وصل استلام رقم: </b><span style="color:#dc2626;font-weight:900;font-size:14px;font-family:monospace">${data.receipt_number}</span></div>
    <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${year} / ${month} / ${day}</span></div>
    <div style="text-align:left;background:#fef3c7;border:1px solid #d97706;padding:3px 6px;border-radius:3px;font-weight:bold;color:#92400e;margin-top:2px;font-size:10px">تاريخ التسليم: <span style="color:#000">${data.delivery_date && data.delivery_date !== '' ? data.delivery_date : 'غير محدد'}</span></div>
  </div>
</div>

<div class="receipt-title">${allMonetary ? 'استلام قيمة' : 'وصل استلام'}</div>

<div class="cust-info">
  <div class="cust-box">
    <div class="cust">${data.customer_title || 'السيد المحترم'}: ${data.customer_name || "────────────────────────────"}</div>
    ${data.customer_phone ? `<div class="cust-phone">هاتف: ${data.customer_phone}</div>` : ''}
  </div>
</div>

<div class="sline"></div>

<table class="data">
  <thead><tr>
    ${cols.map(c => `<th style="width:${c.width}">${c.label}</th>`).join('')}
  </tr></thead>
  <tbody>
    ${rows}
    <tr><td colspan="${cols.length}" style="height:6px;border:none;padding:0;background:linear-gradient(to bottom right,transparent calc(50% - 1px),#722f37 calc(50% - 1px),#722f37 calc(50% + 1px),transparent calc(50% + 1px))"></td></tr>
    <tr>${totalCells}</tr>
  </tbody>
</table>

<div class="total-box">
  <div class="total-row"><span>الإجمالي:</span><span style="font-weight:bold;color:#b45309">${(data.total_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</span></div>
  ${data.arabon !== undefined && data.arabon > 0 ? `<div class="total-row"><span>العربون المدفوع:</span><span style="font-weight:bold;color:#16a34a">- ${(data.arabon||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</span></div>` : ''}
  ${data.arabon !== undefined && data.arabon > 0 ? `<div class="total-row total-grand"><span>المتبقي:</span><span>${(data.remaining||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</span></div>` : ''}
</div>

<div class="words-box">
  <b>القيمة الإجمالية بالحروف:</b> ${numberToArabicWords(data.total_value || 0)} دينار ليبي فقط لا غير
</div>
${(data.items || []).some(it => it.item_type === 'metal') ? `<div class="words-box"><b>مجموع الأوزان بالحروف:</b> ${numberToArabicWeightWords((data.items || []).filter(it => it.item_type === 'metal').reduce((sum, it) => sum + (it.weight || 0), 0))}</div>` : ''}

<div class="srow">
  <div class="sblk">
    <div style="position:relative;width:150px;height:140px;margin:0 auto">
      <img src="${window.location.origin}/stamp.png" onerror="this.style.display='none'" style="width:120px;height:120px;border-radius:50%;position:absolute;top:0;left:50%;transform:translateX(-50%);opacity:0.7"/>
      <img src="${window.location.origin}/signature.png" onerror="this.style.display='none'" style="height:45px;position:absolute;top:124px;left:50%;transform:translateX(-50%)"/>
    </div>
    <div class="sln"></div>
    <div class="slbl">أسامة علي الحمروني</div>
    <div style="font-size:10px;color:#666">يعتمد المدير العام</div>
  </div>
  <div class="sblk"><div class="sln"></div><div class="slbl">توقيع المستلم</div></div>
</div>

<div class="fline"></div>
<div class="frow">
  <div style="text-align:right">
    <div><b>المحل:</b> ${settings.storeName || 'مجوهرات الحمروني'}</div>
    <div><b>المدير:</b> ${settings.managerName || ''}</div>
  </div>
  <div style="text-align:center"><b>رقم الإيصال: ${data.receipt_number}</b></div>
  <div style="text-align:left">
    <div><b>العنوان:</b> ${settings.storeAddress || ''}</div>
    <div><b>الهاتف:</b> ${settings.storePhone || ''}</div>
  </div>
</div>

</body></html>`;
};

export const printReceipt = (data: ReceiptData, pageSize?: string, orientation?: string): void => {
  const html = generateReceiptHTML({...data, page_size: pageSize, orientation: orientation as any});
  const baseUrl = window.location.origin;
  const processed = html.replace(/src="\/(logo1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  const blob = new Blob([processed], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) return;
  w.onload = () => { URL.revokeObjectURL(url); w.focus(); w.print(); };
};
