-- Fix profiles role check constraint to include 'staff'
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add the updated constraint including 'staff'
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'owner', 'tenant', 'agent', 'staff', 'manager'));
END $$;
