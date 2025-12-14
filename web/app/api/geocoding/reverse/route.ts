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

    // Call Nominatim API from server-side (no CORS issues)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
      {
        headers: {
          'User-Agent': 'BusinessDirectory/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch location info')
    }

    const data = await response.json()

    if (!data || !data.address) {
      return NextResponse.json({ address: null })
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
    console.error('Error getting location info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get location info' },
      { status: 500 }
    )
  }
}
