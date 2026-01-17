-- Complete Migration: Employee System and Posts
-- Run this migration to set up the complete employee and posts system

-- ============================================
-- 1. Employee Requests Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_place_id ON employee_requests(place_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);

ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON employee_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Place owners can view requests" ON employee_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = employee_requests.place_id
      AND places.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create requests" ON employee_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Place owners can update requests" ON employee_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = employee_requests.place_id
      AND places.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. Place Employees Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_place_employees_user_id ON place_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_place_employees_place_id ON place_employees(place_id);
CREATE INDEX IF NOT EXISTS idx_place_employees_active ON place_employees(is_active);

ALTER TABLE place_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employee records" ON place_employees
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Place owners can view employees" ON place_employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

CREATE POLICY "Place owners can insert employees" ON place_employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

CREATE POLICY "Place owners can update employees" ON place_employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

CREATE POLICY "Place owners can delete employees" ON place_employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = place_employees.place_id
      AND places.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Posts Table
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_place_id ON posts(place_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active posts" ON posts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Place owners and employees can view all posts" ON posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = posts.place_id
      AND places.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM place_employees
      WHERE place_employees.place_id = posts.place_id
      AND place_employees.user_id = auth.uid()
      AND place_employees.is_active = true
      AND place_employees.permissions IN ('messages_posts', 'full')
    )
  );

CREATE POLICY "Place owners and employees can insert posts" ON posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = posts.place_id
      AND places.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM place_employees
      WHERE place_employees.place_id = posts.place_id
      AND place_employees.user_id = auth.uid()
      AND place_employees.is_active = true
      AND place_employees.permissions IN ('messages_posts', 'full')
    )
  );

CREATE POLICY "Place owners and employees can update posts" ON posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = posts.place_id
      AND places.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM place_employees
      WHERE place_employees.place_id = posts.place_id
      AND place_employees.user_id = auth.uid()
      AND place_employees.is_active = true
      AND place_employees.permissions IN ('messages_posts', 'full')
    )
  );

CREATE POLICY "Place owners and employees can delete posts" ON posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = posts.place_id
      AND places.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM place_employees
      WHERE place_employees.place_id = posts.place_id
      AND place_employees.user_id = auth.uid()
      AND place_employees.is_active = true
      AND place_employees.permissions IN ('messages_posts', 'full')
    )
  );

-- ============================================
-- 4. Add employee_id to messages table
-- ============================================
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES place_employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_employee_id ON messages(employee_id) WHERE employee_id IS NOT NULL;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE employee_requests IS 'Employee job applications for places';
COMMENT ON COLUMN employee_requests.permissions IS 'Employee permissions: basic (accept only), messages_posts (can reply to customers and manage posts), full (can manage products and posts)';

COMMENT ON TABLE place_employees IS 'Accepted employees for places';
COMMENT ON COLUMN place_employees.permissions IS 'Employee permissions: basic (accept only), messages_posts (can reply to customers and manage posts), full (can manage products and posts)';

COMMENT ON TABLE posts IS 'Posts for places (text, image, or video posts)';
COMMENT ON COLUMN posts.post_type IS 'Type of post: text (text only), image (image + text), video (video + text)';

COMMENT ON COLUMN messages.employee_id IS 'ID of the employee who sent this message (if sent by employee, not owner)';
