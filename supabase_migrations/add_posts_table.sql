-- Migration: Add posts table
-- This table stores posts for places (text, image, or video posts)

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_place_id ON posts(place_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- RLS Policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view active posts
CREATE POLICY "Everyone can view active posts" ON posts
  FOR SELECT
  USING (is_active = true);

-- Place owners and employees can view all posts for their places
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

-- Place owners and employees with permissions can insert posts
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

-- Place owners and employees with permissions can update posts
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

-- Place owners and employees with permissions can delete posts
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

COMMENT ON TABLE posts IS 'Posts for places (text, image, or video posts)';
COMMENT ON COLUMN posts.post_type IS 'Type of post: text (text only), image (image + text), video (video + text)';
