
ALTER TABLE public.kyc_submissions
ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN withdrawals_blocked boolean NOT NULL DEFAULT false;
