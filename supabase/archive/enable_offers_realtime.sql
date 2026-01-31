-- Enable replication for offers table to support realtime subscriptions
alter publication supabase_realtime add table offers;
