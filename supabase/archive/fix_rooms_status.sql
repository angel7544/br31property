-- Migration to fix rooms status constraint and sync data
-- 1. Update check constraint to include 'Booked'
-- 2. Sync rooms status with active reservations

-- Drop existing constraint (name might vary, trying standard naming or just replacing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check') THEN
        ALTER TABLE rooms DROP CONSTRAINT rooms_status_check;
    END IF;
END $$;

-- Add updated constraint
ALTER TABLE rooms 
ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('Available', 'Occupied', 'Reserved', 'Blocked', 'Maintenance', 'Booked'));

-- Sync data: Mark rooms as 'Booked' if they have active reservations
UPDATE rooms
SET status = 'Booked'
WHERE id IN (
    SELECT room_id FROM reservations 
    WHERE status IN ('Confirmed', 'Checked In')
);

-- Optional: Set rooms back to 'Available' if they don't have active reservations (and aren't blocked/maintenance)
UPDATE rooms
SET status = 'Available'
WHERE id NOT IN (
    SELECT room_id FROM reservations 
    WHERE status IN ('Confirmed', 'Checked In')
)
AND status NOT IN ('Blocked', 'Maintenance');
