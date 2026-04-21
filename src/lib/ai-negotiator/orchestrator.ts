/**
 * AI Negotiator — Orchestrator.
 *
 * The single entrypoint called by the chat server action when a buyer
 * sends a message in a conversation whose listing has
 * `negotiation_enabled = true`. Returns a `ReactResult` the caller
 * uses to decide what to do next:
 *
 *   • `reply_scheduled` — AI drafted a clean reply; persist to
 *     ai_message_log with scheduled_send_at, let the cron flush it.
 *   • `handoff`         — flag the conversation for seller attention;
 *     do NOT send an AI reply.
 *   • `no_action`       — negotiation not enabled, or turn belongs to
 *     seller, or the buyer's message isn't an AI-handleable intent
 *     (e.g. still validating logistics).
 *
 * This module is the seam between "what the AI wants to say" and "when
 * + how + whether to actually send it". All pieces it composes are
 * already tested in isolation — here we just arrange the phone call.
 *
 * Order of operations (locked):
 *   1. Classify buyer intent        — classifier.ts
 *   2. Extract numeric offer        — offer-extract.ts
 *   3. Pick policy move             — policy.ts
 *   4. Short-circuit on handoff     — no LLM call, no cost
 *   5. Generate LLM draft           — dialogue.ts → provider
 *   6. Run safety pipeline          — safety.ts (A/B/C + floor-leak)
 *   7. Compute jittered send time   — jitter.ts
 *   8. Return the scheduled reply   — caller persists to ai_message_log
 *
 * Pure orchestration — no DB writes from inside here. The caller
 * (chat/actions.ts or the cron flusher) owns the persistence layer so
 * this file stays unit-testable without Supabase mocks.
 *
 * Reference: planning/PHASE-6A-AI-NEGOTIATOR.md §P3/§P6/§P14.
 */

import { classifyBuyerMessage } from './classifier';
import { extractOffer } from './offer-extract';
import { decidePolicyMove, type PolicyMove, type PolicyInput } from './policy';
import { generateReply, type DialogueResult } from './dialogue';
import { computeJitteredDelay } from './jitter';
import { runSafetyPipeline, type SafetyCheckResult } from './safety';
import type { PromptContext } from './prompts';
import type { LLMProvider, LLMChatMessage } from './provider';
import type { IntentClass, NegotiatorTone } from './types';

// ---------------------------------------------------------------------------
// Public API shapes
// ---------------------------------------------------------------------------

export interface ReactInput {
  /** The buyer's most-recent message. */
  buyerText: string;
  /** Language hint for the prompt. */
  language: PromptContext['language'];
  /** Tone selected by the seller. */
  tone: NegotiatorTone;
  /** Listing snapshot needed to make a policy decision. */
  listing: {
    listPriceMinor: number;
    floorMinor: number | null;
    currency: PromptContext['currency'];
    /** Minor-unit multiplier (1000 for KWD, 100 for AED/USD/SAR). */
    minorUnitsPerMajor: number;
    titleForPrompt: string;
  };
  /** Conversation-level counters. */
  conversation: {
    messageCount: number;
    aiMessagesSent: number;
    /** Last-4-turn history for the LLM. */
    history?: LLMChatMessage[];
    /**
     * Previous buyer offer (minor units) — set when the buyer is
     * responding to a counter. If their current message contains a
     * new number, that overrides this. Null when the buyer has never
     * named a number.
     */
    previousOfferMinor: number | null;
  };
  /** LLM provider (stub for tests, OpenAI for prod). */
  provider: LLMProvider;
  /** Current time in ms — injected for testability. */
  nowMs: number;
  /** Optional seeded RNG for jitter — tests pin it. */
  rng?: () => number;
}

