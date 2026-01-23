// YouTube API helper for video uploads
// Uses owner's YouTube account credentials
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8081'}/api/youtube/callback`
)

export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })
}

export async function getAccessToken(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens
}

// Get owner's YouTube credentials from environment or database
async function getOwnerCredentials() {
  // First try environment variables (for owner's credentials)
  if (process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN) {
    return {
      access_token: process.env.YOUTUBE_ACCESS_TOKEN,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      expiry_date: process.env.YOUTUBE_TOKEN_EXPIRY ? new Date(process.env.YOUTUBE_TOKEN_EXPIRY).getTime() : null,
    }
  }

  // If not in env, try to get from database (admin user)
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: adminProfile, error: dbError } = await supabase
      .from('user_profiles')
      .select('youtube_access_token, youtube_refresh_token, youtube_token_expiry')
      .eq('is_admin', true)
      .not('youtube_access_token', 'is', null)
      .limit(1)
      .maybeSingle()

    if (dbError) {
      console.error('Error fetching YouTube credentials from database:', dbError)
      throw new Error('فشل في الوصول إلى بيانات YouTube. يرجى التحقق من إعدادات قاعدة البيانات.')
    }

    if (adminProfile?.youtube_access_token && adminProfile?.youtube_refresh_token) {
      return {
        access_token: adminProfile.youtube_access_token,
        refresh_token: adminProfile.youtube_refresh_token,
        expiry_date: adminProfile.youtube_token_expiry ? new Date(adminProfile.youtube_token_expiry).getTime() : null,
      }
    }
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error.message && error.message.includes('فشل في الوصول')) {
      throw error
    }
    console.error('Error in getOwnerCredentials:', error)
  }

  throw new Error('YouTube credentials not configured. Please set up owner YouTube account.')
}

async function refreshOwnerToken(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  
  // Update in environment or database
  if (process.env.YOUTUBE_ACCESS_TOKEN) {
    // If using env vars, update them (note: this won't persist, need to update .env manually)
    process.env.YOUTUBE_ACCESS_TOKEN = credentials.access_token as string
    if (credentials.expiry_date) {
      process.env.YOUTUBE_TOKEN_EXPIRY = new Date(credentials.expiry_date).toISOString()
    }
  } else {
    // Update in database
    const { supabase } = await import('@/lib/supabase')
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('is_admin', true)
      .not('youtube_refresh_token', 'is', null)
      .limit(1)
      .single()

    if (adminProfile) {
      await supabase
        .from('user_profiles')
        .update({
          youtube_access_token: credentials.access_token,
          youtube_token_expiry: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : null,
        })
        .eq('id', adminProfile.id)
    }
  }

  return credentials
}

export async function uploadVideo(
  videoFile: Buffer,
  title: string,
  description: string = '',
  tags: string[] = [],
  privacyStatus: 'private' | 'unlisted' | 'public' = 'unlisted'
): Promise<string> {
  try {
    // Get owner's credentials
    let credentials = await getOwnerCredentials()
    let accessToken = credentials.access_token

    // Check if token is expired and refresh if needed
    if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
      if (!credentials.refresh_token) {
        throw new Error('YouTube token expired and no refresh token available. Please re-authenticate.')
      }

      try {
        const refreshedCredentials = await refreshOwnerToken(credentials.refresh_token)
        credentials = {
          access_token: refreshedCredentials.access_token as string,
          refresh_token: refreshedCredentials.refresh_token as string,
          expiry_date: refreshedCredentials.expiry_date ? new Date(refreshedCredentials.expiry_date).getTime() : null,
        }
        accessToken = credentials.access_token
      } catch (refreshError: any) {
        console.error('Error refreshing YouTube token:', refreshError)
        throw new Error('فشل في تجديد صلاحية حساب YouTube. يرجى إعادة ربط حساب YouTube من لوحة الإدارة.')
      }
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: credentials.refresh_token,
    })

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    })

    // Convert Buffer to Stream for YouTube API
    const { Readable } = await import('stream')
    const videoStream = new Readable()
    videoStream.push(videoFile)
    videoStream.push(null) // End the stream

    // Upload video
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
        },
        status: {
          privacyStatus,
        },
      },
      media: {
        body: videoStream,
      },
    })

    if (response.data.id) {
      return `https://www.youtube.com/watch?v=${response.data.id}`
    }

    throw new Error('فشل رفع الفيديو إلى YouTube. لم يتم إرجاع معرف الفيديو.')
  } catch (error: any) {
    // Re-throw custom errors as-is
    if (error.message && (
      error.message.includes('credentials') ||
      error.message.includes('not configured') ||
      error.message.includes('re-authenticate') ||
      error.message.includes('فشل') ||
      error.message.includes('يرجى')
    )) {
      throw error
    }
    
    // Handle Google API errors
    if (error.response?.data?.error) {
      const apiError = error.response.data.error
      if (apiError.code === 403) {
        throw new Error('تم رفض الوصول إلى YouTube API. تأكد من تفعيل YouTube Data API v3 في Google Cloud Console.')
      } else if (apiError.code === 401) {
        throw new Error('انتهت صلاحية حساب YouTube. يرجى إعادة ربط حساب YouTube من لوحة الإدارة.')
      } else if (apiError.code === 429) {
        throw new Error('تم تجاوز الحد المسموح من YouTube API. يرجى المحاولة لاحقاً.')
      }
      throw new Error(apiError.message || 'حدث خطأ في YouTube API')
    }
    
    // Generic error
    console.error('YouTube upload error:', error)
    throw new Error(error.message || 'فشل رفع الفيديو إلى YouTube')
  }
}

export async function refreshAccessToken(refreshToken: string) {
  return refreshOwnerToken(refreshToken)
}
