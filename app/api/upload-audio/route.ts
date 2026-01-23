import { NextRequest, NextResponse } from 'next/server'
import { uploadAudioToCatbox } from '@/lib/catbox'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
    }

    // Upload to Catbox
    const audioUrl = await uploadAudioToCatbox(audioFile)

    return NextResponse.json({ success: true, url: audioUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
