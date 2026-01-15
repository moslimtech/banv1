# دليل إعداد Google OAuth في Supabase

## الخطوة 1: إعداد Google Cloud Console

### 1.1 إنشاء/اختيار المشروع
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. اختر مشروع موجود أو أنشئ مشروع جديد:
   - اضغط على قائمة المشاريع في الأعلى
   - اختر "New Project" أو اختر مشروع موجود
   - أدخل اسم المشروع (مثلاً: "Business Directory")

### 1.2 تفعيل Google+ API
1. من القائمة الجانبية، اذهب إلى **APIs & Services** > **Library**
2. ابحث عن "Google+ API" أو "Google Identity"
3. اضغط على **Enable** لتفعيله

### 1.3 إنشاء OAuth 2.0 Credentials
1. اذهب إلى **APIs & Services** > **Credentials**
2. اضغط على **+ CREATE CREDENTIALS** في الأعلى
3. اختر **OAuth client ID**

### 1.4 إعداد OAuth Consent Screen (إذا لم يكن مُعداً)
1. إذا ظهرت رسالة "Configure consent screen"، اضغط عليها
2. اختر **External** (للتطوير) أو **Internal** (للمؤسسات)
3. املأ المعلومات:
   - **App name**: دليل المحلات والصيدليات
   - **User support email**: بريدك الإلكتروني
   - **Developer contact information**: بريدك الإلكتروني
4. اضغط **Save and Continue**
5. في **Scopes**، اضغط **Save and Continue** (لا حاجة لإضافة scopes إضافية)
6. في **Test users**، اضغط **Save and Continue** (للتطوير فقط)
7. اضغط **Back to Dashboard**

### 1.5 إنشاء OAuth Client ID
1. اذهب إلى **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID**
2. اختر **Application type**: **Web application**
3. أدخل **Name**: "Business Directory Web"
4. في **Authorized redirect URIs**، أضف:
   ```
   https://vcrmmplcmbiilysvfqhc.supabase.co/auth/v1/callback
   ```
   ⚠️ **مهم جداً**: استبدل `vcrmmplcmbiilysvfqhc` بـ Project Reference الخاص بك من Supabase
5. اضغط **CREATE**
6. **احفظ**:
   - **Client ID**: سيظهر في نافذة منبثقة
   - **Client Secret**: سيظهر في نفس النافذة
   - ⚠️ **احفظهما في مكان آمن!**

## الخطوة 2: إعداد Supabase

### 2.1 فتح Supabase Dashboard
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `vcrmmplcmbiilysvfqhc`

### 2.2 تفعيل Google Provider
1. من القائمة الجانبية، اذهب إلى **Authentication** > **Providers**
2. ابحث عن **Google** في القائمة
3. اضغط على **Google** لفتح الإعدادات

### 2.3 إدخال بيانات Google OAuth
1. فعّل **Enable Google provider** (Toggle)
2. أدخل **Client ID (for OAuth)**: 
   ```
   YOUR_GOOGLE_CLIENT_ID
   ```
   (يمكنك العثور عليه في ملف banenv أو من Google Cloud Console)

3. أدخل **Client Secret (for OAuth)**:
   ```
   YOUR_GOOGLE_CLIENT_SECRET
   ```
   (يمكنك العثور عليه في ملف banenv أو من Google Cloud Console)

4. **Authorized redirect URIs** يجب أن يكون:
   ```
   https://vcrmmplcmbiilysvfqhc.supabase.co/auth/v1/callback
   ```
   (يتم تعيينه تلقائياً - تأكد من أنه يطابق ما أضفته في Google Cloud)

5. اضغط **Save**

## الخطوة 3: التحقق من الإعداد

### 3.1 التحقق من Redirect URI
تأكد أن Redirect URI في Google Cloud Console **مطابق تماماً** لـ:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

### 3.2 اختبار تسجيل الدخول
1. افتح الموقع: http://localhost:8081/auth/login
2. اضغط على "تسجيل الدخول بحساب Google"
3. يجب أن تفتح نافذة Google OAuth
4. اختر حساب Google
5. بعد الموافقة، يجب أن يتم توجيهك إلى الموقع

## الخطوة 4: تحديث ملف البيئة (اختياري)

إذا استخدمت Client ID و Client Secret جديدين، قم بتحديث:

### ملف `/web/.env.local`:
```env
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_NEW_CLIENT_ID
```

## استكشاف الأخطاء

### خطأ: "redirect_uri_mismatch"
- **السبب**: Redirect URI في Google Cloud لا يطابق Supabase
- **الحل**: تأكد أن Redirect URI في Google Cloud هو:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```

### خطأ: "invalid_client"
- **السبب**: Client ID أو Client Secret خاطئ
- **الحل**: تحقق من القيم في Supabase Dashboard

### خطأ: "access_denied"
- **السبب**: لم توافق على الصلاحيات
- **الحل**: تأكد من الموافقة على جميع الصلاحيات المطلوبة

### لا تفتح نافذة Google OAuth
- **السبب**: قد يكون SweetAlert2 غير محمّل أو هناك خطأ في JavaScript
- **الحل**: افتح Console في المتصفح (F12) وتحقق من الأخطاء

## معلومات مهمة

### Project Reference في Supabase
- يمكنك العثور عليه في:
  - Supabase Dashboard > Settings > API
  - أو من URL المشروع: `https://YOUR_PROJECT_REF.supabase.co`

### Client ID و Client Secret
يمكنك العثور على هذه القيم في:
- ملف `banenv` (محلي - غير موجود في Git)
- Google Cloud Console > APIs & Services > Credentials

⚠️ **مهم**: لا تشارك هذه المعلومات الحساسة في الكود أو الملفات العامة.

## الخطوات السريعة

1. ✅ Google Cloud Console > إنشاء OAuth Client ID
2. ✅ إضافة Redirect URI: `https://vcrmmplcmbiilysvfqhc.supabase.co/auth/v1/callback`
3. ✅ Supabase > Authentication > Providers > Google
4. ✅ إدخال Client ID و Client Secret
5. ✅ Save
6. ✅ اختبار تسجيل الدخول

---

**بعد إتمام الخطوات، جرب تسجيل الدخول من الموقع!**
