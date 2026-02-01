-- Fix for staff foreign key constraint error
-- This script drops the old constraint pointing to 'hotels' and ensures 'property_id' points to 'properties'

BEGIN;

-- 1. Drop the old foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'staff_hotel_id_fkey') THEN
        ALTER TABLE public.staff DROP CONSTRAINT staff_hotel_id_fkey;
    END IF;
END $$;

-- 2. Ensure property_id column exists (rename hotel_id if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hotel_id') THEN
        ALTER TABLE public.staff RENAME COLUMN hotel_id TO property_id;
    END IF;
END $$;

-- 3. Clean up invalid references before adding new constraint
-- (Sets property_id to NULL if the referenced property does not exist in 'properties' table)
UPDATE public.staff 
SET property_id = NULL 
WHERE property_id IS NOT NULL 
AND property_id NOT IN (SELECT id FROM public.properties);

-- 4. Add the correct foreign key constraint to properties table
DO $$
BEGIN
    -- Check if constraint already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'staff_property_id_fkey') THEN
        -- Only add if property_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'property_id') THEN
            ALTER TABLE public.staff ADD CONSTRAINT staff_property_id_fkey 
            FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

COMMIT;
