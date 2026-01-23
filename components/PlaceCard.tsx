'use client'

import { Place, PlaceCardProps } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Eye, Video } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { TitleMedium, BodySmall, LabelSmall } from '@/components/m3'

export default function PlaceCard({ place, cardStyle = 'default' }: PlaceCardProps) {
  const { colors } = useTheme()
  const getCardStyle = (): React.CSSProperties => {
    switch (cardStyle) {
      case 'premium':
        return {
          border: '2px solid var(--status-warning)',
          background: 'linear-gradient(to bottom right, var(--status-yellow-bg), rgba(245, 158, 11, 0.1))',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }
      case 'gold':
        return {
          border: '2px solid var(--status-warning)',
          background: 'linear-gradient(to bottom right, var(--status-yellow-bg), rgba(245, 158, 11, 0.1))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }
      case 'silver':
        return {
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(to bottom right, var(--surface-color), var(--bg-color))',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
      default:
        return {
          border: '1px solid var(--border-color)',
          background: 'var(--background)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }
    }
  }

  return (
    <Link href={`/places/${place.id}`}>
      <div
        className="rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer"
        style={getCardStyle()}
      >
        <div className="relative h-40 sm:h-48 w-full app-bg-surface">
          {place.logo_url ? (
            <div className="w-full h-full relative">
              <img
                src={place.logo_url}
                alt={place.name_ar}
                className="w-full h-full object-cover"
              />
              {place.video_url && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div 
                    className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1"
                    style={{
                      backgroundColor: colors.error,
                      color: colors.onPrimary,
                    }}
                  >
                    <Video size={10} className="sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">فيديو</span>
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
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={36} className="sm:w-12 sm:h-12" />
            </div>
          )}
          {place.is_featured && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold" style={{ background: 'var(--status-warning)', color: '#000' }}>
              مميز
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <TitleMedium className="mb-1.5 sm:mb-2 line-clamp-1">{place.name_ar}</TitleMedium>
          <BodySmall color="onSurfaceVariant" className="mb-2 sm:mb-3 line-clamp-2">{place.description_ar}</BodySmall>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Phone size={14} className="sm:w-4 sm:h-4" />
              <LabelSmall color="onSurfaceVariant" className="truncate">{place.phone_1}</LabelSmall>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <LabelSmall color="onSurfaceVariant">{place.today_views} اليوم</LabelSmall>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
