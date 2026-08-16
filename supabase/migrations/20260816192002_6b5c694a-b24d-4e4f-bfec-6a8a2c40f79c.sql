DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles readable by owner or admin"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());
REVOKE SELECT ON public.profiles FROM anon;

REVOKE ALL ON FUNCTION public.guard_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tour_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_property_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_property_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;