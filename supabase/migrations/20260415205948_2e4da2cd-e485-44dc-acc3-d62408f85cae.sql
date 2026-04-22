CREATE TABLE public.crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL DEFAULT '',
  api_token text NOT NULL DEFAULT '',
  instance_name text NOT NULL DEFAULT '',
  welcome_message text NOT NULL DEFAULT 'Olá {name}! 🎉 Bem-vindo(a) à nossa plataforma! Sua conta foi verificada com sucesso. Estamos aqui para ajudá-lo(a) no que precisar.',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM settings"
ON public.crm_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));