# نظام مجوهرات الحمروني

نظام متكامل لإدارة مخزون المجوهرات والبيع باستخدام كاميرا الهاتف لمسح QR Code.

## المميزات

### المميزات الرئيسية
- **مسح QR بكاميرا الهاتف**: يمكنك مسح كود القطعة بكاميرا هاتفك لنقلها تلقائياً للفاتورة
- **تصميم عصري**: واجهة مستخدم احترافية مع ألوان الذهب والأسود
- **إدارة المخزون**: تتبع القطع الذهبية والفضية
- **طباعة الفاتورة**: طباعة فواتير احترافية بعد كل عملية بيع
- **توليد QR Code**: توليد أكواد QR لكل قطعة

## الصفحات

1. **الرئيسية**: لوحة تحكم مع إحصائيات
2. **التكويد**: إضافة قطع جديدة وتوليد QR Code
3. **المبيعات**: شاشة البيع مع كاميرا QR
4. **الفاتورة**: عرض وتعديل وطباعة الفاتورة
5. **البحث**: البحث والاستعلام عن القطع
6. **المخزن**: عرض جميع القطع مع QR Codes

## التشغيل

### 1. تشغيل Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

السيرفر يعمل على: `http://localhost:5000`

### 2. تشغيل Frontend (React)

```bash
cd alhumroni-jewelry
pnpm install
pnpm run dev
```

التطبيق يعمل على: `http://localhost:5173`

## هيكل المشروع

```
alhumroni-jewelry/
├── backend/
│   ├── app.py              # Flask Backend API
│   ├── requirements.txt    # Python dependencies
│   └── alhumroni.db        # SQLite Database
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx    # الصفحة الرئيسية
│   │   ├── AddItemPage.tsx  # صفحة التكويد
│   │   ├── SalesPage.tsx    # صفحة المبيعات
│   │   ├── InvoicePage.tsx  # صفحة الفاتورة
│   │   ├── SearchPage.tsx   # صفحة البحث
│   │   └── ItemsPage.tsx    # صفحة المخزن
│   ├── components/
│   │   └── Layout.tsx       # تصميم Layout
│   ├── services/
│   │   └── api.ts           # API Service
│   └── types/
│       └── index.ts         # TypeScript Types
└── README.md
```

## نظام الكود

الكود يتكون من:
- **العيار**: 18، 21، 24
- **النوع**: G (ذهب)، S (فضة)
- **المنشأ**: L (ليبي)، T (تركي)، I (إيطالي)
- **الصنف**: R (خاتم)، BR (سوار)، NL (قلادة)، ER (حلق)

**مثال**: `21G-L-R-1001` = خاتم ذهب 21 قيراط ليبي

## API Endpoints

### Items
- `GET /api/items` - جلب كل القطع
- `POST /api/items` - إضافة قطعة
- `GET /api/items/:code` - جلب قطعة بالكود
- `POST /api/items/:code/sale` - بيع قطعة
- `GET /api/items/search?q=` - البحث

### Sales
- `GET /api/sales` - جلب الفواتير
- `POST /api/sales` - إنشاء فاتورة

### QR
- `GET /api/qr/:code` - جلب QR Code

## ملاحظات

- المشروع يستخدم SQLite كقاعدة بيانات
- يجب تشغيل Backend قبل Frontend
- الكاميرا تعمل على الهواتف الحديثة
- الطباعة تعمل على أي طابعة