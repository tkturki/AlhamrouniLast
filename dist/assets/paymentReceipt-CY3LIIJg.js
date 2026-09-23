import{g,n as s,f as o}from"./index-DxtLgaTK.js";const b=t=>{const a=g(),i=new Date(t.payment_date),d=i.getDate().toString().padStart(2,"0"),r=(i.getMonth()+1).toString().padStart(2,"0"),n=i.getFullYear(),e=t.remaining??t.total_amount-t.amount_paid,p=e<=0,l=t.amount_paid>0?s(t.amount_paid):"صفر";t.total_amount>0&&s(t.total_amount),e>0&&s(e);const c=t.page_size||"A5",x=t.orientation||"portrait";return`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>إيصال سداد رقم ${t.receipt_number}</title>
<style>
@page{size:${c} ${x};margin:6mm 8mm}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0}
body{margin:0;padding:6mm 8mm;font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;background:#fff;font-size:11px}

.header{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:2px;padding-bottom:2px;border-bottom:3px double #1a1a1a}
.header .h-left{flex:0 0 auto;text-align:right}
.header .h-left img{display:block;max-height:70px;width:auto}
.header .h-center{flex:1 1 auto;text-align:center;padding:0 10px}
.header .h-center img{display:block;max-height:75px;width:auto;margin:0 auto}
.header .h-right{flex:0 0 auto;text-align:left;font-size:10px;line-height:1.5}

.receipt-title{font-size:18px;font-weight:900;text-align:center;margin:6px 0;color:#fff;background:#16a34a;padding:5px;border-radius:4px;border:2px solid #166534}

.info-bar{display:flex;justify-content:space-between;align-items:center;margin:4px 0;font-size:11px}
.customer-box{background:#f0f0f0;border:2px solid #1a1a1a;border-radius:4px;padding:4px 12px;font-size:13px;font-weight:900}

.breakdown-box{border:2px solid #333;border-radius:4px;margin-top:4px;overflow:hidden}
.breakdown-title{background:#f0f0f0;padding:2px 6px;font-weight:bold;font-size:11px;border-bottom:1px solid #333}
.breakdown-content{display:flex;gap:0}
.breakdown-details{flex:1;padding:4px 8px}
.breakdown-detail-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px dotted #ccc}
.breakdown-detail-row:last-child{border-bottom:none}
.detail-green{background:#d1fae5;padding:2px 6px;font-weight:bold;color:#065f46}
.detail-red{background:#fee2e2;padding:2px 6px;font-weight:bold;color:#991b1b}
.detail-gold{background:#fef3c7;padding:2px 6px;font-weight:bold;color:#92400e}

.stamp-section{flex:0 0 150px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;border-right:1px solid #ccc}

.words-bar{background:#f5f0e6;color:#333;padding:3px 10px;font-weight:bold;font-size:10px;border-radius:4px;margin-top:3px;display:flex;justify-content:space-between;border:1px solid #c9b99a}

.paid-stamp{text-align:center;margin:6px 0}
.paid-stamp span{display:inline-block;border:3px solid #16a34a;color:#16a34a;font-size:20px;font-weight:900;padding:5px 20px;border-radius:6px;transform:rotate(-5deg);opacity:0.85}

.remaining-box{border:2px solid #065f46;border-radius:4px;padding:6px;margin:4px 0;background:#f0fdf4}
.remaining-box .big-amount{text-align:center;font-size:18px;font-weight:900;color:#065f46;margin:4px 0}

.bottom-line{border-top:2px solid #1a1a1a;margin-top:3px;padding-top:2px;display:flex;justify-content:space-between;font-size:9px;color:#555}

@media print{body{padding:4mm 6mm}}
</style></head><body>

<div class="header">
  <div class="h-left"><img src="${window.location.origin}/R_H1.png" onerror="this.style.display='none'" style="max-height:70px"/></div>
  <div class="h-center"><img src="${window.location.origin}/logo1.png" onerror="this.style.display='none'" style="max-height:75px"/></div>
  <div class="h-right">
    <div style="text-align:left"><b>إيصال سداد رقم: </b><span style="color:#dc2626;font-weight:900;font-size:12px;font-family:monospace">${t.receipt_number}</span></div>
    <div style="text-align:left"><b>رقم الفاتورة: </b><span style="color:#16a34a;font-weight:900;font-family:monospace">${t.invoice_number}</span></div>
    <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${n} / ${r} / ${d}</span></div>
  </div>
</div>

<div class="receipt-title">إيصال سداد</div>

<div class="info-bar">
  <div class="customer-box">السيد المحترم: ${t.customer_name||"────────────────────────────"}</div>
</div>

<table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:11px">
  <tr>
    <th style="background:#2d2d2d;color:#fff;padding:4px 6px;border:1px solid #1a1a1a;text-align:center;width:33%">القيمة الإجمالية</th>
    <th style="background:#2d2d2d;color:#fff;padding:4px 6px;border:1px solid #1a1a1a;text-align:center;width:33%">المبلغ المدفوع</th>
    <th style="background:#2d2d2d;color:#fff;padding:4px 6px;border:1px solid #1a1a1a;text-align:center;width:33%">المبلغ المتبقي</th>
  </tr>
  <tr>
    <td style="padding:4px 6px;border:1px solid #555;text-align:center;font-weight:900;font-size:13px;color:#1a1a1a">${o(t.total_amount)} د.ل</td>
    <td style="padding:4px 6px;border:1px solid #555;text-align:center;font-weight:900;font-size:13px;color:#166534;background:#d1fae5">${o(t.amount_paid)} د.ل</td>
    <td style="padding:4px 6px;border:1px solid #555;text-align:center;font-weight:900;font-size:13px;color:${e>0?"#991b1b":"#166534"};background:${e>0?"#fee2e2":"#d1fae5"}">${o(e)} د.ل</td>
  </tr>
</table>

${p?"":`
<div class="remaining-box">
  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;border-bottom:1px dotted #ccc"><span style="color:#065f46;font-weight:bold">المبلغ الإجمالي:</span><span style="color:#065f46;font-weight:bold">${o(t.total_amount)} د.ل</span></div>
  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;border-bottom:1px dotted #ccc"><span style="color:#065f46;font-weight:bold">المدفوع حتى الآن:</span><span style="color:#065f46;font-weight:bold">${o(t.amount_paid)} د.ل</span></div>
  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px"><span style="color:#991b1b;font-weight:bold">المتبقي للسداد:</span><span style="color:#991b1b;font-weight:900">${o(e)} د.ل</span></div>
</div>
`}

${t.notes?`<div style="background:#f8f8f8;border:1px solid #ddd;padding:4px 8px;border-radius:4px;margin:4px 0;font-size:10px"><b>ملاحظات:</b> ${t.notes}</div>`:""}

<div class="breakdown-box">
  <div class="breakdown-title">تفاصيل السداد:</div>
  <div class="breakdown-content">
    <div class="breakdown-details">
      <div class="breakdown-detail-row"><span class="detail-gold">قيمة الفاتورة الإجمالية:</span><span class="detail-gold">${o(t.total_amount)} د.ل</span></div>
      <div class="breakdown-detail-row"><span class="detail-green">المبلغ المدفوع:</span><span class="detail-green">${o(t.amount_paid)} د.ل</span></div>
      ${e>0?`<div class="breakdown-detail-row"><span class="detail-red">المتبقي للسداد:</span><span class="detail-red">${o(e)} د.ل</span></div>`:""}
      <div class="breakdown-detail-row" style="border-top:1px solid #999;padding-top:2px;margin-top:2px"><span class="detail-green">بالحروف:</span><span class="detail-green">${l} دينار ليبي</span></div>
      ${p?'<div style="text-align:center;margin-top:12px;padding:8px 0"><div style="display:inline-block;border:3px solid #16a34a;color:#16a34a;font-size:16px;font-weight:900;padding:5px 18px;border-radius:6px;transform:rotate(-5deg);opacity:0.85">تم السداد بالكامل - خالص مع الشكر</div></div>':""}
    </div>
    <div class="stamp-section">
      <div style="position:relative;width:130px;height:150px">
        <div style="text-align:center;font-weight:bold;font-size:10px;position:absolute;bottom:0;width:100%">أسامة علي الحمروني</div>
        <div style="text-align:center;font-size:9px;color:#666;position:absolute;bottom:14px;width:100%">يعتمد المدير العام</div>
        <img src="${window.location.origin}/signature.png" onerror="this.style.display='none'" style="height:50px;position:absolute;bottom:28px;left:50%;transform:translateX(-50%)"/>
        <img src="${window.location.origin}/stamp.png" onerror="this.style.display='none'" style="width:110px;height:110px;border-radius:50%;position:absolute;bottom:35px;left:50%;transform:translateX(-50%);opacity:0.6"/>
      </div>
    </div>
  </div>
</div>

<div class="bottom-line">
  <div style="text-align:right"><b>الهاتف:</b> ${a.storePhone||"+218912133218"}</div>
  <div style="text-align:center"><b>إ.س. ${t.receipt_number}</b></div>
  <div style="text-align:left"><b>البريد:</b> osama_hamruni@yahoo.com</div>
</div>

</body></html>`},m=t=>{const a=b(t),i=window.location.origin,d=a.replace(/src="\/(logo1|R_H1|stamp|signature)\./g,`src="${i}/$1.`),r=new Blob([d],{type:"text/html;charset=utf-8"}),n=URL.createObjectURL(r),e=window.open(n,"_blank");e&&(e.onload=()=>{URL.revokeObjectURL(n),e.focus(),e.print()})};export{b as generatePaymentReceiptHTML,m as printPaymentReceipt};
