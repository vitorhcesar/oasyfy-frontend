
ALTER TABLE public.seller_fees
ADD COLUMN withdrawal_min_amount integer NOT NULL DEFAULT 0,
ADD COLUMN withdrawal_max_amount integer NOT NULL DEFAULT 0,
ADD COLUMN withdrawal_daily_max integer NOT NULL DEFAULT 0;
