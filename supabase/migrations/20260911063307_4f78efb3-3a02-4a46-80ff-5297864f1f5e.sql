DROP FUNCTION IF EXISTS public.search_properties(
  TEXT, DATE, DATE, INT, TEXT[], TEXT[], NUMERIC, NUMERIC, INT, NUMERIC, TEXT, INT, INT
) CASCADE;

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
  p_offset INT DEFAULT 0,
  p_featured BOOLEAN DEFAULT NULL
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
    AND (p_featured IS NULL OR p.is_featured = p_featured)
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
