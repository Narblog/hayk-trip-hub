DROP TRIGGER trg_assign_property_code ON public.properties;
DROP FUNCTION public.assign_property_code();
ALTER TABLE public.properties ALTER COLUMN public_code SET DEFAULT ('ST' || lpad(nextval('public.property_code_seq')::text, 3, '0'));