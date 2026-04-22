-- ============================================================================
-- 0033_electronics_v2_tables.sql — Electronics v2 schema tables
-- ============================================================================
-- Two tables that Phase 7 v2 depends on:
--
-- 1. `electronics_device_catalog` — canonical device model list. Feeds the
--    catalog-first sell wizard (pillar P1) so sellers pick a known model
--    instead of typing free-text titles. Starts small (~40 models in the
--    companion seed migration) and grows as we observe live listing
--    patterns. Crowd-sourced expansion is a Phase 8 concern.
--
-- 2. `electronics_imei_registry` — IMEI uniqueness ledger (pillar P2).
--    One IMEI = one active listing on Dealo, ever. Re-listing the same
--    device requires the prior seller to sign a transfer-of-ownership
--    acknowledgement. The full IMEI is stored HASHED (SHA-256) — the
--    plain IMEI never lives in the DB. This is the cheapest privacy +
--    anti-stolen-device layer we can run without paying for GSMA API
--    access.
--
-- Design decisions:
--   - Model slug (catalog.slug) is the stable join key; NEVER the PK id.
--     Sellers reference 'iphone-15-pro-max-256gb' in listings, not id=42.
--   - Storage + color variants are modelled as separate rows in the
--     catalog for simplicity (iphone-15-pro-max-256gb, -512gb, -1tb each
--     get their own row). Alternative was a dependent-fields schema; we
--     picked rows to keep the wizard flat.
--   - imei_registry.imei_hash uses Postgres pgcrypto digest(..., 'sha256')
--     so we never need to roundtrip the plain IMEI through application
--     memory for uniqueness checks. A seller claims IMEI ABC123XY789 →
--     we hash it → look up → reject if exists.
--   - imei_registry keeps `active` so transferred / deleted listings
--     don't block legitimate resellers. Only `active=true` rows block
--     new listings.
--
-- Reference: planning/PHASE-7A-ELECTRONICS-V2.md §P1 (catalog-first), §P2 (IMEI uniqueness)
-- Depends on: 0005 (listings), 0015 (category_fields JSONB)
-- ============================================================================

-- ── pgcrypto for digest() — idempotent ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Device catalog ───────────────────────────────────────────────────────
--
-- One row per (brand, model, primary variant). Example rows the v2 seed
-- inserts:
--   apple · iPhone 15 Pro Max · 256GB · Natural Titanium
--   apple · iPhone 15 Pro Max · 512GB · Natural Titanium
--   apple · MacBook Pro 14" M3 Pro · 18GB/512GB · Space Black
--   sony · PlayStation 5 · 825GB · Disc Edition
--
-- The wizard uses `slug` to match what the seller typed (autocomplete)
-- and then displays `display_name`. Storage/color are canonical here
-- so the seller can't claim a 128GB variant Apple never shipped.

