-- Create payments table to track subscription upgrades
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id text not null,
  payment_id text,
  signature text,
  amount numeric not null,
  currency text default 'INR',
  status text default 'pending', -- pending, captured, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- Policies
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Admins and Owners can view all payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'owner')
    )
  );

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_payments_updated on public.payments;
create trigger on_payments_updated
  before update on public.payments
  for each row execute procedure public.handle_updated_at();
