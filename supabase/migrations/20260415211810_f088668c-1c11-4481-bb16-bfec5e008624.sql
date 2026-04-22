DROP TRIGGER IF EXISTS set_account_id ON public.profiles;
CREATE TRIGGER set_account_id BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION generate_account_id();