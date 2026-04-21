/**
 * AI Negotiator — Policy Module
 *
 * Pure TypeScript state machine. NO LLM. NO DB. NO I/O.
 * Given a negotiation state, picks the next move. The dialogue module
 * (separate file) verbalises the chosen move in Kuwaiti Khaleeji.
 *
 * This split is the CICERO-2022 pattern (Meta Diplomacy):
 *   - Planner picks strategy + number
 *   - LLM only generates natural language conditioned on the plan
 * The LLM NEVER invents numbers or chooses acceptance. This protects
 * the seller from hallucinated commitments (doctrine §P6).
 *
 * See planning/PHASE-6A-AI-NEGOTIATOR.md §P6 for full rationale.
 */

import type { IntentClass } from './types';

// ---------------------------------------------------------------------------
// Input / output shapes
// ---------------------------------------------------------------------------

export interface PolicyInput {
  /** Listed price (minor units, e.g. fils for KWD). */
  listPriceMinor: number;
  /**
   * Seller's secret floor (minor units). NULL when seller didn't set one
   * — in that case, ANY offer is technically acceptable and the engine
   * should hand to human for confirmation (defensive default).
   */
  floorMinor: number | null;
  /**
   * The buyer's most recent numeric offer, if any. NULL when the buyer
   * hasn't proposed a number yet (e.g. they're still asking questions).
   */
  lastBuyerOfferMinor: number | null;
  /**
   * How many messages have been exchanged total (buyer + seller).
   * Used to detect "this is the opening" vs "we've been at this".
   */
  messageCount: number;
  /**
   * How many replies the AI has already sent in this conversation.
   * Caps at 6 — after that, we hand to human regardless (anti-loop
   * protection per Agent B's infinite-loop finding).
   */
  aiMessagesSent: number;
  /**
   * Classifier output for the buyer's last message. Drives handover
   * logic per §P7 (knows its limits).
   */
  lastBuyerIntent: IntentClass | null;
}

/** Discriminated union: every move has its own payload. */
export type PolicyMove =
  | {
      kind: 'greet_and_ask_offer';
    }
  | {
      kind: 'polite_reject';
      /** Tagged so dialogue can pick the right phrasing. */
      reason: 'too_low' | 'buyer_walked';
    }
  | {
      kind: 'small_concession';
      counterPriceMinor: number;
      /** Percent off list price as a positive integer (3 == 3%). */
      pctOffList: number;
    }
  | {
      kind: 'mid_concession';
      counterPriceMinor: number;
      pctOffList: number;
    }
  | {
      kind: 'final_offer';
      priceMinor: number;
    }
  | {
      kind: 'accept_offer';
      offerMinor: number;
    }
  | {
      kind: 'hand_to_human';
      /** Human-readable tag (seller-facing — NOT shown to buyer). */
      reason:
        | 'no_floor_set'
        | 'emotional_content'
        | 'personal_question'
        | 'off_topic'
        | 'turn_cap_reached'
        | 'unknown_intent';
    };

// ---------------------------------------------------------------------------
// Tuning constants — lock these values; doctrine §P4 + §10 justifies them
// ---------------------------------------------------------------------------

/**
 * Turn cap per §P6 + Agent B infinite-loop finding. After this many AI
 * replies, the conversation MUST hand to human — the AI has had its
 * chance to move the needle.
 */
const MAX_AI_REPLIES_BEFORE_HANDOFF = 6;

/**
 * "Too low" threshold. Below this fraction of the floor, the AI just
 * politely rejects rather than counter. Empirically: Kuwait buyers
 * offering <85% of the seller's floor are usually testing the waters
 * or hoping for desperate seller — there's no price-discovery value
 * in countering.
 */
const TOO_LOW_FRACTION = 0.85;

/**
 * "Near floor" threshold. Between this and 1.0 of floor is the
 * narrow-the-gap zone — small concession merits a reply.
 */
const NEAR_FLOOR_FRACTION = 0.95;

/**
 * Seller-facing concession bands as % off list. These tune how
 * aggressive the AI is. Low end = more list-price-preserving.
 */
const SMALL_CONCESSION_PCT = 3; // mild signal of willingness
const MID_CONCESSION_PCT = 8; // more meaningful move

/**
 * Minimum daylight we keep between a counter and the floor. The safety
 * pipeline's floor-leak scanner uses ±5%; any counter inside that band
 * triggers a block. We push counters to at least floor × 1.06 to stay
 * clear + leave the safety layer as genuine defence-in-depth, not a
 * frequent false-positive.
 *
 * Empirically (smoke test 2026-04-21): mid_concession at 8% off list
 * of a 650k item with a 600k floor lands at 598k — INSIDE the band.
 * Clamp raises it to ~636k, which keeps the concession meaningful and
 * visibly above the leak band.
 */
