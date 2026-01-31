-- Set all properties to Active status so they appear in search results
UPDATE public.properties 
SET status = 'Active' 
WHERE status = 'Maintenance' OR status IS NULL;
