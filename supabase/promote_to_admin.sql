-- Promote Specific User to Admin/Owner
-- REPLACE 'info@br31tech.live' with the actual email if different
DO $$
DECLARE
  target_email TEXT := 'info@br31tech.live';
  target_user_id UUID;
BEGIN
  -- Find the user ID from auth.users (if accessible) or trust the profile backfill
  -- Since we can't always query auth.users directly in simple SQL editor without permissions,
  -- we'll rely on profiles if it exists, or update if we find it.
  
  -- 1. Update Profile Role
  UPDATE public.profiles
  SET role = 'owner' -- or 'admin'
  WHERE email = target_email;

  -- 2. If you want to update app_metadata (requires admin privileges usually done via API/Edge Function),
  -- we can't easily do it via standard SQL unless we use supabase admin extensions.
  -- But updating the profile is enough for our app's logic now.
  
  -- 3. Also promote any other specific emails if needed
  -- UPDATE public.profiles SET role = 'owner' WHERE email = 'another@example.com';
  
END $$;
