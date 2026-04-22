
-- Create refund status enum
CREATE TYPE public.refund_status AS ENUM ('pending', 'approved', 'rejected');

-- Create refund requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status public.refund_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage refund requests"
ON public.refund_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sellers can view their own refund requests
CREATE POLICY "Sellers can view own refund requests"
ON public.refund_requests
FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Sellers can create refund requests
CREATE POLICY "Sellers can create refund requests"
ON public.refund_requests
FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid());
