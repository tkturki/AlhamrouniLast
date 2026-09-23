import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Plus, Package, Check, Camera, X, Search, Trash2, Edit2, ChevronDown, ChevronUp, AlertTriangle, Settings, FolderOpen, CheckCircle } from 'lucide-react';
import { modelNamesStorage, formatNumber, formatCurrency, jewelryApi, isSupabaseAvailable } from '../services/supabase';
import { imageStorage } from '../services/imageStorage';
import { getSystemSettings, GoldPricesSettings, loadSettingsFromSupabase } from '../services/settings';
import ImageBrowser from '../components/ImageBrowser';

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

  addItem: (categoryId: string, item: string): GoldCategory[] => {
    const data = localStorage.getItem('goldCategories_v2');
    const categories: GoldCategory[] = data ? JSON.parse(data) : [];
    const updated = categories.map(c => {
      if (c.id === categoryId && !c.items.includes(item)) {
        return { ...c, items: [...c.items, item] };
      }
      return c;
    });
    localStorage.setItem('goldCategories_v2', JSON.stringify(updated));
    return updated;
  },

  removeItem: (categoryId: string, item: string): GoldCategory[] => {
    const data = localStorage.getItem('goldCategories_v2');
    const categories: GoldCategory[] = data ? JSON.parse(data) : [];
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, items: c.items.filter(i => i !== item) };
      }
      return c;
    });
    localStorage.setItem('goldCategories_v2', JSON.stringify(updated));
    return updated;
  },

  updateItem: (categoryId: string, oldItem: string, newItem: string): GoldCategory[] => {
    const data = localStorage.getItem('goldCategories_v2');
    const categories: GoldCategory[] = data ? JSON.parse(data) : [];
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, items: c.items.map(i => i === oldItem ? newItem : i) };
      }
      return c;
    });
    localStorage.setItem('goldCategories_v2', JSON.stringify(updated));
    return updated;
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

// Get price per gram based on karat and metal type
const getPricePerGram = (karat: string, metalType: string, goldPrices: GoldPricesSettings): number => {
  const isSilver = metalType === 'فضة' || metalType === 'فضة مطلي' || metalType === 'فضة عادي';
  if (isSilver) return goldPrices.silver;
  switch (karat) {
    case '24': return goldPrices.gold24k;
    case '21': return goldPrices.gold21k;
    case '18': return goldPrices.gold18k;
    default: return goldPrices.gold21k;
  }
};

// Check if gold prices were updated today
const isGoldPriceUpdatedToday = (lastUpdated: string): boolean => {
  const today = new Date().toDateString();
  const updated = new Date(lastUpdated).toDateString();
  return today === updated;
};

