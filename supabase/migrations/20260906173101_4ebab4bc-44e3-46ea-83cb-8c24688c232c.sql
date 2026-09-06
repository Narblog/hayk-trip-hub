
-- ENUMS
CREATE TYPE public.pricing_type AS ENUM ('FIXED','TIERED','BASE_PLUS_GUEST');
CREATE TYPE public.booking_status AS ENUM ('PENDING','ACCEPTED','DECLINED','CANCELLED','COMPLETED');

-- PRICING
CREATE TABLE public.property_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  pricing_type public.pricing_type NOT NULL DEFAULT 'FIXED',
  fixed_price numeric,
  base_price numeric,
  included_guests integer NOT NULL DEFAULT 1,
  extra_guest_price numeric,
  currency text NOT NULL DEFAULT 'AMD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_pricing TO authenticated;
GRANT ALL ON public.property_pricing TO service_role;
ALTER TABLE public.property_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_public_read" ON public.property_pricing FOR SELECT USING (true);
CREATE POLICY "pricing_owner_write" ON public.property_pricing FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR private.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR private.is_admin())));
CREATE TRIGGER trg_property_pricing_updated BEFORE UPDATE ON public.property_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  min_guests integer NOT NULL,
  max_guests integer NOT NULL,
  price_per_night numeric NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (min_guests >= 1 AND max_guests >= min_guests)
);
CREATE INDEX idx_pricing_tiers_property ON public.property_pricing_tiers(property_id, min_guests);
GRANT SELECT ON public.property_pricing_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_pricing_tiers TO authenticated;
GRANT ALL ON public.property_pricing_tiers TO service_role;
ALTER TABLE public.property_pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers_public_read" ON public.property_pricing_tiers FOR SELECT USING (true);
CREATE POLICY "tiers_owner_write" ON public.property_pricing_tiers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR private.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR private.is_admin())));

CREATE OR REPLACE FUNCTION public.guard_pricing_tier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.property_pricing_tiers t
    WHERE t.property_id = NEW.property_id
      AND t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NEW.min_guests <= t.max_guests AND NEW.max_guests >= t.min_guests
  ) THEN
    RAISE EXCEPTION 'OVERLAPPING_TIER';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_guard_pricing_tier BEFORE INSERT OR UPDATE ON public.property_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.guard_pricing_tier();

-- BOOKINGS
CREATE SEQUENCE public.booking_reference_seq START WITH 2048;
GRANT USAGE ON SEQUENCE public.booking_reference_seq TO authenticated, anon, service_role;

CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token_hash text,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text,
  message text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer NOT NULL,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  infants integer NOT NULL DEFAULT 0,
  nightly_price numeric NOT NULL,
  total_price numeric NOT NULL,
  confirmed_total_price numeric,
  price_change_note text,
  currency text NOT NULL DEFAULT 'AMD',
  status public.booking_status NOT NULL DEFAULT 'PENDING',
  decline_reason text,
  responded_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_requests_property ON public.booking_requests(property_id, status);
