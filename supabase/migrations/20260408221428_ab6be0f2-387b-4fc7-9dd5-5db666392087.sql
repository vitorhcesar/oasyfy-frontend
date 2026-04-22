
CREATE TABLE public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own login logs"
ON public.login_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own login logs"
ON public.login_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login logs"
ON public.login_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));
