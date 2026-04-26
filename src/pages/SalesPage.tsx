import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, ShoppingCart, Printer, X, AlertCircle, CheckCircle, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartStorage, generateInvoiceNumber, jewelryApi, generateQRCodeUrl } from '../services/supabase';
import { CartItem } from '../services/supabase';

const SalesPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [sellerName, setSellerName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // تحميل بيانات البائع من localStorage
    const savedSeller = localStorage.getItem('seller_name') || 'خالد تركي';
    setSellerName(savedSeller);

    const savedCart = cartStorage.getCart();
    setCart(savedCart);
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [cart]);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowScanner(true);
    } catch (err) {
      setCameraError('لا يمكن الوصول للكاميرا. تأكد من إعطاء الصلاحية.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowScanner(false);
  };

  const simulateScan = async (code: string) => {
    setScanMessage('جاري البحث...');

    try {
      const item = await jewelryApi.getItemByCode(code);

      if (!item) {
        setScanMessage('❌ القطعة غير موجودة!');
        setTimeout(() => setScanMessage(''), 2000);
        return;
      }

      if (item.stock_qty <= 0) {
        setScanMessage('❌ القطعة نفدت من المخزون!');
        setTimeout(() => setScanMessage(''), 2000);
        return;
      }

      const newCart = cartStorage.addToCart(item);
      setCart(newCart);
      setScanMessage(`✓ تمت إضافة: ${item.model_name}`);
      setShowSuccess(true);
      setTimeout(() => {
        setScanMessage('');
        setShowSuccess(false);
      }, 1500);
    } catch (err) {
      setScanMessage('حدث خطأ في الاتصال!');
    }
  };

  const removeItem = (code: string) => {
    const newCart = cartStorage.removeFromCart(code);
    setCart(newCart);
  };

  const updateQuantity = (code: string, qty: number) => {
    const newCart = cartStorage.updateQuantity(code, qty);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      for (const item of cart) {
        await jewelryApi.updateStock(item.item_code, item.quantity);
      }

      const invoice = {
        id: Date.now(),
        invoice_number: generateInvoiceNumber(),
        customer_name: sellerName,
        items: cart,
        total_amount: total,
        seller_name: sellerName,
        seller_code: '001',
        created_at: new Date().toISOString(),
      };

      await jewelryApi.confirmSale(invoice);

      cartStorage.clearCart();
      setCart([]);

      navigate('/invoice', { state: { invoice } });
    } catch (err) {
      alert('حدث خطأ أثناء تأكيد البيع!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle className="w-5 h-5" />
          تمت إضافة القطعة للسلة
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold">مسح الباركود</h3>
            <button onClick={stopCamera} className="text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-yellow-400 rounded-2xl animate-pulse" />
            </div>
            {scanMessage && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl">
                {scanMessage}
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-4">
            <input
              type="text"
              placeholder="أو أدخل الكود يدوياً..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  simulateScan(input.value.trim().toUpperCase());
                  input.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input.value.trim()) {
                  simulateScan(input.value.trim().toUpperCase());
                  input.value = '';
                }
              }}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg font-bold"
            >
              تأكيد الكود
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {cameraError}
        </div>
      )}

      {/* زر المسح */}
      <button
        onClick={startCamera}
        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-6 rounded-2xl mb-6 flex items-center justify-center gap-3 transition-all shadow-xl"
      >
        <Camera className="w-8 h-8" />
        <span className="text-xl">مسح باركود القطعة</span>
      </button>

      {/* السلة */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            سلة المشتريات
          </h2>
          <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
            {cart.length} قطعة
          </span>
        </div>

        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>السلة فارغة</p>
              <p className="text-sm mt-2">امسح باركود القطعة لإضافتها</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.item_code} className="bg-gray-700 rounded-xl p-4 border border-yellow-600/20">
                  {/* معلومات القطعة */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-20 h-20 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <img
                        src={generateQRCodeUrl(item.item_code)}
                        alt="QR"
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-yellow-400">{item.model_name}</div>
                      <div className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded inline-block mt-1">
                        {item.item_code}
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل القطعة */}
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-gray-400 text-xs">العينة</div>
                      <div className="font-bold">{item.karat || '21'} قيراط</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-gray-400 text-xs">الوزن</div>
                      <div className="font-bold">{item.weight} غ</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-gray-400 text-xs">السعر/غ</div>
                      <div className="font-bold text-green-400">{item.price.toFixed(2)} د.ل</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-gray-400 text-xs">النوع</div>
                      <div className="font-bold">{item.item_type === 'G' ? 'ذهب' : 'فضة'}</div>
                    </div>
                  </div>

                  {/* التحكم بالكميات */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.item_code, item.quantity - 1)}
                        className="w-10 h-10 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center text-xl font-bold"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-xl text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.item_code, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_qty}
                        className="w-10 h-10 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg flex items-center justify-center text-xl font-bold disabled:opacity-50"
                      >
                        +
                      </button>
                      <span className="text-gray-400 text-sm mr-2">المخزون: {item.stock_qty}</span>
                    </div>

                    <div className="text-left">
                      <div className="text-green-400 font-bold text-xl">{item.total.toFixed(2)} د.ل</div>
                      <button
                        onClick={() => removeItem(item.item_code)}
                        className="text-red-500 hover:text-red-400 mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">حذف</span>
                      </button>
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
              <span className="text-3xl font-bold text-green-400">{total.toLocaleString()} د.ل</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-6 h-6" />
              تأكيد البيع وطباعة الفاتورة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;