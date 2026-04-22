
CREATE TABLE public.acquirer_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  logo_key text,
  api_url text NOT NULL,
  access_token text DEFAULT '',
  hmac_key text DEFAULT '',
  branch_id text DEFAULT '',
  account_number text DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'disconnected',
  methods text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.acquirer_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage acquirer connections"
ON public.acquirer_connections
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_acquirer_connections_updated_at
BEFORE UPDATE ON public.acquirer_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
