// Demo Data Service - Provides sample/test data for the system
import { notificationSystem } from './supabase';

export interface DemoDataConfig {
  items: number;
  invoices: number;
  users: number;
}

// Demo data stats
export interface DemoDataStats {
  itemsCount: number;
  invoicesCount: number;
  lastGenerated: string | null;
}

// Get demo data stats
export const getDemoDataStats = (): DemoDataStats => {
  const data = localStorage.getItem('demo_data_stats');
  if (data) {
    return JSON.parse(data);
  }
  return {
    itemsCount: 0,
    invoicesCount: 0,
    lastGenerated: null,
  };
};

// English codes mapping for Arabic gold items
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

// Generate item code (English only)
const generateDemoItemCode = (karat: string, type: string, category: string, goldItem: string): string => {
  const karatCode = karat;
  const typeCode = type === 'G' ? 'G' : 'S';
  const categoryCode = category === 'arabic' ? 'A' : category === 'foreign' ? 'F' : 'SL';
  const itemCode = goldItemCodes[goldItem] || goldItem.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${karatCode}${typeCode}${categoryCode}${itemCode}-${randomNum}`;
};

// Generate actual demo items
const generateDemoItems = (count: number) => {
  const items = [];
  const goldCategories = [
    { id: 'arabic', name: 'arabic', items: ['قلادة', 'سوارات', 'خاتم', 'صدر', 'طقم'] },
    { id: 'foreign', name: 'foreign', items: ['خاتم', 'طقم', 'حديد مضفورة', 'سلسلة مع تعليقة'] },
    { id: 'silver', name: 'silver', items: ['فضة خام', 'فضة مصنعة'] }
  ];
  const karats = ['21', '18', '24'];
  const metalTypes = ['اصفر', 'ذهب ابيض', 'فضة', 'فضة مطلي'];
  const statuses = ['جديد', 'تكسير', 'مستعمل'];
  const modelNames = [
    'خاتم سادة', 'خاتم مفرغ', 'سوار اسواري', 'سوار فا', 'قلادة طقم',
    'حلق ازواج', 'غريل حبل', 'طقم كامل', 'دبلة ذهبية', 'سلسلة مع تعليقة',
    'سلسلة بروش', 'ميدالية', 'غويشة', 'عثرة', 'ساعة يد'
  ];

  for (let i = 0; i < count; i++) {
    const cat = goldCategories[Math.floor(Math.random() * goldCategories.length)];
    const goldItem = cat.items[Math.floor(Math.random() * cat.items.length)];
    const karat = karats[Math.floor(Math.random() * karats.length)];
    const metalType = metalTypes[Math.floor(Math.random() * metalTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const modelName = modelNames[Math.floor(Math.random() * modelNames.length)];
    const weight = Math.round((Math.random() * 50 + 5) * 1000) / 1000;
    const price = Math.round(weight * (karat === '24' ? 1300 : karat === '21' ? 1100 : 900) * 100) / 100;
    const purchasePrice = Math.round(price * 0.85 * 100) / 100;
    const salePrice = Math.round(price * 1.15 * 100) / 100;

    items.push({
      id: Date.now() + i,
      item_code: generateDemoItemCode(karat, cat.id === 'silver' ? 'S' : 'G', cat.id, goldItem),
      item_type: cat.id === 'silver' ? 'S' : 'G',
      karat: karat,
      origin: 'L',
      gold_category: cat.id,
      gold_item: goldItem,
      metal_type: metalType,
      category: goldItem,
      status: status,
      model_name: modelName,
      weight: weight,
      price: price,
      purchase_price: purchasePrice,
      sale_price: salePrice,
      price_per_gram: karat === '24' ? 1300 : karat === '21' ? 1100 : 900,
      stock_qty: Math.floor(Math.random() * 5) + 1,
      image_url: null,
      created_at: new Date().toISOString(),
    });
  }

  return items;
};

// Generate demo invoices
const generateDemoInvoices = (count: number, items: any[]) => {
  const invoices = [];
  const sellers = ['أحمد محمد', 'خالد علي', 'سارة أحمد'];
  const customers = ['عميل 1', 'عميل 2', 'عميل 3', 'عميل 4'];

  for (let i = 0; i < count; i++) {
    const invoiceItems = [];
    const itemCount = Math.min(Math.floor(Math.random() * 3) + 1, items.length);
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const qty = 1;
      invoiceItems.push({
        ...item,
        quantity: qty,
        total: item.price * qty,
      });
      total += item.price * qty;
    }

    const now = new Date();
    now.setDate(now.getDate() - Math.floor(Math.random() * 30));

    invoices.push({
      id: Date.now() + i,
      invoice_number: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}`,
      customer_name: customers[Math.floor(Math.random() * customers.length)],
      items: invoiceItems,
      total_amount: total,
      seller_name: sellers[Math.floor(Math.random() * sellers.length)],
      seller_code: 'DEMO',
      created_at: now.toISOString(),
    });
  }

  return invoices;
};

