import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Trash2, ShoppingCart, Printer, X, AlertCircle, CheckCircle, QrCode, Eye, Save, ArrowRight, Search, Package, Send, RefreshCw, CreditCard, Banknote, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartStorage, jewelryApi, generateQRCodeUrl, CartItem, SaleInvoice, JewelryItem, formatNumber, formatCurrency, isSupabaseAvailable } from '../services/supabase';
import { getInvoiceNumber } from '../services/invoiceBooks';
import { printInvoice } from '../services/invoiceTemplate';
import { numberToArabicWords } from '../utils/arabic';
import { getSystemSettings } from '../services/settings';
import { recordSale } from '../services/treasury';
import jsqr from 'jsqr';

const SalesPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const [total, setTotal] = useState(0);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addedItems, setAddedItems] = useState<{[code: string]: number}>({});
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [transferNumber, setTransferNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardReceiptNumber, setCardReceiptNumber] = useState('');
  const [cardReceiptDate, setCardReceiptDate] = useState('');
  const navigate = useNavigate();
  const [savedInvoice, setSavedInvoice] = useState<any>(null);

  // New: Item search and selection
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // QR Code scanning loop
  const scanQRCode = useCallback(() => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsqr(imageData.data, imageData.width, imageData.height);

    if (code) {
      const now = Date.now();
      const codeData = code.data;
      if (codeData !== lastScanRef.current || now - lastScanTimeRef.current > 2000) {
        lastScanRef.current = codeData;
        lastScanTimeRef.current = now;
        scanningRef.current = false;
        simulateScan(codeData);
        return;
      }
    }
    requestAnimationFrame(scanQRCode);
  }, []);

  useEffect(() => {
    const savedSeller = localStorage.getItem('current_seller') || localStorage.getItem('seller_name') || 'خالد تركي';
    setSellerName(savedSeller);
    const savedCart = cartStorage.getCart();
    setCart(savedCart);
    const lastInvoice = JSON.parse(localStorage.getItem('last_customer_name') || 'null');
    if (lastInvoice) setCustomerName(lastInvoice);
    // Load items from server into localStorage for barcode search
    loadAllItems();
  }, []);

  // Convert physical key code to UPPERCASE English character (works regardless of keyboard layout)
  const getCodeChar = (code: string, shiftKey: boolean): string | null => {
    const map: Record<string, string> = {
      'Digit0':'0','Digit1':'1','Digit2':'2','Digit3':'3','Digit4':'4',
      'Digit5':'5','Digit6':'6','Digit7':'7','Digit8':'8','Digit9':'9',
      'KeyA':'A','KeyB':'B','KeyC':'C','KeyD':'D','KeyE':'E','KeyF':'F',
      'KeyG':'G','KeyH':'H','KeyI':'I','KeyJ':'J','KeyK':'K','KeyL':'L',
      'KeyM':'M','KeyN':'N','KeyO':'O','KeyP':'P','KeyQ':'Q','KeyR':'R',
      'KeyS':'S','KeyT':'T','KeyU':'U','KeyV':'V','KeyW':'W','KeyX':'X',
      'KeyY':'Y','KeyZ':'Z',
      'Minus':'-','Equal':'=',
      'Semicolon':';','Quote':"'",'Backquote':'`',
      'Comma':',','Period':'.','Slash':'/',
    };
    if (shiftKey) {
      const shiftMap: Record<string, string> = {
        'Digit1':'!','Digit2':'@','Digit3':'#','Digit4':'$','Digit5':'%',
        'Digit6':'^','Digit7':'&','Digit8':'*','Digit9':'(','Digit0':')',
        'Minus':'_','Equal':'+',
        'Semicolon':':','Quote':'"','Backquote':'~',
        'Comma':'<','Period':'>','Slash':'?',
      };
      return shiftMap[code] ?? null;
    }
    return map[code] ?? null;
  };

  // Barcode Reader Support - USB barcode scanners act like keyboards
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Enter key = end of barcode
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 0) {
          handleBarcodeScan(barcodeBuffer);
          barcodeBuffer = '';
        }
        return;
      }

      // Use e.code for physical key position (ignores keyboard layout)
      const char = getCodeChar(e.code, e.shiftKey);
      if (char !== null) {
        barcodeBuffer += char;
        
        // Clear timeout if exists
        if (barcodeTimeout) clearTimeout(barcodeTimeout);
        
        // Set timeout - if no new char in 100ms, treat as complete barcode
        barcodeTimeout = setTimeout(() => {
          if (barcodeBuffer.length > 0) {
            handleBarcodeScan(barcodeBuffer);
            barcodeBuffer = '';
          }
        }, 100);
      }
    };

    const handleBarcodeScan = async (code: string) => {
      setScanMessage(`جاري البحث: ${code}...`);
      
      // Try server first (most reliable)
      try {
        const response = await fetch(`/api/items/search/${encodeURIComponent(code)}`);
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const found = result.data[0];
          if (found.stock_qty > 0) {
            const newCart = addToCartWithSync(found);
            setCart(newCart);
            setScanMessage(`✓ تمت إضافة: ${found.model_name} (${found.item_code})`);
            setShowSuccess(true);
            setTimeout(() => { setScanMessage(''); setShowSuccess(false); }, 2000);
          } else {
            setScanMessage(`⚠ الصنف ${found.model_name} غير متوفر في المخزون`);
            setTimeout(() => setScanMessage(''), 3000);
          }
          return;
        }
      } catch (e) {
        console.log('Server search failed, trying localStorage');
      }

      // Fallback to localStorage
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const items = JSON.parse(storedItems);
        const found = items.find((i: JewelryItem) => 
          i.item_code?.toLowerCase() === code.toLowerCase() ||
          i.item_code?.toLowerCase().includes(code.toLowerCase())
        );
        
        if (found) {
          if (found.stock_qty > 0) {
            const newCart = addToCartWithSync(found);
            setCart(newCart);
            setScanMessage(`✓ تمت إضافة: ${found.model_name} (${found.item_code})`);
            setShowSuccess(true);
            setTimeout(() => { setScanMessage(''); setShowSuccess(false); }, 2000);
          } else {
            setScanMessage(`⚠ الصنف ${found.model_name} غير متوفر في المخزون`);
            setTimeout(() => setScanMessage(''), 3000);
          }
          return;
        }
      }

      setScanMessage(`❌ الصنف ${code} غير موجود في النظام`);
      setTimeout(() => setScanMessage(''), 3000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeout) clearTimeout(barcodeTimeout);
    };
  }, [cart]);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setTotal(newTotal);
  }, [cart]);

  useEffect(() => {
    const tracking: {[code: string]: number} = {};
    cart.forEach(item => {
      tracking[item.item_code] = item.quantity;
    });
    setAddedItems(tracking);
  }, [cart]);

  const startCamera = async () => {
    setShowScanner(true);
    setCameraError('');
    scanningRef.current = false;
    lastScanRef.current = '';
    lastScanTimeRef.current = 0;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('المتصفح لا يدعم الوصول للكاميرا');
        return;
      }

      let stream = null;
      const constraints = [
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true },
      ];

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!stream) {
        setCameraError('لا يمكن الوصول للكاميرا. تأكد من إعطاء الصلاحية.');
        return;
      }

      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
          setTimeout(() => {
            scanningRef.current = true;
            requestAnimationFrame(scanQRCode);
          }, 500);
        }
      }, 200);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('تم رفض الوصول للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('لم يتم العثور على كاميرا في الجهاز.');
      } else {
        setCameraError('خطأ في الوصول للكاميرا: ' + (err.message || 'غير معروف'));
      }
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  const addToCartWithSync = (item: JewelryItem) => {
    const newCart = cartStorage.addToCart(item);
    const syncedCart = newCart.map(cartItem => ({
      ...cartItem,
      total: cartItem.quantity * cartItem.price,
    }));
    cartStorage.saveCart(syncedCart);
    return syncedCart;
  };

  const syncItemsFromSupabase = async () => {
    try {
      const items = await jewelryApi.getAllItems();
      if (items && items.length > 0) {
        localStorage.setItem('jewelry_items', JSON.stringify(items));
      }
    } catch {}
  };

  const simulateScan = async (code: string) => {
    setScanMessage('جاري البحث...');
    try {
      // First check localStorage
      let item: JewelryItem | null = null;
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        item = parsedItems.find((i: JewelryItem) => i.item_code === code) || null;
      }

      // If not found, try Supabase
      if (!item) {
        try {
          const apiItem = await jewelryApi.getItemByCode(code);
          if (apiItem) {
            item = apiItem;
            // Sync to localStorage for next time
            await syncItemsFromSupabase();
          }
        } catch {}
      }

      // If still not found, try searching by code prefix (partial match)
      if (!item && storedItems) {
        const parsedItems = JSON.parse(storedItems);
        item = parsedItems.find((i: JewelryItem) =>
          i.item_code?.toLowerCase().includes(code.toLowerCase()) ||
          i.model_name?.toLowerCase().includes(code.toLowerCase())
        ) || null;
      }

      if (!item) {
        setScanMessage('❌ القطعة غير موجودة!');
        setTimeout(() => { setScanMessage(''); scanningRef.current = true; requestAnimationFrame(scanQRCode); }, 2000);
        return;
      }
      if (item.stock_qty <= 0) {
        setScanMessage('❌ القطعة نفدت من المخزون!');
        setTimeout(() => { setScanMessage(''); scanningRef.current = true; requestAnimationFrame(scanQRCode); }, 2000);
        return;
      }
      const currentInCart = addedItems[code] || 0;
      if (currentInCart >= item.stock_qty) {
        setScanMessage('❌ تم الوصول للحد الأقصى للمخزون!');
        setTimeout(() => { setScanMessage(''); scanningRef.current = true; requestAnimationFrame(scanQRCode); }, 2000);
        return;
      }
      const newCart = addToCartWithSync(item);
      setCart(newCart);
      setScanMessage(`✓ تمت إضافة: ${item.model_name}`);
      setShowSuccess(true);
      setTimeout(() => { setScanMessage(''); setShowSuccess(false); scanningRef.current = true; requestAnimationFrame(scanQRCode); }, 1500);
    } catch (err) {
      setScanMessage('حدث خطأ في الاتصال!');
      setTimeout(() => { setScanMessage(''); scanningRef.current = true; requestAnimationFrame(scanQRCode); }, 2000);
    }
  };

  // Search items for manual selection
  const handleSearchItems = async () => {
    setLoading(true);
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setLoading(false); return; }
    
    let allItems: JewelryItem[] = [];
    
    // Try server first
    try {
      const response = await fetch(`/api/items/search/${encodeURIComponent(q)}`);
      const result = await response.json();
      if (result.success && result.data) {
        allItems = result.data;
      }
    } catch {}
    
    // Fallback to localStorage
    if (allItems.length === 0) {
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        allItems = parsedItems.filter((item: JewelryItem) =>
          item.item_code?.toLowerCase().includes(q) ||
          item.model_name?.toLowerCase().includes(q) ||
          item.gold_item?.toLowerCase().includes(q)
        );
      }
    }
    
    setSearchResults(allItems.filter((item: JewelryItem) => item.stock_qty > 0));
    setLoading(false);
  };

  const loadAllItems = async () => {
    setLoading(true);
    try {
      // Try local server first
      try {
        const response = await fetch('/api/items');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          localStorage.setItem('jewelry_items', JSON.stringify(result.data));
          setSearchResults(result.data.filter((item: JewelryItem) => item.stock_qty > 0));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Server error, loading from localStorage:', err);
      }

      // Fallback to localStorage
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        setSearchResults(parsedItems.filter((item: JewelryItem) => item.stock_qty > 0));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Load error:', err);
      setSearchResults([]);
    }
    setLoading(false);
  };

  const addItemToCart = (item: JewelryItem) => {
    const currentInCart = addedItems[item.item_code] || 0;
    if (currentInCart >= item.stock_qty) {
      alert('تم الوصول للحد الأقصى للمخزون!');
      return;
    }
    const newCart = addToCartWithSync(item);
    setCart(newCart);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const removeItem = (code: string) => {
    const newCart = cartStorage.removeFromCart(code);
    setCart(newCart);
  };

  const updateQuantity = (code: string, qty: number) => {
    const newCart = cartStorage.updateQuantity(code, qty);
    const syncedCart = newCart.map(cartItem => ({
      ...cartItem,
      total: cartItem.quantity * cartItem.price,
    }));
    cartStorage.saveCart(syncedCart);
    setCart(syncedCart);
  };

  // Send to WhatsApp
  const sendToWhatsApp = () => {
    if (cart.length === 0 || !customerName.trim()) {
      alert('يرجى إدخال اسم العميل وإضافة قطع للفاتورة');
      return;
    }

    const invoiceNumber = currentInvoiceNumber;
    const itemsList = cart.map((item, index) =>
      `${index + 1}. ${item.model_name}\n   الكود: ${item.item_code}\n   العيار: ${item.karat}\n   الوزن: ${item.weight} غم\n   الكمية: ${item.quantity}\n   السعر: ${formatCurrency(item.price)}`
    ).join('\n\n');

    const message = `🛍️ *فاتورة مجوهرات الحمروني*\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `📄 رقم الفاتورة: ${invoiceNumber}\n` +
      `👤 العميل: ${customerName}\n` +
      `📅 التاريخ: ${new Date().toLocaleDateString('en-CA')}\n` +
      `👨‍💼 البائع: ${sellerName}\n` +
      `💳 طريقة الدفع: ${paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'بطاقة مصرفية' : 'حوالة بنكية'}\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `*تفاصيل المشتريات:*\n${itemsList}\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `💰 *الإجمالي: ${formatCurrency(total)} ل.د*\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `شكراً لتعاملكم مع مجوهرات الحمروني 🏆`;

    const phoneNumber = '218913157496';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

// Print after save - uses the shared template
  const handlePrintAfterSave = (invoice: any) => {
    const settings = getSystemSettings();
    const totalWeight = invoice.items.reduce((sum: number, item: any) => sum + (item.weight || 0) * (item.quantity || 1), 0);
    printInvoice({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      seller_name: invoice.seller_name,
      created_at: invoice.created_at,
      invoice_type: 'final',
      total_amount: invoice.total_amount,
      payment_method: invoice.payment_method,
      transfer_number: invoice.transfer_number,
      bank_name: invoice.bank_name,
      card_receipt_number: invoice.card_receipt_number,
      card_receipt_date: invoice.card_receipt_date,
      items: invoice.items.map((item: any) => ({
        model_name: item.model_name,
        item_code: item.item_code,
        karat: item.karat || '21',
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
        total: item.total || item.quantity * item.price,
      })),
    }, 'A5', 'portrait');
  };

// Print function - Use shared template for consistency
  const handlePrint = (printerType: 'invoice' | 'label' | 'normal') => {
    if (printerType !== 'invoice') {
      // For label/normal, use existing logic (simplified)
      const settings = getSystemSettings();
      const invoiceNumber = currentInvoiceNumber;
      const now = new Date();
      const dateStr = now.toLocaleString('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const totalInWords = total > 0 ? numberToArabicWords(total) : 'صفر';
      const totalWeight = cart.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0);

      // Build simple HTML for label/normal
      let invoiceHTML = '';
      if (printerType === 'label') {
        // Label format - compact
        invoiceHTML = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"><title>ملصق</title>
          <style>@page{size:58mm auto;margin:0}body{font-family:Arial;font-size:11px;padding:5mm}table{width:100%;border-collapse:collapse}td{padding:2px;border:1px solid #333}</style></head>
          <body><table>
            <tr><td colspan="2" style="text-align:center;font-weight:bold;font-size:14px">${settings.storeName}</td></tr>
            <tr><td>الصنف:</td><td>${cart.map(i=>i.model_name).join('، ')}</td></tr>
            <tr><td>العيار:</td><td>${cart.map(i=>i.karat).join('، ')}</td></tr>
            <tr><td>الوزن:</td><td>${totalWeight.toFixed(2)} غم</td></tr>
            <tr><td>الإجمالي:</td><td>${formatNumber(total)} د.ل</td></tr>
            <tr><td>العميل:</td><td>${customerName}</td></tr>
            <tr><td>رقم:</td><td>${invoiceNumber}</td></tr>
          </table></body></html>`;
      } else {
        // Normal format
        invoiceHTML = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"><title>فاتورة</title>
          <style>@page{margin:10mm}body{font-family:Arial;padding:10px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:4px}</style></head>
          <body>
            <h2 style="text-align:center">${settings.storeName}</h2>
            <p>فاتورة رقم: ${invoiceNumber}</p>
            <p>التاريخ: ${dateStr}</p>
            <p>العميل: ${customerName}</p>
            <table><thead><tr><th>الصنف</th><th>العيار</th><th>الوزن</th><th>العدد</th><th>السعر</th></tr></thead>
            <tbody>${cart.map((item, index) => `
              <tr><td>${index+1}. ${item.model_name}</td><td>${item.karat}</td><td>${formatNumber(item.weight)} غم</td><td>${item.quantity}</td><td>${formatNumber(item.quantity * item.price)} د.ل</td>
            `).join('')}</tbody></table>
            <p>إجمالي الوزن: ${totalWeight.toFixed(2)} غم</p>
            <p>الإجمالي: ${formatNumber(total)} د.ل</p>
            <p>المبلغ كتابة: ${totalInWords}</p>
          </body></html>`;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
      return;
    }

    // For invoice type, use shared template
    printInvoice({
      invoice_number: currentInvoiceNumber,
      customer_name: customerName,
      items: cart,
      total_amount: total,
      seller_name: sellerName,
      created_at: new Date().toISOString(),
      invoice_type: 'final',
      payment_method: paymentMethod,
      transfer_number: transferNumber,
      bank_name: bankName,
      card_receipt_number: cardReceiptNumber,
      card_receipt_date: cardReceiptDate,
    });
  };

  // Invoice Preview Component
  const PreviewInvoice: React.FC = () => {
    const settings = getSystemSettings();
    const formatDate = (date: Date) => {
      return date.toLocaleString('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const totalInWords = total > 0 ? numberToArabicWords(total) : 'صفر';
    const totalWeight = cart.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0);

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowInvoicePreview(false)}>
        <div className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-500 p-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{settings.storeName}</h1>
            <p className="text-gray-800">أجود المجوهرات وأفخرها</p>
            <p className="text-gray-700 text-sm mt-1">{settings.storeAddress} | {settings.storePhone}</p>
          </div>

          {/* Invoice Info */}
          <div className="p-6 border-b" id="invoice-print-area">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">رقم الفاتورة</p>
                <p className="text-xl font-bold font-mono text-yellow-600">{currentInvoiceNumber}</p>
              </div>
              <div className="text-left">
                <p className="text-gray-500 text-sm">التاريخ</p>
                <p className="text-lg font-bold">{formatDate(new Date())}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-gray-500 text-sm">العميل</p>
                <p className="text-lg font-bold border-b-2 border-dashed border-gray-300 pb-1">{customerName || '------------------------'}</p>
              </div>
              <div className="text-left">
                <p className="text-gray-500 text-sm">البائع</p>
                <p className="text-lg font-bold border-b-2 border-dashed border-gray-300 pb-1">{sellerName}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-gray-500 text-sm">طريقة الدفع</p>
              <p className={`text-lg font-bold ${
                paymentMethod === 'cash' ? 'text-green-600' :
                paymentMethod === 'card' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {paymentMethod === 'cash' ? '💵 نقدي' : paymentMethod === 'card' ? '💳 بطاقة مصرفية' : '🏦 حوالة بنكية'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 text-right">#</th>
                  <th className="p-2 text-right">الصنف</th>
                  <th className="p-2 text-center">الكود</th>
                  <th className="p-2 text-center">العيار</th>
                  <th className="p-2 text-center">الوزن</th>
                  <th className="p-2 text-center">العدد</th>
                  <th className="p-2 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.item_code} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-bold">{item.model_name}</td>
                    <td className="p-2 text-center font-mono text-sm bg-yellow-50">{item.item_code}</td>
                    <td className="p-2 text-center font-bold text-yellow-600">{item.karat}</td>
                    <td className="p-2 text-center">{formatNumber(item.weight)} غم</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-left font-bold text-green-700">{formatNumber(item.quantity * item.price)} ل.د</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-6 pb-6">
            <div className="bg-gray-100 border-2 border-yellow-500 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">الإجمالي:</span>
                <span className="text-3xl font-bold text-green-700">{formatNumber(total)} ل.د</span>
              </div>
              <div className="flex justify-between items-center mb-4 p-2 bg-white rounded-lg border border-yellow-300">
                <span className="text-lg font-bold text-gray-700">إجمالي الوزن:</span>
                <span className="text-2xl font-bold text-yellow-700">{totalWeight.toFixed(2)} غم</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-500 rounded-lg p-3 text-center">
                <p className="text-sm text-yellow-700">المبلغ كتابة:</p>
                <p className="text-xl font-bold text-yellow-800">{totalInWords}</p>
              </div>
            </div>
          </div>

          {/* Footer in print area */}
          <div className="px-6 pb-6 border-t pt-4 text-center">
            <p className="text-gray-500 text-sm">شكراً لتعاملكم معنا - {settings.storeName}</p>
            <p className="text-gray-400 text-xs mt-1">{settings.storeAddress} | {settings.storePhone}</p>
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50 space-y-3">
            <div className="bg-gray-100 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600 mb-2">نوع الطابعة:</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handlePrint('invoice')} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                  <Printer className="w-4 h-4" />فاتورة
                </button>
                <button onClick={() => handlePrint('label')} className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                  <Printer className="w-4 h-4" />ليبل
                </button>
                <button onClick={() => handlePrint('normal')} className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                  <Printer className="w-4 h-4" />عادي
                </button>
              </div>
            </div>

            <button onClick={sendToWhatsApp} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />إرسال WhatsApp
            </button>

            <div className="flex gap-4">
              <button onClick={() => setShowInvoicePreview(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" />رجوع
              </button>
              <button onClick={handleCheckout} disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <span className="animate-spin">...</span> : <><Save className="w-5 h-5" />حفظ الفاتورة</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    setIsSaving(true);
    try {
      // Update localStorage for each item
      const storedItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
      for (const item of cart) {
        const index = storedItems.findIndex((i: JewelryItem) => i.item_code === item.item_code);
        if (index !== -1) {
          storedItems[index].stock_qty -= item.quantity;
        }
      }
      localStorage.setItem('jewelry_items', JSON.stringify(storedItems));

      const invoiceLinkKey = `sale-link:${customerName}|${new Date().toISOString().slice(0,10)}|${currentInvoiceNumber}`;
      const relatedGoldOrder = JSON.parse(localStorage.getItem('gold_invoices') || '[]').find((inv: any) =>
        inv.customer_name === customerName || inv.invoice_number === currentInvoiceNumber
      );

      const invoice = {
        id: Date.now(),
        invoice_number: currentInvoiceNumber,
        customer_name: customerName,
        items: cart.map(item => ({ ...item, quantity: item.quantity, total: item.quantity * item.price })),
        total_amount: total,
        seller_name: sellerName,
        seller_code: sellerName === 'خالد تركي' ? 'U001' : sellerName,
        payment_method: paymentMethod,
        transfer_number: transferNumber,
        bank_name: bankName,
        card_receipt_number: cardReceiptNumber,
        card_receipt_date: cardReceiptDate,
        related_order_number: relatedGoldOrder?.invoice_number || '',
        related_receipt_number: relatedGoldOrder?.receipt_number || '',
        linked_gold_invoice_number: relatedGoldOrder?.invoice_number || '',
        invoice_link_key: relatedGoldOrder?.invoice_link_key || invoiceLinkKey,
        created_at: new Date().toISOString(),
      };

      // Save to Supabase first
      if (isSupabaseAvailable()) {
        try {
          await jewelryApi.confirmSale(invoice);
          console.log('Invoice saved to Supabase:', invoice.invoice_number);
        } catch (err) {
          console.log('Supabase error, saving to localStorage:', err);
        }
      }

      // Also save to localStorage as backup
      const existingInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
      existingInvoices.unshift(invoice);
      localStorage.setItem('saved_invoices', JSON.stringify(existingInvoices.slice(0, 100)));

      // Auto-record sale in treasury
      try {
        recordSale(total, customerName || 'عميل نقدي', invoice.invoice_number, paymentMethod);
      } catch (e) {
        console.error('Error recording sale to treasury:', e);
      }

      localStorage.setItem('last_customer_name', JSON.stringify(customerName));
      cartStorage.clearCart();
      setCart([]);
      setTransferNumber('');
      setBankName('');
      setCardReceiptNumber('');
      setCardReceiptDate('');
      setPaymentMethod('cash');
      setSavedInvoice(invoice);
      setIsSaving(false);
      setShowInvoicePreview(false);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('حدث خطأ أثناء تأكيد البيع!');
      setIsSaving(false);
      setShowInvoicePreview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle className="w-5 h-5" />تمت إضافة القطعة للسلة
        </div>
      )}

      {/* Saved Invoice Success Modal */}
      {savedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-green-600/30 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">تم حفظ الفاتورة بنجاح</h2>
            <p className="text-gray-400 mb-1">رقم الفاتورة: <span className="text-yellow-400 font-bold">{savedInvoice.invoice_number}</span></p>
            <p className="text-gray-400 mb-6">العميل: <span className="text-white font-bold">{savedInvoice.customer_name}</span></p>
            <div className="flex gap-3">
              <button onClick={() => { handlePrintAfterSave(savedInvoice); setSavedInvoice(null); navigate('/invoices'); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <Printer className="w-5 h-5" />طباعة الفاتورة
              </button>
              <button onClick={() => { setSavedInvoice(null); navigate('/invoices'); }} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <ArrowRight className="w-5 h-5" />عرض الفواتير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal - Smaller Camera + Manual Entry */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="bg-gray-900 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-yellow-400" />
              مسح الباركود
            </h3>
            <button onClick={stopCamera} className="text-white p-2 hover:bg-gray-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Smaller Camera Preview */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <div className="aspect-video bg-gray-800 rounded-2xl overflow-hidden border-2 border-yellow-500 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Frame */}
                {!cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-4 border-yellow-400 rounded-2xl animate-pulse shadow-lg shadow-yellow-400/30" />
                  </div>
                )}
              </div>

              {/* Camera Error */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-2xl">
                  <div className="text-center p-6">
                    <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-red-400 font-bold mb-2">خطأ في الكاميرا</p>
                    <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                    <button onClick={() => startCamera()} className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold">إعادة المحاولة</button>
                  </div>
                </div>
              )}

              {/* Scan Message */}
              {scanMessage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
                  {scanMessage.includes('✓') ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : scanMessage.includes('❌') ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-yellow-400 animate-spin" />
                  )}
                  <span>{scanMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Code Entry - Prominent */}
          <div className="bg-gray-900 p-4 border-t border-gray-800">
            <p className="text-center text-yellow-400 text-sm mb-3 flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4" />
              أو أدخل الكود يدوياً
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="text"
                id="manual-code-input"
                placeholder="أدخل كود القطعة..."
                className="flex-1 bg-gray-800 border border-yellow-600/50 text-white px-4 py-4 rounded-xl text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('manual-code-input') as HTMLInputElement;
                    if (input.value.trim()) {
                      simulateScan(input.value.trim().toUpperCase());
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('manual-code-input') as HTMLInputElement;
                  if (input.value.trim()) {
                    simulateScan(input.value.trim().toUpperCase());
                    input.value = '';
                  } else {
                    input.focus();
                  }
                }}
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:from-yellow-700 hover:to-yellow-600 transition-all shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Selector Modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowItemSelector(false)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2"><Package className="w-6 h-6" />اختيار قطعة من المخزن</h3>
              <button onClick={() => setShowItemSelector(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 border-b border-gray-700">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => {
                    let val = e.target.value;
                    const arabicMap: Record<string, string> = {
                      '١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','٠':'0',
                      'ض':'Q','ص':'W','ث':'E','ق':'R','ف':'T','غ':'Y','ع':'U','ه':'I','خ':'O','ح':'P',
                      'ج':'A','ش':'S','ي':'D','ب':'F','ل':'G','ن':'H','م':'J','ك':'L','ت':'Z',
                      'ا':'A','ى':'A','ء':'Q','ؤ':'Q',
                    };
                    val = val.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48));
                    val = val.replace(/[\u0621-\u064A]/g, (ch) => arabicMap[ch] || ch);
                    setSearchQuery(val);
                  }} placeholder="ابحث بالكود أو الاسم..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pr-12 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    dir="ltr" lang="en"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchItems()} />
                </div>
                <button onClick={handleSearchItems} className="bg-yellow-600 px-6 py-3 rounded-lg text-gray-900 font-bold">بحث</button>
                <button onClick={loadAllItems} className="bg-gray-700 px-6 py-3 rounded-lg text-white">عرض الكل</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">لا توجد نتائج</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((item) => {
                    const inCart = addedItems[item.item_code] || 0;
                    const available = item.stock_qty - inCart;
                    return (
                      <div key={item.item_code} className={`bg-gray-700 rounded-lg p-4 border ${available <= 0 ? 'border-red-500 opacity-50' : 'border-gray-600 hover:border-yellow-500'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <img src={generateQRCodeUrl(item.item_code)} alt="QR" className="w-12 h-12" />
                          <div>
                            <div className="font-bold text-yellow-400">{item.model_name}</div>
                            <div className="text-sm text-gray-400 font-mono">{item.item_code}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                          <div className="bg-gray-800 rounded p-2 text-center"><span className="text-gray-400">العيار</span><br /><span className="font-bold">{item.karat}</span></div>
                          <div className="bg-gray-800 rounded p-2 text-center"><span className="text-gray-400">الوزن</span><br /><span className="font-bold">{item.weight} غم</span></div>
                          <div className="bg-gray-800 rounded p-2 text-center"><span className="text-gray-400">المتاح</span><br /><span className={`font-bold ${available <= 0 ? 'text-red-400' : 'text-green-400'}`}>{available}</span></div>
                        </div>
                        <button onClick={() => addItemToCart(item)} disabled={available <= 0} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                          <ShoppingCart className="w-4 h-4" />إضافة للسلة
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Name Input */}
      <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-yellow-600/20">
        <label className="block text-yellow-400 font-bold mb-2">اسم العميل</label>
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل..." className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>

      {/* Payment Method Selection */}
      <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-yellow-600/20">
        <label className="block text-yellow-400 font-bold mb-3">طريقة الدفع</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'cash'
                ? 'border-green-500 bg-green-600/20 text-green-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <Banknote className="w-8 h-8" />
            <span className="font-bold text-sm">نقدي</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <CreditCard className="w-8 h-8" />
            <span className="font-bold text-sm">بطاقة مصرفية</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('transfer')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'transfer'
                ? 'border-purple-500 bg-purple-600/20 text-purple-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <Building2 className="w-8 h-8" />
            <span className="font-bold text-sm">حوالة بنكية</span>
          </button>
        </div>
        <div className="mt-3 text-center">
          <span className="text-gray-400 text-sm">الطريقة المحددة: </span>
          <span className={`font-bold ${
            paymentMethod === 'cash' ? 'text-green-400' :
            paymentMethod === 'card' ? 'text-blue-400' : 'text-purple-400'
          }`}>
            {paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'بطاقة مصرفية' : 'حوالة بنكية'}
          </span>
        </div>
        {/* Payment Details */}
        {paymentMethod === 'transfer' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">رقم الحوالة</label>
              <input type="text" value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} placeholder="أدخل رقم الحوالة..." className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">اسم البنك</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="أدخل اسم البنك..." className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        )}
        {paymentMethod === 'card' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">رقم فاتورة الماكينة</label>
              <input type="text" value={cardReceiptNumber} onChange={(e) => setCardReceiptNumber(e.target.value)} placeholder="رقم فاتورة الخصم..." className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">تاريخ الفاتورة</label>
              <input type="date" value={cardReceiptDate} onChange={(e) => setCardReceiptDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" lang="en" />
            </div>
          </div>
        )}
      </div>

      {/* Add Item Options */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <button onClick={() => { setShowItemSelector(true); loadAllItems(); }} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl">
          <Package className="w-7 h-7" /><span className="text-lg">اختيار من المخزن</span>
        </button>
      </div>

      {/* Cart */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2"><ShoppingCart className="w-6 h-6" />سلة المبيعات</h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button onClick={() => { if (confirm('هل أنت متأكد من تفريغ السلة؟')) { cartStorage.clearCart(); setCart([]); } }} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 transition-all">
                <Trash2 className="w-4 h-4" />تفريغ السلة
              </button>
            )}
            <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">{cart.length} قطعة</span>
          </div>
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>السلة فارغة</p>
              <p className="text-sm mt-2">امسح باركود أو اختر من المخزن</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.item_code} className="bg-gray-700 rounded-xl p-4 border border-yellow-600/20">
                  <div className="flex items-start gap-4 mb-3">
                    <img src={generateQRCodeUrl(item.item_code)} alt="QR" className="w-16 h-16" />
                    <div className="flex-1">
                      <div className="font-bold text-lg text-yellow-400">{item.model_name}</div>
                      <div className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded inline-block mt-1">{item.item_code}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div className="bg-gray-800 rounded-lg p-2 text-center"><div className="text-gray-400 text-xs">العيار</div><div className="font-bold">{item.karat || '21'} قيراط</div></div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center"><div className="text-gray-400 text-xs">الوزن</div><div className="font-bold">{formatNumber(item.weight)} غ</div></div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center"><div className="text-gray-400 text-xs">السعر/غ</div><div className="font-bold text-green-400">{formatCurrency(item.price)}</div></div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center"><div className="text-gray-400 text-xs">المخزون</div><div className="font-bold">{item.stock_qty}</div></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.item_code, item.quantity - 1)} className="w-10 h-10 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center text-xl font-bold">-</button>
                      <span className="w-12 text-center font-bold text-xl text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.item_code, item.quantity + 1)} disabled={item.quantity >= item.stock_qty} className="w-10 h-10 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg flex items-center justify-center text-xl font-bold disabled:opacity-50">+</button>
                    </div>
                    <div className="text-left">
                      <div className="text-green-400 font-bold text-xl">{formatCurrency(item.total)}</div>
                      <button onClick={() => removeItem(item.item_code)} className="text-red-500 hover:text-red-400 mt-1 flex items-center gap-1"><Trash2 className="w-4 h-4" /><span className="text-sm">حذف</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-gray-700 p-6 bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl text-gray-300">الإجمالي:</span>
              <span className="text-3xl font-bold text-green-400">{formatCurrency(total)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { const num = getInvoiceNumber(); if (num) { setCurrentInvoiceNumber(num); setShowInvoicePreview(true); } else { alert('لا يوجد دفتر فواتير نشط. يرجى إنشاء دفتر فواتير أولاً.'); } }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"><Eye className="w-6 h-6" />معاينة</button>
              <button onClick={sendToWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all"><Send className="w-6 h-6" />WhatsApp</button>
              <button onClick={handleCheckout} disabled={!customerName.trim() || isSaving} className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Printer className="w-6 h-6" />تأكيد البيع</button>
            </div>
          </div>
        )}
      </div>

      {showInvoicePreview && <PreviewInvoice />}
    </div>
  );
};

export default SalesPage;