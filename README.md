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
- ☁️ **مزامنة سحابية اختيارية**: زامِن مكتبتك بين جميع أجهزتك عبر نسخة خاصة في حسابك على GitHub (Gist خاص). من **حسابي ← الإعدادات ← المزامنة السحابية**: أنشئ مفتاح مزامنة بصلاحية `gist` فقط من الرابط داخل التطبيق، والصق نفس المفتاح في كل جهاز. الدمج ذكي: الحلقات المُشاهدة تُجمع من كل الأجهزة، والأحدث يفوز عند التعارض، والحذف ينتقل بين الأجهزة.
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

## 🔑 الكتالوج الحقيقي (TMDB)

التطبيق **مضبوط مسبقاً بمفتاح TMDB** فيعمل البحث في ملايين المسلسلات والأفلام الحقيقية مباشرة (بالعربية أيضاً) — تُجلب المواسم والحلقات ومواعيد العرض تلقائياً.

لاستبدال المفتاح بمفتاحك الخاص: أنشئ حساباً مجانياً في [themoviedb.org](https://www.themoviedb.org/) واطلب مفتاح API، ثم الصقه في **حسابي ← الإعدادات ← مفتاح TMDB API** (يقبل مفتاح v3 أو توكن القراءة v4). ولو حُذف المفتاح يعود التطبيق للكتالوج التجريبي المدمج.

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

**Plus what it never gave you**: full privacy (all data in localStorage), optional **cloud sync across devices** via a private GitHub Gist (create a gist-scoped token from the in-app link, paste the same key on every device — watched episodes union, newest-wins conflicts, deletions propagate), one-tap **JSON backup export/import**, Arabic + English with full RTL, and an installable offline-capable **PWA** with self-hosted fonts & icons.

**Real data**: the app ships preconfigured with a TMDB API key, so searching the real catalog works out of the box — seasons, episodes and air dates are fetched automatically, localized to Arabic when the UI language is Arabic. You can swap in your own free key from [themoviedb.org](https://www.themoviedb.org/) in **Profile → Settings → TMDB API Key** (v3 key or v4 read token); with no key at all the app falls back to its built-in demo catalog.

**Deploying**: `npm run build` produces a relocatable static `dist/`; a GitHub Pages workflow is included (enable Pages → Source: GitHub Actions).

This product uses the TMDB API but is not endorsed or certified by TMDB.
