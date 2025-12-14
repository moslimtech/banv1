# إصلاح مشكلة Redirect إلى localhost

## المشكلة
بعد تسجيل الدخول عبر Google OAuth، يتم إعادة التوجيه إلى `localhost:3000` بدلاً من URL Vercel.

## الحل

### الخطوة 1: تحديث Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `vcrmmplcmbiilysvfqhc`
3. اذهب إلى **Authentication** → **URL Configuration**
4. في قسم **Site URL**، أضف:
   ```
   https://banv1-2n52.vercel.app
   ```
   أو URL Vercel الخاص بك

5. في قسم **Redirect URLs**، أضف:
   ```
   https://banv1-2n52.vercel.app/**
   https://banv1-2n52.vercel.app/auth/callback
   ```
   (استبدل `banv1-2n52.vercel.app` بـ URL Vercel الخاص بك)

6. اضغط **Save**

### الخطوة 2: التحقق من Environment Variables في Vercel

تأكد من أن `NEXT_PUBLIC_SITE_URL` موجود في Vercel:

1. اذهب إلى Vercel Dashboard → Project → Settings → Environment Variables
2. تحقق من وجود:
   ```
   NEXT_PUBLIC_SITE_URL=https://banv1-2n52.vercel.app
   ```
   (استبدل بـ URL Vercel الخاص بك)

3. إذا لم يكن موجوداً، أضفه:
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://banv1-2n52.vercel.app` (أو URL Vercel الخاص بك)
   - Environment: All Environments

### الخطوة 3: تحديث Google Cloud Console (اختياري)

إذا كنت تستخدم Google OAuth، تأكد من أن Redirect URIs في Google Cloud Console تحتوي على:

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. افتح OAuth 2.0 Client ID الخاص بك
4. في **Authorized redirect URIs**، تأكد من وجود:
   ```
   https://vcrmmplcmbiilysvfqhc.supabase.co/auth/v1/callback
   ```
   (هذا هو Supabase callback URL - يجب أن يكون موجوداً دائماً)

### الخطوة 4: Redeploy على Vercel

بعد تحديث Supabase Settings:

1. اذهب إلى Vercel Dashboard → Deployments
2. اضغط على **Redeploy** للـ deployment الأخير
3. أو انتظر deployment تلقائي بعد تحديث Environment Variables

## ملاحظات مهمة

- **Site URL في Supabase** هو الـ default redirect URL الذي يستخدمه Supabase عند عدم تحديد `redirectTo` في الكود
- **Redirect URLs** هي القائمة البيضاء للـ URLs المسموح بها للـ redirect
- يجب إضافة `/**` في Redirect URLs للسماح بجميع المسارات
- بعد تحديث Supabase Settings، قد تحتاج إلى إعادة تسجيل الدخول

## التحقق من الإصلاح

1. اذهب إلى `https://banv1-2n52.vercel.app/auth/login`
2. اضغط على "تسجيل الدخول بحساب Google"
3. بعد تسجيل الدخول، يجب أن يتم إعادة التوجيه إلى `https://banv1-2n52.vercel.app` وليس `localhost:3000`
