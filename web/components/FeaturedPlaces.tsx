'use client'

import { useEffect, useRef, useState } from 'react'
import { Place } from '@/lib/types'
import PlaceCard from './PlaceCard'

interface FeaturedPlacesProps {
  places: Place[]
}

export default function FeaturedPlaces({ places }: FeaturedPlacesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!scrollContainerRef.current || isPaused) return

    const container = scrollContainerRef.current
    let scrollPosition = 0
    const scrollSpeed = 0.5 // pixels per frame

    const scroll = () => {
      if (isPaused) return
      scrollPosition += scrollSpeed
      container.scrollLeft = scrollPosition

      // Reset when reaching the end
      if (scrollPosition >= container.scrollWidth - container.clientWidth) {
        scrollPosition = 0
      }
    }

    const interval = setInterval(scroll, 16) // ~60fps

    return () => clearInterval(interval)
  }, [isPaused])

  if (places.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">الأماكن المميزة</h2>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {places.map((place) => (
          <div key={place.id} className="flex-shrink-0 w-80">
            <PlaceCard place={place} cardStyle="premium" />
          </div>
        ))}
      </div>
    </div>
  )
}
