
CREATE TABLE public.global_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pix_variable_fee numeric NOT NULL DEFAULT 0,
  pix_fixed_fee numeric NOT NULL DEFAULT 0,
  pix_min_fee numeric NOT NULL DEFAULT 0,
  pix_retention_days integer NOT NULL DEFAULT 0,
  pix_retention_fee numeric NOT NULL DEFAULT 0,
  card_variable_fee numeric NOT NULL DEFAULT 0,
  card_fixed_fee numeric NOT NULL DEFAULT 0,
  card_min_fee numeric NOT NULL DEFAULT 0,
  card_retention_days integer NOT NULL DEFAULT 0,
  card_retention_fee numeric NOT NULL DEFAULT 0,
  boleto_variable_fee numeric NOT NULL DEFAULT 0,
  boleto_fixed_fee numeric NOT NULL DEFAULT 0,
  boleto_min_fee numeric NOT NULL DEFAULT 0,
  boleto_retention_days integer NOT NULL DEFAULT 0,
  boleto_retention_fee numeric NOT NULL DEFAULT 0,
  crypto_variable_fee numeric NOT NULL DEFAULT 0,
  crypto_fixed_fee numeric NOT NULL DEFAULT 0,
  crypto_min_fee numeric NOT NULL DEFAULT 0,
  crypto_retention_days integer NOT NULL DEFAULT 0,
  crypto_retention_fee numeric NOT NULL DEFAULT 0,
  withdrawal_variable_fee numeric NOT NULL DEFAULT 0,
  withdrawal_fixed_fee numeric NOT NULL DEFAULT 0,
  withdrawal_min_fee numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.global_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global fees"
ON public.global_fees FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view global fees"
ON public.global_fees FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'seller'));

CREATE TRIGGER update_global_fees_updated_at
BEFORE UPDATE ON public.global_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a single default row
INSERT INTO public.global_fees (id) VALUES (gen_random_uuid());
