
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_property_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_tour_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.refresh_property_rating() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_property_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_property_view(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;

INSERT INTO public.regions (code, name_en, name_hy, name_ru, sort_order) VALUES
('yerevan','Yerevan','Երևան','Ереван',1),
('aragatsotn','Aragatsotn','Արագածոտն','Арагацотн',2),
('ararat','Ararat','Արարատ','Арарат',3),
('armavir','Armavir','Արմավիր','Армавир',4),
('gegharkunik','Gegharkunik','Գեղարքունիք','Гегаркуник',5),
('kotayk','Kotayk','Կոտայք','Котайк',6),
('lori','Lori','Լոռի','Лори',7),
('shirak','Shirak','Շիրակ','Ширак',8),
('syunik','Syunik','Սյունիք','Сюник',9),
('tavush','Tavush','Տավուշ','Тавуш',10),
('vayots-dzor','Vayots Dzor','Վայոց ձոր','Вайоц Дзор',11);

INSERT INTO public.cities (code, region_code, name_en, name_hy, name_ru, latitude, longitude, is_popular, sort_order, image_url) VALUES
('yerevan','yerevan','Yerevan','Երևան','Ереван',40.1792,44.4991,true,1,'/images/demo/dest-yerevan.jpg'),
('dilijan','tavush','Dilijan','Դիլիջան','Дилижан',40.7408,44.8637,true,2,'/images/demo/dest-dilijan.jpg'),
('haghartsin','tavush','Haghartsin','Հաղարծին','Агарцин',40.7683,44.9169,true,3,'/images/demo/dest-dilijan.jpg'),
('tsaghkadzor','kotayk','Tsaghkadzor','Ծաղկաձոր','Цахкадзор',40.5333,44.7167,true,4,'/images/demo/dest-tsaghkadzor.jpg'),
('sevan','gegharkunik','Sevan','Սևան','Севан',40.5500,44.9500,true,5,'/images/demo/dest-sevan.jpg'),
('jermuk','vayots-dzor','Jermuk','Ջերմուկ','Джермук',39.8417,45.6708,true,6,'/images/demo/dest-jermuk.jpg'),
('gyumri','shirak','Gyumri','Գյումրի','Гюмри',40.7894,43.8475,true,7,'/images/demo/dest-gyumri.jpg'),
('goris','syunik','Goris','Գորիս','Горис',39.5108,46.3400,true,8,'/images/demo/dest-goris.jpg'),
('tatev','syunik','Tatev','Տաթև','Татев',39.3800,46.2500,true,9,'/images/demo/dest-tatev.jpg'),
('vanadzor','lori','Vanadzor','Վանաձոր','Ванадзор',40.8128,44.4883,false,10,null),
('stepanavan','lori','Stepanavan','Ստեփանավան','Степанаван',41.0086,44.3822,false,11,null),
('ijevan','tavush','Ijevan','Իջևան','Иджеван',40.8797,45.1478,false,12,null),
('garni','kotayk','Garni','Գառնի','Гарни',40.1122,44.7300,false,13,null),
('areni','vayots-dzor','Areni','Արենի','Арени',39.7200,45.1800,false,14,null);

INSERT INTO public.property_types (code, name_en, name_hy, name_ru, icon, sort_order) VALUES
('hotel','Hotel','Հյուրանոց','Отель','building-2',1),
('guesthouse','Guesthouse','Հյուրատուն','Гостевой дом','home',2),
('villa','Villa','Վիլլա','Вилла','castle',3),
('cabin','Cabin','Տնակ','Домик','tent-tree',4),
('apartment','Apartment','Բնակարան','Квартира','building',5),
('resort','Resort','Հանգստյան համալիր','Курорт','palmtree',6),
('cottage','Cottage','Քոթեջ','Коттедж','house',7),
('hostel','Hostel','Հոսթել','Хостел','bed-double',8),
('glamping','Glamping','Գլեմպինգ','Глэмпинг','tent',9),
('other','Other','Այլ','Другое','circle-ellipsis',10);

INSERT INTO public.amenities (code, category, name_en, name_hy, name_ru, icon, sort_order) VALUES
('wifi','general','Wi-Fi','Wi-Fi','Wi-Fi','wifi',1),
('parking','general','Parking','Ավտոկայանատեղի','Парковка','car',2),
('pool','wellness','Pool','Լողավազան','Бассейн','waves',3),
('jacuzzi','wellness','Jacuzzi','Ջակուզի','Джакузи','bath',4),
('sauna','wellness','Sauna','Սաունա','Сауна','flame',5),
('bbq','outdoor','BBQ','Խորոված','Барбекю','beef',6),
('kitchen','general','Kitchen','Խոհանոց','Кухня','cooking-pot',7),
('air_conditioning','comfort','Air conditioning','Օդորակիչ','Кондиционер','air-vent',8),
('heating','comfort','Heating','Ջեռուցում','Отопление','thermometer',9),
('fireplace','comfort','Fireplace','Բուխարի','Камин','flame',10),
('breakfast','general','Breakfast','Նախաճաշ','Завтрак','croissant',11),
('pet_friendly','general','Pet friendly','Ընտանի կենդանիների հետ','С животными','dog',12),
('washing_machine','general','Washing machine','Լվացքի մեքենա','Стиральная машина','washing-machine',13),
('mountain_view','view','Mountain view','Լեռների տեսարան','Вид на горы','mountain',14),
('forest_view','view','Forest view','Անտառի տեսարան','Вид на лес','trees',15),
('lake_view','view','Lake view','Լճի տեսարան','Вид на озеро','waves',16),
('garden','outdoor','Garden','Այգի','Сад','flower-2',17),
('terrace','outdoor','Terrace','Տեռաս','Терраса','sun',18),
('balcony','outdoor','Balcony','Պատշգամբ','Балкон','panel-top',19);

INSERT INTO public.tour_categories (code, name_en, name_hy, name_ru, icon, sort_order) VALUES
('hiking','Hiking','Արշավ','Хайкинг','footprints',1),
('horse_riding','Horse riding','Ձիավարություն','Верховая езда','rabbit',2),
('wine','Wine tours','Գինու տուրեր','Винные туры','wine',3),
('jeep','Jeep tours','Ջիփ տուրեր','Джип-туры','car-front',4),
('cultural','Cultural','Մշակութային','Культурные','landmark',5),
('photography','Photography','Ֆոտո տուրեր','Фототуры','camera',6),
('fishing','Fishing','Ձկնորսություն','Рыбалка','fish',7),
('rafting','Rafting','Ռաֆթինգ','Рафтинг','waves',8),
('camping','Camping','Քեմփինգ','Кемпинг','tent',9),
('cooking','Cooking','Խոհարարական','Кулинарные','chef-hat',10),
('food','Local food','Տեղական խոհանոց','Местная кухня','utensils',11),
('monastery','Monastery tours','Վանքերի տուրեր','Туры по монастырям','church',12);

INSERT INTO public.platform_settings (key, value) VALUES
('currencies','{"base":"AMD","supported":["AMD","USD","EUR","RUB"],"rates":{"AMD":1,"USD":0.0026,"EUR":0.0024,"RUB":0.21}}'),
('homepage','{"sections":["popular_destinations","recommended","guesthouses","cabins","hotels","tours"]}');

-- ===== DEMO DATA (is_demo = true, safe to delete) =====
INSERT INTO public.properties (id, owner_id, name, slug, description, property_type, city_code, region_code, address, latitude, longitude, price_per_night, max_guests, bedrooms, beds, bathrooms, status, is_demo, is_featured, main_image_url, rating, review_count, view_count, contact_phone, contact_whatsapp, contact_instagram, house_rules, seo_title, seo_description, approved_at, submitted_at) VALUES
('11111111-1111-4111-8111-000000000001', NULL, 'Forest Panorama', 'forest-panorama-haghartsin', 'A timber-and-stone retreat above Haghartsin monastery, wrapped in beech forest. Floor-to-ceiling windows, a wood-burning fireplace and a wide terrace over the valley.', 'cabin','haghartsin','tavush','Haghartsin road 4, Tavush', 40.7683, 44.9169, 78000, 8, 4, 6, 3, 'APPROVED', true, true, '/images/demo/forest-panorama.jpg', 4.90, 42, 1280, '+374 55 112233','+374 55 112233','forest.panorama.am','No parties. Quiet hours after 23:00.','Forest Panorama — Cabin in Haghartsin, Armenia','Book Forest Panorama, an 8-guest forest cabin near Haghartsin monastery with fireplace, terrace and valley views.', now(), now()),
('11111111-1111-4111-8111-000000000002', NULL, 'Dilijan Pine House', 'dilijan-pine-house', 'A quiet guesthouse on the edge of Dilijan National Park with a garden, homemade breakfast and mountain air.', 'guesthouse','dilijan','tavush','Kamo 12, Dilijan', 40.7408, 44.8637, 42000, 6, 3, 4, 2, 'APPROVED', true, true, '/images/demo/pine-house.jpg', 4.70, 31, 940, '+374 91 445566','+374 91 445566','dilijanpinehouse','Check-in from 14:00. No smoking indoors.','Dilijan Pine House — Guesthouse in Dilijan','Stay at Dilijan Pine House: garden, homemade Armenian breakfast and a 10-minute walk to the old town.', now(), now()),
('11111111-1111-4111-8111-000000000003', NULL, 'Sevan Lake Villa', 'sevan-lake-villa', 'A modern villa steps from the shore of Lake Sevan, with a heated pool, BBQ area and panoramic lake terrace.', 'villa','sevan','gegharkunik','Shore road 2, Sevan', 40.5500, 44.9500, 145000, 10, 5, 7, 4, 'APPROVED', true, true, '/images/demo/sevan-villa.jpg', 4.80, 26, 1520, '+374 77 889900','+374 77 889900','sevanlakevilla','Events allowed with prior approval.','Sevan Lake Villa — Lakefront villa on Lake Sevan','A 10-guest lakefront villa on Lake Sevan with heated pool, BBQ and panoramic terrace.', now(), now()),
('11111111-1111-4111-8111-000000000004', NULL, 'Tsaghkadzor Alpine Suites', 'tsaghkadzor-alpine-suites', 'Ski-in apartments beside the Tsaghkadzor ropeway, with sauna, underground parking and mountain views.', 'apartment','tsaghkadzor','kotayk','Orbeli 7, Tsaghkadzor', 40.5333, 44.7167, 56000, 4, 2, 3, 2, 'APPROVED', true, false, '/images/demo/alpine-suites.jpg', 4.60, 58, 2100, '+374 93 220011','+374 93 220011','alpine.suites.am','No pets.','Tsaghkadzor Alpine Suites — Ski apartments','Ski-in apartments at the Tsaghkadzor ropeway with sauna and mountain views.', now(), now()),
('11111111-1111-4111-8111-000000000005', NULL, 'Kond Loft Yerevan', 'kond-loft-yerevan', 'A designer loft in the old Kond district, five minutes from Republic Square, with a rooftop terrace over the city.', 'apartment','yerevan','yerevan','Kond 18, Yerevan', 40.1830, 44.5040, 38000, 3, 1, 2, 1, 'APPROVED', true, false, '/images/demo/kond-loft.jpg', 4.85, 74, 3300, '+374 98 334455','+374 98 334455','kondloft','Quiet building — no parties.','Kond Loft — Design apartment in central Yerevan','A design loft in Yerevan''s Kond district with rooftop terrace, minutes from Republic Square.', now(), now()),
('11111111-1111-4111-8111-000000000006', NULL, 'Jermuk Mineral Resort', 'jermuk-mineral-resort', 'A wellness resort above the Jermuk waterfall with thermal pools, spa treatments and full board.', 'resort','jermuk','vayots-dzor','Shahumyan 1, Jermuk', 39.8417, 45.6708, 92000, 4, 2, 2, 2, 'APPROVED', true, true, '/images/demo/jermuk-resort.jpg', 4.50, 112, 2750, '+374 94 556677','+374 94 556677','jermukresort','Spa access included for guests.','Jermuk Mineral Resort — Spa hotel in Jermuk','Thermal pools, spa and mountain air at Jermuk Mineral Resort in Vayots Dzor.', now(), now()),
('11111111-1111-4111-8111-000000000007', NULL, 'Gyumri Stone Townhouse', 'gyumri-stone-townhouse', 'A restored 19th-century black tuff townhouse in the Kumayri quarter, with courtyard and antique interiors.', 'cottage','gyumri','shirak','Rustaveli 24, Gyumri', 40.7894, 43.8475, 34000, 5, 3, 3, 2, 'APPROVED', true, false, '/images/demo/gyumri-house.jpg', 4.75, 19, 610, '+374 96 778899','+374 96 778899','gyumristonehouse','Respect the historic interiors.','Gyumri Stone Townhouse — Historic stay in Kumayri','A restored tuff townhouse in Gyumri''s Kumayri quarter with courtyard and antique interiors.', now(), now()),
('11111111-1111-4111-8111-000000000008', NULL, 'Tatev Canyon Glamping', 'tatev-canyon-glamping', 'Geodesic domes on the rim of the Vorotan gorge, facing Tatev monastery. Sunrise over the canyon from your bed.', 'glamping','tatev','syunik','Vorotan rim, Tatev', 39.3800, 46.2500, 49000, 2, 1, 1, 1, 'APPROVED', true, true, '/images/demo/tatev-glamping.jpg', 4.95, 37, 1890, '+374 55 909090','+374 55 909090','tatevglamping','Leave no trace. Campfires in designated pits only.','Tatev Canyon Glamping — Domes above the Vorotan gorge','Sleep on the rim of the Vorotan gorge facing Tatev monastery in a heated geodesic dome.', now(), now()),
('11111111-1111-4111-8111-000000000009', NULL, 'Goris Cave View Guesthouse', 'goris-cave-view-guesthouse', 'A family guesthouse facing the Old Khndzoresk cave formations, with home-cooked dinners and a fruit garden.', 'guesthouse','goris','syunik','Mashtots 9, Goris', 39.5108, 46.3400, 28000, 6, 3, 4, 2, 'APPROVED', true, false, '/images/demo/goris-guesthouse.jpg', 4.65, 23, 520, '+374 77 101010','+374 77 101010','gorisguesthouse','Dinner by request until 20:00.','Goris Cave View Guesthouse — Family stay in Syunik','A family-run guesthouse in Goris facing the Khndzoresk caves, with home-cooked Armenian dinners.', now(), now()),
('11111111-1111-4111-8111-000000000010', NULL, 'Ijevan Riverside Cabins', 'ijevan-riverside-cabins', 'Wooden cabins along the Aghstev river with private BBQ terraces and forest trails from the door.', 'cabin','ijevan','tavush','Aghstev valley, Ijevan', 40.8797, 45.1478, 36000, 4, 2, 3, 1, 'APPROVED', true, false, '/images/demo/ijevan-cabins.jpg', 4.55, 15, 430, '+374 91 121212','+374 91 121212','ijevancabins','No loud music after 22:00.','Ijevan Riverside Cabins — Forest cabins in Tavush','Wooden riverside cabins in the Aghstev valley near Ijevan with BBQ terraces and forest trails.', now(), now());

INSERT INTO public.property_amenities (property_id, amenity_code)
SELECT p.id, a.code FROM public.properties p
JOIN LATERAL (VALUES
  ('11111111-1111-4111-8111-000000000001','wifi'),('11111111-1111-4111-8111-000000000001','parking'),('11111111-1111-4111-8111-000000000001','fireplace'),('11111111-1111-4111-8111-000000000001','bbq'),('11111111-1111-4111-8111-000000000001','forest_view'),('11111111-1111-4111-8111-000000000001','terrace'),('11111111-1111-4111-8111-000000000001','kitchen'),('11111111-1111-4111-8111-000000000001','heating'),('11111111-1111-4111-8111-000000000001','pet_friendly'),
  ('11111111-1111-4111-8111-000000000002','wifi'),('11111111-1111-4111-8111-000000000002','breakfast'),('11111111-1111-4111-8111-000000000002','garden'),('11111111-1111-4111-8111-000000000002','parking'),('11111111-1111-4111-8111-000000000002','mountain_view'),('11111111-1111-4111-8111-000000000002','heating'),
  ('11111111-1111-4111-8111-000000000003','wifi'),('11111111-1111-4111-8111-000000000003','pool'),('11111111-1111-4111-8111-000000000003','jacuzzi'),('11111111-1111-4111-8111-000000000003','bbq'),('11111111-1111-4111-8111-000000000003','lake_view'),('11111111-1111-4111-8111-000000000003','terrace'),('11111111-1111-4111-8111-000000000003','parking'),('11111111-1111-4111-8111-000000000003','kitchen'),('11111111-1111-4111-8111-000000000003','air_conditioning'),
  ('11111111-1111-4111-8111-000000000004','wifi'),('11111111-1111-4111-8111-000000000004','sauna'),('11111111-1111-4111-8111-000000000004','parking'),('11111111-1111-4111-8111-000000000004','mountain_view'),('11111111-1111-4111-8111-000000000004','heating'),('11111111-1111-4111-8111-000000000004','balcony'),
  ('11111111-1111-4111-8111-000000000005','wifi'),('11111111-1111-4111-8111-000000000005','air_conditioning'),('11111111-1111-4111-8111-000000000005','kitchen'),('11111111-1111-4111-8111-000000000005','washing_machine'),('11111111-1111-4111-8111-000000000005','terrace'),
  ('11111111-1111-4111-8111-000000000006','wifi'),('11111111-1111-4111-8111-000000000006','pool'),('11111111-1111-4111-8111-000000000006','sauna'),('11111111-1111-4111-8111-000000000006','breakfast'),('11111111-1111-4111-8111-000000000006','parking'),('11111111-1111-4111-8111-000000000006','mountain_view'),('11111111-1111-4111-8111-000000000006','jacuzzi'),
  ('11111111-1111-4111-8111-000000000007','wifi'),('11111111-1111-4111-8111-000000000007','kitchen'),('11111111-1111-4111-8111-000000000007','heating'),('11111111-1111-4111-8111-000000000007','garden'),('11111111-1111-4111-8111-000000000007','parking'),
  ('11111111-1111-4111-8111-000000000008','wifi'),('11111111-1111-4111-8111-000000000008','heating'),('11111111-1111-4111-8111-000000000008','mountain_view'),('11111111-1111-4111-8111-000000000008','bbq'),('11111111-1111-4111-8111-000000000008','breakfast'),
  ('11111111-1111-4111-8111-000000000009','wifi'),('11111111-1111-4111-8111-000000000009','breakfast'),('11111111-1111-4111-8111-000000000009','garden'),('11111111-1111-4111-8111-000000000009','mountain_view'),('11111111-1111-4111-8111-000000000009','pet_friendly'),('11111111-1111-4111-8111-000000000009','kitchen'),
  ('11111111-1111-4111-8111-000000000010','wifi'),('11111111-1111-4111-8111-000000000010','bbq'),('11111111-1111-4111-8111-000000000010','forest_view'),('11111111-1111-4111-8111-000000000010','terrace'),('11111111-1111-4111-8111-000000000010','parking'),('11111111-1111-4111-8111-000000000010','fireplace')
) AS a(pid, code) ON a.pid::uuid = p.id
WHERE p.is_demo;

INSERT INTO public.property_images (property_id, image_url, sort_order, is_cover)
SELECT p.id, p.main_image_url, 0, true FROM public.properties p WHERE p.is_demo;

-- Demo blocked dates (matches the documented availability test scenario)
INSERT INTO public.availability (property_id, date, status, note) VALUES
('11111111-1111-4111-8111-000000000001','2026-08-15','BLOCKED','Demo block'),
('11111111-1111-4111-8111-000000000001','2026-08-16','BLOCKED','Demo block'),
('11111111-1111-4111-8111-000000000001','2026-08-17','BLOCKED','Demo block'),
('11111111-1111-4111-8111-000000000003','2026-08-20','BLOCKED','Demo block'),
('11111111-1111-4111-8111-000000000003','2026-08-21','BLOCKED','Demo block');

INSERT INTO public.tours (id, owner_id, name, slug, description, category, city_code, region_code, location, meeting_point, latitude, longitude, duration_hours, price, max_participants, status, is_demo, main_image_url, rating, review_count, contact_phone, contact_whatsapp, contact_instagram, seo_title, seo_description) VALUES
('22222222-2222-4222-8222-000000000001', NULL, 'Dilijan Forest Trail Hike', 'dilijan-forest-trail-hike', 'A guided full-day hike through Dilijan National Park to Haghartsin monastery, with a forest picnic of local cheese and lavash.', 'hiking','dilijan','tavush','Dilijan National Park','Dilijan central park fountain', 40.7408, 44.8637, 6, 18000, 12, 'APPROVED', true, '/images/demo/tour-hike.jpg', 4.90, 44, '+374 55 300300','+374 55 300300','dilijantrails','Dilijan Forest Trail Hike — Guided hike to Haghartsin','A guided 6-hour hike through Dilijan National Park to Haghartsin monastery with a forest picnic.'),
('22222222-2222-4222-8222-000000000002', NULL, 'Areni Wine Valley Tour', 'areni-wine-valley-tour', 'Taste natural Armenian wines in Areni cellars, visit the 6,100-year-old Areni-1 winery cave and Noravank monastery.', 'wine','areni','vayots-dzor','Areni & Noravank','Areni village square', 39.7200, 45.1800, 8, 26000, 8, 'APPROVED', true, '/images/demo/tour-wine.jpg', 4.80, 61, '+374 91 400400','+374 91 400400','arenivalleytours','Areni Wine Valley Tour — Armenian wine tasting','Taste Areni wines, visit the Areni-1 cave winery and Noravank monastery on a full-day tour.'),
('22222222-2222-4222-8222-000000000003', NULL, 'Sevan Sunrise Photography', 'sevan-sunrise-photography', 'A small-group sunrise shoot on the Sevan peninsula with a working photographer, from blue hour to golden light.', 'photography','sevan','gegharkunik','Sevan peninsula','Sevanavank stairs', 40.5500, 44.9500, 4, 15000, 6, 'APPROVED', true, '/images/demo/tour-photo.jpg', 4.70, 18, '+374 77 500500','+374 77 500500','sevansunrise','Sevan Sunrise Photography Tour','A guided sunrise photography session on the Sevan peninsula with a working photographer.');

INSERT INTO public.tour_images (tour_id, image_url, sort_order, is_cover)
SELECT t.id, t.main_image_url, 0, true FROM public.tours t WHERE t.is_demo;
