
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','owner','traveler');
CREATE TYPE public.listing_status AS ENUM ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED','CHANGES_REQUESTED');
CREATE TYPE public.availability_status AS ENUM ('AVAILABLE','BLOCKED','RESERVED');
CREATE TYPE public.review_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE public.contact_type AS ENUM ('PHONE','WHATSAPP','INSTAGRAM','EMAIL','TELEGRAM');
CREATE TYPE public.account_status AS ENUM ('ACTIVE','SUSPENDED');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'hy',
  status public.account_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requested TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, preferred_language)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language','hy'))
  ON CONFLICT (id) DO NOTHING;
  requested := COALESCE(NEW.raw_user_meta_data->>'role','traveler');
  IF requested NOT IN ('traveler','owner') THEN requested := 'traveler'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REFERENCE DATA ============
CREATE TABLE public.regions (
  code TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_hy TEXT NOT NULL, name_ru TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.cities (
  code TEXT PRIMARY KEY, region_code TEXT NOT NULL REFERENCES public.regions(code) ON DELETE CASCADE,
  name_en TEXT NOT NULL, name_hy TEXT NOT NULL, name_ru TEXT NOT NULL,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  image_url TEXT, is_popular BOOLEAN NOT NULL DEFAULT false, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.property_types (
  code TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_hy TEXT NOT NULL, name_ru TEXT NOT NULL,
  icon TEXT, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.amenities (
  code TEXT PRIMARY KEY, category TEXT NOT NULL DEFAULT 'general',
  name_en TEXT NOT NULL, name_hy TEXT NOT NULL, name_ru TEXT NOT NULL,
  icon TEXT, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.tour_categories (
  code TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_hy TEXT NOT NULL, name_ru TEXT NOT NULL,
  icon TEXT, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regions, public.cities, public.property_types, public.amenities, public.tour_categories, public.platform_settings TO anon, authenticated;
GRANT ALL ON public.regions, public.cities, public.property_types, public.amenities, public.tour_categories, public.platform_settings TO service_role;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref public read" ON public.regions FOR SELECT USING (true);
CREATE POLICY "ref public read" ON public.cities FOR SELECT USING (true);
CREATE POLICY "ref public read" ON public.property_types FOR SELECT USING (true);
CREATE POLICY "ref public read" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "ref public read" ON public.tour_categories FOR SELECT USING (true);
CREATE POLICY "ref public read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "ref admin write" ON public.regions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "ref admin write" ON public.cities FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "ref admin write" ON public.property_types FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "ref admin write" ON public.amenities FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "ref admin write" ON public.tour_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "ref admin write" ON public.platform_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.regions, public.cities, public.property_types, public.amenities, public.tour_categories, public.platform_settings TO authenticated;

-- ============ PROPERTIES ============
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  property_type TEXT NOT NULL REFERENCES public.property_types(code),
  city_code TEXT REFERENCES public.cities(code),
  region_code TEXT REFERENCES public.regions(code),
  address TEXT,
  show_exact_location BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  currency TEXT NOT NULL DEFAULT 'AMD',
  price_per_night NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_guests INT NOT NULL DEFAULT 1,
  bedrooms INT NOT NULL DEFAULT 1,
  beds INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '12:00',
  house_rules TEXT,
  extra_info TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_instagram TEXT,
  status public.listing_status NOT NULL DEFAULT 'DRAFT',
  admin_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  main_image_url TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city_code);
CREATE INDEX idx_properties_region ON public.properties(region_code);
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_price ON public.properties(price_per_night);
CREATE INDEX idx_properties_guests ON public.properties(max_guests);
CREATE INDEX idx_properties_public ON public.properties(status, is_active) WHERE status = 'APPROVED';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "public sees approved" ON public.properties FOR SELECT
  USING ((status = 'APPROVED' AND is_active) OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "owner inserts own" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status IN ('DRAFT','PENDING_REVIEW'));
CREATE POLICY "owner updates own" ON public.properties FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "owner deletes own" ON public.properties FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

-- prevent owners self-approving
CREATE OR REPLACE FUNCTION public.guard_property_status() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('DRAFT','PENDING_REVIEW') THEN
    RAISE EXCEPTION 'Only administrators can set status %', NEW.status;
  END IF;
  NEW.rating := OLD.rating; NEW.review_count := OLD.review_count;
  NEW.is_featured := OLD.is_featured;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_property_status_guard BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.guard_property_status();

-- rentable units (future multi-room support)
CREATE TABLE public.property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_guests INT NOT NULL DEFAULT 1,
  price_per_night NUMERIC(12,2),
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_units_property ON public.property_units(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_units TO authenticated;
GRANT SELECT ON public.property_units TO anon;
GRANT ALL ON public.property_units TO service_role;
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units read" ON public.property_units FOR SELECT USING (true);
CREATE POLICY "units owner write" ON public.property_units FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())));

CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_images_property ON public.property_images(property_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT SELECT ON public.property_images TO anon;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images read" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "images owner write" ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())));

CREATE TABLE public.property_amenities (
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_code TEXT NOT NULL REFERENCES public.amenities(code) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_code)
);
CREATE INDEX idx_property_amenities_code ON public.property_amenities(amenity_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_amenities TO authenticated;
GRANT SELECT ON public.property_amenities TO anon;
GRANT ALL ON public.property_amenities TO service_role;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pa read" ON public.property_amenities FOR SELECT USING (true);
CREATE POLICY "pa owner write" ON public.property_amenities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())));

