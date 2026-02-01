-- Fix Missing Profiles and Ensure Data Consistency

-- 1. Backfill profiles for users who exist in auth.users but not in public.profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'role', 'tenant'),
    au.created_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles pp ON pp.id = au.id
WHERE pp.id IS NULL;

-- 2. Ensure RLS allows users to insert their own profile (if it was missing and they try to save)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Ensure RLS allows users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Ensure RLS allows public read (for avatars/names)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
