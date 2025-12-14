# ✅ قائمة التحقق من إعداد YouTube Upload

## ✅ الكود والملفات (مكتمل)

### 1. المكتبات المثبتة
- ✅ `googleapis` - موجود في `package.json`
- ✅ `react-leaflet` و `leaflet` - موجودة

### 2. ملفات YouTube API
- ✅ `/web/lib/youtube-upload.ts` - مكتبة YouTube API
- ✅ `/web/app/api/youtube/auth/route.ts` - API للمصادقة
- ✅ `/web/app/api/youtube/callback/route.ts` - Callback handler
- ✅ `/web/app/api/youtube/upload/route.ts` - API لرفع الفيديوهات

### 3. المكونات
- ✅ `/web/components/YouTubeUpload.tsx` - مكون رفع الفيديوهات
- ✅ `/web/app/dashboard/places/new/page.tsx` - محدث لاستخدام YouTubeUpload

### 4. قاعدة البيانات
- ✅ `/web/supabase_migrations/add_youtube_tokens.sql` - SQL migration

### 5. التوثيق
- ✅ `YOUTUBE_UPLOAD_SETUP.md` - دليل الإعداد
- ✅ `YOUTUBE_SETUP_STEPS.md` - خطوات تفصيلية

## ⚠️ ما يجب إكماله يدوياً

### 1. Google Cloud Console

#### أ. تفعيل YouTube Data API v3
- [ ] اذهب إلى: https://console.cloud.google.com/apis/library?project=bansupabase
- [ ] ابحث عن "YouTube Data API v3"
- [ ] اضغط **ENABLE**

#### ب. إضافة Redirect URI
- [ ] اذهب إلى: https://console.cloud.google.com/apis/credentials?project=bansupabase
- [ ] اضغط على OAuth Client (`banauthlogin`)
- [ ] في **Authorized redirect URIs**، اضغط **+ ADD URI**
- [ ] أضف: `http://localhost:8081/api/youtube/callback`
- [ ] اضغط **SAVE**

#### ج. إضافة Scopes
- [ ] اذهب إلى: https://console.cloud.google.com/apis/credentials/consent?project=bansupabase
- [ ] اضغط **+ ADD OR REMOVE SCOPES**
- [ ] أضف:
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube`
- [ ] احفظ التغييرات

### 2. Supabase

#### أ. إضافة الحقول في قاعدة البيانات
- [ ] افتح Supabase Dashboard
- [ ] اذهب إلى **SQL Editor**
- [ ] شغّل الكود من `/web/supabase_migrations/add_youtube_tokens.sql`:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS youtube_access_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_token_expiry TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_youtube_token 
ON user_profiles(youtube_access_token) 
WHERE youtube_access_token IS NOT NULL;
```

### 3. ملف `.env.local`

#### أ. إضافة متغيرات البيئة
- [ ] افتح `/web/.env.local`
- [ ] تأكد من وجود:

```env
# Google OAuth (موجودة بالفعل)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# YouTube Redirect URI (جديد)
GOOGLE_REDIRECT_URI=http://localhost:8081/api/youtube/callback
```

**ملاحظة:** إذا لم تكن تعرف Client Secret:
1. اذهب إلى Google Cloud Console > Credentials
2. اضغط على OAuth Client
3. إذا كان Secret مخفي، اضغط **+ Add secret** لإنشاء واحد جديد
4. انسخه وأضفه في `.env.local`

## 🧪 اختبار النظام

بعد إكمال كل الخطوات أعلاه:

1. [ ] شغّل التطبيق: `npm run dev`
2. [ ] سجل الدخول
3. [ ] اذهب إلى **إضافة مكان جديد**
4. [ ] اختر **رفع فيديو**
5. [ ] اضغط **ربط حساب YouTube**
6. [ ] وافق على الصلاحيات
7. [ ] جرب رفع فيديو

## 📋 ملخص الحالة

### ✅ مكتمل (الكود)
- جميع الملفات موجودة
- الكود جاهز
- المكونات متصلة

### ⚠️ يحتاج إكمال يدوي
- تفعيل YouTube API في Google Cloud
- إضافة Redirect URI
- إضافة Scopes
- إضافة الحقول في Supabase
- إضافة متغيرات البيئة

## 🔗 روابط سريعة

- [تفعيل YouTube API](https://console.cloud.google.com/apis/library?project=bansupabase)
- [Credentials](https://console.cloud.google.com/apis/credentials?project=bansupabase)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=bansupabase)
