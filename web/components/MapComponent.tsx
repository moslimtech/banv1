'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getLocationInfo } from '@/lib/geocoding'
import { MapPin } from 'lucide-react'

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
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-shadow.png',
  })
}

interface MapComponentProps {
  latitude: number
  longitude: number
  placeName: string
}

export default function MapComponent({ latitude, longitude, placeName }: MapComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [locationInfo, setLocationInfo] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Get location info
    getLocationInfo(latitude, longitude).then((info) => {
      if (info) {
        setLocationInfo(info)
      }
    })
  }, [latitude, longitude])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-lg app-bg-surface">
        <p className="app-text-muted">جاري تحميل الخريطة...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup className="min-w-[250px]">
            <div className="text-right">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="mt-1 flex-shrink-0" size={18} style={{ color: 'var(--primary-color)' }} />
                <div className="flex-1">
                  <p className="font-semibold text-lg mb-1 app-text-main">{placeName}</p>
                  {locationInfo ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium app-text-main">{locationInfo.fullAddress}</p>
                      {locationInfo.district && (
                        <p className="text-xs app-text-muted">المنطقة: {locationInfo.district}</p>
                      )}
                      {locationInfo.city && (
                        <p className="text-xs app-text-muted">المدينة: {locationInfo.city}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm app-text-muted">جاري جلب معلومات الموقع...</p>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t app-border">
                <p className="text-xs app-text-muted">
                  الإحداثيات: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
