-- ============================================================================
-- 0007_ai_layer.sql — AI Layer (Fraud + Embeddings + Image Hashes)
-- ============================================================================
-- AI infrastructure per AI-FEATURES.md:
--   * fraud_events       — Audit log of fraud pipeline runs
--   * image_hashes       — Perceptual hash cache for reverse image search
--   * listing_embeddings — Vector embeddings for semantic search + dedup
--   * category_pricing_stats — Materialized view for Smart Pricing (V2 stub)
--
-- Depends on: 0005_listings.sql + 0001_extensions.sql (pgvector)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fraud Events (Audit Log)
-- ----------------------------------------------------------------------------
-- Every fraud detection pipeline run logs events here.
-- Admins can review flagged listings, users can see trust signal history.

CREATE TABLE fraud_events (
  id                BIGSERIAL       PRIMARY KEY,
  listing_id        BIGINT          REFERENCES listings(id) ON DELETE CASCADE,
  user_id           UUID            REFERENCES profiles(id) ON DELETE SET NULL,

  event_type        TEXT            NOT NULL CHECK (event_type IN (
                      'stolen_image',       -- reverse image search matched
                      'scam_text',          -- GPT analysis detected scam
                      'price_anomaly',      -- price outside normal range
                      'duplicate_listing',  -- embedding similarity >0.95
                      'behavior_red_flag',  -- behavioral scoring
                      'phone_in_body',      -- bypass attempt detected
                      'manual_flag'         -- admin-flagged
                    )),

  severity          INT             NOT NULL CHECK (severity BETWEEN 0 AND 100),

  -- Event details (structured per event_type)
  details           JSONB           NOT NULL DEFAULT '{}'::jsonb,

  -- Resolution
  resolved_by       UUID            REFERENCES profiles(id),
  resolved_at       TIMESTAMPTZ,
  resolution        TEXT            CHECK (resolution IN ('confirmed', 'false_positive', 'dismissed') OR resolution IS NULL),
  resolution_note   TEXT,

  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_events_listing       ON fraud_events (listing_id, created_at DESC);
CREATE INDEX idx_fraud_events_user          ON fraud_events (user_id, created_at DESC);
CREATE INDEX idx_fraud_events_type          ON fraud_events (event_type, severity DESC, created_at DESC);
CREATE INDEX idx_fraud_events_unresolved    ON fraud_events (created_at DESC) WHERE resolved_at IS NULL;

COMMENT ON TABLE fraud_events IS 'AI fraud pipeline audit log. Feeds admin queue + analytics.';
COMMENT ON COLUMN fraud_events.details IS 'Per event_type schema. stolen_image: {matched_hashes}; scam_text: {gpt_response, flagged_phrases}';

-- ----------------------------------------------------------------------------
-- Image Hashes (Reverse Image Search Cache)
-- ----------------------------------------------------------------------------
-- Perceptual hashes (pHash) of all uploaded images.
-- Check new uploads against this table to detect stolen/duplicate photos.

CREATE TABLE image_hashes (
  id                  BIGSERIAL     PRIMARY KEY,
  perceptual_hash     BIGINT        NOT NULL,               -- 64-bit pHash
  listing_id          BIGINT        REFERENCES listings(id) ON DELETE CASCADE,
  listing_image_id    BIGINT        REFERENCES listing_images(id) ON DELETE CASCADE,
  source              TEXT          NOT NULL DEFAULT 'internal' CHECK (source IN ('internal', 'external_scrape')),
  first_seen_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (perceptual_hash, listing_image_id)
);

CREATE INDEX idx_image_hashes_phash         ON image_hashes (perceptual_hash);
CREATE INDEX idx_image_hashes_listing       ON image_hashes (listing_id);

COMMENT ON TABLE image_hashes IS 'pHash cache. Query with Hamming distance <=10 to detect matches.';

-- Helper function: Hamming distance for 64-bit phashes
CREATE OR REPLACE FUNCTION hamming_distance(a BIGINT, b BIGINT)
RETURNS INT
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT (
    -- XOR then popcount
    CAST(LENGTH(REPLACE(REPLACE(
      (a # b)::BIT(64)::TEXT,
      '0', ''), '1', 'x'
    )) AS INT)
  );
$$;

COMMENT ON FUNCTION hamming_distance IS 'Hamming distance for 64-bit perceptual hashes. Threshold ~10 = similar.';

-- ----------------------------------------------------------------------------
-- Listing Embeddings (Semantic Search + Duplicate Detection)
-- ----------------------------------------------------------------------------
-- OpenAI text-embedding-3-small produces 1536-dim vectors.
-- Re-embed on listing publish and on significant edits (title/description).

CREATE TABLE listing_embeddings (
  listing_id    BIGINT        PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  embedding     vector(1536)  NOT NULL,
  source_text   TEXT          NOT NULL,                     -- concatenated text that was embedded
  model_version TEXT          NOT NULL DEFAULT 'text-embedding-3-small',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ivfflat index for approximate cosine similarity search
-- Lists = 100 good default for 1K-100K rows. Re-tune at 1M+.
CREATE INDEX idx_listing_embeddings_vec
  ON listing_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE listing_embeddings IS 'OpenAI embeddings for semantic search + duplicate detection. pgvector-powered.';
COMMENT ON COLUMN listing_embeddings.embedding IS 'vector(1536) — cosine distance via <=> operator.';

-- ----------------------------------------------------------------------------
-- Search helper function
-- ----------------------------------------------------------------------------

-- Semantic search with optional category filter + pagination
CREATE OR REPLACE FUNCTION search_listings_semantic(
  query_embedding vector(1536),
  country_filter  CHAR(2) DEFAULT 'KW',
  category_filter BIGINT DEFAULT NULL,
  max_results     INT DEFAULT 20
)
RETURNS TABLE (
  listing_id      BIGINT,
  similarity      FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    e.listing_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM listing_embeddings e
  JOIN listings l ON l.id = e.listing_id
  WHERE
    l.status = 'live'
    AND l.country_code = country_filter
    AND (category_filter IS NULL OR l.category_id = category_filter)
  ORDER BY e.embedding <=> query_embedding
  LIMIT max_results;
$$;

COMMENT ON FUNCTION search_listings_semantic IS 'Semantic search via pgvector cosine similarity. Used by Feature 2.';

-- ----------------------------------------------------------------------------
-- Category Pricing Stats (Smart Pricing — V2 feature, table ready)
-- ----------------------------------------------------------------------------
-- Refreshed nightly via cron. Feature 4 uses this.

CREATE MATERIALIZED VIEW category_pricing_stats AS
SELECT
  l.category_id,
  l.condition,
  l.country_code,
  l.currency_code,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY l.price_minor_units) AS p25_minor,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY l.price_minor_units) AS median_minor,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY l.price_minor_units) AS p75_minor,
  COUNT(*)                                                           AS sample_size,
  MAX(l.sold_at)                                                     AS last_sample_at
FROM listings l
WHERE
  l.status = 'sold'
  AND l.sold_at IS NOT NULL
  AND l.sold_at > NOW() - INTERVAL '90 days'
GROUP BY l.category_id, l.condition, l.country_code, l.currency_code
HAVING COUNT(*) >= 3;

CREATE UNIQUE INDEX idx_category_pricing_stats_pk
  ON category_pricing_stats (category_id, condition, country_code, currency_code);

COMMENT ON MATERIALIZED VIEW category_pricing_stats IS 'Smart Pricing reference data. Refresh nightly. V2 feature.';
