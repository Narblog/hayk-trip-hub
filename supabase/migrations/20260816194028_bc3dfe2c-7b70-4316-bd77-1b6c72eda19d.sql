CREATE TABLE public.property_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  old_status public.listing_status,
  new_status public.listing_status NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.property_status_history TO authenticated;
GRANT ALL ON public.property_status_history TO service_role;

ALTER TABLE public.property_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or admin reads status history"
ON public.property_status_history FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
);

CREATE INDEX idx_property_status_history_property ON public.property_status_history(property_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_property_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.property_status_history (property_id, old_status, new_status, note, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.admin_note, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.property_status_history (property_id, old_status, new_status, note, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.admin_note, auth.uid());
  END IF;
  RETURN NULL;
END; $$;

REVOKE EXECUTE ON FUNCTION public.log_property_status() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_log_property_status
AFTER INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.log_property_status();

INSERT INTO public.property_status_history (property_id, old_status, new_status, note, changed_by, created_at)
SELECT id, NULL, status, admin_note, owner_id, created_at FROM public.properties;

-- Only hosts (owner role) or admins may create listings
DROP POLICY IF EXISTS "owner inserts own" ON public.properties;
CREATE POLICY "owner inserts own"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND status = ANY (ARRAY['DRAFT'::public.listing_status, 'PENDING_REVIEW'::public.listing_status])
  AND (public.has_role(auth.uid(), 'owner') OR public.is_admin())
);

-- Self-service upgrade to host account
CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;
END; $$;

REVOKE EXECUTE ON FUNCTION public.become_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_owner() TO authenticated;