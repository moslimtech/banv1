-- Add audio_url column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN messages.audio_url IS 'URL of audio file uploaded to Catbox';
