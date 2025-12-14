# شرح المشروع والفرق بين Next.js و Expo

## هيكل المشروع

المشروع يتكون من **جزئين منفصلين**:

### 1. الموقع (Web) - Next.js
- **المجلد**: `/web`
- **المتغيرات**: تبدأ بـ `NEXT_PUBLIC_`
- **الملف**: `.env.local`
- **السبب**: Next.js يحتاج `NEXT_PUBLIC_` للمتغيرات التي تظهر في المتصفح (client-side)

### 2. التطبيق (Mobile) - Expo
- **المجلد**: `/mobile`
- **المتغيرات**: تبدأ بـ `EXPO_PUBLIC_`
- **الملف**: `.env` أو في `app.json` تحت `extra`
- **السبب**: Expo يحتاج `EXPO_PUBLIC_` للمتغيرات العامة، أو يمكن وضعها في `app.json`

## لماذا الفرق؟

### Next.js (`NEXT_PUBLIC_`)
- Next.js يفرق بين **server-side** و **client-side**
- المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` فقط متاحة في المتصفح
- المتغيرات الأخرى (بدون `NEXT_PUBLIC_`) متاحة فقط في الـ server
- هذا للأمان: لا تريد تعريض مفاتيح API في المتصفح

### Expo (`EXPO_PUBLIC_`)
- Expo يحتاج `EXPO_PUBLIC_` للمتغيرات التي تريد استخدامها في التطبيق
- أو يمكن وضعها في `app.json` تحت `extra` ثم قراءتها بـ `expo-constants`
- المتغيرات في `.env` تحتاج مكتبة `dotenv` أو `expo-constants`

## الملفات الحالية

### ملف `banenv` (في الجذر)
```
EXPO_PUBLIC_SUPABASE_URL=...  ← للتطبيق Expo
EXPO_PUBLIC_SUPABASE_ANON_KEY=...  ← للتطبيق Expo
IMGBB_API_1=...  ← يمكن استخدامها في كلا المشروعين
```

### ملف `.env.local` (في `/web`)
```
NEXT_PUBLIC_SUPABASE_URL=...  ← للموقع Next.js
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ← للموقع Next.js
NEXT_PUBLIC_IMGBB_API_1=...  ← للموقع Next.js
```

### ملف `.env` (في `/mobile`)
```
EXPO_PUBLIC_SUPABASE_URL=...  ← للتطبيق Expo
EXPO_PUBLIC_SUPABASE_ANON_KEY=...  ← للتطبيق Expo
IMGBB_API_1=...  ← للتطبيق Expo (يحتاج expo-constants)
```

## كيفية القراءة

### في Next.js
```typescript
// في client-side
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

// في server-side (API routes)
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
```

### في Expo
```typescript
// طريقة 1: EXPO_PUBLIC_
const url = process.env.EXPO_PUBLIC_SUPABASE_URL

// طريقة 2: من app.json
import Constants from 'expo-constants'
const apiKey = Constants.expoConfig?.extra?.IMGBB_API_1
```

## الخلاصة

- ✅ **Next.js** يستخدم `NEXT_PUBLIC_` للمتغيرات العامة
- ✅ **Expo** يستخدم `EXPO_PUBLIC_` أو `app.json` للمتغيرات
- ✅ كل مشروع له ملف بيئة خاص به
- ✅ المتغيرات الحساسة (Service Role Key) لا تظهر في client-side

## ملاحظة مهمة

في Expo، المتغيرات في `.env` **لا تُقرأ تلقائياً**. يجب:
1. استخدام `EXPO_PUBLIC_` للمتغيرات العامة
2. أو وضعها في `app.json` تحت `extra`
3. أو استخدام `expo-constants` لقراءتها
