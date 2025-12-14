import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      places:places(*)
    `)
    .eq('is_active', true)
    .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%,description_ar.ilike.%${query}%`)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getProductsByPlace(placeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      videos:product_videos(*),
      variants:product_variants(*)
    `)
    .eq('place_id', placeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
