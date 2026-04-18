-- ============================================================================
-- 0003_profiles.sql — User Profiles
-- ============================================================================
-- Extends Supabase's auth.users with Dealo Hub-specific profile data.
-- Profile row is auto-created via trigger when a user signs up.
--
-- Trust signals tracked here:
--   * phone_verified_at       — Decision: baseline phone OTP required
--   * id_verified_at          — V2 enhanced verification
--   * is_founding_partner     — curated badge (3 launch partners)
--   * rating + rating_count   — earned from transactions
--
-- Depends on: 0002_enums_reference.sql (for country_code FK)
-- ============================================================================

CREATE TABLE profiles (
  -- Identity (linked to auth.users)
  id                        UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public identity
  display_name              TEXT         NOT NULL CHECK (LENGTH(display_name) BETWEEN 2 AND 50),
  handle                    CITEXT       UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  avatar_url                TEXT,
  bio                       TEXT         CHECK (LENGTH(bio) <= 300),

  -- Contact (hidden by default — chat-only moat)
  phone_e164                TEXT         UNIQUE CHECK (phone_e164 ~ '^\+\d{6,15}$'),
  phone_verified_at         TIMESTAMPTZ,
  email                     CITEXT       UNIQUE,

  -- Geographic context
  country_code              CHAR(2)      NOT NULL DEFAULT 'KW' REFERENCES countries(code),

  -- Locale preferences
  preferred_locale          CHAR(2)      NOT NULL DEFAULT 'ar' CHECK (preferred_locale IN ('ar', 'en')),

  -- Trust signals
  id_verified_at            TIMESTAMPTZ,                          -- V2 (KYC)
  is_founding_partner       BOOLEAN      NOT NULL DEFAULT false,
  is_banned                 BOOLEAN      NOT NULL DEFAULT false,
  ban_reason                TEXT,

  -- Reputation (derived from ratings, updated via trigger)
  rating_avg                NUMERIC(3,2) CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count              INT          NOT NULL DEFAULT 0,

  -- Stats (derived, updated via trigger)
  active_listings_count     INT          NOT NULL DEFAULT 0,
  sold_listings_count       INT          NOT NULL DEFAULT 0,

  -- Timestamps
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_active_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_country       ON profiles (country_code);
CREATE INDEX idx_profiles_handle        ON profiles (handle) WHERE handle IS NOT NULL;
CREATE INDEX idx_profiles_phone         ON profiles (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE INDEX idx_profiles_founding      ON profiles (is_founding_partner) WHERE is_founding_partner = true;
CREATE INDEX idx_profiles_rating        ON profiles (rating_avg DESC NULLS LAST, rating_count DESC);
CREATE INDEX idx_profiles_last_active   ON profiles (last_active_at DESC);

COMMENT ON TABLE profiles IS 'Extends auth.users with Dealo Hub user profile. 1:1 with auth.users.';
COMMENT ON COLUMN profiles.handle IS 'Optional username, lowercase alphanumeric + underscore, 3-20 chars.';
COMMENT ON COLUMN profiles.phone_e164 IS 'Stored E.164 format (+965XXXXXXXX). Hidden from buyers (chat-only).';
COMMENT ON COLUMN profiles.rating_avg IS 'Derived. Updated by trigger on ratings insert/update.';
COMMENT ON COLUMN profiles.preferred_locale IS 'User language preference, used for notifications + emails.';
