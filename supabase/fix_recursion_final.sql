-- 1. Create a secure function to fetch the user's role without triggering RLS recursion
-- This function runs as the database owner (SECURITY DEFINER), bypassing the profiles table RLS
CREATE OR REPLACE FUNCTION public.get_my_role_v2()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- 2. Drop the recursive policy on profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- 3. Recreate the policy using the secure function
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (
  -- Check JWT metadata first (fastest)
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  -- Fallback to DB check using the secure function to avoid recursion
  public.get_my_role_v2() IN ('admin', 'owner', 'staff', 'manager')
);

-- 4. Apply similar fix to other tables if they rely on profile role checks recursively
-- (For example, if complaints policy checks profile role, it's fine as long as profile policy doesn't check complaints)
-- But ensuring profiles is clean is the most important step.

-- Optional: Grant execute permission just in case
GRANT EXECUTE ON FUNCTION public.get_my_role_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role_v2 TO service_role;
