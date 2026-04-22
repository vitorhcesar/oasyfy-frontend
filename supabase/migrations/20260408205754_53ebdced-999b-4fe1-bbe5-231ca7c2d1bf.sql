ALTER TABLE public.kyc_submissions 
ADD COLUMN documents_review jsonb NOT NULL DEFAULT '{}'::jsonb;