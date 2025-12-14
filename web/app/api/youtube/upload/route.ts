import { NextRequest, NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/youtube-upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''
    const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || []
    const privacyStatus = (formData.get('privacyStatus') as string) || 'unlisted'

    if (!videoFile || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to YouTube using owner's account
    const videoUrl = await uploadVideo(
      buffer,
      title,
      description,
      tags,
      privacyStatus as 'private' | 'unlisted' | 'public'
    )

    return NextResponse.json({
      success: true,
      videoUrl,
    })
  } catch (error: any) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload video to YouTube',
      },
      { status: 500 }
    )
  }
}
