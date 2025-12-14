import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToImgBB, convertToWebP } from '@/lib/imgbb'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Convert to WebP (only in browser, server-side will upload as-is)
    let fileToUpload = file
    try {
      const webpBlob = await convertToWebP(file)
      fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
      })
    } catch (error) {
      // If conversion fails, use original file
      console.warn('WebP conversion failed, using original file:', error)
    }

    // Upload to ImgBB
    const imageUrl = await uploadImageToImgBB(fileToUpload)

    return NextResponse.json({ success: true, url: imageUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