CREATE TABLE IF NOT EXISTS public.electronics_device_catalog (
  id            bigserial PRIMARY KEY,
  /** Stable slug used as FK from listings.category_fields.model_slug.
    *  Format: <brand>-<model>-<variant> (lowercase, hyphens).
    *  e.g. 'iphone-15-pro-max-256gb' */
  slug          text NOT NULL UNIQUE,
  /** Brand name — latin (iPhone/Samsung/Sony/Microsoft...). */
  brand         text NOT NULL,
  /** Model name — canonical form (iPhone 15 Pro Max / MacBook Pro 14" M3 Pro). */
  model         text NOT NULL,
  /** Device-kind enum value (matches src/lib/electronics/validators.ts). */
  device_kind   text NOT NULL CHECK (
    device_kind IN (
      'phone', 'tablet', 'laptop', 'desktop',
      'tv', 'soundbar', 'headphones', 'speaker',
      'console', 'handheld_console', 'accessory',
      'smart_watch', 'camera', 'lens'
    )
  ),
  /** Storage variant (GB). Null for devices without user-visible storage
      (TVs, headphones, lenses). */
  storage_gb    integer,
  /** RAM variant (GB). Null for most devices; laptops set this. */
  ram_gb        integer,
  /** Screen size in inches. Null for speakers/accessories. */
  screen_size_inches numeric(4,1),
  /** Year the model was first released — helps the wizard sort by recency. */
  release_year  integer,
  /** MSRP in the GCC at launch (minor units, KWD). Null if unknown; used
      later for price-anomaly warnings. */
  launch_price_minor_units bigint,
  /** Display label the wizard shows — 'iPhone 15 Pro Max · 256GB'. */
  display_name  text NOT NULL,
  /** Parent Dealo category slug — 'phones-tablets', 'laptops-computers', etc. */
  sub_cat       text NOT NULL CHECK (
    sub_cat IN (
      'phones-tablets', 'laptops-computers', 'tvs-audio',
      'gaming', 'smart-watches', 'cameras'
    )
  ),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.electronics_device_catalog IS
  'Canonical device model list. Sellers pick from this in the /sell wizard (pillar P1). Seeded with ~40 models; expanded as market requires.';

CREATE INDEX IF NOT EXISTS electronics_device_catalog_brand_model_idx
  ON public.electronics_device_catalog (brand, model)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS electronics_device_catalog_sub_cat_idx
  ON public.electronics_device_catalog (sub_cat, release_year DESC)
  WHERE is_active = true;

-- Public read — the wizard queries this anonymously
ALTER TABLE public.electronics_device_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS electronics_catalog_public_read ON public.electronics_device_catalog;
CREATE POLICY electronics_catalog_public_read
  ON public.electronics_device_catalog
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


-- ── 2. IMEI registry (hashed — plain IMEI never stored) ─────────────────────
--
-- Uniqueness invariant: one IMEI hash can have at most one row where
-- `active = true`. Enforced with a partial unique index. New listing
-- with a matching hash is blocked at publish time (pillar P2).
--
-- Transfer flow (phase 8+): the prior seller signs a handoff message,
-- which toggles active=false on their row and allows the new seller
-- to register a new active row.

CREATE TABLE IF NOT EXISTS public.electronics_imei_registry (
  id            bigserial PRIMARY KEY,
  /** SHA-256 hash of the uppercased IMEI/serial. Plain IMEI never stored. */
  imei_hash     text NOT NULL,
  /** The listing currently holding this IMEI. Nullable when the listing
      is deleted (hash row stays for audit). */
  listing_id    bigint REFERENCES public.listings(id) ON DELETE SET NULL,
  /** Seller who registered this IMEI. Used for the transfer-handoff flow. */
  seller_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  /** True while the listing is live. Toggled false on sold / withdrawn /
      transferred. Only active=true rows block new registrations. */
  active        boolean NOT NULL DEFAULT true,
  /** Optional note — e.g. 'transferred on 2026-05-01 to seller XYZ'. */
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);

COMMENT ON TABLE public.electronics_imei_registry IS
  'Hashed-IMEI uniqueness ledger. Enforces one-IMEI-one-active-listing across all of Dealo Electronics (pillar P2).';

CREATE UNIQUE INDEX IF NOT EXISTS electronics_imei_registry_active_hash_uk
  ON public.electronics_imei_registry (imei_hash)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS electronics_imei_registry_listing_idx
  ON public.electronics_imei_registry (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS electronics_imei_registry_seller_idx
  ON public.electronics_imei_registry (seller_id, created_at DESC);

-- RLS: sellers can only see their own registry entries. Service role
-- writes via the publish action.
ALTER TABLE public.electronics_imei_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS electronics_imei_registry_seller_read ON public.electronics_imei_registry;
CREATE POLICY electronics_imei_registry_seller_read
  ON public.electronics_imei_registry
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- No INSERT/UPDATE policy for authenticated — service role only.
-- (The anon key can never write.) This keeps the uniqueness authority
-- in the publish server-action, which is the one writer.


-- ── 3. RPC: check_electronics_imei_unique ───────────────────────────────────
--
-- Given a plain IMEI + seller_id, hash it and report whether a new
-- listing can register it. Used by the pre-publish wizard modal.
-- SECURITY DEFINER so the anon wizard can call it without being able
-- to read the whole table.
--
-- Returns one of:
--   'clean'      — no conflict, seller can register
--   'own_listing'— already registered on this seller's prior listing
--                  (legitimate re-list; can proceed via transfer flow)
--   'blocked'    — registered on a DIFFERENT seller's active listing
--                  (stolen / duplicate)

CREATE OR REPLACE FUNCTION public.check_electronics_imei_unique(
  p_imei text,
  p_seller_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash text;
  v_other_active_count int;
  v_own_active_count int;
BEGIN
  -- Normalise: uppercase, strip whitespace. Full IMEI validation (Luhn)
  -- happens client-side before we're called.
  v_hash := encode(digest(upper(regexp_replace(p_imei, '\s', '', 'g')), 'sha256'), 'hex');

  SELECT COUNT(*) INTO v_other_active_count
  FROM public.electronics_imei_registry
  WHERE imei_hash = v_hash
    AND active = true
    AND seller_id <> p_seller_id;

  IF v_other_active_count > 0 THEN
    RETURN 'blocked';
  END IF;

  SELECT COUNT(*) INTO v_own_active_count
  FROM public.electronics_imei_registry
  WHERE imei_hash = v_hash
    AND active = true
    AND seller_id = p_seller_id;

  IF v_own_active_count > 0 THEN
    RETURN 'own_listing';
  END IF;

  RETURN 'clean';
END;
$$;

COMMENT ON FUNCTION public.check_electronics_imei_unique IS
  'Hash + lookup a candidate IMEI against the active registry. Returns clean/own_listing/blocked. SECURITY DEFINER — accessible from the wizard without exposing the table.';

GRANT EXECUTE ON FUNCTION public.check_electronics_imei_unique TO authenticated;
