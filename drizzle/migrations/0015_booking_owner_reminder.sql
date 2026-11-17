CREATE OR REPLACE FUNCTION public.remind_booking_owner(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  b public.booking_requests%ROWTYPE;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO b FROM public.booking_requests WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
  IF b.owner_id IS NULL THEN
    RAISE EXCEPTION 'NO_OWNER';
  END IF;
  IF b.status <> 'PENDING' THEN
    RAISE EXCEPTION 'NOT_PENDING';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    b.owner_id,
    'BOOKING_OWNER_REMINDER',
    'Ամրագրման հայտը սպասում է պատասխանի',
    'Հայտ ' || b.reference || ' դեռ սպասում է ձեր պատասխանին։ Խնդրում ենք ստուգել ամրագրումը։',
    '/owner/bookings'
  );
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.remind_booking_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remind_booking_owner(uuid) TO authenticated;