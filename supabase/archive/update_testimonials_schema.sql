-- Add new rating and detail columns to testimonials table
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS rooms_rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS service_rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS location_rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS hotel_highlights text,
ADD COLUMN IF NOT EXISTS walkability text,
ADD COLUMN IF NOT EXISTS food_and_drinks text;
