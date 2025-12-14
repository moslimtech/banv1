# إعداد رفع الفيديوهات إلى YouTube

## الخطوات المطلوبة:

### 1. تفعيل YouTube Data API v3 في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. اختر المشروع `bansupabase`
3. اذهب إلى **API & Services** > **Library**
4. ابحث عن **YouTube Data API v3**
5. اضغط **Enable**

### 2. إضافة Scopes للـ OAuth Client

1. اذهب إلى **API & Services** > **OAuth consent screen**
2. تأكد من أن الـ Scopes التالية موجودة:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`

3. إذا لم تكن موجودة:
   - اضغط **ADD OR REMOVE SCOPES**
   - ابحث عن **YouTube Data API v3**
   - أضف:
     - `.../auth/youtube.upload`
     - `.../auth/youtube`
   - احفظ التغييرات

### 3. إضافة حقول YouTube في قاعدة البيانات

قم بتشغيل هذا SQL في Supabase SQL Editor:

```sql
-- إضافة حقول YouTube tokens في جدول user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS youtube_access_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_token_expiry TIMESTAMP WITH TIME ZONE;

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_profiles_youtube_token 
ON user_profiles(youtube_access_token) 
WHERE youtube_access_token IS NOT NULL;
```

### 4. إضافة متغيرات البيئة

أضف هذه المتغيرات في ملف `.env.local`:

```env
# Google OAuth (موجودة بالفعل)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8081/api/youtube/callback

# للمنتج (Production)
# GOOGLE_REDIRECT_URI=https://yourdomain.com/api/youtube/callback
```

**ملاحظة:** تأكد من إضافة نفس الـ Redirect URI في Google Cloud Console:
1. اذهب إلى **API & Services** > **Credentials**
2. اضغط على OAuth 2.0 Client ID الخاص بك
3. أضف `http://localhost:8081/api/youtube/callback` في **Authorized redirect URIs**
4. احفظ التغييرات

### 5. اختبار النظام

1. سجل الدخول إلى التطبيق
2. اذهب إلى **إضافة مكان جديد**
3. اختر **رفع فيديو**
4. اضغط **ربط حساب YouTube**
5. سجل الدخول ووافق على الصلاحيات
6. بعد العودة، يمكنك رفع الفيديوهات

## المميزات:

✅ رفع الفيديوهات مباشرة إلى YouTube  
✅ لا حاجة لحفظ الفيديوهات في Supabase Storage  
✅ توفير المساحة والتكلفة  
✅ دعم جميع أنواع الفيديوهات (حتى 2GB)  
✅ إمكانية اختيار حالة الخصوصية (خاص/غير مدرج/عام)  
✅ إضافة عنوان ووصف وعلامات للفيديو  

## ملاحظات مهمة:

- **حجم الفيديو:** الحد الأقصى هو 2GB
- **مدة الفيديو:** لا يوجد حد أقصى رسمي، لكن YouTube يوصي بأقل من 12 ساعة
- **صيغ الفيديو المدعومة:** MP4, MOV, AVI, WMV, FLV, 3GPP, WebM
- **Token Expiry:** Tokens تنتهي بعد فترة، النظام يقوم بتحديثها تلقائياً
- **Privacy:** يمكن اختيار حالة الخصوصية عند الرفع

## استكشاف الأخطاء:

### خطأ: "YouTube token expired"
- الحل: أعد ربط حساب YouTube من صفحة إضافة مكان جديد

### خطأ: "Failed to upload video"
- تحقق من:
  1. حجم الفيديو (أقل من 2GB)
  2. صيغة الفيديو مدعومة
  3. YouTube API مفعل
  4. OAuth scopes صحيحة

### خطأ: "User not authenticated with YouTube"
- الحل: اضغط "ربط حساب YouTube" وأكمل عملية المصادقة
