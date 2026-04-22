
-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  method TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- API Routes table
CREATE TABLE public.api_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  target_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_routes"
  ON public.api_routes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gateway Logs table
CREATE TABLE public.gateway_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  source TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  route_id UUID REFERENCES public.api_routes(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gateway_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON public.gateway_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert logs"
  ON public.gateway_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_logs_level ON public.gateway_logs(level);
CREATE INDEX idx_logs_created ON public.gateway_logs(created_at DESC);

-- Auto-update timestamps
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_routes_updated_at
  BEFORE UPDATE ON public.api_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
