'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { HeadlineLarge, HeadlineMedium, TitleLarge, BodyLarge, BodyMedium } from '@/components/m3'

export default function PrivacyPolicyArabic() {
  const { colors } = useTheme()

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: colors.background }}
      dir="rtl"
    >
      <div 
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl"
        style={{ backgroundColor: colors.surface }}
      >
        <HeadlineLarge className="mb-4">سياسة الخصوصية لتطبيق بان جايد</HeadlineLarge>
        <BodyMedium color="onSurfaceVariant" className="mb-6">
          آخر تحديث: 23 يناير 2026
        </BodyMedium>
        
        <BodyLarge className="mb-6">
          توضح سياسة الخصوصية هذه سياساتنا وإجراءاتنا بشأن جمع واستخدام والإفصاح عن معلوماتك عند استخدام الخدمة.
        </BodyLarge>

        {/* Interpretation */}
        <HeadlineMedium className="mt-8 mb-4">التعريفات والتفسير</HeadlineMedium>
        <BodyMedium className="mb-6">
          الكلمات التي يبدأ حرفها الأول بحرف كبير لها معانٍ محددة بموجب الشروط التالية.
        </BodyMedium>

        {/* Main Section */}
        <HeadlineMedium className="mt-8 mb-4">جمع واستخدام بياناتك الشخصية</HeadlineMedium>
        
        {/* 1. Location Data */}
        <TitleLarge className="mt-6 mb-3">1. بيانات الموقع الجغرافي</TitleLarge>
        <BodyMedium className="mb-6">
          قد نستخدم ونخزن معلومات حول موقعك إذا منحتنا الإذن للقيام بذلك. نستخدم هذه البيانات لتوفير ميزات خدمتنا (البحث عن الأماكن والخدمات القريبة) ولتحسين خدمتنا. يمكنك تمكين أو تعطيل خدمات الموقع عند استخدام خدمتنا في أي وقت من خلال إعدادات جهازك.
        </BodyMedium>

        {/* 2. Camera and Photos */}
        <TitleLarge className="mt-6 mb-3">2. الكاميرا والصور</TitleLarge>
        <BodyMedium className="mb-6">
          قد تتطلب خدمتنا الوصول إلى كاميرا جهازك ومعرض الصور. يُستخدم هذا الوصول للسماح لك بتحميل صور الأماكن أو الخدمات أو تعيين صورة الملف الشخصي. لا يمكننا الوصول إلى صورك الخاصة دون إذنك الصريح.
        </BodyMedium>

        {/* 3. Microphone */}
        <TitleLarge className="mt-6 mb-3">3. الميكروفون والصوت</TitleLarge>
        <BodyMedium className="mb-6">
          قد نطلب الوصول إلى الميكروفون الخاص بك لتمكين ميزات البحث الصوتي أو الأوامر الصوتية داخل التطبيق. لا يتم تسجيل أو تخزين البيانات الصوتية على خوادمنا ما لم يُذكر صراحةً لميزة معينة.
        </BodyMedium>

        {/* 4. Files and Storage */}
        <TitleLarge className="mt-6 mb-3">4. الملفات والتخزين</TitleLarge>
        <BodyMedium className="mb-6">
          قد نحتاج إلى الوصول إلى مساحة تخزين جهازك لقراءة وكتابة الملفات الضرورية لتشغيل التطبيق، مثل تخزين الصور مؤقتاً أو حفظ تفضيلاتك.
        </BodyMedium>

        {/* 5. Push Notifications */}
        <TitleLarge className="mt-6 mb-3">5. الإشعارات الفورية</TitleLarge>
        <BodyMedium className="mb-6">
          قد نستخدم الإشعارات الفورية لإرسال التحديثات والتنبيهات المتعلقة بحسابك أو المعلومات حول الأماكن والخدمات الجديدة. يمكنك إلغاء الاشتراك في هذه الاتصالات في إعدادات جهازك.
        </BodyMedium>

        {/* Usage Data */}
        <TitleLarge className="mt-6 mb-3">بيانات الاستخدام</TitleLarge>
        <BodyMedium className="mb-6">
          يتم جمع بيانات الاستخدام تلقائياً عند استخدام الخدمة. قد تتضمن معلومات مثل عنوان بروتوكول الإنترنت لجهازك (مثل عنوان IP)، ونوع المتصفح، وإصدار المتصفح، والصفحات التي تزورها من خدمتنا، ووقت وتاريخ زيارتك.
        </BodyMedium>

        {/* Contact Us */}
        <HeadlineMedium className="mt-8 mb-4">اتصل بنا</HeadlineMedium>
        <BodyMedium className="mb-2">
          إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يمكنك الاتصال بنا:
        </BodyMedium>
        <ul className="list-disc mr-6 mt-2">
          <li>
            <BodyMedium>
              عبر البريد الإلكتروني: <a 
                href="mailto:ie4951611@gmail.com"
                style={{ color: colors.primary }}
                className="hover:underline"
              >
                ie4951611@gmail.com
              </a>
            </BodyMedium>
          </li>
        </ul>
      </div>
    </div>
  )
}
