import { NextRequest, NextResponse } from 'next/server'

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

    // Upload to ImgBB (server-side, can use IMGBB_API_* or NEXT_PUBLIC_IMGBB_API_*)
    const imageUrl = await uploadImageToImgBB(file)

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
