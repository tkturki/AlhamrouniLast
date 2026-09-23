import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Printer, CheckCircle, AlertTriangle, DollarSign, User, Coins, X, Trash2, Calculator, Edit, FileDown } from 'lucide-react';
import { getSystemSettings } from '../services/settings';

const fmt = (n: number | undefined | null, d = 2): string => {
  if (n === undefined || n === null || isNaN(n)) return '0.00';
  return n.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function tafqeet(num: number): string {
  if (num === 0 || isNaN(num)) return 'صفر دينار ليبي';
  const o = ['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
  const t = ['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
  const h = ['','مائة','مئتان','ثلاثمئة','أربعمئة','خمسمئة','ستمئة','سبعمئة','ثمانمئة','تسعمئة'];
  const c3 = (n: number): string => {
    if (n === 0) return '';
    const a = Math.floor(n/100), b = n%100, c = Math.floor(b/10), d = b%10;
    let r = a > 0 ? h[a] : '';
    if (c === 1) { if (a > 0) r += ' و'; r += o[10+d]; } else { if (d > 0) { if (a > 0 || c > 0) r += ' و'; r += o[d]; } if (c > 0) { if (a > 0) r += ' و'; r += t[c]; } }
    return r;
  };
  const s = num < 0 ? 'سالب ' : '';
  num = Math.abs(Math.round(num * 100) / 100);
  const ip = Math.floor(num), dp = Math.round((num - ip) * 100);
  const m = Math.floor(ip/1000000), th = Math.floor((ip%1000000)/1000), rm = ip%1000;
  let r = '';
  if (m > 0) { r += c3(m) + (m === 1 ? ' مليون' : m === 2 ? ' مليونان' : ' ملايين'); }
  if (th > 0) { if (r) r += ' و'; r += th === 1 ? 'ألف' : th === 2 ? 'ألفان' : c3(th) + ' آلاف'; }
  if (rm > 0) { if (r) r += ' و'; r += c3(rm); }
  if (dp > 0) r += ' و ' + dp + '/100';
  return s + r + ' دينار ليبي';
}

const SK_A = 'gold_advances2', SK_S = 'gold_settlements2';
const loadL = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const saveL = <T,>(k: string, d: T) => localStorage.setItem(k, JSON.stringify(d));

interface Adv { id: string; emp: string; amt: number; paid: number; status: string; desc: string; date: string; settlements: { amt: number; date: string; note: string; invNum: string }[]; }
interface Sett { id: string; biaan: string; taf: string; no3: string; wazn: number; sjg: number; val: number; usd: number; usdr: number; eur: number; eurr: number; no3t: string; dtar: string; dtas: string; hal: string; date: string; lsalih: string; }

interface ColDef { key: string; label: string; num: boolean; printKey: string; }

const goldK = ['ذهب','سبائك','فضة','مجوهرات','ألماس','أحجار'];

const INP = React.memo(({ v, set, ph, lb, onFocus, onBlur }: { v: string; set: (s: string) => void; ph?: string; lb?: string; onFocus?: () => void; onBlur?: () => void }) => (
  <div>
    {lb && <label className="block text-gray-300 text-sm mb-1">{lb}</label>}
    <input type="text" value={v} onChange={e => set(e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder={ph || '0'}
      className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"
      style={{ textAlign: 'right' }} autoComplete="off" />
  </div>
));

export default function AdvancesPage() {
  const [tab, setTab] = useState('adv');
  const [advs, setAdvs] = useState<Adv[]>([]);
  const [setts, setSetts] = useState<Sett[]>([]);
  const [srch, setSrch] = useState('');
  const [flt, setFlt] = useState('all');
  const [vAdd, setVAdd] = useState(false);
  const [vStl, setVStl] = useState(false);
  const [vNew, setVNew] = useState(false);
  const [editingSett, setEditingSett] = useState<Sett | null>(null);
  const [editingAdv, setEditingAdv] = useState<Adv | null>(null);
  const [nLsalih, setNLsalih] = useState('');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const allCols: ColDef[] = [
    { key: 'num', label: '#', num: false, printKey: 'num' },
    { key: 'biaan', label: 'البيان', num: false, printKey: 'biaan' },
    { key: 'no3', label: 'النوع', num: false, printKey: 'no3' },
    { key: 'taf', label: 'التوضيح', num: false, printKey: 'taf' },
    { key: 'wazn', label: 'الوزن', num: true, printKey: 'wazn' },
    { key: 'sjg', label: 'سعر الجرام', num: true, printKey: 'sjg' },
    { key: 'usd', label: 'قيمة الدولار', num: true, printKey: 'usd' },
    { key: 'usdr', label: 'سعر الدولار', num: true, printKey: 'usdr' },
    { key: 'eur', label: 'قيمة اليورو', num: true, printKey: 'eur' },
    { key: 'eurr', label: 'سعر اليورو', num: true, printKey: 'eurr' },
    { key: 'lsalih', label: 'لصالح', num: false, printKey: 'lsalih' },
    { key: 'no3t', label: 'نوع التسوية', num: false, printKey: 'no3t' },
    { key: 'dtar', label: 'تاريخ التسليم', num: false, printKey: 'dtar' },
    { key: 'dtas', label: 'تاريخ التسوية', num: false, printKey: 'dtas' },
    { key: 'hal', label: 'الحالة', num: false, printKey: 'hal' },
    { key: 'val', label: 'القيمة (د.ل)', num: true, printKey: 'val' },
  ];
  const [selCols, setSelCols] = useState<string[]>(allCols.map(c => c.key));
  const toggleCol = (k: string) => setSelCols(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const activeCols = allCols.filter(c => selCols.includes(c.key));

  const getColVal = (s: Sett, k: string, i: number): string => {
    switch (k) {
      case 'num': return (i + 1).toString();
      case 'biaan': return s.biaan || '-';
      case 'no3': return s.no3 || '-';
      case 'taf': return s.taf || '-';
      case 'wazn': return s.wazn > 0 ? fmt(s.wazn) + ' جرام' : '-';
      case 'sjg': return s.sjg > 0 ? fmt(s.sjg) : '-';
      case 'usd': return s.usd > 0 ? '$' + fmt(s.usd) : '-';
      case 'usdr': return s.usdr > 0 ? fmt(s.usdr) : '-';
      case 'eur': return s.eur > 0 ? '€' + fmt(s.eur) : '-';
      case 'eurr': return s.eurr > 0 ? fmt(s.eurr) : '-';
      case 'lsalih': return s.lsalih || '-';
      case 'no3t': return s.no3t || '-';
      case 'dtar': return s.dtar ? new Date(s.dtar).toLocaleDateString('en-CA') : '-';
      case 'dtas': return s.dtas ? new Date(s.dtas).toLocaleDateString('en-CA') : '-';
      case 'hal': return s.hal || '-';
      case 'val': return fmt(s.val) + ' د.ل';
      default: return '-';
    }
  };

  const getColSum = (items: Sett[], k: string): string => {
    if (k === 'wazn') return fmt(items.reduce((s, x) => s + x.wazn, 0)) + ' جرام';
    if (k === 'sjg') return fmt(items.reduce((s, x) => s + x.sjg, 0));
    if (k === 'usd') return '$' + fmt(items.reduce((s, x) => s + x.usd, 0));
    if (k === 'usdr') return fmt(items.reduce((s, x) => s + x.usdr, 0));
    if (k === 'eur') return '€' + fmt(items.reduce((s, x) => s + x.eur, 0));
    if (k === 'eurr') return fmt(items.reduce((s, x) => s + x.eurr, 0));
    if (k === 'val') return fmt(items.reduce((s, x) => s + x.val, 0)) + ' د.ل';
    return '';
  };

  const st = getSystemSettings();
  const logoBase = window.location.origin;

  const imgCache: Record<string, string> = {};
  const loadImg = async (name: string): Promise<string> => {
    if (imgCache[name]) return imgCache[name];
    try {
      const resp = await fetch(`/${name}`, { cache: 'no-store' });
      if (!resp.ok) { console.error('Image fetch failed:', name, resp.status); return ''; }
      const blob = await resp.blob();
      const b64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = () => resolve('');
        r.readAsDataURL(blob);
      });
      imgCache[name] = b64;
      return b64;
    } catch (e) { console.error('Image load error:', name, e); return ''; }
  };

  const loadAllHeaders = async () => {
    const [logo, rh, lh] = await Promise.all([loadImg('logo1.png'), loadImg('R_H1.png'), loadImg('L_H1.png')]);
    return { logo, rh, lh };
  };

  const printCSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:15px;direction:rtl;text-align:center;background:#fff;color:#000}
    .r{width:100%;max-width:520px;margin:0 auto;border:3px solid #000;padding:20px}
    .hd{display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px}
    .hd-r{text-align:right;flex:1}.sn{font-size:24px;font-weight:bold;color:#000}.ph{font-size:13px;color:#333;margin-top:2px}
    .hd-c{flex:0;text-align:center;padding:0 12px}.logo{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #000}
    .hd-l{text-align:left;flex:1}.tt{font-size:17px;font-weight:bold;color:#000;padding:5px 14px;border:2px solid #000;border-radius:5px;display:inline-block}
    .rw{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px}
    .lb{font-weight:bold;color:#000}.vl{color:#222}
    .ab{background:#e8e8e8;padding:14px;margin:14px 0;border:3px solid #000;border-radius:8px}
    .av{font-size:32px;font-weight:bold;color:#000}
    .sg{display:flex;justify-content:space-between;margin-top:25px;padding-top:10px}
    .sb{text-align:center;width:45%}.sl{border-top:2px solid #000;margin-top:30px;padding-top:5px;font-size:14px;font-weight:bold}
    @media print{body{padding:0}.r{border:2px solid #000}*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}`;

  const printHeader = (title: string, subtitle?: string) => `
    <div class="hd">
      <div class="hd-r"><div class="sn">${st.storeName}</div><div class="ph">هاتف: ${st.storePhone}</div></div>
      <div class="hd-c"><img src="${logoBase}/logo1.png" class="logo" /></div>
      <div class="hd-l"><div class="tt">${title}</div>${subtitle ? `<div style="font-size:12px;color:#444;margin-top:4px">${subtitle}</div>` : ''}</div>
    </div>`;
  const nValManual = useRef(false);

  const [fName, setFName] = useState('');
  const [fAmt, setFAmt] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [sName, setSName] = useState('');
  const [sAmt, setSAmt] = useState('');
  const [sNote, setSNote] = useState('');
  const [sInvNum, setSInvNum] = useState('');

  const [rUsd, setRUsd] = useState('4.83');
  const [rEur, setREur] = useState('5.25');
  const [cAmt, setCAmt] = useState('');
  const [cFrom, setCFrom] = useState('USD');
  const [cTo, setCTo] = useState('LYD');

  const [nBiaan, setNBiaan] = useState('');
  const [nTaf, setNTaf] = useState('');
  const [nNo3, setNNo3] = useState('');
  const [nWazn, setNWazn] = useState('');
  const [nSjg, setNSjg] = useState('');
  const [nUsd, setNUsd] = useState('');
  const [nUsdr, setNUsdr] = useState('');
  const [nEur, setNEur] = useState('');
  const [nEurr, setNEurr] = useState('');
  const [nVal, setNVal] = useState('');
  const [nNo3t, setNNo3t] = useState('جزئية');
  const [nDtar, setNDtar] = useState('');
  const [nDtas, setNDtas] = useState('');
  const [nHal, setNHal] = useState('معلقة');

  useEffect(() => { setAdvs(loadL(SK_A, [])); setSetts(loadL(SK_S, [])); }, []);

  const rU = parseFloat(rUsd) || 0, rE = parseFloat(rEur) || 0;
  const isGold = goldK.some(g => nNo3.includes(g));

  const cResult = useMemo(() => {
    const a = parseFloat(cAmt) || 0;
    if (cFrom === cTo) return a;
    if (cFrom === 'LYD' && cTo === 'USD') return rU ? a / rU : 0;
    if (cFrom === 'LYD' && cTo === 'EUR') return rE ? a / rE : 0;
    if (cFrom === 'USD' && cTo === 'LYD') return a * rU;
    if (cFrom === 'EUR' && cTo === 'LYD') return a * rE;
    if (cFrom === 'USD' && cTo === 'EUR') return rE ? (a * rU) / rE : 0;
    if (cFrom === 'EUR' && cTo === 'USD') return rU ? (a * rE) / rU : 0;
    return 0;
  }, [cAmt, cFrom, cTo, rU, rE]);

  const nCalcAuto = useMemo(() => {
    const vD = parseFloat(nUsd) || 0, vDr = parseFloat(nUsdr) || rU;
    const vE = parseFloat(nEur) || 0, vEr = parseFloat(nEurr) || rE;
    const vW = parseFloat(nWazn) || 0, vP = parseFloat(nSjg) || 0;
    if (vD > 0 && vDr > 0) return vD * vDr;
    if (vE > 0 && vEr > 0) return vE * vEr;
    if (vW > 0 && vP > 0) return vW * vP;
    return 0;
  }, [nUsd, nUsdr, nEur, nEurr, nWazn, nSjg, rU, rE]);

  const nCalc = useMemo(() => {
    const vF = parseFloat(nVal);
    if (!isNaN(vF) && vF > 0) return vF;
    return nCalcAuto;
  }, [nVal, nCalcAuto]);

  useEffect(() => {
    if (!nValManual.current && nCalcAuto > 0) {
      setNVal(nCalcAuto.toString());
    }
  }, [nCalcAuto]);

  const liveVal = useMemo(() => {
    if (tab === 'adv') return parseFloat(fAmt) || 0;
    return nCalc;
  }, [tab, fAmt, nCalc]);

  const focusedDisplayVal = useMemo(() => {
    if (!focusedKey) return null;
    const map: Record<string, string> = { fAmt, sAmt, nWazn, nSjg, nUsd, nUsdr, nEur, nEurr, nVal, cAmt, rUsd, rEur };
    const raw = map[focusedKey];
    if (raw === undefined) return null;
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }, [focusedKey, fAmt, sAmt, nWazn, nSjg, nUsd, nUsdr, nEur, nEurr, nVal, cAmt, rUsd, rEur]);

  const doAddAdv = () => {
    const a = parseFloat(fAmt) || 0;
    if (!fName || a <= 0) { alert('أدخل اسم الموظف والمبلغ'); return; }
    const n: Adv = { id: Date.now().toString(), emp: fName, amt: a, paid: 0, status: 'pending', desc: fDesc, date: new Date().toISOString(), settlements: [] };
    const u = [n, ...advs]; saveL(SK_A, u); setAdvs(u);
    setVAdd(false); setFName(''); setFAmt(''); setFDesc('');
  };

  const doSettle = () => {
    const a = parseFloat(sAmt) || 0;
    if (!sName || a <= 0) { alert('أدخل المبلغ'); return; }
    const settlement = { amt: a, date: new Date().toISOString(), note: sNote, invNum: sInvNum };
    const u = advs.map(x => {
      if (x.emp === sName && x.status !== 'settled') {
        const np = (x.paid || 0) + a;
        const prevSettlements = x.settlements || [];
        return { ...x, paid: np, status: np >= x.amt ? 'settled' : 'partial', settlements: [...prevSettlements, settlement] };
      }
      return x;
    });
    saveL(SK_A, u); setAdvs(u);
    setVStl(false); setSName(''); setSAmt(''); setSNote(''); setSInvNum('');
  };

  const doDelAdv = (id: string) => { if (!confirm('حذف؟')) return; const u = advs.filter(x => x.id !== id); saveL(SK_A, u); setAdvs(u); };

  const doEditAdv = (a: Adv) => {
    setEditingAdv(a);
    setFName(a.emp); setFAmt(a.amt.toString()); setFDesc(a.desc);
    setVAdd(true);
  };

  const doUpdateAdv = () => {
    if (!editingAdv) return;
    const a = parseFloat(fAmt) || 0;
    if (!fName || a <= 0) { alert('أدخل اسم الموظف والمبلغ'); return; }
    const u = advs.map(x => x.id === editingAdv.id ? { ...x, emp: fName, amt: a, desc: fDesc } : x);
    saveL(SK_A, u); setAdvs(u);
    setEditingAdv(null); setVAdd(false); setFName(''); setFAmt(''); setFDesc('');
  };

  const printAdv = (a: Adv) => {
    const d = new Date(a.date);
    const ds = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    const rem = a.amt - (a.paid || 0);
    const settlements = a.settlements || [];
    const settRows = settlements.map((s, i) => {
      const sd = new Date(s.date);
      const sds = `${sd.getFullYear()}/${String(sd.getMonth()+1).padStart(2,'0')}/${String(sd.getDate()).padStart(2,'0')}`;
      return `<tr style="${i % 2 === 0 ? 'background:#f0f0f0;' : ''}"><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${i + 1}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${fmt(s.amt)} د.ل</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${sds}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${s.invNum || '-'}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${s.note || '-'}</td></tr>`;
    }).join('');
    const settTable = settlements.length > 0 ? `
      <div style="margin-top:15px;border:1px solid #333;border-radius:5px;overflow:hidden">
        <div style="background:#000;color:#fff;padding:6px;text-align:center;font-weight:bold;font-size:13px">تفاصيل التسويات</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#ddd"><th style="padding:5px;border:1px solid #ccc">#</th><th style="padding:5px;border:1px solid #ccc">المبلغ</th><th style="padding:5px;border:1px solid #ccc">التاريخ</th><th style="padding:5px;border:1px solid #ccc">رقم الفاتورة</th><th style="padding:5px;border:1px solid #ccc">ملاحظة</th></tr></thead>
          <tbody>${settRows}</tbody>
        </table>
      </div>` : '';
    const w = window.open('', '_blank', 'width=560,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>عهد - ${a.emp}</title>
    <style>${printCSS}</style></head><body>
    <div class="r">
      ${printHeader('وصل استلام عهد')}
      <div class="rw"><span class="lb">الموظف:</span><span class="vl">${a.emp}</span></div>
      <div class="rw"><span class="lb">التاريخ:</span><span class="vl">${ds}</span></div>
      <div class="rw"><span class="lb">البيان:</span><span class="vl">${a.desc || 'عهد'}</span></div>
      <div class="ab"><div style="font-size:15px;color:#333">قيمة العهد</div><div class="av">${fmt(a.amt)} د.ل</div><div style="font-size:14px;color:#333;margin-top:5px">${tafqeet(a.amt)}</div></div>
      ${(a.paid || 0) > 0 ? `<div style="background:#ddd;padding:14px;margin:12px 0;border-radius:8px;border:2px solid #000"><div style="display:flex;justify-content:space-between;padding:5px 0;font-size:15px"><span style="font-weight:bold">المُسوّى:</span><span style="font-weight:bold">${fmt(a.paid)} د.ل</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;font-size:15px"><span style="font-weight:bold">المتبقي:</span><span style="font-weight:bold">${fmt(rem)} د.ل</span></div></div>` : ''}
      ${settTable}
    </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const exportAdvPDF = async (a: Adv) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const hdr = await loadAllHeaders();
    const d = new Date(a.date);
    const ds = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    const rem = a.amt - (a.paid || 0);
    const settlements = a.settlements || [];
    const settRows = settlements.map((s, i) => {
      const sd = new Date(s.date);
      const sds = `${sd.getFullYear()}/${String(sd.getMonth()+1).padStart(2,'0')}/${String(sd.getDate()).padStart(2,'0')}`;
      return `<tr style="${i % 2 === 0 ? 'background:#f0f0f0;' : ''}"><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${i + 1}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${fmt(s.amt)} د.ل</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${sds}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center;color:#2563eb;font-weight:700">${s.invNum || '-'}</td><td style="padding:5px;border:1px solid #ccc;font-size:12px;text-align:center">${s.note || '-'}</td></tr>`;
    }).join('');
    const settTable = settlements.length > 0 ? `
      <div style="margin-top:15px;border:2px solid #333;border-radius:8px;overflow:hidden">
        <div style="background:#000;color:#fff;padding:6px;text-align:center;font-weight:bold;font-size:13px">تفاصيل التسويات</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#ddd"><th style="padding:5px;border:1px solid #ccc">#</th><th style="padding:5px;border:1px solid #ccc">المبلغ</th><th style="padding:5px;border:1px solid #ccc">التاريخ</th><th style="padding:5px;border:1px solid #ccc">رقم الفاتورة</th><th style="padding:5px;border:1px solid #ccc">ملاحظة</th></tr></thead>
          <tbody>${settRows}</tbody>
        </table>
      </div>` : '';
    const container = document.createElement('div');
    container.style.cssText = 'direction:rtl;text-align:center;font-family:Arial,sans-serif;padding:20px;background:#fff;color:#000;max-width:520px;margin:0 auto;font-size:15px;';
    container.innerHTML = `
      <div style="border:3px solid #000;padding:20px;border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px">
          <div style="text-align:right;flex:1;display:flex;align-items:center;gap:8px;justify-content:flex-end">${hdr.rh ? `<img src="${hdr.rh}" style="height:50px;object-fit:contain" />` : ''}<div><div style="font-size:24px;font-weight:bold;color:#000">${st.storeName}</div><div style="font-size:13px;color:#333;margin-top:2px">هاتف: ${st.storePhone}</div></div></div>
          <div style="flex:0;text-align:center;padding:0 12px">${hdr.logo ? `<img src="${hdr.logo}" style="width:75px;height:75px;object-fit:contain;border:2px solid #000;border-radius:50%" />` : ''}</div>
          <div style="text-align:left;flex:1;display:flex;align-items:center;gap:8px"><div><div style="font-size:17px;font-weight:bold;color:#000;padding:5px 14px;border:2px solid #000;border-radius:5px;display:inline-block">وصل استلام عهد</div></div>${hdr.lh ? `<img src="${hdr.lh}" style="height:50px;object-fit:contain" />` : ''}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">الموظف:</span><span>${a.emp}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">التاريخ:</span><span>${ds}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">البيان:</span><span>${a.desc || 'عهد'}</span></div>
        <div style="background:#e8e8e8;padding:14px;margin:14px 0;border:3px solid #000;border-radius:8px">
          <div style="font-size:15px;color:#333">قيمة العهد</div>
          <div style="font-size:32px;font-weight:bold;color:#000">${fmt(a.amt)} د.ل</div>
          <div style="font-size:14px;color:#333;margin-top:5px">${tafqeet(a.amt)}</div>
        </div>
        ${(a.paid || 0) > 0 ? `<div style="background:#ddd;padding:14px;margin:12px 0;border-radius:8px;border:2px solid #000"><div style="display:flex;justify-content:space-between;padding:5px 0;font-size:15px"><span style="font-weight:bold">المُسوّى:</span><span style="font-weight:bold">${fmt(a.paid)} د.ل</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;font-size:15px"><span style="font-weight:bold">المتبقي:</span><span style="font-weight:bold">${fmt(rem)} د.ل</span></div></div>` : ''}
        ${settTable}
      </div>`;
    document.body.appendChild(container);
    await html2pdf().set({ margin: 10, filename: `advance_${a.emp}_${Date.now()}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(container).save();
    document.body.removeChild(container);
  };

  const doAddSett = () => {
    if (!nBiaan) { alert('أدخل البيان'); return; }
    const n: Sett = {
      id: Date.now().toString(), biaan: nBiaan, taf: nTaf, no3: nNo3,
      wazn: parseFloat(nWazn) || 0, sjg: parseFloat(nSjg) || 0, val: nCalc,
      usd: parseFloat(nUsd) || 0, usdr: parseFloat(nUsdr) || 0,
      eur: parseFloat(nEur) || 0, eurr: parseFloat(nEurr) || 0,
      no3t: nNo3t, dtar: nDtar, dtas: nDtas, hal: nHal, date: new Date().toISOString(), lsalih: nLsalih
    };
    const u = [n, ...setts]; saveL(SK_S, u); setSetts(u);
    setVNew(false); resetSettForm();
  };

  const doDelSett = (id: string) => { if (!confirm('حذف؟')) return; const u = setts.filter(x => x.id !== id); saveL(SK_S, u); setSetts(u); };

  const doEditSett = (s: Sett) => {
    setEditingSett(s);
    setNBiaan(s.biaan); setNTaf(s.taf); setNNo3(s.no3); setNLsalih(s.lsalih || '');
    setNWazn(s.wazn > 0 ? s.wazn.toString() : ''); setNSjg(s.sjg > 0 ? s.sjg.toString() : '');
    setNUsd(s.usd > 0 ? s.usd.toString() : ''); setNUsdr(s.usdr > 0 ? s.usdr.toString() : '');
    setNEur(s.eur > 0 ? s.eur.toString() : ''); setNEurr(s.eurr > 0 ? s.eurr.toString() : '');
    setNVal(s.val > 0 ? s.val.toString() : ''); setNDtar(s.dtar); setNDtas(s.dtas);
    setNNo3t(s.no3t || 'جزئية'); setNHal(s.hal || 'معلقة');
    nValManual.current = true;
    setVNew(true);
  };

  const doUpdateSett = () => {
    if (!editingSett || !nBiaan) { alert('أدخل البيان'); return; }
    const updated: Sett = {
      ...editingSett, biaan: nBiaan, taf: nTaf, no3: nNo3,
      wazn: parseFloat(nWazn) || 0, sjg: parseFloat(nSjg) || 0, val: nCalc,
      usd: parseFloat(nUsd) || 0, usdr: parseFloat(nUsdr) || 0,
      eur: parseFloat(nEur) || 0, eurr: parseFloat(nEurr) || 0,
      no3t: nNo3t, dtar: nDtar, dtas: nDtas, hal: nHal, lsalih: nLsalih,
    };
    const u = setts.map(x => x.id === editingSett.id ? updated : x);
    saveL(SK_S, u); setSetts(u);
    setEditingSett(null); setVNew(false); resetSettForm();
  };

  const resetSettForm = () => {
    setNBiaan(''); setNTaf(''); setNNo3(''); setNWazn(''); setNSjg('');
    setNUsd(''); setNUsdr(''); setNEur(''); setNEurr(''); setNVal('');
    setNDtar(''); setNDtas(''); setNHal('معلقة'); setNNo3t('جزئية'); setNLsalih('');
    nValManual.current = false;
  };

  const printSett = (s: Sett) => {
    const dtarStr = s.dtar ? new Date(s.dtar).toLocaleDateString('en-CA') : '-';
    const dtasStr = s.dtas ? new Date(s.dtas).toLocaleDateString('en-CA') : '-';
    const w = window.open('', '_blank', 'width=560,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>بند تسوية - ${s.biaan}</title>
    <style>${printCSS}</style></head><body>
    <div class="r">
      ${printHeader('تسوية السيد: ' + (s.lsalih || s.biaan))}
      <div class="rw"><span class="lb">البيان:</span><span class="vl">${s.biaan}</span></div>
      <div class="rw"><span class="lb">النوع:</span><span class="vl">${s.no3 || '-'}</span></div>
      <div class="rw"><span class="lb">التوضيح:</span><span class="vl">${s.taf || '-'}</span></div>
      ${s.lsalih ? `<div class="rw"><span class="lb">لصالح:</span><span class="vl">${s.lsalih}</span></div>` : ''}
      ${s.wazn > 0 ? `<div class="rw"><span class="lb">الوزن:</span><span class="vl">${fmt(s.wazn)} جرام</span></div>` : ''}
      ${s.sjg > 0 ? `<div class="rw"><span class="lb">سعر الجرام:</span><span class="vl">${fmt(s.sjg)} د.ل</span></div>` : ''}
      ${s.usd > 0 ? `<div class="rw"><span class="lb">قيمة الدولار:</span><span class="vl">$${fmt(s.usd)} × ${fmt(s.usdr)}</span></div>` : ''}
      ${s.eur > 0 ? `<div class="rw"><span class="lb">قيمة اليورو:</span><span class="vl">€${fmt(s.eur)} × ${fmt(s.eurr)}</span></div>` : ''}
      <div class="rw"><span class="lb">نوع التسوية:</span><span class="vl">${s.no3t || '-'}</span></div>
      <div class="rw"><span class="lb">تاريخ التسليم:</span><span class="vl">${dtarStr}</span></div>
      <div class="rw"><span class="lb">تاريخ التسوية:</span><span class="vl">${dtasStr}</span></div>
      <div class="rw"><span class="lb">الحالة:</span><span class="vl">${s.hal}</span></div>
      <div class="ab"><div style="font-size:15px;color:#333">القيمة النهائية</div><div class="av">${fmt(s.val)} د.ل</div><div style="font-size:14px;color:#333;margin-top:5px">${tafqeet(s.val)}</div></div>
    </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const buildSettRowsHTML = (items: Sett[]): string => {
    return items.map((s, i) => {
      const tds = activeCols.map(c => {
        const v = getColVal(s, c.key, i);
        const isBold = c.key === 'val' || c.key === 'biaan';
        const clr = c.key === 'val' ? 'color:#000;font-weight:bold' : c.key === 'biaan' ? 'font-weight:bold' : '';
        return `<td style="padding:5px 4px;border-bottom:1px solid #ddd;font-size:11px;${clr}">${v}</td>`;
      }).join('');
      return `<tr style="border-bottom:1px solid #ddd;${i % 2 === 0 ? 'background:#f9f9f9;' : ''}">${tds}</tr>`;
    }).join('');
  };

  const buildSettSummaryHTML = (items: Sett[], advTotal: number): string => {
    const total = items.reduce((s, x) => s + x.val, 0);
    const remaining = advTotal - total;
    return `
      <div style="margin-top:15px;border:2px solid #000;border-radius:8px;overflow:hidden">
        <div style="background:#000;color:#fff;padding:8px;text-align:center;font-weight:bold;font-size:13px">ملخص التوزيع والخصم</div>
        <div style="display:flex;gap:0">
          <div style="flex:1;text-align:center;padding:10px;border-left:2px solid #000"><div style="font-size:11px;color:#333;font-weight:bold">العهد المستلمة</div><div style="font-size:18px;font-weight:bold;color:#000">${fmt(advTotal)} د.ل</div><div style="font-size:10px;color:#555">${tafqeet(advTotal)}</div></div>
          <div style="flex:1;text-align:center;padding:10px;border-left:2px solid #000;background:#eee"><div style="font-size:11px;color:#333;font-weight:bold">إجمالي المصروفات</div><div style="font-size:18px;font-weight:bold;color:#000">${fmt(total)} د.ل</div><div style="font-size:10px;color:#555">${tafqeet(total)}</div></div>
          <div style="flex:1;text-align:center;padding:10px"><div style="font-size:11px;color:#333;font-weight:bold">المتبقي من العهد</div><div style="font-size:18px;font-weight:bold;color:#000">${fmt(remaining)} د.ل</div><div style="font-size:10px;color:#555">${tafqeet(remaining)}</div></div>
        </div>
      </div>`;
  };

  const printAllSetts = () => {
    if (fSetts.length === 0) { alert('لا توجد بنود للطباعة'); return; }
    const w = window.open('', '_blank', 'width=1100,height=700');
    if (!w) return;
    const cols = activeCols;
    const ths = cols.map(c => `<th style="padding:8px 5px;font-size:13px;text-align:center;background:#000;color:#fff;border:1px solid #000">${c.label}</th>`).join('');
    const rows = fSetts.map((s, i) => {
      const tds = cols.map(c => {
        const v = getColVal(s, c.key, i);
        const clr = c.key === 'val' ? 'font-weight:bold' : c.key === 'biaan' ? 'font-weight:bold' : '';
        return `<td style="padding:7px 5px;border:1px solid #555;font-size:13px;${clr}">${v}</td>`;
      }).join('');
      return `<tr style="${i % 2 === 0 ? 'background:#e8e8e8;' : ''}">${tds}</tr>`;
    }).join('');
    const sumRow = cols.map(c => {
      if (c.num) return `<td style="padding:8px 5px;border:2px solid #000;font-size:14px;font-weight:bold;background:#ccc;text-align:center">${getColSum(fSetts, c.key)}</td>`;
      if (c.key === 'num') return `<td style="padding:8px 5px;border:2px solid #000;font-size:14px;font-weight:bold;background:#ccc;text-align:center">المجموع</td>`;
      return `<td style="padding:8px 5px;border:1px solid #555;background:#ccc"></td>`;
    }).join('');
    const summHTML = buildSettSummaryHTML(fSetts, totR);
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تسوية مالية - جميع البنود</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:15px;direction:rtl;text-align:center;background:#fff;color:#000;font-size:14px}
    .r{width:100%;max-width:1050px;margin:0 auto;border:3px solid #000;padding:20px}
    .hd{display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px}
    .hd-r{text-align:right;flex:1}.sn{font-size:26px;font-weight:bold;color:#000}.ph{font-size:14px;color:#222;margin-top:2px}
    .hd-c{flex:0;text-align:center;padding:0 14px}.logo{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #000}
    .hd-l{text-align:left;flex:1}.tt{font-size:18px;font-weight:bold;color:#000;padding:5px 14px;border:2px solid #000;border-radius:5px;display:inline-block}
    .dt{font-size:13px;color:#333;margin-top:6px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#000;color:#fff;padding:8px 5px;font-size:13px;text-align:center;border:1px solid #000}
    td{border:1px solid #555;padding:7px 5px;font-size:13px}
    @media print{body{padding:0}.r{border:2px solid #000}*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body>
    <div class="r">
      <div class="hd">
        <div class="hd-r"><div class="sn">${st.storeName}</div><div class="ph">هاتف: ${st.storePhone}</div></div>
        <div class="hd-c"><img src="${logoBase}/logo1.png" class="logo" /></div>
        <div class="hd-l"><div class="tt">تسوية مالية - جميع البنود</div><div class="dt">عدد البنود: ${fSetts.length} | تاريخ الطباعة: ${new Date().toLocaleDateString('en-CA')}</div></div>
      </div>
      <table>
        <thead><tr>${ths}</tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>${sumRow}</tr></tfoot>
      </table>
      ${summHTML}
    </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const exportAllSettsPDF = async () => {
    if (fSetts.length === 0) { alert('لا توجد بنود للتصدير'); return; }
    const html2pdf = (await import('html2pdf.js')).default;
    const hdr = await loadAllHeaders();
    const cols = activeCols;
    const container = document.createElement('div');
    container.style.cssText = 'direction:rtl;text-align:center;font-family:Arial,sans-serif;padding:15px;background:#fff;color:#000;max-width:950px;margin:0 auto;font-size:12px;';
    const ths = cols.map(c => `<th style="padding:6px 4px;font-size:10px;text-align:center;background:#000;color:#fff">${c.label}</th>`).join('');
    const rows = fSetts.map((s, i) => {
      const tds = cols.map(c => {
        const v = getColVal(s, c.key, i);
        const isBold = c.key === 'val' || c.key === 'biaan';
        const clr = c.key === 'val' ? 'color:#000;font-weight:bold' : c.key === 'biaan' ? 'font-weight:bold' : '';
        return `<td style="padding:5px 4px;border-bottom:1px solid #555;font-size:11px;${clr}">${v}</td>`;
      }).join('');
      return `<tr style="${i % 2 === 0 ? 'background:#e8e8e8;' : ''}">${tds}</tr>`;
    }).join('');
    const sumRow = cols.map(c => {
      if (c.num) return `<td style="padding:5px 4px;border-bottom:2px solid #000;font-size:11px;font-weight:bold;background:#ccc;color:#000;text-align:center">${getColSum(fSetts, c.key)}</td>`;
      if (c.key === 'num') return `<td style="padding:5px 4px;border-bottom:2px solid #000;font-size:11px;font-weight:bold;background:#ccc;text-align:center">المجموع</td>`;
      return `<td style="padding:5px 4px;border-bottom:2px solid #000;font-size:11px;background:#ccc"></td>`;
    }).join('');
    container.innerHTML = `
      <div style="border:3px solid #000;padding:20px;border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px">
          <div style="text-align:right;flex:1;display:flex;align-items:center;gap:8px;justify-content:flex-end">${hdr.rh ? `<img src="${hdr.rh}" style="height:55px;object-fit:contain" />` : ''}<div><div style="font-size:26px;font-weight:bold;color:#000">${st.storeName}</div><div style="font-size:14px;color:#222;margin-top:2px">هاتف: ${st.storePhone}</div></div></div>
          <div style="flex:0;text-align:center;padding:0 14px">${hdr.logo ? `<img src="${hdr.logo}" style="width:80px;height:80px;object-fit:contain;border:2px solid #000;border-radius:50%" />` : ''}</div>
          <div style="text-align:left;flex:1;display:flex;align-items:center;gap:8px"><div><div style="font-size:18px;font-weight:bold;color:#000;padding:5px 14px;border:2px solid #000;border-radius:5px;display:inline-block">تسوية مالية - جميع البنود</div><div style="font-size:13px;color:#333;margin-top:6px">عدد البنود: ${fSetts.length} | تاريخ الطباعة: ${new Date().toLocaleDateString('en-CA')}</div></div>${hdr.lh ? `<img src="${hdr.lh}" style="height:55px;object-fit:contain" />` : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <thead><tr>${ths}</tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>${sumRow}</tr></tfoot>
        </table>
        ${buildSettSummaryHTML(fSetts, totR).replace(/style="/g, 'style="')}
      </div>`;
    document.body.appendChild(container);
    await html2pdf().set({ margin: 10, filename: `settlements_all_${Date.now()}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(container).save();
    document.body.removeChild(container);
  };

  const exportSettPDF = async (s: Sett) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const hdr = await loadAllHeaders();
    const dtarStr = s.dtar ? new Date(s.dtar).toLocaleDateString('en-CA') : '-';
    const dtasStr = s.dtas ? new Date(s.dtas).toLocaleDateString('en-CA') : '-';
    const container = document.createElement('div');
    container.style.cssText = 'direction:rtl;text-align:center;font-family:Arial,sans-serif;padding:20px;background:#fff;color:#000;max-width:520px;margin:0 auto;font-size:15px;';
    container.innerHTML = `
      <div style="border:3px solid #000;padding:20px;border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px">
          <div style="text-align:right;flex:1;display:flex;align-items:center;gap:8px;justify-content:flex-end">${hdr.rh ? `<img src="${hdr.rh}" style="height:50px;object-fit:contain" />` : ''}<div><div style="font-size:24px;font-weight:bold;color:#000">${st.storeName}</div><div style="font-size:13px;color:#333;margin-top:2px">هاتف: ${st.storePhone}</div></div></div>
          <div style="flex:0;text-align:center;padding:0 12px">${hdr.logo ? `<img src="${hdr.logo}" style="width:75px;height:75px;object-fit:contain;border:2px solid #000;border-radius:50%" />` : ''}</div>
          <div style="text-align:left;flex:1;display:flex;align-items:center;gap:8px"><div><div style="font-size:17px;font-weight:bold;color:#000;padding:5px 14px;border:2px solid #000;border-radius:5px;display:inline-block">تسوية السيد: ${s.lsalih || s.biaan}</div></div>${hdr.lh ? `<img src="${hdr.lh}" style="height:50px;object-fit:contain" />` : ''}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">البيان:</span><span>${s.biaan}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">النوع:</span><span>${s.no3 || '-'}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">التوضيح:</span><span>${s.taf || '-'}</span></div>
        ${s.lsalih ? `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">لصالح:</span><span>${s.lsalih}</span></div>` : ''}
        ${s.wazn > 0 ? `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">الوزن:</span><span>${fmt(s.wazn)} جرام</span></div>` : ''}
        ${s.sjg > 0 ? `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">سعر الجرام:</span><span>${fmt(s.sjg)} د.ل</span></div>` : ''}
        ${s.usd > 0 ? `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">قيمة الدولار:</span><span>$${fmt(s.usd)} × ${fmt(s.usdr)}</span></div>` : ''}
        ${s.eur > 0 ? `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">قيمة اليورو:</span><span>€${fmt(s.eur)} × ${fmt(s.eurr)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">نوع التسوية:</span><span>${s.no3t || '-'}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">تاريخ التسليم:</span><span>${dtarStr}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">تاريخ التسوية:</span><span>${dtasStr}</span></div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #555;font-size:15px"><span style="font-weight:bold;color:#000">الحالة:</span><span>${s.hal}</span></div>
        <div style="background:#e8e8e8;padding:14px;margin:14px 0;border:3px solid #000;border-radius:8px">
          <div style="font-size:15px;color:#333">القيمة النهائية</div>
          <div style="font-size:32px;font-weight:bold;color:#000">${fmt(s.val)} د.ل</div>
          <div style="font-size:14px;color:#333;margin-top:5px">${tafqeet(s.val)}</div>
        </div>
      </div>`;
    document.body.appendChild(container);
    await html2pdf().set({ margin: 10, filename: `settlement_${s.biaan}_${Date.now()}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(container).save();
    document.body.removeChild(container);
  };

  const fAdvs = advs.filter(x => { if (flt !== 'all' && x.status !== flt) return false; if (srch) { const q = srch.toLowerCase(); return x.emp?.toLowerCase().includes(q) || x.desc?.toLowerCase().includes(q); } return true; });
  const fSetts = setts.filter(x => { if (srch) { const q = srch.toLowerCase(); return x.biaan?.toLowerCase().includes(q) || x.taf?.toLowerCase().includes(q); } return true; });
  const emps = [...new Set(advs.map(x => x.emp))];
  const eSum = (n: string) => { const ea = advs.filter(x => x.emp === n); const t = ea.reduce((s, x) => s + x.amt, 0); const p = ea.reduce((s, x) => s + (x.paid || 0), 0); return { t, p, r: t - p }; };
  const totS = setts.reduce((s, x) => s + x.val, 0);
  const totR = advs.reduce((s, x) => s + x.amt, 0);
  const totP = advs.reduce((s, x) => s + (x.paid || 0), 0);
  const sl: Record<string, { t: string; c: string }> = { pending: { t: 'لم تُسوى', c: 'text-red-400 bg-red-500/20' }, partial: { t: 'جزئية', c: 'text-yellow-400 bg-yellow-500/20' }, settled: { t: 'تمت', c: 'text-green-400 bg-green-500/20' }, معلقة: { t: 'معلقة', c: 'text-red-400 bg-red-500/20' }, جزئية: { t: 'جزئية', c: 'text-yellow-400 bg-yellow-500/20' }, 'تمت التسوية': { t: 'تمت', c: 'text-green-400 bg-green-500/20' } };

  const printR = (a: Adv, tp: string) => {
    const d = new Date(a.date), ds = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    const rem = a.amt - (a.paid || 0);
    const tl: Record<string, string> = { initial: 'وصل استلام عهد', full: 'وصل تسوية عهد', partial: 'وصل تسوية جزئية' };
    const tc: Record<string, string> = { initial: '#000', full: '#000', partial: '#000' };
    const w = window.open('', '_blank', 'width=400,height=600'); if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${tl[tp]||tl.initial}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;padding:20px;direction:rtl;text-align:center}.r{width:100%;max-width:350px;margin:0 auto;border:2px solid #000;padding:20px}.hd{text-align:center;margin-bottom:20px;border-bottom:2px dashed #000;padding-bottom:15px}.sn{font-size:20px;font-weight:bold;color:#000}.tt{font-size:16px;font-weight:bold;margin-top:10px;color:#000;padding:5px 10px;border:2px solid #000;border-radius:5px;display:inline-block}.rw{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dotted #ccc}.lb{font-weight:bold;color:#000}.vl{color:#000}.ab{background:#eee;padding:15px;margin:15px 0;border:2px solid #000}.av{font-size:28px;font-weight:bold;color:#000}.nt{font-size:11px;color:#333;margin-top:20px;padding-top:15px;border-top:1px solid #ccc}.sg{display:flex;justify-content:space-between;margin-top:30px}.sb{text-align:center;width:45%}.sl{border-top:1px solid #000;margin-top:40px;padding-top:5px;font-size:12px}@media print{body{padding:0}.r{border:none}*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body><div class="r"><div class="hd"><div class="sn">مجوهرات الحمروني</div><div class="tt">${tl[tp]||''}</div></div><div class="rw"><span class="lb">الموظف:</span><span class="vl">${a.emp}</span></div><div class="rw"><span class="lb">التاريخ:</span><span class="vl">${ds}</span></div><div class="rw"><span class="lb">البيان:</span><span class="vl">${a.desc||'عهد'}</span></div><div class="ab"><div style="font-size:14px;color:#333">قيمة العهد</div><div class="av">${fmt(a.amt)} د.ل</div></div>${tp!=='initial'?`<div style="background:#eee;padding:12px;margin:10px 0;border-radius:8px;border:1px solid #000"><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>المُسوّى:</span><span style="color:#000;font-weight:bold">${fmt(a.paid||0)} د.ل</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>المتبقي:</span><span style="color:${rem>0?'#c0392b':'#1e8449'};font-weight:bold">${fmt(rem)} د.ل</span></div></div>`:''}<div class="nt">يجب تسوية العهد شهرياً.</div><div class="sg"><div class="sb"><div class="sl">توقيع الموظف</div></div><div class="sb"><div class="sl">توقيع المدير</div></div></div></div></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 pb-14" dir="rtl">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('adv')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'adv' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><DollarSign className="w-5 h-5" /> العهد المصروفة</button>
        <button onClick={() => setTab('set')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'set' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><Coins className="w-5 h-5" /> تسوية مالية</button>
      </div>
      <div className="relative mb-6"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="بحث..." value={srch} onChange={e => setSrch(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white pr-10 pl-4 py-2 rounded-lg" /></div>

      {tab === 'adv' && (<>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="w-7 h-7 text-yellow-400" /> العهد المصروفة</h1>
          <div className="flex gap-2">
            <button onClick={() => setVStl(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" /> تسوية عهد</button>
            <button onClick={() => { setEditingAdv(null); setFName(''); setFAmt(''); setFDesc(''); setVAdd(true); }} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"><Plus className="w-5 h-5" /> صرف عهد جديدة</button>
          </div>
        </div>
        {emps.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">{emps.map(e => { const s = eSum(e); return (<div key={e} className="bg-gray-800 rounded-xl border border-gray-700 p-4"><div className="flex items-center gap-2 mb-3"><User className="w-5 h-5 text-yellow-400" /><span className="text-white font-bold">{e}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><div><p className="text-gray-400">الإجمالي</p><p className="text-white font-bold">{fmt(s.t)} د.ل</p></div><div><p className="text-gray-400">المُسوّى</p><p className="text-green-400 font-bold">{fmt(s.p)} د.ل</p></div><div><p className="text-gray-400">المتبقي</p><p className="text-red-400 font-bold">{fmt(s.r)} د.ل</p></div></div></div>); })}</div>}
        <div className="flex gap-2 mb-4">{(['all','pending','partial','settled'] as const).map(k => (<button key={k} onClick={() => setFlt(k)} className={`px-4 py-2 rounded-lg text-sm ${flt === k ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{k === 'all' ? 'الكل' : sl[k]?.t}</button>))}</div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-700/50">
          <th className="px-4 py-3 text-right text-sm text-gray-300">الموظف</th><th className="px-4 py-3 text-right text-sm text-gray-300">القيمة المستلمة</th><th className="px-4 py-3 text-right text-sm text-gray-300">المُسوّى</th><th className="px-4 py-3 text-right text-sm text-gray-300">المتبقي</th><th className="px-4 py-3 text-right text-sm text-gray-300">الحالة</th><th className="px-4 py-3 text-right text-sm text-gray-300">التاريخ</th><th className="px-4 py-3 text-right text-sm text-gray-300">إجراءات</th>
        </tr></thead><tbody>
          {fAdvs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">لا توجد عهد</td></tr>}
          {fAdvs.map(a => { const rem = a.amt - (a.paid || 0); const st = sl[a.status] || sl.pending; return (
            <tr key={a.id} className="border-t border-gray-700 hover:bg-gray-700/30"><td className="px-4 py-3 text-white">{a.emp}</td><td className="px-4 py-3 text-white">{fmt(a.amt)} د.ل</td><td className="px-4 py-3 text-green-400">{fmt(a.paid || 0)} د.ل</td><td className="px-4 py-3 text-red-400">{fmt(rem)} د.ل</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${st.c}`}>{st.t}</span></td><td className="px-4 py-3 text-gray-400 text-sm">{new Date(a.date).toLocaleDateString('en-US')}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => printAdv(a)} title="طباعة" className="text-blue-400 hover:text-blue-300"><Printer className="w-4 h-4" /></button><button onClick={() => exportAdvPDF(a)} title="PDF" className="text-purple-400 hover:text-purple-300"><FileDown className="w-4 h-4" /></button><button onClick={() => doEditAdv(a)} title="تعديل" className="text-yellow-400 hover:text-yellow-300"><Edit className="w-4 h-4" /></button><button onClick={() => doDelAdv(a.id)} title="حذف" className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></div></td></tr>); })}
        </tbody></table></div></div>
      </>)}

      {tab === 'set' && (<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1"><div className="bg-gray-800 rounded-xl border border-yellow-500/30 p-4 sticky top-4">
          <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 mb-4"><Calculator className="w-5 h-5" /> حاسبة تحويل العملات</h3>
          <div className="space-y-3">
            <INP v={rUsd} set={setRUsd} lb="سعر الدولار" ph="4.83" onFocus={() => setFocusedKey('rUsd')} onBlur={() => setFocusedKey(null)} />
            <INP v={rEur} set={setREur} lb="سعر اليورو" ph="5.25" onFocus={() => setFocusedKey('rEur')} onBlur={() => setFocusedKey(null)} />
            <INP v={cAmt} set={setCAmt} lb="المبلغ" ph="0" onFocus={() => setFocusedKey('cAmt')} onBlur={() => setFocusedKey(null)} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-gray-400 text-xs mb-1">من</label><select value={cFrom} onChange={e => setCFrom(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm"><option value="LYD">دينار</option><option value="USD">دولار</option><option value="EUR">يورو</option></select></div>
              <div><label className="block text-gray-400 text-xs mb-1">إلى</label><select value={cTo} onChange={e => setCTo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm"><option value="LYD">دينار</option><option value="USD">دولار</option><option value="EUR">يورو</option></select></div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center"><p className="text-gray-400 text-xs">النتيجة</p><p className="text-yellow-400 text-xl font-bold">{fmt(cResult)}</p><p className="text-gray-400 text-xs">{cTo}</p></div>
          </div>
        </div></div>

        <div className="xl:col-span-3">
          <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Coins className="w-7 h-7 text-yellow-400" /> تسوية مالية</h1>
            <button onClick={() => { setEditingSett(null); resetSettForm(); nValManual.current = false; setVNew(true); }} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"><Plus className="w-5 h-5" /> إضافة بند</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4"><p className="text-gray-400 text-sm">إجمالي البنود</p><p className="text-white text-xl font-bold">{fmt(totS)} د.ل</p></div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4"><p className="text-gray-400 text-sm">العهد المستلمة</p><p className="text-blue-400 text-xl font-bold">{fmt(totR)} د.ل</p></div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4"><p className="text-gray-400 text-sm">المصروفات (بنود التسوية)</p><p className="text-red-400 text-xl font-bold">{fmt(totS)} د.ل</p></div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4"><p className="text-gray-400 text-sm">المتبقي من العهد</p><p className="text-yellow-400 text-xl font-bold">{fmt(totR - totS)} د.ل</p></div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
            <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
              <p className="text-gray-400 text-xs mb-2 font-bold">الأعمدة المُختارة للطباعة:</p>
              <div className="flex flex-wrap gap-2">{allCols.map(c => (<label key={c.key} className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={selCols.includes(c.key)} onChange={() => toggleCol(c.key)} className="w-3 h-3 accent-yellow-500" /><span className="text-gray-300 text-xs">{c.label}</span></label>))}</div>
            </div>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-700/50">
            <th className="px-3 py-3 text-right text-xs text-gray-300">#</th><th className="px-3 py-3 text-right text-xs text-gray-300">البيان</th><th className="px-3 py-3 text-right text-xs text-gray-300">النوع</th><th className="px-3 py-3 text-right text-xs text-gray-300">الوزن</th><th className="px-3 py-3 text-right text-xs text-gray-300">سعر الجرام</th><th className="px-3 py-3 text-right text-xs text-gray-300">لصالح</th>            <th className="px-3 py-3 text-right text-xs text-gray-300">القيمة الفعلية (د.ل)</th><th className="px-3 py-3 text-right text-xs text-gray-300">الحالة</th><th className="px-3 py-3 text-right text-xs text-gray-300">إجراءات</th>
          </tr></thead><tbody>
            {fSetts.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">لا توجد بنود</td></tr>}
            {fSetts.map((x, i) => { const si = sl[x.hal] || { t: x.hal, c: 'text-gray-400 bg-gray-500/20' }; return (
              <tr key={x.id} className="border-t border-gray-700 hover:bg-gray-700/30"><td className="px-3 py-3 text-gray-400">{i+1}</td><td className="px-3 py-3 text-white font-bold text-sm">{x.biaan}</td><td className="px-3 py-3 text-blue-400 text-sm">{x.no3}</td><td className="px-3 py-3 text-yellow-400 text-sm">{x.wazn > 0 ? `${fmt(x.wazn)} جرام` : '-'}</td><td className="px-3 py-3 text-gray-300 text-sm">{x.sjg > 0 ? fmt(x.sjg) : '-'}</td><td className="px-3 py-3 text-gray-300 text-sm">{x.lsalih || '-'}</td><td className="px-3 py-3 text-green-400 font-bold text-sm">{fmt(x.val)} د.ل</td><td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs ${si.c}`}>{si.t}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button onClick={() => printSett(x)} title="طباعة" className="text-blue-400 hover:text-blue-300"><Printer className="w-4 h-4" /></button><button onClick={() => exportSettPDF(x)} title="PDF" className="text-purple-400 hover:text-purple-300"><FileDown className="w-4 h-4" /></button><button onClick={() => doEditSett(x)} title="تعديل" className="text-yellow-400 hover:text-yellow-300"><Edit className="w-4 h-4" /></button><button onClick={() => doDelSett(x.id)} title="حذف" className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></div></td></tr>); })}
          </tbody></table></div></div>
          {setts.length > 0 && (<div className="bg-gray-800 rounded-xl border border-yellow-500/30 p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">ملخص التوزيع والخصم</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-1">العهد المستلمة</p><p className="text-blue-400 text-2xl font-bold">{fmt(totR)} د.ل</p></div>
              <div className="bg-gray-700 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-1">إجمالي المصروفات (بنود التسوية)</p><p className="text-red-400 text-2xl font-bold">{fmt(totS)} د.ل</p></div>
              <div className="bg-gray-700 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-1">المتبقي من العهد</p><p className={`text-2xl font-bold ${totR-totS>=0?'text-yellow-400':'text-red-400'}`}>{fmt(totR-totS)} د.ل</p></div>
            </div>
          </div>)}
          {fSetts.length > 0 && (
            <div className="flex gap-3 mt-4">
              <button onClick={printAllSetts} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Printer className="w-5 h-5" /> طباعة جميع البنود</button>
              <button onClick={exportAllSettsPDF} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"><FileDown className="w-5 h-5" /> تصدير PDF لجميع البنود</button>
            </div>
          )}
        </div>
      </div>)}

      {/* تفقيط ثابت */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-yellow-500/50 px-6 py-2 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">بالحروف:</span>
          <span className="text-white text-sm flex-1">{tafqeet(focusedDisplayVal !== null ? focusedDisplayVal : liveVal)}</span>
          <span className="text-gray-500">|</span>
          <span className="text-yellow-400 font-bold text-lg whitespace-nowrap">{fmt(focusedDisplayVal !== null ? focusedDisplayVal : liveVal)} د.ل</span>
        </div>
      </div>

      {/* Modal: إضافة/تعديل عهد */}
      {vAdd && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">{editingAdv ? 'تعديل العهد' : 'صرف عهد جديدة'}</h3><button onClick={() => { setEditingAdv(null); setVAdd(false); setFName(''); setFAmt(''); setFDesc(''); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-gray-300 text-sm mb-1">اسم الموظف *</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg" /></div>
          <INP v={fAmt} set={setFAmt} lb="قيمة العهد (د.ل) *" onFocus={() => setFocusedKey('fAmt')} onBlur={() => setFocusedKey(null)} />
          <div><label className="block text-gray-300 text-sm mb-1">البيان</label><input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg" /></div>
          <button onClick={editingAdv ? doUpdateAdv : doAddAdv} className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold">{editingAdv ? 'حفظ التعديلات' : 'صرف العهد'}</button>
        </div>
      </div></div>}

      {/* Modal: تسوية عهد */}
      {vStl && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">تسوية عهد</h3><button onClick={() => setVStl(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-gray-300 text-sm mb-1">اختر الموظف *</label><select value={sName} onChange={e => setSName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"><option value="">اختر...</option>{emps.map(e => <option key={e} value={e}>{e} - متبقي: {fmt(eSum(e).r)} د.ل</option>)}</select></div>
          <INP v={sAmt} set={setSAmt} lb="قيمة التسوية (د.ل) *" onFocus={() => setFocusedKey('sAmt')} onBlur={() => setFocusedKey(null)} />
          <div><label className="block text-gray-300 text-sm mb-1">رقم الفاتورة المقدمة للتسوية</label><input type="text" value={sInvNum} onChange={e => setSInvNum(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg" placeholder="INV-2026-0001" /></div>
          <div><label className="block text-gray-300 text-sm mb-1">ملاحظة</label><input type="text" value={sNote} onChange={e => setSNote(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg" /></div>
          <button onClick={doSettle} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">تسوية العهد</button>
        </div>
      </div></div>}

      {/* Modal: إضافة/تعديل بند تسوية */}
      {vNew && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">{editingSett ? 'تعديل بند التسوية' : 'إضافة بند تسوية مالية'}</h3><button onClick={() => { setEditingSett(null); setVNew(false); resetSettForm(); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button></div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <INP v={nBiaan} set={setNBiaan} lb="البيان *" />
            <div><label className="block text-gray-300 text-sm mb-1">نوع البيان *</label><input list="no3L" type="text" value={nNo3} onChange={e => { const nv = e.target.value; const wasGold = goldK.some(g => nNo3.includes(g)); const nowGold = goldK.some(g => nv.includes(g)); setNNo3(nv); if (wasGold !== nowGold) { setNWazn(''); setNSjg(''); setNUsd(''); setNUsdr(''); setNEur(''); setNEurr(''); setNVal(''); } }} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg" placeholder="ذهب / مالي" /><datalist id="no3L"><option value="ذهب" /><option value="سبائك" /><option value="فضة" /><option value="مجوهرات" /><option value="مالي" /><option value="عملة" /><option value="دولار" /><option value="يورو" /></datalist></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <INP v={nTaf} set={setNTaf} lb="التوضيح" />
            <INP v={nLsalih} set={setNLsalih} lb="لصالح المُسلم" />
          </div>
          {isGold && <div className="bg-gray-700/50 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-yellow-400 text-xs mb-3 font-bold">بيانات الذهب / المعدن</p>
            <div className="grid grid-cols-2 gap-4"><INP v={nWazn} set={setNWazn} lb="الوزن (جرام)" onFocus={() => setFocusedKey('nWazn')} onBlur={() => setFocusedKey(null)} /><INP v={nSjg} set={setNSjg} lb="سعر الجرام (د.ل)" onFocus={() => setFocusedKey('nSjg')} onBlur={() => setFocusedKey(null)} /></div>
            <div className="mt-2 bg-gray-600 rounded-lg p-2 text-center"><span className="text-gray-400 text-xs">قيمة الذهب = </span><span className="text-yellow-400 font-bold">{fmt((parseFloat(nWazn)||0)*(parseFloat(nSjg)||0))} د.ل</span></div>
          </div>}
          <div className="bg-gray-700/50 rounded-lg p-4 border border-blue-500/30">
            <p className="text-blue-400 text-xs mb-3 font-bold">القيمة بالدولار</p>
            <div className="grid grid-cols-3 gap-4"><INP v={nUsd} set={setNUsd} lb="قيمة الدولار ($)" onFocus={() => setFocusedKey('nUsd')} onBlur={() => setFocusedKey(null)} /><INP v={nUsdr} set={setNUsdr} lb="سعر الدولار" onFocus={() => setFocusedKey('nUsdr')} onBlur={() => setFocusedKey(null)} /><div><label className="block text-gray-300 text-sm mb-1">النتيجة بالدينار</label><div className="bg-gray-600 px-3 py-2 rounded-lg text-green-400 font-bold text-center">{fmt((parseFloat(nUsd)||0)*(parseFloat(nUsdr)||rU))} د.ل</div></div></div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-purple-500/30">
            <p className="text-purple-400 text-xs mb-3 font-bold">القيمة بيورو</p>
            <div className="grid grid-cols-3 gap-4"><INP v={nEur} set={setNEur} lb="قيمة اليورو (€)" onFocus={() => setFocusedKey('nEur')} onBlur={() => setFocusedKey(null)} /><INP v={nEurr} set={setNEurr} lb="سعر اليورو" onFocus={() => setFocusedKey('nEurr')} onBlur={() => setFocusedKey(null)} /><div><label className="block text-gray-300 text-sm mb-1">النتيجة بالدينار</label><div className="bg-gray-600 px-3 py-2 rounded-lg text-green-400 font-bold text-center">{fmt((parseFloat(nEur)||0)*(parseFloat(nEurr)||rE))} د.ل</div></div></div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border-2 border-yellow-500/50">
            <label className="block text-gray-300 text-sm mb-1">القيمة النهائية بالدينار (د.ل) *</label>
            <INP v={nVal} set={setNVal} ph="0" onFocus={() => { nValManual.current = true; setFocusedKey('nVal'); }} onBlur={() => setFocusedKey(null)} />
            <div className="mt-2 bg-gray-600 rounded-lg p-2 text-center"><p className="text-gray-500 text-[10px]">تفقيط:</p><p className="text-white text-sm">{tafqeet(parseFloat(nVal) || nCalc)}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-gray-300 text-sm mb-1">تاريخ التسليم</label><input type="date" value={nDtar} onChange={e => setNDtar(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm" /></div>
            <div><label className="block text-gray-300 text-sm mb-1">تاريخ التسوية</label><input type="date" value={nDtas} onChange={e => setNDtas(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm" /></div>
            <div><label className="block text-gray-300 text-sm mb-1">نوع التسوية</label><select value={nNo3t} onChange={e => setNNo3t(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"><option value="جزئية">جزئية</option><option value="كلية">كلية</option></select></div>
          </div>
          <div><label className="block text-gray-300 text-sm mb-1">الحالة</label><select value={nHal} onChange={e => setNHal(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg"><option value="معلقة">معلقة</option><option value="جزئية">جزئية</option><option value="تمت التسوية">تمت التسوية</option></select></div>
          <button onClick={editingSett ? doUpdateSett : doAddSett} className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold text-lg">{editingSett ? 'حفظ التعديلات' : 'إضافة البند'}</button>
        </div>
      </div></div>}
    </div>
  );
}
