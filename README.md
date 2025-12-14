# دليل المحلات والصيدليات

مشروع شامل يتكون من موقع ويب وتطبيق موبايل لدليل المحلات والصيدليات والأماكن التجارية والخدمات.

## المميزات

### للمستخدمين:
- تصفح الأماكن والخدمات
- البحث في المنتجات والخدمات
- عرض تفاصيل المكان مع الخريطة والفيديو
- إرسال رسائل للأماكن (للمستخدمين المسجلين فقط)
- عرض الأماكن المميزة في شريط تمرير تلقائي

### لأصحاب الأماكن:
- تسجيل الدخول بحساب Google
- الاشتراك في باقات مختلفة
- إضافة أماكن/خدمات حسب الباقة
- إضافة منتجات مع صور وفيديوهات
- إضافة متغيرات للمنتجات (ألوان، أحجام)
- عرض إحصائيات المشاهدات
- استقبال الرسائل من العملاء

### للمسوقين:
- نظام التسويق بالعمولة
- كود خصم مخصص
- لوحة تحكم لعرض الأرباح والمعاملات

### للإدارة:
- إدارة الباقات (عدد الأماكن، الصور، الفيديوهات)
- عرض إحصائيات الموقع

## التقنيات المستخدمة

### الموقع (Web):
- Next.js 16
- TypeScript
- Supabase (قاعدة البيانات والمصادقة)
- Tailwind CSS
- SweetAlert2
- Google Maps API
- YouTube API
- ImgBB API (لرفع الصور مع تحويلها إلى WebP)

### التطبيق (Mobile):
- React Native Expo
- TypeScript
- Supabase
- React Navigation
- React Native Maps
- Expo Image Picker

## الإعداد

### 1. إعداد الموقع (Web)

```bash
cd web
npm install
```

أنشئ ملف `.env.local` في مجلد `web`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
IMGBB_API_1=your_imgbb_api_1
IMGBB_API_2=your_imgbb_api_2
IMGBB_API_3=your_imgbb_api_3
IMGBB_API_4=your_imgbb_api_4
IMGBB_API_5=your_imgbb_api_5
```

قم بتشغيل الموقع:

```bash
npm run dev
```

### 2. إعداد التطبيق (Mobile)

```bash
cd mobile
npm install
```

أنشئ ملف `.env` في مجلد `mobile`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
IMGBB_API_1=your_imgbb_api_1
IMGBB_API_2=your_imgbb_api_2
IMGBB_API_3=your_imgbb_api_3
IMGBB_API_4=your_imgbb_api_4
IMGBB_API_5=your_imgbb_api_5
```

قم بتشغيل التطبيق:

```bash
npm start
```

## قاعدة البيانات

تم إنشاء جميع الجداول المطلوبة في Supabase:

- `packages` - الباقات
- `user_profiles` - ملفات المستخدمين
- `user_subscriptions` - اشتراكات المستخدمين
- `places` - الأماكن والخدمات
- `products` - المنتجات
- `product_images` - صور المنتجات
- `product_videos` - فيديوهات المنتجات
- `product_variants` - متغيرات المنتجات (ألوان، أحجام)
- `messages` - الرسائل
- `site_visits` - زيارات الموقع
- `place_visits` - زيارات الأماكن
- `affiliates` - المسوقين
- `affiliate_transactions` - معاملات المسوقين

## البنية

```
BANV1/
├── web/                 # موقع Next.js
│   ├── app/            # صفحات Next.js
│   ├── components/     # المكونات
│   ├── lib/            # المكتبات والمساعدين
│   └── ...
├── mobile/             # تطبيق React Native Expo
│   ├── src/           # الكود المصدري
│   └── ...
└── banenv             # ملف البيئة
```

## الميزات الرئيسية

### 1. نظام الباقات
- كل باقة تحدد عدد الأماكن المسموحة
- عدد الصور والفيديوهات للمنتجات
- عدد الفيديوهات للمكان
- الأولوية في العرض
- نمط الكارت (افتراضي، فضي، ذهبي، مميز)

### 2. نظام الزيارات
- عداد زيارات لكل مكان (يومي وإجمالي)
- عداد زيارات للموقع كامل
- إعادة تعيين العداد اليومي تلقائياً

### 3. نظام الرسائل
- المستخدمون المسجلون فقط يمكنهم إرسال رسائل
- إمكانية إرسال صور في الرسائل
- عرض الرسائل في صفحة المكان
- إمكانية الرد على الرسائل

### 4. نظام التسويق بالعمولة
- كود خصم مخصص لكل مسوق
- نسبة خصم قابلة للتحديد
- حساب الأرباح المستحقة والمدفوعة
- لوحة تحكم للمسوق

### 5. البحث
- بحث عام في المنتجات والخدمات
- عرض النتائج مع الصورة الأولى والسعر
- الانتقال لصفحة المنتج عند الضغط

### 6. الأماكن المميزة
- شريط تمرير أفقي تلقائي
- عرض الأماكن المميزة في الأعلى
- تمرير يدوي أو تلقائي

## ملاحظات

- جميع الصور يتم تحويلها إلى WebP قبل الرفع لتوفير المساحة
- الفيديوهات يتم رفعها على YouTube وتخزين الروابط فقط
- استخدام ImgBB APIs مع Load Balancing لتوزيع الأحمال
- SweetAlert2 للإشعارات والتأكيدات
- دعم اللغة العربية بالكامل مع RTL

## التطوير المستقبلي

- [ ] إضافة نظام الدفع
- [ ] إضافة إشعارات Push
- [ ] إضافة تقييمات وتعليقات
- [ ] إضافة نظام الحجوزات
- [ ] إضافة نظام الإشعارات الفورية

## الدعم

للمساعدة والدعم، يرجى التواصل مع فريق التطوير.
