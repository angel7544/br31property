
-- Fix for Property Listing Issues (RLS and Constraints)

-- 1. Relax Foreign Key Constraint (Reference auth.users instead of public.profiles)
-- This prevents errors if the public.profiles entry is missing or out of sync.
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'properties_owner_id_fkey') THEN
    ALTER TABLE public.properties DROP CONSTRAINT properties_owner_id_fkey;
  END IF;
END $$;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update RLS Policy to be more robust (Check Metadata AND Profiles)
DROP POLICY IF EXISTS "Admins and Owners can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can insert their own properties" ON public.properties;

CREATE POLICY "Admins and Owners can insert properties" ON public.properties 
FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND (
    -- Check Profile Role
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role IN ('admin', 'owner'))
    ) 
    OR
    -- Check App Metadata Role (JWT)
    (
      (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
      (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner'
    )
    OR
    -- Check User Metadata Role (Fallback)
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    )
  )
);

-- 3. Ensure Update Policy is also consistent
DROP POLICY IF EXISTS "Admins and Owners can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;

CREATE POLICY "Admins and Owners can update properties" ON public.properties 
FOR UPDATE USING (
  (auth.uid() = owner_id) OR
  EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Ensure Delete Policy is also consistent
DROP POLICY IF EXISTS "Admins and Owners can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete their own properties" ON public.properties;

CREATE POLICY "Admins and Owners can delete properties" ON public.properties 
FOR DELETE USING (
  (auth.uid() = owner_id) OR
  EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
  )
);
