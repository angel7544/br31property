
-- 1. Fix Enquiries Schema
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Ensure property_id exists and references properties
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'property_id') THEN
    ALTER TABLE public.enquiries ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add Popup support to Offers
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT false;

-- 3. Fix Staff table constraint if needed (ensure property_id is used)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hotel_id') THEN
    ALTER TABLE public.staff RENAME COLUMN hotel_id TO property_id;
  END IF;
END $$;

-- 4. Rename Testimonials column
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'hotel_highlights') THEN
    ALTER TABLE public.testimonials RENAME COLUMN hotel_highlights TO property_highlights;
  END IF;
END $$;
