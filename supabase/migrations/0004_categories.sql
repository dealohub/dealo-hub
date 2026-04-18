-- ============================================================================
-- 0004_categories.sql — Categories Table (Schema Only)
-- ============================================================================
-- Hierarchical self-referencing table:
--   * Top-level (parent_id IS NULL): 10 main categories
--   * Second-level (parent_id = main.id): ~50 sub-categories
--
-- Category-specific constraints embedded (luxury requires video, 8 photos, etc.)
--
-- Data populated by: supabase/seed/categories.sql
-- Depends on: 0002_enums_reference.sql (for category_tier enum)
-- ============================================================================

CREATE TABLE categories (
  id                        BIGSERIAL       PRIMARY KEY,
  parent_id                 BIGINT          REFERENCES categories(id) ON DELETE CASCADE,
  slug                      TEXT            NOT NULL UNIQUE,
  name_ar                   TEXT            NOT NULL,
  name_en                   TEXT            NOT NULL,
  icon                      TEXT,                                   -- lucide-react icon name (main categories only)
  tier                      category_tier,                          -- p0 | p1 | p2 (main categories only)
  sort_order                INT             NOT NULL DEFAULT 0,
  is_active                 BOOLEAN         NOT NULL DEFAULT true,

  -- Category-specific requirements (main categories only)
  requires_video            BOOLEAN         NOT NULL DEFAULT false,  -- true for luxury
  min_photos                INT             NOT NULL DEFAULT 5,       -- 8 for luxury
  requires_auth_statement   BOOLEAN         NOT NULL DEFAULT false,   -- true for luxury
  default_delivery_options  delivery_option[] NOT NULL DEFAULT '{pickup,seller_delivers,buyer_ships}'::delivery_option[],

  created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CHECK (min_photos BETWEEN 1 AND 10),
  -- Main categories must have tier; sub-categories must not
  CHECK (
    (parent_id IS NULL AND tier IS NOT NULL AND icon IS NOT NULL) OR
    (parent_id IS NOT NULL AND tier IS NULL)
  )
);

CREATE INDEX idx_categories_parent     ON categories (parent_id);
CREATE INDEX idx_categories_slug       ON categories (slug);
CREATE INDEX idx_categories_tier       ON categories (tier, sort_order) WHERE tier IS NOT NULL;
CREATE INDEX idx_categories_active     ON categories (is_active, sort_order) WHERE is_active = true;

COMMENT ON TABLE categories IS 'Hierarchical category taxonomy. V1: 10 main + ~50 sub.';
COMMENT ON COLUMN categories.parent_id IS 'NULL for main categories, references main category for sub.';
COMMENT ON COLUMN categories.requires_video IS 'Listings in this category must include a video (luxury only).';
COMMENT ON COLUMN categories.requires_auth_statement IS 'Seller must check authenticity statement on listing form.';

-- Helper function: get full category path (for breadcrumbs)
CREATE OR REPLACE FUNCTION category_path(cat_id BIGINT)
RETURNS TABLE (id BIGINT, slug TEXT, name_ar TEXT, name_en TEXT)
LANGUAGE SQL STABLE
AS $$
  WITH RECURSIVE path AS (
    SELECT c.id, c.parent_id, c.slug, c.name_ar, c.name_en
    FROM categories c WHERE c.id = cat_id
    UNION ALL
    SELECT c.id, c.parent_id, c.slug, c.name_ar, c.name_en
    FROM categories c JOIN path p ON c.id = p.parent_id
  )
  SELECT p.id, p.slug, p.name_ar, p.name_en FROM path p ORDER BY p.id;
$$;

COMMENT ON FUNCTION category_path IS 'Returns full path from root to given category (for breadcrumbs).';
