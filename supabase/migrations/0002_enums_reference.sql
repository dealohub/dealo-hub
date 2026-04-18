-- ============================================================================
-- 0002_enums_reference.sql — Enums + Reference Tables
-- ============================================================================
-- Creates:
--   * All enum types (price_mode, condition, status, etc.)
--   * countries, cities, areas (GCC-hierarchical)
--
-- Depends on: 0001_extensions.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

-- Listing lifecycle status
CREATE TYPE listing_status AS ENUM (
  'draft',      -- seller still editing
  'live',       -- active, visible
  'archived',   -- expired, revivable within 7d
  'deleted',    -- soft-deleted, retained 90d
  'sold',       -- marked sold by seller
  'held',       -- admin review queue (fraud flagged)
  'rejected'    -- admin rejected
);

-- Price negotiation mode (Decision #3)
CREATE TYPE price_mode AS ENUM (
  'fixed',        -- 🔒 price is firm
  'negotiable',   -- 💬 open to negotiation
  'best_offer'    -- 🎯 accepts offers (minimum optional)
);

-- Item condition (matches AI Photo-to-Listing extraction)
CREATE TYPE item_condition AS ENUM (
  'new',                  -- brand new, unopened
  'new_with_tags',        -- new, tags/labels attached
  'like_new',             -- essentially new, minor signs of use
  'excellent_used',       -- used, excellent condition
  'good_used',            -- used, good condition
  'fair_used'             -- used, fair condition, functional
);

-- Delivery options (Decision — multi-select field)
CREATE TYPE delivery_option AS ENUM (
  'pickup',             -- buyer picks up from seller location
  'seller_delivers',    -- seller can deliver (negotiable)
  'buyer_ships'         -- buyer arranges shipping
);

-- Priority tier for categories
CREATE TYPE category_tier AS ENUM ('p0', 'p1', 'p2');

-- Fraud status for listings (AI layer)
CREATE TYPE fraud_status AS ENUM (
  'pending',          -- awaiting AI check
  'clean',            -- passed all checks
  'flagged',          -- low-severity flags, published with warnings
  'held',             -- high-severity, admin review required
  'approved_manual',  -- admin reviewed and approved
  'rejected'          -- admin rejected
);

-- Report reasons (for user reports)
CREATE TYPE report_reason AS ENUM (
  'spam',
  'fraud_scam',
  'prohibited_item',
  'stolen_goods',
  'counterfeit',
  'misleading_info',
  'inappropriate_content',
  'harassment',
  'other'
);

-- Report status
CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);

-- ----------------------------------------------------------------------------
-- Countries
-- ----------------------------------------------------------------------------
-- ISO 3166-1 alpha-2 codes. GCC-ready.
-- Data seed in supabase/seed/0001_countries.sql
CREATE TABLE countries (
  code          CHAR(2)      PRIMARY KEY,   -- 'KW', 'SA', 'AE', 'BH', 'QA', 'OM'
  name_ar       TEXT         NOT NULL,
  name_en       TEXT         NOT NULL,
  currency_code CHAR(3)      NOT NULL,      -- 'KWD', 'SAR', 'AED', etc.
  phone_code    VARCHAR(6)   NOT NULL,      -- '+965', '+966', etc.
  is_active     BOOLEAN      NOT NULL DEFAULT false,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_countries_active ON countries (is_active, sort_order) WHERE is_active = true;

COMMENT ON TABLE countries IS 'GCC-ready country reference. V1: only KW active.';
COMMENT ON COLUMN countries.is_active IS 'Phase 2 activation toggle per GCC-READINESS.md';

-- ----------------------------------------------------------------------------
-- Cities
-- ----------------------------------------------------------------------------
-- Governorates in Kuwait, major cities in other GCC countries.
CREATE TABLE cities (
  id            BIGSERIAL    PRIMARY KEY,
  country_code  CHAR(2)      NOT NULL REFERENCES countries(code) ON DELETE RESTRICT,
  slug          TEXT         NOT NULL,
  name_ar       TEXT         NOT NULL,
  name_en       TEXT         NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (country_code, slug)
);

CREATE INDEX idx_cities_country_active ON cities (country_code, is_active);

COMMENT ON TABLE cities IS 'Cities or governorates. Kuwait uses 6 governorates as "cities".';

-- ----------------------------------------------------------------------------
-- Areas
-- ----------------------------------------------------------------------------
-- Granular areas within cities (e.g., "Salmiya", "Hawally").
CREATE TABLE areas (
  id            BIGSERIAL    PRIMARY KEY,
  city_id       BIGINT       NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug          TEXT         NOT NULL,
  name_ar       TEXT         NOT NULL,
  name_en       TEXT         NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (city_id, slug)
);

CREATE INDEX idx_areas_city ON areas (city_id, sort_order);

COMMENT ON TABLE areas IS 'Sub-divisions of cities. Kuwait has ~50 areas across 6 governorates.';

-- ----------------------------------------------------------------------------
-- Search helpers
-- ----------------------------------------------------------------------------

-- Function: get active country codes (helper for RLS policies)
CREATE OR REPLACE FUNCTION active_country_codes()
RETURNS SETOF CHAR(2)
LANGUAGE SQL STABLE
AS $$
  SELECT code FROM countries WHERE is_active = true;
$$;

COMMENT ON FUNCTION active_country_codes IS 'RLS helper — returns codes of countries currently active.';
