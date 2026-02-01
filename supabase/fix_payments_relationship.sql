-- Fix 'Could not find a relationship between profiles and payments' error

-- 1. Ensure the payments table exists with the correct foreign key
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id text not null,
  payment_id text,
  signature text,
  amount numeric not null,
  currency text default 'INR',
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Explicitly recreate the foreign key to refresh the definition
-- This helps PostgREST detect the relationship
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_user_id_fkey') THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_user_id_fkey;
  END IF;
  
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 3. Notify PostgREST to reload the schema cache
-- This is critical for the API to recognize the new relationship immediately
NOTIFY pgrst, 'reload config';
