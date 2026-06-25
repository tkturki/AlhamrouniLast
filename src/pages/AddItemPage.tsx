import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Plus, Package, Check, Camera, X, Search, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { modelNamesStorage, formatNumber, formatCurrency } from '../services/supabase';

// Gold Category Types
export interface GoldCategory {
  id: string;
  name: string;
  type: 'arabic' | 'foreign' | 'silver';
  items: string[];
}

// Storage for gold categories
const goldCategoriesStorage = {
  getAll: (): GoldCategory[] => {
    const data = localStorage.getItem('goldCategories_v2');
    if (data) return JSON.parse(data);

    // Default categories according to user requirements
    const defaults: GoldCategory[] = [
      {
        id: 'arabic',
        name: 'الذهب العربي',
        type: 'arabic',
        items: [
          'قلادة', 'سوارات', 'عرجون', 'فل', 'تكليلة', 'حزام', 'بيزوان', 'ضفة خراصات',
          'صدر', 'خاتم', 'صدر', 'رشقة', 'مريول', 'خلال', 'شمبير', 'تاج', 'كردان',
          'لبَة اليد', 'الجريحة'
        ]
      },
      {
        id: 'foreign',
        name: 'الذهب الأوروبي',
        type: 'foreign',
        items: [
          'خاتم', 'طقم', 'حديد مضفورة', 'حديد واقفة', 'خراض', 'ميني سيت', 'طقم كامنل اصفر',
          'طقم كامل ابيض', 'سلسلة مع تعليقة', 'سلسلة بروش', 'حداية 3 قطع'
        ]
      },
      {
        id: 'silver',
        name: 'الفضة',
        type: 'silver',
        items: ['فضة خام', 'فضة مصنعة']
      }
    ];
    goldCategoriesStorage.save(defaults);
    return defaults;
  },

  save: (categories: GoldCategory[]) => {
    localStorage.setItem('goldCategories_v2', JSON.stringify(categories));
  },

  addItem: (categoryId: string, item: string) => {
    const categories = goldCategoriesStorage.getAll();
    const category = categories.find(c => c.id === categoryId);
    if (category && !category.items.includes(item)) {
      category.items.push(item);
      goldCategoriesStorage.save(categories);
    }
    return categories;
  },

  removeItem: (categoryId: string, item: string) => {
    const categories = goldCategoriesStorage.getAll();
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.items = category.items.filter(i => i !== item);
      goldCategoriesStorage.save(categories);
    }
    return categories;
  },

  updateItem: (categoryId: string, oldItem: string, newItem: string) => {
    const categories = goldCategoriesStorage.getAll();
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const index = category.items.indexOf(oldItem);
      if (index !== -1) {
        category.items[index] = newItem;
        goldCategoriesStorage.save(categories);
      }
    }
    return categories;
  }
};

// Metal types (Color) - replaces old category combo
const metalTypesStorage = {
  getAll: (): string[] => {
    const data = localStorage.getItem('metalTypes');
    return data ? JSON.parse(data) : ['ذهب ابيض', 'اصفر', 'فضة', 'فضة مطلي', 'فضة عادي', 'احجار كريمة', 'جوهر'];
  },

  add: (type: string) => {
    const types = metalTypesStorage.getAll();
    if (!types.includes(type)) {
      types.push(type);
      localStorage.setItem('metalTypes', JSON.stringify(types));
    }
  },

  remove: (type: string) => {
    const types = metalTypesStorage.getAll().filter(t => t !== type);
    localStorage.setItem('metalTypes', JSON.stringify(types));
  }
};

// Karat storage
const karatStorage = {
  getAll: (): string[] => {
    const data = localStorage.getItem('karats');
    return data ? JSON.parse(data) : ['21', '18', '24'];
  },
  add: (karat: string) => {
    const karats = karatStorage.getAll();
    if (!karats.includes(karat)) {
      karats.push(karat);
      localStorage.setItem('karats', JSON.stringify(karats));
    }
  },
  remove: (karat: string) => {
    const karats = karatStorage.getAll().filter(k => k !== karat);
    localStorage.setItem('karats', JSON.stringify(karats));
  }
};

// Status storage
const statusStorage = {
  getAll: (): string[] => {
    const data = localStorage.getItem('statuses');
    return data ? JSON.parse(data) : ['جديد', 'تكسير', 'مستعمل'];
  },
  add: (status: string) => {
    const statuses = statusStorage.getAll();
    if (!statuses.includes(status)) {
      statuses.push(status);
      localStorage.setItem('statuses', JSON.stringify(statuses));
    }
  },
  remove: (status: string) => {
    const statuses = statusStorage.getAll().filter(s => s !== status);
    localStorage.setItem('statuses', JSON.stringify(statuses));
  }
};

