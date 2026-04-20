-- ============================================================================
-- 0016_profile_dealer_fields.sql — Dealer fields on profiles
-- ============================================================================
-- Adds a dealer flag + display name + verification timestamp to profiles.
-- Chosen over a separate `dealers` table (Q1 Option A) to avoid join
-- duplication in every listing query.
--
-- A dealer is a kind of profile: it has a user account, posts listings,
-- and may sign up without being a dealer at first (flip is_dealer=true
-- after KYB verification).
--
-- Partial index only on the rows that matter (is_dealer = true) keeps
-- the index tiny relative to the profiles table.
--
-- Reference: planning/PHASE-3-SUPABASE.md §7 Q1 (locked Option A)
-- Depends on: 0003_profiles.sql
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN is_dealer          BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN dealer_name        TEXT,
  ADD COLUMN dealer_verified_at TIMESTAMPTZ;

-- If the account is flagged as a dealer, a display name is required.
-- Regular (non-dealer) profiles can leave dealer_name NULL.
ALTER TABLE profiles
  ADD CONSTRAINT chk_dealer_name_required
    CHECK (is_dealer = false OR dealer_name IS NOT NULL);

-- Partial index — only dealer rows. Used for "show all dealers"
-- directory queries and dealer_id filters on listings.
CREATE INDEX profiles_is_dealer_idx
  ON profiles (is_dealer)
  WHERE is_dealer = true;

COMMENT ON COLUMN profiles.is_dealer IS
  'True for accounts that have been verified as business/dealer sellers. Drives the AUTHORIZED DEALER badge.';
COMMENT ON COLUMN profiles.dealer_name IS
  'Business display name. Required when is_dealer = true.';
COMMENT ON COLUMN profiles.dealer_verified_at IS
  'Timestamp when KYB verification completed. NULL while pending.';
