// التفقيط - تحويل الأرقام إلى كلمات بالعربي
export const numberToArabicWords = (num: number): string => {
  if (num === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثتمائة', 'تسعمائة'];

  const getArabicWord = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      if (one === 0) return tens[ten];
      return ones[one] + ' و ' + tens[ten];
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      if (remainder === 0) return hundreds[hundred];
      return hundreds[hundred] + ' و ' + getArabicWord(remainder);
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      if (remainder === 0) return getArabicWord(thousands) + ' ألف';
      return getArabicWord(thousands) + ' ألف و ' + getArabicWord(remainder);
    }
    if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const remainder = n % 1000000;
      if (remainder === 0) return getArabicWord(millions) + ' مليون';
      return getArabicWord(millions) + ' مليون و ' + getArabicWord(remainder);
    }
    return n.toString();
  };

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100) / 100;

  const intWords = getArabicWord(intPart);

  // Handle decimals
  if (decPart === 0) {
    return intWords + ' دينار و ' + 'صفر فلس';
  }

  const dec = Math.round(decPart * 100);
  const decWords = getArabicWord(dec);

  return intWords + ' دينار و ' + decWords + ' فلس';
};

// تنسيق السعر
export const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// تنسيق التاريخ بالعربي
export const formatDateArabic = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Intl.DateTimeFormat('ar-LY', options).format(date);
};

// جلب سعر الذهب (استخدام API مجاني)
export const fetchGoldPrice = async (): Promise<{ price24k: number; price21k: number; price18k: number; updated: string }> => {
  try {
    // استخدام API مجاني لأسعار الذهب (مثال)
    // في الإنتاج يمكنك استخدام API حقيقي مثل Gold-API أو similar
    const mockPrice = 85.50; // سعر الذهب عيار 24 بالدينار الليبي (تحديث يدوي في الإنتاج)

    return {
      price24k: mockPrice,
      price21k: mockPrice * 0.875,
      price18k: mockPrice * 0.75,
      updated: new Date().toISOString()
    };
  } catch (error) {
    return {
      price24k: 85.50,
      price21k: 74.81,
      price18k: 64.13,
      updated: new Date().toISOString()
    };
  }
};

// جلب سعر الدولار مقابل الدينار الليبي
export const fetchExchangeRate = async (): Promise<{ usdToLyd: number; updated: string }> => {
  try {
    // في الإنتاج، استخدم API حقيقي لسعر الصرف
    // مثال: Open Exchange Rates API أو similar
    return {
      usdToLyd: 4.85, // سعر الدولار مقابل الدينار الليبي
      updated: new Date().toISOString()
    };
  } catch (error) {
    return {
      usdToLyd: 4.85,
      updated: new Date().toISOString()
    };
  }
};

// حساب سعر القطعة بناءً على وزن وسعر الذهب
export const calculateItemPrice = (weight: number, karat: string, goldPrice24k: number): number => {
  const karatFactor: { [key: string]: number } = {
    '24': 1,
    '21': 0.875,
    '18': 0.75,
    '14': 0.583,
    '10': 0.417
  };

  const factor = karatFactor[karat] || 0.875;
  return weight * goldPrice24k * factor;
};