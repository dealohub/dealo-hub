-- ============================================================================
-- 0020_listings_badges_and_old_price.sql — listings badges + old price
-- ============================================================================
-- Adds three generic columns to listings (apply to every vertical, not
-- automotive-specific):
--
--   * old_price_minor_units — nullable BIGINT. Set when the seller
--     reduces the price; UI renders a strike-through + drop-percent
--     badge. Must exceed the current price when present.
--
--   * is_featured — BOOLEAN flag for paid "featured" placement in the
--     rides hub / home strips. Seller pays for this; ops toggles it.
--
--   * is_hot — BOOLEAN flag for trending / high-engagement listings.
--     May become trigger-maintained later (derived from view_count +
--     save_count velocity). For V1 it's a manual flag set during
--     seeding / admin curation.
--
-- Partial indexes on both flags — only the "true" rows matter for
-- the filtered queries that power hub placement rows.
--
-- Reference: planning/PHASE-3B-AUDIT.md §3.1
-- Depends on: 0005_listings.sql
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN old_price_minor_units BIGINT
    CHECK (old_price_minor_units IS NULL OR old_price_minor_units > 0),
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_hot      BOOLEAN NOT NULL DEFAULT false;

-- Sanity: an "old" price must be strictly higher than the current one,
-- otherwise the strike-through would be misleading.
ALTER TABLE listings
  ADD CONSTRAINT chk_old_price_exceeds_current
    CHECK (
      old_price_minor_units IS NULL
      OR old_price_minor_units > price_minor_units
    );

-- Partial indexes — only the true rows matter.
-- Used by: rides-featured-premium hub strip, trending rails.
CREATE INDEX listings_is_featured_idx
  ON listings (is_featured)
  WHERE is_featured = true;

CREATE INDEX listings_is_hot_idx
  ON listings (is_hot)
  WHERE is_hot = true;

COMMENT ON COLUMN listings.old_price_minor_units IS
  'Previous price before the seller reduced it. Drives strike-through UI. NULL when the listing has never had a price drop.';
COMMENT ON COLUMN listings.is_featured IS
  'Paid premium placement. Set by ops or billing pipeline; not user-editable.';
COMMENT ON COLUMN listings.is_hot IS
  'Trending flag. V1: manual. Future: trigger-maintained from view_count / save_count velocity.';
