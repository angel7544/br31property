-- Add images column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS images text[];
UPDATE rooms SET images = ARRAY[image_url] WHERE image_url IS NOT NULL AND images IS NULL;

-- Add images column to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS images text[];
UPDATE services SET images = ARRAY[image_url] WHERE image_url IS NOT NULL AND images IS NULL;

-- Add images column to packages
ALTER TABLE packages ADD COLUMN IF NOT EXISTS images text[];
UPDATE packages SET images = ARRAY[image_url] WHERE image_url IS NOT NULL AND images IS NULL;
