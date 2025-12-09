-- Create payment methods enum
CREATE TYPE public.payment_method AS ENUM ('stripe', 'moncash', 'transfer');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'verified', 'rejected');

-- Create sellers table for B2B vendors
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create B2B payments table
CREATE TABLE public.b2b_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method payment_method NOT NULL,
  reference TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sellers
CREATE POLICY "Admins can view all sellers"
ON public.sellers FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage sellers"
ON public.sellers FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for b2b_payments
CREATE POLICY "Admins can view all payments"
ON public.b2b_payments FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage payments"
ON public.b2b_payments FOR ALL
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at on sellers
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on b2b_payments
CREATE TRIGGER update_b2b_payments_updated_at
BEFORE UPDATE ON public.b2b_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate payment number
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate payment number
CREATE TRIGGER generate_payment_number_trigger
BEFORE INSERT ON public.b2b_payments
FOR EACH ROW
EXECUTE FUNCTION public.generate_payment_number();