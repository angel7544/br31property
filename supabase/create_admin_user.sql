-- =====================================================================
-- ADMIN CREATION / PROMOTION SCRIPT
-- =====================================================================

-- 1. First, ensure the user has signed up via the application or Supabase dashboard.
--    This ensures they have an entry in auth.users.

-- 2. Run the following SQL to promote them to 'admin'.
--    Replace 'YOUR_EMAIL@EXAMPLE.COM' with the user's actual email.

-- OPTION A: Update existing profile
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'info@br31tech.live'
);

-- OPTION B: Insert profile if it doesn't exist (Safeguard)
INSERT INTO public.profiles (id, full_name, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', 'Angel'), 
    'admin'
FROM auth.users 
WHERE email = 'info@br31tech.liveM'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';

-- 3. (Optional) Verify the update
SELECT p.id, u.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'info@br31tech.live';