-- ============ AVAILABILITY ============
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.property_units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status public.availability_status NOT NULL DEFAULT 'BLOCKED',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, date)
);
CREATE INDEX idx_availability_property_date ON public.availability(property_id, date);
CREATE INDEX idx_availability_date ON public.availability(date) WHERE status <> 'AVAILABLE';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT SELECT ON public.availability TO anon;
GRANT ALL ON public.availability TO service_role;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability read" ON public.availability FOR SELECT USING (true);
CREATE POLICY "availability owner write" ON public.availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR public.is_admin())));

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  comment TEXT,
  status public.review_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
CREATE INDEX idx_reviews_property ON public.reviews(property_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read approved" ON public.reviews FOR SELECT
  USING (status = 'APPROVED' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "reviews update" ON public.reviews FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "reviews delete" ON public.reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.refresh_property_rating() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.property_id, OLD.property_id);
  UPDATE public.properties p SET
    rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric,2) FROM public.reviews r WHERE r.property_id = pid AND r.status='APPROVED'),0),
    review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.property_id = pid AND r.status='APPROVED')
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_property_rating();

-- ============ TOURS ============
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT REFERENCES public.tour_categories(code),
  city_code TEXT REFERENCES public.cities(code),
  region_code TEXT REFERENCES public.regions(code),
  location TEXT,
  meeting_point TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  duration_hours NUMERIC(5,2),
  currency TEXT NOT NULL DEFAULT 'AMD',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_participants INT NOT NULL DEFAULT 10,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_instagram TEXT,
  main_image_url TEXT,
  status public.listing_status NOT NULL DEFAULT 'DRAFT',
  admin_note TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tours_status ON public.tours(status);
CREATE INDEX idx_tours_city ON public.tours(city_code);
CREATE INDEX idx_tours_owner ON public.tours(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT SELECT ON public.tours TO anon;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tours_updated BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "tours public read" ON public.tours FOR SELECT
  USING (status = 'APPROVED' OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "tours owner insert" ON public.tours FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status IN ('DRAFT','PENDING_REVIEW'));
CREATE POLICY "tours owner update" ON public.tours FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "tours owner delete" ON public.tours FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());
CREATE OR REPLACE FUNCTION public.guard_tour_status() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('DRAFT','PENDING_REVIEW') THEN
    RAISE EXCEPTION 'Only administrators can set status %', NEW.status;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_tour_status_guard BEFORE UPDATE ON public.tours
FOR EACH ROW EXECUTE FUNCTION public.guard_tour_status();

CREATE TABLE public.tour_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_images TO authenticated;
GRANT SELECT ON public.tour_images TO anon;
GRANT ALL ON public.tour_images TO service_role;
ALTER TABLE public.tour_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tour images read" ON public.tour_images FOR SELECT USING (true);
CREATE POLICY "tour images owner write" ON public.tour_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND (t.owner_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND (t.owner_id = auth.uid() OR public.is_admin())));

-- ============ ADMIN / ANALYTICS / NOTIFICATIONS ============
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin actions read" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin actions insert" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND admin_id = auth.uid());

CREATE TABLE public.contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_type public.contact_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_events_property ON public.contact_events(property_id, created_at DESC);
GRANT INSERT, SELECT ON public.contact_events TO authenticated;
GRANT INSERT ON public.contact_events TO anon;
GRANT ALL ON public.contact_events TO service_role;
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact insert anyone" ON public.contact_events FOR INSERT WITH CHECK (true);
CREATE POLICY "contact read owner" ON public.contact_events FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));

CREATE TABLE public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_views_property ON public.property_views(property_id, created_at DESC);
CREATE INDEX idx_property_views_user ON public.property_views(user_id, created_at DESC);
GRANT INSERT, SELECT ON public.property_views TO authenticated;
GRANT INSERT ON public.property_views TO anon;
GRANT ALL ON public.property_views TO service_role;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views insert anyone" ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views read" ON public.property_views FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));

CREATE TABLE public.search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT, check_in DATE, check_out DATE, guests INT,
  results_count INT, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.search_events TO anon, authenticated;
