
-- Add missing columns to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure RLS allows viewing call_requests
-- Drop existing policy if it's too restrictive
DROP POLICY IF EXISTS "Staff can manage call requests" ON public.call_requests;

-- Create a more permissive policy for testing/admin usage
-- This allows any user with these roles in metadata OR profiles to view/manage
CREATE POLICY "Staff can manage call requests" ON public.call_requests FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);
