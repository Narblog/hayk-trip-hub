-- 1. Split public-role read policies so anonymous visitors never need role-check helpers
DROP POLICY IF EXISTS "public sees approved" ON public.properties;
CREATE POLICY "anon sees approved properties" ON public.properties
  FOR SELECT TO anon
  USING (status = 'APPROVED'::listing_status AND is_active);
CREATE POLICY "auth sees approved or own properties" ON public.properties
  FOR SELECT TO authenticated
  USING (((status = 'APPROVED'::listing_status) AND is_active) OR owner_id = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS "tours public read" ON public.tours;
CREATE POLICY "anon sees approved tours" ON public.tours
  FOR SELECT TO anon
  USING (status = 'APPROVED'::listing_status);
CREATE POLICY "auth sees approved or own tours" ON public.tours
  FOR SELECT TO authenticated
  USING (status = 'APPROVED'::listing_status OR owner_id = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS "reviews read approved" ON public.reviews;
CREATE POLICY "anon reads approved reviews" ON public.reviews
  FOR SELECT TO anon
  USING (status = 'APPROVED'::review_status);
CREATE POLICY "auth reads approved or own reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (status = 'APPROVED'::review_status OR user_id = auth.uid() OR private.is_admin());

-- 2. Remove anonymous access to SECURITY DEFINER role helpers entirely
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE USAGE ON SCHEMA private FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- 3. Ensure no SECURITY DEFINER function in public is callable by PUBLIC
REVOKE ALL ON FUNCTION public.become_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_owner() TO authenticated;
REVOKE ALL ON FUNCTION public.increment_property_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tour_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_property_rating() FROM PUBLIC, anon, authenticated;

-- 4. Roles table stays read-only for app users (no self-granted owner/admin)
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 5. Status history is written only by internal triggers
REVOKE INSERT, UPDATE, DELETE ON public.property_status_history FROM anon, authenticated;
GRANT SELECT ON public.property_status_history TO authenticated;
GRANT ALL ON public.property_status_history TO service_role;