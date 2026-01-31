create table if not exists blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  tags text[],
  seo_title text,
  seo_description text,
  is_published boolean default false,
  author text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table blogs enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Public blogs are viewable by everyone" on blogs;
drop policy if exists "Admins can view all blogs" on blogs;
drop policy if exists "Admins can insert blogs" on blogs;
drop policy if exists "Admins can update blogs" on blogs;
drop policy if exists "Admins can delete blogs" on blogs;

create policy "Public blogs are viewable by everyone"
  on blogs for select
  using ( is_published = true );

create policy "Admins can view all blogs"
  on blogs for select
  using ( true );

create policy "Admins can insert blogs"
  on blogs for insert
  with check ( true );

create policy "Admins can update blogs"
  on blogs for update
  using ( true );

create policy "Admins can delete blogs"
  on blogs for delete
  using ( true );
