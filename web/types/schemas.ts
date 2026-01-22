/**
 * Zod validation schemas for runtime data validation
 * Ensures data from Supabase matches expected types
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'

// ==================== USER SCHEMAS ====================

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.union([z.string().email(), z.null(), z.literal('')]).optional(),
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  is_admin: z.boolean().default(false).optional(),
  is_affiliate: z.boolean().default(false).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
}).passthrough()

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>

// ==================== PLACE SCHEMAS ====================

export const PlaceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subscription_id: z.string().uuid().nullable().optional(),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  category: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().nullable().optional(),
  phone_1: z.string(),
  phone_2: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  total_views: z.number().default(0),
  today_views: z.number().default(0),
  last_view_reset_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough() // Allow extra fields from database

export type ValidatedPlace = z.infer<typeof PlaceSchema>

// More lenient schema for place lists - optional fields for listings
export const PlaceListItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subscription_id: z.string().uuid().nullable().optional(),
  name_ar: z.string().min(1),
  name_en: z.string().default(''),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  category: z.string().default(''),
  latitude: z.number().default(0),
  longitude: z.number().default(0),
  address: z.string().nullable().optional(),
  phone_1: z.string().default(''),
  phone_2: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  total_views: z.number().default(0),
  today_views: z.number().default(0),
  last_view_reset_date: z.string().default(new Date().toISOString()),
  created_at: z.string().default(new Date().toISOString()),
  updated_at: z.string().default(new Date().toISOString()),
}).passthrough()

// ==================== PRODUCT SCHEMAS ====================

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  image_url: z.string(),
  order_index: z.number().int().min(0).default(0),
  created_at: z.string(),
})

export const ProductVideoSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  video_url: z.string(),
  order_index: z.number().int().min(0).default(0),
  created_at: z.string(),
})

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_type: z.string(),
  variant_name_ar: z.string().min(1),
  variant_name_en: z.string(),
  variant_value: z.string(),
  price_adjustment: z.number(),
  stock_quantity: z.number().int().min(0).nullable(),
  is_available: z.boolean().default(true),
  created_at: z.string(),
})

export const ProductSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  name_ar: z.string().min(1),
  name_en: z.string(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().default('IQD'),
  category: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
  images: z.array(ProductImageSchema).default([]).optional(),
  videos: z.array(ProductVideoSchema).default([]).optional(),
  variants: z.array(ProductVariantSchema).default([]).optional(),
}).passthrough()

export type ValidatedProduct = z.infer<typeof ProductSchema>

// ==================== MESSAGE SCHEMAS ====================

export const MessageSchema = z.object({
  id: z.string().uuid(),
  sender_id: z.string().uuid(),
  recipient_id: z.string().uuid().nullable().optional(),
  place_id: z.string().uuid(),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  reply_to: z.string().uuid().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  employee_id: z.string().uuid().nullable().optional(),
  is_read: z.boolean().default(false).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
  // Related objects (optional, might be populated by joins)
  sender: z.any().nullable().optional(),
  place: z.any().nullable().optional(),
  product: z.any().nullable().optional(),
  replied_message: z.any().nullable().optional(),
  employee: z.any().nullable().optional(),
}).passthrough()

export type ValidatedMessage = z.infer<typeof MessageSchema>

// ==================== EMPLOYEE SCHEMAS ====================

export const PlaceEmployeeSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  user: UserProfileSchema.nullable().optional(),
})

export type ValidatedPlaceEmployee = z.infer<typeof PlaceEmployeeSchema>

// ==================== PACKAGE SCHEMAS ====================

export const PackageSchema = z.object({
  id: z.string().uuid(),
  name_ar: z.string().min(1),
  name_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  description_en: z.string().nullable(),
  price: z.number().positive(),
  duration_days: z.number().int().positive().default(30),
  max_places: z.number().int().positive().nullable(),
  max_products_per_place: z.number().int().positive().nullable(),
  max_employees_per_place: z.number().int().positive().nullable(),
  features: z.any().nullable(), // JSON field
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
})

export type ValidatedPackage = z.infer<typeof PackageSchema>

// ==================== VALIDATION HELPERS ====================

/**
 * Safely validates data with Zod schema
 * Returns validated data or null with error logging
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | null {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ [VALIDATION ERROR]${context ? ` ${context}:` : ''}`, {
        errors: (error as any).errors,
        data,
      })
    } else {
      console.error(`❌ [VALIDATION ERROR]${context ? ` ${context}:` : ''}`, error)
    }
    return null
  }
}

/**
 * Validates array of data with Zod schema
 * Filters out invalid items and returns only valid ones
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  context?: string
): T[] {
  const validated: T[] = []
  const errors: Array<{ index: number; error: z.ZodError }> = []

  data.forEach((item, index) => {
    try {
      validated.push(schema.parse(item))
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({ index, error })
      }
    }
  })

  // Validation errors are logged in development mode only
  if (errors.length > 0 && process.env.NODE_ENV === 'development') {
    logger.warn(
      `[VALIDATION WARNING]${context ? ` ${context}:` : ''} ${errors.length}/${data.length} items failed validation`,
      errors.map(e => ({
        index: e.index,
        errors: (e.error as any).errors,
        data: data[e.index],
      }))
    )
  }

  return validated
}

/**
 * Safely validates data with fallback
 * Returns validated data or fallback value
 */
export function validateWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
  context?: string
): T {
  const validated = validateData(schema, data, context)
  return validated ?? fallback
}

// ==================== EXPORTS ====================

export const schemas = {
  user: UserProfileSchema,
  place: PlaceSchema,
  placeListItem: PlaceListItemSchema,
  product: ProductSchema,
  productImage: ProductImageSchema,
  productVideo: ProductVideoSchema,
  productVariant: ProductVariantSchema,
  message: MessageSchema,
  placeEmployee: PlaceEmployeeSchema,
  package: PackageSchema,
} as const
