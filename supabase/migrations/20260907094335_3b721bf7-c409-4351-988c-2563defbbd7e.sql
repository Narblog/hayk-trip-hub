CREATE OR REPLACE FUNCTION public.create_booking_request(p_property_id uuid, p_check_in date, p_check_out date, p_adults integer, p_children integer, p_infants integer, p_name text, p_phone text, p_email text, p_message text)
 RETURNS TABLE(booking_id uuid, reference text, guest_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND (b.customer_user_id = auth.uid() OR b.guest_phone = trim(p_phone))) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_requests b
             WHERE b.property_id = p_property_id AND b.status IN ('PENDING','ACCEPTED')
               AND b.check_in < p_check_out AND b.check_out > p_check_in
               AND (b.customer_user_id = auth.uid() OR lower(b.guest_phone) = lower(trim(p_phone)))) THEN
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
END; $function$;
REVOKE EXECUTE ON FUNCTION public.create_booking_request(uuid,date,date,integer,integer,integer,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_request(uuid,date,date,integer,integer,integer,text,text,text,text) TO anon, authenticated;