<div dir="rtl">

# 🎬 CineTrack — سيني‌تراك

**بديل كامل لتطبيق TV Time** لمتابعة المسلسلات والأفلام — بياناتك ملكك، بلا حساب، بلا إعلانات، ويعمل بدون إنترنت.

بُني التطبيق بالكامل على نظام تصميم «Cinematic Core» المرفق (طابع سينمائي داكن مع لون ذهبي، زجاجية Glassmorphism، خط Inter).

## ✨ المزايا

نفس مزايا TV Time:

- 📺 **متابعة المسلسلات**: أضف أي مسلسل، وعلّم الحلقات المُشاهدة حلقةً حلقة أو موسماً كاملاً، مع شريط تقدم لكل عمل.
- 🎞️ **متابعة الأفلام**: قائمة مشاهدة (Watchlist) وأفلام مُشاهدة مع تقييم بالنجوم.
- 📅 **الحلقات القادمة**: تقويم يجمع الحلقات القادمة من مسلسلاتك (اليوم / غداً / هذا الأسبوع / لاحقاً).
- 🔥 **الرائج الآن** واستكشاف حسب التصنيف.
- 📊 **إحصائيات**: عدد الأفلام والمسلسلات والحلقات وإجمالي وقت المشاهدة.
- 🏆 **إنجازات** تُفتح تلقائياً مع تقدمك.

ومزايا **إضافية** ليست في TV Time:

- 🔒 **خصوصية كاملة**: كل بياناتك على جهازك فقط (localStorage) — لا حساب ولا خوادم.
- 💾 **تصدير واستيراد نسخة احتياطية** بصيغة JSON (الشيء الذي حُرم منه مستخدمو TV Time عند إغلاقه!).
- 🌐 **عربي + إنجليزي** مع دعم كامل للاتجاه RTL.
- 📱 **PWA**: ثبّته على هاتفك كتطبيق حقيقي ويعمل دون اتصال (الخطوط والأيقونات مضمّنة محلياً).
- 🎭 **وضع تجريبي مدمج**: يعمل فوراً بكتالوج تجريبي حتى بدون مفتاح API.

## 🚀 التشغيل

</div>

```bash
npm install
npm run dev      # التطوير — development
npm run build    # الإنتاج — production (dist/)
npm run preview  # معاينة البناء
```

<div dir="rtl">

## 🔑 ربط كتالوج حقيقي (TMDB)

بدون أي إعداد يعمل التطبيق على كتالوج تجريبي. للبحث في ملايين المسلسلات والأفلام الحقيقية (بالعربية أيضاً):

1. أنشئ حساباً مجانياً في [themoviedb.org](https://www.themoviedb.org/) واطلب مفتاح API من الإعدادات.
2. في التطبيق: **حسابي ← الإعدادات ← مفتاح TMDB API** والصق المفتاح (يقبل مفتاح v3 أو توكن القراءة v4).
3. ابحث وأضف — تُجلب المواسم والحلقات ومواعيد العرض تلقائياً، وتُعرض البيانات بالعربية عند اختيار اللغة العربية.

## 🌍 النشر على GitHub Pages

المستودع يتضمن Workflow جاهزاً (`.github/workflows/deploy.yml`): فعّل Pages من إعدادات المستودع (Source: GitHub Actions) وسيُنشر تلقائياً عند الدفع إلى `main`. البناء نسبي المسارات فيعمل على أي استضافة ثابتة.

## 🗂️ البنية

</div>

```
├── design/               # ملفات التصميم المرجعية (Stitch mockups + DESIGN.md)
├── public/               # PWA: manifest, service worker, icons
└── src/
    ├── i18n.js           # الترجمة عربي/إنجليزي
    ├── store.jsx         # الحالة + الحفظ + الإحصائيات والإنجازات
    ├── lib/
    │   ├── tmdb.js       # عميل TMDB API
    │   ├── demo.js       # الكتالوج التجريبي المدمج
    │   └── format.js     # تنسيق التواريخ والأوقات
    ├── components/       # Nav, Poster, Search, ShowDetail, MovieDetail…
    └── screens/          # Shows / Movies / Upcoming / Profile
```

<div dir="rtl">

**التقنيات**: React 18 + Vite 6 + Tailwind CSS 4 — بدون أي مكتبات أخرى.

</div>

---

# 🎬 CineTrack (English)

A full **TV Time replacement** for tracking shows & movies — your data stays yours: no account, no ads, works offline.

Built to the bundled "Cinematic Core" design system (dark cinema theme, golden accent, glassmorphism, Inter).

**Everything TV Time had**: episode-by-episode tracking with progress bars, movie watchlist & ratings, an upcoming-episodes calendar (Today / Tomorrow / This Week / Later), trending & genre discovery, watch stats and unlockable achievements.

**Plus what it never gave you**: full privacy (all data in localStorage), one-tap **JSON backup export/import**, Arabic + English with full RTL, and an installable offline-capable **PWA** with self-hosted fonts & icons.

**Getting real data**: the app ships with a built-in demo catalog and works with zero setup. To search the real catalog, get a free API key at [themoviedb.org](https://www.themoviedb.org/) and paste it in **Profile → Settings → TMDB API Key** (v3 key or v4 read token). Seasons, episodes and air dates are then fetched automatically — localized to Arabic when the UI language is Arabic.

**Deploying**: `npm run build` produces a relocatable static `dist/`; a GitHub Pages workflow is included (enable Pages → Source: GitHub Actions).

This product uses the TMDB API but is not endorsed or certified by TMDB.
