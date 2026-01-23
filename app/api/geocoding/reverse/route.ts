import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Retry logic for Nominatim API (sometimes fails due to rate limiting or network issues)
    let lastError: Error | null = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call Nominatim API from server-side (no CORS issues)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
          {
            headers: {
              'User-Agent': 'BusinessDirectory/1.0',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        )

        if (!response.ok) {
          // If rate limited (429) or server error (5xx), wait and retry
          if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
              continue
            }
          }
          throw new Error(`Nominatim API returned status ${response.status}`)
        }

        const data = await response.json()

        if (!data || !data.address) {
          // Return empty address instead of error
          return NextResponse.json({ 
            address: null,
            city: null,
            country: null,
            district: null,
            fullAddress: null
          })
        }

        const address = data.address
        const parts: string[] = []

        // Build address parts
        if (address.road) parts.push(address.road)
        if (address.house_number) parts.push(address.house_number)
        if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood)
        if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village)
        if (address.state) parts.push(address.state)
        if (address.country) parts.push(address.country)

        const fullAddress = parts.join('، ') || data.display_name || 'عنوان غير متاح'

        return NextResponse.json({
          address: address.road || address.house_number || '',
          city: address.city || address.town || address.village || '',
          country: address.country || '',
          district: address.suburb || address.neighbourhood || '',
          fullAddress,
        })
      } catch (error: any) {
        lastError = error
        console.error(`Geocoding attempt ${attempt} failed:`, error.message)
        
        // If it's a timeout or network error and we have retries left, try again
        if (attempt < maxRetries && (error.name === 'AbortError' || error.message.includes('fetch failed'))) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
          continue
        }
        
        // If it's the last attempt or a non-retryable error, break
        break
      }
    }

    // If all retries failed, return a graceful error response
    console.error('All geocoding attempts failed:', lastError)
    return NextResponse.json(
      { 
        error: 'فشل في جلب معلومات الموقع. يرجى المحاولة مرة أخرى.',
        address: null,
        city: null,
        country: null,
        district: null,
        fullAddress: null
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Unexpected error in geocoding route:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get location info',
        address: null,
        city: null,
        country: null,
        district: null,
        fullAddress: null
      },
      { status: 500 }
    )
  }
}
