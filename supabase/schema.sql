-- Consolidated Schema for PG_DEKHO / Sakura Hotels
-- Incorporates schema.sql and all incremental migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES & AUTH
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'owner', 'tenant', 'agent', 'staff')) DEFAULT 'tenant',
  city TEXT,
  state TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 2. PROPERTIES (PGs, Flats, Hostels)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  type TEXT CHECK (type IN ('PG', 'Flat', 'Hostel')) DEFAULT 'PG',
  gender_preference TEXT CHECK (gender_preference IN ('Male', 'Female', 'Unisex', 'Family')) DEFAULT 'Unisex',
  amenities TEXT[] DEFAULT '{}',
  rules TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  images TEXT[] DEFAULT '{}',
  image_url TEXT, -- For backward compatibility/single image
  status TEXT CHECK (status IN ('Active', 'Maintenance', 'Closed')) DEFAULT 'Active',
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert their own properties" ON public.properties;
CREATE POLICY "Owners can insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;
CREATE POLICY "Owners can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own properties" ON public.properties;
CREATE POLICY "Owners can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = owner_id);

-- ==========================================
-- 3. HOTELS (Management System Entity)
-- ==========================================
-- Inferred from usage in app/admin/staff/page.tsx and app/admin/page.tsx
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Add RLS for hotels if needed, assuming public read for now or authenticated
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hotels viewable by everyone" ON public.hotels;
CREATE POLICY "Hotels viewable by everyone" ON public.hotels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage hotels" ON public.hotels;
CREATE POLICY "Staff can manage hotels" ON public.hotels FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. ROOMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  security_deposit NUMERIC,
  total_beds INTEGER DEFAULT 1,
  available_beds INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  images TEXT[] DEFAULT '{}', -- Added from update_images_column.sql
  status TEXT CHECK (status IN ('Available', 'Occupied', 'Reserved', 'Blocked', 'Maintenance', 'Booked', 'Full')) DEFAULT 'Available', -- Updated constraint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Updated Policies from update_rooms_policy.sql
DROP POLICY IF EXISTS "Public can view active rooms" ON rooms; -- Legacy name
DROP POLICY IF EXISTS "Public can view all rooms" ON public.rooms;
CREATE POLICY "Public can view all rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage rooms" ON public.rooms;
CREATE POLICY "Owners can manage rooms" ON public.rooms FOR ALL USING (EXISTS (
  SELECT 1 FROM public.properties p 
  WHERE p.id = rooms.property_id AND p.owner_id = auth.uid()
));

-- ==========================================
-- 5. RESERVATIONS
-- ==========================================
-- Inferred from usage
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  status TEXT, -- 'Confirmed', 'Checked In', 'Booked', 'Maintenance'
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  room_id UUID REFERENCES public.rooms(id),
  hotel_id UUID REFERENCES public.hotels(id), -- Inferred from dashboard query
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all reservations" ON public.reservations;
CREATE POLICY "Staff can view all reservations" ON public.reservations FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- 6. ENQUIRIES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  move_in_date DATE,
  message TEXT,
  status TEXT CHECK (status IN ('New', 'Contacted', 'Viewed', 'Booked', 'Closed')) DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners see enquiries for their properties" ON public.enquiries;
CREATE POLICY "Owners see enquiries for their properties" ON public.enquiries FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.properties p WHERE p.id = enquiries.property_id AND p.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Users see their own enquiries" ON public.enquiries;
CREATE POLICY "Users see their own enquiries" ON public.enquiries FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create enquiries" ON public.enquiries;
CREATE POLICY "Authenticated users can create enquiries" ON public.enquiries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 7. STAFF
-- ==========================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  image_url TEXT,
  hotel_id UUID REFERENCES public.hotels(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff viewable by authenticated" ON public.staff;
CREATE POLICY "Staff viewable by authenticated" ON public.staff FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 8. SERVICES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  type TEXT,
  price NUMERIC,
  status TEXT,
  description TEXT,
  image_url TEXT,
  images TEXT[], -- Added from update_images_column.sql
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view services" ON public.services;
CREATE POLICY "Public can view services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage services" ON public.services;
CREATE POLICY "Staff can manage services" ON public.services FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 9. PACKAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  items TEXT[],
  price NUMERIC,
  status TEXT,
  description TEXT,
  image_url TEXT,
  images TEXT[], -- Added from update_images_column.sql
  number_of_days INT DEFAULT 1,
  number_of_nights INT DEFAULT 1,
  room_capacity INT DEFAULT 2,
  is_corporate BOOLEAN DEFAULT false,
  is_wedding BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  bed_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view packages" ON public.packages;
CREATE POLICY "Public can view packages" ON public.packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage packages" ON public.packages;
CREATE POLICY "Staff can manage packages" ON public.packages FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 10. BLOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT false,
  author TEXT,
  author_avatar TEXT, -- Added
  author_bio TEXT, -- Added
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Added
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Consolidated policies
DROP POLICY IF EXISTS "Public can read published blogs" ON public.blogs;
CREATE POLICY "Public can read published blogs" ON public.blogs FOR SELECT TO public USING ( is_published = true );

DROP POLICY IF EXISTS "Staff can read all blogs" ON public.blogs;
CREATE POLICY "Staff can read all blogs" ON public.blogs FOR SELECT TO authenticated USING ( true );

DROP POLICY IF EXISTS "Staff can insert blogs" ON public.blogs;
CREATE POLICY "Staff can insert blogs" ON public.blogs FOR INSERT TO authenticated WITH CHECK ( true );

DROP POLICY IF EXISTS "Staff can update blogs" ON public.blogs;
CREATE POLICY "Staff can update blogs" ON public.blogs FOR UPDATE TO authenticated USING ( true );

DROP POLICY IF EXISTS "Staff can delete blogs" ON public.blogs;
CREATE POLICY "Staff can delete blogs" ON public.blogs FOR DELETE TO authenticated USING ( true );

-- ==========================================
-- 11. OFFERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_code TEXT,
  discount_value TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff can do everything on offers" ON public.offers;
CREATE POLICY "Staff can do everything on offers" ON public.offers FOR ALL USING (auth.role() = 'authenticated');

-- Enable Realtime for offers (Idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'offers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE offers;
  END IF;
END;
$$;

-- ==========================================
-- 12. TESTIMONIALS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  message TEXT NOT NULL,
  rating INT DEFAULT 5,
  rooms_rating NUMERIC DEFAULT 5.0,
  service_rating NUMERIC DEFAULT 5.0,
  location_rating NUMERIC DEFAULT 5.0,
  hotel_highlights TEXT,
  walkability TEXT,
  food_and_drinks TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT USING (status = 'Active');

DROP POLICY IF EXISTS "Staff can do everything on testimonials" ON public.testimonials;
CREATE POLICY "Staff can do everything on testimonials" ON public.testimonials FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 13. REVIEWS & WISHLISTS (From original schema)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- REALTIME PUBLICATION SETUP
-- ==========================================
-- Ensure tables are in publication
-- (Supabase default is supabase_realtime)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
END;
$$;
