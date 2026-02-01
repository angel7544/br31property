-- Fix RLS for complaints to ensure users can view their own tickets

-- 1. Ensure RLS is enabled
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies for users if any
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;

-- 3. Create the policy allowing users to SELECT their own rows
CREATE POLICY "Users can view own complaints" ON public.complaints
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Ensure INSERT policy exists
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON public.complaints;
CREATE POLICY "Authenticated users can create complaints" ON public.complaints
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 5. Grant access to authenticated users
GRANT SELECT, INSERT ON public.complaints TO authenticated;
