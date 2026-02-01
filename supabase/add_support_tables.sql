
-- Create call_requests table
CREATE TABLE IF NOT EXISTS public.call_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Called', 'Closed')) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for call_requests
ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create call requests" ON public.call_requests;
CREATE POLICY "Users can create call requests" ON public.call_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own call requests" ON public.call_requests;
CREATE POLICY "Users can view their own call requests" ON public.call_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage call requests" ON public.call_requests;
CREATE POLICY "Staff can manage call requests" ON public.call_requests FOR ALL USING (
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

-- Update complaints table to support new fields
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS issue_type TEXT;

-- Ensure RLS allows creation
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON public.complaints;
CREATE POLICY "Authenticated users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
