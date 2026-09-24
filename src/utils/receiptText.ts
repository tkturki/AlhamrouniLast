// عنوان الوصل والختم الأحمر - يُبنيان ديناميكياً من نوع المعدن والبيان
export interface ReceiptTextItem {
  item_type?: string;
  metal_type?: string;
  description?: string;
  item_name?: string;
  notes?: string;
}

export type ReceiptAction = 'استلام' | 'تسليم' | 'تصنيع' | 'شراء' | '';

const collectText = (items: ReceiptTextItem[], extraText = ''): string =>
  [
    ...(items || []).map(it => `${it.description || ''} ${it.item_name || ''} ${it.metal_type || ''} ${it.notes || ''}`),
    extraText,
  ].join(' ');

// استخراج نوع المعدن من البنود: ذهب / فضة
export const detectMetalName = (items: ReceiptTextItem[], extraText = ''): string => {
  const text = collectText(items, extraText);
  if (/فضة/.test(text)) return 'فضة';
  if (/(ذهب|سبيكة)/.test(text)) return 'ذهب';
  return '';
};

// استخراج نوع العملية من البيان/الملاحظات
export const detectReceiptAction = (items: ReceiptTextItem[], extraText = ''): ReceiptAction => {
  const text = collectText(items, extraText);
  if (/تسليم/.test(text)) return 'تسليم';
  if (/تصنيع/.test(text)) return 'تصنيع';
  if (/شراء/.test(text)) return 'شراء';
  if (/استلام/.test(text)) return 'استلام';
  return '';
};

// عنوان الوصل: وصل + العملية + نوع المعدن (مثال: وصل شراء ذهب / وصل استلام ذهب / وصل تصنيع ذهب)
export const buildReceiptTitle = (items: ReceiptTextItem[], fallbackStatement = '', extraText = ''): string => {
  const metal = detectMetalName(items, extraText);
  const action = detectReceiptAction(items, extraText);
  const statement = (fallbackStatement || '').replace(/^(تم\s+)?(استلام|تسليم)\s*/, '').trim();
  const label = `وصل ${action || 'استلام'}`;
  if (metal) return `${label} ${metal}`;
  if (statement) return `${label} ${statement}`;
  return label;
};

// الختم الأحمر: الاستلام فقط => تم الاستلام، التسليم => تم التسليم، والشراء والتصنيع => بدون ختم
export const getReceiptStampText = (items: ReceiptTextItem[], extraText = ''): string => {
  const action = detectReceiptAction(items, extraText);
  if (action === 'تسليم') return 'تم التسليم';
  if (action === 'استلام') return 'تم الاستلام';
  return '';
};
