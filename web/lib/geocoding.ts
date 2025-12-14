// Reverse geocoding using Nominatim (OpenStreetMap) via API route
export interface LocationInfo {
  address: string
  city?: string
  country?: string
  district?: string
  fullAddress: string
}

export async function getLocationInfo(lat: number, lng: number): Promise<LocationInfo | null> {
  try {
    // Use our API route instead of direct Nominatim call to avoid CORS issues
    const response = await fetch(
      `/api/geocoding/reverse?lat=${lat}&lng=${lng}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch location info')
    }

    const data = await response.json()

    if (data.error || !data.fullAddress) {
      return null
    }

    return {
      address: data.address || '',
      city: data.city || '',
      country: data.country || '',
      district: data.district || '',
      fullAddress: data.fullAddress,
    }
  } catch (error) {
    console.error('Error getting location info:', error)
    return null
  }
}
