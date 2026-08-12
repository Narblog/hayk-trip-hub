INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u WHERE u.email = 'admin@hyur.am'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role FROM auth.users u WHERE u.email = 'owner@hyur.am'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'traveler'::app_role FROM auth.users u WHERE u.email = 'traveler@hyur.am'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.properties SET owner_id = (SELECT id FROM auth.users WHERE email='owner@hyur.am')
WHERE owner_id IS NULL;

UPDATE public.tours SET owner_id = (SELECT id FROM auth.users WHERE email='owner@hyur.am')
WHERE owner_id IS NULL;