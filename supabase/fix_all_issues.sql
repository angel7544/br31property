-- 1. Fix Staff Table Schema
DO $$
BEGIN
    -- Add user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add PMS columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'shift_start'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN shift_start TIME;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'shift_end'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN shift_end TIME;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'department'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'joining_date'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN joining_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 2. Fix Property Status
-- Ensure all properties are Active so they are visible
UPDATE public.properties 
SET status = 'Active' 
WHERE status IS NULL OR status = 'Maintenance';

-- 3. Verify specific property (for debugging, this just selects it)
SELECT id, name, slug, status FROM public.properties WHERE slug = 't-vybqx';
