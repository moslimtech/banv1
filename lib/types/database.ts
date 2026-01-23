/**
 * Complete Database Schema Types
 * Generated from: complete_schema_migration.sql
 * Date: 2026-01-21
 * 
 * These types match the Supabase database schema exactly.
 * Update this file whenever the database schema changes.
 */

// ============================================
// NEW TABLES
// ============================================

/**
 * Affiliate Transactions
 * Track affiliate earnings, withdrawals, and adjustments
 */
export interface AffiliateTransaction {
  id: string
  affiliate_id: string
  transaction_type: 'earning' | 'withdrawal' | 'adjustment' | 'bonus'
  amount: number
  description_ar?: string
  description_en?: string
  reference_type?: string // 'subscription', 'referral', etc.
  reference_id?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
}

/**
 * User Notifications
 * System notifications for messages, subscriptions, etc.
 */
export interface Notification {
  id: string
  user_id: string
  title_ar: string
  title_en?: string
  message_ar: string
  message_en?: string
  type: 'message' | 'subscription' | 'employee_request' | 'post' | 
        'product' | 'system' | 'promotion' | 'payment'
  is_read: boolean
  link?: string
  icon?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
  created_at: string
  read_at?: string
}

/**
 * Package Features
 * Detailed features included in each package
 */
export interface PackageFeature {
  id: string
  package_id: string
  feature_key: string // 'featured_listings', 'youtube_upload', etc.
  feature_name_ar: string
  feature_name_en?: string
  feature_value?: string // '5 listings', 'Unlimited', etc.
  is_included: boolean
  icon?: string
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Place Views (Analytics)
 * Track place page views for analytics
 */
export interface PlaceView {
  id: string
  place_id: string
  user_id?: string // Nullable for guest views
  ip_address?: string
  user_agent?: string
  referrer?: string
  viewed_at: string
}

/**
 * Product Categories
 * Categories for organizing products
 */
export interface ProductCategory {
  id: string
  name_ar: string
  name_en?: string
  description_ar?: string
  description_en?: string
  icon?: string
  color?: string // Hex color for UI
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================
// UPDATED EXISTING TYPES
// ============================================

/**
 * Place (Updated with new columns)
 */
export interface PlaceExtended {
  // ... existing columns ...
  // New columns:
  featured_until?: string // When featured listing expires
  view_count: number
  rating_count: number
  average_rating: number
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_notes?: string
}

/**
 * Subscription (Updated with new columns)
 */
export interface SubscriptionExtended {
  // ... existing columns ...
  // New columns:
  auto_renew: boolean
  payment_method?: string
  cancelled_at?: string
  cancel_reason?: string
}

/**
 * Package (Updated with new columns)
 */
export interface PackageExtended {
  // ... existing columns ...
  // New columns:
  is_featured: boolean
  sort_order: number
  icon?: string
}

/**
 * Product (Updated with new columns)
 */
export interface ProductExtended {
  // ... existing columns ...
  // New column:
  category_id?: string
}

/**
 * User Profile (Updated with new columns)
 */
export interface UserProfileExtended {
  // ... existing columns ...
  // New columns:
  phone_verified_at?: string
  last_login_at?: string
  notification_preferences: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Affiliate Balance Response
 * From get_affiliate_balance() function
 */
export interface AffiliateBalance {
  balance: number
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
}

/**
 * Place Analytics
 */
export interface PlaceAnalytics {
  place_id: string
  total_views: number
  unique_views: number
  views_by_date: Array<{
    date: string
    views: number
  }>
}

/**
 * Affiliate Earnings Summary
 */
export interface AffiliateEarnings {
  total_earned: number
  total_withdrawn: number
  pending_balance: number
  transactions: AffiliateTransaction[]
}

// ============================================
// DATABASE FUNCTION RESPONSES
// ============================================

/**
 * Response from send_notification() function
 */
export type SendNotificationResponse = string // Returns notification ID

/**
 * Response from get_affiliate_balance() function
 */
export type GetAffiliateBalanceResponse = number

/**
 * Response from increment_place_view_count() trigger
 */
export type IncrementPlaceViewCountResponse = void

// ============================================
// ENUMS
// ============================================

export enum TransactionType {
  EARNING = 'earning',
  WITHDRAWAL = 'withdrawal',
  ADJUSTMENT = 'adjustment',
  BONUS = 'bonus'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationType {
  MESSAGE = 'message',
  SUBSCRIPTION = 'subscription',
  EMPLOYEE_REQUEST = 'employee_request',
  POST = 'post',
  PRODUCT = 'product',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  PAYMENT = 'payment'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

// ============================================
// QUERY FILTERS
// ============================================

/**
 * Filter for affiliate transactions
 */
export interface AffiliateTransactionFilter {
  affiliate_id?: string
  transaction_type?: TransactionType
  status?: TransactionStatus
  from_date?: string
  to_date?: string
}

/**
 * Filter for notifications
 */
export interface NotificationFilter {
  user_id?: string
  type?: NotificationType
  is_read?: boolean
  priority?: NotificationPriority
}

/**
 * Filter for place views
 */
export interface PlaceViewFilter {
  place_id?: string
  user_id?: string
  from_date?: string
  to_date?: string
}

// ============================================
// CREATE/UPDATE TYPES
// ============================================

/**
 * Data for creating an affiliate transaction
 */
export interface CreateAffiliateTransaction {
  affiliate_id: string
  transaction_type: TransactionType
  amount: number
  description_ar?: string
  description_en?: string
  reference_type?: string
  reference_id?: string
}

/**
 * Data for creating a notification
 */
export interface CreateNotification {
  user_id: string
  title_ar: string
  title_en?: string
  message_ar: string
  message_en?: string
  type: NotificationType
  link?: string
  icon?: string
  priority?: NotificationPriority
  expires_at?: string
}

/**
 * Data for creating a package feature
 */
export interface CreatePackageFeature {
  package_id: string
  feature_key: string
  feature_name_ar: string
  feature_name_en?: string
  feature_value?: string
  is_included?: boolean
  icon?: string
  sort_order?: number
}

/**
 * Data for tracking a place view
 */
export interface CreatePlaceView {
  place_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
}

/**
 * Data for creating a product category
 */
export interface CreateProductCategory {
  name_ar: string
  name_en?: string
  description_ar?: string
  description_en?: string
  icon?: string
  color?: string
  sort_order?: number
}

// ============================================
// EXPORTS
// ============================================

// Note: All interfaces are already exported with 'export interface' above
// This section is kept for documentation purposes only
