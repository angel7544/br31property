
-- PMS Upgrade V2: New Tables and RLS Fixes (Safe Version)

-- ==========================================
-- 1. PROPERTIES RLS FIX
-- ==========================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and Owners can insert properties" ON public.properties;
CREATE POLICY "Admins and Owners can insert properties" ON public.properties 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role IN ('admin', 'owner'))
  )
);

DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and Owners can update properties" ON public.properties;
CREATE POLICY "Admins and Owners can update properties" ON public.properties 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR (role = 'owner' AND properties.owner_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Owners can delete their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and Owners can delete properties" ON public.properties;
CREATE POLICY "Admins and Owners can delete properties" ON public.properties 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR (role = 'owner' AND properties.owner_id = auth.uid()))
  )
);

-- ==========================================
-- 1.5 ROOMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  monthly_rent NUMERIC DEFAULT 0,
  security_deposit NUMERIC DEFAULT 0,
  total_beds INTEGER DEFAULT 1,
  available_beds INTEGER DEFAULT 1,
  amenities TEXT[],
  image_url TEXT,
  status TEXT CHECK (status IN ('Available', 'Full', 'Maintenance')) DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. OFFERS & TESTIMONIALS RLS FIX
-- ==========================================
-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_code TEXT,
  discount_value TEXT,
  image_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can do everything on offers" ON public.offers;
CREATE POLICY "Staff can do everything on offers" ON public.offers 
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
    )
  )
);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  message TEXT NOT NULL,
  rating NUMERIC DEFAULT 5,
  rooms_rating NUMERIC DEFAULT 5,
  service_rating NUMERIC DEFAULT 5,
  location_rating NUMERIC DEFAULT 5,
  hotel_highlights TEXT,
  walkability TEXT,
  food_and_drinks TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can do everything on testimonials" ON public.testimonials;
CREATE POLICY "Staff can do everything on testimonials" ON public.testimonials 
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
    )
  )
);

-- ==========================================
-- 3. MAINTENANCE REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Low',
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if missing (in case table existed with different schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'user_id') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'property_id') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'room_id') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Users can view maintenance" ON public.maintenance_requests;
CREATE POLICY "Staff and Users can view maintenance" ON public.maintenance_requests 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

DROP POLICY IF EXISTS "Users can create maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Users can create maintenance requests" ON public.maintenance_requests 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Staff can update maintenance requests" ON public.maintenance_requests 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- ==========================================
-- 4. INVENTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit_price NUMERIC DEFAULT 0,
  last_restocked DATE,
  status TEXT CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')) DEFAULT 'In Stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'property_id') THEN
        ALTER TABLE public.inventory ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'min_quantity') THEN
        ALTER TABLE public.inventory ADD COLUMN min_quantity INTEGER DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'unit_price') THEN
        ALTER TABLE public.inventory ADD COLUMN unit_price NUMERIC DEFAULT 0;
    END IF;
END $$;

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;
CREATE POLICY "Staff can manage inventory" ON public.inventory 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- ==========================================
-- 5. COMPLAINTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('New', 'Investigating', 'Resolved', 'Dismissed')) DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'user_id') THEN
        ALTER TABLE public.complaints ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'property_id') THEN
        ALTER TABLE public.complaints ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Users can view complaints" ON public.complaints;
CREATE POLICY "Staff and Users can view complaints" ON public.complaints 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;
CREATE POLICY "Users can create complaints" ON public.complaints 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update complaints" ON public.complaints;
CREATE POLICY "Staff can update complaints" ON public.complaints 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- ==========================================
-- 6. RESERVATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  room_id UUID REFERENCES public.rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Checked In', 'Checked Out')) DEFAULT 'Pending',
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'user_id') THEN
        ALTER TABLE public.reservations ADD COLUMN user_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'property_id') THEN
        ALTER TABLE public.reservations ADD COLUMN property_id UUID REFERENCES public.properties(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'room_id') THEN
        ALTER TABLE public.reservations ADD COLUMN room_id UUID REFERENCES public.rooms(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'total_amount') THEN
        ALTER TABLE public.reservations ADD COLUMN total_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage reservations" ON public.reservations;
CREATE POLICY "Staff can manage reservations" ON public.reservations 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations" ON public.reservations 
FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 7. INVOICES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')) DEFAULT 'Pending',
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
        ALTER TABLE public.invoices ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;
CREATE POLICY "Staff can manage invoices" ON public.invoices 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices 
FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 8. STAFF
-- ==========================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('Manager', 'Receptionist', 'Housekeeper', 'Security', 'Chef', 'Staff')) DEFAULT 'Staff',
  status TEXT DEFAULT 'Active',
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely handle schema migration
DO $$
BEGIN
    -- Rename hotel_id to property_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hotel_id') THEN
        ALTER TABLE public.staff RENAME COLUMN hotel_id TO property_id;
    END IF;

    -- Add property_id if it doesn't exist (and wasn't renamed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'property_id') THEN
        ALTER TABLE public.staff ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Owners can manage staff" ON public.staff;
CREATE POLICY "Admins and Owners can manage staff" ON public.staff 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Enable Realtime for new tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'maintenance_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'complaints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
  END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'invoices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff;
  END IF;
END;
$$;
