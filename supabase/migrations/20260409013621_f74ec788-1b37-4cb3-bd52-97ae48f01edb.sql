
-- Add lock and fake refund support to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_fake_refund boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS lock_reason text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS acquirer text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee_amount integer NOT NULL DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS net_amount integer NOT NULL DEFAULT 0;
