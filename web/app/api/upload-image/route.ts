import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

// Optimize and compress image before upload
async function optimizeImage(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Get image metadata
  const metadata = await sharp(buffer).metadata()
  const maxWidth = 1920 // Max width for web images
  const maxHeight = 1920 // Max height for web images
  const quality = 85 // WebP quality (0-100)

  // Resize if needed and convert to WebP
  let image = sharp(buffer)

  // Resize if image is larger than max dimensions
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  // Convert to WebP with compression
  const optimizedBuffer = await image
    .webp({ quality, effort: 4 }) // effort: 0-6 (higher = better compression but slower)
    .toBuffer()

  // Create Blob from optimized buffer
  return new Blob([optimizedBuffer], { type: 'image/webp' })
}

// Server-side ImgBB upload function (can use NEXT_PUBLIC_IMGBB_API_* or IMGBB_API_*)
async function uploadImageToImgBB(file: File | Blob): Promise<string> {
  const IMGBB_APIS = [
    process.env.IMGBB_API_1 || process.env.NEXT_PUBLIC_IMGBB_API_1,
    process.env.IMGBB_API_2 || process.env.NEXT_PUBLIC_IMGBB_API_2,
    process.env.IMGBB_API_3 || process.env.NEXT_PUBLIC_IMGBB_API_3,
    process.env.IMGBB_API_4 || process.env.NEXT_PUBLIC_IMGBB_API_4,
    process.env.IMGBB_API_5 || process.env.NEXT_PUBLIC_IMGBB_API_5,
  ].filter(Boolean) as string[]

  if (IMGBB_APIS.length === 0) {
    throw new Error('لم يتم تكوين مفاتيح ImgBB API. يرجى التحقق من متغيرات البيئة.')
  }

  const formData = new FormData()
  formData.append('image', file)

  let lastError: Error | null = null
  let currentApiIndex = 0

  // Try each API in round-robin fashion
  for (let i = 0; i < IMGBB_APIS.length; i++) {
    const apiKey = IMGBB_APIS[currentApiIndex]
    currentApiIndex = (currentApiIndex + 1) % IMGBB_APIS.length

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.error?.message || response.statusText
        throw new Error(`ImgBB API error: ${errorMessage || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data?.url) {
        return data.data.url
      }
      
      const errorMessage = data.error?.message || 'فشل رفع الصورة'
      throw new Error(errorMessage)
    } catch (error: any) {
      console.error(`ImgBB API ${currentApiIndex} failed:`, error)
      lastError = error
      
      if (i === IMGBB_APIS.length - 1) {
        if (error.message) {
          throw error
        }
        throw new Error('فشل رفع الصورة إلى ImgBB. يرجى التحقق من مفاتيح API أو المحاولة مرة أخرى.')
      }
    }
  }

  throw lastError || new Error('فشل رفع الصورة إلى ImgBB')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم توفير ملف' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'الرجاء اختيار ملف صورة صحيح' }, { status: 400 })
    }

    // Check file size (max 32MB for ImgBB free tier)
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'حجم الصورة كبير جداً. الحد الأقصى هو 32MB' }, { status: 400 })
    }

    // Optimize image: compress and convert to WebP
    let optimizedFile: File | Blob = file
    try {
      const optimizedBlob = await optimizeImage(file)
      optimizedFile = new File([optimizedBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
        lastModified: Date.now(),
      })
      
      console.log(`📸 Image optimized: ${(file.size / 1024).toFixed(2)}KB → ${(optimizedFile.size / 1024).toFixed(2)}KB (${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}% reduction)`)
    } catch (optimizeError: any) {
      console.error('⚠️ Image optimization failed, uploading original:', optimizeError)
      // If optimization fails, use original file
      optimizedFile = file
    }

    // Upload to ImgBB (server-side, can use IMGBB_API_* or NEXT_PUBLIC_IMGBB_API_*)
    const imageUrl = await uploadImageToImgBB(optimizedFile)

    return NextResponse.json({ success: true, url: imageUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    const errorMessage = error.message || 'فشل رفع الصورة'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
