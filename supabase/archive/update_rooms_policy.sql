-- Migration to update RLS policy for rooms to allow public access to all rooms
-- This allows the website to display "Booked" or "Unavailable" rooms instead of hiding them

-- Drop the old restricted policy
DROP POLICY IF EXISTS "Public can view active rooms" ON rooms;

-- Create new permissive policy
CREATE POLICY "Public can view all rooms" ON rooms FOR SELECT USING (true);
