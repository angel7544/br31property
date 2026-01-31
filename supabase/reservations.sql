-- Reservations Table for PMS
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

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage reservations" ON public.reservations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);

-- Add realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
END;
$$;
