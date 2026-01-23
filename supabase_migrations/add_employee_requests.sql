-- Migration: Add employee_requests table
-- This table stores employee job applications for places

CREATE TABLE IF NOT EXISTS employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  permissions VARCHAR(50) DEFAULT 'basic' CHECK (permissions IN ('basic', 'messages_posts', 'full')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_place_id ON employee_requests(place_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);

-- RLS Policies
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON employee_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Place owners can view requests for their places
CREATE POLICY "Place owners can view requests" ON employee_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = employee_requests.place_id
      AND places.user_id = auth.uid()
    )
  );

-- Users can create requests
CREATE POLICY "Users can create requests" ON employee_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Place owners can update requests (accept/reject)
CREATE POLICY "Place owners can update requests" ON employee_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = employee_requests.place_id
      AND places.user_id = auth.uid()
    )
  );

COMMENT ON TABLE employee_requests IS 'Employee job applications for places';
COMMENT ON COLUMN employee_requests.permissions IS 'Employee permissions: basic (accept only), messages_posts (can reply to customers and manage posts), full (can manage products and posts)';
