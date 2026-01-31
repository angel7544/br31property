-- Migration for Enhanced PMS Features

-- 1. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  room_id UUID REFERENCES public.rooms(id),
  reservation_id UUID REFERENCES public.reservations(id),
  amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT CHECK (status IN ('Paid', 'Pending', 'Overdue', 'Cancelled')) DEFAULT 'Pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage invoices" ON public.invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

-- 2. MAINTENANCE REQUESTS
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id),
  room_id UUID REFERENCES public.rooms(id),
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  assigned_to UUID REFERENCES public.staff(id), -- If you want to assign to specific staff
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage maintenance" ON public.maintenance_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own maintenance" ON public.maintenance_requests FOR ALL USING (auth.uid() = user_id);

-- 3. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0, -- Reorder level
  unit_price NUMERIC,
  last_restocked DATE,
  status TEXT CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')) DEFAULT 'In Stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL USING (auth.role() = 'authenticated');

-- 4. COMPLAINTS (Distinct from Maintenance, maybe for noise, behavior etc.)
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('New', 'Investigating', 'Resolved', 'Dismissed')) DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage complaints" ON public.complaints FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own complaints" ON public.complaints FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'invoices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
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
END;
$$;
