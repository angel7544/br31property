-- Fix Admin Features (Rooms, Enquiries, Staff, Complaints)

-- ==========================================
-- 1. ROOMS RLS
-- ==========================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Owners can insert rooms" ON public.rooms;
CREATE POLICY "Admins and Owners can insert rooms" ON public.rooms 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = rooms.property_id 
    AND (
      -- Admin can add to any property
      (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        ((auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin')
      )
      OR
      -- Owner must own the property
      (owner_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Admins and Owners can update rooms" ON public.rooms;
CREATE POLICY "Admins and Owners can update rooms" ON public.rooms 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = rooms.property_id 
    AND (
      (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        ((auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin')
      )
      OR
      (owner_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Admins and Owners can delete rooms" ON public.rooms;
CREATE POLICY "Admins and Owners can delete rooms" ON public.rooms 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = rooms.property_id 
    AND (
      (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        ((auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin')
      )
      OR
      (owner_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Everyone can view rooms" ON public.rooms;
CREATE POLICY "Everyone can view rooms" ON public.rooms FOR SELECT USING (true);


-- ==========================================
-- 2. ENQUIRIES RLS (Fix "not fetching" and "requests")
-- ==========================================
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow PUBLIC to insert enquiries (Critical for contact forms)
DROP POLICY IF EXISTS "Public can create enquiries" ON public.enquiries;
CREATE POLICY "Public can create enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);

-- Allow Admins/Owners/Staff to VIEW all enquiries
DROP POLICY IF EXISTS "Staff can view enquiries" ON public.enquiries;
CREATE POLICY "Staff can view enquiries" ON public.enquiries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff'
  )
);

-- Allow Admins/Owners/Staff to UPDATE enquiries (status, room assignment)
DROP POLICY IF EXISTS "Staff can update enquiries" ON public.enquiries;
CREATE POLICY "Staff can update enquiries" ON public.enquiries FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff'
  )
);

-- ==========================================
-- 3. STAFF RLS (Fix "unable to create")
-- ==========================================
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Owners can manage staff" ON public.staff;
CREATE POLICY "Admins and Owners can manage staff" ON public.staff 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ) OR
  (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner'
  )
);

DROP POLICY IF EXISTS "Staff can view themselves" ON public.staff;
CREATE POLICY "Staff can view themselves" ON public.staff FOR SELECT USING (
  auth.uid() = id OR
  email = (auth.jwt() ->> 'email')
);


-- ==========================================
-- 4. CALL REQUESTS / COMPLAINTS (Tickets)
-- ==========================================
-- Ensure complaints table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'Open',
    priority TEXT DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Align columns with UI (subject, property_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'subject') THEN
        ALTER TABLE public.complaints ADD COLUMN subject TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'property_id') THEN
        ALTER TABLE public.complaints ADD COLUMN property_id UUID REFERENCES public.properties(id);
    END IF;
END $$;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all complaints" ON public.complaints;
CREATE POLICY "Staff can view all complaints" ON public.complaints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff'
  )
);

DROP POLICY IF EXISTS "Staff can update complaints" ON public.complaints;
CREATE POLICY "Staff can update complaints" ON public.complaints FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  ) OR
  (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff'
  )
);
