
CREATE TABLE public.gateway_routing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method text NOT NULL,
  acquirer_id uuid NOT NULL REFERENCES public.acquirer_connections(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  weight integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_routing_method_acquirer ON public.gateway_routing_rules(method, acquirer_id);

ALTER TABLE public.gateway_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage routing rules"
ON public.gateway_routing_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gateway_routing_rules_updated_at
BEFORE UPDATE ON public.gateway_routing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