// Gold price warning modal component
const GoldPriceWarningModal: React.FC<{
  lastUpdated: string;
  pricePerGram: number;
  onUpdatePrice: () => void;
  onSkip: () => void;
}> = ({ lastUpdated, pricePerGram, onUpdatePrice, onSkip }) => {
  const date = new Date(lastUpdated).toLocaleDateString('en-CA');
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-400">تحديث أسعار الذهب</h3>
            <p className="text-gray-400 text-sm">الأسعار لم يتم تحديثها اليوم</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm">آخر تحديث: <span className="text-yellow-400 font-bold" dir="ltr">{date}</span></p>
          <p className="text-gray-300 text-sm mt-1">سعر الجرام الحالي: <span className="text-green-400 font-bold" dir="ltr" lang="en">{formatCurrency(pricePerGram)}</span></p>
        </div>
        <p className="text-gray-400 text-sm mb-4">هل تريد تحديث أسعار الذهب الآن؟</p>
        <div className="flex gap-3">
          <button onClick={onUpdatePrice} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            نعم، تحديث الأسعار
          </button>
          <button onClick={onSkip} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">
            تخطي
          </button>
        </div>
      </div>
    </div>
  );
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
    item_code: '',
    weight: '',
    purchase_price: '1',
    sale_price: '',
    price: '',
    notes: '',
    stock_qty: '1',
    barcode: '',
  });

  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

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

  // Gold price state
  const [goldPrices, setGoldPrices] = useState<GoldPricesSettings>(getSystemSettings().goldPrices);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [pricePerGram, setPricePerGram] = useState(0);
  const [showSettingsRedirect, setShowSettingsRedirect] = useState(false);
  const [tempGold21k, setTempGold21k] = useState('');
  const [tempGold18k, setTempGold18k] = useState('');
  const [tempGold24k, setTempGold24k] = useState('');
  const [tempSilver, setTempSilver] = useState('');

  // Load gold prices and check freshness
  useEffect(() => {
    const loadPrices = async () => {
      await loadSettingsFromSupabase();
      const settings = getSystemSettings();
      setGoldPrices(settings.goldPrices);
      const ppg = getPricePerGram(formData.karat, formData.metal_type, settings.goldPrices);
      setPricePerGram(ppg);

      // Check if price was updated today
      if (settings.goldPrices.isCustom && !isGoldPriceUpdatedToday(settings.goldPrices.lastUpdated)) {
        setShowPriceWarning(true);
      }
    };
    loadPrices();
  }, [formData.karat, formData.metal_type]);

  // Auto-calculate price when weight, pricePerGram or count changes
  useEffect(() => {
    const weight = parseFloat(formData.weight) || 0;
    const count = parseInt(formData.stock_qty) || 1;
    if (weight > 0 && pricePerGram > 0) {
      const totalPrice = (weight * count) * pricePerGram;
      setFormData(prev => ({
        ...prev,
        price: (weight * pricePerGram).toFixed(2),
        sale_price: totalPrice.toFixed(2),
      }));
    }
  }, [formData.weight, formData.stock_qty, pricePerGram]);

  // Set model_name default to gold_item
  useEffect(() => {
    if (formData.gold_item && !formData.model_name) {
      setFormData(prev => ({ ...prev, model_name: formData.gold_item }));
    }
  }, [formData.gold_item]);

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

  // Barcode Reader Support - USB scanners act like keyboards
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          setFormData(prev => ({ ...prev, barcode: barcodeBuffer }));
          setScanMessage(`تم قراءة الكود: ${barcodeBuffer}`);
          setTimeout(() => setScanMessage(''), 3000);
        }
        barcodeBuffer = '';
        return;
      }

      const char = getCodeChar(e.code, e.shiftKey);
      if (char !== null) {
        barcodeBuffer += char;
        if (barcodeTimeout) clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => {
          if (barcodeBuffer.length >= 3) {
            setFormData(prev => ({ ...prev, barcode: barcodeBuffer }));
            setScanMessage(`تم قراءة الكود: ${barcodeBuffer}`);
            setTimeout(() => setScanMessage(''), 3000);
          }
          barcodeBuffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeout) clearTimeout(barcodeTimeout);
    };
  }, []);

  // Update gold_item when gold_category changes and auto-set model_name
  useEffect(() => {
    const category = goldCategories.find(c => c.id === formData.gold_category);
    if (category && category.items.length > 0 && !category.items.includes(formData.gold_item)) {
      const newGoldItem = category.items[0];
      setFormData(prev => ({
        ...prev,
        gold_item: newGoldItem,
        model_name: prev.model_name === prev.gold_item || !prev.model_name ? newGoldItem : prev.model_name
      }));
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
    } else {
      const updated = goldCategoriesStorage.addItem(type, newOptionValue.trim());
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

      const weight = parseFloat(formData.weight);
      const pricePerGram = getPricePerGram(formData.karat, formData.metal_type, goldPrices);
      const calculatedPrice = weight * pricePerGram;

      const itemData = {
        item_type: formData.item_type,
        karat: formData.karat,
        gold_category: formData.gold_category,
        gold_item: formData.gold_item,
        metal_type: formData.metal_type,
        status: formData.status,
        model_name: formData.model_name,
        weight: weight,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        price: calculatedPrice,
        price_per_gram: pricePerGram,
        notes: formData.notes,
        stock_qty: parseInt(formData.stock_qty),
        barcode: formData.barcode || '',
        image_url: imagePreview || null,
        created_at: new Date().toISOString(),
      };

      // Save to Supabase first, then fallback to localStorage
      let savedItem: any = null;
      if (isSupabaseAvailable()) {
        try {
          savedItem = await jewelryApi.addItem(itemData);
          console.log('Saved to Supabase:', savedItem.item_code);
        } catch (err) {
          console.log('Supabase error, saving to localStorage:', err);
        }
      }

      // Also save to localStorage as backup
      if (!savedItem) {
        const existingItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
        savedItem = {
          ...itemData,
          id: Date.now(),
          item_code: generateItemCode(),
        };
        existingItems.push(savedItem);
        localStorage.setItem('jewelry_items', JSON.stringify(existingItems));
      }

      if (imagePreview && imagePreview.startsWith('data:image')) {
        await imageStorage.save(savedItem.item_code, imagePreview);
      }

      const recent = [savedItem, ...recentItems.slice(0, 4)];
      setRecentItems(recent);
      localStorage.setItem('recent_items', JSON.stringify(recent));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setFormData({
        ...formData,
        model_name: '',
        weight: '',
    purchase_price: '1',
        sale_price: '',
        price: '',
        notes: '',
        barcode: '',
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
      {/* Gold Price Warning Modal */}
      {showPriceWarning && (
        <GoldPriceWarningModal
          lastUpdated={goldPrices.lastUpdated}
          pricePerGram={pricePerGram}
          onUpdatePrice={() => {
            setShowPriceWarning(false);
            setShowPriceUpdate(true);
          }}
          onSkip={() => setShowPriceWarning(false)}
        />
      )}

      {/* Inline Gold Price Update Modal */}
      {showPriceUpdate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">تحديث أسعار الذهب اليدوي</h3>
            <p className="text-gray-400 text-sm mb-4">أدخل أسعار الذهب اليومية (د.ل/جرام)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ذهب 24 قيراط</label>
                <input type="text" inputMode="decimal" step="0.01" value={tempGold24k} onChange={(e) => setTempGold24k(e.target.value)} placeholder={goldPrices.gold24k.toString()} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ذهب 21 قيراط</label>
                <input type="text" inputMode="decimal" step="0.01" value={tempGold21k} onChange={(e) => setTempGold21k(e.target.value)} placeholder={goldPrices.gold21k.toString()} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ذهب 18 قيراط</label>
                <input type="text" inputMode="decimal" step="0.01" value={tempGold18k} onChange={(e) => setTempGold18k(e.target.value)} placeholder={goldPrices.gold18k.toString()} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">فضة</label>
                <input type="text" inputMode="decimal" step="0.01" value={tempSilver} onChange={(e) => setTempSilver(e.target.value)} placeholder={goldPrices.silver.toString()} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" dir="ltr" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => {
                const newPrices: GoldPricesSettings = {
                  ...goldPrices,
                  gold24k: parseFloat(tempGold24k) || goldPrices.gold24k,
                  gold21k: parseFloat(tempGold21k) || goldPrices.gold21k,
                  gold18k: parseFloat(tempGold18k) || goldPrices.gold18k,
                  silver: parseFloat(tempSilver) || goldPrices.silver,
                  isCustom: true,
                  lastUpdated: new Date().toISOString(),
                };
                const { saveSystemSettings } = require('../services/settings');
                saveSystemSettings({ goldPrices: newPrices });
                setGoldPrices(newPrices);
                const ppg = getPricePerGram(formData.karat, formData.metal_type, newPrices);
                setPricePerGram(ppg);
                setShowPriceUpdate(false);
                setTempGold24k('');
                setTempGold21k('');
                setTempGold18k('');
                setTempSilver('');
              }} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg">
                حفظ الأسعار
              </button>
              <button onClick={() => {
                setShowPriceUpdate(false);
                setTempGold24k('');
                setTempGold21k('');
                setTempGold18k('');
                setTempSilver('');
              }} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Redirect Modal */}
      {showSettingsRedirect && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30 text-center">
            <Settings className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-yellow-400 mb-2">تحديث أسعار الذهب</h3>
            <p className="text-gray-400 text-sm mb-4">سيتم فتح صفحة الإعدادات لتحديث الأسعار</p>
            <button onClick={() => { window.location.href = '/settings'; }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg">
              فتح الإعدادات
            </button>
          </div>
        </div>
      )}

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
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewOption(showAddModal); }}}
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

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-400">
                تعديل عنصر - {goldCategories.find(c => c.id === editingItem.categoryId)?.name}
              </h3>
              <button onClick={() => { setEditingItem(null); setEditingItemName(''); }} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-gray-400 text-sm">الاسم الحالي: <span className="text-white font-bold">{editingItem.oldName}</span></div>
              <input
                type="text"
                value={editingItemName}
                onChange={(e) => setEditingItemName(e.target.value)}
                placeholder="ادخل الاسم الجديد..."
                className="w-full bg-gray-800 border border-yellow-600/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditItem(editingItem.categoryId, editingItem.oldName); }}}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleEditItem(editingItem.categoryId, editingItem.oldName)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg"
                >
                  حفظ التعديل
                </button>
                <button
                  onClick={() => { setEditingItem(null); setEditingItemName(''); }}
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
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-gray-300 text-center mb-4">اختر طريقة إضافة الصورة</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    رفع صورة
                  </button>
                  <button type="button" onClick={() => setShowImageBrowser(true)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    متصفح الصور
                  </button>
                </div>
                <p className="text-gray-500 text-sm text-center mt-2">PNG, JPG حتى 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          {/* Image Browser Modal */}
          {showImageBrowser && (
            <ImageBrowser
              onSelect={(url) => {
                setImagePreview(url);
                // Auto-generate code from image filename
                try {
                  const filename = url.split('/').pop()?.split('?')[0] || '';
                  const nameWithoutExt = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
                  if (nameWithoutExt && !formData.item_code) {
                    setFormData(prev => ({ ...prev, item_code: nameWithoutExt }));
                  }
                } catch {}
              }}
              onClose={() => setShowImageBrowser(false)}
            />
          )}

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
                {(formData.metal_type === 'فضة' || formData.metal_type === 'فضة مطلي' || formData.metal_type === 'فضة عادي') ? 'عيار الفضة' : 'العييار'}
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
                type="text" inputMode="decimal"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                className={inputClass}
                min="1"
                required
                lang="en"
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
                type="text" inputMode="decimal"
                step="0.001"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className={inputClass}
                placeholder="0.000"
                required
                lang="en"
              />
            </div>
            <div>
              <label className={labelClass}>سعر الشراء (د.ل)</label>
              <input
                type="text" inputMode="decimal"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className={inputClass}
                placeholder="1"
                lang="en"
              />
            </div>
            <div>
              <label className={labelClass}>سعر البيع (د.ل)</label>
              <input
                type="text" inputMode="decimal"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className={inputClass}
                placeholder="0.00"
                lang="en"
              />
            </div>
          </div>

          {/* Price Per Gram Info */}
          <div className="bg-gray-700/30 rounded-xl p-3 border border-yellow-600/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">سعر الجرام ({formData.karat} قيراط):</span>
              <span className="text-yellow-400 font-bold" dir="ltr" lang="en">{formatCurrency(pricePerGram)}</span>
            </div>
            {pricePerGram === 0 && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                لم يتم إدخال سعر الذهب بعد. يجب تحديث سعر الذهب يدوياً من إعدادات النظام.
              </p>
            )}
          </div>

          {/* Base Price (auto-calculated) */}
          <div>
            <label className={labelClass}>السعر الأساسي (د.ل) - يُحسب تلقائياً</label>
            <input
              type="text" inputMode="decimal"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={inputClass}
              placeholder="0.00"
              lang="en"
            />
          </div>

          {/* Total Price Display */}
          <div className="bg-green-600/20 rounded-xl p-4 border border-green-600/30">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">إجمالي سعر القطعة (الوزن × العدد × سعر الغرام):</span>
              <span className="text-2xl font-bold text-green-400" dir="ltr" lang="en">
                {formatCurrency(((parseFloat(formData.weight) || 0) * (parseInt(formData.stock_qty) || 1)) * pricePerGram)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 text-gray-400" dir="ltr" lang="en">
              <span>{formatNumber(parseFloat(formData.weight) || 0)}غم × {parseInt(formData.stock_qty) || 1} قطعة × {formatCurrency(pricePerGram)}/غم</span>
              <span>= {formatCurrency(((parseFloat(formData.weight) || 0) * (parseInt(formData.stock_qty) || 1)) * pricePerGram)}</span>
            </div>
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

          {/* Barcode / QR Code */}
          <div>
            <label className={labelClass}>باركود / كود QR</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => {
                let val = e.target.value;
                // Convert Arabic chars to English (barcode reader with Arabic keyboard)
                const arabicMap: Record<string, string> = {
                  '١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','٠':'0',
                  'ض':'Q','ص':'W','ث':'E','ق':'R','ف':'T','غ':'Y','ع':'U','ه':'I','خ':'O','ح':'P',
                  'ج':'A','ش':'S','ي':'D','ب':'F','ل':'G','ن':'H','م':'J','ك':'L','ت':'Z','ئ':'X',
                  'ا':'A','ى':'A','ء':'Q','ؤ':'Q','لا':'L',
                };
                val = val.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48));
                val = val.replace(/[\u0621-\u064A]/g, (ch) => arabicMap[ch] || ch);
                setFormData(prev => ({ ...prev, barcode: val }));
              }}
              className={inputClass}
              placeholder="امسح الباركود بالقارئ أو اكتب الكود يدوياً"
              dir="ltr"
              lang="en"
            />
            {scanMessage && (
              <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {scanMessage}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">يمكنك استخدام قارئ الباركود USB لملء هذا الحقل تلقائياً</p>
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
            disabled={loading || !formData.model_name || !formData.weight || !formData.gold_item}
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