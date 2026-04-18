-- ============================================================================
-- 0002_cities_kw.sql — Kuwait Cities + Areas
-- ============================================================================
-- 6 governorates (as "cities") + ~50 areas
-- Source: PACI (Public Authority for Civil Information) + common usage
--
-- Note: "city" in Kuwait context = muhafazah (governorate).
-- "area" = neighborhood/district within a governorate.
-- ============================================================================

BEGIN;

-- Clear Kuwait data (idempotent)
DELETE FROM areas WHERE city_id IN (SELECT id FROM cities WHERE country_code = 'KW');
DELETE FROM cities WHERE country_code = 'KW';

-- ----------------------------------------------------------------------------
-- Governorates (as cities)
-- ----------------------------------------------------------------------------

INSERT INTO cities (country_code, slug, name_ar, name_en, sort_order) VALUES
  ('KW', 'capital',        'محافظة العاصمة',       'Capital',          1),
  ('KW', 'hawalli',        'محافظة حولي',           'Hawalli',          2),
  ('KW', 'farwaniya',      'محافظة الفروانية',      'Farwaniya',        3),
  ('KW', 'ahmadi',         'محافظة الأحمدي',        'Ahmadi',           4),
  ('KW', 'mubarak-kabeer', 'محافظة مبارك الكبير',   'Mubarak Al-Kabeer',5),
  ('KW', 'jahra',          'محافظة الجهراء',        'Jahra',            6);

-- ----------------------------------------------------------------------------
-- Areas per Governorate
-- ----------------------------------------------------------------------------

-- Capital Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'capital'), 'kuwait-city',    'مدينة الكويت',   'Kuwait City',     1),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'sharq',          'شرق',           'Sharq',           2),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'dasma',          'الدسمة',        'Dasma',           3),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'shaab',          'الشعب',         'Shaab',           4),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'bneid-al-gar',   'بنيد القار',    'Bneid Al-Gar',    5),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'mansouriya',     'المنصورية',     'Mansouriya',      6),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'kaifan',         'كيفان',         'Kaifan',          7),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'adailiya',       'العديلية',      'Adailiya',        8),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'rawda',          'الروضة',        'Rawda',           9),
  ((SELECT id FROM cities WHERE slug = 'capital'), 'yarmouk',        'اليرموك',       'Yarmouk',        10);

-- Hawalli Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'salmiya',        'السالمية',      'Salmiya',         1),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'hawalli-area',   'حولي',          'Hawalli',         2),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'salwa',          'سلوى',           'Salwa',           3),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'rumaithiya',     'الرميثية',       'Rumaithiya',      4),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'jabriya',        'الجابرية',       'Jabriya',         5),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'bayan',          'بيان',           'Bayan',           6),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'mishref',        'مشرف',           'Mishref',         7),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'shaab-al-bahri', 'الشعب البحري',  'Shaab Al-Bahri',  8),
  ((SELECT id FROM cities WHERE slug = 'hawalli'), 'anjafa',         'العنجفة',        'Anjafa',          9);

-- Farwaniya Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'farwaniya-area', 'الفروانية',      'Farwaniya',       1),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'khaitan',        'خيطان',          'Khaitan',         2),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'jleeb-shuyoukh', 'جليب الشيوخ',   'Jleeb Al-Shuyoukh',3),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'ardiya',         'العارضية',      'Ardiya',          4),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'rabiya',         'الرابية',        'Rabiya',          5),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'andalous',       'الأندلس',       'Andalous',        6),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'ishbiliya',      'اشبيلية',        'Ishbiliya',       7),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'omariya',        'العمرية',        'Omariya',         8),
  ((SELECT id FROM cities WHERE slug = 'farwaniya'), 'rihab',          'الرحاب',         'Rihab',           9);

-- Ahmadi Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'fahaheel',     'الفحيحيل',       'Fahaheel',        1),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'mangaf',       'المنقف',          'Mangaf',          2),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'mahboula',     'المهبولة',        'Mahboula',        3),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'abu-halifa',   'أبو حليفة',       'Abu Halifa',      4),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'sabahiya',     'الصباحية',        'Sabahiya',        5),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'fintas',       'الفنطاس',         'Fintas',          6),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'riqqa',        'الرقة',           'Riqqa',           7),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'hadiya',       'هدية',            'Hadiya',          8),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'ahmadi-area',  'الأحمدي',         'Ahmadi',          9),
  ((SELECT id FROM cities WHERE slug = 'ahmadi'), 'wafra',        'الوفرة',          'Wafra',          10);

-- Mubarak Al-Kabeer Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'mubarak-area',  'مبارك الكبير',  'Mubarak Al-Kabeer',1),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'abu-hasaniya',  'أبو الحصانية', 'Abu Al-Hasaniya', 2),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'qusour',        'القصور',        'Qusour',          3),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'sabah-al-salem','صباح السالم',  'Sabah Al-Salem',  4),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'messila',       'المسيلة',       'Messila',         5),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'fnaitees',      'فنيطيس',        'Fnaitees',        6),
  ((SELECT id FROM cities WHERE slug = 'mubarak-kabeer'), 'adan',          'العدان',        'Adan',            7);

-- Jahra Governorate
INSERT INTO areas (city_id, slug, name_ar, name_en, sort_order) VALUES
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'jahra-area',    'الجهراء',         'Jahra',           1),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'taima',         'تيماء',           'Taima',           2),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'naseem',        'النسيم',          'Naseem',          3),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'waha',          'الواحة',          'Waha',            4),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'oyoun',         'العيون',          'Oyoun',           5),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'saad-abdullah', 'سعد العبدالله',  'Saad Al-Abdullah',6),
  ((SELECT id FROM cities WHERE slug = 'jahra'), 'sulaibiya',     'الصليبية',        'Sulaibiya',       7);

-- Verify
DO $$
DECLARE
  cities_count INT;
  areas_count INT;
BEGIN
  SELECT COUNT(*) INTO cities_count FROM cities WHERE country_code = 'KW';
  SELECT COUNT(*) INTO areas_count FROM areas WHERE city_id IN (SELECT id FROM cities WHERE country_code = 'KW');

  IF cities_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 Kuwait governorates, got %', cities_count;
  END IF;

  IF areas_count < 40 THEN
    RAISE EXCEPTION 'Expected 40+ Kuwait areas, got %', areas_count;
  END IF;

  RAISE NOTICE 'Kuwait seeded: % governorates + % areas', cities_count, areas_count;
END $$;

COMMIT;
