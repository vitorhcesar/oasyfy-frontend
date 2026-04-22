CREATE TABLE public.acquirer_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acquirer_id UUID NOT NULL REFERENCES public.acquirer_connections(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('deposit', 'withdrawal')),
  method TEXT NOT NULL,
  fixed_cost NUMERIC NOT NULL DEFAULT 0,
  variable_cost NUMERIC NOT NULL DEFAULT 0,
  min_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (acquirer_id, operation_type, method)
);

ALTER TABLE public.acquirer_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage acquirer costs"
  ON public.acquirer_costs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_acquirer_costs_updated_at
  BEFORE UPDATE ON public.acquirer_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();