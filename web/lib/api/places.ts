import { supabase } from '@/lib/supabase'
import { Place } from '@/lib/types'

export async function getPlaces(featured?: boolean): Promise<Place[]> {
  let query = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('total_views', { ascending: false })

  if (featured !== undefined) {
    query = query.eq('is_featured', featured)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function incrementPlaceView(placeId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_place_view', {
    place_uuid: placeId,
  })

  if (error) {
    console.error('Error incrementing view:', error)
  }
}

export async function recordPlaceVisit(placeId: string, visitorIp?: string): Promise<void> {
  const { error } = await supabase.from('place_visits').insert({
    place_id: placeId,
    visitor_ip: visitorIp,
  })

  if (error) {
    console.error('Error recording visit:', error)
  }
}
