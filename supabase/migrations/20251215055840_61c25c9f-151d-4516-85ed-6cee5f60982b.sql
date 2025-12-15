-- Add location fields to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Haiti',
ADD COLUMN IF NOT EXISTS city TEXT;