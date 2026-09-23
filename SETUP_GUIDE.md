# ============================================
# إعداد قاعدة البيانات - Supabase
# ============================================

# الخطوة 1: إنشاء حساب مجاني
# اذهب إلى: https://supabase.com
# أنشئ حساباً مجانياً

# الخطوة 2: إنشاء مشروع جديد
# اضغط على "New Project"
# أدخل:
# - Project Name: alhamrouni-jewelry
# - Database Password: (اختر كلمة مرور قوية)
# - Region: East US (أقرب منطقة)

# الخطوة 3: جلب بيانات الاتصال
# اذهب إلى: Settings > API
# انسخ:
# - Project URL
# - anon/public key

# الخطوة 4: تحديث ملف .env
# افتح ملف .env في المشروع
# أضف البيانات:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJxxxxxxx

# الخطوة 5: تشغيل Migration
# افتح Supabase Dashboard
# اذهب إلى: SQL Editor
# افتح ملف: supabase/migration.sql
# اضغط على "Run"

# الخطوة 6: تثبيت المكتبات
# pnpm install @supabase/supabase-js

# الخطوة 7: تشغيل النظام
# pnpm dev

# ============================================
# ملاحظات مهمة
# ============================================

# 1. الخطة المجانية تشمل:
#    - 500 MB قاعدة بيانات
#    - 1 GB تخزين ملفات
#    - 50,000 مستخدم شهرياً
#    - 500,000 استدعاء وظائف

# 2. الخطة المدفوعة ($25/شهر):
#    - 8 GB قاعدة بيانات
#    - 100 GB تخزين ملفات
#    - نسخ احتياطي يومي
#    - دعم فني

# 3. للتخزين:
#    - الصور الصغيرة: Supabase Storage
#    - الصور الكبيرة: External storage (S3, Cloudinary)

# 4. للنشر:
#    - Vercel (مجاني)
#    - Netlify (مجاني)
#    - Firebase Hosting (مجاني)
