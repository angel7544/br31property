-- Add user_id to staff table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add other PMS related columns to staff if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'shift_start'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN shift_start TIME;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'shift_end'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN shift_end TIME;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'department'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'joining_date'
    ) THEN
        ALTER TABLE public.staff ADD COLUMN joining_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;
