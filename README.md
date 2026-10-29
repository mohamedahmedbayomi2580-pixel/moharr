# My UI Builder

محرر مرئي لتصميم واجهات (HTML/CSS/JS) مع حفظ محلي (IndexedDB) وتصدير ZIP.

## التشغيل
- **في المتصفح:** افتح `www/index.html` (أو `npx serve www`).
- **برنامج ويندوز محليًا:** `npm install` ثم `npm start`، وللبناء `npm run build:win`.
- **اختبار التصدير:** `npm test`.

## البناء عبر GitHub (exe + apk)
1. أنشئ مستودعًا على GitHub وارفع كل محتويات هذا المجلد (فرع `main`).
2. تبويب **Actions** ← Build ← **Run workflow** (أو يعمل تلقائيًا عند كل push).
3. بعد انتهائه نزّل من **Artifacts**: `windows-app` (ملفات exe) و`android-apk` (app-debug.apk).
APK هو نسخة debug للتجربة؛ للنشر في المتجر تحتاج توقيع Release.
