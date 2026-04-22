
CREATE TABLE public.smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host text NOT NULL DEFAULT '',
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT '',
  encryption text NOT NULL DEFAULT 'tls',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view SMTP settings"
ON public.smtp_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert SMTP settings"
ON public.smtp_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update SMTP settings"
ON public.smtp_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete SMTP settings"
ON public.smtp_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_smtp_settings_updated_at
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
