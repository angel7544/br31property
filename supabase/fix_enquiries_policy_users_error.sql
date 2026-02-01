-- Fix "Permission denied for table users" error in Enquiries RLS
-- The previous policy tried to SELECT from auth.users directly, which is restricted.
-- We replace it with auth.jwt() ->> 'email' to get the current user's email safely.

-- ==========================================
-- FIX ENQUIRIES POLICY
-- ==========================================
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own enquiries" ON public.enquiries;

CREATE POLICY "Users see their own enquiries" ON public.enquiries 
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  email = (auth.jwt() ->> 'email')
);
