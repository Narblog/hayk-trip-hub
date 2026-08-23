-- 1. Ownership checks on analytics inserts
DROP POLICY IF EXISTS "contact insert anyone" ON public.contact_events;
CREATE POLICY "contact insert anyone" ON public.contact_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "views insert anyone" ON public.property_views;
CREATE POLICY "views insert anyone" ON public.property_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "search insert" ON public.search_events;
CREATE POLICY "search insert" ON public.search_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 2. View counter via trigger (not directly callable)
CREATE OR REPLACE FUNCTION public.bump_property_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
     SET view_count = view_count + 1
   WHERE id = NEW.property_id
     AND status = 'APPROVED'::listing_status
     AND is_active;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_property_view_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bump_property_view_count ON public.property_views;
CREATE TRIGGER trg_bump_property_view_count
AFTER INSERT ON public.property_views
FOR EACH ROW EXECUTE FUNCTION public.bump_property_view_count();

-- increment_property_view becomes SECURITY INVOKER (RLS applies)
CREATE OR REPLACE FUNCTION public.increment_property_view(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_property_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = p_property_id AND status = 'APPROVED'::listing_status AND is_active
  ) THEN
    RETURN;
  END IF;
  INSERT INTO public.property_views (property_id, user_id) VALUES (p_property_id, auth.uid());
END;
$$;

-- 3. become_owner becomes SECURITY INVOKER backed by a self-scoped policy
GRANT INSERT ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS "self grant owner role" ON public.user_roles;
CREATE POLICY "self grant owner role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'owner'::app_role);

CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'owner') ON CONFLICT DO NOTHING;
END;
$$;