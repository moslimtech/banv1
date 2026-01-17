-- Migration: Add place_employees table
-- This table stores accepted employees for places

CREATE TABLE IF NOT EXISTS place_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  permissions VARCHAR(50) DEFAULT 'basic' CHECK (permissions IN ('basic', 'messages_posts', 'full')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_place_employees_user_id ON place_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_place_employees_place_id ON place_employees(place_id);
CREATE INDEX IF NOT EXISTS idx_place_employees_active ON place_employees(is_active);

-- RLS Policies
ALTER TABLE place_employees ENABLE ROW LEVEL SECURITY;

-- Users can view their own employee records
CREATE POLICY "Users can view own employee records" ON place_employees
  FOR SELECT
  USING (auth.uid() = user_id);

-- Place owners can view all employees for their places
CREATE POLICY "Place owners can view employees" ON place_employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

-- Place owners can insert employees
CREATE POLICY "Place owners can insert employees" ON place_employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

-- Place owners can update employees
CREATE POLICY "Place owners can update employees" ON place_employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

-- Place owners can delete employees
CREATE POLICY "Place owners can delete employees" ON place_employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

COMMENT ON TABLE place_employees IS 'Accepted employees for places';
COMMENT ON COLUMN place_employees.permissions IS 'Employee permissions: basic (accept only), messages_posts (can reply to customers and manage posts), full (can manage products and posts)';
