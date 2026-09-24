import{g as S,n as w,d as R,e as T,h as D}from"./index-BWU-1gDh.js";const F=e=>{var f,y;const o=S(),i=new Date(e.payment_date),n=i.getDate().toString().padStart(2,"0"),a=(i.getMonth()+1).toString().padStart(2,"0"),p=i.getFullYear(),r=e.total_amount||0;r>0&&w(r);const s=e.items&&e.items.length>0?e.items:[{serial:1,description:`استلام قيمة الفاتورة رقم ${e.invoice_number}`,amount:r,notes:e.notes||""}],c=s.some(t=>t.weight||t.count||t.price_per_gram),v=(((y=(f=s.find(t=>{var d;return(d=t.description)==null?void 0:d.trim()}))==null?void 0:f.description)==null?void 0:y.trim())||"").replace(/^(تم\s+)?(استلام|تسليم)\s*/,"").trim(),g=R(s,v,e.notes||""),m=T(s,e.notes||""),$=s.some(t=>t.item_type==="metal"),x=s.some(t=>t.item_type==="monetary"),h=new Set,_=s.filter(t=>t.item_type!=="metal").reduce((t,d)=>{const l=Number(d.amount||0),u=Math.round(l*100);return l>0&&h.has(u)?t:(h.add(u),t+l)},0),b=c?_:r,z=s.map(t=>{const d=t.price_per_gram===1?"0.00":t.price_per_gram?t.price_per_gram.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"-",l=t.item_type==="metal";return c?`<tr>
        <td style="text-align:center;font-weight:bold">${t.serial}</td>
        <td style="text-align:right;font-weight:bold">${t.description}</td>
        <td style="text-align:center;font-weight:bold">${l&&t.karat||"-"}</td>
        <td style="text-align:center">${t.count||"-"}</td>
        <td style="text-align:center;font-weight:bold;color:#b45309">${t.weight?t.weight.toFixed(2):"-"}</td>
        <td style="text-align:center">${d}</td>
        <td style="text-align:center;font-weight:900;font-size:15px;color:${l?"#999":"#b45309"}">${l?"-":t.amount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+" د.ل"}</td>
        <td style="text-align:center">${t.notes||""}</td>
      </tr>`:`<tr>
      <td style="text-align:center;font-weight:bold">${t.serial}</td>
      <td style="text-align:right;font-weight:bold">${t.description}</td>
      <td style="text-align:center;font-weight:900;font-size:15px;color:#b45309">${t.amount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</td>
      <td style="text-align:center">${t.notes||""}</td>
    </tr>`}).join("");s.length;const k=`<tr><td colspan="${c?8:4}" style="border:none;padding:0;height:6px;background:linear-gradient(to bottom right,transparent calc(50% - 1px),#722f37 calc(50% - 1px),#722f37 calc(50% + 1px),transparent calc(50% + 1px))"></td></tr>`;return`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${g} رقم ${e.receipt_number}</title>
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
    <div style="text-align:left"><b>ايصال استلام رقم: </b><span style="color:#dc2626;font-weight:900;font-size:14px;font-family:monospace">${e.receipt_number}</span></div>
    <div style="text-align:left"><b>رقم الفاتورة: </b><span style="color:#16a34a;font-weight:900;font-family:monospace">${e.invoice_number}</span></div>
    <div style="text-align:left"><b>التاريخ: </b><span style="border-bottom:1px solid #000;padding:0 4px">${p} / ${a} / ${n}</span></div>
  </div>
</div>

<div class="receipt-title">${g}</div>

<div class="cust-info">
  <div class="cust-box">
    <div class="cust">${e.customer_title||"السيد المحترم"}: ${e.customer_name||"────────────────────────────"}</div>
    ${e.customer_phone?`<div class="cust-phone">هاتف: ${e.customer_phone}</div>`:""}
  </div>
</div>

<div class="msg-box">
  تم استلام المُبيّن أدناه من زبوننا الكريم (${e.customer_name||"─────"})
</div>

<div class="sline"></div>

<table class="data">
  <thead><tr>
    ${c?`
    <th style="width:5%">رقم</th>
    <th style="width:25%">البيان</th>
    <th style="width:8%">العيار</th>
    <th style="width:7%">العدد</th>
    <th style="width:9%">الوزن (جـرام)</th>
    <th style="width:11%">سعر الجرام</th>
    <th style="width:20%">القيمة الإجمالية</th>
    <th style="width:15%">ملاحظات</th>
    `:`
    <th style="width:10%">رقم</th>
    <th style="width:45%">البيان</th>
    <th style="width:25%">القيمة الإجمالية</th>
    <th style="width:20%">ملاحظات</th>
    `}
  </tr></thead>
  <tbody>
    ${z}
    ${k}
  </tbody>
</table>

<div class="total-box">
  <div class="total-row"><span>الإجمالي:</span><span style="font-weight:900;color:#b45309">${b.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} د.ل</span></div>
</div>

${x?`
<div class="words-box">
  <b>القيمة الإجمالية بالحروف:</b> ${w(b)} دينار ليبي فقط لا غير
</div>
`:""}
${$&&!x?`
<div class="words-box">
  <b>مجموع الأوزان بالحروف:</b> ${D(s.filter(t=>t.item_type==="metal").reduce((t,d)=>t+(d.weight||0),0))}
</div>
`:""}

<div style="position:relative;margin:10px 0">
  ${m?`<div style="text-align:center;margin-bottom:8px">
    <div style="display:inline-block;border:4px solid #dc2626;color:#dc2626;font-size:22px;font-weight:900;padding:8px 28px;border-radius:10px;transform:rotate(-10deg);opacity:0.8">${m}</div>
  </div>`:""}
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
    <div><b>المحل:</b> ${o.storeName||"مجوهرات الحمروني"}</div>
    <div><b>المدير:</b> ${o.managerName||""}</div>
  </div>
  <div style="text-align:center"><b>رقم الإيصال: ${e.receipt_number}</b></div>
  <div style="text-align:left">
    <div><b>العنوان:</b> ${o.storeAddress||""}</div>
    <div><b>الهاتف:</b> ${o.storePhone||""}</div>
  </div>
</div>

</body></html>`},U=e=>new Promise(o=>{const i=new Image;i.crossOrigin="anonymous",i.onload=()=>{var n;try{const a=document.createElement("canvas");a.width=i.width,a.height=i.height,(n=a.getContext("2d"))==null||n.drawImage(i,0,0),o(a.toDataURL("image/png"))}catch{o(e)}},i.onerror=()=>o(e),i.src=e}),L=async e=>{const o=window.location.origin,i=[[/src="([^"]*\/logo1\.png[^"]*)"/,`${o}/logo1.png`],[/src="([^"]*\/R_H1\.png[^"]*)"/,`${o}/R_H1.png`],[/src="([^"]*\/stamp\.png[^"]*)"/,`${o}/stamp.png`],[/src="([^"]*\/signature\.png[^"]*)"/,`${o}/signature.png`]];let n=e;for(const[a,p]of i)if(a.test(n)){const r=await U(p);n=n.replace(a,`src="${r}"`)}return n},H=async e=>{const o=F(e),i=window.location.origin;let n=o.replace(/src="\/(logo1|R_H1|stamp|signature)\./g,`src="${i}/$1.`);n=await L(n);const a=new Blob([n],{type:"text/html;charset=utf-8"}),p=URL.createObjectURL(a),r=window.open(p,"_blank");r&&(r.onload=()=>{URL.revokeObjectURL(p),r.focus(),setTimeout(()=>r.print(),400)})};export{F as generateMonetaryReceiptHTML,H as printMonetaryReceipt};
