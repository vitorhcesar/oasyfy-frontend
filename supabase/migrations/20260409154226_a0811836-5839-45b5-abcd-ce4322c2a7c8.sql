ALTER TABLE public.global_fees
  ADD COLUMN IF NOT EXISTS withdrawal_min_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_max_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_daily_max integer NOT NULL DEFAULT 0;