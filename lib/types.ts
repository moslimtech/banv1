export interface Package {
  id: string
  name_ar: string
  name_en: string
  price: number
  max_places: number
  max_product_videos: number
  max_product_images: number
  max_place_videos: number
  priority: number
  card_style?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  is_affiliate: boolean
  is_admin: boolean
  affiliate_code: string | null
  created_at: string
  updated_at: string
}

export interface Place {
  id: string
  user_id: string
  subscription_id: string | null
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  category: string
  latitude: number
  longitude: number
  address: string | null
  phone_1: string
  phone_2: string | null
  video_url: string | null
  logo_url: string | null
  is_featured: boolean
  is_active: boolean
  total_views: number
  today_views: number
  last_view_reset_date: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  place_id: string
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  price: number | null
  currency: string
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  images?: ProductImage[]
  videos?: ProductVideo[]
  variants?: ProductVariant[]
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  order_index: number
  created_at: string
}

export interface ProductVideo {
  id: string
  product_id: string
  video_url: string
  order_index: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_type: string
  variant_name_ar: string
  variant_name_en: string
  variant_value: string
  price_adjustment: number
  stock_quantity: number | null
  is_available: boolean
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  place_id: string
  recipient_id: string | null
  content: string | null
  image_url: string | null
  audio_url: string | null
  product_id: string | null
  is_read: boolean
  reply_to: string | null
  employee_id: string | null
  created_at: string
  sender?: UserProfile
  replied_message?: Message
  product?: Product
}

export interface Affiliate {
  id: string
  user_id: string
  code: string
  discount_percentage: number
  total_earnings: number
  paid_earnings: number
  pending_earnings: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DiscountCode {
  id: string
  code: string
  discount_percentage: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses: number | null
  used_count: number
  created_by: string | null
  description_ar: string | null
  description_en: string | null
  created_at: string
  updated_at: string
}

// ============================================
// NEW DATABASE TYPES (from database.ts)
// ============================================

// Re-export all new database types
export * from './types/database'

export interface EmployeeRequest {
  id: string
  user_id: string
  place_id: string
  phone: string
  status: 'pending' | 'accepted' | 'rejected'
  permissions: 'basic' | 'messages_posts' | 'full'
  created_at: string
  updated_at: string
  user?: UserProfile
  place?: Place
}

export interface PlaceEmployee {
  id: string
  user_id: string
  place_id: string
  permissions: 'basic' | 'messages_posts' | 'full'
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  user?: UserProfile
  place?: Place
}

export interface Post {
  id: string
  place_id: string
  created_by: string
  content: string
  image_url: string | null
  video_url: string | null
  post_type: 'text' | 'image' | 'video'
  is_active: boolean
  created_at: string
  updated_at: string
  place?: Place
  creator?: UserProfile
}
