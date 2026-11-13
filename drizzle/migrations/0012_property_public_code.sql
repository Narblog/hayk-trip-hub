CREATE SEQUENCE IF NOT EXISTS public.property_code_seq START 1;

ALTER TABLE public.properties ADD COLUMN public_code text;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.properties
)
UPDATE public.properties p
SET public_code = 'ST' || lpad(o.rn::text, 3, '0')
FROM ordered o
WHERE p.id = o.id;

SELECT setval('public.property_code_seq', (SELECT COUNT(*) FROM public.properties) + 1, false);

ALTER TABLE public.properties ALTER COLUMN public_code SET NOT NULL;
ALTER TABLE public.properties ADD CONSTRAINT properties_public_code_key UNIQUE (public_code);

CREATE OR REPLACE FUNCTION public.assign_property_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_code IS NULL THEN
    NEW.public_code := 'ST' || lpad(nextval('public.property_code_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_property_code
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.assign_property_code();