const COUNTER_FLOOR_MARGIN = 1.06;

// ---------------------------------------------------------------------------
// Policy function — the core decision logic
// ---------------------------------------------------------------------------

export function decidePolicyMove(input: PolicyInput): PolicyMove {
  const {
    listPriceMinor,
    floorMinor,
    lastBuyerOfferMinor,
    messageCount,
    aiMessagesSent,
    lastBuyerIntent,
  } = input;

  // ── 1. Safety first — catch-all handoffs before anything else ───────────

  // Turn cap. Agent B: multi-turn LLM negotiations loop forever without
  // deadlock-breaking. We hand off hard at 6 replies.
  if (aiMessagesSent >= MAX_AI_REPLIES_BEFORE_HANDOFF) {
    return { kind: 'hand_to_human', reason: 'turn_cap_reached' };
  }

  // Emotional / personal / off-topic → not AI's job.
  if (
    lastBuyerIntent === 'emotional' ||
    lastBuyerIntent === 'personal_question' ||
    lastBuyerIntent === 'off_topic'
  ) {
    return {
      kind: 'hand_to_human',
      reason:
        lastBuyerIntent === 'emotional'
          ? 'emotional_content'
          : lastBuyerIntent === 'personal_question'
            ? 'personal_question'
            : 'off_topic',
    };
  }

  // No floor set = defensive handoff. Without a floor we have no rails;
  // accepting blindly would expose the seller.
  if (floorMinor === null) {
    return { kind: 'hand_to_human', reason: 'no_floor_set' };
  }

  // ── 2. Opening move (no buyer offer yet) ────────────────────────────────

  if (lastBuyerOfferMinor === null) {
    // Day-1, buyer is still asking questions / greeting.
    if (messageCount <= 1) {
      return { kind: 'greet_and_ask_offer' };
    }
    // They've been chatting but never named a number. Logistics question.
    if (lastBuyerIntent === 'logistics_question') {
      return { kind: 'greet_and_ask_offer' };
    }
    // Fallback: ambiguous — hand off.
    return { kind: 'hand_to_human', reason: 'unknown_intent' };
  }

  // ── 3. Buyer offered a number — evaluate against floor ──────────────────

  // At or above floor → accept gate (human-ratified per §P6).
  if (lastBuyerOfferMinor >= floorMinor) {
    return { kind: 'accept_offer', offerMinor: lastBuyerOfferMinor };
  }

  // Well below floor → polite reject, no counter. Kuwait convention:
  // a counter on a 30%-low offer just invites another lowball.
  const offerFraction = lastBuyerOfferMinor / floorMinor;
  if (offerFraction < TOO_LOW_FRACTION) {
    return { kind: 'polite_reject', reason: 'too_low' };
  }

  // ── 4. Concession zone ──────────────────────────────────────────────────
  // Above TOO_LOW_FRACTION but below floor. Close enough to negotiate.

  // Raw percentages off list. Then clamp to stay visibly above the
  // floor-leak band — see COUNTER_FLOOR_MARGIN doc.
  const floorMargin = Math.round(floorMinor * COUNTER_FLOOR_MARGIN);
  const midCounterMinor = Math.max(
    Math.round(listPriceMinor * (1 - MID_CONCESSION_PCT / 100)),
    floorMargin,
  );
  const smallCounterMinor = Math.max(
    Math.round(listPriceMinor * (1 - SMALL_CONCESSION_PCT / 100)),
    floorMargin,
  );

  // Near the floor + we've had at least 2 AI replies → small final nudge,
  // or flip to final_offer if we've already done both bands once.
  if (offerFraction >= NEAR_FLOOR_FRACTION) {
    if (aiMessagesSent >= 3) {
      // We've danced enough. Price at floor (not below!) as final offer.
      return { kind: 'final_offer', priceMinor: floorMinor };
    }
    return {
      kind: 'small_concession',
      counterPriceMinor: smallCounterMinor,
      pctOffList: SMALL_CONCESSION_PCT,
    };
  }

  // Between 85% and 95% of floor → mid concession counter. This is
  // where the dance actually moves.
  return {
    kind: 'mid_concession',
    counterPriceMinor: midCounterMinor,
    pctOffList: MID_CONCESSION_PCT,
  };
}
