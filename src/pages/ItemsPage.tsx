import React, { useState, useEffect } from 'react';
import { Package, Printer, Filter } from 'lucide-react';
import { jewelryApi, generateQRCodeUrl } from '../services/supabase';
import { JewelryItem } from '../services/supabase';

const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await jewelryApi.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'available') return item.stock_qty > 0;
    if (filter === 'out') return item.stock_qty <= 0;
    return true;
  });

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.price * item.stock_qty, 0);
  };

  const getTotalWeight = () => {
    return items.reduce((sum, item) => sum + item.weight * item.stock_qty, 0);
  };

  const printSelectedQR = () => {
    if (!selectedItem) return;
    const qrUrl = generateQRCodeUrl(selectedItem.item_code);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR - ${selectedItem.item_code}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; direction: rtl; }
            .qr { width: 200px; height: 200px; }
            .code { font-size: 24px; font-weight: bold; margin-top: 20px; color: #d4af37; }
            .info { color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <img src="${qrUrl}" class="qr" alt="QR Code" />
          <div class="code">${selectedItem.item_code}</div>
          <div class="info">${selectedItem.model_name}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <Package className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{items.length}</p>
          <p className="text-gray-400 text-sm">إجمالي القطع</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <p className="text-2xl font-bold text-green-400">{items.filter((i) => i.stock_qty > 0).length}</p>
          <p className="text-gray-400 text-sm">متوفر</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <p className="text-2xl font-bold text-yellow-400">{getTotalWeight().toFixed(2)} غ</p>
          <p className="text-gray-400 text-sm">إجمالي الوزن</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <p className="text-2xl font-bold text-blue-400">{getTotalValue().toFixed(2)} د.ل</p>
          <p className="text-gray-400 text-sm">قيمة المخزون</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-yellow-600/20">
        <div className="flex items-center gap-4">
          <Filter className="text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            متوفر
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            نفد
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          طباعة QR
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-all hover:scale-105 border border-yellow-600/20 ${
                item.stock_qty <= 0 ? 'opacity-60' : ''
              } ${selectedItem?.id === item.id ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <div className="bg-white rounded-lg p-2 mb-3 flex justify-center">
                <img
                  src={generateQRCodeUrl(item.item_code)}
                  alt="QR"
                  className="w-24 h-24"
                />
              </div>

              <div className="text-center mb-2">
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-lg font-mono text-sm">
                  {item.item_code}
                </span>
              </div>

              <h3 className="text-white font-bold text-center mb-2 truncate">{item.model_name}</h3>

              <div className="flex justify-between text-sm text-gray-400 mb-3">
                <span>{item.karat} عيار</span>
                <span>{item.weight} غ</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-yellow-400 font-bold">{item.price} د.ل</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    item.stock_qty > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {item.stock_qty > 0 ? `${item.stock_qty} قطعة` : 'نفذ'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-yellow-600/30">
            <div className="text-center">
              <div className="bg-white rounded-lg p-4 inline-block mb-4">
                <img src={generateQRCodeUrl(selectedItem.item_code)} alt="QR" className="w-40 h-40" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedItem.model_name}</h3>
              <p className="text-yellow-400 font-mono text-lg mb-4">{selectedItem.item_code}</p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block">النوع</span>
                  <span className="text-white">{selectedItem.item_type === 'G' ? 'ذهب' : 'فضة'}</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block">العيار</span>
                  <span className="text-white">{selectedItem.karat}</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block">الوزن</span>
                  <span className="text-white">{selectedItem.weight} غ</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block">السعر</span>
                  <span className="text-yellow-400 font-bold">{selectedItem.price} د.ل</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={printSelectedQR}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  طباعة
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          .fixed, .sticky { display: none !important; }
          .bg-gray-800, .bg-gray-900 { background: white !important; color: black !important; }
          .text-white, .text-yellow-400, .text-gray-400 { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default ItemsPage;