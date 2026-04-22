
CREATE TABLE public.authorized_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, ip_address)
);

ALTER TABLE public.authorized_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own ips" ON public.authorized_ips FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own ips" ON public.authorized_ips FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own ips" ON public.authorized_ips FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY "Admins can view all ips" ON public.authorized_ips FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
