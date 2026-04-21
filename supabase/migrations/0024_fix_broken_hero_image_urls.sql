-- ============================================================================
-- 0024_fix_broken_hero_image_urls.sql — replace dead Unsplash URLs
-- ============================================================================
-- Two cover images from the 0022 re-seed and one secondary image from
-- the 0023 sixth-car seed were returning HTML error pages instead of
-- image bytes. Chrome's Opaque Response Blocking (ORB) was rejecting
-- them, which left the Mercedes-AMG G63 and Honda Civic Type R hero
-- scatters rendering as broken-image icons on the landing page.
--
-- Dead URLs (verified via `curl -I`):
--   * photo-1519440938413-ef91a6a76342  →  G63 cover   (ERR_BLOCKED_BY_ORB)
--   * photo-1611821064430-0d40291922d2  →  Civic cover (ERR_BLOCKED_BY_ORB)
--   * photo-1544829099-b9a0c5303bea     →  Porsche #2  (HTTP 404)
--
-- Replacements are verified 200-OK Unsplash photos in the same visual
-- family (Mercedes-AMG GT for the G63 slot, white sport-hatch for the
-- Civic slot, Audi RS7 for the Porsche interior placeholder). Not
-- brand-perfect, but hero teasers aren't detail shots — the alt text
-- keeps the listing's identity intact for screen readers and SEO.
--
-- Idempotent: straight UPDATEs on url values. Safe to re-run.
--
-- Reference: Chrome DevTools network tab showed the ORB blocks during
--            hero verification for the 6th-scatter fix.
-- Depends on: 0022 (G63, Civic images), 0023 (Porsche images)
-- ============================================================================

-- Mercedes-AMG G63 cover
UPDATE listing_images
SET url = 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&auto=format&fit=crop&q=80'
WHERE url = 'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=1600&auto=format&fit=crop&q=80';

-- Honda Civic Type R cover
UPDATE listing_images
SET url = 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=1600&auto=format&fit=crop&q=80'
WHERE url = 'https://images.unsplash.com/photo-1611821064430-0d40291922d2?w=1600&auto=format&fit=crop&q=80';

-- Porsche 911 interior (position 2) — introduced as 404 in 0023
UPDATE listing_images
SET url = 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1600&auto=format&fit=crop&q=80'
WHERE url = 'https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=1600&auto=format&fit=crop&q=80';
