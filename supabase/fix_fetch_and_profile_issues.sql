-- Master Fix for Enquiries, Profiles, and Data Visibility
-- Run this script to resolve "Failed to fetch enquiry" and Profile visibility issues.

-- ==========================================
-- 1. FIX ENQUIRIES & RELATIONS
-- ==========================================
-- Ensure Foreign Keys exist for the JOINs to work (properties, rooms)
DO $$
BEGIN
    -- Ensure columns exist
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS property_id UUID;
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS room_id UUID;

    -- Check property_id FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enquiries_property_id_fkey') THEN
        ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;

    -- Check room_id FK (If 'rooms' table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enquiries_room_id_fkey') THEN
             ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS on Enquiries
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow Staff/Admin/Owner to VIEW enquiries (Select)
DROP POLICY IF EXISTS "Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  -- Check Metadata Role
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  -- Check Profile Role
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- Allow Public to CREATE enquiries (Insert)
DROP POLICY IF EXISTS "Public can create enquiries" ON public.enquiries;
CREATE POLICY "Public can create enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);

-- ==========================================
-- 2. FIX PROFILES (Visibility & Creation)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow Users to VIEW their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow Users to INSERT their own profile (Critical for new user signup/login)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow Users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow Staff/Admin to VIEW ALL profiles
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

-- ==========================================
-- 3. FIX PROPERTIES & ROOMS ACCESS (For Joins)
-- ==========================================
-- Ensure admins/owners can read properties (needed for the Enquiry Join)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view properties" ON public.properties;
CREATE POLICY "Staff can view properties" ON public.properties FOR SELECT USING (
  -- Public can view properties? Usually yes for a listing site.
  -- If not, at least ensure admins can.
  true
);

-- Ensure admins/owners can read rooms (needed for the Enquiry Join)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view rooms" ON public.rooms;
CREATE POLICY "Staff can view rooms" ON public.rooms FOR SELECT USING (
  true
);

-- ==========================================
-- 4. FIX STORAGE (Profile Pictures)
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'profiles' AND auth.uid() = owner);
