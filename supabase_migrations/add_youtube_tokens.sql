-- Migration: Add YouTube tokens to user_profiles table
-- Date: 2025-01-XX

-- Add YouTube token columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS youtube_access_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_youtube_token 
ON user_profiles(youtube_access_token) 
WHERE youtube_access_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.youtube_access_token IS 'YouTube OAuth access token for video uploads';
COMMENT ON COLUMN user_profiles.youtube_refresh_token IS 'YouTube OAuth refresh token for renewing access token';
COMMENT ON COLUMN user_profiles.youtube_token_expiry IS 'Expiry date of the YouTube access token';
