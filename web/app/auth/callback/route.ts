import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
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
      }
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