const AddItemPage: React.FC = () => {
  const [formData, setFormData] = useState({
    item_type: 'G',
    karat: '21',
    gold_category: 'arabic',
    gold_item: '',
    metal_type: 'اصفر',
    status: 'جديد',
    model_name: '',
    weight: '',
    purchase_price: '',
    sale_price: '',
    price: '',
    notes: '',
    stock_qty: '1',
  });

  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Expanded sections
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['arabic']);

  // Dynamic data
  const [goldCategories, setGoldCategories] = useState<GoldCategory[]>(goldCategoriesStorage.getAll());
  const [karats, setKarats] = useState<string[]>(karatStorage.getAll());
  const [statuses, setStatuses] = useState<string[]>(statusStorage.getAll());
  const [metalTypes, setMetalTypes] = useState<string[]>(metalTypesStorage.getAll());

  // Modals
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ categoryId: string, oldName: string, newName: string } | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load model names from storage
  useEffect(() => {
    const existingNames = modelNamesStorage.getAll();
    if (existingNames.length === 0) {
      const defaultModels = ['خاتم سادة', 'خاتم مفرغ', 'سوار اسواري', 'سوار فا', 'قلادة طقم', 'حلق ازواج', 'غريل حبل', 'طقم كامل'];
      defaultModels.forEach(name => modelNamesStorage.add(name));
    }
  }, []);

  // Filter model suggestions
  useEffect(() => {
    if (formData.model_name.trim().length > 0) {
      const allModels = modelNamesStorage.getAll();
      const filtered = allModels.filter(name =>
        name.includes(formData.model_name)
      );
      setModelSuggestions(filtered.slice(0, 5));
      setShowModelDropdown(filtered.length > 0);
    } else {
      setModelSuggestions([]);
      setShowModelDropdown(false);
    }
  }, [formData.model_name]);

  // Update gold_item when gold_category changes
  useEffect(() => {
    const category = goldCategories.find(c => c.id === formData.gold_category);
    if (category && category.items.length > 0 && !category.items.includes(formData.gold_item)) {
      setFormData(prev => ({ ...prev, gold_item: category.items[0] }));
    }
  }, [formData.gold_category, goldCategories]);

  // Load recent items from localStorage
  useEffect(() => {
    const storedItems = localStorage.getItem('recent_items');
    if (storedItems) {
      setRecentItems(JSON.parse(storedItems));
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

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

  const handleAddNewOption = (type: string) => {
    if (!newOptionValue.trim()) return;

    if (type === 'model') {
      modelNamesStorage.add(newOptionValue.trim());
      setFormData({ ...formData, model_name: newOptionValue.trim() });
    } else if (type === 'karat') {
      karatStorage.add(newOptionValue.trim());
      setKarats(karatStorage.getAll());
      setFormData({ ...formData, karat: newOptionValue.trim() });
    } else if (type === 'status') {
      statusStorage.add(newOptionValue.trim());
      setStatuses(statusStorage.getAll());
      setFormData({ ...formData, status: newOptionValue.trim() });
    } else if (type === 'metalType') {
      metalTypesStorage.add(newOptionValue.trim());
      setMetalTypes(metalTypesStorage.getAll());
      setFormData({ ...formData, metal_type: newOptionValue.trim() });
    } else if (type === 'categoryItem' && showAddModal) {
      const updated = goldCategoriesStorage.addItem(showAddModal, newOptionValue.trim());
      setGoldCategories(updated);
      setFormData(prev => ({ ...prev, gold_item: newOptionValue.trim() }));
    }

    setNewOptionValue('');
    setShowAddModal(null);
  };

  const handleDeleteItem = (categoryId: string, item: string) => {
    if (!confirm(`هل تريد حذف "${item}"؟`)) return;
    const updated = goldCategoriesStorage.removeItem(categoryId, item);
    setGoldCategories(updated);
    if (formData.gold_item === item) {
      const category = updated.find(c => c.id === categoryId);
      setFormData(prev => ({ ...prev, gold_item: category?.items[0] || '' }));
    }
  };

  const handleEditItem = (categoryId: string, oldName: string) => {
    if (!editingItemName.trim()) return;
    const updated = goldCategoriesStorage.updateItem(categoryId, oldName, editingItemName.trim());
    setGoldCategories(updated);
    if (formData.gold_item === oldName) {
      setFormData(prev => ({ ...prev, gold_item: editingItemName.trim() }));
    }
    setEditingItem(null);
    setEditingItemName('');
  };

  const generateItemCode = () => {
    const karatCode = formData.karat;
    const typeCode = formData.item_type === 'G' ? 'G' : 'S';
    const categoryCode = formData.gold_category === 'arabic' ? 'A' : formData.gold_category === 'foreign' ? 'F' : 'SL';
    // Map Arabic item names to English codes
    const goldItemCodes: Record<string, string> = {
      'قلادة': 'NL', 'سوارات': 'BR', 'عرجون': 'AR', 'فل': 'FL', 'تكليلة': 'TK',
      'حزام': 'HZ', 'بيزوان': 'BZ', 'ضفة خراصات': 'DK', 'صدر': 'SR', 'خاتم': 'RG',
      'رشقة': 'RS', 'مريول': 'MR', 'خلال': 'KL', 'شمبير': 'SH', 'تاج': 'TJ',
      'كردان': 'KR', 'لبَة اليد': 'LH', 'الجريحة': 'JR',
      'طقم': 'ST', 'حديد مضفورة': 'HM', 'حديد واقفة': 'HW', 'خراض': 'KR',
      'ميني سيت': 'MS', 'طقم كامنل اصفر': 'TC', 'طقم كامل ابيض': 'TW',
      'سلسلة مع تعليقة': 'SC', 'سلسلة بروش': 'SB', 'حداية 3 قطع': 'HD',
      'فضة خام': 'FS', 'فضة مصنعة': 'FM'
    };
    const itemCode = goldItemCodes[formData.gold_item] || formData.gold_item.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${karatCode}${typeCode}${categoryCode}${itemCode}-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.model_name.trim()) {
        modelNamesStorage.add(formData.model_name.trim());
      }

      const item = {
        id: Date.now(),
        item_code: generateItemCode(),
        item_type: formData.item_type,
        karat: formData.karat,
        gold_category: formData.gold_category,
        gold_item: formData.gold_item,
        metal_type: formData.metal_type,
        status: formData.status,
        model_name: formData.model_name,
        weight: parseFloat(formData.weight),
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        price: parseFloat(formData.price),
        notes: formData.notes,
        stock_qty: parseInt(formData.stock_qty),
        image_url: imagePreview || null,
        created_at: new Date().toISOString(),
      };

      // Save to localStorage
      const existingItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
      existingItems.push(item);
      localStorage.setItem('jewelry_items', JSON.stringify(existingItems));

      // Update recent items
      const recent = [item, ...recentItems.slice(0, 4)];
      setRecentItems(recent);
      localStorage.setItem('recent_items', JSON.stringify(recent));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setFormData({
        ...formData,
        model_name: '',
        weight: '',
        purchase_price: '',
        sale_price: '',
        price: '',
        notes: '',
      });
      removeImage();
    } catch (error) {
      console.error('Error saving:', error);
      alert('حدث خطأ اثناء الحفظ');
    }
    setLoading(false);
  };

  const selectModelSuggestion = (name: string) => {
    setFormData({ ...formData, model_name: name });
    setShowModelDropdown(false);
  };

  const inputClass = "w-full bg-gray-800 border border-yellow-600/30 rounded-lg px-4 py-3 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all";
  const labelClass = "block text-gray-300 mb-2 font-medium";

  const selectedCategory = goldCategories.find(c => c.id === formData.gold_category);

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce z-50">
          <Check className="w-5 h-5" />
          تم حفظ القطعة بنجاح!
        </div>
      )}

      {/* Add New Option Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-400">
                {showAddModal === 'model' ? 'اضافة موديل جديد' :
                 showAddModal === 'karat' ? 'اضافة عيار جديد' :
                 showAddModal === 'status' ? 'اضافة حالة جديدة' :
                 showAddModal === 'metalType' ? 'اضافة نوع معدن جديد' :
                 `اضافة عنصر جديد لـ ${goldCategories.find(c => c.id === showAddModal)?.name}`}
              </h3>
              <button onClick={() => { setShowAddModal(null); setNewOptionValue(''); }} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="ادخل الاسم..."
                className="w-full bg-gray-800 border border-yellow-600/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewOption(showAddModal)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddNewOption(showAddModal)}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg"
                >
                  اضافة
                </button>
                <button
                  onClick={() => { setShowAddModal(null); setNewOptionValue(''); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
                  الغاء
                </button>
              </div>
            </div>
          </div>
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
                <img src={imagePreview} alt="معاينة القطعة" className="w-full h-48 object-contain rounded-lg" />
                <button type="button" onClick={removeImage} className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-700/50 rounded-lg transition-all" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-gray-300 text-center mb-2">اضغط لرفع صورة القطعة</p>
                <p className="text-gray-500 text-sm text-center">PNG, JPG حتى 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          {/* Metal Type Selection */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
            <label className={labelClass}>
              نوع المعدن
              <button type="button" onClick={() => setShowAddModal('metalType')} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 mr-2 float-left">
                <Plus className="w-4 h-4" />
              </button>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {metalTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (type === 'فضة' || type === 'فضة مطلي' || type === 'فضة عادي') {
                      setFormData(prev => ({ ...prev, metal_type: type, item_type: 'S' }));
                    } else {
                      setFormData(prev => ({ ...prev, metal_type: type, item_type: 'G' }));
                    }
                  }}
                  className={`p-2 rounded-lg text-sm transition-all text-center ${
                    formData.metal_type === type
                      ? 'bg-yellow-500 text-gray-900 font-bold shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Gold Categories - Collapsible Sections */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
            <label className={labelClass}>تصنيف الذهب</label>
            <div className="space-y-2">
              {goldCategories.map((category) => (
                <div key={category.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-3 flex items-center justify-between text-white hover:bg-gray-700 transition-all"
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">({category.items.length})</span>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedCategories.includes(category.id) && (
                    <div className="border-t border-gray-700 p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        {category.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, gold_category: category.id, gold_item: item }))}
                            className={`p-2 rounded-lg text-sm transition-all text-center flex items-center justify-between ${
                              formData.gold_category === category.id && formData.gold_item === item
                                ? 'bg-green-500 text-white font-medium'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <span>{item}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem({ categoryId: category.id, oldName: item, newName: item });
                                  setEditingItemName(item);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-1"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(category.id, item);
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(category.id)}
                        className="w-full bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        اضافة عنصر جديد
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Other Fields Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>
                العيار
                <button type="button" onClick={() => setShowAddModal('karat')} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 mr-2 float-left">
                  <Plus className="w-4 h-4" />
                </button>
              </label>
              <div className="relative">
                <select value={formData.karat} onChange={(e) => setFormData({ ...formData, karat: e.target.value })} className={inputClass}>
                  {karats.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (karats.length > 1 && confirm(`حذف عيار ${formData.karat}؟`)) {
                      karatStorage.remove(formData.karat);
                      setKarats(karatStorage.getAll());
                      setFormData(prev => ({ ...prev, karat: karats.find(k => k !== formData.karat) || karats[0] }));
                    } else if (karats.length <= 1) {
                      alert('لا يمكن حذف آخر عيار');
                    }
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 p-1 opacity-50 hover:opacity-100"
                  title="حذف"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                الحالة
                <button type="button" onClick={() => setShowAddModal('status')} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 mr-2 float-left">
                  <Plus className="w-4 h-4" />
                </button>
              </label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClass}>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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
            <div>
              <label className={labelClass}>العنصر المحدد</label>
              <div className="bg-gray-700/50 rounded-lg px-4 py-3 text-yellow-400">
                {formData.gold_item || 'اختر عنصر'}
              </div>
            </div>
          </div>

          {/* Model Name with Autocomplete */}
          <div className="relative">
            <label className={labelClass}>
              الموديل
              <button type="button" onClick={() => setShowAddModal('model')} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 mr-2 float-left">
                <Plus className="w-4 h-4" />
                اضافة موديل
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className={inputClass}
                placeholder="اختر او اضف موديل جديد..."
                required
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {showModelDropdown && modelSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-yellow-600/30 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {modelSuggestions.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectModelSuggestion(name)}
                    className="w-full px-4 py-3 text-right text-yellow-400 hover:bg-gray-800 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Weight, Purchase and Sale Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>الوزن (غم)</label>
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
              <label className={labelClass}>سعر الشراء (د.ل)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>سعر البيع (د.ل)</label>
              <input
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Base Price (if no sale price) */}
          <div>
            <label className={labelClass}>السعر الأساسي (د.ل)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className={labelClass}>ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="أضف أي ملاحظات هنا..."
              rows={3}
            />
          </div>

          {/* Preview Code */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-600/20">
            <p className="text-gray-400 text-sm mb-2">الكود المتوقع:</p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="bg-yellow-600/20 text-yellow-400 px-4 py-2 rounded-lg font-mono text-lg">
                {generateItemCode()}
              </span>
              <span className="text-gray-400 text-sm">
                {selectedCategory?.name} - {formData.gold_item}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.model_name || !formData.weight || !formData.price || !formData.gold_item}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <span className="animate-spin">...</span>
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
              اخر القطع المضافة
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentItems.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-yellow-600/20">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.model_name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-yellow-600 text-white px-2 py-1 rounded text-sm font-mono">{item.item_code}</span>
                    <span className="text-gray-400 text-sm">{item.stock_qty} قطعة</span>
                  </div>
                  <h4 className="text-white font-semibold">{item.model_name}</h4>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatNumber(item.weight)} غم</span>
                    <span className="text-green-400 font-bold">{formatCurrency(item.price)}</span>
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