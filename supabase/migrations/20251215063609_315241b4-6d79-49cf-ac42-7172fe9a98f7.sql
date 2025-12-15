-- Create admin_banners table for promotional banners
CREATE TABLE public.admin_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'sellers', 'public'
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_banners ENABLE ROW LEVEL SECURITY;

-- Admins can manage all banners
CREATE POLICY "Admins can manage banners"
ON public.admin_banners
FOR ALL
USING (is_admin(auth.uid()));

-- Everyone can view active banners
CREATE POLICY "Public can view active banners"
ON public.admin_banners
FOR SELECT
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now()) 
  AND (ends_at IS NULL OR ends_at > now())
);

-- Create index for efficient querying
CREATE INDEX idx_admin_banners_active ON public.admin_banners(is_active, target_audience, sort_order);