ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS name_hy text,
  ADD COLUMN IF NOT EXISTS name_ru text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_hy text,
  ADD COLUMN IF NOT EXISTS description_ru text,
  ADD COLUMN IF NOT EXISTS description_en text;

UPDATE public.properties SET
  name_hy = 'Երկհարկանի քոթեջ Թեղուտում (Տ-10-45), 5040 քմ տարածք',
  name_ru = 'Двухэтажный коттедж в Тегуте (Т-10-45), участок 5040 кв.м',
  name_en = 'Two-storey cottage in Teghut (T-10-45), 5040 sq.m plot',
  description_hy = description,
  description_ru = E'Ночлег рассчитан на 4-6 человек.\n\nСтоимость домика:\n\n2 человека — 30 000 драм\n4 человека — 40 000 драм\n6 человек — 50 000 драм\n\nЗаезд — 14:00\nВыезд — 12:00\n\nОсновная информация:\nДжакузи (10 000 драм)\nБеседка (на 6 человек)\nМангал с 10 шампурами',
  description_en = E'The stay is designed for 4-6 guests.\n\nPrice of the cottage:\n\n2 guests — 30,000 AMD\n4 guests — 40,000 AMD\n6 guests — 50,000 AMD\n\nCheck-in — 14:00\nCheck-out — 12:00\n\nKey information:\nJacuzzi (10,000 AMD)\nGazebo (for 6 guests)\nBarbecue with 10 skewers'
WHERE id = '52da9712-47af-47a0-8d78-59aa51dd4e17';

UPDATE public.properties SET
  name_hy = 'Անտառային համայնապատկեր, Դիլիջան',
  name_ru = 'Лесная панорама, Дилижан',
  name_en = 'Forest Panorama Dilijan',
  description_hy = 'Գտնվում է Դիլիջանում։',
  description_ru = 'Находится в Дилижане.',
  description_en = 'Located in Dilijan.'
WHERE id IN ('cde8206f-dc64-4f5a-aaf1-3094d259553a','11111111-1111-4111-8111-000000000001');

UPDATE public.properties SET
  name_hy = 'Սևանա լճի վիլլա',
  name_ru = 'Вилла у озера Севан',
  name_en = 'Sevan Lake Villa',
  description_hy = 'Ժամանակակից վիլլա Սևանա լճի ափից մի քանի քայլ հեռավորության վրա՝ տաքացվող լողավազանով, խորովածի գոտիով և լիճը տեսնող պատշգամբով։',
  description_ru = 'Современная вилла в нескольких шагах от берега озера Севан: подогреваемый бассейн, зона барбекю и терраса с панорамным видом на озеро.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000003';

UPDATE public.properties SET
  name_hy = 'Ծաղկաձորի ալպիական բնակարաններ',
  name_ru = 'Альпийские апартаменты в Цахкадзоре',
  name_en = 'Tsaghkadzor Alpine Suites',
  description_hy = 'Բնակարաններ Ծաղկաձորի ճոպանուղու կողքին՝ սաունայով, ստորգետնյա ավտոկայանատեղիով և լեռների տեսարանով։',
  description_ru = 'Апартаменты рядом с канатной дорогой Цахкадзора: сауна, подземная парковка и вид на горы.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000004';

UPDATE public.properties SET
  name_hy = 'Ջերմուկի հանքային հանգստավայր',
  name_ru = 'Минеральный курорт Джермук',
  name_en = 'Jermuk Mineral Resort',
  description_hy = 'Առողջարանային համալիր Ջերմուկի ջրվեժի վերևում՝ ջերմային լողավազաններով, սպա ընթացակարգերով և լիարժեք սննդով։',
  description_ru = 'Оздоровительный курорт над Джермукским водопадом: термальные бассейны, спа-процедуры и полный пансион.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000006';

UPDATE public.properties SET
  name_hy = 'Դիլիջանի սոճու տուն',
  name_ru = 'Сосновый дом в Дилижане',
  name_en = 'Dilijan Pine House',
  description_hy = 'Հանգիստ հյուրատուն Դիլիջանի ազգային պարկի եզրին՝ այգով, տնական նախաճաշով և լեռնային մաքուր օդով։',
  description_ru = 'Тихий гостевой дом на краю Дилижанского национального парка: сад, домашний завтрак и горный воздух.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000002';

