'use client'

import { useEffect, useState } from 'react'
import { Place, Product } from '@/lib/types'
import { getPlaces } from '@/lib/api/places'
import { searchProducts } from '@/lib/api/products'
import { getSiteStats, recordSiteVisit } from '@/lib/api/visits'
import { supabase } from '@/lib/supabase'
import PlaceCard from '@/components/PlaceCard'
import FeaturedPlaces from '@/components/FeaturedPlaces'
import { Search, Eye, TrendingUp, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [places, setPlaces] = useState<Place[]>([])
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [siteStats, setSiteStats] = useState({ today: 0, total: 0 })
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
    checkUser()
    recordSiteVisit().catch(err => {
      console.error('Error recording visit:', err)
    })
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        return
      }
      
      setUser(user)
      
      if (user) {
        // Check if profile exists, if not create it
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          // Profile doesn't exist, create it
          if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                is_admin: false,
                is_affiliate: false,
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('Error creating profile:', insertError)
            } else {
              setUserProfile(newProfile)
            }
          } else {
            console.error('Error loading profile:', profileError)
          }
        } else {
          setUserProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error in checkUser:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    router.refresh()
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">دليل المحلات والصيدليات</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye size={16} />
                <span>اليوم: {siteStats.today}</span>
                <span className="mx-2">|</span>
                <TrendingUp size={16} />
                <span>الإجمالي: {siteStats.total}</span>
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {userProfile?.full_name || user.email}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <User size={16} />
                    لوحة التحكم
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن منتج أو خدمة..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-4 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-gray-500">جاري البحث...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/places/${product.place_id}?product=${product.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name_ar}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product.name_ar}</h3>
                          {product.price && (
                            <p className="text-sm text-gray-600">
                              {product.price} {product.currency}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">لا توجد نتائج</div>
              )}
            </div>
          )}
        </div>

        {/* Featured Places */}
        {featuredPlaces.length > 0 && <FeaturedPlaces places={featuredPlaces} />}

        {/* All Places */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">جميع الأماكن</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} cardStyle={place.is_featured ? 'premium' : 'default'} />
            ))}
          </div>
          {sortedPlaces.length === 0 && (
            <div className="text-center py-12 text-gray-500">لا توجد أماكن متاحة حالياً</div>
          )}
        </div>
      </main>
    </div>
  )
}
