CREATE OR REPLACE FUNCTION public.generate_account_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  new_id TEXT;
  retries INT := 0;
BEGIN
  IF NEW.account_id IS NULL OR NEW.account_id = '' THEN
    LOOP
      new_id := 'OAS-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 12));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE account_id = new_id);
      retries := retries + 1;
      IF retries > 10 THEN
        RAISE EXCEPTION 'Could not generate unique account_id after 10 attempts';
      END IF;
    END LOOP;
    NEW.account_id := new_id;
  END IF;
  RETURN NEW;
END;
$function$;