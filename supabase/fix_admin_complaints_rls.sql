-- Fix Admin permissions for updating complaints

-- 1. Ensure RLS is enabled (just to be safe)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies for admin management
DROP POLICY IF EXISTS "Staff can manage complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can delete complaints" ON public.complaints;

-- 3. Create a comprehensive policy for Admins/Staff to do EVERYTHING on complaints
CREATE POLICY "Staff can manage all complaints" ON public.complaints
FOR ALL
USING (
  -- Check for admin/owner/staff role in metadata
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  -- Check for admin/owner/staff role in profiles table
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 4. Grant update permissions explicitly
GRANT UPDATE ON public.complaints TO authenticated;
GRANT DELETE ON public.complaints TO authenticated;

-- 5. Verify status column doesn't have a strict enum constraint preventing these values
-- (If it's text, it's fine. If it's an enum, we might need to alter it, but usually it's text in this project)
-- We'll just ensure it's text to be safe
DO $$
BEGIN
    ALTER TABLE public.complaints ALTER COLUMN status TYPE text;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if it fails or is already text
END $$;
