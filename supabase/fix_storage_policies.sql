-- Fix Storage Policies for Avatars
-- This script ensures users can upload and view profile pictures in the 'profiles' bucket.

-- 1. Create 'profiles' bucket if it doesn't exist (Supabase specific)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow Public Read Access to 'profiles' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');

-- 3. Allow Authenticated Users to Upload their own avatar
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);

-- 4. Allow Users to Update/Delete their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'profiles' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'profiles' AND auth.uid() = owner);
