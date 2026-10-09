DROP POLICY IF EXISTS pricing_public_read ON public.property_pricing;
CREATE POLICY pricing_visible_read ON public.property_pricing FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_pricing.property_id));
DROP POLICY IF EXISTS tiers_public_read ON public.property_pricing_tiers;
CREATE POLICY tiers_visible_read ON public.property_pricing_tiers FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_pricing_tiers.property_id));