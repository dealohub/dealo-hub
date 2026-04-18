-- ============================================================================
-- 0005_listings.sql — Listings + Images
-- ============================================================================
-- The core entity. Includes:
--   * GCC-ready fields (country_code, currency_code)
--   * Price stored as BIGINT minor units (no floats)
--   * 3 price modes (fixed/negotiable/best_offer)
--   * Lifecycle fields (expires_at, archived_at, renewed_count)
--   * Delivery options multi-select
--   * AI telemetry fields (for Decision 9 monitoring)
--   * Fraud status integration
--
-- Depends on: 0001-0004
-- ============================================================================

CREATE TABLE listings (
  -- Primary key
  id                          BIGSERIAL           PRIMARY KEY,

  -- Ownership
  seller_id                   UUID                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Categorization
  category_id                 BIGINT              NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id              BIGINT              REFERENCES categories(id) ON DELETE SET NULL,

  -- Content (bilingual support V2; V1 stores in seller's locale only)
  title                       TEXT                NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 120),
  description                 TEXT                NOT NULL CHECK (LENGTH(description) BETWEEN 10 AND 5000),

  -- Item details
  condition                   item_condition      NOT NULL,
  brand                       TEXT,                                   -- e.g., "Apple" (optional, AI-suggested for luxury)
  model                       TEXT,                                   -- e.g., "iPhone 14 Pro Max" (V2 AI)
  color                       TEXT,                                   -- (V2 AI)

  -- Pricing (Decision #3)
  price_mode                  price_mode          NOT NULL,
  price_minor_units           BIGINT              NOT NULL CHECK (price_minor_units > 0),
  currency_code               CHAR(3)             NOT NULL DEFAULT 'KWD',
  min_offer_minor_units       BIGINT              CHECK (min_offer_minor_units > 0),
  is_price_negotiable         BOOLEAN             GENERATED ALWAYS AS (price_mode IN ('negotiable', 'best_offer')) STORED,

  -- Location (Decision #4 — hierarchical GCC-ready)
  country_code                CHAR(2)             NOT NULL DEFAULT 'KW' REFERENCES countries(code),
  city_id                     BIGINT              NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  area_id                     BIGINT              REFERENCES areas(id) ON DELETE SET NULL,

  -- Delivery options (multi-select)
  delivery_options            delivery_option[]   NOT NULL DEFAULT '{pickup}'::delivery_option[]
                              CHECK (ARRAY_LENGTH(delivery_options, 1) >= 1),

  -- Luxury authenticity (Decision #5 + luxury category)
  authenticity_confirmed      BOOLEAN             NOT NULL DEFAULT false,
  has_receipt                 BOOLEAN             NOT NULL DEFAULT false,
  serial_number               TEXT,

  -- Lifecycle (Decision #1 — 30d live + 7d archive)
  status                      listing_status      NOT NULL DEFAULT 'draft',
  published_at                TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ,                            -- published_at + 30 days
  archived_at                 TIMESTAMPTZ,                            -- entered archive state
  renewed_count               INT                 NOT NULL DEFAULT 0,
  last_renewed_at             TIMESTAMPTZ,
  sold_at                     TIMESTAMPTZ,
  soft_deleted_at             TIMESTAMPTZ,

  -- Fraud / safety (AI Layer)
  fraud_status                fraud_status        NOT NULL DEFAULT 'pending',
  fraud_score                 INT                 NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 100),
  fraud_flags                 JSONB               NOT NULL DEFAULT '[]'::jsonb,
  fraud_checked_at            TIMESTAMPTZ,

  -- AI Telemetry (Decision #9 — monitoring strategy)
  ai_category_suggested       BOOLEAN             NOT NULL DEFAULT false,
  ai_category_accepted        BOOLEAN             NOT NULL DEFAULT false,
  ai_category_confidence      NUMERIC(3,2),
  ai_brand_suggested          BOOLEAN             NOT NULL DEFAULT false,
  ai_brand_accepted           BOOLEAN             NOT NULL DEFAULT false,
  ai_brand_confidence         NUMERIC(3,2),
  ai_condition_suggested      BOOLEAN             NOT NULL DEFAULT false,
  ai_condition_accepted       BOOLEAN             NOT NULL DEFAULT false,
  ai_condition_confidence     NUMERIC(3,2),
  ai_any_accepted             BOOLEAN             GENERATED ALWAYS AS (
                                ai_category_accepted OR ai_brand_accepted OR ai_condition_accepted
                              ) STORED,
  time_to_publish_seconds     INT,
  description_char_count      INT                 GENERATED ALWAYS AS (LENGTH(description)) STORED,
  post_publish_edit_count     INT                 NOT NULL DEFAULT 0,

  -- Engagement counters (updated via triggers)
  view_count                  INT                 NOT NULL DEFAULT 0,
  save_count                  INT                 NOT NULL DEFAULT 0,
  chat_initiation_count       INT                 NOT NULL DEFAULT 0,

  -- Timestamps
  created_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  -- Constraints
  -- Subcategory must belong to the specified category
  CONSTRAINT chk_subcategory_valid CHECK (subcategory_id IS NULL OR subcategory_id != category_id),
  -- min_offer only valid when price_mode is best_offer
  CONSTRAINT chk_min_offer_valid CHECK (
    (price_mode = 'best_offer') OR (min_offer_minor_units IS NULL)
  ),
  -- min_offer must be <= price
  CONSTRAINT chk_min_offer_sensible CHECK (
    min_offer_minor_units IS NULL OR min_offer_minor_units <= price_minor_units
  ),
  -- archived_at only set if status is archived
  CONSTRAINT chk_archived_status CHECK (
    (archived_at IS NULL AND status != 'archived') OR
    (archived_at IS NOT NULL AND status IN ('archived', 'deleted'))
  ),
  -- Currency must match country's default (for V1 single-country listings)
  CONSTRAINT chk_currency_country CHECK (
    (country_code = 'KW' AND currency_code = 'KWD') OR
    (country_code = 'SA' AND currency_code = 'SAR') OR
    (country_code = 'AE' AND currency_code = 'AED') OR
    (country_code = 'BH' AND currency_code = 'BHD') OR
    (country_code = 'QA' AND currency_code = 'QAR') OR
    (country_code = 'OM' AND currency_code = 'OMR')
  )
);

-- Indexes — tuned for common query patterns
CREATE INDEX idx_listings_seller           ON listings (seller_id, created_at DESC);
CREATE INDEX idx_listings_category         ON listings (category_id, status, created_at DESC) WHERE status = 'live';
CREATE INDEX idx_listings_subcategory      ON listings (subcategory_id, status, created_at DESC) WHERE status = 'live';
CREATE INDEX idx_listings_country_status   ON listings (country_code, status);
CREATE INDEX idx_listings_city             ON listings (city_id, status) WHERE status = 'live';
CREATE INDEX idx_listings_area             ON listings (area_id, status) WHERE status = 'live';
CREATE INDEX idx_listings_status           ON listings (status) WHERE status IN ('live', 'held');
CREATE INDEX idx_listings_expires          ON listings (expires_at) WHERE status = 'live';
CREATE INDEX idx_listings_price_mode       ON listings (price_mode, status) WHERE status = 'live';
CREATE INDEX idx_listings_price            ON listings (price_minor_units, country_code) WHERE status = 'live';
CREATE INDEX idx_listings_created          ON listings (created_at DESC) WHERE status = 'live';
CREATE INDEX idx_listings_fraud_status     ON listings (fraud_status) WHERE fraud_status IN ('pending', 'held');

-- Full-text search index (hybrid with semantic search)
CREATE INDEX idx_listings_title_trgm       ON listings USING gin (title gin_trgm_ops);
CREATE INDEX idx_listings_desc_trgm        ON listings USING gin (description gin_trgm_ops);

COMMENT ON TABLE listings IS 'Core marketplace entity. V1 scope per MASTER-PLAN.md.';
COMMENT ON COLUMN listings.price_minor_units IS 'Price in smallest currency unit (fils for KWD, halalas for SAR). Never float.';
COMMENT ON COLUMN listings.delivery_options IS 'Multi-select per DECISIONS.md Decision. At least one required.';
COMMENT ON COLUMN listings.ai_any_accepted IS 'Derived. Used for Decision 9 Human-Written badge logic.';

-- ----------------------------------------------------------------------------
-- Listing Images
-- ----------------------------------------------------------------------------
-- 5-10 images per listing (8 min for luxury). Position 0 is cover.

CREATE TABLE listing_images (
  id            BIGSERIAL       PRIMARY KEY,
  listing_id    BIGINT          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url           TEXT            NOT NULL,
  thumb_url     TEXT,
  medium_url    TEXT,
  full_url      TEXT,
  width         INT             NOT NULL CHECK (width > 0),
  height        INT             NOT NULL CHECK (height > 0),
  position      SMALLINT        NOT NULL CHECK (position BETWEEN 0 AND 9),
  alt_text      TEXT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  UNIQUE (listing_id, position)
);

CREATE INDEX idx_listing_images_listing ON listing_images (listing_id, position);

COMMENT ON TABLE listing_images IS '5-10 images per listing. Position 0 = cover. Storage via Supabase Storage.';
COMMENT ON COLUMN listing_images.position IS '0-indexed. Must be unique within a listing.';

-- ----------------------------------------------------------------------------
-- Listing Videos (luxury-only in V1)
-- ----------------------------------------------------------------------------

CREATE TABLE listing_videos (
  id            BIGSERIAL       PRIMARY KEY,
  listing_id    BIGINT          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url           TEXT            NOT NULL,
  poster_url    TEXT,
  duration_seconds INT          CHECK (duration_seconds BETWEEN 10 AND 120),
  width         INT,
  height        INT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- One video per listing in V1 (luxury inspection video)
  UNIQUE (listing_id)
);

COMMENT ON TABLE listing_videos IS 'Luxury category video (30-60s inspection/unboxing). One per listing in V1.';
