-- ============================================================================
-- 0032_backfill_property_area_ids.sql — attach areas to the 10 property seeds
-- ============================================================================
-- Migration 0027 seeded 10 Property listings with `area_id = NULL`. The hub
-- card + detail header + live feed + similar-properties strip all support
-- a specific area (e.g. "Bayan · Hawalli") now that `src/lib/properties/
-- queries.ts` joins the `areas` table — but the seeds still render only
-- the governorate because the FK is null.
--
-- Backfill strategy: match by area-in-title regex against the seed
-- listings. Areas are derived from migration 0027's title field:
--
--   14 · شاليه بنيدر          → Ahmadi (Bneidar resort) — no dedicated area
--                                in the seed, leave null
--   15 · شاليه صباح الأحمد     → Ahmadi (Sabah Al-Ahmad Sea City) — leave null
--   16 · شقة في السالمية      → Salmiya (areas.id=11, city=Hawalli)
--   17 · شقة على الخارطة       → (off-plan, no location hint) leave null
--   18 · فيلا في بيان          → Bayan (id=16)
--   19 · تاون هاوس في مشرف     → Mishref (id=17)
--   20 · غرفة مفروشة في حولي   → Hawalli area (id=12)
--   21 · قسيمة صناعية الشويخ   → Shuwaikh (no area row; leave null)
--   22 · بنتهاوس برج الحمراء    → Sharq (id=2, Al-Hamra Tower location)
--   23 · تاون هاوس مبارك       → Mubarak Al-Kabeer area (id=39)
--
-- Idempotent by construction: uses the area slug (stable) instead of
-- hard-coded ids, and only updates rows whose area_id is still null so
-- re-running is a no-op.
--
-- Reference: src/lib/properties/queries.ts (areaName join)
-- Depends on: 0025 (real-estate taxonomy), 0027 (seed properties),
--             0002_cities_kw.sql (areas for city_id 1/2/5)
-- ============================================================================

DO $$
DECLARE
  v_updated INT := 0;
BEGIN
  -- Helper pattern: one UPDATE per listing, keyed by title so we don't
  -- depend on brittle hard-coded ids (listings serial could vary across
  -- environments). Areas resolved by slug.
  WITH seed_area_map(title, area_slug) AS (
    VALUES
      ('شقة في السالمية',            'salmiya'),
      ('فيلا في بيان — مفحوصة ديلو', 'bayan'),
      ('تاون هاوس في مشرف',          'mishref'),
      ('غرفة مفروشة في حولي',        'hawalli-area'),
      ('بنتهاوس برج الحمراء',          'sharq'),
      ('تاون هاوس مبارك — مفحوصة ديلو', 'mubarak-area')
  )
  UPDATE listings l
  SET area_id = a.id
  FROM seed_area_map m
  JOIN areas a ON a.slug = m.area_slug
  WHERE l.title = m.title
    AND l.area_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Backfilled area_id on % property seed listings', v_updated;
END $$;
