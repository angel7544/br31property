-- Create Offers Table
create table if not exists offers (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  discount_code text,
  discount_value text, -- e.g. "20% OFF", "$50 OFF"
  image_url text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table offers enable row level security;

-- Policies
create policy "Public can view active offers" on offers for select using (is_active = true);
create policy "Staff can do everything on offers" on offers for all using (auth.role() = 'authenticated');
