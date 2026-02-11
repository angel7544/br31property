-- =================================================================
-- COMPREHENSIVE FIX FOR PROFILE, STORAGE, AND PERMISSIONS
-- Run this in Supabase SQL Editor
-- =================================================================

-- 1. FIX MISSING PROFILES (Resolves "new row for relation" error)
--    This backfills profiles for any users in auth.users who don't have a profile.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'User'), 
  COALESCE(raw_user_meta_data->>'role', 'tenant')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. ENSURE TRIGGER IS CORRECT
--    This ensures future signups automatically create a profile.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FIX STORAGE BUCKETS (Resolves Avatar and Property Image upload failures)
--    Creates buckets if they don't exist and sets public access.

-- Avatars Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Property Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. FIX STORAGE POLICIES
--    Ensures users can upload and view images.

-- Policy: Public can view avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
-- Note: The above path check assumes folder structure user_id/filename. 
-- If the app uploads to root or random names, use a simpler policy:
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Policy: Public can view property images
DROP POLICY IF EXISTS "Public Access property-images" ON storage.objects;
CREATE POLICY "Public Access property-images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');

-- Policy: Authenticated users can upload property images
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'property-images');

-- 5. FIX PROPERTIES RLS (Ensure listing works)
--    Allow authenticated users to insert properties.
DROP POLICY IF EXISTS "Authenticated users can create properties" ON public.properties;
CREATE POLICY "Authenticated users can create properties" ON public.properties FOR INSERT TO authenticated 
WITH CHECK (true);

--    Allow users to update their own properties.
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
CREATE POLICY "Users can update their own properties" ON public.properties FOR UPDATE TO authenticated 
USING (owner_id = auth.uid());
