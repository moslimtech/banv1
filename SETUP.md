# دليل الإعداد الكامل

## 1. إعداد Supabase

### إنشاء المشروع
1. اذهب إلى [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. احفظ:
   - Project URL
   - Anon Key
   - Service Role Key

### إعداد المصادقة (Google OAuth)
1. في Supabase Dashboard، اذهب إلى Authentication > Providers
2. فعّل Google Provider
3. أضف:
   - Client ID من Google Cloud Console
   - Client Secret من Google Cloud Console
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### إعداد Google Cloud Console
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. فعّل Google+ API
4. أنشئ OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. احفظ Client ID و Client Secret

### إعداد Google Maps API
1. في Google Cloud Console، فعّل Maps JavaScript API
2. أنشئ API Key
3. أضف القيود حسب الحاجة (HTTP referrers)

## 2. إعداد الموقع (Web)

### تثبيت الحزم
```bash
cd web
npm install
```

### إعداد ملف البيئة
أنشئ ملف `.env.local` في مجلد `web`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_IMGBB_API_1=your_imgbb_api_1
NEXT_PUBLIC_IMGBB_API_2=your_imgbb_api_2
NEXT_PUBLIC_IMGBB_API_3=your_imgbb_api_3
NEXT_PUBLIC_IMGBB_API_4=your_imgbb_api_4
NEXT_PUBLIC_IMGBB_API_5=your_imgbb_api_5
```

### تشغيل الموقع
```bash
npm run dev
```

الموقع سيعمل على `http://localhost:3000`

## 3. إعداد ImgBB APIs

1. اذهب إلى [ImgBB](https://api.imgbb.com)
2. سجّل الدخول أو أنشئ حساب
3. احصل على API Keys (يمكنك الحصول على 5 مفاتيح)
4. أضفها في ملفات البيئة

## 4. إعداد قاعدة البيانات

تم إنشاء جميع الجداول تلقائياً عند تشغيل Migration الأول.

### إنشاء باقة تجريبية
في Supabase SQL Editor:

```sql
INSERT INTO packages (
  name_ar, name_en, price, max_places, 
  max_product_videos, max_product_images, 
  max_place_videos, priority, card_style, is_featured
) VALUES (
  'باقة أساسية', 'Basic Package', 100, 1,
  0, 5, 1, 1, 'default', false
);
```

### إنشاء مسوق تجريبي
```sql
-- أولاً، احصل على user_id من auth.users
-- ثم:
INSERT INTO affiliates (
  user_id, code, discount_percentage, is_active
) VALUES (
  'user-uuid-here', 'TESTCODE', 10, true
);

-- تحديث user_profiles
UPDATE user_profiles 
SET is_affiliate = true, affiliate_code = 'TESTCODE'
WHERE id = 'user-uuid-here';
```

## 5. Row Level Security (RLS) Policies

يجب إضافة RLS Policies في Supabase:

### user_profiles
```sql
-- يمكن للجميع قراءة الملفات
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

-- يمكن للمستخدمين تحديث ملفاتهم فقط
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### places
```sql
-- يمكن للجميع قراءة الأماكن النشطة
CREATE POLICY "Active places are viewable by everyone" ON places
  FOR SELECT USING (is_active = true);

-- يمكن للمستخدمين إضافة أماكنهم
CREATE POLICY "Users can insert own places" ON places
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- يمكن للمستخدمين تحديث أماكنهم
CREATE POLICY "Users can update own places" ON places
  FOR UPDATE USING (auth.uid() = user_id);
```

### messages
```sql
-- يمكن للمستخدمين قراءة رسائل أماكنهم
CREATE POLICY "Users can read messages to their places" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places 
      WHERE places.id = messages.place_id 
      AND places.user_id = auth.uid()
    )
  );

-- يمكن للمستخدمين المسجلين إرسال رسائل
CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

## 6. الاختبار

### اختبار الموقع
1. افتح `http://localhost:3000`
2. جرب تسجيل الدخول
3. أضف مكان تجريبي
4. أضف منتج تجريبي
5. جرب البحث

## 7. النشر

### نشر الموقع
يمكنك نشر الموقع على:
- Vercel (موصى به لـ Next.js)
- Netlify
- أي استضافة تدعم Node.js

## ملاحظات مهمة

1. **الأمان**: لا تشارك Service Role Key أبداً
2. **البيئة**: استخدم متغيرات بيئة مختلفة للإنتاج والتطوير
3. **النسخ الاحتياطي**: قم بعمل نسخ احتياطي من قاعدة البيانات بانتظام
4. **المراقبة**: راقب استخدام APIs لتجنب تجاوز الحدود

## الدعم

إذا واجهت أي مشاكل، راجع:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
