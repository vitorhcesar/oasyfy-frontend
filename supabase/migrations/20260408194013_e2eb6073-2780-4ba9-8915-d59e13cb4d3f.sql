
INSERT INTO public.user_roles (user_id, role)
VALUES ('be053c79-85cf-4840-9e8d-6d65a190b988', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
