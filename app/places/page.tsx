'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { usePlaces } from '@/hooks/usePlaces'
import PlaceCard from '@/components/PlaceCard'
import { Search, MapPin, Loader2, Filter } from 'lucide-react'
import { HeadlineLarge, HeadlineMedium, BodyMedium, BodySmall, LabelMedium } from '@/components/m3'

export default function PlacesPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const { places, loading } = usePlaces({ autoLoad: true })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter places based on search and category
  const filteredPlaces = places.filter(place => {
    const matchesSearch = (place.name_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.description_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.description_en || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(places.map(p => p.category).filter(Boolean)))]

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={32} style={{ color: colors.primary }} />
            <HeadlineLarge>الأماكن</HeadlineLarge>
          </div>
          <BodyMedium color="onSurfaceVariant">
            اكتشف المحلات والصيدليات والأماكن القريبة منك
          </BodyMedium>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{
              backgroundColor: colors.outline,
              borderColor: colors.outline
            }}
          >
            <Search size={20} style={{ color: colors.onSurface }} />
            <input
              type="text"
              placeholder="ابحث عن مكان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base"
              style={{ color: colors.onSurface }}
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={20} style={{ color: colors.onSurface }} />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedCategory === category 
                    ? colors.surfaceContainer 
                    : colors.outline,
                  color: selectedCategory === category 
                    ? colors.primary 
                    : colors.onSurface
                }}
              >
                {category === 'all' ? 'الكل' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Places Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 
              size={48} 
              className="animate-spin mb-4" 
              style={{ color: colors.primary }} 
            />
            <BodyMedium>جاري التحميل...</BodyMedium>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl"
            style={{ backgroundColor: colors.surface }}
          >
            <MapPin 
              size={64} 
              className="mx-auto mb-4" 
              style={{ color: colors.onSurface, opacity: 0.3 }} 
            />
            <HeadlineMedium className="mb-2">
              {searchQuery || selectedCategory !== 'all' 
                ? 'لا توجد نتائج' 
                : 'لا توجد أماكن بعد'}
            </HeadlineMedium>
            <BodyMedium color="onSurfaceVariant">
              {searchQuery || selectedCategory !== 'all'
                ? 'جرب البحث بكلمات مختلفة أو غيّر الفئة'
                : 'سيتم إضافة الأماكن قريباً'}
            </BodyMedium>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4">
              <BodySmall color="onSurfaceVariant">
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'مكان' : 'أماكن'}
              </BodySmall>
            </div>

            {/* Places Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  onClick={() => router.push(`/places/${place.id}`)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <PlaceCard place={place} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
