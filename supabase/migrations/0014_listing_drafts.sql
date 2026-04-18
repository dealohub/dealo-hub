-- ============================================================================
-- 0014_listing_drafts.sql — Cross-device draft storage
-- ============================================================================
-- Mirror of the client localStorage cache. Last-write-wins on conflict.
-- One active draft per user (UNIQUE user_id) — when published the row is
-- deleted. Column types mirror `listings` where possible so promote-to-listing
-- is a simple INSERT … SELECT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Step 1: category
  category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,

  -- Step 3: details
  title           TEXT,
  description     TEXT,
  condition       item_condition,
  brand           TEXT,
  model           TEXT,
  color           TEXT,

  -- Step 4: price
  price_minor_units        BIGINT,
  currency_code            CHAR(3) DEFAULT 'KWD',
  price_mode               price_mode,
  min_offer_minor_units    BIGINT,

  -- Step 5: location
  country_code    CHAR(2) DEFAULT 'KW',
  city_id         BIGINT REFERENCES cities(id) ON DELETE SET NULL,
  area_id         BIGINT REFERENCES areas(id)  ON DELETE SET NULL,

  -- Step 6: delivery
  delivery_options delivery_option[] NOT NULL DEFAULT '{}'::delivery_option[],

  -- Step 7: authenticity (luxury)
  authenticity_confirmed BOOLEAN NOT NULL DEFAULT false,
  has_receipt            BOOLEAN NOT NULL DEFAULT false,
  serial_number          TEXT,

  -- Step 2 media — uploaded before publish, attached to listing on success
  image_urls      TEXT[] NOT NULL DEFAULT '{}'::text[],
  video_url       TEXT,

  -- Wizard navigation state
  current_step    TEXT NOT NULL DEFAULT 'category',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON listing_drafts(user_id);

ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_drafts" ON listing_drafts;
CREATE POLICY "users_manage_own_drafts" ON listing_drafts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON listing_drafts;
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON listing_drafts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
