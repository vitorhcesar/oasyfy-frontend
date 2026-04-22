
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own api keys"
ON public.api_keys FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own api keys"
ON public.api_keys FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own api keys"
ON public.api_keys FOR DELETE
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all api keys"
ON public.api_keys FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
