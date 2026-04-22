ALTER TABLE public.kyc_submissions
ADD COLUMN IF NOT EXISTS withdrawal_block_reason text DEFAULT null;