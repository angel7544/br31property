-- Enable RLS
alter table blogs enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public blogs are viewable by everyone" on blogs;
drop policy if exists "Admins can view all blogs" on blogs;
drop policy if exists "Admins can insert blogs" on blogs;
drop policy if exists "Admins can update blogs" on blogs;
drop policy if exists "Admins can delete blogs" on blogs;
drop policy if exists "Public can read published blogs" on blogs;
drop policy if exists "Staff can read all blogs" on blogs;

-- 1. READ ACCESS
-- Allow public (anon) and authenticated users to read published blogs
create policy "Public can read published blogs"
on blogs for select
to public
using ( is_published = true );

-- Allow authenticated users (staff/admins) to read ALL blogs (including drafts)
create policy "Staff can read all blogs"
on blogs for select
to authenticated
using ( true );

-- 2. WRITE ACCESS (Admins/Staff only)
create policy "Staff can insert blogs"
on blogs for insert
to authenticated
with check ( true );

create policy "Staff can update blogs"
on blogs for update
to authenticated
using ( true );

create policy "Staff can delete blogs"
on blogs for delete
to authenticated
using ( true );
