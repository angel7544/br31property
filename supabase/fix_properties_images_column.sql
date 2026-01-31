-- Ensure image_url column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Ensure images column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'images'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Ensure amenities column exists (proactive check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'amenities'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN amenities TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Optional: Migrate existing image_url to images array if images is empty
UPDATE public.properties 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR images = '{}');
