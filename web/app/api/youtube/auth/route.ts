import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/youtube-upload'

export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl()
    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
