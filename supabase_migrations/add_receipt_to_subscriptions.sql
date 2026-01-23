-- Migration: Add receipt image and status to user_subscriptions
-- This allows users to upload payment receipts for admin review

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS receipt_image_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing subscriptions to approved status
UPDATE user_subscriptions
SET status = 'approved'
WHERE status IS NULL AND is_active = true;

-- Add index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status) WHERE status = 'pending';

-- Add comment
COMMENT ON COLUMN user_subscriptions.receipt_image_url IS 'URL of the payment receipt image uploaded by user';
COMMENT ON COLUMN user_subscriptions.status IS 'Subscription status: pending (waiting for admin approval), approved (active), rejected (rejected by admin)';
