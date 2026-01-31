-- Enable Realtime for rooms and reservations tables
begin;
  -- Check if publication exists, if not create it (standard supabase setup usually has 'supabase_realtime')
  -- We assume 'supabase_realtime' publication exists as it is default in Supabase.
  -- If not, we might need to create it, but typically we just add tables to it.
  
  -- Enable replication for the tables (required for realtime)
  alter table rooms replica identity full;
  alter table reservations replica identity full;

  -- Add tables to the publication
  alter publication supabase_realtime add table rooms;
  alter publication supabase_realtime add table reservations;
commit;
