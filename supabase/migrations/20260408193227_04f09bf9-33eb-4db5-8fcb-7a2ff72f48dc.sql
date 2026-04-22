
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@paygate.com'
ON CONFLICT (user_id, role) DO NOTHING;
