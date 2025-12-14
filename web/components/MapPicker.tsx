'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getLocationInfo, LocationInfo } from '@/lib/geocoding'
import { MapPin, Loader2, Navigation } from 'lucide-react'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface MapPickerProps {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number, address?: string) => void
}

// Component to handle map clicks - must be inside MapContainer
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const { useMapEvents } = require('react-leaflet')
  
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onLocationChange(lat, lng)
    },
  })
  
  return null
}

// Component to get map reference
function MapController({ setMapRef }: { setMapRef: (map: any) => void }) {
  const { useMap } = require('react-leaflet')
  const map = useMap()
  
  useEffect(() => {
    setMapRef(map)
  }, [map, setMapRef])
  
  return null
}

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([latitude, longitude])
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [mapRef, setMapRef] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Get location info for default position
    getLocationInfo(latitude, longitude).then((info) => {
      if (info) {
        setLocationInfo(info)
      }
    })
  }, [])

  useEffect(() => {
    setMarkerPosition([latitude, longitude])
    // Get location info when position changes
    getLocationInfo(latitude, longitude).then((info) => {
      if (info) {
        setLocationInfo(info)
      }
    })
  }, [latitude, longitude])

  // Function to get current location
  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع')
      return
    }

    setLoadingLocation(true)
    
    // Try with high accuracy first, then fallback to lower accuracy
    const tryGetLocation = (options: PositionOptions, attempt: number = 1) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setMarkerPosition([lat, lng])
          
          // Center map on new location
          if (mapRef) {
            mapRef.setView([lat, lng], 15)
          }
          
          // Get location info and update parent
          getLocationInfo(lat, lng).then((info) => {
            setLocationInfo(info)
            setLoadingLocation(false)
            if (info) {
              onLocationChange(lat, lng, info.fullAddress)
            } else {
              onLocationChange(lat, lng)
            }
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          
          // If timeout and we haven't tried with lower accuracy, try again
          if (error.code === error.TIMEOUT && attempt === 1 && options.enableHighAccuracy) {
            // Retry with lower accuracy and longer timeout
            tryGetLocation({
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000, // Accept cached position up to 1 minute old
            }, 2)
            return
          }
          
          setLoadingLocation(false)
          let errorMessage = 'فشل في تحديد الموقع'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض الإذن للوصول للموقع. يرجى السماح بالوصول للموقع في إعدادات المتصفح.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'معلومات الموقع غير متاحة. تأكد من تفعيل GPS أو WiFi.'
              break
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى أو تحديد الموقع يدوياً على الخريطة.'
              break
          }
          alert(errorMessage)
        },
        options
      )
    }
    
    // Start with high accuracy
    tryGetLocation({
      enableHighAccuracy: true,
      timeout: 15000, // Increased to 15 seconds
      maximumAge: 0,
    })
  }

  const handleMarkerDrag = async (e: any) => {
    const marker = e.target
    const position = marker.getLatLng()
    const lat = position.lat
    const lng = position.lng
    setMarkerPosition([lat, lng])
    
    // Get location info
    setLoadingLocation(true)
    const info = await getLocationInfo(lat, lng)
    setLocationInfo(info)
    setLoadingLocation(false)
    
    onLocationChange(lat, lng, info?.fullAddress)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng])
    
    // Get location info
    setLoadingLocation(true)
    const info = await getLocationInfo(lat, lng)
    setLocationInfo(info)
    setLoadingLocation(false)
    
    onLocationChange(lat, lng, info?.fullAddress)
  }

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {loadingLocation && (
        <div className="absolute top-2 left-2 z-[1000] bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">جاري تحديد موقعك...</span>
        </div>
      )}

      {/* Button to get current location */}
      <button
        onClick={handleGetCurrentLocation}
        disabled={loadingLocation}
        className="absolute bottom-4 left-4 z-[1000] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
        title="تحديد موقعي"
      >
        {loadingLocation ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Navigation size={20} />
        )}
      </button>

      <MapContainer
        center={[markerPosition[0], markerPosition[1]]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        scrollWheelZoom={true}
        key={`${markerPosition[0]}-${markerPosition[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={markerPosition}
          draggable
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        >
          <Popup className="min-w-[250px]">
            <div className="text-right">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                <div className="flex-1">
                  <p className="font-semibold text-lg mb-1">الموقع المحدد</p>
                  {locationInfo ? (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-800 font-medium">{locationInfo.fullAddress}</p>
                      {locationInfo.district && (
                        <p className="text-xs text-gray-600">المنطقة: {locationInfo.district}</p>
                      )}
                      {locationInfo.city && (
                        <p className="text-xs text-gray-600">المدينة: {locationInfo.city}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">جاري جلب معلومات الموقع...</p>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  الإحداثيات: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                </p>
                <p className="text-xs text-gray-400 mt-1">اسحب العلامة أو انقر على الخريطة لتغيير الموقع</p>
              </div>
            </div>
          </Popup>
        </Marker>
        <MapClickHandler onLocationChange={handleMapClick} />
        <MapController setMapRef={setMapRef} />
      </MapContainer>
    </div>
  )
}
