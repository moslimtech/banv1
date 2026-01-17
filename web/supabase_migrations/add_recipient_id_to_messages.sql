-- Add recipient_id column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id) WHERE recipient_id IS NOT NULL;

-- Add composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(place_id, sender_id, recipient_id) WHERE recipient_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN messages.recipient_id IS 'ID of the user receiving this message (for owner-to-client messages)';
