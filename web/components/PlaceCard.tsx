'use client'

import { Place } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Eye } from 'lucide-react'

interface PlaceCardProps {
  place: Place
  cardStyle?: string
}

export default function PlaceCard({ place, cardStyle = 'default' }: PlaceCardProps) {
  const getCardClassName = () => {
    switch (cardStyle) {
      case 'premium':
        return 'border-2 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50'
      case 'gold':
        return 'border-2 border-amber-500 shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50'
      case 'silver':
        return 'border border-gray-300 shadow-md bg-gradient-to-br from-gray-50 to-slate-50'
      default:
        return 'border border-gray-200 shadow-sm bg-white'
    }
  }

  return (
    <Link href={`/places/${place.id}`}>
      <div
        className={`rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${getCardClassName()}`}
      >
        <div className="relative h-48 w-full bg-gray-200">
          {place.logo_url ? (
            <div className="w-full h-full relative">
              <img
                src={place.logo_url}
                alt={place.name_ar}
                className="w-full h-full object-cover"
              />
              {place.video_url && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <Video size={12} />
                    فيديو
                  </div>
                </div>
              )}
            </div>
          ) : place.video_url ? (
            <iframe
              src={place.video_url.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin size={48} />
            </div>
          )}
          {place.is_featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
              مميز
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{place.name_ar}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.description_ar}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Phone size={16} />
              <span>{place.phone_1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{place.today_views} اليوم</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
