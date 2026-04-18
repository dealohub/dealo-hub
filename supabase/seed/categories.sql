-- ============================================================================
-- Dealo Hub — Categories Seed Data (V1)
-- ============================================================================
-- 10 main categories + 50+ sub-categories
-- Source of truth: src/lib/categories.ts
-- Reference: planning/DECISIONS.md + planning/LAUNCH-STRATEGY.md
--
-- Schema dependency: supabase/migrations/YYYYMMDD_categories.sql
-- (table must exist before running this seed)
--
-- Usage:
--   psql $SUPABASE_DB_URL -f supabase/seed/categories.sql
--   OR via Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Clear existing seed data (safe for re-running)
-- ----------------------------------------------------------------------------
DELETE FROM categories WHERE parent_id IS NOT NULL;
DELETE FROM categories WHERE parent_id IS NULL;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- ----------------------------------------------------------------------------
-- P0 — Heavy Seeding Tier
-- ----------------------------------------------------------------------------

-- 1. Electronics
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('electronics', 'إلكترونيات', 'Electronics', 'Smartphone', 'p0', 1, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'phones-tablets',   'موبايلات وأجهزة لوحية', 'Phones & Tablets',             1, true),
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'laptops-computers','لابتوبات وكمبيوترات',  'Laptops & Computers',          2, true),
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'tvs-audio',        'تلفزيونات وصوتيات',    'TVs & Audio',                  3, true),
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'gaming',           'ألعاب فيديو وأجهزة',   'Gaming',                       4, true),
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'smart-watches',    'ساعات ذكية وإكسسوارات','Smart Watches & Accessories',  5, true),
  ((SELECT id FROM categories WHERE slug = 'electronics'), 'cameras',          'كاميرات ومعدات تصوير', 'Cameras & Photography',        6, true);

-- 2. Furniture
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('furniture', 'أثاث', 'Furniture', 'Sofa', 'p0', 2, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'living-room',    'غرف الجلوس',        'Living Room',     1, true),
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'bedroom',        'غرف النوم',          'Bedroom',         2, true),
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'kids-room',      'غرف الأطفال',        'Kids Room',       3, true),
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'office',         'مكاتب وأثاث أعمال',   'Office & Work',   4, true),
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'decor-lighting', 'ديكور وإضاءة',       'Decor & Lighting',5, true),
  ((SELECT id FROM categories WHERE slug = 'furniture'), 'rugs-curtains',  'سجاد وستائر',        'Rugs & Curtains', 6, true);

-- 3. Luxury Bags & Watches (Premium — requires video + auth statement)
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active, requires_video, min_photos, requires_auth_statement)
VALUES ('luxury', 'حقائب وساعات فاخرة', 'Luxury Bags & Watches', 'Gem', 'p0', 3, true, true, 8, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'luxury'), 'luxury-bags',         'حقائب فاخرة',          'Luxury Bags',          1, true),
  ((SELECT id FROM categories WHERE slug = 'luxury'), 'luxury-watches',      'ساعات فاخرة',          'Luxury Watches',       2, true),
  ((SELECT id FROM categories WHERE slug = 'luxury'), 'fine-jewelry',        'مجوهرات راقية',         'Fine Jewelry',         3, true),
  ((SELECT id FROM categories WHERE slug = 'luxury'), 'luxury-accessories',  'إكسسوارات فاخرة',       'Luxury Accessories',   4, true),
  ((SELECT id FROM categories WHERE slug = 'luxury'), 'designer-shoes',      'أحذية مصمّمة',          'Designer Shoes',       5, true);

-- 4. Baby & Kids
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('baby-kids', 'مستلزمات الأطفال', 'Baby & Kids', 'Baby', 'p0', 4, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'baby-kids'), 'strollers-car-seats', 'عربات وكراسي سيارة', 'Strollers & Car Seats',  1, true),
  ((SELECT id FROM categories WHERE slug = 'baby-kids'), 'baby-furniture',      'أثاث غرف الأطفال',   'Baby Furniture',         2, true),
  ((SELECT id FROM categories WHERE slug = 'baby-kids'), 'educational-toys',    'ألعاب تعليمية',      'Educational Toys',       3, true),
  ((SELECT id FROM categories WHERE slug = 'baby-kids'), 'baby-clothes',        'ملابس رضع',          'Baby Clothes',           4, true),
  ((SELECT id FROM categories WHERE slug = 'baby-kids'), 'feeding-supplies',    'مستلزمات إطعام',     'Feeding Supplies',       5, true);

-- ----------------------------------------------------------------------------
-- P1 — Medium Seeding Tier
-- ----------------------------------------------------------------------------

-- 5. Games & Hobbies
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('games-hobbies', 'ألعاب وهوايات', 'Games & Hobbies', 'Gamepad2', 'p1', 5, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'games-hobbies'), 'video-games',    'ألعاب فيديو',          'Video Games',         1, true),
  ((SELECT id FROM categories WHERE slug = 'games-hobbies'), 'board-games',    'ألعاب لوحية',          'Board Games',         2, true),
  ((SELECT id FROM categories WHERE slug = 'games-hobbies'), 'collectibles',   'مجسمات وتحف',          'Collectibles',        3, true),
  ((SELECT id FROM categories WHERE slug = 'games-hobbies'), 'lego-building',  'Lego وألعاب البناء',   'Lego & Building',     4, true),
  ((SELECT id FROM categories WHERE slug = 'games-hobbies'), 'outdoor-toys',   'ألعاب خارجية',         'Outdoor Toys',        5, true);

