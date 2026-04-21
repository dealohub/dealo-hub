-- ============================================================================
-- 0030 — AI Negotiator schema extensions (Phase 6a)
-- ----------------------------------------------------------------------------
-- Per doctrine in planning/PHASE-6A-AI-NEGOTIATOR.md §4. Adds:
--   * listings.negotiation_enabled          — per-listing opt-in (P1)
--   * listings.ai_floor_minor_units         — seller's secret floor (P2)
--   * listings.ai_settings                  — tone + quiet_hours (P4/P13)
--   * messages.ai_generated                 — disclosure badge source (P3)
--   * messages.intent_class                 — buyer-message classifier output (P7)
--   * messages.needs_human_followup         — handover flag (P7)
--   * conversations.ai_negotiation_stage    — state machine (P6)
--   * ai_message_log table                  — audit trail (P8)
--   * is_offer_above_floor() RPC            — one-way floor check (P2)
--   * update_ai_negotiation_stage() trigger — enforces P6 state transitions
--
-- This migration is ADDITIVE. Zero breaking changes to existing columns.
-- Until Phase 6b ships the engine, these columns just sit idle with defaults.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. listings — per-listing AI opt-in + secret floor + tone settings
-- ---------------------------------------------------------------------------

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS negotiation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_floor_minor_units bigint,
  ADD COLUMN IF NOT EXISTS ai_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Sanity: floor must be >= 0 if set, and <= list price (enforced at app level
-- because NULL list price edge cases would make a CHECK awkward).

-- Note on RLS: the existing `public_read_live_listings` policy exposes ALL
-- listings columns to anonymous readers — including ai_floor_minor_units.
-- That would LEAK the seller's secret floor. We fix this with a view + a
-- column-level grant strategy in the query layer (Phase 6b), not at RLS.
-- For now, document the hazard so callers know not to SELECT the floor via
-- client-side Supabase.

COMMENT ON COLUMN public.listings.ai_floor_minor_units IS
  'SELLER-SECRET. Never SELECT this from a client-facing query. Only the ' ||
  'SECURITY DEFINER RPC is_offer_above_floor() should touch it. Exposure ' ||
  'via row-level SELECT leaks the negotiation floor to buyers. See ' ||
  'planning/PHASE-6A-AI-NEGOTIATOR.md §P2.';

-- ---------------------------------------------------------------------------
-- 2. messages — AI disclosure + intent classification
-- ---------------------------------------------------------------------------

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intent_class text,
  ADD COLUMN IF NOT EXISTS needs_human_followup boolean NOT NULL DEFAULT false;