export type ReactResult =
  | {
      kind: 'no_action';
      reason: 'no_handleable_intent';
    }
  | {
      kind: 'handoff';
      move: Extract<PolicyMove, { kind: 'hand_to_human' }>;
      intent: IntentClass | null;
      offerMinor: number | null;
    }
  | {
      kind: 'reply_scheduled';
      move: Exclude<PolicyMove, { kind: 'hand_to_human' }>;
      intent: IntentClass | null;
      offerMinor: number | null;
      draft: DialogueResult;
      safety: SafetyCheckResult;
      scheduledSendAtMs: number;
      delayMs: number;
      nightStretched: boolean;
    };

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function reactToBuyerMessage(input: ReactInput): Promise<ReactResult> {
  // ── 1. Classify ────────────────────────────────────────────────────
  const classification = classifyBuyerMessage(input.buyerText);
  const intent = classification.intent;

  // ── 2. Extract numeric offer (only when the intent suggests one) ──
  // We deliberately skip the extractor for non-price intents — a number
  // inside an emotional message ("I need this desperately for my 5 kids
  // for 500") shouldn't be treated as a price offer.
  let offerMinor: number | null = input.conversation.previousOfferMinor;
  if (intent === 'price_offer') {
    const extracted = extractOffer({
      text: input.buyerText,
      minorUnitsPerMajor: input.listing.minorUnitsPerMajor,
    });
    if (extracted) offerMinor = extracted.offerMinor;
  }

  // ── 3. Policy decision ────────────────────────────────────────────
  const policyInput: PolicyInput = {
    listPriceMinor: input.listing.listPriceMinor,
    floorMinor: input.listing.floorMinor,
    lastBuyerOfferMinor: offerMinor,
    messageCount: input.conversation.messageCount,
    aiMessagesSent: input.conversation.aiMessagesSent,
    lastBuyerIntent: intent,
  };
  const move = decidePolicyMove(policyInput);

  // ── 4. Short-circuit: handoff moves never touch the LLM ───────────
  if (move.kind === 'hand_to_human') {
    return { kind: 'handoff', move, intent, offerMinor };
  }

  // Edge case: intent was null (classifier ambiguous) AND policy still
  // picked a non-handoff move. Policy's `unknown_intent` branch handles
  // most of these, but if we got here with null intent in the opening
  // phase we shouldn't press a reply — wait for the next buyer turn.
  if (intent === null && move.kind === 'greet_and_ask_offer') {
    // Let the greeting through — it's safe even on ambiguous input.
  } else if (intent === null) {
    return { kind: 'no_action', reason: 'no_handleable_intent' };
  }

  // ── 5. LLM draft ──────────────────────────────────────────────────
  const ctx: PromptContext = {
    listingTitle: input.listing.titleForPrompt,
    listPriceMinor: input.listing.listPriceMinor,
    currency: input.listing.currency,
    language: input.language,
    tone: input.tone,
    buyerLastMessage: input.buyerText,
  };

  const draft = await generateReply({
    move,
    ctx,
    history: input.conversation.history,
    provider: input.provider,
  });

  // ── 6. Safety pipeline ────────────────────────────────────────────
  // `final_offer` uses allowFloorMatch so the regex doesn't block the
  // one move that's supposed to verbalise the floor (§P6). Every other
  // move must stay floor-silent.
  const safety = runSafetyPipeline({
    draftText: draft.draftText,
    // Safety wants 0 when no floor — we already short-circuit to handoff
    // upstream when floorMinor is null, so by here it's always a number.
    floorMinor: input.listing.floorMinor ?? 0,
    listPriceMinor: input.listing.listPriceMinor,
    currency: input.listing.currency,
    allowFloorMatch: move.kind === 'final_offer',
  });

  // Any violation → escalate to handoff. The draft is dropped (never
  // sent), but we still return it in the result so the caller can
  // persist the attempt to `ai_message_log.draft_text` for audit — the
  // field was designed for exactly this case.
  if (!safety.safe) {
    return {
      kind: 'handoff',
      move: {
        kind: 'hand_to_human',
        reason: 'unknown_intent',
      },
      intent,
      offerMinor,
    };
  }

  // ── 7. Jittered send time ─────────────────────────────────────────
  const jitter = computeJitteredDelay({
    move,
    nowMs: input.nowMs,
    rng: input.rng,
  });

  // ── 8. Done — caller persists to ai_message_log ───────────────────
  return {
    kind: 'reply_scheduled',
    move: move as Exclude<PolicyMove, { kind: 'hand_to_human' }>,
    intent,
    offerMinor,
    draft,
    safety,
    scheduledSendAtMs: jitter.scheduledSendAtMs,
    delayMs: jitter.delayMs,
    nightStretched: jitter.nightStretched,
  };
}
