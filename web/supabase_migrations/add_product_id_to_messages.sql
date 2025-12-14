-- Add product_id column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON messages(product_id) WHERE product_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN messages.product_id IS 'Reference to a product shared in this message';
