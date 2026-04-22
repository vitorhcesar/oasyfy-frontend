
-- Add account_id column to profiles
ALTER TABLE public.profiles
ADD COLUMN account_id text UNIQUE DEFAULT NULL;

-- Create function to generate readable account IDs
CREATE OR REPLACE FUNCTION public.generate_account_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    NEW.account_id := 'OAS-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate account_id
CREATE TRIGGER set_account_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_account_id();

-- Backfill existing profiles
UPDATE public.profiles
SET account_id = 'OAS-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 10))
WHERE account_id IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN account_id SET DEFAULT '';
