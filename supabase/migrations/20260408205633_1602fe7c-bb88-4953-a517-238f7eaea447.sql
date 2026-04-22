ALTER TABLE public.kyc_submissions 
ADD COLUMN documents_status text NOT NULL DEFAULT 'pending' 
CHECK (documents_status IN ('pending', 'approved', 'rejected'));