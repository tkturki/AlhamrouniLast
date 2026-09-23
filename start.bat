@echo off
echo ============================================
echo   مجوهرات الحمروني - تشغيل النظام
echo ============================================
echo.

echo [1/2] بناء الواجهة...
call npx vite build
if %errorlevel% neq 0 (
    echo خطأ في بناء الواجهة!
    pause
    exit /b 1
)

echo.
echo [2/2] تشغيل السيرفر...
echo.
echo ═══════════════════════════════════════════
echo   افتح المتصفح على: http://localhost:3001
echo   او من جهاز آخر: http://IP-السيرفر:3001
echo ═══════════════════════════════════════════
echo.

cd server
node index.js
