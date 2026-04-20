-- ============================================================================
-- 0017_listings_slug.sql — SEO-friendly slug column on listings
-- ============================================================================
-- Adds a URL-safe slug (e.g. "bmw-m5-competition-2024-1001") so listing
-- detail pages can be reached via /rides/<slug> (or /listings/<slug>)
-- instead of bare numeric IDs. Slug generation happens at the app layer
-- (server action on publish): slugify(title) + '-' + id.
--
-- Strategy:
--   1. ADD COLUMN nullable (so existing rows aren't forced to compute).
--   2. Backfill existing rows with a deterministic placeholder.
--   3. Flip to NOT NULL + UNIQUE + format CHECK.
--
-- Reference: planning/PHASE-3-SUPABASE.md §7 Q5 (locked Option B)
-- Depends on: 0005_listings.sql
-- ============================================================================

-- Step 1: nullable column
ALTER TABLE listings
  ADD COLUMN slug TEXT;

-- Step 2: backfill. `listings` is currently empty but this guarantees
-- the migration is safe to re-run in an environment that ever had rows.
UPDATE listings
  SET slug = 'listing-' || id
  WHERE slug IS NULL;

-- Step 3: tighten the column
ALTER TABLE listings
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE listings
  ADD CONSTRAINT listings_slug_unique UNIQUE (slug);

-- Format: lowercase alphanumeric + hyphens, 3-120 chars.
-- Matches the shape produced by the app-layer slugifier.
ALTER TABLE listings
  ADD CONSTRAINT chk_slug_format
    CHECK (slug ~ '^[a-z0-9-]+$' AND LENGTH(slug) BETWEEN 3 AND 120);

-- Dedicated btree index for prefix / equality lookups from the router.
-- (UNIQUE above creates its own index, but keeping this explicit per
-- the migration plan makes intent readable and lets us swap strategies
-- later without touching the constraint.)
CREATE INDEX listings_slug_idx ON listings (slug);

COMMENT ON COLUMN listings.slug IS
  'URL-safe identifier: slugify(title) + "-" + id. Populated by the app-layer server action at publish time.';
