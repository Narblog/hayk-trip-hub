CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'tree',
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AMD',
  includes text[] NOT NULL DEFAULT '{}',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages public read active" ON public.packages FOR SELECT TO anon, authenticated USING (is_active OR private.is_admin());
CREATE POLICY "packages admin insert" ON public.packages FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY "packages admin update" ON public.packages FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "packages admin delete" ON public.packages FOR DELETE TO authenticated USING (private.is_admin());
CREATE TRIGGER packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();