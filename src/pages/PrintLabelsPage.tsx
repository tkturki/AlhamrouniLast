import React, { useState, useEffect } from 'react';
import { Printer, FileText, Package, Search, QrCode } from 'lucide-react';
import { jewelryApi, generateQRCodeUrl, formatNumber, formatCurrency } from '../services/supabase';
import { printThermalLabel, printLabelSheet, THERMAL_SIZES } from '../services/thermalLabel';
import { JewelryItem } from '../services/supabase';

interface ThermalLabelData {
  itemCode: string;
  weight: number;
  karat?: string;
  pricePerGram?: number;
  storeName?: string;
}

interface ThermalLabelSize {
  width: number;
  height: number;
  name: string;
}

const PrintLabelsPage: React.FC = () => {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<JewelryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<ThermalLabelSize>(THERMAL_SIZES[0]);
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState<'single' | 'sheet'>('single');
  const [previewItem, setPreviewItem] = useState<JewelryItem | null>(null);

  // Load all items on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Load all items
  const loadItems = async () => {
    setLoading(true);
    try {
      // Load from localStorage first
      const localData = localStorage.getItem('jewelry_items');
      if (localData) {
        setItems(JSON.parse(localData));
      } else {
        // Fallback to API
        const allItems = await jewelryApi.getAllItems();
        setItems(allItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setLoading(false);
  };

  // Search items - FIXED to work with localStorage
  const searchItems = async () => {
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }
    setLoading(true);
    try {
      // Search in localStorage first
      const localData = localStorage.getItem('jewelry_items');
      if (localData) {
        const allItems = JSON.parse(localData);
        const q = searchQuery.toLowerCase().trim();
        const results = allItems.filter((item: JewelryItem) =>
          item.item_code?.toLowerCase().includes(q) ||
          item.model_name?.toLowerCase().includes(q) ||
          item.gold_item?.toLowerCase().includes(q)
        );
        setItems(results);
      } else {
        // Fallback to API
        const results = await jewelryApi.searchItems(searchQuery);
        setItems(results);
      }
    } catch (error) {
      console.error('Error searching:',	error);
    }
    setLoading(false);
  };

  // Toggle item selection
  const toggleItemSelection = (item: JewelryItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.item_code === item.item_code);
      if (exists) {
        return prev.filter(i => i.item_code !== item.item_code);
      } else {
        return [...prev, item];
      }
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedItems([...items]);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Print single label - NO PRICE
  const handlePrintSingle = (item: JewelryItem) => {
    const labelData: ThermalLabelData = {
      itemCode: item.item_code,
      weight: item.weight,
      karat: item.karat,
      // NO price per gram - removed
      storeName: 'AlHumroni Jewelry',
    };
    printThermalLabel(labelData, selectedSize);
  };

  // Print multiple labels - NO PRICE
  const handlePrintMultiple = () => {
    const labels: ThermalLabelData[] = selectedItems.map(item => ({
      itemCode: item.item_code,
      weight: item.weight,
      karat: item.karat,
      // NO price per gram - removed
      storeName: 'AlHumroni Jewelry',
    }));

    const rows = Math.ceil(labels.length / 3);
    printLabelSheet(labels, rows, 3, selectedSize);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <Printer className="w-8 h-8" />
          Print Labels
        </h1>
      </div>

      {/* Label Size Selection */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-600/20">
        <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Select Label Size
        </h3>
        <div className="flex gap-3 flex-wrap">
          {THERMAL_SIZES.map((size) => (
            <button
              key={size.name}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedSize.name === size.name
                  ? 'bg-yellow-600 text-gray-900'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-600/20">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchItems()}
              placeholder="Search by code or name..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pr-12 pl-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <button
            onClick={loadItems}
            className="bg-gray-700 px-6 py-3 rounded-lg text-white hover:bg-gray-600"
          >
            Load All
          </button>
          <button
            onClick={searchItems}
            className="bg-yellow-600 px-6 py-3 rounded-lg text-gray-900 font-bold hover:bg-yellow-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* Print Type Selection */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-600/20">
        <h3 className="text-yellow-400 font-bold mb-3">Print Type</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setPrintType('single')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              printType === 'single'
                ? 'bg-yellow-600 text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Single Label
          </button>
          <button
            onClick={() => setPrintType('sheet')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              printType === 'sheet'
                ? 'bg-yellow-600 text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Label Sheet
          </button>
        </div>
      </div>

      {/* Selection Actions */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-600/20">
        <div className="flex items-center justify-between">
          <div className="text-gray-300">
            Selected: <span className="text-yellow-400 font-bold">{selectedItems.length}</span> items
          </div>
          <div className="flex gap-3">
            <button
              onClick={selectAll}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
            >
              Clear Selection
            </button>
            {printType === 'sheet' && selectedItems.length > 0 && (
              <button
                onClick={handlePrintMultiple}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-500 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print ({selectedItems.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-yellow-600/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-gray-300 w-12">
                  {printType === 'sheet' && (
                    <input
                      type="checkbox"
                      checked={selectedItems.length === items.length && items.length > 0}
                      onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                      className="w-5 h-5 rounded"
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-right text-gray-300">Code</th>
                <th className="px-4 py-3 text-right text-gray-300">Model</th>
                <th className="px-4 py-3 text-center text-gray-300">Karat</th>
                <th className="px-4 py-3 text-center text-gray-300">Weight</th>
                <th className="px-4 py-3 text-center text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No items found. Click "Load All" to load items.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSelected = selectedItems.some(i => i.item_code === item.item_code);
                  return (
                    <tr
                      key={item.item_code}
                      className={`border-t border-gray-700 hover:bg-gray-700/50 ${
                        isSelected ? 'bg-yellow-600/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {printType === 'sheet' ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item)}
                            className="w-5 h-5 rounded"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={generateQRCodeUrl(item.item_code)}
                            alt="QR"
                            className="w-10 h-10"
                          />
                          <span className="font-mono text-yellow-400">{item.item_code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{item.model_name}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.karat}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.weight.toFixed(3)} g</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40"
                            title="Preview"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          {printType === 'single' && (
                            <button
                              onClick={() => handlePrintSingle(item)}
                              className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-yellow-600/30">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-yellow-400">Label Preview</h3>
                <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-white text-2xl">
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Label Preview */}
              <div className="bg-white rounded-lg p-4 flex flex-col items-center mb-6">
                <img
                  src={generateQRCodeUrl(previewItem.item_code)}
                  alt="QR"
                  className="w-24 h-24"
                />
                <div className="mt-2 text-center">
                  <div className="font-mono text-sm text-gray-800">{previewItem.item_code}</div>
                  <div className="font-bold text-lg text-black">{previewItem.weight.toFixed(2)} g</div>
                  <div className="text-xs text-gray-500">Karat {previewItem.karat}</div>
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Code:</span>
                  <span className="text-yellow-400 font-mono">{previewItem.item_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white">{previewItem.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Karat:</span>
                  <span className="text-white">{previewItem.karat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weight:</span>
                  <span className="text-white">{previewItem.weight.toFixed(3)} g</span>
                </div>
                {previewItem.price_per_gram && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price/Gram:</span>
                    <span className="text-green-400">{formatCurrency(previewItem.price_per_gram)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintSingle(previewItem);
                  setPreviewItem(null);
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintLabelsPage;