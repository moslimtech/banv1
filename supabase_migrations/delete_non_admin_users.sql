-- Migration: Delete all non-admin users
-- WARNING: This will delete all users except admins and their related data

-- First, get IDs of non-admin users
-- Delete all related data for non-admin users

-- Delete messages from/to non-admin users
DELETE FROM messages 
WHERE sender_id IN (
  SELECT id FROM auth.users 
  WHERE id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
)
OR recipient_id IN (
  SELECT id FROM auth.users 
  WHERE id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete posts by non-admin users
DELETE FROM posts 
WHERE created_by IN (
  SELECT id FROM auth.users 
  WHERE id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete products by non-admin users (through places)
DELETE FROM products 
WHERE place_id IN (
  SELECT id FROM places 
  WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete places owned by non-admin users
DELETE FROM places 
WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true);

-- Delete employee requests by non-admin users
DELETE FROM employee_requests 
WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
OR place_id IN (
  SELECT id FROM places 
  WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete place employees for non-admin users
DELETE FROM place_employees 
WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
OR place_id IN (
  SELECT id FROM places 
  WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete place visits for non-admin users
DELETE FROM place_visits 
WHERE place_id IN (
  SELECT id FROM places 
  WHERE user_id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true)
);

-- Delete user_profiles for non-admin users first (then auth.users will be handled by cascade or we delete it)
DELETE FROM user_profiles 
WHERE is_admin = false OR is_admin IS NULL;

-- Note: Deleting from auth.users should cascade to user_profiles if CASCADE is set
-- But to be safe, we delete user_profiles first, then auth.users
-- If user_profiles has ON DELETE CASCADE from auth.users, then deleting auth.users will auto-delete user_profiles
-- But we need to delete auth.users explicitly because it won't auto-delete from user_profiles
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM user_profiles WHERE is_admin = true);
