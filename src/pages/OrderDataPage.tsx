import React, { useState, useEffect } from 'react';
import { Package, Plus, Check, X, DollarSign, Scale, Coins, Link, History, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addOrder } from '../services/orders';

interface CustomerReceiptOption {
  key: string;
  label: string;
  icon: string;
}

const customerReceiptOptions: CustomerReceiptOption[] = [
  { key: 'raw_gold', label: 'ذهب خام', icon: 'gold' },
  { key: 'pre_manufactured_used_gold', label: 'ذهب سابق التصنيع مستعمل', icon: 'ring' },
  { key: 'scrap_gold', label: 'ذهب مكسر', icon: 'broken' },
  { key: 'gold_bullion', label: 'ذهب سبيكة', icon: 'bar' },
  { key: 'financial_amount', label: 'مبلغ مالي بقيمة', icon: 'cash' },
  { key: 'used_silver', label: 'فضة مستعملة', icon: 'silver' },
  { key: 'new_silver_bullions', label: 'فضة جديدة سبائك', icon: 'silver_bar' },
];

type Currency = 'LYD' | 'USD' | 'EUR';

const OrderDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customerReceiptType, setCustomerReceiptType] = useState<string>('');
  const [goldWeight, setGoldWeight] = useState<string>('');
  const [bullionCount, setBullionCount] = useState<string>('');
  const [financialAmount, setFinancialAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('LYD');
  const [notes, setNotes] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CustomerReceiptOption | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load order history
  useEffect(() => {
    const stored = localStorage.getItem('order_data');
    if (stored) {
      setOrderHistory(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    if (!customerReceiptType) {
      alert('يرجى اختيار نوع الاستلام');
      return;
    }

    const orderData = {
      id: Date.now(),
      customer_code: customerCode || `C${Date.now()}`,
      customer_name: customerName,
      customer_receipt_type: customerReceiptType,
      goldWeight: customerReceiptType === 'raw_gold' ? goldWeight : null,
      bullionCount: customerReceiptType === 'gold_bullion' ? bullionCount : null,
      financialAmount: customerReceiptType === 'financial_amount' ? { amount: financialAmount, currency } : null,
      notes,
      created_at: new Date().toISOString(),
    };

    // Save to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('order_data') || '[]');
    existingOrders.unshift(orderData);
    localStorage.setItem('order_data', JSON.stringify(existingOrders));
    setOrderHistory(existingOrders);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Create linked order in Orders system
    const receiptTypeLabel = selectedOption?.label || customerReceiptType;
    addOrder({
      customerName: customerName,
      orderType: receiptTypeLabel,
      karat: '21',
      totalValue: financialAmount ? parseFloat(financialAmount) : 0,
      deposit: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      receiveDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `نوع الاستلام: ${receiptTypeLabel}${goldWeight ? ` - الوزن: ${goldWeight} كغ` : ''}${bullionCount ? ` - عدد السبائك: ${bullionCount}` : ''}`,
    });

    // Reset form
    setCustomerName('');
    setCustomerCode('');
    setCustomerReceiptType('');
    setGoldWeight('');
    setBullionCount('');
    setFinancialAmount('');
    setNotes('');
    setSelectedOption(null);
  };

  const selectOption = (option: CustomerReceiptOption) => {
    setCustomerReceiptType(option.key);
    setSelectedOption(option);
  };

  const deleteOrder = (id: number) => {
    if (!confirm('هل تريد حذف هذه البيانات؟')) return;
    const updated = orderHistory.filter(o => o.id !== id);
    localStorage.setItem('order_data', JSON.stringify(updated));
    setOrderHistory(updated);
  };

  const goToOrders = () => {
    navigate('/orders');
  };

  const getReceiptTypeLabel = (key: string) => {
    const option = customerReceiptOptions.find(o => o.key === key);
    return option?.label || key;
  };

  const inputClass = "w-full bg-gray-800 border border-yellow-600/30 rounded-lg px-4 py-3 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all";
  const labelClass = "block text-gray-300 mb-2 font-medium";

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce z-50">
          <Check className="w-5 h-5" />
          تم حفظ بيانات الطلبية بنجاح!
        </div>
      )}

      {/* Header with History Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-yellow-400">إدخال بيانات الطلبية</h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
        >
          <History className="w-5 h-5" />
          {showHistory ? 'إخفاء السجل' : 'عرض السجل'}
        </button>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
          <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            سجل بيانات الطلبية
          </h3>
          {orderHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-4">لا يوجد سجل</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {orderHistory.map((order) => (
                <div key={order.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-white">{order.customer_name}</span>
                      <span className="text-gray-400 text-sm font-mono">({order.customer_code})</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      نوع الاستلام: <span className="text-yellow-400">{getReceiptTypeLabel(order.customer_receipt_type)}</span>
                      {order.goldWeight && <span className="mr-2">| الوزن: {order.goldWeight} كغ</span>}
                      {order.bullionCount && <span className="mr-2">| السبائك: {order.bullionCount}</span>}
                      {order.financialAmount && <span className="mr-2">| المبلغ: {order.financialAmount.amount} {order.financialAmount.currency}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={goToOrders}
            className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Link className="w-5 h-5" />
            إدارة الطلبيات
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6" />
            إدخال بيانات الطلبية
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
            <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات العميل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>اسم العميل *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  placeholder="أدخل اسم العميل..."
                  required
                />
              </div>
              <div>
                <label className={labelClass}>كود العميل (اختياري)</label>
                <input
                  type="text"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className={inputClass}
                  placeholder="أو اتركه فارغاً للتوليد تلقائياً..."
                />
              </div>
            </div>
          </div>

          {/* Customer Receipt Type Selection */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
            <label className={labelClass}>استلام من الزبون</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customerReceiptOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`p-3 rounded-lg text-sm transition-all text-right flex items-center justify-between ${
                    customerReceiptType === option.key
                      ? 'bg-yellow-500 text-gray-900 font-bold shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{option.label}</span>
                  {customerReceiptType === option.key && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on Selection */}
          {customerReceiptType === 'raw_gold' && (
            <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
              <label className={labelClass}>الوزن (كغ) - من 1 كغ إلى 10 كغ</label>
              <div className="relative">
                <Scale className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="10"
                  value={goldWeight}
                  onChange={(e) => setGoldWeight(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="1.00 - 10.00"
                  required
                />
              </div>
              <p className="text-gray-500 text-sm mt-2">الحد الأدنى: 1 كغ | الحد الأقصى: 10 كغ</p>
            </div>
          )}

          {customerReceiptType === 'gold_bullion' && (
            <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
              <label className={labelClass}>عدد السبائك</label>
              <div className="relative">
                <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={bullionCount}
                  onChange={(e) => setBullionCount(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="أدخل عدد السبائك"
                  required
                />
              </div>
            </div>
          )}

          {customerReceiptType === 'financial_amount' && (
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
              <label className={labelClass}>المبلغ المالي</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financialAmount}
                    onChange={(e) => setFinancialAmount(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="0.00"
                    required
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="LYD">دينار / LYD</option>
                  <option value="USD">دولار / USD</option>
                  <option value="EUR">يورو / EUR</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div>
            <label className={labelClass}>ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="أضف أي ملاحظات إضافية هنا..."
              rows={4}
            />
          </div>

          {/* Summary */}
          {selectedOption && (
            <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
              <h4 className="text-yellow-400 font-bold mb-2">ملخص الطلبية:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 rounded-lg p-2">
                  <span className="text-gray-400">العميل:</span>
                  <p className="font-bold text-white">{customerName || '---'}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <span className="text-gray-400">نوع الاستلام:</span>
                  <p className="font-bold text-white">{selectedOption.label}</p>
                </div>
                {goldWeight && (
                  <div className="bg-gray-800 rounded-lg p-2">
                    <span className="text-gray-400">الوزن:</span>
                    <p className="font-bold text-white">{goldWeight} كغ</p>
                  </div>
                )}
                {bullionCount && (
                  <div className="bg-gray-800 rounded-lg p-2">
                    <span className="text-gray-400">عدد السبائك:</span>
                    <p className="font-bold text-white">{bullionCount}</p>
                  </div>
                )}
                {financialAmount && (
                  <div className="bg-gray-800 rounded-lg p-2">
                    <span className="text-gray-400">المبلغ:</span>
                    <p className="font-bold text-white">{financialAmount} {currency}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!customerReceiptType || !customerName.trim()}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {customerReceiptType && customerName.trim() ? (
              <>
                <Plus className="w-6 h-6" />
                حفظ وإنشاء طلبية
              </>
            ) : (
              'أدخل اسم العميل واختر نوع الاستلام'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderDataPage;