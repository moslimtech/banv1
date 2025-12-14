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
  const { supabase } = await import('@/lib/supabase')
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('youtube_access_token, youtube_refresh_token, youtube_token_expiry')
    .eq('is_admin', true)
    .not('youtube_access_token', 'is', null)
    .limit(1)
    .single()

  if (adminProfile?.youtube_access_token && adminProfile?.youtube_refresh_token) {
    return {
      access_token: adminProfile.youtube_access_token,
      refresh_token: adminProfile.youtube_refresh_token,
      expiry_date: adminProfile.youtube_token_expiry ? new Date(adminProfile.youtube_token_expiry).getTime() : null,
    }
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
  // Get owner's credentials
  let credentials = await getOwnerCredentials()
  let accessToken = credentials.access_token

  // Check if token is expired and refresh if needed
  if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
    if (!credentials.refresh_token) {
      throw new Error('YouTube token expired and no refresh token available. Please re-authenticate.')
    }

    credentials = await refreshOwnerToken(credentials.refresh_token)
    accessToken = credentials.access_token as string
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
      body: videoFile,
    },
  })

  if (response.data.id) {
    return `https://www.youtube.com/watch?v=${response.data.id}`
  }

  throw new Error('Failed to upload video to YouTube')
}

export async function refreshAccessToken(refreshToken: string) {
  return refreshOwnerToken(refreshToken)
}
