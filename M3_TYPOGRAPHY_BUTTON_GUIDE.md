# دليل النظام الموحد M3 للخطوط والأزرار

## 📚 نظرة عامة

تم إنشاء نظام موحد متكامل للخطوط والأزرار متوافق 100% مع **Material Design 3**. هذا النظام يضمن:

- ✅ **تناسق كامل** عبر جميع صفحات التطبيق
- ✅ **سهولة الاستخدام** مع مكونات جاهزة
- ✅ **دعم Dark Mode** تلقائياً
- ✅ **قابلية الوصول** (Accessibility)
- ✅ **تصميم موحد** متوافق مع M3

---

## 🔤 نظام الخطوط (Typography)

### M3 Type Scale

تم تطبيق [M3 Type Scale](https://m3.material.io/styles/typography/type-scale-tokens) الكامل:

#### **Display** - نصوص كبيرة عالية التأثير
```tsx
<Typography variant="display-large">57px</Typography>
<Typography variant="display-medium">45px</Typography>
<Typography variant="display-small">36px</Typography>

// Or shorthand:
<DisplayLarge>Hero Title</DisplayLarge>
```

#### **Headline** - عناوين رئيسية
```tsx
<Typography variant="headline-large">32px</Typography>
<Typography variant="headline-medium">28px</Typography>
<Typography variant="headline-small">24px</Typography>

// Or shorthand:
<HeadlineMedium>Section Title</HeadlineMedium>
```

#### **Title** - عناوين متوسطة
```tsx
<Typography variant="title-large">22px</Typography>
<Typography variant="title-medium">16px</Typography>
<Typography variant="title-small">14px</Typography>

// Or shorthand:
<TitleLarge>Card Title</TitleLarge>
```

#### **Body** - نص المحتوى
```tsx
<Typography variant="body-large">16px</Typography>
<Typography variant="body-medium">14px</Typography>
<Typography variant="body-small">12px</Typography>

// Or shorthand:
<BodyMedium>Regular paragraph text</BodyMedium>
```

#### **Label** - تسميات وأزرار
```tsx
<Typography variant="label-large">14px</Typography>
<Typography variant="label-medium">12px</Typography>
<Typography variant="label-small">11px</Typography>

// Or shorthand:
<LabelLarge>Button Label</LabelLarge>
```

### خصائص Typography Component

```tsx
interface TypographyProps {
  variant: 'display-large' | 'headline-medium' | 'body-small' | ... // 15 variant
  as?: 'h1' | 'h2' | 'p' | 'span' | 'div' | ... // HTML element
  color?: 'primary' | 'onSurface' | 'error' | ... // Theme colors
  className?: string
  children: ReactNode
}
```

### أمثلة الاستخدام

```tsx
import { Typography, HeadlineLarge, BodyMedium } from '@/components/m3'

// صفحة رئيسية
<HeadlineLarge>مرحباً بك</HeadlineLarge>
<BodyMedium color="onSurfaceVariant">
  هذا نص توضيحي باستخدام نظام M3
</BodyMedium>

// عنوان مع لون مخصص
<Typography variant="title-large" color="primary">
  عنوان بلون Primary
</Typography>

// رسالة خطأ
<Typography variant="body-small" color="error">
  حدث خطأ في العملية
</Typography>

// تخصيص عنصر HTML
<Typography variant="headline-small" as="h3">
  عنوان H3
</Typography>
```

---

## 🔘 نظام الأزرار (Buttons)

### M3 Button Variants

تم تطبيق جميع أنماط M3 للأزرار:

#### **Filled** - زر ممتلئ (Primary Action)
```tsx
<Button variant="filled">
  حفظ التغييرات
</Button>
```
- **الاستخدام**: الإجراء الأساسي في الصفحة
- **اللون**: Primary
- **الشكل**: ممتلئ بالكامل

#### **Filled Tonal** - زر ملون خفيف (Secondary Action)
```tsx
<Button variant="filled-tonal">
  إلغاء
</Button>
```
- **الاستخدام**: إجراءات ثانوية مهمة
- **اللون**: Primary مع 12% opacity
- **الشكل**: ممتلئ بلون خفيف

#### **Outlined** - زر محدد (Alternative Action)
```tsx
<Button variant="outlined">
  تعديل
</Button>
```
- **الاستخدام**: إجراءات بديلة
- **اللون**: حدود Primary، خلفية شفافة
- **الشكل**: حدود فقط

#### **Text** - زر نصي (Low Priority)
```tsx
<Button variant="text">
  تخطي
</Button>
```
- **الاستخدام**: إجراءات منخفضة الأولوية
- **اللون**: نص Primary فقط
- **الشكل**: بدون خلفية أو حدود

#### **Elevated** - زر بارز (Alternative Style)
```tsx
<Button variant="elevated">
  مزيد من الخيارات
</Button>
```
- **الاستخدام**: إبراز عن الخلفية
- **اللون**: Surface مع Primary text
- **الشكل**: مرتفع مع ظل

### أحجام الأزرار (Sizes)

```tsx
<Button size="sm">Small</Button>     // px-4 py-2 text-sm
<Button size="md">Medium</Button>    // px-6 py-3 text-base (default)
<Button size="lg">Large</Button>     // px-8 py-4 text-lg
```

### أشكال الحواف (Shapes)

```tsx
<Button shape="full">Pill</Button>      // rounded-full (default, M3 Android)
<Button shape="large">Large</Button>    // rounded-2xl (16px)
<Button shape="medium">Medium</Button>  // rounded-xl (12px)
<Button shape="small">Small</Button>    // rounded-lg (8px)
```

### حالة التحميل (Loading State)

```tsx
<Button loading={isLoading}>
  {isLoading ? 'جاري الحفظ...' : 'حفظ'}
</Button>
```

### عرض كامل (Full Width)

```tsx
<Button fullWidth>
  تسجيل الدخول
</Button>
```

### أمثلة كاملة

```tsx
import { Button } from '@/components/m3'

// زر حفظ رئيسي
<Button 
  variant="filled" 
  size="lg" 
  onClick={handleSave}
  loading={isSaving}
>
  حفظ التغييرات
</Button>

// زر إلغاء
<Button 
  variant="outlined" 
  onClick={handleCancel}
>
  إلغاء
</Button>

// زر حذف بلون خطأ
<Button 
  variant="filled"
  style={{ 
    backgroundColor: colors.error,
    color: colors.onPrimary 
  }}
  onClick={handleDelete}
>
  حذف
</Button>

// زر كامل العرض
<Button 
  variant="filled-tonal"
  fullWidth
  shape="large"
>
  متابعة
</Button>
```

---

## 📦 الاستيراد (Import)

```tsx
// استيراد موحد من m3
import { 
  Typography, 
  Button,
  HeadlineLarge,
  BodyMedium,
  TitleMedium 
} from '@/components/m3'

// أو استيراد فردي
import Typography from '@/components/m3/Typography'
import Button from '@/components/common/Button'
```

---

## 🎨 التكامل مع ThemeContext

كلا المكونين متكاملين تماماً مع **ThemeContext**:

```tsx
const { colors } = useTheme()

// الألوان تتغير تلقائياً مع:
// 1. Dark Mode / Light Mode
// 2. دور المستخدم (Admin/Affiliate/User)
// 3. Theme colors
```

### الألوان المتاحة

```typescript
colors.primary          // اللون الأساسي
colors.secondary        // اللون الثانوي
colors.onPrimary        // نص على Primary
colors.onSurface        // نص رئيسي
colors.onSurfaceVariant // نص ثانوي
colors.error            // لون الخطأ
colors.success          // لون النجاح
colors.warning          // لون التحذير
colors.info             // لون المعلومات
```

---

## 📋 متى تستخدم كل نوع؟

### Typography

| Variant | الاستخدام | مثال |
|---------|-----------|------|
| `display-*` | Hero sections, Landing pages | صفحة الهبوط الرئيسية |
| `headline-*` | Page titles, Section headers | "إدارة المستخدمين" |
| `title-*` | Card titles, Dialog headers | "تفاصيل المنتج" |
| `body-*` | Paragraphs, Content text | النصوص العادية |
| `label-*` | Buttons, Labels, Tags | "جديد", "مميز" |

### Button

| Variant | الاستخدام | مثال |
|---------|-----------|------|
| `filled` | Primary action (واحد فقط في الشاشة) | "حفظ", "تسجيل" |
| `filled-tonal` | Secondary important action | "إلغاء", "رجوع" |
| `outlined` | Alternative actions | "تعديل", "مشاركة" |
| `text` | Low priority actions | "تخطي", "لاحقاً" |
| `elevated` | Stand out from surface | "المزيد..." |

---

## ✅ أفضل الممارسات

### Typography

1. **استخدم الـ Variant الصحيح**
   ```tsx
   // ❌ خطأ
   <h1 className="text-2xl">Title</h1>
   
   // ✅ صحيح
   <HeadlineLarge>Title</HeadlineLarge>
   ```

2. **استخدم الألوان من Theme**
   ```tsx
   // ❌ خطأ
   <p style={{ color: '#666' }}>Text</p>
   
   // ✅ صحيح
   <BodyMedium color="onSurfaceVariant">Text</BodyMedium>
   ```

3. **Semantic HTML**
   ```tsx
   // ✅ صحيح
   <Typography variant="headline-large" as="h1">
     Page Title
   </Typography>
   ```

### Button

1. **زر Primary واحد فقط**
   ```tsx
   // ✅ صحيح
   <Button variant="filled">Save</Button>
   <Button variant="outlined">Cancel</Button>
   
   // ❌ خطأ - زرين filled
   <Button variant="filled">Save</Button>
   <Button variant="filled">Delete</Button>
   ```

2. **استخدم Loading State**
   ```tsx
   // ✅ صحيح
   <Button loading={isLoading} onClick={save}>
     Save
   </Button>
   ```

3. **حجم مناسب للسياق**
   ```tsx
   // Hero action: lg
   // Regular action: md
   // Compact UI: sm
   ```

---

## 🚀 مثال تطبيق كامل

```tsx
'use client'

import { useState } from 'react'
import { 
  Button, 
  HeadlineLarge, 
  BodyMedium,
  TitleMedium 
} from '@/components/m3'
import { useTheme } from '@/contexts/ThemeContext'

export default function ExamplePage() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // ... save logic
    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: colors.background }}>
      {/* Page Title */}
      <HeadlineLarge color="primary">
        مثال على النظام الموحد
      </HeadlineLarge>

      {/* Description */}
      <BodyMedium color="onSurfaceVariant" className="mt-2">
        هذا مثال على استخدام نظام M3 الموحد للخطوط والأزرار
      </BodyMedium>

      {/* Card */}
      <div 
        className="mt-6 p-6 rounded-3xl"
        style={{ backgroundColor: colors.surface }}
      >
        <TitleMedium>معلومات البطاقة</TitleMedium>
        <BodyMedium className="mt-2">
          محتوى البطاقة هنا
        </BodyMedium>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button 
            variant="filled"
            onClick={handleSave}
            loading={loading}
          >
            حفظ
          </Button>
          
          <Button variant="outlined">
            إلغاء
          </Button>
          
          <Button variant="text">
            تخطي
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📚 مصادر إضافية

- [Material Design 3 Typography](https://m3.material.io/styles/typography)
- [Material Design 3 Buttons](https://m3.material.io/components/buttons)
- [M3 Type Scale Tokens](https://m3.material.io/styles/typography/type-scale-tokens)

---

## 🎯 الخلاصة

النظام الموحد M3 للخطوط والأزرار يوفر:

✅ **15 Typography variant** متوافقة مع M3
✅ **5 Button variants** (Filled, Tonal, Outlined, Text, Elevated)
✅ **3 أحجام** و **4 أشكال** للأزرار
✅ **تكامل كامل** مع ThemeContext
✅ **Dark Mode** تلقائي
✅ **TypeScript** كامل
✅ **Shorthand components** للسهولة

**استخدم هذا النظام في جميع صفحات التطبيق لضمان التناسق والجودة!** 🚀
