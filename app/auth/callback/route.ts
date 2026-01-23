import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Create or update user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: profileError } = await supabase.from('user_profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
            is_affiliate: false,
          }, {
            onConflict: 'id',
          })

          if (profileError) {
            console.error('Error creating/updating profile:', profileError)
          }

          // Send welcome notification
          try {
            // Check if user has any notifications (to determine if this is first login)
            const { data: existingNotifications } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', user.id)
              .limit(1)
            
            // Send welcome notification if no previous notifications (first login)
            if (!existingNotifications || existingNotifications.length === 0) {
              await supabase.rpc('send_notification', {
                p_user_id: user.id,
                p_title_ar: 'مرحباً بك في بان! 🎉',
                p_title_en: 'Welcome to BAN! 🎉',
                p_message_ar: 'نحن سعداء بانضمامك إلينا. استكشف المحلات والصيدليات القريبة منك الآن!',
                p_message_en: 'We are happy to have you join us. Explore nearby stores and pharmacies now!',
                p_type: 'system',
                p_link: '/dashboard'
              })
            } else {
              // Send login notification for returning users
              await supabase.rpc('send_notification', {
                p_user_id: user.id,
                p_title_ar: 'مرحباً بعودتك! 👋',
                p_title_en: 'Welcome back! 👋',
                p_message_ar: 'سعداء برؤيتك مجدداً. تحقق من التحديثات الجديدة!',
                p_message_en: 'Happy to see you again. Check out the new updates!',
                p_type: 'system',
                p_link: '/dashboard'
              })
            }
          } catch (error) {
            console.error('Error sending welcome notification:', error)
            // Don't fail the login if notification fails
          }
        }
      } else {
        console.error('Error exchanging code for session:', error)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
