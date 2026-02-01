-- Fix RLS Recursion and ensure Admins can fetch all users

-- 1. Helper function to get current user's role safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 2. Fix Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow Admins/Staff/Owners to view ALL profiles
CREATE POLICY "Staff and Owners can view all profiles" ON public.profiles 
FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  public.get_my_role() IN ('admin', 'owner', 'staff')
);

-- 3. Fix Payments RLS (Use the same safe function)
DROP POLICY IF EXISTS "Admins and Owners can view all payments" ON public.payments;

CREATE POLICY "Admins and Owners can view all payments" ON public.payments 
FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  public.get_my_role() IN ('admin', 'owner')
);
