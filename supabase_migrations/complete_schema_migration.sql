-- ============================================
-- Complete Schema Migration
-- Purpose: Add all missing tables and columns from User Journey analysis
-- Date: 2026-01-21
-- Safe: Only adds new tables/columns, no data modification
-- ============================================

-- ============================================
-- PRIORITY 1: ESSENTIAL TABLES
-- ============================================

-- ============================================
-- 1. Affiliate Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earning', 'withdrawal', 'adjustment', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  reference_type VARCHAR(50), -- 'subscription', 'referral', etc.
  reference_id UUID, -- ID of related record
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_affiliate_id ON affiliate_transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_type ON affiliate_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_created_at ON affiliate_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_status ON affiliate_transactions(status);

ALTER TABLE affiliate_transactions ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own transactions
CREATE POLICY "Affiliates can view own transactions" ON affiliate_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_transactions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON affiliate_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Admins can manage transactions
CREATE POLICY "Admins can manage transactions" ON affiliate_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

COMMENT ON TABLE affiliate_transactions IS 'Affiliate earning and withdrawal transactions';
COMMENT ON COLUMN affiliate_transactions.transaction_type IS 'Type: earning (commission earned), withdrawal (money withdrawn), adjustment (admin correction), bonus (special reward)';

-- ============================================
-- 2. Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'message', 'subscription', 'employee_request', 'post', 
    'product', 'system', 'promotion', 'payment'
  )),
  is_read BOOLEAN DEFAULT false,
  link TEXT, -- Deep link to related page
  icon TEXT, -- Icon name or emoji
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

COMMENT ON TABLE notifications IS 'User notifications for messages, subscriptions, etc.';
COMMENT ON COLUMN notifications.type IS 'Notification type for filtering and icons';

-- ============================================
-- 3. Package Features Table
-- ============================================
CREATE TABLE IF NOT EXISTS package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL, -- 'featured_listings', 'youtube_upload', etc.
  feature_name_ar TEXT NOT NULL,
  feature_name_en TEXT,
  feature_value TEXT, -- '5 listings', 'Unlimited', etc.
  is_included BOOLEAN DEFAULT true,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_package_features_package_id ON package_features(package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_sort_order ON package_features(sort_order);

ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view package features
CREATE POLICY "Everyone can view package features" ON package_features
  FOR SELECT
  USING (true);

-- Admins can manage package features
CREATE POLICY "Admins can manage package features" ON package_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

COMMENT ON TABLE package_features IS 'Detailed features included in each package';
COMMENT ON COLUMN package_features.feature_key IS 'Unique key for feature (e.g., featured_listings, youtube_upload)';

-- ============================================
-- 4. Place Views (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS place_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guests
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_views_place_id ON place_views(place_id);
CREATE INDEX IF NOT EXISTS idx_place_views_user_id ON place_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_place_views_viewed_at ON place_views(viewed_at DESC);

ALTER TABLE place_views ENABLE ROW LEVEL SECURITY;

-- Place owners can view their place views
CREATE POLICY "Place owners can view own place views" ON place_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_views.place_id
      AND places.user_id = auth.uid()
    )
  );

-- Admins can view all views
CREATE POLICY "Admins can view all place views" ON place_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

COMMENT ON TABLE place_views IS 'Analytics: Track place page views';

-- ============================================
-- 5. Product Categories
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  color TEXT, -- Hex color for UI
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order ON product_categories(sort_order);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view active categories
CREATE POLICY "Everyone can view active categories" ON product_categories
  FOR SELECT
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON product_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

COMMENT ON TABLE product_categories IS 'Product categories for better organization';

-- ============================================
-- PRIORITY 2: ADD MISSING COLUMNS
-- ============================================

-- Add columns to places table
DO $$ 
BEGIN
  -- featured_until: When featured listing expires
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE places ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE;
    CREATE INDEX idx_places_featured_until ON places(featured_until) WHERE featured_until IS NOT NULL;
  END IF;

  -- view_count: Total views
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE places ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  -- rating_count: Number of ratings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE places ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;

  -- average_rating: Average rating (0-5)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE places ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5);
  END IF;

  -- verification_status: pending/verified/rejected
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE places ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
    CREATE INDEX idx_places_verification_status ON places(verification_status);
  END IF;

  -- verification_notes: Admin notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'places' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE places ADD COLUMN verification_notes TEXT;
  END IF;
