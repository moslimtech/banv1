-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, start_date, end_date) WHERE is_active = true;

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active discount codes (for validation)
CREATE POLICY "Anyone can view active discount codes" ON discount_codes
  FOR SELECT
  USING (
    is_active = true 
    AND NOW() >= start_date 
    AND NOW() <= end_date
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- Allow admins to read all discount codes
CREATE POLICY "Admins can view all discount codes" ON discount_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to insert discount codes
CREATE POLICY "Admins can insert discount codes" ON discount_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to update discount codes
CREATE POLICY "Admins can update discount codes" ON discount_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to delete discount codes
CREATE POLICY "Admins can delete discount codes" ON discount_codes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Function to update used_count
CREATE OR REPLACE FUNCTION increment_discount_code_usage(code_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE discount_codes IS 'Discount codes with start and end dates';
COMMENT ON COLUMN discount_codes.code IS 'Unique discount code';
COMMENT ON COLUMN discount_codes.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN discount_codes.start_date IS 'Code activation date';
COMMENT ON COLUMN discount_codes.end_date IS 'Code expiration date';
COMMENT ON COLUMN discount_codes.max_uses IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN discount_codes.used_count IS 'Number of times this code has been used';
