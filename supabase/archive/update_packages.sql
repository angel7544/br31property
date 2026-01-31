-- Migration to add missing columns to packages table

ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS number_of_days int default 1,
ADD COLUMN IF NOT EXISTS number_of_nights int default 1,
ADD COLUMN IF NOT EXISTS room_capacity int default 2,
ADD COLUMN IF NOT EXISTS is_corporate boolean default false,
ADD COLUMN IF NOT EXISTS is_wedding boolean default false,
ADD COLUMN IF NOT EXISTS is_featured boolean default false,
ADD COLUMN IF NOT EXISTS bed_count int default 1;
