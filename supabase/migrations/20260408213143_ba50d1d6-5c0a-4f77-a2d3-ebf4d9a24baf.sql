ALTER TABLE public.kyc_submissions
ADD COLUMN address_status text NOT NULL DEFAULT 'pending';