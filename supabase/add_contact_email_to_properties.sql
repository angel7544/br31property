-- Add contact_number and email columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;
