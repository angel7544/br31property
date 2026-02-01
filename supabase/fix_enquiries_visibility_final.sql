-- Fix visibility for Enquiries and related tables
-- This script ensures Admins, Owners, and Staff can view all enquiries, complaints, and call requests.

-- 1. ENQUIRIES
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow Admins/Staff/Owners to view ALL enquiries
DROP POLICY IF EXISTS "Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  -- Check if user is admin/owner/staff in metadata
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  -- Check if user is admin/owner/staff in profiles (using their own profile)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- Allow Admins/Staff/Owners to UPDATE/DELETE enquiries
DROP POLICY IF EXISTS "Staff can manage enquiries" ON public.enquiries;
CREATE POLICY "Staff can manage enquiries" ON public.enquiries FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- Allow Public to Insert (for contact forms)
DROP POLICY IF EXISTS "Public can create enquiries" ON public.enquiries;
CREATE POLICY "Public can create enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);


-- 2. PROFILES (Required for the check above)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow Staff to view ALL profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);


-- 3. COMPLAINTS (Tickets)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all complaints" ON public.complaints;
CREATE POLICY "Staff can view all complaints" ON public.complaints FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 4. CALL REQUESTS
ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view call requests" ON public.call_requests;
CREATE POLICY "Staff can view call requests" ON public.call_requests FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);