-- Enum-style check constraint on intent_class (text, not enum, to allow
-- fast evolution during beta).
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_intent_class_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_intent_class_check
  CHECK (
    intent_class IS NULL OR intent_class IN (
      'price_offer',
      'logistics_question',
      'personal_question',
      'emotional',
      'off_topic'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. conversations — AI negotiation state machine
-- ---------------------------------------------------------------------------

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS ai_negotiation_stage text NOT NULL DEFAULT 'inactive';

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_ai_stage_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_ai_stage_check
  CHECK (
    ai_negotiation_stage IN (
      'inactive',
      'negotiating',
      'awaiting_seller_accept',
      'accepted',
      'walked'
    )
  );

-- The state-transition enforcement lives in a trigger (see §5) so that
-- RLS can be permissive for UPDATE while still rejecting illegal moves.

-- ---------------------------------------------------------------------------
-- 4. ai_message_log — auditable record of every AI generation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_message_log (
  id                bigserial PRIMARY KEY,
  message_id        bigint REFERENCES public.messages(id) ON DELETE SET NULL,
  conversation_id   bigint NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  seller_id         uuid   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model             text   NOT NULL,
  prompt_hash       text   NOT NULL,
  draft_text        text   NOT NULL,
  sent_text         text,
  filter_actions    jsonb  NOT NULL DEFAULT '[]'::jsonb,
  tokens_input      integer NOT NULL DEFAULT 0,
  tokens_output     integer NOT NULL DEFAULT 0,
  latency_ms        integer NOT NULL DEFAULT 0,
  scheduled_send_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_message_log_seller_created_idx
  ON public.ai_message_log (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_message_log_conversation_idx
  ON public.ai_message_log (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS ai_message_log_scheduled_send_idx
  ON public.ai_message_log (scheduled_send_at)
  WHERE scheduled_send_at IS NOT NULL;

ALTER TABLE public.ai_message_log ENABLE ROW LEVEL SECURITY;

-- Seller reads own audit log only. Service role bypasses RLS. No INSERT
-- from client-side — only the AI engine (service role) writes here.
DROP POLICY IF EXISTS ai_log_seller_read ON public.ai_message_log;
CREATE POLICY ai_log_seller_read ON public.ai_message_log
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. is_offer_above_floor() RPC — one-way floor check (P2)
-- ---------------------------------------------------------------------------
-- Returns boolean only. NEVER returns the floor value. This is the only
-- DB-side function the AI engine uses to reason about the floor.

CREATE OR REPLACE FUNCTION public.is_offer_above_floor(
  p_listing_id  bigint,
  p_offer_minor bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_floor bigint;
BEGIN
  SELECT ai_floor_minor_units INTO v_floor
    FROM public.listings
   WHERE id = p_listing_id;
  -- No floor set = any offer is acceptable.
  IF v_floor IS NULL THEN RETURN true; END IF;
  RETURN p_offer_minor >= v_floor;
END;
$$;

COMMENT ON FUNCTION public.is_offer_above_floor(bigint, bigint) IS
  'One-way floor check. Returns TRUE if an offer meets/exceeds the ' ||
  'seller''s secret floor, FALSE otherwise. NEVER returns the floor ' ||
  'number itself — see PHASE-6A-AI-NEGOTIATOR.md §P2.';

GRANT EXECUTE ON FUNCTION public.is_offer_above_floor(bigint, bigint)
  TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 6. ai_negotiation_stage trigger — enforces P6 state machine
-- ---------------------------------------------------------------------------
-- Legal transitions (per §P6 of the doctrine):
--   inactive              → negotiating                    (AI engine only)
--   negotiating           → awaiting_seller_accept         (AI engine)
--   negotiating           → walked                         (anyone)
--   awaiting_seller_accept → accepted                      (seller ONLY)
--   awaiting_seller_accept → walked                        (buyer or seller)
--   accepted              → (nothing — terminal)
--   walked                → (nothing — terminal)
--
-- Enforced via trigger so RLS can stay participant-based.
-- We identify "seller" by auth.uid() = conversation.seller_id.

CREATE OR REPLACE FUNCTION public.enforce_ai_stage_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller uuid;
  v_is_seller boolean;
BEGIN
  IF NEW.ai_negotiation_stage = OLD.ai_negotiation_stage THEN
    RETURN NEW;
  END IF;

  v_caller := auth.uid();
  v_is_seller := (v_caller IS NOT NULL AND v_caller = NEW.seller_id);

  -- Terminal states cannot be left.
  IF OLD.ai_negotiation_stage IN ('accepted', 'walked') THEN
    RAISE EXCEPTION 'cannot transition out of terminal stage %', OLD.ai_negotiation_stage
      USING ERRCODE = 'check_violation';
  END IF;

  -- Only the seller (via their JWT) may close a deal.
  IF NEW.ai_negotiation_stage = 'accepted' AND NOT v_is_seller THEN
    RAISE EXCEPTION 'only the listing seller may accept an offer'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Everyone (seller, buyer, AI service role) may walk.
  -- Everyone (AI service role primarily) may transition inactive→negotiating.
  -- awaiting_seller_accept is entered by the AI engine (service role).
  -- We don't restrict non-accept transitions beyond the RLS policies on
  -- conversations — those already require participation.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_stage_transition ON public.conversations;
CREATE TRIGGER ai_stage_transition
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ai_stage_transition();
