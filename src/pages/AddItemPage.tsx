import React, { useState, useRef } from 'react';
import { QrCode, Plus, Package, Check, Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { jewelryApi } from '../services/supabase';
import { JewelryItem } from '../services/supabase';

const AddItemPage: React.FC = () => {
  const [formData, setFormData] = useState({
    item_type: 'G',
    karat: '21',
    origin: 'L',
    category: 'R',
    status: 'جديد',
    model_name: '',
    weight: '',
    price: '',
    stock_qty: '1',
  });
  const [recentItems, setRecentItems] = useState<JewelryItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const item = await jewelryApi.addItem({
        ...formData,
        weight: parseFloat(formData.weight),
        price: parseFloat(formData.price),
        stock_qty: parseInt(formData.stock_qty),
        image_url: imagePreview || null,
      });
      setRecentItems([item, ...recentItems]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setFormData({
        ...formData,
        model_name: '',
        weight: '',
        price: '',
      });
      removeImage();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-gray-800 border border-yellow-600/30 rounded-lg px-4 py-3 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all";
  const labelClass = "block text-gray-300 mb-2 font-medium";

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce z-50">
          <Check className="w-5 h-5" />
          تم حفظ القطعة بنجاح!
        </div>
      )}

      <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            تكويد قطعة جديدة
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-yellow-600/30 rounded-xl p-4 bg-gray-700/30">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="معاينة القطعة"
                  className="w-full h-48 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-700/50 rounded-lg transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-gray-300 text-center mb-2">اضغط لرفع صورة القطعة</p>
                <p className="text-gray-500 text-sm text-center">PNG, JPG حتى 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* First Row - Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>النوع</label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                className={inputClass}
              >
                <option value="G">ذهب</option>
                <option value="S">فضة</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>العيار</label>
              <select
                value={formData.karat}
                onChange={(e) => setFormData({ ...formData, karat: e.target.value })}
                className={inputClass}
              >
                <option value="21">21</option>
                <option value="18">18</option>
                <option value="24">24</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>المنشأ</label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className={inputClass}
              >
                <option value="L">ليبي</option>
                <option value="T">تركي</option>
                <option value="I">إيطالي</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>الصنف</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={inputClass}
              >
                <option value="R">خاتم</option>
                <option value="BR">سوار</option>
                <option value="NL">قلادة</option>
                <option value="ER">حلق</option>
                <option value="NK">غريل</option>
              </select>
            </div>
          </div>

          {/* Second Row - Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الموديل</label>
              <input
                type="text"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className={inputClass}
                placeholder="أدخل اسم الموديل"
                required
              />
            </div>
            <div>
              <label className={labelClass}>الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputClass}
              >
                <option value="جديد">جديد</option>
                <option value="تكسير">تكسير</option>
                <option value="مستعمل">مستعمل</option>
              </select>
            </div>
          </div>

          {/* Third Row - Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>الوزن (غ)</label>
              <input
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className={inputClass}
                placeholder="0.000"
                required
              />
            </div>
            <div>
              <label className={labelClass}>السعر (د.ل)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelClass}>العدد</label>
              <input
                type="number"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                className={inputClass}
                min="1"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Plus className="w-6 h-6" />
                حفظ القطعة
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="mt-8 bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-yellow-600/20">
          <div className="bg-gray-700 px-6 py-4">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <Package className="w-5 h-5" />
              آخر القطع المضافة
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentItems.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-yellow-600/20">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.model_name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-yellow-600 text-white px-2 py-1 rounded text-sm font-mono">
                      {item.item_code}
                    </span>
                    <span className="text-gray-400 text-sm">{item.stock_qty} قطعة</span>
                  </div>
                  <h4 className="text-white font-semibold">{item.model_name}</h4>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{item.weight} غ</span>
                    <span className="text-yellow-400 font-bold">{item.price} د.ل</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddItemPage;