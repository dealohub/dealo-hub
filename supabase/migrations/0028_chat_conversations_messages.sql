-- ============================================================================
-- 0028_chat_wiring.sql — RLS + trigger + RPC + realtime on chat tables
-- ============================================================================
-- The conversations + messages tables were created by 0006_social.sql
-- but shipped without:
--   * RLS policies (tables were open to anyone with the anon key)
--   * Conversation-header sync trigger (last_message_at, unread counts)
--   * mark_conversation_read RPC for safe read-receipt flipping
--   * Realtime publication registration
--
-- Phase 5c wires all four. No schema changes to the tables themselves.
--
-- Reference: DECISIONS.md #2 (chat-only), planning/PHASE-5-ROADMAP §5c
-- Depends on: 0006 (conversations + messages tables)
-- ============================================================================

-- ── 1. Conversation-header sync trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION chat_update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer  UUID;
  v_seller UUID;
BEGIN
  SELECT buyer_id, seller_id INTO v_buyer, v_seller
  FROM conversations WHERE id = NEW.conversation_id;

  UPDATE conversations
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.body, ''), 140),
    buyer_unread_count   = CASE
      WHEN NEW.sender_id = v_buyer THEN buyer_unread_count
      ELSE buyer_unread_count + 1
    END,
    seller_unread_count  = CASE
      WHEN NEW.sender_id = v_seller THEN seller_unread_count
      ELSE seller_unread_count + 1
    END,
    updated_at           = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_msg_updates_conv ON messages;
CREATE TRIGGER trg_msg_updates_conv
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION chat_update_conversation_on_message();

-- ── 2. RLS — conversations ────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conv_read ON conversations;
CREATE POLICY conv_read ON conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS conv_insert ON conversations;
CREATE POLICY conv_insert ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = buyer_id
    AND buyer_id <> seller_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = conversations.listing_id
        AND l.seller_id = conversations.seller_id
        AND l.status = 'live'
    )
  );

DROP POLICY IF EXISTS conv_update ON conversations;
CREATE POLICY conv_update ON conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ── 3. RLS — messages ─────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msg_read ON messages;
CREATE POLICY msg_read ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Insert policy — sender must be a participant AND not blocked by the
-- other side. Uses 0006's boolean columns: buyer_blocked / seller_blocked.
DROP POLICY IF EXISTS msg_insert ON messages;
CREATE POLICY msg_insert ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          (c.buyer_id = auth.uid() AND c.seller_blocked = false)
          OR
          (c.seller_id = auth.uid() AND c.buyer_blocked = false)
        )
    )
  );

-- Messages are append-only for clients — no UPDATE / DELETE policies.

-- ── 4. mark-read RPC ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id BIGINT)
RETURNS void AS $$
DECLARE
  v_is_buyer  BOOLEAN;
  v_is_seller BOOLEAN;
BEGIN
  SELECT
    (buyer_id = auth.uid()),
    (seller_id = auth.uid())
  INTO v_is_buyer, v_is_seller
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_is_buyer IS NULL AND v_is_seller IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;
  IF NOT v_is_buyer AND NOT v_is_seller THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id <> auth.uid()
    AND read_at IS NULL;

  IF v_is_buyer THEN
    UPDATE conversations SET buyer_unread_count = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations SET seller_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_conversation_read(BIGINT) TO authenticated;

-- ── 5. Realtime publication ───────────────────────────────────────────────
-- Add tables to supabase_realtime if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;
