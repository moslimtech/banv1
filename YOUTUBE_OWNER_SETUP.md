# إعداد YouTube لحساب المالك

## التغييرات المهمة:

تم تعديل النظام لرفع جميع الفيديوهات على حساب YouTube الخاص بك (المالك) بدلاً من حسابات المستخدمين.

## الخطوات المطلوبة:

### 1. ربط حساب YouTube (مرة واحدة فقط)

1. سجل الدخول كـ **Admin**
2. اذهب إلى: **لوحة الإدارة** → **YouTube**
3. اضغط **"ربط حساب YouTube"**
4. سجل الدخول بحساب Google الخاص بك
5. وافق على الصلاحيات
6. بعد العودة، سيتم حفظ credentials في حسابك كـ Admin

### 2. كيفية عمل النظام الآن:

- ✅ **المستخدمون لا يحتاجون لربط حسابات YouTube**
- ✅ **جميع الفيديوهات تُرفع على حسابك**
- ✅ **يمكنك إدارة جميع الفيديوهات من قناة YouTube الخاصة بك**
- ✅ **يمكن اختيار حالة الخصوصية لكل فيديو**

### 3. الملفات المحدثة:

- `lib/youtube-upload.ts` - يستخدم credentials المالك
- `app/api/youtube/upload/route.ts` - لا يحتاج userId
- `app/api/youtube/callback/route.ts` - يحفظ في حساب Admin
- `components/YouTubeUpload.tsx` - مبسط، لا يحتاج authentication من المستخدم
- `app/admin/youtube/page.tsx` - صفحة جديدة لإعدادات YouTube

### 4. استخدام متغيرات البيئة (اختياري):

يمكنك أيضاً حفظ credentials في `.env.local` بدلاً من قاعدة البيانات:

```env
YOUTUBE_ACCESS_TOKEN=your_access_token_here
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
YOUTUBE_TOKEN_EXPIRY=2025-12-31T23:59:59Z
```

**ملاحظة:** النظام يبحث أولاً في متغيرات البيئة، ثم في قاعدة البيانات.

## المميزات:

1. **سهولة الاستخدام:** المستخدمون يرفعون الفيديوهات مباشرة بدون ربط حسابات
2. **التحكم الكامل:** جميع الفيديوهات على حسابك
3. **الأمان:** لا حاجة لمشاركة credentials مع المستخدمين
4. **الإدارة:** يمكنك إدارة جميع الفيديوهات من YouTube Studio

## استكشاف الأخطاء:

### خطأ: "YouTube credentials not configured"
- **الحل:** اذهب إلى `/admin/youtube` واربط حساب YouTube

### خطأ: "YouTube token expired"
- **الحل:** النظام يقوم بتحديث Token تلقائياً. إذا فشل، أعد ربط الحساب من `/admin/youtube`

## روابط سريعة:

- [لوحة الإدارة - YouTube](/admin/youtube)
- [لوحة الإدارة الرئيسية](/admin)
