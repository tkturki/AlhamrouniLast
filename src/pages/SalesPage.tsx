import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Trash2, ShoppingCart, Printer, X, AlertCircle, CheckCircle, QrCode, Eye, Save, ArrowRight, Search, Package, Send, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartStorage, generateInvoiceNumber, jewelryApi, generateQRCodeUrl, CartItem, SaleInvoice, JewelryItem, formatNumber, formatCurrency } from '../services/supabase';
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
  const navigate = useNavigate();

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
    const savedSeller = localStorage.getItem('seller_name') || 'خالد تركي';
    setSellerName(savedSeller);
    const savedCart = cartStorage.getCart();
    setCart(savedCart);
    const lastInvoice = JSON.parse(localStorage.getItem('last_customer_name') || 'null');
    if (lastInvoice) setCustomerName(lastInvoice);
  }, []);

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
    try {
      // Search in localStorage
      const storedItems = localStorage.getItem('jewelry_items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        const q = searchQuery.toLowerCase().trim();
        const filtered = parsedItems.filter((item: JewelryItem) =>
          item.item_code?.toLowerCase().includes(q) ||
          item.model_name?.toLowerCase().includes(q) ||
          item.gold_item?.toLowerCase().includes(q)
        );
        setSearchResults(filtered.filter((item: JewelryItem) => item.stock_qty > 0));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  const loadAllItems = async () => {
    setLoading(true);
    try {
      // Load from localStorage first (primary source)
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
      `📅 التاريخ: ${new Date().toLocaleDateString('ar-LY')}\n` +
      `👨‍💼 البائع: ${sellerName}\n` +
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

  // Print function - EXACT match with preview
  const handlePrint = (printerType: 'invoice' | 'label' | 'normal') => {
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

    // Build table rows from cart - EXACT same as PreviewInvoice
    const tableRows = cart.map((item, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${item.model_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace; font-size: 13px; background: #fefce8;">${item.item_code}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #ca8a04;">${item.karat}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${formatNumber(item.weight)} غم</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left; font-weight: bold; color: #15803d;">${formatNumber(item.quantity * item.price)} ل.د</td>
      </tr>
    `).join('');

    // EXACT same HTML as PreviewInvoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة - ${invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Tajawal', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: white;
            color: #111827;
            padding: 0;
            font-size: 14px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-container { width: 100%; max-width: 210mm; margin: 0 auto; background: white; }

          /* Header - EXACT match */
          .header {
            background: linear-gradient(to bottom, #eab308, #eab308, #eab308);
            padding: 24px;
            text-align: center;
          }
          .header h1 { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
          .header p { color: #1f2937; font-size: 14px; margin: 0; }

          /* Invoice Info Section */
          .invoice-info { padding: 24px; border-bottom: 1px solid #e5e7eb; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .info-section { margin-bottom: 16px; }
          .info-label { color: #6b7280; font-size: 12px; }
          .info-value { font-size: 16px; font-weight: 700; border-bottom: 2px dashed #d1d5db; padding-bottom: 4px; display: inline-block; min-width: 150px; }
          .info-value.mono { font-family: monospace; color: #ca8a04; font-size: 18px; }
          .info-left { text-align: left; }

          /* Items Table - EXACT match */
          .items-section { padding: 24px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table thead tr { background: #1f2937; color: white; }
          .items-table th { padding: 10px 8px; text-align: right; font-weight: 700; }
          .items-table th.center { text-align: center; }
          .items-table th.left { text-align: left; }
          .items-table tbody tr:nth-child(even) { background: #f9fafb; }

          /* Total Section - EXACT match */
          .total-section { padding: 0 24px 24px; }
          .total-box { background: #f3f4f6; border: 2px solid #eab308; border-radius: 12px; padding: 16px; }
          .total-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 2px solid #fde047; }
          .total-label { font-size: 18px; font-weight: 700; }
          .total-value { font-size: 28px; font-weight: 700; color: #15803d; }

          .words-box { background: linear-gradient(to bottom right, #fefce8, #fef9c3, #fff); border: 2px solid #eab308; border-radius: 12px; padding: 12px; text-align: center; margin-top: 12px; }
          .words-label { color: #a16207; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
          .words-value { font-size: 18px; font-weight: 700; color: #854d0e; }

          /* Footer */
          .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-text { color: #6b7280; font-size: 14px; }

          @page { size: A5; margin: 8mm; }
          @media print {
            body { padding: 0 !important; }
            .invoice-container { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>${settings.storeName}</h1>
            <p>أجود المجوهرات وأفخرها</p>
            <p style="margin-top: 6px; font-size: 12px; color: #374151;">${settings.storeAddress} | ${settings.storePhone}</p>
          </div>

          <div class="invoice-info">
            <div class="info-grid">
              <div>
                <p class="info-label">رقم الفاتورة</p>
                <p class="info-value mono">${invoiceNumber}</p>
              </div>
              <div class="info-left">
                <p class="info-label">التاريخ</p>
                <p class="info-value">${dateStr}</p>
              </div>
            </div>
            <div class="info-grid info-section">
              <div>
                <p class="info-label">العميل</p>
                <p class="info-value">${customerName || '------------------------'}</p>
              </div>
              <div class="info-left">
                <p class="info-label">البائع</p>
                <p class="info-value">${sellerName}</p>
              </div>
            </div>
          </div>

          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الصنف</th>
                  <th class="center">الكود</th>
                  <th class="center">العيار</th>
                  <th class="center">الوزن</th>
                  <th class="center">العدد</th>
                  <th class="left">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span class="total-label">الإجمالي:</span>
                <span class="total-value">${formatNumber(total)} ل.د</span>
              </div>
              <div class="words-box">
                <p class="words-label">المبلغ كتابة:</p>
                <p class="words-value">${totalInWords}</p>
              </div>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">شكراً لتعاملكم معنا - ${settings.storeName}</p>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">${settings.storeAddress} | ${settings.storePhone}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
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

      const invoice = {
        id: Date.now(),
        invoice_number: currentInvoiceNumber,
        customer_name: customerName,
        items: cart.map(item => ({ ...item, quantity: item.quantity, total: item.quantity * item.price })),
        total_amount: total,
        seller_name: sellerName,
        seller_code: '001',
        created_at: new Date().toISOString(),
      };

      // Save invoice to localStorage
      const existingInvoices = JSON.parse(localStorage.getItem('saved_invoices') || '[]');
      existingInvoices.unshift(invoice);
      localStorage.setItem('saved_invoices', JSON.stringify(existingInvoices.slice(0, 100)));

      // Auto-record sale in treasury
      try {
        recordSale(total, customerName || 'عميل نقدي', invoice.invoice_number);
      } catch (e) {
        console.error('Error recording sale to treasury:', e);
      }

      localStorage.setItem('last_customer_name', JSON.stringify(customerName));
      cartStorage.clearCart();
      setCart([]);
      navigate('/invoice', { state: { invoice } });
    } catch (err) {
      console.error('Checkout error:', err);
      alert('حدث خطأ أثناء تأكيد البيع!');
    } finally {
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
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث بالكود أو الاسم..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pr-12 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

      {/* Add Item Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={startCamera} className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl">
          <Camera className="w-7 h-7" /><span className="text-lg">مسح باركود</span>
        </button>
        <button onClick={() => { setShowItemSelector(true); loadAllItems(); }} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl">
          <Package className="w-7 h-7" /><span className="text-lg">اختيار من المخزن</span>
        </button>
      </div>

      {/* Cart */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2"><ShoppingCart className="w-6 h-6" />سلة المبيعات</h2>
          <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">{cart.length} قطعة</span>
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
              <button onClick={() => { setCurrentInvoiceNumber(generateInvoiceNumber()); setShowInvoicePreview(true); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"><Eye className="w-6 h-6" />معاينة</button>
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