-- 6. Sports & Outdoor
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('sports-outdoor', 'رياضة وخارجي', 'Sports & Outdoor', 'Mountain', 'p1', 6, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'sports-outdoor'), 'camping',          'تخييم',               'Camping',                     1, true),
  ((SELECT id FROM categories WHERE slug = 'sports-outdoor'), 'bicycles',         'دراجات',              'Bicycles',                    2, true),
  ((SELECT id FROM categories WHERE slug = 'sports-outdoor'), 'hunting-fishing',  'صيد (بتراخيص)',       'Hunting & Fishing (Licensed)',3, true),
  ((SELECT id FROM categories WHERE slug = 'sports-outdoor'), 'sportswear',       'ملابس رياضية',         'Sportswear',                  4, true),
  ((SELECT id FROM categories WHERE slug = 'sports-outdoor'), 'water-sports',     'رياضات مائية',         'Water Sports',                5, true);

-- 7. Home Fitness
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('home-fitness', 'أجهزة رياضية منزلية', 'Home Fitness', 'Dumbbell', 'p1', 7, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'home-fitness'), 'treadmills-cardio', 'جري وكارديو',         'Treadmills & Cardio', 1, true),
  ((SELECT id FROM categories WHERE slug = 'home-fitness'), 'weights-strength',  'أثقال وقوة',           'Weights & Strength',  2, true),
  ((SELECT id FROM categories WHERE slug = 'home-fitness'), 'exercise-bikes',    'دراجات تمرين',         'Exercise Bikes',      3, true),
  ((SELECT id FROM categories WHERE slug = 'home-fitness'), 'yoga-recovery',     'يوغا وتعافي',          'Yoga & Recovery',     4, true),
  ((SELECT id FROM categories WHERE slug = 'home-fitness'), 'home-gym-sets',     'أطقم جيم منزلي',       'Home Gym Sets',       5, true);

-- 8. Home Appliances
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('home-appliances', 'أدوات منزلية', 'Home Appliances', 'Utensils', 'p1', 8, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'home-appliances'), 'kitchen',          'مطبخ',            'Kitchen',           1, true),
  ((SELECT id FROM categories WHERE slug = 'home-appliances'), 'laundry',          'غسيل',            'Laundry',           2, true),
  ((SELECT id FROM categories WHERE slug = 'home-appliances'), 'refrigeration',    'تبريد',           'Refrigeration',     3, true),
  ((SELECT id FROM categories WHERE slug = 'home-appliances'), 'cleaning',         'تنظيف',           'Cleaning',          4, true),
  ((SELECT id FROM categories WHERE slug = 'home-appliances'), 'small-appliances', 'أدوات صغيرة',     'Small Appliances',  5, true);

-- ----------------------------------------------------------------------------
-- P2 — Light Seeding Tier
-- ----------------------------------------------------------------------------

-- 9. Beauty & Care (sealed products only)
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('beauty', 'جمال وعناية', 'Beauty & Care', 'Sparkles', 'p2', 9, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'beauty'), 'beauty-devices',     'أجهزة جمال',      'Beauty Devices',     1, true),
  ((SELECT id FROM categories WHERE slug = 'beauty'), 'sealed-fragrances',  'عطور (مختومة)',   'Fragrances (Sealed)',2, true),
  ((SELECT id FROM categories WHERE slug = 'beauty'), 'sealed-makeup',      'ماكياج (مختوم)',  'Makeup (Sealed)',    3, true),
  ((SELECT id FROM categories WHERE slug = 'beauty'), 'hair-care',          'عناية بالشعر',    'Hair Care',          4, true);

-- 10. General / Miscellaneous
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('general', 'متفرقات', 'General', 'Package', 'p2', 10, true);

INSERT INTO categories (parent_id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ((SELECT id FROM categories WHERE slug = 'general'), 'books-media',    'كتب ومطبوعات',               'Books & Media',  1, true),
  ((SELECT id FROM categories WHERE slug = 'general'), 'pet-supplies',   'مستلزمات حيوانات أليفة',      'Pet Supplies',   2, true),
  ((SELECT id FROM categories WHERE slug = 'general'), 'miscellaneous',  'أخرى',                        'Miscellaneous',  3, true);

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  main_count INT;
  sub_count INT;
BEGIN
  SELECT COUNT(*) INTO main_count FROM categories WHERE parent_id IS NULL;
  SELECT COUNT(*) INTO sub_count FROM categories WHERE parent_id IS NOT NULL;

  IF main_count != 10 THEN
    RAISE EXCEPTION 'Expected 10 main categories, found %', main_count;
  END IF;

  IF sub_count < 50 THEN
    RAISE EXCEPTION 'Expected 50+ sub-categories, found %', sub_count;
  END IF;

  RAISE NOTICE 'Seed complete: % main + % sub-categories', main_count, sub_count;
END $$;

COMMIT;

-- ============================================================================
-- Post-seed notes
-- ============================================================================
-- * All categories start `is_active = true` in V1
-- * Luxury category has special constraints (video, 8 photos, auth statement)
-- * Beauty has content moderation notice (sealed only) enforced at listing form layer
-- * Sub-category slugs are globally unique (enforced by unique constraint)
-- ============================================================================
