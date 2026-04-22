ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_manually_approved boolean NOT NULL DEFAULT false;