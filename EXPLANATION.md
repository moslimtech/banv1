# شرح المشروع - Next.js

## هيكل المشروع

المشروع يتكون من **موقع ويب** مبني بـ Next.js:

### الموقع (Web) - Next.js
- **المجلد**: `/web`
- **المتغيرات**: تبدأ بـ `NEXT_PUBLIC_`
- **الملف**: `.env.local`
- **السبب**: Next.js يحتاج `NEXT_PUBLIC_` للمتغيرات التي تظهر في المتصفح (client-side)

## لماذا `NEXT_PUBLIC_`؟

### Next.js (`NEXT_PUBLIC_`)
- Next.js يفرق بين **server-side** و **client-side**
- المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` فقط متاحة في المتصفح
- المتغيرات الأخرى (بدون `NEXT_PUBLIC_`) متاحة فقط في الـ server
- هذا للأمان: لا تريد تعريض مفاتيح API في المتصفح

## الملفات الحالية

### ملف `.env.local` (في `/web`)
```
NEXT_PUBLIC_SUPABASE_URL=...  ← للموقع Next.js
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ← للموقع Next.js
NEXT_PUBLIC_IMGBB_API_1=...  ← للموقع Next.js
SUPABASE_SERVICE_ROLE_KEY=...  ← للـ server فقط (لا يظهر في المتصفح)
```

## كيفية القراءة

### في Next.js
```typescript
// في client-side
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

// في server-side (API routes)
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
```

## الخلاصة

- ✅ **Next.js** يستخدم `NEXT_PUBLIC_` للمتغيرات العامة
- ✅ المتغيرات الحساسة (Service Role Key) لا تظهر في client-side
- ✅ المشروع يدعم الويب فقط ويمكن استخدامه في WebView على الموبايل
