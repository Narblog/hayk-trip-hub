CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_hy text NOT NULL,
  title_ru text NOT NULL,
  content_en text NOT NULL DEFAULT '',
  content_hy text NOT NULL DEFAULT '',
  content_ru text NOT NULL DEFAULT '',
  seo_description_en text,
  seo_description_hy text,
  seo_description_ru text,
  show_in_footer boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are viewable by everyone"
ON public.pages FOR SELECT
USING (is_published OR private.is_admin());

CREATE POLICY "Admins can insert pages"
ON public.pages FOR INSERT TO authenticated
WITH CHECK (private.is_admin());

CREATE POLICY "Admins can update pages"
ON public.pages FOR UPDATE TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY "Admins can delete pages"
ON public.pages FOR DELETE TO authenticated
USING (private.is_admin());

CREATE TRIGGER pages_set_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.pages (slug, title_en, title_hy, title_ru, content_en, content_hy, content_ru, seo_description_en, seo_description_hy, seo_description_ru, sort_order) VALUES
('about-stayland', 'About StayLand', 'StayLand-ի մասին', 'О StayLand',
 E'StayLand is an Armenian marketplace for stays and tours.\n\nWe connect travellers directly with verified local hosts — no booking commission, no middlemen.',
 E'StayLand-ը հայկական հարթակ է հանգստի տների և տուրերի համար։\n\nՄենք ուղիղ կապում ենք ճանապարհորդներին ստուգված տեղական տանտերերի հետ՝ առանց ամրագրման միջնորդավճարի։',
 E'StayLand — армянская площадка для жилья и туров.\n\nМы напрямую связываем путешественников с проверенными местными хозяевами, без комиссии за бронирование.',
 'Learn how StayLand connects travellers with verified Armenian hosts.',
 'Իմացեք, թե ինչպես է StayLand-ը կապում ճանապարհորդներին հայ տանտերերի հետ։',
 'Узнайте, как StayLand связывает путешественников с армянскими хозяевами.', 10);