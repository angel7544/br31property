-- Fix Admin Dashboard Access and Data Fetching
-- This migration ensures all necessary tables exist and have correct RLS policies for Admins/Staff

-- 1. FIX ENQUIRIES
-- =================================================================
-- Allow general inquiries (no property_id)
DO $$
BEGIN
    ALTER TABLE public.enquiries ALTER COLUMN property_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Admin/Staff View Policy
DROP POLICY IF EXISTS "Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- Admin/Staff Manage Policy
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


-- 2. FIX COMPLAINTS (TICKETS)
-- =================================================================
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

-- Ensure columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'property_id') THEN
        ALTER TABLE public.complaints ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'subject') THEN
        ALTER TABLE public.complaints ADD COLUMN subject TEXT;
    END IF;
END $$;

-- Fix FK to profiles if it points to auth.users or is missing
DO $$
BEGIN
    -- Try to drop old constraint if it exists
    BEGIN
        ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_user_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    -- Add correct constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'complaints_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.complaints 
        ADD CONSTRAINT complaints_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Admin/Staff View Policy
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

-- Admin/Staff Manage Policy
DROP POLICY IF EXISTS "Staff can manage complaints" ON public.complaints;
CREATE POLICY "Staff can manage complaints" ON public.complaints FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- User View Own Policy
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);

-- User Create Policy
DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. FIX CALL REQUESTS
-- =================================================================
CREATE TABLE IF NOT EXISTS public.call_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Called', 'Closed')) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix FK to profiles
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.call_requests DROP CONSTRAINT IF EXISTS call_requests_user_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

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

-- Admin/Staff View Policy
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

-- Admin/Staff Manage Policy
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

-- User Create Policy
DROP POLICY IF EXISTS "Users can create call requests" ON public.call_requests;
CREATE POLICY "Users can create call requests" ON public.call_requests FOR INSERT WITH CHECK (true);


-- 4. FIX PROFILES
-- =================================================================
-- Allow Admins to view ALL profiles (needed to see who submitted ticket/enquiry)
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
