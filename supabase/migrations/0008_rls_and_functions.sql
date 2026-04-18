-- ============================================================================
-- 0008_rls_and_functions.sql — RLS Policies + Triggers + Functions
-- ============================================================================
-- Row-Level Security from Day 1 (per GCC-READINESS.md).
-- All triggers for maintaining denormalized counters.
--
-- Depends on: all previous migrations
-- ============================================================================

-- ============================================================================
-- PART 1: RLS Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- countries / cities / areas — public read, admin write
-- ----------------------------------------------------------------------------
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_countries" ON countries FOR SELECT USING (true);
CREATE POLICY "public_read_cities"    ON cities    FOR SELECT USING (true);
CREATE POLICY "public_read_areas"     ON areas     FOR SELECT USING (true);

-- Writes restricted to service role only (no policy = denied)

-- ----------------------------------------------------------------------------
-- categories — public read (active only), admin write
-- ----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_categories" ON categories
  FOR SELECT USING (is_active = true);

-- ----------------------------------------------------------------------------
-- profiles — public read, owner write
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-banned profiles
CREATE POLICY "public_read_profiles" ON profiles
  FOR SELECT USING (is_banned = false);

-- Users can update their own profile (limited fields via app-layer validation)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profile creation handled by trigger on auth.users

-- ----------------------------------------------------------------------------
-- listings — complex visibility rules
-- ----------------------------------------------------------------------------
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public can see LIVE listings in ACTIVE countries
CREATE POLICY "public_read_live_listings" ON listings
  FOR SELECT USING (
    status = 'live'
    AND country_code IN (SELECT active_country_codes())
    AND fraud_status NOT IN ('held', 'rejected')
  );

-- Sellers can see all their own listings (any status)
CREATE POLICY "sellers_read_own_listings" ON listings
  FOR SELECT USING (auth.uid() = seller_id);

-- Sellers can create listings
CREATE POLICY "sellers_insert_listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own listings
CREATE POLICY "sellers_update_own_listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Sellers can delete their own listings (soft delete via status update typically)
CREATE POLICY "sellers_delete_own_listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- ----------------------------------------------------------------------------
-- listing_images / listing_videos — inherit from listing visibility
-- ----------------------------------------------------------------------------
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_listing_images" ON listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l WHERE l.id = listing_id AND (
        (l.status = 'live' AND l.fraud_status NOT IN ('held', 'rejected'))
        OR l.seller_id = auth.uid()
      )
    )
  );

CREATE POLICY "sellers_manage_own_images" ON listing_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

CREATE POLICY "read_listing_videos" ON listing_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l WHERE l.id = listing_id AND (
        (l.status = 'live' AND l.fraud_status NOT IN ('held', 'rejected'))
        OR l.seller_id = auth.uid()
      )
    )
  );

CREATE POLICY "sellers_manage_own_videos" ON listing_videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- conversations / messages — only participants can read/write
-- ----------------------------------------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_read_conversations" ON conversations
  FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY "participants_update_conversations" ON conversations
  FOR UPDATE USING (auth.uid() IN (buyer_id, seller_id));

-- Buyers initiate conversations
CREATE POLICY "buyers_create_conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = conversations.seller_id)
  );

-- Messages: participants read, sender writes
CREATE POLICY "participants_read_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
  );

CREATE POLICY "participants_send_messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
  );

-- ----------------------------------------------------------------------------
-- favorites — users manage their own
-- ----------------------------------------------------------------------------
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_manage_own_favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ratings — public read, transaction participants write
-- ----------------------------------------------------------------------------
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_ratings" ON ratings FOR SELECT USING (true);

CREATE POLICY "participants_insert_ratings" ON ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'sold'
        AND (l.seller_id = auth.uid() OR EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.listing_id = l.id AND c.buyer_id = auth.uid()
        ))
    )
  );

