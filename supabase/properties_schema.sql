-- Properties Table Schema
-- This table supports multiple images and amenities as requested

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
  contact_number TEXT,
  email TEXT,
  amenities TEXT[] DEFAULT '{}', -- Supports array of amenities strings
  rules TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  images TEXT[] DEFAULT '{}', -- Supports array of image URLs (Main + 5 others)
  image_url TEXT, -- For backward compatibility/Main image
  status TEXT CHECK (status IN ('Active', 'Maintenance', 'Closed')) DEFAULT 'Active',
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = owner_id);
