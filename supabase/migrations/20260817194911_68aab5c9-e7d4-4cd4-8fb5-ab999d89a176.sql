
CREATE OR REPLACE FUNCTION public.increment_property_view(p_property_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_property_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = p_property_id AND status = 'APPROVED'::listing_status AND is_active
  ) THEN
    RETURN;
  END IF;
  UPDATE public.properties SET view_count = view_count + 1 WHERE id = p_property_id;
  INSERT INTO public.property_views (property_id, user_id) VALUES (p_property_id, auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.increment_property_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'owner') ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.become_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.become_owner() TO authenticated, service_role;
