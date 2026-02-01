
-- Add missing columns to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS title TEXT;

-- If title is empty, maybe fill it from subject?
UPDATE public.complaints SET title = subject WHERE title IS NULL;

-- If subject is empty, maybe fill it from title?
UPDATE public.complaints SET subject = title WHERE subject IS NULL;

-- Fix FKs to point to profiles to enable PostgREST joins
-- We attempt to drop the old constraint if it exists (standard naming)
ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_user_id_fkey,
  ADD CONSTRAINT complaints_user_id_fkey_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.call_requests
  DROP CONSTRAINT IF EXISTS call_requests_user_id_fkey,
  ADD CONSTRAINT call_requests_user_id_fkey_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure RLS allows viewing call_requests
DROP POLICY IF EXISTS "Staff can manage call requests" ON public.call_requests;

CREATE POLICY "Staff can manage call requests" ON public.call_requests FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);
