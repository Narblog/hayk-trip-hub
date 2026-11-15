CREATE OR REPLACE FUNCTION public.respond_booking_request(p_booking_id uuid, p_action text, p_confirmed_total numeric DEFAULT NULL::numeric, p_note text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE b public.booking_requests%ROWTYPE; d date;
BEGIN
  SELECT * INTO b FROM public.booking_requests WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF b.owner_id IS DISTINCT FROM auth.uid() AND NOT private.is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF b.status <> 'PENDING' THEN RAISE EXCEPTION 'NOT_PENDING'; END IF;

  IF p_action = 'ACCEPT' THEN
    IF b.property_id IS NOT NULL AND NOT public.booking_dates_available(b.property_id, b.check_in, b.check_out, b.id) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    UPDATE public.booking_requests
      SET status = 'ACCEPTED', confirmed_total_price = COALESCE(p_confirmed_total, total_price),
          price_change_note = nullif(trim(coalesce(p_note,'')),''), responded_at = now()
      WHERE id = b.id;
    IF b.property_id IS NOT NULL THEN
      d := b.check_in;
      WHILE d < b.check_out LOOP
        INSERT INTO public.availability (property_id, date, status, note)
        VALUES (b.property_id, d, 'RESERVED', b.reference)
        ON CONFLICT (property_id, date) DO UPDATE SET status = 'RESERVED', note = b.reference;
        d := d + 1;
      END LOOP;
    END IF;
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
END; $function$;