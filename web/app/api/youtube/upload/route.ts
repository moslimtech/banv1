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

    // Check file size (max 2GB for YouTube)
    if (videoFile.size > 2 * 1024 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم الفيديو كبير جداً. الحد الأقصى هو 2GB' },
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
    
    // Provide more specific error messages
    let errorMessage = 'فشل رفع الفيديو إلى YouTube'
    
    if (error.message) {
      if (error.message.includes('credentials') || error.message.includes('not configured')) {
        errorMessage = 'لم يتم ربط حساب YouTube. يرجى ربط حساب YouTube من لوحة الإدارة أولاً.'
      } else if (error.message.includes('expired') || error.message.includes('re-authenticate')) {
        errorMessage = 'انتهت صلاحية حساب YouTube. يرجى إعادة ربط حساب YouTube من لوحة الإدارة.'
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'تم تجاوز الحد المسموح من YouTube API. يرجى المحاولة لاحقاً.'
      } else if (error.message.includes('size') || error.message.includes('too large')) {
        errorMessage = 'حجم الفيديو كبير جداً. الحد الأقصى هو 2GB'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
