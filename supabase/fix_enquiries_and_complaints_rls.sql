-- Fix Enquiries, Complaints, and Call Requests for Admin Dashboard

-- 1. Make property_id optional in enquiries (for general contact form)
DO $$
BEGIN
    ALTER TABLE public.enquiries ALTER COLUMN property_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Enable Admins/Staff to view all enquiries
DROP POLICY IF EXISTS "Staff can view all enquiries" ON public.enquiries;
CREATE POLICY "Staff can view all enquiries" ON public.enquiries FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 3. Enable Admins/Staff to manage (update/delete) enquiries
DROP POLICY IF EXISTS "Staff can manage enquiries" ON public.enquiries;
CREATE POLICY "Staff can manage enquiries" ON public.enquiries FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 4. Enable Admins/Staff to view all complaints
DROP POLICY IF EXISTS "Staff can view all complaints" ON public.complaints;
CREATE POLICY "Staff can view all complaints" ON public.complaints FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 5. Enable Admins/Staff to manage complaints
DROP POLICY IF EXISTS "Staff can manage complaints" ON public.complaints;
CREATE POLICY "Staff can manage complaints" ON public.complaints FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 6. Ensure complaints table has property_id foreign key
DO $$
BEGIN
    -- Add property_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'complaints'
        AND column_name = 'property_id'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;

    -- Ensure it references properties
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'complaints' AND constraint_name = 'complaints_property_id_fkey'
    ) THEN
        BEGIN
            ALTER TABLE public.complaints 
            ADD CONSTRAINT complaints_property_id_fkey 
            FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- 7. Fix Call Requests FK to point to profiles (crucial for Admin Dashboard fetch)
DO $$
BEGIN
    -- Only alter if the constraint points to auth.users (default name usually)
    -- We'll just try to drop the old one and add the new one.
    BEGIN
        ALTER TABLE public.call_requests DROP CONSTRAINT IF EXISTS call_requests_user_id_fkey;
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;

    -- Add the correct FK to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'call_requests' AND constraint_name = 'call_requests_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.call_requests 
        ADD CONSTRAINT call_requests_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Enable Admins/Staff to view call requests
DROP POLICY IF EXISTS "Staff can view call requests" ON public.call_requests;
CREATE POLICY "Staff can view call requests" ON public.call_requests FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);

-- 9. Enable Admins/Staff to manage call requests
DROP POLICY IF EXISTS "Staff can manage call requests" ON public.call_requests;
CREATE POLICY "Staff can manage call requests" ON public.call_requests FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'owner' OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'staff' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff', 'manager')
  )
);
