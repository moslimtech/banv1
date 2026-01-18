'use client'

import { useEffect, useState } from 'react'
import { Place, Product } from '@/lib/types'
import { getPlaces } from '@/lib/api/places'
import { searchProducts } from '@/lib/api/products'
import { getSiteStats, recordSiteVisit } from '@/lib/api/visits'
import PlaceCard from '@/components/PlaceCard'
import FeaturedPlaces from '@/components/FeaturedPlaces'
import { Search, Eye, TrendingUp } from 'lucide-react'
import Link from 'next/link'
export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [siteStats, setSiteStats] = useState({ today: 0, total: 0 })
  useEffect(() => {
    loadData()
    recordSiteVisit().catch(err => {
      console.error('Error recording visit:', err)
    })
  }, [])

  const loadData = async () => {
    try {
      const [allPlaces, featured, stats] = await Promise.all([
        getPlaces().catch(err => {
          console.error('Error loading places:', err)
          return []
        }),
        getPlaces(true).catch(err => {
          console.error('Error loading featured places:', err)
          return []
        }),
        getSiteStats().catch(err => {
          console.error('Error loading stats:', err)
          return { today: 0, total: 0 }
        }),
      ])
      setPlaces(allPlaces)
      setFeaturedPlaces(featured)
      setSiteStats(stats)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchProducts(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Sort places by priority (from subscription package)
  const sortedPlaces = [...places].sort((a, b) => {
    // Featured places first
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    // Then by views
    return b.total_views - a.total_views
  })

  return (
    <div className="min-h-screen app-bg-base">
      {/* Stats Bar */}
      <div className="app-card border-b py-2 app-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm app-text-muted">
            <div className="flex items-center gap-1.5">
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span>اليوم: <strong className="app-text-main">{siteStats.today}</strong></span>
            </div>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              <span>الإجمالي: <strong className="app-text-main">{siteStats.total}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="ابحث عن منتج أو خدمة..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="app-input w-full pr-12 pl-4 py-3 rounded-lg focus:outline-none"
              style={{ borderColor: 'var(--border-color)' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-3 sm:mt-4 app-card rounded-lg shadow-lg p-3 sm:p-4 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-sm sm:text-base app-text-muted">جاري البحث...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/places/${product.place_id}?product=${product.id}`}
                      className="block p-2 sm:p-3 rounded-lg transition-colors app-hover-bg"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name_ar}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base app-text-main truncate">{product.name_ar}</h3>
                          {product.price && (
                            <p className="text-xs sm:text-sm app-text-muted">
                              {product.price} {product.currency}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm sm:text-base app-text-muted">لا توجد نتائج</div>
              )}
            </div>
          )}
        </div>

        {/* Featured Places */}
        {featuredPlaces.length > 0 && <FeaturedPlaces places={featuredPlaces} />}

        {/* All Places */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 app-text-main">جميع الأماكن</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sortedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} cardStyle={place.is_featured ? 'premium' : 'default'} />
            ))}
          </div>
          {sortedPlaces.length === 0 && (
            <div className="text-center py-12 app-text-muted">لا توجد أماكن متاحة حالياً</div>
          )}
        </div>
      </main>
    </div>
  )
}
