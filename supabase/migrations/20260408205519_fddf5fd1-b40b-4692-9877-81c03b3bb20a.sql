ALTER TABLE public.kyc_submissions 
ADD COLUMN bank_status text NOT NULL DEFAULT 'pending' 
CHECK (bank_status IN ('pending', 'approved', 'rejected'));