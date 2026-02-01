-- Fix Login Loop and RLS Issues

-- 1. CRITICAL: Allow users to read their own profile (Required for Login to fetch role)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- 2. Ensure the user is definitely an OWNER (Redundant safety check)
UPDATE public.profiles
SET role = 'owner'
WHERE email IN ('info@br31tech.live', 'angel@br31tech.live');

-- 3. Ensure "Public profiles" policy is gone if it conflicts (or keep it if needed, but 'own profile' is safer for now)
-- If you want everyone to see profiles, uncomment below:
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- But for now, let's stick to secure defaults + explicit override.

-- 4. Fix recursive policy for Admin/Staff viewing all profiles
-- We use a simpler approach: check metadata OR check specific ID (without self-referencing RLS on the same table if possible)
-- The previous policy was: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role...)
-- This causes infinite recursion if RLS checks profiles to see if you can check profiles.
-- We'll use a direct role check on the auth.users metadata if possible, OR trust the "Users can view own profile" lets them read themselves first.

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (
  -- 1. Trust JWT metadata (fastest)
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  -- 2. Allow if the user is fetching their OWN profile (covered by "Users can view own profile", but added here for completeness)
  auth.uid() = id OR
  -- 3. Fallback: Allow if the requester has a high-privilege email (Hardcoded safety hatch)
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('info@br31tech.live', 'angel@br31tech.live')
);