CREATE INDEX idx_booking_requests_owner ON public.booking_requests(owner_id, created_at DESC);
CREATE INDEX idx_booking_requests_customer ON public.booking_requests(customer_user_id, created_at DESC);
GRANT SELECT ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_involved_read" ON public.booking_requests FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR customer_user_id = auth.uid() OR private.is_admin());
CREATE TRIGGER trg_booking_requests_updated BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- QUOTE
CREATE OR REPLACE FUNCTION public.quote_property_price(p_property_id uuid, p_guests integer)
RETURNS TABLE(nightly_price numeric, currency text, has_price boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pr public.property_pricing%ROWTYPE;
  prop public.properties%ROWTYPE;
  tier_price numeric;
  guests integer := GREATEST(COALESCE(p_guests,1),1);
BEGIN
  SELECT * INTO prop FROM public.properties WHERE id = p_property_id;
  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 'AMD'::text, false; RETURN; END IF;
  SELECT * INTO pr FROM public.property_pricing WHERE property_id = p_property_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT prop.price_per_night, prop.currency, prop.price_per_night > 0;
    RETURN;
  END IF;
  IF pr.pricing_type = 'FIXED' THEN
    RETURN QUERY SELECT COALESCE(pr.fixed_price, prop.price_per_night), pr.currency, COALESCE(pr.fixed_price, prop.price_per_night) > 0;
  ELSIF pr.pricing_type = 'TIERED' THEN
    SELECT t.price_per_night INTO tier_price FROM public.property_pricing_tiers t
      WHERE t.property_id = p_property_id AND guests BETWEEN t.min_guests AND t.max_guests
      ORDER BY t.min_guests LIMIT 1;
    RETURN QUERY SELECT COALESCE(tier_price, 0::numeric), pr.currency, tier_price IS NOT NULL;
  ELSE
    RETURN QUERY SELECT COALESCE(pr.base_price,0) + GREATEST(guests - GREATEST(pr.included_guests,1), 0) * COALESCE(pr.extra_guest_price,0),
                        pr.currency, COALESCE(pr.base_price,0) > 0;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.quote_property_price(uuid, integer) TO anon, authenticated;

-- AVAILABILITY CHECK
CREATE OR REPLACE FUNCTION public.booking_dates_available(p_property_id uuid, p_check_in date, p_check_out date, p_exclude uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.property_id = p_property_id AND a.status <> 'AVAILABLE'
      AND a.date >= p_check_in AND a.date < p_check_out
  ) AND NOT EXISTS (
    SELECT 1 FROM public.booking_requests b
    WHERE b.property_id = p_property_id AND b.status = 'ACCEPTED'
      AND (p_exclude IS NULL OR b.id <> p_exclude)
      AND b.check_in < p_check_out AND b.check_out > p_check_in
  );
$$;
GRANT EXECUTE ON FUNCTION public.booking_dates_available(uuid, date, date, uuid) TO anon, authenticated;

-- CREATE REQUEST
CREATE OR REPLACE FUNCTION public.create_booking_request(
  p_property_id uuid, p_check_in date, p_check_out date,
  p_adults integer, p_children integer, p_infants integer,
  p_name text, p_phone text, p_email text, p_message text
) RETURNS TABLE(booking_id uuid, reference text, guest_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prop public.properties%ROWTYPE;
  q RECORD;
  v_nights integer;
  v_guests integer;
  v_token text;
  v_ref text;
  v_id uuid;
BEGIN
  SELECT * INTO prop FROM public.properties WHERE id = p_property_id;
  IF NOT FOUND OR prop.status <> 'APPROVED' OR NOT prop.is_active THEN RAISE EXCEPTION 'PROPERTY_UNAVAILABLE'; END IF;
  IF p_check_in < CURRENT_DATE OR p_check_out <= p_check_in THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
  v_nights := p_check_out - p_check_in;
  v_guests := GREATEST(COALESCE(p_adults,1),1) + GREATEST(COALESCE(p_children,0),0);
  IF v_guests > prop.max_guests THEN RAISE EXCEPTION 'TOO_MANY_GUESTS'; END IF;
  IF coalesce(length(trim(p_name)),0) < 2 OR coalesce(length(trim(p_phone)),0) < 5 THEN RAISE EXCEPTION 'INVALID_CONTACT'; END IF;
  IF NOT public.booking_dates_available(p_property_id, p_check_in, p_check_out) THEN RAISE EXCEPTION 'DATES_TAKEN'; END IF;

  IF (SELECT count(*) FROM public.booking_requests b
      WHERE b.created_at > now() - interval '1 hour'
        AND (b.customer_user_id = auth.uid() OR b.guest_phone = p_phone)) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_requests b
             WHERE b.property_id = p_property_id AND b.status = 'PENDING'
               AND b.check_in = p_check_in AND b.check_out = p_check_out
               AND (b.customer_user_id = auth.uid() OR b.guest_phone = p_phone)) THEN
    RAISE EXCEPTION 'DUPLICATE_REQUEST';
  END IF;

  SELECT * INTO q FROM public.quote_property_price(p_property_id, v_guests);
  IF NOT q.has_price THEN RAISE EXCEPTION 'NO_PRICE'; END IF;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_ref := 'SL-' || nextval('public.booking_reference_seq')::text;

  INSERT INTO public.booking_requests (
    reference, property_id, owner_id, customer_user_id, guest_token_hash,
    guest_name, guest_phone, guest_email, message,
    check_in, check_out, nights, adults, children, infants,
    nightly_price, total_price, currency
  ) VALUES (
    v_ref, p_property_id, prop.owner_id, auth.uid(), encode(extensions.digest(v_token, 'sha256'), 'hex'),
    trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email,'')),''), nullif(trim(coalesce(p_message,'')),''),
    p_check_in, p_check_out, v_nights, GREATEST(COALESCE(p_adults,1),1), GREATEST(COALESCE(p_children,0),0), GREATEST(COALESCE(p_infants,0),0),
    q.nightly_price, q.nightly_price * v_nights, q.currency
  ) RETURNING id INTO v_id;

  IF prop.owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (prop.owner_id, 'BOOKING_REQUEST', 'Նոր ամրագրման հայտ ' || v_ref,
            prop.name || ' · ' || p_check_in::text || ' → ' || p_check_out::text, '/owner/bookings');
  END IF;

  RETURN QUERY SELECT v_id, v_ref, v_token;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_booking_request(uuid, date, date, integer, integer, integer, text, text, text, text) TO anon, authenticated;

