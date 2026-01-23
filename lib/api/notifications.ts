/**
 * Notifications API Helper Functions
 */

import { supabase } from '@/lib/supabase'
import { NotificationType } from '@/lib/types/database'

interface SendNotificationParams {
  userId: string
  titleAr: string
  messageAr: string
  type: NotificationType
  link?: string
  titleEn?: string
  messageEn?: string
  icon?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

/**
 * Send a notification to a user
 */
export async function sendNotification({
  userId,
  titleAr,
  messageAr,
  type,
  link,
  titleEn,
  messageEn,
  icon,
  priority = 'normal'
}: SendNotificationParams) {
  try {
    const { data, error } = await supabase.rpc('send_notification', {
      p_user_id: userId,
      p_title_ar: titleAr,
      p_message_ar: messageAr,
      p_type: type,
      p_link: link || null,
      p_title_en: titleEn || null,
      p_message_en: messageEn || null
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { data: null, error }
  }
}

/**
 * Send a welcome notification to a new user
 */
export async function sendWelcomeNotification(userId: string) {
  return sendNotification({
    userId,
    titleAr: 'مرحباً بك في بان! 🎉',
    titleEn: 'Welcome to BAN! 🎉',
    messageAr: 'نحن سعداء بانضمامك إلينا. استكشف المحلات والصيدليات القريبة منك الآن!',
    messageEn: 'We are happy to have you join us. Explore nearby stores and pharmacies now!',
    type: NotificationType.SYSTEM,
    link: '/dashboard',
    icon: '🎉',
    priority: 'normal'
  })
}

/**
 * Send a message notification
 */
export async function sendMessageNotification(
  userId: string,
  placeName: string,
  placeId: string
) {
  return sendNotification({
    userId,
    titleAr: `رسالة جديدة من ${placeName}`,
    titleEn: `New message from ${placeName}`,
    messageAr: `لديك رسالة جديدة من ${placeName}. انقر للرد.`,
    messageEn: `You have a new message from ${placeName}. Click to reply.`,
    type: NotificationType.MESSAGE,
    link: `/dashboard/places/${placeId}`,
    icon: '💬',
    priority: 'high'
  })
}

/**
 * Send subscription expiry notification
 */
export async function sendSubscriptionExpiryNotification(
  userId: string,
  daysLeft: number
) {
  return sendNotification({
    userId,
    titleAr: 'تنبيه: اشتراكك قارب على الانتهاء',
    titleEn: 'Alert: Your subscription is about to expire',
    messageAr: `اشتراكك سينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}. جدد الآن لتستمر في الاستفادة من خدماتنا.`,
    messageEn: `Your subscription will expire in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Renew now to continue enjoying our services.`,
    type: NotificationType.SUBSCRIPTION,
    link: '/dashboard/packages',
    icon: '⚠️',
    priority: 'urgent'
  })
}

/**
 * Send employee request notification to place owner
 */
export async function sendEmployeeRequestNotification(
  ownerId: string,
  placeName: string,
  placeId: string,
  employeeName: string
) {
  return sendNotification({
    userId: ownerId,
    titleAr: 'طلب عمل جديد',
    titleEn: 'New employee request',
    messageAr: `تقدم ${employeeName} بطلب للعمل في ${placeName}. راجع الطلب الآن.`,
    messageEn: `${employeeName} has applied to work at ${placeName}. Review the request now.`,
    type: NotificationType.EMPLOYEE_REQUEST,
    link: `/dashboard/places/${placeId}/employees`,
    icon: '👥',
    priority: 'high'
  })
}

/**
 * Send payment confirmation notification
 */
export async function sendPaymentConfirmationNotification(
  userId: string,
  amount: number,
  packageName: string
) {
  return sendNotification({
    userId,
    titleAr: 'تم استلام الدفعة بنجاح',
    titleEn: 'Payment received successfully',
    messageAr: `تم استلام دفعتك بمبلغ ${amount} جنيه لباقة ${packageName}. سيتم مراجعتها قريباً.`,
    messageEn: `Your payment of ${amount} EGP for ${packageName} package has been received. It will be reviewed soon.`,
    type: NotificationType.PAYMENT,
    link: '/dashboard/packages',
    icon: '✅',
    priority: 'normal'
  })
}

/**
 * Send promotion notification
 */
export async function sendPromotionNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return sendNotification({
    userId,
    titleAr: title,
    messageAr: message,
    type: NotificationType.PROMOTION,
    link,
    icon: '🎁',
    priority: 'normal'
  })
}
