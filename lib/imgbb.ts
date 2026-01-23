// ImgBB API helper with load balancing
const IMGBB_APIS = [
  process.env.NEXT_PUBLIC_IMGBB_API_1 || process.env.IMGBB_API_1,
  process.env.NEXT_PUBLIC_IMGBB_API_2 || process.env.IMGBB_API_2,
  process.env.NEXT_PUBLIC_IMGBB_API_3 || process.env.IMGBB_API_3,
  process.env.NEXT_PUBLIC_IMGBB_API_4 || process.env.IMGBB_API_4,
  process.env.NEXT_PUBLIC_IMGBB_API_5 || process.env.IMGBB_API_5,
].filter(Boolean) as string[]

let currentApiIndex = 0

export async function uploadImageToImgBB(file: File | Blob): Promise<string> {
  if (IMGBB_APIS.length === 0) {
    throw new Error('لم يتم تكوين مفاتيح ImgBB API. يرجى التحقق من متغيرات البيئة.')
  }

  const formData = new FormData()
  formData.append('image', file)

  let lastError: Error | null = null

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
        const errorMessage = errorData?.error?.message || errorData?.error?.message || response.statusText
        throw new Error(`ImgBB API error: ${errorMessage || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data?.url) {
        return data.data.url
      }
      
      // Handle ImgBB error response
      const errorMessage = data.error?.message || 'فشل رفع الصورة'
      throw new Error(errorMessage)
    } catch (error: any) {
      console.error(`ImgBB API ${currentApiIndex} failed:`, error)
      lastError = error
      
      // If this is the last API, throw the error
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

export async function convertToWebP(file: File): Promise<Blob> {
  // Use browser's native image processing if available
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert to WebP'))
            }
          },
          'image/webp',
          0.85
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
