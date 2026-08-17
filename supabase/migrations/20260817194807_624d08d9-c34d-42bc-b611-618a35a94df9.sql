
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon, authenticated, service_role;

DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, cmd,
           array_to_string(roles, ', ') AS roles_txt, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (qual LIKE '%is_admin%' OR qual LIKE '%has_role%'
           OR with_check LIKE '%is_admin%' OR with_check LIKE '%has_role%')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
      r.policyname, r.schemaname, r.tablename, r.permissive, r.cmd, r.roles_txt,
      CASE WHEN r.qual IS NULL THEN ''
           ELSE 'USING (' || replace(replace(r.qual, 'is_admin()', 'private.is_admin()'), 'has_role(', 'private.has_role(') || ')' END,
      CASE WHEN r.with_check IS NULL THEN ''
           ELSE 'WITH CHECK (' || replace(replace(r.with_check, 'is_admin()', 'private.is_admin()'), 'has_role(', 'private.has_role(') || ')' END);
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

DROP POLICY IF EXISTS "availability read" ON public.availability;
CREATE POLICY "availability read" ON public.availability FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = availability.property_id
  AND ((p.status = 'APPROVED'::listing_status AND p.is_active) OR p.owner_id = auth.uid() OR private.is_admin())));

DROP POLICY IF EXISTS "pa read" ON public.property_amenities;
CREATE POLICY "pa read" ON public.property_amenities FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_amenities.property_id
  AND ((p.status = 'APPROVED'::listing_status AND p.is_active) OR p.owner_id = auth.uid() OR private.is_admin())));

DROP POLICY IF EXISTS "images read" ON public.property_images;
CREATE POLICY "images read" ON public.property_images FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_images.property_id
  AND ((p.status = 'APPROVED'::listing_status AND p.is_active) OR p.owner_id = auth.uid() OR private.is_admin())));

DROP POLICY IF EXISTS "units read" ON public.property_units;
CREATE POLICY "units read" ON public.property_units FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_units.property_id
  AND ((p.status = 'APPROVED'::listing_status AND p.is_active) OR p.owner_id = auth.uid() OR private.is_admin())));

DROP POLICY IF EXISTS "tour images read" ON public.tour_images;
CREATE POLICY "tour images read" ON public.tour_images FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_images.tour_id
  AND (t.status = 'APPROVED'::listing_status OR t.owner_id = auth.uid() OR private.is_admin())));
