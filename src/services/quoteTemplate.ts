// Quote Template - Large Fonts, Colors, Logo Right
import { numberToArabicWords } from "../utils/arabic";
import { getSystemSettings } from "./settings";

export interface QuoteItem {
  model_name: string;
  item_code: string;
  karat: string;
  weight: number;
  price_per_gram: number;
  total: number;
  notes: string;
}

export interface QuoteData {
  quote_number: string;
  customer_name: string;
  seller_name: string;
  items: QuoteItem[];
  total_amount: number;
  created_at: string;
  page_size?: string;
  orientation?: "portrait" | "landscape";
}

export const generateQuoteHTML = (data: QuoteData): string => {
  const settings = getSystemSettings();
  const date = new Date(data.created_at);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const total = data.total_amount || 0;
  const words = total > 0 ? numberToArabicWords(total) : "صفر";

  const pageSize = data.page_size || "A5";
  const orientation = data.orientation || "portrait";

  const rows = (data.items || []).map((it, i) => {
    return `<tr>
      <td style="text-align:center;width:5%">${i + 1}</td>
      <td style="text-align:right;width:22%">${it.model_name || "----"}</td>
      <td style="text-align:center;width:10%;font-family:monospace">${it.item_code || "----"}</td>
      <td style="text-align:center;width:7%;font-weight:bold;color:#b45309">${it.karat || "21"}</td>
      <td style="text-align:center;width:12%">${(it.weight || 0).toFixed(2)}</td>
      <td style="text-align:center;width:14%">${(it.price_per_gram || 0).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td style="text-align:center;width:14%;font-weight:bold;color:#b45309">${(it.total || 0).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td style="text-align:center;width:12%">${it.notes || ""}</td>
    </tr>`;
  }).join("");

  const emptyRows = Array.from({length: Math.max(0, 4 - (data.items?.length || 0))}).map(() => `<tr style="height:28px">
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>عرض سعر ${data.quote_number}</title>
<style>
@page{size:${pageSize} ${orientation};margin:5mm 6mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
body{margin:0;padding:5mm 6mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff}

table.wrap{width:100%;border-collapse:collapse;border:none}
table.wrap>thead{display:table-header-group}
table.wrap>tfoot{display:table-footer-group}
table.wrap>tbody>tr>td{border:none;padding:0}

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

/* INFO */
.irow{display:flex;justify-content:space-between;align-items:center;font-size:14px;margin:4px 0}
.qnum{color:#dc2626;font-weight:900;font-size:18px;font-family:monospace}
.sline{border-top:3px solid #1a1a1a;margin:4px 0}

/* DATA TABLE */
table.data{width:100%;border-collapse:collapse;margin-top:3px}
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
.qnote{font-size:12px;border:2px solid #1a1a1a;padding:5px 8px;margin:4px 0;text-align:center;font-weight:bold;background:#fef3c7}
.sbig{font-size:16px;font-weight:900;text-align:right;margin:6px 0;color:#1a1a1a}
.srow{display:flex;justify-content:space-between;margin-top:8px}
.sblk{text-align:center;width:42%}
.sblk .sig-box{position:relative;width:150px;height:140px;margin:0 auto}
.sblk .sig-box img.stamp{width:110px;height:110px;border-radius:50%;position:absolute;bottom:15px;left:50%;transform:translateX(-50%);opacity:0.6}
.sblk .sig-box img.sig{height:45px;position:absolute;bottom:65px;left:50%;transform:translateX(-50%)}
.sln{border-top:2px solid #1a1a1a;margin-top:16px}
.slbl{font-size:12px;color:#333;margin-top:3px}
.fline{border-top:2px solid #1a1a1a;margin:6px 0}
.frow{display:flex;justify-content:space-between;font-size:12px;color:#333}
</style>
</head><body>

<table class="wrap">
<thead><tr><td>

  <!-- HEADER: R_H1 Right + Logo Center + Info Left -->
  <div class="hdr">
    <div class="h-left"><img src="${window.location.origin}/R_H1.png" onerror="this.style.display='none'" style="max-height:60px"/></div>
    <div class="h-center"><img src="${window.location.origin}/logo1.png" onerror="this.style.display='none'" style="max-height:90px"/></div>
    <div class="h-right">
      <div style="text-align:left"><b>عرض سعر رقم: </b><span style="color:#dc2626;font-weight:900;font-size:12px;font-family:monospace">${data.quote_number}</span></div>
      <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${year} / ${month} / ${day}</span></div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="cust-box">
    <div class="cust">السيد: ${data.customer_name || "────────────────────────────"}</div>
  </div>

  <div class="sline"></div>
</td></tr></thead>

<tbody><tr><td>
<table class="data">
  <thead><tr>
    <th style="width:5%">#</th>
    <th style="width:22%">البيان</th>
    <th style="width:10%">الكود</th>
    <th style="width:7%">العيار</th>
    <th style="width:12%">الوزن (جـرام)</th>
    <th style="width:14%">السعر (د.ل)</th>
    <th style="width:14%">القيمة (د.ل)</th>
    <th style="width:12%">ملاحظات</th>
  </tr></thead>
  <tbody>
    ${rows}${emptyRows}
    <tr class="trow">
      <td colspan="5" style="text-align:center">اجمالي عرض السعر:</td>
      <td class="tval" colspan="3">${total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td>
    </tr>
    <tr class="trow">
      <td colspan="5" style="text-align:center">المدفوع:</td>
      <td class="tval" colspan="3">0.00 د.ل</td>
    </tr>
    <tr class="trow">
      <td colspan="5" style="text-align:center">الباقى:</td>
      <td class="tval" colspan="3">${total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td>
    </tr>
  </tbody>
</table>
</td></tr></tbody>

<tfoot><tr><td>
  <div class="rline"></div>
  <div class="wline"><b>بالحروف: </b><b style="font-size:14px;color:#1a1a1a">${words}</b></div>
  <div class="qnote">هذا العرض قابل لتغير الأسعار حسب السعر اليومي للذهب ويتم تثبيته عند تأكيد الشراء</div>

  <div class="sbig">
    المستخلص / البائع: <span style="border-bottom:2px solid #000;padding:0 10px;font-size:18px">${data.seller_name || "────────────────────────────"}</span>
  </div>

  <div class="srow">
    <div class="sblk">
      <div class="sig-box">
        <img src="${window.location.origin}/stamp.png" onerror="this.style.display='none'" class="stamp"/>
        <img src="${window.location.origin}/signature.png" onerror="this.style.display='none'" class="sig"/>
      </div>
      <div class="sln"></div>
      <div class="slbl">أسامة علي الحمروني</div>
      <div style="font-size:10px;color:#666">يعتمد المدير العام</div>
    </div>
    <div class="sblk"><div class="sln"></div><div class="slbl">توقيع المستلم</div></div>
  </div>

  <div class="fline"></div>
  <div class="frow">
    <div style="text-align:right"><div><b>الهاتف:</b> +218912133218</div><div><b>البريد:</b> osama_hamruni@yahoo.com</div></div>
    <div style="text-align:center"><b>ف.ت. ${data.quote_number}</b></div>
    <div style="text-align:left"><div><b>العنوان:</b> ${settings.storeAddress || 'سوق الدهب - طرابلس / ليبيا'}</div><div><b>Address:</b> Sooq Addahab, Tripoli - LIBYA</div></div>
  </div>
</td></tr></tfoot>
</table>

</body></html>`;
};

export const printQuote = (data: QuoteData, copies: number = 2): void => {
  const html = generateQuoteHTML(data);
  const baseUrl = window.location.origin;
  const processed = html.replace(/src="\/(logo1|R_H1|stamp|signature)\./g, `src="${baseUrl}/$1.`);
  const blob = new Blob([processed], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) return;
  printWindow.onload = () => {
    URL.revokeObjectURL(url);
    printWindow.focus();
    let printCount = 0;
    const doPrint = () => {
      printWindow.print();
      printCount++;
      if (printCount < copies) {
        setTimeout(doPrint, 800);
      }
    };
    setTimeout(doPrint, 600);
  };
};
