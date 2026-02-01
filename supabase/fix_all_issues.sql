-- Master Fix for Admin Access and Profiles

-- 1. Ensure Profile Exists and is Owner (Upsert)
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    'owner', -- FORCE ROLE TO OWNER
    created_at,
    created_at
FROM auth.users
WHERE email IN ('info@br31tech.live', 'angel@br31tech.live')
ON CONFLICT (id) DO UPDATE
SET role = 'owner'; -- FORCE UPDATE EXISTING PROFILE TO OWNER

-- 2. Fix RLS for Profiles (Allow Admin/Owner/Staff to view all)
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

-- 3. Ensure User can insert/update their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Fix Enquiries RLS (Allow Admin/Owner/Staff to view all)
DROP POLICY IF EXISTS "Admin/Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Admin/Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 5. Fix Complaints RLS (Allow Admin/Owner/Staff to view all)
DROP POLICY IF EXISTS "Admin/Staff can view all complaints" ON public.complaints;
CREATE POLICY "Admin/Staff can view all complaints" ON public.complaints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 6. Ensure call_requests are viewable
DROP POLICY IF EXISTS "Admin/Staff can view all call_requests" ON public.call_requests;
CREATE POLICY "Admin/Staff can view all call_requests" ON public.call_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);
