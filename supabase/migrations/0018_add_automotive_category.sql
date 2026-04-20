-- ============================================================================
-- 0018_add_automotive_category.sql — Automotive vertical taxonomy
-- ============================================================================
-- Adds the `automotive` parent category and its 15 sub-categories per
-- planning/TAXONOMY-V2.md §1 (Automotive).
--
-- tier = 'p2' per TAXONOMY-V2 §Phase Mapping Summary — Automotive is
-- launched in P2 (Months 5-8). The category_tier enum in 0002 only
-- permits 'p0' | 'p1' | 'p2', so p2 is the correct representation.
--
-- All sub-categories are inserted active. Per-phase UI exposure
-- (P2 vs P3 vs P4) is controlled at the application layer, not via
-- is_active, so toggling future phases on/off stays a UI concern.
--
-- Delivery-options strategy:
--   * Parent + whole-vehicle sub-cats + services + business listings:
--     {pickup, seller_delivers}  — "buyer_ships" makes no sense for
--     a vehicle or a garage's service.
--   * Parts + accessories: rely on the table default
--     {pickup, seller_delivers, buyer_ships} — small items ship
--     normally.
--
-- Reference: planning/TAXONOMY-V2.md §1 (2026-04-18)
-- Depends on: 0002_enums_reference.sql, 0004_categories.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Parent: Automotive
-- ----------------------------------------------------------------------------
INSERT INTO categories (
  slug,
  name_ar, name_en,
  parent_id,
  icon,
  tier,
  sort_order,
  is_active,
  default_delivery_options,
  min_photos,
  requires_video,
  requires_auth_statement
) VALUES (
  'automotive',
  'مركبات', 'Automotive',
  NULL,
  'Car',                                 -- lucide-react icon name
  'p2',                                  -- enum-constrained: p0|p1|p2
  11,                                    -- after the 10 seeded mains
  true,
  '{pickup,seller_delivers}'::delivery_option[],
  5,
  false,
  false
);

-- ----------------------------------------------------------------------------
-- Sub-categories — 15 per TAXONOMY-V2 §1
-- ----------------------------------------------------------------------------
-- Whole-vehicle sub-cats: pickup + seller_delivers only.
INSERT INTO categories (
  parent_id, slug, name_ar, name_en, sort_order, is_active,
  default_delivery_options
) VALUES
  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'used-cars',           'سيارات مستعملة',      'Used Cars',
   1, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'new-cars',            'سيارات جديدة',        'New Cars',
   2, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'classic-cars',        'سيارات كلاسيكية',     'Classic Cars',
   3, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'junk-cars',           'سيارات سكراب',        'Junk Cars',
   4, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'wanted-cars',         'مطلوب سيارات',        'Wanted Cars',
   5, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'motorcycles',         'دراجات نارية',        'Motorcycles',
   6, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'watercraft',          'قوارب وجت سكي',       'Watercraft',
   7, true,  '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'cmvs',                'مركبات ومعدات تجارية', 'CMVs',
   8, true,  '{pickup,seller_delivers}'::delivery_option[]);

-- Parts + accessories: keep table default (all 3 delivery options).
INSERT INTO categories (
  parent_id, slug, name_ar, name_en, sort_order, is_active
) VALUES
  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'auto-spare-parts',    'قطع غيار',            'Auto Spare Parts',
   9, true),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'auto-accessories',    'اكسسوارات المركبات',   'Auto Accessories',
   10, true);

-- Services + business directory listings: pickup + seller_delivers.
INSERT INTO categories (
  parent_id, slug, name_ar, name_en, sort_order, is_active,
  default_delivery_options
) VALUES
  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'auto-services',       'خدمات المحركات',       'Automotive Services',
   11, true, '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'dealerships',         'الوكالات',            'Dealerships',
   12, true, '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'car-garages',         'كراج السيارات',        'Car Garages',
   13, true, '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'car-rental-business', 'مكاتب تأجير السيارات', 'Car Rental',
   14, true, '{pickup,seller_delivers}'::delivery_option[]),

  ((SELECT id FROM categories WHERE slug = 'automotive'),
   'food-trucks',         'عربات الطعام',         'Food Trucks',
   15, true, '{pickup,seller_delivers}'::delivery_option[]);

COMMIT;
