import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Place } from '@/lib/types'
import { getPlaces, getPlaceById } from '@/lib/api/places'
import { validateArray, PlaceListItemSchema } from '@/types/schemas'

interface UsePlacesOptions {
  featured?: boolean
  userId?: string
  autoLoad?: boolean
}

interface UsePlacesReturn {
  places: Place[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching places
 */
export function usePlaces(options: UsePlacesOptions = {}): UsePlacesReturn {
  const { featured, userId, autoLoad = true } = options
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const loadPlaces = useCallback(async () => {
    // If filtering by userId and userId is not provided yet, skip loading
    if (options.userId !== undefined && !userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (userId) {
        // Load user's places
        const { data, error: fetchError } = await supabase
          .from('places')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setPlaces(data || [])
      } else {
        // Load all places using API function
        const data = await getPlaces(featured)
        
        // ✅ Validate data with Zod
        const validatedPlaces = validateArray(PlaceListItemSchema, data, 'usePlaces')
        setPlaces(validatedPlaces as Place[])
      }
    } catch (err: any) {
      console.error('Error loading places:', err)
      setError(err.message || 'فشل في تحميل الأماكن')
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }, [featured, userId, options.userId])

  useEffect(() => {
    if (autoLoad) {
      loadPlaces()
    }
  }, [autoLoad, loadPlaces])

  return {
    places,
    loading,
    error,
    refresh: loadPlaces,
  }
}

interface UsePlaceReturn {
  place: Place | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching a single place
 */
export function usePlace(placeId: string | null): UsePlaceReturn {
  const [place, setPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setPlace(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getPlaceById(placeId)
      
      // ✅ Validate data with Zod
      if (data) {
        const validated = validateArray(PlaceListItemSchema, [data], 'usePlace')[0]
        setPlace(validated as Place || null)
      } else {
        setPlace(null)
      }
    } catch (err: any) {
      console.error('Error loading place:', err)
      setError(err.message || 'فشل في تحميل المكان')
      setPlace(null)
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => {
    loadPlace()
  }, [loadPlace])

  return {
    place,
    loading,
    error,
    refresh: loadPlace,
  }
}
