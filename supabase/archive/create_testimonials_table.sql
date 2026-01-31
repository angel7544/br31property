create table if not exists testimonials (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  message text not null,
  rating int default 5,
  rooms_rating numeric default 5.0,
  service_rating numeric default 5.0,
  location_rating numeric default 5.0,
  hotel_highlights text,
  walkability text,
  food_and_drinks text,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table testimonials enable row level security;

-- Policies
create policy "Public can view active testimonials" on testimonials for select using (status = 'Active');
create policy "Staff can do everything on testimonials" on testimonials for all using (auth.role() = 'authenticated');
