// Shared Invoice Template - Large Fonts, Colors, Logo Right
import { numberToArabicWords, numberToArabicWeightWords } from "../utils/arabic";
import { getSystemSettings } from "./settings";

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  items: any[];
  total_amount: number;
  seller_name: string;
  created_at: string;
  invoice_type: "final" | "draft";
  draft_number?: string;
  page_size?: string;
  orientation?: "portrait" | "landscape";
  payment_method?: "cash" | "card" | "transfer";
  transfer_number?: string;
  bank_name?: string;
  card_receipt_number?: string;
  card_receipt_date?: string;
  print_config?: InvoicePrintConfig;
}

export type InvoiceColumnId = 'serial' | 'item' | 'code' | 'karat' | 'weight' | 'gemstone_weight' | 'stone_weight' | 'gem_weight' | 'gem_count' | 'total_weight' | 'unit_price' | 'total' | 'notes';

export interface InvoicePrintConfig {
  title: string;
  columns: InvoiceColumnId[];
  columnLabels: Partial<Record<InvoiceColumnId, string>>;
  showTotal: boolean;
  showWeight: boolean;
  notes: string;
  signatureName: string;
  signatureTitle: string;
}

export const DEFAULT_INVOICE_PRINT_CONFIG: InvoicePrintConfig = {
  title: 'فاتورة تفصيلية',
  columns: ['serial', 'item', 'karat', 'weight', 'gemstone_weight', 'stone_weight', 'gem_weight', 'gem_count', 'total_weight', 'unit_price', 'total', 'notes'],
  columnLabels: {
    serial: '#',
    item: 'الصنف',
    code: 'الكود',
    karat: 'العيار',
    weight: 'الوزن (جرام)',
    gemstone_weight: 'وزن الجوهر (جرام)',
    stone_weight: 'وزن الأحجار (جرام)',
    gem_weight: 'وزن المجارات (جرام)',
    gem_count: 'عدد المجارات',
    total_weight: 'إجمالي الوزن (جرام)',
    unit_price: 'السعر (د.ل)',
    total: 'الإجمالي (د.ل)',
    notes: 'ملاحظات',
  },
  showTotal: true,
  showWeight: true,
  notes: '',
  signatureName: 'أسامة علي الحمروني',
  signatureTitle: 'يعتمد المدير العام',
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getPrintConfig = (config?: InvoicePrintConfig): InvoicePrintConfig => ({
  ...DEFAULT_INVOICE_PRINT_CONFIG,
  ...config,
  columns: config?.columns?.length
    ? Array.from(new Set(config.columns.map(column => column === 'quantity' ? 'total_weight' : column).filter(column => column !== 'code'))) as InvoiceColumnId[]
    : DEFAULT_INVOICE_PRINT_CONFIG.columns,
  columnLabels: { ...DEFAULT_INVOICE_PRINT_CONFIG.columnLabels, ...(config?.columnLabels || {}) },
});

export const generateInvoiceHTML = (data: InvoiceData): string => {
  const settings = getSystemSettings();
  const date = new Date(data.created_at);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const total = data.total_amount || 0;
  const words = total > 0 ? numberToArabicWords(total) : "صفر";
  const isDraft = data.invoice_type === "draft";
  const printConfig = getPrintConfig(data.print_config);

  const totalWeight = (data.items || []).reduce((sum, it) => sum + (Number(it.weight) || 0) + (Number(it.weight_with_gems ?? it.gemstone_weight) || 0) + (Number(it.stone_weight ?? it.weight_with_stones) || 0) + (Number(it.gem_weight ?? it.gemarat_weight) || 0), 0);
  const totalGoldWeight = (data.items || []).reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
  const totalGemstoneWeight = (data.items || []).reduce((sum, it) => sum + (Number(it.weight_with_gems ?? it.gemstone_weight) || 0), 0);
  const totalStoneWeight = (data.items || []).reduce((sum, it) => sum + (Number(it.stone_weight ?? it.weight_with_stones) || 0), 0);
  const totalGemWeight = (data.items || []).reduce((sum, it) => sum + (Number(it.gem_weight ?? it.gemarat_weight) || 0), 0);
  const totalGemCount = (data.items || []).reduce((sum, it) => sum + (Number(it.gem_count ?? it.gemarat_count) || 0), 0);

  const pageSize = data.page_size || "A5";
  const orientation = data.orientation || "portrait";

  const columnWidths: Record<InvoiceColumnId, string> = {
    serial: '4%', item: '15%', code: '8%', karat: '5%', weight: '8%', gemstone_weight: '8%', stone_weight: '8%', gem_weight: '8%', gem_count: '7%', total_weight: '9%', unit_price: '10%', total: '12%', notes: '12%',
  };
  const renderCell = (column: InvoiceColumnId, it: any, index: number): string => {
    const modelName = it.model_name || it.category || "----";
    const itemCode = it.item_code || "----";
    const karatVal = it.karat;
    const karat = (karatVal && /^\d+$/.test(String(karatVal))) ? karatVal : '';
    const weight = (it.weight || 0).toFixed(2);
    const gemstoneWeight = Number(it.weight_with_gems ?? it.gemstone_weight ?? 0).toFixed(2);
    const stoneWeight = Number(it.stone_weight ?? it.weight_with_stones ?? 0).toFixed(2);
    const gemWeight = Number(it.gem_weight ?? it.gemarat_weight ?? 0).toFixed(2);
    const gemCount = String(it.gem_count ?? it.gemarat_count ?? 0);
    const totalItemWeight = (Number(it.weight) || 0) + (Number(it.weight_with_gems ?? it.gemstone_weight) || 0) + (Number(it.stone_weight ?? it.weight_with_stones) || 0) + (Number(it.gem_weight ?? it.gemarat_weight) || 0);
    const qty = it.quantity || 1;
    const unitPrice = it.price ? Number(it.price).toLocaleString("en-US") : ((it.total || 0) / qty).toLocaleString("en-US");
    const totalItem = (it.total || (it.price || 0) * qty).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2});
    const values: Record<InvoiceColumnId, string> = {
      serial: String(index + 1), item: modelName, code: itemCode, karat, weight, gemstone_weight: gemstoneWeight, stone_weight: stoneWeight, gem_weight: gemWeight, gem_count: gemCount, total_weight: totalItemWeight.toFixed(2), unit_price: unitPrice, total: totalItem, notes: it.notes || '',
    };
    const alignment = column === 'item' || column === 'notes' ? 'right' : 'center';
    const emphasis = column === 'total' ? ';font-weight:bold;color:#b45309' : column === 'karat' ? ';font-weight:bold;color:#b45309' : '';
    return `<td style="text-align:${alignment};width:${columnWidths[column]}${emphasis}">${escapeHtml(values[column])}</td>`;
  };
  const rows = (data.items || []).map((it, i) => `<tr>${printConfig.columns.map(column => renderCell(column, it, i)).join('')}</tr>`).join('');

  const emptyRows = Array.from({length: Math.max(0, 4 - (data.items?.length || 0))}).map(() => `<tr style="height:28px">
      ${printConfig.columns.map(() => '<td></td>').join('')}
    </tr>`).join("");

  const invoiceTitle = `${printConfig.title || (isDraft ? "فاتورة مبدئية" : "فاتورة تفصيلية")} رقم`;
  const invoiceNumber = isDraft ? data.draft_number : data.invoice_number;

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${escapeHtml(invoiceTitle)} ${escapeHtml(invoiceNumber)}</title>
<style>
@page{size:${pageSize} ${orientation};margin:5mm 6mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
body{margin:0;padding:5mm 6mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff}

table.wrap{display:block;width:100%;border:none}
table.wrap>thead,table.wrap>tbody,table.wrap>tfoot{display:block;width:100%}
table.wrap>thead>tr,table.wrap>tbody>tr,table.wrap>tfoot>tr{display:block;width:100%}
table.wrap>thead>tr>td,table.wrap>tbody>tr>td,table.wrap>tfoot>tr>td{display:block;width:100%;border:none;padding:0}
table.wrap>thead,table.wrap>tbody,table.wrap>tfoot{break-inside:avoid;page-break-inside:avoid}

/* HEADER */
.hdr{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:2px;padding-bottom:2px;border-bottom:3px double #1a1a1a}
.hdr .h-left{flex:0 0 auto;text-align:right}
.hdr .h-left img{display:block;max-height:80px;width:auto}
.hdr .h-center{flex:1 1 auto;text-align:center;padding:0 10px}
.hdr .h-center img{display:block;max-height:90px;width:auto;margin:0 auto}
.hdr .h-right{flex:0 0 auto;text-align:left;font-size:10px;line-height:1.5}

/* CUSTOMER */
.cust-box{background:#f8f8f8;border:2px solid #1a1a1a;border-radius:4px;padding:6px 16px;margin:6px 0;display:inline-block}
.cust{font-size:18px;font-weight:900;color:#1a1a1a}

/* INFO ROW */
.irow{display:flex;justify-content:space-between;align-items:center;font-size:14px;margin:4px 0}
.inv-num{color:#dc2626;font-weight:900;font-size:18px;font-family:monospace}

/* SECTION LINE */
.sline{border-top:3px solid #1a1a1a;margin:4px 0}

/* DATA TABLE */
table.data{width:100%;border-collapse:collapse;margin-top:3px}
table.data{table-layout:fixed}
table.data th{background:#1a1a1a;color:#fff;padding:6px 8px;font-size:13px;font-weight:bold;border:1px solid #1a1a1a}
table.data td{padding:6px 8px;font-size:14px;border:1.5px solid #333}
table.data tr:nth-child(even){background:#f5f5f5}
table.data tr{page-break-inside:avoid}

/* TOTALS */
.trow td{padding:6px 8px;text-align:center;font-weight:bold;font-size:14px;background:#e5e7eb;border:1.5px solid #333}
.tval{text-align:center!important;font-weight:900;font-size:16px!important;color:#b45309;background:#fef3c7!important}

/* BOTTOM */
.rline{border-top:3px solid #dc2626;margin:6px 0}
.wline{font-size:13px;border:2px solid #333;padding:5px 8px;margin:4px 0;background:#f8f8f8}
.sbig{font-size:16px;font-weight:900;text-align:right;margin:6px 0;color:#1a1a1a}
.srow{display:flex;justify-content:space-between;margin-top:8px}
.sblk{text-align:center;width:42%}
.sblk .sig-box{position:relative;width:160px;height:170px;margin:0 auto}
.sblk .sig-box img.stamp{width:120px;height:120px;border-radius:50%;position:absolute;top:0;left:50%;transform:translateX(-50%);opacity:0.7}
.sblk .sig-box img.sig{height:45px;position:absolute;top:122px;left:50%;transform:translateX(-50%)}
.sln{border-top:2px solid #1a1a1a;margin-top:16px}
.slbl{font-size:12px;color:#333;margin-top:3px}
.fline{border-top:2px solid #1a1a1a;margin:6px 0}
.frow{display:flex;justify-content:space-between;font-size:12px;color:#333}
${pageSize === 'A5' || pageSize === 'B5' ? `
body{padding:2mm 3mm;font-size:9px;overflow:hidden}
.hdr{margin-bottom:1px;padding-bottom:1px}
.hdr .h-left img,.hdr .h-center img{max-height:42px!important}
.cust-box{padding:3px 8px;margin:2px 0}.cust{font-size:11px}
.irow{font-size:9px;margin:2px 0}.sline{margin:2px 0}
table.data th{padding:3px 1px;font-size:8px;line-height:1.05;word-break:break-word}
table.data td{padding:3px 1px;font-size:8px;line-height:1.05;word-break:break-word;overflow-wrap:anywhere}
.trow td{padding:3px 1px;font-size:9px}.tval{font-size:10px!important}
.wline{font-size:9px;padding:3px 5px}.sbig{font-size:10px;margin:3px 0}.srow{margin-top:3px}.sblk .sig-box{height:145px}.sblk .sig-box img.stamp{width:95px;height:95px}.sblk .sig-box img.sig{top:97px;height:34px}
` : ''}
</style>
</head><body>

<table class="wrap">
<thead><tr><td>

  <!-- HEADER: R_H1 Right + Logo Center + Info Left -->
  <div class="hdr">
    <div class="h-left"><img src="${window.location.origin}/R_H1.png" onerror="this.style.display='none'" style="max-height:60px"/></div>
    <div class="h-center"><img src="${window.location.origin}/logo1.png" onerror="this.style.display='none'" style="max-height:90px"/></div>
    <div class="h-right">
      <div style="text-align:left"><b>${invoiceTitle}: </b><span style="color:#dc2626;font-weight:900;font-size:12px;font-family:monospace">${invoiceNumber}</span></div>
      <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${year} / ${month} / ${day}</span></div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="cust-box">
    <div class="cust">السيد: ${data.customer_name || "────────────────────────────"}</div>
  </div>

  ${data.payment_method && data.payment_method !== 'cash' ? `<div class="irow"><div><b>طريقة الدفع: </b><span style="color:${data.payment_method === 'card' ? '#2563eb' : '#9333ea'};font-weight:bold;font-size:14px">${data.payment_method === 'card' ? 'بطاقة مصرفية' : 'حوالة بنكية'}</span></div></div>` : ''}

  <div class="sline"></div>
</td></tr></thead>

<tbody><tr><td>
<table class="data">
  <thead><tr>
    ${printConfig.columns.map(column => `<th style="width:${columnWidths[column]}">${escapeHtml(printConfig.columnLabels[column] || column)}</th>`).join('')}
  </tr></thead>
  <tbody>
    ${rows}${emptyRows}
    <tr class="trow">
      ${printConfig.columns.map(column => {
        const totals: Partial<Record<InvoiceColumnId, string>> = {
          item: 'المجموع',
          weight: totalGoldWeight.toFixed(2),
          gemstone_weight: totalGemstoneWeight.toFixed(2),
          stone_weight: totalStoneWeight.toFixed(2),
          gem_weight: totalGemWeight.toFixed(2),
          gem_count: String(totalGemCount),
          total_weight: totalWeight.toFixed(2),
        };
        return `<td class="tval">${escapeHtml(totals[column] || '')}</td>`;
      }).join('')}
    </tr>
    ${printConfig.showTotal ? `<tr class="trow"><td colspan="${Math.max(1, printConfig.columns.length - 3)}">اجمالي الفاتورة:</td><td class="tval" colspan="${Math.min(3, printConfig.columns.length)}">${total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td></tr>` : ''}
    ${printConfig.showWeight ? `<tr class="trow"><td colspan="${Math.max(1, printConfig.columns.length - 3)}">إجمالي الوزن:</td><td class="tval" colspan="${Math.min(3, printConfig.columns.length)}">${totalWeight.toFixed(2)} جرام</td></tr><tr class="trow"><td colspan="${printConfig.columns.length}">مجموع الأوزان بالحروف: ${numberToArabicWeightWords(totalWeight)}</td></tr>` : ''}
  </tbody>
</table>
</td></tr></tbody>

<tfoot><tr><td>
  <div class="rline"></div>
  <div class="wline"><b>القيمة الإجمالية بالحروف: </b><b style="font-size:14px;color:#1a1a1a">${words}</b></div>

  <div class="sbig">
    المستخلص / البائع: <span style="border-bottom:2px solid #000;padding:0 10px;font-size:18px">${escapeHtml(data.seller_name || "────────────────────────────")}</span>
  </div>

  <div class="srow">
    <div class="sblk">
      <div class="sig-box">
        <img src="${window.location.origin}/stamp.png" onerror="this.style.display='none'" class="stamp"/>
        <img src="${window.location.origin}/signature.png" onerror="this.style.display='none'" class="sig"/>
      </div>
      <div class="sln"></div>
      <div class="slbl">${escapeHtml(printConfig.signatureName)}</div>
      <div style="font-size:10px;color:#666">${escapeHtml(printConfig.signatureTitle)}</div>
    </div>
    <div class="sblk"><div class="sln"></div><div class="slbl">توقيع المستلم</div></div>
  </div>

  ${printConfig.notes ? `<div class="wline"><b>ملاحظات: </b>${escapeHtml(printConfig.notes)}</div>` : ''}
  <div class="fline"></div>
  <div class="frow">
    <div style="text-align:right"><div><b>الهاتف:</b> +218912133218</div><div><b>البريد:</b> osama_hamruni@yahoo.com</div></div>
    <div style="text-align:center"><b>ف.ت. ${invoiceNumber}</b></div>
    <div style="text-align:left"><div><b>العنوان:</b> ${settings.storeAddress || 'سوق الدهب - طرابلس / ليبيا'}</div><div><b>Address:</b> Sooq Addahab, Tripoli - LIBYA</div></div>
  </div>
</td></tr></tfoot>
</table>

</body></html>`;
};

export const printInvoice = (data: InvoiceData, pageSize?: string, orientation?: string): void => {
  const resolvedPageSize = pageSize || "A5";
  const resolvedOrientation = orientation || "portrait";
  const html = generateInvoiceHTML({...data, page_size: resolvedPageSize, orientation: resolvedOrientation as "portrait" | "landscape"});
  const baseUrl = window.location.origin;
  const processed = html.replace(/src="\/(logo1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  const blob = new Blob([processed], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) return;
  printWindow.onload = () => {
    URL.revokeObjectURL(url);
    printWindow.focus();
    printWindow.print();
  };
};
