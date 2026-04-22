-- ============================================================================
-- 0038_messages_kind_payload.sql — chat primitives for services (Phase 8a P4)
-- ============================================================================
-- Extends the `messages` table with two new columns so the chat-only
-- DECISIONS.md #2 invariant can carry structured service-flow primitives
-- without ever exposing phone/email.
--
-- Four new kinds (all carry structured JSON in `payload`):
--   • quote_request     — buyer → provider(s): 4-6 question answers
--   • quote_response    — provider → buyer: price + inclusions + slot
--   • booking_proposal  — either side: slot_start + slot_end + total
--   • completion_mark   — either side: booking_id + completed_at
--
-- Legacy messages (free-text + sent_as_offer=true) get a computed kind:
--   kind = CASE
--     WHEN sent_as_offer = true THEN 'offer'
--     ELSE 'free_text'
--   END
--
-- Backfill sets the kind column at migration time; after this point the
-- app layer is responsible for stamping kind on every new insert.
--
-- Depends on: 0006_social (messages table), 0037 (services tables).
-- ============================================================================

BEGIN;

-- ── 1. Add kind + payload columns ────────────────────────────────────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB;

-- ── 2. Backfill kind for existing rows ───────────────────────────────────────

UPDATE messages
SET kind = CASE
  WHEN sent_as_offer = true THEN 'offer'
  ELSE 'free_text'
END
WHERE kind IS NULL;

-- ── 3. Enforce kind NOT NULL + allowlist ─────────────────────────────────────

ALTER TABLE messages
  ALTER COLUMN kind SET NOT NULL,
  ALTER COLUMN kind SET DEFAULT 'free_text';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_kind_check'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_kind_check
      CHECK (kind IN (
        'free_text',
        'offer',
        'quote_request',
        'quote_response',
        'booking_proposal',
        'completion_mark'
      ));
  END IF;
END $$;

-- ── 4. Structured-kind invariants ────────────────────────────────────────────
-- Services kinds must carry payload. free_text/offer may have body-only.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_structured_requires_payload'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_structured_requires_payload
      CHECK (
        kind IN ('free_text', 'offer')
        OR payload IS NOT NULL
      );
  END IF;
END $$;

-- ── 5. Index for kind filtering (inbox views, provider "open quotes" list) ───

CREATE INDEX IF NOT EXISTS idx_messages_kind_conversation
  ON messages (kind, conversation_id, created_at DESC)
  WHERE kind NOT IN ('free_text', 'offer');

COMMENT ON COLUMN messages.kind IS
  'Phase 8a P4: structured chat primitive. free_text + offer = legacy; quote_request/quote_response/booking_proposal/completion_mark are the services-flow primitives.';
COMMENT ON COLUMN messages.payload IS
  'Phase 8a P4: structured JSON for non-text kinds. Schema per kind documented in planning/PHASE-8A-HOME-SERVICES.md §2.';

COMMIT;
