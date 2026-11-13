ALTER TABLE public.booking_requests ALTER COLUMN property_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.booking_by_token(p_booking_id uuid, p_token text)
 RETURNS TABLE(id uuid, reference text, property_name text, property_slug text, check_in date, check_out date, nights integer, adults integer, children integer, infants integer, nightly_price numeric, total_price numeric, confirmed_total_price numeric, currency text, status booking_status, decline_reason text, price_change_note text, created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT b.id, b.reference, COALESCE(p.name, pk.title), p.slug, b.check_in, b.check_out, b.nights, b.adults, b.children, b.infants,
         b.nightly_price, b.total_price, b.confirmed_total_price, b.currency, b.status, b.decline_reason,
         b.price_change_note, b.created_at
  FROM public.booking_requests b
  LEFT JOIN public.properties p ON p.id = b.property_id
  LEFT JOIN public.packages pk ON pk.id = b.package_id
  WHERE b.id = p_booking_id AND b.guest_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$function$;

CREATE OR REPLACE FUNCTION public.create_package_booking_request(p_package_id uuid, p_adults integer, p_children integer, p_infants integer, p_name text, p_phone text, p_email text, p_message text)
RETURNS TABLE(booking_id uuid, reference text, guest_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  pkg public.packages%ROWTYPE;
  prop public.properties%ROWTYPE;
  v_has_prop boolean := false;
  v_nights integer;
  v_guests integer;
  v_token text;
  v_ref text;
  v_id uuid;
BEGIN
  SELECT * INTO pkg FROM public.packages WHERE id = p_package_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'PACKAGE_UNAVAILABLE'; END IF;

  IF pkg.property_id IS NOT NULL THEN
    SELECT * INTO prop FROM public.properties WHERE id = pkg.property_id;
    IF NOT FOUND OR prop.status <> 'APPROVED' OR NOT prop.is_active THEN RAISE EXCEPTION 'PROPERTY_UNAVAILABLE'; END IF;
    v_has_prop := true;
  END IF;
  IF pkg.check_in < CURRENT_DATE OR pkg.check_out <= pkg.check_in THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
  v_nights := pkg.check_out - pkg.check_in;
  v_guests := GREATEST(COALESCE(p_adults,1),1) + GREATEST(COALESCE(p_children,0),0);
  IF v_guests > COALESCE(pkg.max_guests, CASE WHEN v_has_prop THEN prop.max_guests END, 1000) THEN RAISE EXCEPTION 'TOO_MANY_GUESTS'; END IF;
  IF coalesce(length(trim(p_name)),0) < 2 OR coalesce(length(trim(p_phone)),0) < 5 THEN RAISE EXCEPTION 'INVALID_CONTACT'; END IF;
  IF v_has_prop AND NOT public.booking_dates_available(pkg.property_id, pkg.check_in, pkg.check_out) THEN RAISE EXCEPTION 'DATES_TAKEN'; END IF;

  IF (SELECT count(*) FROM public.booking_requests b
      WHERE b.created_at > now() - interval '1 hour'
        AND (b.customer_user_id = auth.uid() OR b.guest_phone = trim(p_phone))) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_requests b
             WHERE b.package_id = pkg.id AND b.status IN ('PENDING','ACCEPTED')
               AND (b.customer_user_id = auth.uid() OR lower(b.guest_phone) = lower(trim(p_phone)))) THEN
    RAISE EXCEPTION 'DUPLICATE_REQUEST';
  END IF;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_ref := 'SL-' || nextval('public.booking_reference_seq')::text;

  INSERT INTO public.booking_requests (
    reference, property_id, owner_id, customer_user_id, guest_token_hash,
    guest_name, guest_phone, guest_email, message,
    check_in, check_out, nights, adults, children, infants,
    nightly_price, total_price, currency, package_id
  ) VALUES (
    v_ref, pkg.property_id, CASE WHEN v_has_prop THEN prop.owner_id END, auth.uid(), encode(extensions.digest(v_token, 'sha256'), 'hex'),
    trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email,'')),''),
    nullif(trim(coalesce(p_message,'')),''),
    pkg.check_in, pkg.check_out, v_nights, GREATEST(COALESCE(p_adults,1),1), GREATEST(COALESCE(p_children,0),0), GREATEST(COALESCE(p_infants,0),0),
    round(pkg.price / v_nights), pkg.price, pkg.currency, pkg.id
  ) RETURNING id INTO v_id;

  IF v_has_prop AND prop.owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (prop.owner_id, 'BOOKING_REQUEST', 'Նոր ամանօրյա փաթեթի ամրագրման հայտ ' || v_ref,
            pkg.title || ' · ' || prop.name || ' · ' || pkg.check_in::text || ' → ' || pkg.check_out::text, '/owner/bookings');
  END IF;

  RETURN QUERY SELECT v_id, v_ref, v_token;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.create_package_booking_request(uuid,integer,integer,integer,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_package_booking_request(uuid,integer,integer,integer,text,text,text,text) TO anon, authenticated;