-- RESPOND
CREATE OR REPLACE FUNCTION public.respond_booking_request(
  p_booking_id uuid, p_action text, p_confirmed_total numeric DEFAULT NULL,
  p_note text DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.booking_requests%ROWTYPE; d date;
BEGIN
  SELECT * INTO b FROM public.booking_requests WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF b.owner_id IS DISTINCT FROM auth.uid() AND NOT private.is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF b.status <> 'PENDING' THEN RAISE EXCEPTION 'NOT_PENDING'; END IF;

  IF p_action = 'ACCEPT' THEN
    IF NOT public.booking_dates_available(b.property_id, b.check_in, b.check_out, b.id) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    UPDATE public.booking_requests
      SET status = 'ACCEPTED', confirmed_total_price = COALESCE(p_confirmed_total, total_price),
          price_change_note = nullif(trim(coalesce(p_note,'')),''), responded_at = now()
      WHERE id = b.id;
    d := b.check_in;
    WHILE d < b.check_out LOOP
      INSERT INTO public.availability (property_id, date, status, note)
      VALUES (b.property_id, d, 'RESERVED', b.reference)
      ON CONFLICT (property_id, date) DO UPDATE SET status = 'RESERVED', note = b.reference;
      d := d + 1;
    END LOOP;
    IF b.customer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (b.customer_user_id, 'BOOKING_ACCEPTED', 'Ձեր ամրագրումը հաստատվեց ' || b.reference, NULL, '/account/bookings');
    END IF;
  ELSIF p_action = 'DECLINE' THEN
    UPDATE public.booking_requests
      SET status = 'DECLINED', decline_reason = nullif(trim(coalesce(p_reason,'')),''), responded_at = now()
      WHERE id = b.id;
    IF b.customer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (b.customer_user_id, 'BOOKING_DECLINED', 'Ամրագրման հայտը մերժվեց ' || b.reference, nullif(trim(coalesce(p_reason,'')),''), '/account/bookings');
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.respond_booking_request(uuid, text, numeric, text, text) TO authenticated;

-- CANCEL
CREATE OR REPLACE FUNCTION public.cancel_booking_request(p_booking_id uuid, p_token text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.booking_requests%ROWTYPE;
BEGIN
  SELECT * INTO b FROM public.booking_requests WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT (
    (b.customer_user_id IS NOT NULL AND b.customer_user_id = auth.uid())
    OR (p_token IS NOT NULL AND b.guest_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex'))
    OR b.owner_id = auth.uid() OR private.is_admin()
  ) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF b.status NOT IN ('PENDING','ACCEPTED') THEN RAISE EXCEPTION 'NOT_CANCELLABLE'; END IF;

  UPDATE public.booking_requests SET status = 'CANCELLED', cancelled_at = now() WHERE id = b.id;
  DELETE FROM public.availability a
    WHERE a.property_id = b.property_id AND a.status = 'RESERVED' AND a.note = b.reference
      AND a.date >= b.check_in AND a.date < b.check_out;
  IF b.owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (b.owner_id, 'BOOKING_CANCELLED', 'Ամրագրումը չեղարկվեց ' || b.reference, NULL, '/owner/bookings');
  END IF;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_booking_request(uuid, text) TO anon, authenticated;

-- GUEST LOOKUP
CREATE OR REPLACE FUNCTION public.booking_by_token(p_booking_id uuid, p_token text)
RETURNS TABLE(id uuid, reference text, property_name text, property_slug text, check_in date, check_out date,
              nights integer, adults integer, children integer, infants integer, nightly_price numeric,
              total_price numeric, confirmed_total_price numeric, currency text, status public.booking_status,
              decline_reason text, price_change_note text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.reference, p.name, p.slug, b.check_in, b.check_out, b.nights, b.adults, b.children, b.infants,
         b.nightly_price, b.total_price, b.confirmed_total_price, b.currency, b.status, b.decline_reason,
         b.price_change_note, b.created_at
  FROM public.booking_requests b JOIN public.properties p ON p.id = b.property_id
  WHERE b.id = p_booking_id AND b.guest_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;
GRANT EXECUTE ON FUNCTION public.booking_by_token(uuid, text) TO anon, authenticated;
