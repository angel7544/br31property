-- SQL command to promote a user to Admin
-- Replace 'user@example.com' with the actual email address of the user you want to make an admin.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'info@br31tech.live';

-- Verify the change
SELECT email, role FROM public.profiles WHERE email = 'info@br31tech.live';