END $$;

-- Add columns to subscriptions table
DO $$ 
BEGIN
  -- auto_renew: Auto-renewal flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT false;
  END IF;

  -- payment_method: Payment method used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(50);
  END IF;

  -- cancelled_at: Cancellation date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- cancel_reason: Why cancelled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_reason'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_reason TEXT;
  END IF;
END $$;

-- Add columns to packages table
DO $$ 
BEGIN
  -- is_featured: Show on homepage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'packages' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE packages ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  -- sort_order: Display order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'packages' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE packages ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;

  -- icon: Package icon
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'packages' AND column_name = 'icon'
  ) THEN
    ALTER TABLE packages ADD COLUMN icon TEXT;
  END IF;
END $$;

-- Add columns to products table
DO $$ 
BEGIN
  -- category_id: Link to product category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
    CREATE INDEX idx_products_category_id ON products(category_id) WHERE category_id IS NOT NULL;
  END IF;
END $$;

-- Add columns to user_profiles table
DO $$ 
BEGIN
  -- phone_verified_at: Phone verification timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'phone_verified_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- last_login_at: Last login timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- notification_preferences: User notification settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb;
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment place view count
CREATE OR REPLACE FUNCTION increment_place_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE places
  SET view_count = view_count + 1
  WHERE id = NEW.place_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS trigger_increment_place_view_count ON place_views;
CREATE TRIGGER trigger_increment_place_view_count
  AFTER INSERT ON place_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_place_view_count();

-- Function to calculate affiliate balance
CREATE OR REPLACE FUNCTION get_affiliate_balance(p_affiliate_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type IN ('earning', 'bonus', 'adjustment') THEN amount
      WHEN transaction_type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM affiliate_transactions
  WHERE affiliate_id = p_affiliate_id
  AND status = 'completed';
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title_ar TEXT,
  p_message_ar TEXT,
  p_type VARCHAR(30),
  p_link TEXT DEFAULT NULL,
  p_title_en TEXT DEFAULT NULL,
  p_message_en TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, title_ar, title_en, message_ar, message_en, type, link
  ) VALUES (
    p_user_id, p_title_ar, p_title_en, p_message_ar, p_message_en, p_type, p_link
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample product categories
INSERT INTO product_categories (name_ar, name_en, icon, color, sort_order)
VALUES 
  ('أدوية', 'Medicines', '💊', '#3B82F6', 1),
  ('مستحضرات تجميل', 'Cosmetics', '💄', '#EC4899', 2),
  ('فيتامينات', 'Vitamins', '🌟', '#10B981', 3),
  ('أطفال', 'Baby Care', '👶', '#F59E0B', 4),
  ('عناية شخصية', 'Personal Care', '🧴', '#8B5CF6', 5)
ON CONFLICT (name_ar) DO NOTHING;

-- ============================================
-- FINAL COMMENTS
-- ============================================
COMMENT ON COLUMN places.featured_until IS 'Date until which this place is featured (NULL = not featured)';
COMMENT ON COLUMN places.view_count IS 'Total number of page views';
COMMENT ON COLUMN places.average_rating IS 'Average rating from 0 to 5';
COMMENT ON COLUMN places.verification_status IS 'Admin verification status: pending (default), verified (approved), rejected (denied)';

COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription should auto-renew on expiry';
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used (e.g., credit_card, paypal)';
COMMENT ON COLUMN subscriptions.cancelled_at IS 'When subscription was cancelled';

COMMENT ON COLUMN packages.is_featured IS 'Show this package prominently on homepage';
COMMENT ON COLUMN packages.sort_order IS 'Display order (lower numbers first)';

COMMENT ON COLUMN products.category_id IS 'Product category for organization';

COMMENT ON COLUMN user_profiles.phone_verified_at IS 'When phone number was verified';
COMMENT ON COLUMN user_profiles.last_login_at IS 'Last login timestamp for analytics';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'User notification settings (email, push, sms)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this script to add all missing tables and columns
-- Safe: Only adds new structures, no data modification
-- Next steps: Update TypeScript interfaces, test RLS policies
-- ============================================
