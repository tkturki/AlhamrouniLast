import { getSystemSettings } from "./settings";
import { numberToArabicWords } from "../utils/arabic";

export interface MonetaryReceiptItem {
  serial: number;
  description: string;
  amount: number;
  notes?: string;
  item_type?: string;
  weight?: number;
  count?: number;
  price_per_gram?: number;
}

export interface MonetaryReceiptData {
  receipt_number: string;
  invoice_number: string;
  customer_name: string;
  customer_title?: string;
  customer_phone?: string;
  total_amount: number;
  items?: MonetaryReceiptItem[];
  payment_date: string;
  notes?: string;
}

export const generateMonetaryReceiptHTML = (data: MonetaryReceiptData): string => {
  const settings = getSystemSettings();
  const date = new Date(data.payment_date);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const total = data.total_amount || 0;
  const words = total > 0 ? numberToArabicWords(total) : "صفر";

  const items = data.items && data.items.length > 0 ? data.items : [
    { serial: 1, description: `استلام قيمة الفاتورة رقم ${data.invoice_number}`, amount: total, notes: data.notes || '' }
  ];

  const hasItemDetails = items.some(it => it.weight || it.count || it.price_per_gram);

  const statement = items.find(it => it.description?.trim())?.description?.trim() || '';
  const receiptTitle = statement ? `ايصال استلام ${statement}` : 'ايصال استلام';
  const hasMetal = items.some(it => it.item_type === 'metal');
  const hasMonetary = items.some(it => it.item_type === 'monetary');
  const computedTotal = items.filter(it => it.item_type !== 'metal').reduce((sum, it) => sum + (it.amount || 0), 0);
  const displayTotal = hasItemDetails ? computedTotal : total;

  const rows = items.map(it => {
    const priceGram = it.price_per_gram === 1 ? '0.00' : (it.price_per_gram ? it.price_per_gram.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : '-');
    const isMetal = it.item_type === 'metal';
    if (hasItemDetails) {
      return `<tr>
        <td style="text-align:center;font-weight:bold">${it.serial}</td>
        <td style="text-align:right;font-weight:bold">${it.description}</td>
        <td style="text-align:center">${it.count || '-'}</td>
        <td style="text-align:center;font-weight:bold;color:#b45309">${it.weight ? it.weight.toFixed(2) : '-'}</td>
        <td style="text-align:center">${priceGram}</td>
        <td style="text-align:center;font-weight:900;font-size:15px;color:${isMetal ? '#999' : '#b45309'}">${isMetal ? '-' : it.amount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) + ' د.ل'}</td>
        <td style="text-align:center">${it.notes || ''}</td>
      </tr>`;
    }
    return `<tr>
      <td style="text-align:center;font-weight:bold">${it.serial}</td>
      <td style="text-align:right;font-weight:bold" colspan="3">${it.description}</td>
      <td style="text-align:center;font-weight:900;font-size:15px;color:#b45309">${it.amount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td>
      <td style="text-align:center" colspan="2">${it.notes || ''}</td>
    </tr>`;
  }).join('');

  const dataRowCount = items.length;
  const colCount = hasItemDetails ? 7 : 4;
  const closingRowHtml = `<tr><td colspan="${colCount}" style="border:none;padding:0;height:6px;background:linear-gradient(to bottom right,transparent calc(50% - 1px),#722f37 calc(50% - 1px),#722f37 calc(50% + 1px),transparent calc(50% + 1px))"></td></tr>`;

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${receiptTitle} رقم ${data.receipt_number}</title>
<style>
@page{size:A4 landscape;margin:5mm 6mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
body{margin:0;padding:5mm 6mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:2px;padding-bottom:2px;border-bottom:3px double #1a1a1a}
.hdr .hdr-brand{flex:0 0 auto;text-align:right}
.hdr .hdr-brand img{display:block;max-height:75px;width:auto}
.hdr .hdr-logo{flex:1 1 auto;text-align:center;padding:0 10px}
.hdr .hdr-logo img{display:block;max-height:80px;width:auto;margin:0 auto}
.hdr .hdr-info{flex:0 0 auto;text-align:left;font-size:11px;line-height:1.6}
.receipt-title{font-size:22px;font-weight:900;text-align:center;margin:8px 0;color:#fff;background:#16a34a;padding:6px;border-radius:6px;border:3px solid #166534}
.cust-info{margin:6px 0}
.cust-box{background:#f8f8f8;border:2px solid #1a1a1a;border-radius:4px;padding:5px 14px;display:inline-block}
.cust{font-size:16px;font-weight:900;color:#1a1a1a}
.cust-phone{font-size:13px;color:#333;margin-top:2px}
.sline{border-top:3px solid #1a1a1a;margin:5px 0}
.msg-box{background:#f0fdf4;border:2px solid #16a34a;border-radius:6px;padding:10px 14px;margin:8px 0;font-size:13px;color:#166534;font-weight:bold;line-height:1.8;text-align:center}
table.data{width:100%;border-collapse:collapse;margin-top:4px}
table.data th{background:#1a1a1a;color:#fff;padding:8px 5px;font-size:13px;font-weight:bold;border:1px solid #1a1a1a}
table.data td{padding:8px 6px;font-size:14px;border:1.5px solid #333}
table.data tr:nth-child(even){background:#f5f5f5}
.total-box{margin-top:10px;border:2px solid #1a1a1a;border-radius:6px;overflow:hidden}
.total-row{display:flex;justify-content:space-between;padding:8px 12px;font-size:14px;border-bottom:1px solid #ddd}
.total-row:last-child{border-bottom:none}
.total-grand{background:#1a1a1a;color:#fff;font-weight:900;font-size:16px}
.words-box{border:2px solid #333;padding:6px 12px;margin:8px 0;background:#f8f8f8;font-size:13px}
.srow{display:flex;justify-content:space-between;margin-top:14px}
.sblk{text-align:center;width:42%}
.sln{border-top:2px solid #1a1a1a;margin-top:16px}
.slbl{font-size:12px;color:#333;margin-top:3px}
.fline{border-top:2px solid #1a1a1a;margin:6px 0}
.frow{display:flex;justify-content:space-between;font-size:11px;color:#333}
@media print{body{padding:3mm 4mm}}
</style></head><body>

<div class="hdr">
  <div class="hdr-brand"><img src="/R_H1.png" onerror="this.style.display='none'" style="max-height:75px"/></div>
  <div class="hdr-logo"><img src="/logo1.png" onerror="this.style.display='none'" style="max-height:80px"/></div>
  <div class="hdr-info">
    <div style="text-align:left"><b>ايصال استلام رقم: </b><span style="color:#dc2626;font-weight:900;font-size:14px;font-family:monospace">${data.receipt_number}</span></div>
    <div style="text-align:left"><b>رقم الفاتورة: </b><span style="color:#16a34a;font-weight:900;font-family:monospace">${data.invoice_number}</span></div>
    <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${year} / ${month} / ${day}</span></div>
  </div>
</div>

<div class="receipt-title">${receiptTitle}</div>

<div class="cust-info">
  <div class="cust-box">
    <div class="cust">${data.customer_title || 'السيد المحترم'}: ${data.customer_name || "────────────────────────────"}</div>
    ${data.customer_phone ? `<div class="cust-phone">هاتف: ${data.customer_phone}</div>` : ''}
  </div>
</div>

<div class="msg-box">
  تم استلام المُبيّن أدناه من زبوننا الكريم (${data.customer_name || '─────'}) بناءً على إيصال استلام رقم (${data.invoice_number}) مع جزيل الشكر والأمتنان
</div>

<div class="sline"></div>

<table class="data">
  <thead><tr>
    ${hasItemDetails ? `
    <th style="width:5%">رقم</th>
    <th style="width:30%">البيان</th>
    <th style="width:8%">العدد</th>
    <th style="width:10%">الوزن (جـرام)</th>
    <th style="width:12%">سعر الجرام</th>
    <th style="width:20%">القيمة الإجمالية</th>
    <th style="width:15%">ملاحظات</th>
    ` : `
    <th style="width:10%">رقم</th>
    <th style="width:45%">البيان</th>
    <th style="width:25%">القيمة الإجمالية</th>
    <th style="width:20%">ملاحظات</th>
    `}
  </tr></thead>
  <tbody>
    ${rows}
    ${closingRowHtml}
  </tbody>
</table>

<div class="total-box">
  <div class="total-row"><span>الإجمالي:</span><span style="font-weight:900;color:#b45309">${displayTotal.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</span></div>
</div>

${hasMonetary ? `
<div class="words-box">
  <b>القيمة الإجمالية بالحروف:</b> ${numberToArabicWords(displayTotal)} دينار ليبي فقط لا غير
</div>
` : ''}
${hasMetal && !hasMonetary ? `
<div class="words-box">
  <b>مجموع الأوزان بالحروف:</b> ${numberToArabicWeightWords(items.filter(it => it.item_type === 'metal').reduce((s, it) => s + (it.weight || 0), 0))}
</div>
` : ''}

<div style="position:relative;margin:10px 0">
  <div style="text-align:center;margin-bottom:8px">
    <div style="display:inline-block;border:4px solid #dc2626;color:#dc2626;font-size:22px;font-weight:900;padding:8px 28px;border-radius:10px;transform:rotate(-10deg);opacity:0.8">تم الاستلام</div>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:25%;text-align:center;vertical-align:bottom;padding:4px">
        <img src="${window.location.origin}/stamp.png" style="width:115px;height:115px;border-radius:50%;opacity:0.7"/>
        <div style="border-top:2px solid #1a1a1a;margin-top:4px;padding-top:4px;font-size:12px;color:#333;font-weight:bold">ختم المحل</div>
      </td>
      <td style="width:25%;text-align:center;vertical-align:bottom;padding:4px">
        <img src="${window.location.origin}/signature.png" style="height:55px;margin-top:8px"/>
        <div style="font-size:10px;color:#666;font-weight:bold">يعتمد المدير العام</div>
        <div style="border-top:2px solid #1a1a1a;margin-top:2px;padding-top:4px;font-size:12px;color:#333;font-weight:bold">أسامة علي الحمروني</div>
      </td>
      <td style="width:25%;text-align:center;vertical-align:bottom;padding:4px">
        <div style="height:55px"></div>
        <div style="border-top:2px solid #1a1a1a;margin-top:4px;padding-top:4px;font-size:12px;color:#333;font-weight:bold">توقيع المستلم</div>
      </td>
      <td style="width:25%;text-align:center;vertical-align:bottom;padding:4px">
        <div style="height:55px"></div>
        <div style="border-top:2px solid #1a1a1a;margin-top:4px;padding-top:4px;font-size:12px;color:#333;font-weight:bold">توقيع المسؤول</div>
      </td>
    </tr>
  </table>
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

export const printMonetaryReceipt = (data: MonetaryReceiptData): void => {
  const html = generateMonetaryReceiptHTML(data);
  const baseUrl = window.location.origin;
  const processed = html.replace(/src="\/(logo1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  const blob = new Blob([processed], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) return;
  w.onload = () => { URL.revokeObjectURL(url); w.focus(); w.print(); };
};
