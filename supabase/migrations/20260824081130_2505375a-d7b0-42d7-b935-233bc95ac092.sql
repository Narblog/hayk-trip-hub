-- ===== PART 1: property_events =====
CREATE TABLE IF NOT EXISTS public.property_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_token text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('property_view','phone_click','whatsapp_click','instagram_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.property_events TO authenticated;
GRANT ALL ON public.property_events TO service_role;

ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners and admins read own property events"
  ON public.property_events FOR SELECT TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_events.property_id AND p.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_property_events_prop_time ON public.property_events (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_events_visitor ON public.property_events (visitor_token, created_at DESC);

-- secure write path
CREATE OR REPLACE FUNCTION public.track_property_event(
  p_property_id uuid,
  p_event_type text,
  p_visitor_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_recent int;
BEGIN
  IF p_property_id IS NULL OR p_event_type IS NULL THEN RETURN false; END IF;
  IF p_event_type NOT IN ('property_view','phone_click','whatsapp_click','instagram_click') THEN RETURN false; END IF;

  v_token := left(coalesce(nullif(trim(p_visitor_token), ''), 'anon'), 64);

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id) THEN RETURN false; END IF;

  -- basic spam guard: max 300 events per visitor token per hour
  SELECT count(*) INTO v_recent FROM public.property_events
   WHERE visitor_token = v_token AND created_at > now() - interval '1 hour';
  IF v_recent > 300 THEN RETURN false; END IF;

  IF p_event_type = 'property_view' THEN
    -- unique view once per property per visitor per 24h
    IF EXISTS (
      SELECT 1 FROM public.property_events
       WHERE property_id = p_property_id AND visitor_token = v_token
         AND event_type = 'property_view' AND created_at > now() - interval '24 hours'
    ) THEN RETURN false; END IF;
  ELSE
    -- throttle rapid duplicate contact clicks
    IF EXISTS (
      SELECT 1 FROM public.property_events
       WHERE property_id = p_property_id AND visitor_token = v_token
         AND event_type = p_event_type AND created_at > now() - interval '60 seconds'
    ) THEN RETURN false; END IF;
  END IF;

  INSERT INTO public.property_events (property_id, user_id, visitor_token, event_type)
  VALUES (p_property_id, auth.uid(), v_token, p_event_type);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.track_property_event(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_property_event(uuid, text, text) TO anon, authenticated;

-- aggregated reporting (owners: own properties, admins: all)
CREATE OR REPLACE FUNCTION public.property_analytics_overview(
  p_from timestamptz DEFAULT NULL,
  p_property_id uuid DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL
) RETURNS TABLE(
  property_id uuid,
  property_name text,
  slug text,
  status listing_status,
  is_active boolean,
  owner_id uuid,
  unique_visitors bigint,
  total_views bigint,
  contact_clicks bigint,
  phone_clicks bigint,
  whatsapp_clicks bigint,
  instagram_clicks bigint,
  unique_contacted bigint,
  avg_rating numeric,
  review_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE v_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_admin := private.is_admin();

  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.status, p.is_active, p.owner_id,
    count(DISTINCT e.visitor_token) FILTER (WHERE e.event_type = 'property_view'),
    count(*) FILTER (WHERE e.event_type = 'property_view'),
    count(*) FILTER (WHERE e.event_type <> 'property_view'),
    count(*) FILTER (WHERE e.event_type = 'phone_click'),
    count(*) FILTER (WHERE e.event_type = 'whatsapp_click'),
    count(*) FILTER (WHERE e.event_type = 'instagram_click'),
    count(DISTINCT e.visitor_token) FILTER (WHERE e.event_type <> 'property_view'),
    COALESCE((SELECT round(avg(r.rating)::numeric, 2) FROM public.reviews r WHERE r.property_id = p.id AND r.status = 'APPROVED'), 0),
    (SELECT count(*) FROM public.reviews r WHERE r.property_id = p.id AND r.status = 'APPROVED')
  FROM public.properties p
  LEFT JOIN public.property_events e
    ON e.property_id = p.id AND (p_from IS NULL OR e.created_at >= p_from)
  WHERE (v_admin OR p.owner_id = auth.uid())
    AND (p_property_id IS NULL OR p.id = p_property_id)
    AND (p_owner_id IS NULL OR p.owner_id = p_owner_id)
  GROUP BY p.id
  ORDER BY count(*) FILTER (WHERE e.event_type = 'property_view') DESC, p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.property_analytics_overview(timestamptz, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_analytics_overview(timestamptz, uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.property_analytics_daily(
  p_from timestamptz DEFAULT NULL,
  p_property_id uuid DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL
) RETURNS TABLE(day date, views bigint, contacts bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE v_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_admin := private.is_admin();

  RETURN QUERY
  SELECT (e.created_at AT TIME ZONE 'UTC')::date AS day,
         count(*) FILTER (WHERE e.event_type = 'property_view'),
         count(*) FILTER (WHERE e.event_type <> 'property_view')
  FROM public.property_events e
  JOIN public.properties p ON p.id = e.property_id
  WHERE (v_admin OR p.owner_id = auth.uid())
    AND (p_from IS NULL OR e.created_at >= p_from)
    AND (p_property_id IS NULL OR p.id = p_property_id)
    AND (p_owner_id IS NULL OR p.owner_id = p_owner_id)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

REVOKE ALL ON FUNCTION public.property_analytics_daily(timestamptz, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_analytics_daily(timestamptz, uuid, uuid) TO authenticated;

-- ===== PART 2: reviews =====
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_property_unique UNIQUE (user_id, property_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_reviews_updated ON public.reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- owners cannot review their own property; non-admins cannot change moderation status
CREATE OR REPLACE FUNCTION public.guard_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.properties p WHERE p.id = NEW.property_id AND p.owner_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Property owners cannot review their own property';
    END IF;
    RETURN NEW;
  END IF;
  IF NOT private.is_admin() THEN
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
    NEW.property_id := OLD.property_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_review ON public.reviews;
CREATE TRIGGER trg_guard_review BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.guard_review();

DROP POLICY IF EXISTS "reviews insert own" ON public.reviews;
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'APPROVED'::review_status
  AND rating BETWEEN 1 AND 5
  AND NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "reviews update" ON public.reviews;
CREATE POLICY "reviews update" ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.is_admin())
WITH CHECK (user_id = auth.uid() OR private.is_admin());

-- public read of published reviews with a privacy-safe display name
CREATE OR REPLACE FUNCTION public.property_reviews(p_property_id uuid)
RETURNS TABLE(id uuid, rating integer, comment text, created_at timestamptz, user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.rating, r.comment, r.created_at, r.user_id,
         COALESCE(NULLIF(split_part(COALESCE(pr.full_name, ''), ' ', 1), ''), 'Guest') AS display_name
  FROM public.reviews r
  LEFT JOIN public.profiles pr ON pr.id = r.user_id
  WHERE r.property_id = p_property_id AND r.status = 'APPROVED'
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.property_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_reviews(uuid) TO anon, authenticated;
