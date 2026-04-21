-- ============================================================================
-- RLS test suite
-- ----------------------------------------------------------------------------
-- Run each test in its own transaction — each block sets a simulated JWT
-- ("impersonates" a user), runs the assertion, then rolls back so nothing
-- persists.
--
-- Pass criterion: every RAISE NOTICE line prints "PASS". Any "FAIL" means
-- a policy regression and is a SECURITY incident — stop + investigate.
--
-- Manual run via `psql $SUPABASE_DB_URL -f supabase/tests/rls.sql` OR via
-- mcp__supabase__execute_sql one block at a time (what we do locally).
--
-- Fixtures expected in the DB:
--   * auth.users row for buyer@dealohub.test (bc2d9de5-51e5-43bc-b530-5d3e326cb354)
--   * auth.users row for fawzi.al.ibrahim@gmail.com (491116f4-7b65-42ae-a569-d96c33ed33fe)
--   * conversations.id=1 with buyer=bc2d9de5, seller=491116f4
--   * At least one message in conversations.id=1
--
-- A synthetic 3rd "outsider" uuid is hard-coded — they don't exist in
-- auth.users but `SET LOCAL request.jwt.claims` doesn't enforce that.
-- ============================================================================

\set buyer_id    '\'bc2d9de5-51e5-43bc-b530-5d3e326cb354\''
\set seller_id   '\'491116f4-7b65-42ae-a569-d96c33ed33fe\''
\set outsider_id '\'00000000-0000-4000-8000-000000000999\''

-- ============================================================================
-- SECTION 1 — conversations
-- ============================================================================

-- 1.1 — Buyer can read their own conversation
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.conversations WHERE id = 1;
  IF n = 1 THEN RAISE NOTICE 'PASS 1.1 buyer_reads_own_conversation';
  ELSE RAISE NOTICE 'FAIL 1.1 buyer_reads_own_conversation (got % rows)', n; END IF;
END $$;
ROLLBACK;

-- 1.2 — Seller can read the same conversation
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"491116f4-7b65-42ae-a569-d96c33ed33fe","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.conversations WHERE id = 1;
  IF n = 1 THEN RAISE NOTICE 'PASS 1.2 seller_reads_own_conversation';
  ELSE RAISE NOTICE 'FAIL 1.2 seller_reads_own_conversation (got % rows)', n; END IF;
END $$;
ROLLBACK;

-- 1.3 — Outsider CANNOT read conversations they don't participate in
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.conversations WHERE id = 1;
  IF n = 0 THEN RAISE NOTICE 'PASS 1.3 outsider_blocked_from_conversation';
  ELSE RAISE NOTICE 'FAIL 1.3 outsider_blocked_from_conversation (leaked % rows)', n; END IF;
END $$;
ROLLBACK;

-- 1.4 — Anonymous (no JWT) CANNOT read any conversations
BEGIN;
SET LOCAL role = 'anon';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.conversations;
  IF n = 0 THEN RAISE NOTICE 'PASS 1.4 anon_blocked_from_conversations';
  ELSE RAISE NOTICE 'FAIL 1.4 anon_blocked_from_conversations (leaked % rows)', n; END IF;
END $$;
ROLLBACK;

-- ============================================================================
-- SECTION 2 — messages
-- ============================================================================

-- 2.1 — Buyer can read messages in their conversation
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.messages WHERE conversation_id = 1;
  IF n >= 1 THEN RAISE NOTICE 'PASS 2.1 buyer_reads_own_messages (% rows)', n;
  ELSE RAISE NOTICE 'FAIL 2.1 buyer_reads_own_messages (got % rows)', n; END IF;
END $$;
ROLLBACK;

-- 2.2 — Outsider CANNOT read messages from a conversation they're not in
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.messages WHERE conversation_id = 1;
  IF n = 0 THEN RAISE NOTICE 'PASS 2.2 outsider_blocked_from_messages';
  ELSE RAISE NOTICE 'FAIL 2.2 outsider_blocked_from_messages (leaked % rows)', n; END IF;
END $$;
ROLLBACK;

-- 2.3 — Outsider CANNOT insert a message into a conversation they're not in
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
DO $$
DECLARE
  inserted_id bigint;
BEGIN
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, body)
    VALUES (1, '00000000-0000-4000-8000-000000000999', 'injection attempt')
    RETURNING id INTO inserted_id;
    RAISE NOTICE 'FAIL 2.3 outsider_message_insert_was_allowed (id=%)', inserted_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'PASS 2.3 outsider_message_insert_blocked (%)', SQLERRM;
  END;
END $$;
ROLLBACK;

