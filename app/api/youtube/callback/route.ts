import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/youtube-upload'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // 'admin' or user_id


    if (!code) {
      console.error('No code in callback')
      return NextResponse.redirect(
        new URL('/admin/youtube?error=youtube_auth_failed', request.url)
      )
    }

    // Get access token
    let tokens
    try {
      tokens = await getAccessToken(code)
    } catch (error: any) {
      console.error('Error getting access token:', error)
      return NextResponse.redirect(
        new URL('/admin/youtube?error=youtube_auth_failed', request.url)
      )
    }

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens:', { has_access: !!tokens.access_token, has_refresh: !!tokens.refresh_token })
      return NextResponse.redirect(
        new URL('/admin/youtube?error=youtube_auth_failed', request.url)
      )
    }

    // Find admin user (always use admin for owner account)
    const { data: adminUsers, error: findError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('is_admin', true)
      .limit(1)

    if (findError) {
      console.error('Error finding admin user:', findError)
      return NextResponse.redirect(
        new URL('/admin/youtube?error=no_admin_found', request.url)
      )
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.error('No admin user found')
      return NextResponse.redirect(
        new URL('/admin/youtube?error=no_admin_found', request.url)
      )
    }

    const adminUserId = adminUsers[0].id

    // Store in admin profile using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        youtube_access_token: tokens.access_token,
        youtube_refresh_token: tokens.refresh_token,
        youtube_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('id', adminUserId)

    if (updateError) {
      console.error('Error storing YouTube tokens:', updateError)
      return NextResponse.redirect(
        new URL('/admin/youtube?error=youtube_auth_failed', request.url)
      )
    }


    // Redirect to admin YouTube settings
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    return NextResponse.redirect(`${baseUrl}/admin/youtube?youtube_auth=success`)
  } catch (error: any) {
    console.error('Error in YouTube callback:', error)
    return NextResponse.redirect(
      new URL('/admin/youtube?error=youtube_auth_failed', request.url)
    )
  }
}