-- ----------------------------------------------------------------------------
-- reports — reporters can read their own, admins see all
-- ----------------------------------------------------------------------------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporters_read_own_reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "users_create_reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ----------------------------------------------------------------------------
-- AI Layer — admin/internal only (service role bypasses RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE fraud_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_hashes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_embeddings   ENABLE ROW LEVEL SECURITY;
-- No policies = default deny (only service role can access)

-- ============================================================================
-- PART 2: Triggers + Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listing_embeddings_updated_at
  BEFORE UPDATE ON listing_embeddings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create profile on auth.users insert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, country_code, preferred_locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'KW'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- Listing lifecycle: set published_at + expires_at on publish
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_listing_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- On transition from draft to live
  IF OLD.status = 'draft' AND NEW.status = 'live' THEN
    NEW.published_at = COALESCE(NEW.published_at, NOW());
    NEW.expires_at = NEW.published_at + INTERVAL '30 days';
    -- Record time-to-publish for telemetry (Decision 9)
    IF NEW.time_to_publish_seconds IS NULL THEN
      NEW.time_to_publish_seconds = EXTRACT(EPOCH FROM (NOW() - OLD.created_at))::INT;
    END IF;
  END IF;

  -- On renewal: extend expires_at + increment counter
  IF OLD.status = 'archived' AND NEW.status = 'live' THEN
    NEW.expires_at = NOW() + INTERVAL '30 days';
    NEW.renewed_count = OLD.renewed_count + 1;
    NEW.last_renewed_at = NOW();
    NEW.archived_at = NULL;
  END IF;

  -- Track post-publish edits for telemetry
  IF OLD.status = 'live' AND NEW.status = 'live' AND (
    OLD.title != NEW.title OR
    OLD.description != NEW.description OR
    OLD.price_minor_units != NEW.price_minor_units
  ) THEN
    NEW.post_publish_edit_count = OLD.post_publish_edit_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_publish
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION handle_listing_publish();

-- ----------------------------------------------------------------------------
-- Maintain profile.active_listings_count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile_listing_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Recalculate for affected seller
    UPDATE profiles SET
      active_listings_count = (SELECT COUNT(*) FROM listings WHERE seller_id = NEW.seller_id AND status = 'live'),
      sold_listings_count = (SELECT COUNT(*) FROM listings WHERE seller_id = NEW.seller_id AND status = 'sold')
    WHERE id = NEW.seller_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET
      active_listings_count = (SELECT COUNT(*) FROM listings WHERE seller_id = OLD.seller_id AND status = 'live'),
      sold_listings_count = (SELECT COUNT(*) FROM listings WHERE seller_id = OLD.seller_id AND status = 'sold')
    WHERE id = OLD.seller_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_listing_counts
  AFTER INSERT OR UPDATE OF status OR DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_profile_listing_counts();

-- ----------------------------------------------------------------------------
-- Maintain listings.save_count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_listing_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET save_count = save_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_favorite_save_count
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_listing_save_count();

-- ----------------------------------------------------------------------------
-- Maintain profile.rating_avg + rating_count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_user UUID;
BEGIN
  affected_user = COALESCE(NEW.rated_id, OLD.rated_id);

  UPDATE profiles SET
    rating_avg = (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE rated_id = affected_user),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE rated_id = affected_user)
  WHERE id = affected_user;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- ----------------------------------------------------------------------------
-- Maintain conversation denormalized fields on message insert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  conv conversations%ROWTYPE;
BEGIN
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;

  UPDATE conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.body, '[media]'), 140),
    buyer_unread_count = CASE
      WHEN NEW.sender_id = conv.seller_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN NEW.sender_id = conv.buyer_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END
  WHERE id = NEW.conversation_id;

  -- Also bump listing.chat_initiation_count on first message
  IF (SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id) = 1 THEN
    UPDATE listings SET chat_initiation_count = chat_initiation_count + 1
    WHERE id = (SELECT listing_id FROM conversations WHERE id = NEW.conversation_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_update_conv
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ----------------------------------------------------------------------------
-- Listing expiration cron (run daily via Supabase cron extension or edge function)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_listings()
RETURNS TABLE (listing_id BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark listings as archived when expired
  RETURN QUERY
  UPDATE listings
  SET status = 'archived', archived_at = NOW()
  WHERE status = 'live'
    AND expires_at <= NOW()
  RETURNING id;
END;
$$;

COMMENT ON FUNCTION expire_listings IS 'Daily cron: move live listings past expires_at to archived.';

CREATE OR REPLACE FUNCTION soft_delete_old_archives()
RETURNS TABLE (listing_id BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Soft-delete archived listings after 7 days
  RETURN QUERY
  UPDATE listings
  SET status = 'deleted', soft_deleted_at = NOW()
  WHERE status = 'archived'
    AND archived_at <= NOW() - INTERVAL '7 days'
  RETURNING id;
END;
$$;

COMMENT ON FUNCTION soft_delete_old_archives IS 'Daily cron: soft-delete archived listings after 7 days (Decision 1).';