// Initialize and ADD actual demo data to storage
export const initializeDemoData = (config: DemoDataConfig): boolean => {
  try {
    // Remove any existing demo data first
    removeDemoDataSimulation();

    // Generate and add actual items
    const demoItems = generateDemoItems(config.items);
    localStorage.setItem('jewelry_items', JSON.stringify(demoItems));

    // Generate and add demo invoices
    const demoInvoices = generateDemoInvoices(config.invoices, demoItems);
    localStorage.setItem('saved_invoices', JSON.stringify(demoInvoices));

    // Save stats
    const stats: DemoDataStats = {
      itemsCount: config.items,
      invoicesCount: config.invoices,
      lastGenerated: new Date().toISOString(),
    };
    localStorage.setItem('demo_data_stats', JSON.stringify(stats));

    notificationSystem.success('تم بنجاح', `تم إضافة ${config.items} قطعة و ${config.invoices} فاتورة للمخزن والمعرض`);
    return true;
  } catch (error) {
    console.error('Error initializing demo data:', error);
    notificationSystem.error('خطأ', 'فشل في إنشاء البيانات التجريبية');
    return false;
  }
};

// Remove demo data from storage
export const removeDemoDataSimulation = (): boolean => {
  try {
    // Remove actual demo items
    const currentItems = JSON.parse(localStorage.getItem('jewelry_items') || '[]');
    const realItems = currentItems.filter((item: any) => !item.item_code?.includes('-'));
    if (realItems.length > 0) {
      localStorage.setItem('jewelry_items', JSON.stringify(realItems));
    } else {
      localStorage.removeItem('jewelry_items');
    }

    // Remove demo invoices
    localStorage.removeItem('saved_invoices');

    // Remove stats
    localStorage.removeItem('demo_data_stats');

    notificationSystem.success('تم بنجاح', 'تمت إزالة البيانات التجريبية');
    return true;
  } catch (error) {
    console.error('Error removing demo data:', error);
    notificationSystem.error('خطأ', 'فشل في إزالة البيانات التجريبية');
    return false;
  }
};

// Check if demo data exists
export const hasDemoDataSimulation = (): boolean => {
  const stats = getDemoDataStats();
  return stats.itemsCount > 0;
};

// Get simulated inventory value
export const getDemoInventoryValue = (): { totalValue: number; totalWeight: number } => {
  const stats = getDemoDataStats();
  if (stats.itemsCount === 0) {
    return { totalValue: 0, totalWeight: 0 };
  }

  const avgWeight = 15;
  const avgPrice = 1500;

  return {
    totalValue: stats.itemsCount * avgWeight * avgPrice,
    totalWeight: stats.itemsCount * avgWeight,
  };
};

// Legacy function - adds actual demo data
export const addDemoData = (config: DemoDataConfig): boolean => {
  return initializeDemoData(config);
};

// Legacy function - removes demo data
export const removeDemoData = (): boolean => {
  return removeDemoDataSimulation();
};

// Generate demo invoice preview
export const generateDemoInvoicePreview = (itemCount: number = 3) => {
  const categories = ['سوار', 'خاتم', 'سلسلة', 'حلق', 'دبلة', 'غويشة'];
  const karats = ['24', '21', '18'];
  const sellers = ['أحمد محمد', 'خالد علي', 'سارة أحمد'];

  const items = [];
  let total = 0;

  for (let i = 0; i < itemCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const karat = karats[Math.floor(Math.random() * karats.length)];
    const weight = Math.floor(Math.random() * 20) + 5;
    const price = weight * (karat === '24' ? 1300 : karat === '21' ? 1100 : 900);

    items.push({
      name: `${category} ذهبي`,
      karat,
      weight,
      quantity: 1,
      price,
    });
    total += price;
  }

  return {
    invoiceNumber: `DEMO-${Date.now()}`,
    date: new Date().toISOString(),
    customerName: `عميل تجريبي ${Math.floor(Math.random() * 50) + 1}`,
    items,
    totalAmount: total,
    seller: sellers[Math.floor(Math.random() * sellers.length)],
    isDemo: true,
  };
};