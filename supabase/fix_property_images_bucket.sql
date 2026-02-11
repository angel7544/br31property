-- Ensure 'property-images' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow Public Read Access
DROP POLICY IF EXISTS "Public Access property-images" ON storage.objects;
CREATE POLICY "Public Access property-images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');

-- Allow Authenticated Users to Upload
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'property-images');

-- Allow Users to Update/Delete their own images
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
CREATE POLICY "Users can update own property images" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'property-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;
CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'property-images' AND auth.uid() = owner);
