-- ============================================================================
-- 0006_social.sql — Messaging, Favorites, Ratings, Reports
-- ============================================================================
-- Social + transactional interactions:
--   * conversations / messages (chat-only moat — Decision #2)
--   * favorites (save for later)
--   * ratings (post-transaction reputation)
--   * reports (user-flagged content/users)
--
-- Depends on: 0005_listings.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Conversations
-- ----------------------------------------------------------------------------
-- One conversation per (listing, buyer) pair.
-- Sellers have many conversations per listing (one per interested buyer).

CREATE TABLE conversations (
  id                    BIGSERIAL     PRIMARY KEY,
  listing_id            BIGINT        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id              UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id             UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Denormalized for fast conversation list queries
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT          CHECK (LENGTH(last_message_preview) <= 140),
  buyer_unread_count    INT           NOT NULL DEFAULT 0,
  seller_unread_count   INT           NOT NULL DEFAULT 0,

  -- Status flags
  buyer_archived        BOOLEAN       NOT NULL DEFAULT false,
  seller_archived       BOOLEAN       NOT NULL DEFAULT false,
  buyer_blocked         BOOLEAN       NOT NULL DEFAULT false,
  seller_blocked        BOOLEAN       NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One conversation per buyer per listing
  UNIQUE (listing_id, buyer_id),
  -- Buyer and seller must be different
  CHECK (buyer_id != seller_id)
);

CREATE INDEX idx_conversations_seller     ON conversations (seller_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_buyer      ON conversations (buyer_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_listing    ON conversations (listing_id);
CREATE INDEX idx_conversations_unread_seller ON conversations (seller_id) WHERE seller_unread_count > 0;
CREATE INDEX idx_conversations_unread_buyer  ON conversations (buyer_id) WHERE buyer_unread_count > 0;

COMMENT ON TABLE conversations IS 'Chat threads. Chat-only moat — phone number never exposed.';

-- ----------------------------------------------------------------------------
-- Messages
-- ----------------------------------------------------------------------------

CREATE TABLE messages (
  id                BIGSERIAL       PRIMARY KEY,
  conversation_id   BIGINT          NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  body              TEXT            CHECK (LENGTH(body) <= 4000),
  media_url         TEXT,                                             -- image attachments
  media_type        TEXT            CHECK (media_type IN ('image', 'video') OR media_type IS NULL),

  -- AI-Assisted flags (Minimal Best Offer per Decision #3 + Feature 3)
  sent_as_offer     BOOLEAN         NOT NULL DEFAULT false,           -- buyer used "Make Offer" button
  offer_amount_minor BIGINT,                                          -- amount in listing currency minor units
  offer_currency    CHAR(3),

  -- Read receipts
  read_at           TIMESTAMPTZ,

  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- Either body or media must be present
  CHECK (body IS NOT NULL OR media_url IS NOT NULL),
  -- If marked as offer, must have offer amount
  CHECK (
    (sent_as_offer = false AND offer_amount_minor IS NULL) OR
    (sent_as_offer = true AND offer_amount_minor IS NOT NULL AND offer_amount_minor > 0)
  )
);

CREATE INDEX idx_messages_conversation  ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender        ON messages (sender_id, created_at DESC);
CREATE INDEX idx_messages_unread        ON messages (conversation_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_offers        ON messages (conversation_id, sent_as_offer) WHERE sent_as_offer = true;

COMMENT ON TABLE messages IS 'Individual messages within conversations. sent_as_offer flags Best Offer submissions.';
COMMENT ON COLUMN messages.sent_as_offer IS 'Per AI-FEATURES.md Feature 3 + Decision 3. Used for telemetry + UI differentiation.';

-- ----------------------------------------------------------------------------
-- Favorites (Save for Later)
-- ----------------------------------------------------------------------------

CREATE TABLE favorites (
  user_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id    BIGINT          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_favorites_user       ON favorites (user_id, created_at DESC);
CREATE INDEX idx_favorites_listing    ON favorites (listing_id);

COMMENT ON TABLE favorites IS 'User-saved listings. Populates save_count counter on listings.';

-- ----------------------------------------------------------------------------
-- Ratings
-- ----------------------------------------------------------------------------
-- Post-transaction rating between buyer and seller.
-- Triggered when seller marks listing as sold + assigns buyer.

CREATE TABLE ratings (
  id            BIGSERIAL       PRIMARY KEY,
  listing_id    BIGINT          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rater_id      UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id      UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score         SMALLINT        NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment       TEXT            CHECK (LENGTH(comment) <= 500),
  role          TEXT            NOT NULL CHECK (role IN ('buyer_rating_seller', 'seller_rating_buyer')),
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- One rating per listing per rater role
  UNIQUE (listing_id, rater_id, role),
  -- Can't rate yourself
  CHECK (rater_id != rated_id)
);

CREATE INDEX idx_ratings_rated        ON ratings (rated_id, created_at DESC);
CREATE INDEX idx_ratings_rater        ON ratings (rater_id, created_at DESC);
CREATE INDEX idx_ratings_listing      ON ratings (listing_id);

COMMENT ON TABLE ratings IS 'Post-transaction reputation. rating_avg on profiles is derived via trigger.';

-- ----------------------------------------------------------------------------
-- Reports (Content Moderation)
-- ----------------------------------------------------------------------------
-- Users can report listings or other users.

CREATE TABLE reports (
  id              BIGSERIAL     PRIMARY KEY,
  reporter_id     UUID          NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

  -- Polymorphic target (listing or user)
  target_type     TEXT          NOT NULL CHECK (target_type IN ('listing', 'user')),
  target_listing_id BIGINT      REFERENCES listings(id) ON DELETE CASCADE,
  target_user_id  UUID          REFERENCES profiles(id) ON DELETE CASCADE,

  reason          report_reason NOT NULL,
  details         TEXT          CHECK (LENGTH(details) <= 1000),
  status          report_status NOT NULL DEFAULT 'pending',

  -- Admin resolution
  resolved_by     UUID          REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Target consistency checks
  CHECK (
    (target_type = 'listing' AND target_listing_id IS NOT NULL AND target_user_id IS NULL) OR
    (target_type = 'user' AND target_user_id IS NOT NULL AND target_listing_id IS NULL)
  )
);

CREATE INDEX idx_reports_status        ON reports (status, created_at DESC);
CREATE INDEX idx_reports_listing       ON reports (target_listing_id) WHERE target_listing_id IS NOT NULL;
CREATE INDEX idx_reports_user          ON reports (target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_reports_reporter      ON reports (reporter_id, created_at DESC);

COMMENT ON TABLE reports IS 'User-flagged listings/users. Admin queue via status=pending.';
