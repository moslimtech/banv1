# خطوات إعداد YouTube API - دليل تفصيلي

## الخطوة 1: تفعيل YouTube Data API v3

1. اذهب إلى: https://console.cloud.google.com/apis/library?project=bansupabase
2. في شريط البحث، اكتب: **YouTube Data API v3**
3. اضغط على **YouTube Data API v3** من النتائج
4. اضغط على زر **ENABLE** (تفعيل)
5. انتظر حتى يظهر "API enabled"

## الخطوة 2: إضافة Redirect URI للـ OAuth Client

1. اذهب إلى: https://console.cloud.google.com/apis/credentials?project=bansupabase
2. في قسم **OAuth 2.0 Client IDs**، اضغط على **banauthlogin** (أو أي OAuth client موجود)
3. في الصفحة المفتوحة، ابحث عن قسم **Authorized redirect URIs**
4. اضغط على **+ ADD URI**
5. أضف هذا الرابط:
   ```
   http://localhost:8081/api/youtube/callback
   ```
6. إذا كنت تستخدم domain آخر في الإنتاج، أضفه أيضاً:
   ```
   https://yourdomain.com/api/youtube/callback
   ```
7. اضغط **SAVE** في الأسفل

## الخطوة 3: إضافة Scopes في OAuth Consent Screen

1. اذهب إلى: https://console.cloud.google.com/apis/credentials/consent?project=bansupabase
2. تأكد من أنك في وضع **Edit app**
3. انتقل لأسفل إلى قسم **Scopes**
4. اضغط على **+ ADD OR REMOVE SCOPES**
5. في النافذة المنبثقة:
   - ابحث عن **YouTube Data API v3**
   - تأكد من إضافة هذه Scopes:
     - ✅ `https://www.googleapis.com/auth/youtube.upload`
     - ✅ `https://www.googleapis.com/auth/youtube`
6. اضغط **UPDATE** ثم **SAVE AND CONTINUE**
7. أكمل باقي الخطوات (Test users, Summary) واضغط **BACK TO DASHBOARD**

## الخطوة 4: التحقق من OAuth Client ID و Secret

1. اذهب إلى: https://console.cloud.google.com/apis/credentials?project=bansupabase
2. اضغط على OAuth 2.0 Client ID (مثلاً `banauthlogin`)
3. انسخ:
   - **Client ID** 
   - **Client secret**
4. تأكد من وجودهما في ملف `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:8081/api/youtube/callback
   ```

## الخطوة 5: إضافة الحقول في Supabase

1. افتح Supabase Dashboard: https://supabase.com/dashboard
2. اختر مشروعك
3. اذهب إلى **SQL Editor** من القائمة الجانبية
4. انسخ والصق هذا الكود:

```sql
-- إضافة حقول YouTube tokens
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS youtube_access_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_token_expiry TIMESTAMP WITH TIME ZONE;

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_profiles_youtube_token 
ON user_profiles(youtube_access_token) 
WHERE youtube_access_token IS NOT NULL;

-- إضافة تعليقات
COMMENT ON COLUMN user_profiles.youtube_access_token IS 'YouTube OAuth access token for video uploads';
COMMENT ON COLUMN user_profiles.youtube_refresh_token IS 'YouTube OAuth refresh token for renewing access token';
COMMENT ON COLUMN user_profiles.youtube_token_expiry IS 'Expiry date of the YouTube access token';
```

5. اضغط **RUN** لتنفيذ الكود

## الخطوة 6: اختبار النظام

1. شغّل التطبيق:
   ```bash
   cd web
   npm run dev
   ```

2. سجل الدخول إلى التطبيق

3. اذهب إلى: **إضافة مكان جديد**

4. اختر **رفع فيديو**

5. اضغط **ربط حساب YouTube**

6. سجل الدخول بحساب Google ووافق على الصلاحيات

7. بعد العودة، جرب رفع فيديو

## استكشاف الأخطاء

### خطأ: "redirect_uri_mismatch"
- **الحل:** تأكد من إضافة `http://localhost:8081/api/youtube/callback` في OAuth Client

### خطأ: "access_denied"
- **الحل:** تأكد من إضافة Scopes في OAuth Consent Screen

### خطأ: "API not enabled"
- **الحل:** تأكد من تفعيل YouTube Data API v3

### خطأ: "Invalid credentials"
- **الحل:** تحقق من Client ID و Secret في `.env.local`

## روابط سريعة

- [تفعيل YouTube API](https://console.cloud.google.com/apis/library?project=bansupabase)
- [Credentials](https://console.cloud.google.com/apis/credentials?project=bansupabase)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=bansupabase)
