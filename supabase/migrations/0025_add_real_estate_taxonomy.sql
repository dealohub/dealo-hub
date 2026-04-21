-- ============================================================================
-- 0025_add_real_estate_taxonomy.sql — real-estate parent + 8 sub-categories
-- ============================================================================
-- Lays the Properties vertical taxonomy foundation. Mirrors the
-- automotive pattern from migration 0018: one parent row + children
-- linked by parent_id, with sort_order driving UI ordering and
-- category-level defaults (min_photos, requires_video) tuned per
-- sub-cat.
--
-- Taxonomy aligned with TAXONOMY-V2.md §2 (locked) and validated
-- against Q84Sale live DOM (2026-04-21), which exposes 7 of 8
-- sub-cats as top-level routes.
--
-- 8 sub-cats:
--   1. property-for-rent       P2 — seeded in 0027 (3 listings)
--   2. property-for-sale       P2 — seeded in 0027 (3 listings)
--   3. rooms-for-rent          P2 — seeded in 0027 (1 listing) ⭐ differentiator
--   4. land                    P3 — seeded in 0027 (1 listing)
--   5. property-for-exchange   P3 — empty row (no listings Phase 4a)
--   6. international-property  P4 — empty row
--   7. property-management     P4 — empty row (B2B)
--   8. realestate-offices      P4 — empty row (B2B)
--
-- Idempotent: skips insert if real-estate parent exists.
--
-- Reference: planning/PHASE-4A-AUDIT.md §3 (taxonomy locked)
-- Depends on: 0004 (categories table), 0018 (automotive pattern)
-- ============================================================================

DO $$
DECLARE
  v_real_estate_id BIGINT;
  v_existing       INT;
BEGIN
  -- Idempotency check
  SELECT COUNT(*) INTO v_existing FROM categories WHERE slug = 'real-estate';
  IF v_existing > 0 THEN
    RAISE NOTICE 'real-estate taxonomy already exists — skipping';
    RETURN;
  END IF;

  -- ── Parent row ────────────────────────────────────────────────────────
  -- Parent rows require `tier` (p0/p1/p2/p3) per categories_check constraint.
  -- Real-estate = p2 per TAXONOMY-V2 §2 (Property For Rent is P2 entry).
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon, tier,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'real-estate', 'عقارات', 'Real Estate', NULL, 'home', 'p2',
    3, true, false, 5, false  -- sort_order=3 places it after automotive (1) + electronics (2)
  ) RETURNING id INTO v_real_estate_id;

  -- ── Sub-categories ────────────────────────────────────────────────────

  -- 1. Property for rent — highest-volume sub-cat, default entry
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'property-for-rent', 'عقار للإيجار', 'Property For Rent', v_real_estate_id, 'home',
    1, true, false, 5, false
  );

  -- 2. Property for sale — second-highest volume, Law 74 eligibility applies
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'property-for-sale', 'عقار للبيع', 'Property For Sale', v_real_estate_id, 'tag',
    2, true, false, 8, false  -- higher min_photos for sale (big-ticket item)
  );

  -- 3. Rooms for rent — ⭐ Dealo differentiator (Dubizzle buries this)
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'rooms-for-rent', 'غرف للإيجار', 'Rooms For Rent', v_real_estate_id, 'door-open',
    3, true, false, 3, false  -- lower photo floor for single-room listings
  );

  -- 4. Land — commercial/residential plots (by zoning_type in category_fields)
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'land', 'أراضي', 'Land', v_real_estate_id, 'map',
    4, true, false, 3, false  -- plots have limited visual content
  );

  -- 5. Property exchange — Kuwait cultural practice (بدل); validated by Q84Sale
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'property-for-exchange', 'عقار للبدل', 'Property For Exchange', v_real_estate_id, 'repeat',
    5, true, false, 5, false
  );

  -- 6. International property — out-of-Kuwait listings (Phase 4+)
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'international-property', 'عقار دولي', 'International Property', v_real_estate_id, 'globe',
    6, true, false, 5, false
  );

  -- 7. Property management — B2B service listings (Phase 4+)
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'property-management', 'إدارة أملاك', 'Property Management', v_real_estate_id, 'briefcase',
    7, true, false, 1, false
  );

  -- 8. Real estate offices — B2B dealer profiles (Phase 4+)
  INSERT INTO categories (
    slug, name_ar, name_en, parent_id, icon,
    sort_order, is_active, requires_video, min_photos, requires_auth_statement
  ) VALUES (
    'realestate-offices', 'مكاتب عقارات', 'Real Estate Offices', v_real_estate_id, 'building',
    8, true, false, 1, false
  );

  RAISE NOTICE 'Seeded real-estate taxonomy: 1 parent + 8 sub-cats';
END $$;
