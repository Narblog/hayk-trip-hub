
REVOKE EXECUTE ON FUNCTION public.guard_pricing_tier() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.booking_dates_available(uuid, date, date, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.quote_property_price(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_booking_request(uuid, date, date, integer, integer, integer, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_booking_request(uuid, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_booking_request(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.booking_by_token(uuid, text) FROM PUBLIC;
