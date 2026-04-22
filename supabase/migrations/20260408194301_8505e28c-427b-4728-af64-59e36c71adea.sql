
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'signup',
  attempts INTEGER NOT NULL DEFAULT 1,
  blocked_until TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ip_address, action)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Cleanup old entries automatically (older than 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE last_attempt_at < now() - interval '24 hours';
END;
$$;
