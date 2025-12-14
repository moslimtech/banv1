-- Enable RLS on affiliates table
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active affiliate codes (for discount code validation)
CREATE POLICY "Anyone can view active affiliate codes" ON affiliates
  FOR SELECT
  USING (is_active = true);

-- Allow users to read their own affiliate record
CREATE POLICY "Users can view own affiliate" ON affiliates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to read all affiliates
CREATE POLICY "Admins can view all affiliates" ON affiliates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to insert affiliates
CREATE POLICY "Admins can insert affiliates" ON affiliates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to update affiliates
CREATE POLICY "Admins can update affiliates" ON affiliates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to delete affiliates
CREATE POLICY "Admins can delete affiliates" ON affiliates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