GRANT SELECT ON public.search_events TO authenticated;
GRANT ALL ON public.search_events TO service_role;
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search insert" ON public.search_events FOR INSERT WITH CHECK (true);
CREATE POLICY "search read admin" ON public.search_events FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
GRANT SELECT, UPDATE, INSERT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin notify" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- notify owner on status change
CREATE OR REPLACE FUNCTION public.notify_property_status() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.owner_id, 'PROPERTY_' || NEW.status::text,
      NEW.name, COALESCE(NEW.admin_note, 'Status changed to ' || NEW.status::text),
      '/owner/properties');
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_notify_property_status AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_property_status();

-- ============ SEARCH FUNCTION ============
CREATE OR REPLACE FUNCTION public.search_properties(
  p_destination TEXT DEFAULT NULL,
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_guests INT DEFAULT 1,
  p_types TEXT[] DEFAULT NULL,
  p_amenities TEXT[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_bedrooms INT DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_sort TEXT DEFAULT 'recommended',
  p_limit INT DEFAULT 12,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, property_type TEXT, city_code TEXT, region_code TEXT,
  price_per_night NUMERIC, currency TEXT, max_guests INT, bedrooms INT, beds INT, bathrooms INT,
  rating NUMERIC, review_count INT, main_image_url TEXT, latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION, is_featured BOOLEAN, amenity_codes TEXT[], total_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
WITH base AS (
  SELECT p.*
  FROM public.properties p
  WHERE p.status = 'APPROVED' AND p.is_active
    AND p.max_guests >= GREATEST(COALESCE(p_guests,1),1)
    AND (p_destination IS NULL OR p_destination = '' OR
         p.city_code = lower(p_destination) OR p.region_code = lower(p_destination) OR
         EXISTS (SELECT 1 FROM public.cities c WHERE c.code = p.city_code AND (
           c.name_en ILIKE '%'||p_destination||'%' OR c.name_hy ILIKE '%'||p_destination||'%' OR c.name_ru ILIKE '%'||p_destination||'%'))
         OR EXISTS (SELECT 1 FROM public.regions r WHERE r.code = p.region_code AND (
           r.name_en ILIKE '%'||p_destination||'%' OR r.name_hy ILIKE '%'||p_destination||'%' OR r.name_ru ILIKE '%'||p_destination||'%'))
         OR p.name ILIKE '%'||p_destination||'%')
    AND (p_types IS NULL OR array_length(p_types,1) IS NULL OR p.property_type = ANY(p_types))
    AND (p_min_price IS NULL OR p.price_per_night >= p_min_price)
    AND (p_max_price IS NULL OR p.price_per_night <= p_max_price)
    AND (p_bedrooms IS NULL OR p.bedrooms >= p_bedrooms)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_amenities IS NULL OR array_length(p_amenities,1) IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(p_amenities) a
      WHERE NOT EXISTS (SELECT 1 FROM public.property_amenities pa WHERE pa.property_id = p.id AND pa.amenity_code = a)))
    AND (
      p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in
      OR NOT EXISTS (
        SELECT 1 FROM public.availability av
        WHERE av.property_id = p.id
          AND av.status <> 'AVAILABLE'
          AND av.date >= p_check_in
          AND av.date < p_check_out
      )
    )
), counted AS (SELECT COUNT(*) AS n FROM base)
SELECT b.id, b.name, b.slug, b.property_type, b.city_code, b.region_code,
       b.price_per_night, b.currency, b.max_guests, b.bedrooms, b.beds, b.bathrooms,
       b.rating, b.review_count, b.main_image_url, b.latitude, b.longitude, b.is_featured,
       COALESCE((SELECT array_agg(pa.amenity_code) FROM public.property_amenities pa WHERE pa.property_id = b.id), '{}') AS amenity_codes,
       (SELECT n FROM counted) AS total_count
FROM base b
ORDER BY
  CASE WHEN p_sort = 'price_asc' THEN b.price_per_night END ASC,
  CASE WHEN p_sort = 'price_desc' THEN b.price_per_night END DESC,
  CASE WHEN p_sort = 'rating' THEN b.rating END DESC,
  CASE WHEN p_sort = 'popular' THEN b.view_count END DESC,
  b.is_featured DESC, b.rating DESC, b.created_at DESC
LIMIT GREATEST(COALESCE(p_limit,12),1) OFFSET GREATEST(COALESCE(p_offset,0),0);
$$;
GRANT EXECUTE ON FUNCTION public.search_properties TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_property_availability(p_property_id UUID, p_check_in DATE, p_check_out DATE)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_check_out > p_check_in AND NOT EXISTS (
    SELECT 1 FROM public.availability av
    WHERE av.property_id = p_property_id AND av.status <> 'AVAILABLE'
      AND av.date >= p_check_in AND av.date < p_check_out);
$$;
GRANT EXECUTE ON FUNCTION public.check_property_availability TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_property_view(p_property_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.properties SET view_count = view_count + 1 WHERE id = p_property_id;
  INSERT INTO public.property_views (property_id, user_id) VALUES (p_property_id, auth.uid());
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_property_view TO anon, authenticated;