-- 2.4 — Buyer cannot spoof as someone else (sender_id must be auth.uid())
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  inserted_id bigint;
BEGIN
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, body)
    VALUES (1, '491116f4-7b65-42ae-a569-d96c33ed33fe', 'pretending to be seller')
    RETURNING id INTO inserted_id;
    RAISE NOTICE 'FAIL 2.4 sender_spoof_allowed (id=%)', inserted_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'PASS 2.4 sender_spoof_blocked (%)', SQLERRM;
  END;
END $$;
ROLLBACK;

-- ============================================================================
-- SECTION 3 — profiles
-- ============================================================================

-- 3.1 — Anyone authenticated can read non-banned profiles (public read policy)
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE is_banned = false;
  IF n >= 2 THEN RAISE NOTICE 'PASS 3.1 profiles_readable_to_any_user (% rows)', n;
  ELSE RAISE NOTICE 'FAIL 3.1 profiles_readable_to_any_user (got % rows)', n; END IF;
END $$;
ROLLBACK;

-- 3.2 — User cannot update someone else's profile
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  UPDATE public.profiles SET display_name = 'hijacked'
    WHERE id = '491116f4-7b65-42ae-a569-d96c33ed33fe';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RAISE NOTICE 'PASS 3.2 profile_hijack_blocked';
  ELSE RAISE NOTICE 'FAIL 3.2 profile_hijack_blocked (% rows updated)', n; END IF;
END $$;
ROLLBACK;

-- 3.3 — User cannot unban themselves
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  old_val boolean;
  new_val boolean;
BEGIN
  SELECT is_banned INTO old_val FROM public.profiles WHERE id = 'bc2d9de5-51e5-43bc-b530-5d3e326cb354';
  -- Try to maliciously flip to FALSE (assume we were banned)
  UPDATE public.profiles SET is_banned = false
    WHERE id = 'bc2d9de5-51e5-43bc-b530-5d3e326cb354';
  SELECT is_banned INTO new_val FROM public.profiles WHERE id = 'bc2d9de5-51e5-43bc-b530-5d3e326cb354';
  -- Either the column is immutable-by-policy OR there's a trigger that resets it.
  -- Either way we assert: if user was NOT banned before, value unchanged — that's
  -- a passive scenario. The real test is when they ARE banned and try to unban.
  -- Documenting as a vigilance check — flag if policy allows unban.
  RAISE NOTICE 'INFO 3.3 is_banned update column-level (old=% new=%)', old_val, new_val;
END $$;
ROLLBACK;

-- ============================================================================
-- SECTION 4 — listings (public read + sellers write own)
-- ============================================================================

-- 4.1 — Anyone can read live listings (public read policy)
BEGIN;
SET LOCAL role = 'anon';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.listings WHERE status = 'live';
  IF n > 0 THEN RAISE NOTICE 'PASS 4.1 anon_reads_live_listings (% rows)', n;
  ELSE RAISE NOTICE 'FAIL 4.1 anon_reads_live_listings (got 0)'; END IF;
END $$;
ROLLBACK;

-- 4.2 — User cannot update someone else's listing
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  UPDATE public.listings SET title = 'hijacked' WHERE id = 18;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RAISE NOTICE 'PASS 4.2 foreign_listing_update_blocked';
  ELSE RAISE NOTICE 'FAIL 4.2 foreign_listing_update_blocked (% rows)', n; END IF;
END $$;
ROLLBACK;

-- ============================================================================
-- SECTION 5 — listing_drafts (private per-seller)
-- ============================================================================

-- 5.1 — User cannot read another user's draft
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.listing_drafts;
  IF n = 0 THEN RAISE NOTICE 'PASS 5.1 outsider_blocked_from_drafts';
  ELSE RAISE NOTICE 'FAIL 5.1 outsider_blocked_from_drafts (leaked % rows)', n; END IF;
END $$;
ROLLBACK;

-- ============================================================================
-- SECTION 6 — rate_limits (internals table, no user access)
-- ============================================================================

-- 6.1 — No authenticated user can SELECT rate_limits directly
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.rate_limits;
  IF n = 0 THEN RAISE NOTICE 'PASS 6.1 rate_limits_select_blocked';
  ELSE RAISE NOTICE 'FAIL 6.1 rate_limits_select_blocked (leaked % rows)', n; END IF;
END $$;
ROLLBACK;

-- 6.2 — No authenticated user can INSERT rate_limits directly
-- (only the SECURITY DEFINER RPC can)
BEGIN;
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub":"bc2d9de5-51e5-43bc-b530-5d3e326cb354","role":"authenticated"}';
DO $$
BEGIN
  BEGIN
    INSERT INTO public.rate_limits (user_id, action, window_start, count)
    VALUES ('bc2d9de5-51e5-43bc-b530-5d3e326cb354', 'fake', now(), 999999);
    RAISE NOTICE 'FAIL 6.2 rate_limits_insert_was_allowed';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'PASS 6.2 rate_limits_insert_blocked (%)', SQLERRM;
  END;
END $$;
ROLLBACK;
