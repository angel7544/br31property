-- Fix Enquiries table to allow general inquiries (null property_id)
ALTER TABLE public.enquiries ALTER COLUMN property_id DROP NOT NULL;

-- Fix Staff table to reference properties instead of hotels (or in addition)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'property_id'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Fix Profiles table to add city and state if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN state TEXT;
    END IF;
END $$;
