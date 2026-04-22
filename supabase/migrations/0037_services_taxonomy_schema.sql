-- ============================================================================
-- 0037_services_taxonomy_schema.sql — Phase 8a Services vertical foundation
-- ============================================================================
-- Introduces the `services` parent category + `home-services` sub-cat,
-- extends the `profiles` table with provider-verification + attestations,
-- and creates 3 new tables (areas-served, bookings, reviews) that back
-- the doctrine in planning/PHASE-8A-HOME-SERVICES.md.
--
-- Scope boundaries (match doctrine §1):
--   • Only 1 sub-cat inserted today: `home-services`. The 6 other
--     sub-cats from TAXONOMY-V2 (moving-storage, beauty-services,
--     event-services, photography, repair-maintenance, delivery-courier)
--     get their own phases with their own doctrines.
--   • provider-verification enum mirrors listings.verification_tier so
--     both fields speak the same tiering language across the platform.
--   • new tables carry RLS policies mirroring conversations+messages
--     (only the parties of a booking can read/write their rows).
--
-- Idempotent via IF NOT EXISTS + ON CONFLICT. Safe to replay.
-- ============================================================================

BEGIN;

-- ── 1. Taxonomy ──────────────────────────────────────────────────────────────

-- Parent: services
INSERT INTO categories (slug, name_ar, name_en, icon, tier, sort_order, is_active)
VALUES ('services', 'خدمات', 'Services', 'Wrench', 'p2', 130, true)
ON CONFLICT (slug) DO NOTHING;

-- Sub-cat: home-services (Phase 8a — only one today)
INSERT INTO categories (parent_id, slug, name_ar, name_en, icon, sort_order, is_active)
SELECT id, 'home-services', 'خدمات منزلية', 'Home Services', 'Sparkles', 1, true
FROM categories WHERE slug = 'services'
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Profile extensions (P2 verification + P9 attestations) ────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS services_provider_verification_tier TEXT
    DEFAULT 'unverified';

-- Separate constraint add so existing rows don't violate on backfill.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_services_verification_tier_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_services_verification_tier_check
      CHECK (services_provider_verification_tier IN (
        'unverified', 'identity_verified', 'address_verified', 'dealo_inspected'
      ));
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS services_attestation_68_consent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS services_attestation_authorization_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.services_provider_verification_tier IS
  'Phase 8a P2 — tiered trust gate. Individual providers max at identity_verified; dealo_inspected requires MOCI license on file.';
COMMENT ON COLUMN profiles.services_attestation_68_consent_at IS
  'Phase 8a P9 — timestamp of provider attestation re: Law 68/2015 compliance. NULL blocks services listing creation.';
COMMENT ON COLUMN profiles.services_attestation_authorization_at IS
  'Phase 8a P9 — timestamp of provider attestation re: authorization to offer the service (MOCI or non-regulated).';

-- ── 3. service_areas_served — P6 area-level serving map ──────────────────────

