-- MASTER FIX FOR ADMIN DASHBOARD (Enquiries, Tickets, Call Requests)
-- Run this entire script in Supabase SQL Editor

-- =================================================================
-- 1. ENQUIRIES FIXES
-- =================================================================

-- Make property_id optional (for general contact form)
DO $$
BEGIN
    ALTER TABLE public.enquiries ALTER COLUMN property_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Staff/Owner can VIEW ALL enquiries
DROP POLICY IF EXISTS "Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff'
);

-- Policy: Admin/Staff/Owner can MANAGE enquiries
DROP POLICY IF EXISTS "Staff can manage enquiries" ON public.enquiries;
CREATE POLICY "Staff can manage enquiries" ON public.enquiries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);

-- =================================================================
-- 2. COMPLAINTS (TICKETS) FIXES
-- =================================================================

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  subject TEXT,
  title TEXT,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix Foreign Key to point to PROFILES (Crucial for .select('*, profiles(...)'))
DO $$
BEGIN
    -- Drop old FK if it exists (generic name)
    BEGIN
        ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_user_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    -- Add explicit FK to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'complaints_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.complaints 
        ADD CONSTRAINT complaints_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure property_id FK exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'complaints_property_id_fkey'
    ) THEN
        ALTER TABLE public.complaints 
        ADD CONSTRAINT complaints_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Staff can VIEW ALL complaints
DROP POLICY IF EXISTS "Staff can view all complaints" ON public.complaints;
CREATE POLICY "Staff can view all complaints" ON public.complaints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);

-- Policy: Admin/Staff can MANAGE complaints
DROP POLICY IF EXISTS "Staff can manage complaints" ON public.complaints;
CREATE POLICY "Staff can manage complaints" ON public.complaints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);

-- =================================================================
-- 3. CALL REQUESTS FIXES
-- =================================================================

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.call_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT,
  status TEXT DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix Foreign Key to point to PROFILES
DO $$
BEGIN
    -- Drop old FK
    BEGIN
        ALTER TABLE public.call_requests DROP CONSTRAINT IF EXISTS call_requests_user_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    -- Add explicit FK to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'call_requests_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.call_requests 
        ADD CONSTRAINT call_requests_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Staff can VIEW ALL call requests
DROP POLICY IF EXISTS "Staff can view call requests" ON public.call_requests;
CREATE POLICY "Staff can view call requests" ON public.call_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);

-- Policy: Admin/Staff can MANAGE call requests
DROP POLICY IF EXISTS "Staff can manage call requests" ON public.call_requests;
CREATE POLICY "Staff can manage call requests" ON public.call_requests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);

-- =================================================================
-- 4. PROFILES PERMISSIONS (Just in case)
-- =================================================================
-- Ensure Admins can read all profiles (needed for fetching profile details in tickets)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
);
