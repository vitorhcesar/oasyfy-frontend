
CREATE TABLE public.seller_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  
  -- Pix fees
  pix_fixed_fee numeric(10,2) NOT NULL DEFAULT 0,
  pix_variable_fee numeric(6,4) NOT NULL DEFAULT 0,
  pix_min_fee numeric(10,2) NOT NULL DEFAULT 0,
  pix_retention_fee numeric(6,4) NOT NULL DEFAULT 0,
  pix_retention_days integer NOT NULL DEFAULT 0,
  
  -- Card fees
  card_fixed_fee numeric(10,2) NOT NULL DEFAULT 0,
  card_variable_fee numeric(6,4) NOT NULL DEFAULT 0,
  card_min_fee numeric(10,2) NOT NULL DEFAULT 0,
  card_retention_fee numeric(6,4) NOT NULL DEFAULT 0,
  card_retention_days integer NOT NULL DEFAULT 0,
  
  -- Boleto fees
  boleto_fixed_fee numeric(10,2) NOT NULL DEFAULT 0,
  boleto_variable_fee numeric(6,4) NOT NULL DEFAULT 0,
  boleto_min_fee numeric(10,2) NOT NULL DEFAULT 0,
  boleto_retention_fee numeric(6,4) NOT NULL DEFAULT 0,
  boleto_retention_days integer NOT NULL DEFAULT 0,
  
  -- Crypto fees
  crypto_fixed_fee numeric(10,2) NOT NULL DEFAULT 0,
  crypto_variable_fee numeric(6,4) NOT NULL DEFAULT 0,
  crypto_min_fee numeric(10,2) NOT NULL DEFAULT 0,
  crypto_retention_fee numeric(6,4) NOT NULL DEFAULT 0,
  crypto_retention_days integer NOT NULL DEFAULT 0,
  
  -- Withdrawal fees
  withdrawal_fixed_fee numeric(10,2) NOT NULL DEFAULT 0,
  withdrawal_variable_fee numeric(6,4) NOT NULL DEFAULT 0,
  withdrawal_min_fee numeric(10,2) NOT NULL DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(seller_id)
);

ALTER TABLE public.seller_fees ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage seller fees"
ON public.seller_fees
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sellers can view their own fees
CREATE POLICY "Sellers can view own fees"
ON public.seller_fees
FOR SELECT
USING (auth.uid() = seller_id);

-- Auto-update updated_at
CREATE TRIGGER update_seller_fees_updated_at
BEFORE UPDATE ON public.seller_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
