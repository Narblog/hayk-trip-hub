CREATE OR REPLACE FUNCTION public.guard_property_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('DRAFT','PENDING_REVIEW') THEN
    RAISE EXCEPTION 'Only administrators can set status %', NEW.status;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_tour_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('DRAFT','PENDING_REVIEW') THEN
    RAISE EXCEPTION 'Only administrators can set status %', NEW.status;
  END IF;
  NEW.rating := OLD.rating; NEW.review_count := OLD.review_count;
  NEW.is_featured := OLD.is_featured;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.guard_property_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tour_status() FROM PUBLIC, anon, authenticated;