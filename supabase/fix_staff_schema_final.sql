-- Fix for 'staff_hotel_id_fkey' error and schema alignment
-- Run this in Supabase Dashboard -> SQL Editor

BEGIN;

-- 1. Check if 'hotel_id' exists and 'property_id' does not.
-- If so, rename it. If 'property_id' already exists, we assume it's the correct one.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hotel_id') THEN
        ALTER TABLE public.staff RENAME COLUMN hotel_id TO property_id;
    END IF;
END $$;

-- 2. Drop the old foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'staff_hotel_id_fkey') THEN
        ALTER TABLE public.staff DROP CONSTRAINT staff_hotel_id_fkey;
    END IF;
END $$;

-- 3. Ensure property_id column exists (in case it was missing entirely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'property_id') THEN
        ALTER TABLE public.staff ADD COLUMN property_id UUID;
    END IF;
END $$;

-- 4. Clean up invalid references before adding new constraint
-- (Set property_id to NULL if the ID doesn't exist in properties table)
UPDATE public.staff 
SET property_id = NULL 
WHERE property_id IS NOT NULL 
AND property_id NOT IN (SELECT id FROM public.properties);

-- 5. Add correct foreign key constraint to properties table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'staff_property_id_fkey') THEN
        ALTER TABLE public.staff ADD CONSTRAINT staff_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