UPDATE public.properties SET
  name_hy = 'Իջևանի գետափնյա տնակներ',
  name_ru = 'Домики у реки в Иджеване',
  name_en = 'Ijevan Riverside Cabins',
  description_hy = 'Փայտե տնակներ Աղստև գետի երկայնքով՝ առանձին խորովածի պատշգամբներով և անտառային արահետներով։',
  description_ru = 'Деревянные домики вдоль реки Агстев с собственными террасами для барбекю и лесными тропами прямо у порога.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000010';

UPDATE public.properties SET
  name_hy = 'Գյումրու քարե առանձնատուն',
  name_ru = 'Каменный особняк в Гюмри',
  name_en = 'Gyumri Stone Townhouse',
  description_hy = 'Վերականգնված 19-րդ դարի սև տուֆից տուն Կումայրի թաղամասում՝ բակով և հնաոճ ինտերիերով։',
  description_ru = 'Отреставрированный дом XIX века из чёрного туфа в квартале Кумайри: двор и антикварные интерьеры.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000007';

UPDATE public.properties SET
  name_hy = 'Տաթևի կիրճի գլամպինգ',
  name_ru = 'Глэмпинг в Татевском ущелье',
  name_en = 'Tatev Canyon Glamping',
  description_hy = 'Գմբեթաձև տնակներ Որոտանի կիրճի եզրին՝ Տաթևի վանքի դիմաց։ Արևածագը կիրճի վրայով՝ անկողնուց։',
  description_ru = 'Геодезические купола на краю Воротанского ущелья напротив монастыря Татев. Рассвет над каньоном прямо из постели.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000008';

UPDATE public.properties SET
  name_hy = 'Գորիսի քարանձավների տեսարանով հյուրատուն',
  name_ru = 'Гостевой дом с видом на пещеры в Горисе',
  name_en = 'Goris Cave View Guesthouse',
  description_hy = 'Ընտանեկան հյուրատուն Հին Խնձորեսկի քարանձավների դիմաց՝ տնական ընթրիքներով և պտղատու այգով։',
  description_ru = 'Семейный гостевой дом напротив пещер Старого Хндзореска: домашние ужины и фруктовый сад.',
  description_en = description
WHERE id = '11111111-1111-4111-8111-000000000009';

UPDATE public.properties SET name_en = COALESCE(name_en, name), description_en = COALESCE(description_en, description);

DROP FUNCTION IF EXISTS public.search_properties(text, date, date, integer, text[], text[], numeric, numeric, integer, numeric, text, integer, integer, boolean);

CREATE OR REPLACE FUNCTION public.search_properties(p_destination text DEFAULT NULL::text, p_check_in date DEFAULT NULL::date, p_check_out date DEFAULT NULL::date, p_guests integer DEFAULT 1, p_types text[] DEFAULT NULL::text[], p_amenities text[] DEFAULT NULL::text[], p_min_price numeric DEFAULT NULL::numeric, p_max_price numeric DEFAULT NULL::numeric, p_bedrooms integer DEFAULT NULL::integer, p_min_rating numeric DEFAULT NULL::numeric, p_sort text DEFAULT 'recommended'::text, p_limit integer DEFAULT 12, p_offset integer DEFAULT 0, p_featured boolean DEFAULT NULL::boolean)
 RETURNS TABLE(id uuid, name text, name_hy text, name_ru text, name_en text, slug text, property_type text, city_code text, region_code text, price_per_night numeric, currency text, max_guests integer, bedrooms integer, beds integer, bathrooms integer, rating numeric, review_count integer, main_image_url text, latitude double precision, longitude double precision, is_featured boolean, amenity_codes text[], total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
         OR p.name ILIKE '%'||p_destination||'%'
         OR COALESCE(p.name_hy,'') ILIKE '%'||p_destination||'%'
         OR COALESCE(p.name_ru,'') ILIKE '%'||p_destination||'%')
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
SELECT b.id, b.name, b.name_hy, b.name_ru, b.name_en, b.slug, b.property_type, b.city_code, b.region_code,
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
$function$;