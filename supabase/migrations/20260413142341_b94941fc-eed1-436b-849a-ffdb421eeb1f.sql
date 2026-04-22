
CREATE TABLE public.gateway_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color text NOT NULL DEFAULT '152 60% 42%',
  primary_foreground text NOT NULL DEFAULT '0 0% 100%',
  background_color text NOT NULL DEFAULT '0 0% 99%',
  foreground_color text NOT NULL DEFAULT '150 15% 10%',
  card_color text NOT NULL DEFAULT '0 0% 100%',
  card_foreground text NOT NULL DEFAULT '150 15% 10%',
  border_color text NOT NULL DEFAULT '150 10% 92%',
  muted_color text NOT NULL DEFAULT '150 10% 96%',
  muted_foreground text NOT NULL DEFAULT '150 8% 32%',
  accent_color text NOT NULL DEFAULT '150 20% 96%',
  accent_foreground text NOT NULL DEFAULT '150 15% 10%',
  destructive_color text NOT NULL DEFAULT '0 72% 55%',
  success_color text NOT NULL DEFAULT '152 60% 42%',
  warning_color text NOT NULL DEFAULT '38 90% 50%',
  dark_primary_color text NOT NULL DEFAULT '152 60% 45%',
  dark_background_color text NOT NULL DEFAULT '160 15% 5%',
  dark_foreground_color text NOT NULL DEFAULT '150 10% 95%',
  dark_card_color text NOT NULL DEFAULT '160 12% 8%',
  dark_card_foreground text NOT NULL DEFAULT '150 10% 95%',
  dark_border_color text NOT NULL DEFAULT '155 10% 15%',
  dark_muted_color text NOT NULL DEFAULT '155 10% 12%',
  dark_muted_foreground text NOT NULL DEFAULT '150 8% 68%',
  dark_accent_color text NOT NULL DEFAULT '155 12% 13%',
  dark_accent_foreground text NOT NULL DEFAULT '150 10% 93%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gateway_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gateway theme"
  ON public.gateway_theme FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view gateway theme"
  ON public.gateway_theme FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.gateway_theme (id) VALUES (gen_random_uuid());