CREATE TABLE IF NOT EXISTS service_areas_served (
  provider_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id BIGINT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_profile_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_service_areas_served_area
  ON service_areas_served (area_id);

ALTER TABLE service_areas_served ENABLE ROW LEVEL SECURITY;

-- Anyone can READ (needed for "which providers serve Hawalli?" queries on the hub).
DROP POLICY IF EXISTS service_areas_served_public_read ON service_areas_served;
CREATE POLICY service_areas_served_public_read ON service_areas_served
  FOR SELECT TO public USING (true);

-- Only the provider themselves can write/delete their own areas.
DROP POLICY IF EXISTS service_areas_served_provider_write ON service_areas_served;
CREATE POLICY service_areas_served_provider_write ON service_areas_served
  FOR ALL TO authenticated
  USING (provider_profile_id = auth.uid())
  WITH CHECK (provider_profile_id = auth.uid());

-- ── 4. service_bookings — booking lifecycle tracker ──────────────────────────

CREATE TABLE IF NOT EXISTS service_bookings (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES profiles(id),
  provider_profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Scheduling (P4: booking_proposal kind populates these)
  slot_start_at TIMESTAMPTZ NOT NULL,
  slot_end_at   TIMESTAMPTZ NOT NULL,

  -- Pricing
  estimated_total_minor_units BIGINT NOT NULL CHECK (estimated_total_minor_units > 0),
  currency_code TEXT NOT NULL DEFAULT 'KWD',

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'completed', 'cancelled', 'disputed')),
  buyer_completion_at    TIMESTAMPTZ,  -- P5: review unlocks when BOTH marked
  provider_completion_at TIMESTAMPTZ,

  -- P8 Dealo Guarantee flag — computed once by the writer based on
  -- whether the whole lifecycle stayed in Dealo chat. Not user-editable.
  guarantee_applies BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (slot_end_at > slot_start_at)
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_buyer
  ON service_bookings (buyer_profile_id, status, slot_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider
  ON service_bookings (provider_profile_id, status, slot_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_bookings_conversation
  ON service_bookings (conversation_id);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_bookings_parties_read ON service_bookings;
CREATE POLICY service_bookings_parties_read ON service_bookings
  FOR SELECT TO authenticated
  USING (buyer_profile_id = auth.uid() OR provider_profile_id = auth.uid());

DROP POLICY IF EXISTS service_bookings_parties_write ON service_bookings;
CREATE POLICY service_bookings_parties_write ON service_bookings
  FOR INSERT TO authenticated
  WITH CHECK (buyer_profile_id = auth.uid() OR provider_profile_id = auth.uid());

DROP POLICY IF EXISTS service_bookings_parties_update ON service_bookings;
CREATE POLICY service_bookings_parties_update ON service_bookings
  FOR UPDATE TO authenticated
  USING (buyer_profile_id = auth.uid() OR provider_profile_id = auth.uid())
  WITH CHECK (buyer_profile_id = auth.uid() OR provider_profile_id = auth.uid());

-- ── 5. service_reviews — post-completion review (P5) ─────────────────────────

CREATE TABLE IF NOT EXISTS service_reviews (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id),

  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body   TEXT            CHECK (LENGTH(body) <= 1000),

  -- Structured tags (doctrine decision #4: {on-time, clean-work, fair-price})
  tag_on_time    BOOLEAN,
  tag_clean_work BOOLEAN,
  tag_fair_price BOOLEAN,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One review per reviewer per booking (two reviews max per booking: buyer→provider + provider→buyer)
  UNIQUE (booking_id, reviewer_profile_id),
  -- Reviewer must be DIFFERENT from reviewed party
  CHECK (reviewer_profile_id <> reviewed_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_reviewed
  ON service_reviews (reviewed_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_reviews_booking
  ON service_reviews (booking_id);

ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are PUBLIC (they're the whole trust point).
DROP POLICY IF EXISTS service_reviews_public_read ON service_reviews;
CREATE POLICY service_reviews_public_read ON service_reviews
  FOR SELECT TO public USING (true);

-- Only the reviewer can INSERT their own review, and only for a booking they were a party to.
DROP POLICY IF EXISTS service_reviews_parties_insert ON service_reviews;
CREATE POLICY service_reviews_parties_insert ON service_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM service_bookings b
      WHERE b.id = booking_id
        AND (b.buyer_profile_id = auth.uid() OR b.provider_profile_id = auth.uid())
        AND b.buyer_completion_at IS NOT NULL
        AND b.provider_completion_at IS NOT NULL
    )
  );

-- Reviews can be edited or deleted only by the reviewer within 24h of creation
-- (anti-abuse — stale review edits would undermine trust over time).
DROP POLICY IF EXISTS service_reviews_reviewer_edit ON service_reviews;
CREATE POLICY service_reviews_reviewer_edit ON service_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_profile_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours')
  WITH CHECK (reviewer_profile_id = auth.uid());

COMMIT;
