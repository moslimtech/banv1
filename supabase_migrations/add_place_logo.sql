-- Add logo_url column to places table
ALTER TABLE places
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment
COMMENT ON COLUMN places.logo_url IS 'شعار أو صورة المكان';
