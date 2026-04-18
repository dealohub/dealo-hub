-- ============================================================================
-- 0009_waitlist.sql — Pre-Launch Waitlist
-- ============================================================================
-- Email capture for landing page before Beta launch.
-- Separate from auth.users — these are prospects, not users yet.
--
-- Depends on: 0002 (country_code FK)
-- ============================================================================

CREATE TABLE waitlist (
  id                BIGSERIAL       PRIMARY KEY,
  email             CITEXT          NOT NULL UNIQUE,
  country_code      CHAR(2)         NOT NULL DEFAULT 'KW' REFERENCES countries(code),
  preferred_locale  CHAR(2)         NOT NULL DEFAULT 'ar' CHECK (preferred_locale IN ('ar', 'en')),

  -- Optional: what they're most interested in selling/buying
  primary_interest  TEXT            CHECK (primary_interest IN (
                      'electronics', 'furniture', 'luxury', 'baby-kids',
                      'games-hobbies', 'sports-outdoor', 'home-fitness',
                      'home-appliances', 'beauty', 'general'
                    ) OR primary_interest IS NULL),

  -- Attribution
  referrer_url      TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,

  -- Flags
  is_seller         BOOLEAN         NOT NULL DEFAULT false,  -- "I want to sell" checkbox
  is_buyer          BOOLEAN         NOT NULL DEFAULT true,   -- default assumption
  is_confirmed      BOOLEAN         NOT NULL DEFAULT false,  -- email double-opt-in (V2)
  confirmed_at      TIMESTAMPTZ,

  -- Conversion tracking
  converted_to_user_id UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  converted_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_country       ON waitlist (country_code, created_at DESC);
CREATE INDEX idx_waitlist_unconfirmed   ON waitlist (created_at DESC) WHERE is_confirmed = false;
CREATE INDEX idx_waitlist_seller        ON waitlist (country_code) WHERE is_seller = true;
CREATE INDEX idx_waitlist_not_converted ON waitlist (created_at DESC) WHERE converted_to_user_id IS NULL;

-- updated_at trigger
CREATE TRIGGER trg_waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS — public can INSERT, only admins can SELECT
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- No SELECT policy = default deny for non-service-role queries.
-- Admins use service role to view waitlist via Supabase dashboard.

COMMENT ON TABLE waitlist IS 'Pre-launch email signups. Public INSERT only; admin SELECT via service role.';
COMMENT ON COLUMN waitlist.primary_interest IS 'Optional category preference — drives first-outreach targeting.';
COMMENT ON COLUMN waitlist.is_seller IS 'User checked "I want to sell" — prioritize for Founding Seller program.';
