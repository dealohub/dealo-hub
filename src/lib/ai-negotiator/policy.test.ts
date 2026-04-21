import { describe, it, expect } from 'vitest';
import { decidePolicyMove, type PolicyInput } from './policy';

/**
 * Policy module tests.
 *
 * The policy module is the AI negotiator's brain. It decides what to
 * do next given a negotiation state — the LLM only verbalises. A bug
 * here = the AI makes the wrong strategic move.
 *
 * We exhaustively test the decision tree:
 *   - Safety handoffs (turn cap, emotional, no-floor)
 *   - Opening moves (greet, logistics)
 *   - Offer evaluation vs floor (accept, too-low, concession bands)
 *   - Edge cases (exact boundaries, message counts)
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KWD_650K = 650_000_000; // 650,000 KWD in fils
const KWD_600K = 600_000_000;
const KWD_510K = 510_000_000; // 85% of 600k — exactly at too-low boundary
const KWD_550K = 550_000_000;
const KWD_570K = 570_000_000; // 95% of 600k — near-floor boundary
const KWD_580K = 580_000_000; // between near-floor and floor
const KWD_620K = 620_000_000; // above floor

const baseInput: PolicyInput = {
  listPriceMinor: KWD_650K,
  floorMinor: KWD_600K,
  lastBuyerOfferMinor: null,
  messageCount: 1,
  aiMessagesSent: 0,
  lastBuyerIntent: null,
};

// ---------------------------------------------------------------------------
// Safety handoffs (fire BEFORE any price logic)
// ---------------------------------------------------------------------------

describe('safety handoffs', () => {
  it('turn cap reached → hand_to_human', () => {
    const move = decidePolicyMove({
      ...baseInput,
      aiMessagesSent: 6,
      lastBuyerOfferMinor: KWD_620K, // even a good offer
    });
    expect(move.kind).toBe('hand_to_human');
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('turn_cap_reached');
    }
  });

  it('emotional intent → hand_to_human', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerIntent: 'emotional',
      lastBuyerOfferMinor: KWD_620K,
    });
    expect(move.kind).toBe('hand_to_human');
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('emotional_content');
    }
  });

  it('personal_question → hand_to_human', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerIntent: 'personal_question',
    });
    expect(move.kind).toBe('hand_to_human');
  });

  it('off_topic → hand_to_human', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerIntent: 'off_topic',
    });
    expect(move.kind).toBe('hand_to_human');
  });

  it('no floor set → defensive hand_to_human', () => {
    const move = decidePolicyMove({
      ...baseInput,
      floorMinor: null,
      lastBuyerOfferMinor: KWD_620K,
    });
    expect(move.kind).toBe('hand_to_human');
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('no_floor_set');
    }
  });

  it('safety handoffs fire even at message 0', () => {
    const move = decidePolicyMove({
      ...baseInput,
      messageCount: 0,
      lastBuyerIntent: 'emotional',
    });
    expect(move.kind).toBe('hand_to_human');
  });
});

// ---------------------------------------------------------------------------
// Opening moves (no buyer offer yet)
// ---------------------------------------------------------------------------

describe('opening moves', () => {
  it('first message + no offer → greet_and_ask_offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      messageCount: 1,
      lastBuyerOfferMinor: null,
    });
    expect(move.kind).toBe('greet_and_ask_offer');
  });

  it('logistics question + no offer → greet_and_ask_offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      messageCount: 3,
      lastBuyerIntent: 'logistics_question',
      lastBuyerOfferMinor: null,
    });
    expect(move.kind).toBe('greet_and_ask_offer');
  });

  it('ambiguous mid-chat no-offer → hand_to_human (unknown_intent)', () => {
    const move = decidePolicyMove({
      ...baseInput,
      messageCount: 4,
      lastBuyerIntent: null,
      lastBuyerOfferMinor: null,
    });
    expect(move.kind).toBe('hand_to_human');
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('unknown_intent');
    }
  });
});

// ---------------------------------------------------------------------------
// Offer evaluation
// ---------------------------------------------------------------------------

describe('offer above floor', () => {
  it('offer above floor → accept_offer with the buyer offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_620K,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('accept_offer');
    if (move.kind === 'accept_offer') {
      expect(move.offerMinor).toBe(KWD_620K);
    }
  });

  it('offer exactly at floor → accept_offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_600K,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('accept_offer');
  });

  it('offer 1 minor unit above floor → accept_offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_600K + 1,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('accept_offer');
  });
});

describe('offer too low (<85% of floor)', () => {
  it('50% of floor → polite_reject', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: Math.round(KWD_600K * 0.5),
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('polite_reject');
    if (move.kind === 'polite_reject') {
      expect(move.reason).toBe('too_low');
    }
  });

  it('84% of floor → polite_reject', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: Math.round(KWD_600K * 0.84),
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('polite_reject');
  });
});

describe('mid-concession zone (85-95% of floor)', () => {
  it('85% of floor (at boundary) → mid_concession, clamped to floor*1.06 when raw counter would leak', () => {
    // 85% of 600k = 510k → concession zone.
    // Raw mid counter = 650k * 0.92 = 598k — but that's INSIDE the floor
    // ±5% band (570k-630k). The clamp pushes it to floor*1.06 = 636k.
    // This keeps the counter visibly above the leak band and preserves
    // defence-in-depth between policy + safety pipeline.
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_510K,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('mid_concession');
    if (move.kind === 'mid_concession') {
      expect(move.counterPriceMinor).toBe(
        Math.round(KWD_600K * 1.06),
      );
      expect(move.pctOffList).toBe(8);
    }
  });

  it('580k (between near-floor and floor) → mid_concession when AI reply count < 3', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_580K,
      aiMessagesSent: 1,
      lastBuyerIntent: 'price_offer',
    });
    // 580k / 600k = 0.9667 → >= NEAR_FLOOR_FRACTION (0.95), so small_concession
    expect(move.kind).toBe('small_concession');
  });

  it('offer 90% of floor (below near-floor) → mid_concession', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: Math.round(KWD_600K * 0.9),
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('mid_concession');
  });
});

describe('near-floor zone (≥95% of floor, <floor)', () => {
  it('95% of floor + few AI messages → small_concession, clamped above leak band', () => {
    // Raw small counter = 650k * 0.97 = 630.5k — which is inside the
    // floor ±5% band (570k-630k). Clamp to floor*1.06 = 636k.
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_570K, // 95% of 600k
      aiMessagesSent: 1,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('small_concession');
    if (move.kind === 'small_concession') {
      expect(move.counterPriceMinor).toBe(
        Math.round(KWD_600K * 1.06),
      );
      expect(move.pctOffList).toBe(3);
    }
  });

  it('near-floor + 3 AI messages already sent → final_offer at floor', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_580K,
      aiMessagesSent: 3,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('final_offer');
    if (move.kind === 'final_offer') {
      // Final offer lands AT floor, never below
      expect(move.priceMinor).toBe(KWD_600K);
    }
  });

  it('final_offer never goes below the floor', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_580K,
      aiMessagesSent: 5,
      lastBuyerIntent: 'price_offer',
    });
    if (move.kind === 'final_offer') {
      expect(move.priceMinor).toBeGreaterThanOrEqual(KWD_600K);
    }
  });
});

// ---------------------------------------------------------------------------
// Boundary + precedence
// ---------------------------------------------------------------------------

describe('boundary + precedence', () => {
  it('turn cap precedence: fires even with a winning offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      aiMessagesSent: 6,
      lastBuyerOfferMinor: KWD_620K, // would normally accept
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('hand_to_human');
  });

  it('emotional precedence: fires even above floor', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_620K,
      lastBuyerIntent: 'emotional',
    });
    expect(move.kind).toBe('hand_to_human');
  });

  it('determinism: same input → same output', () => {
    const input: PolicyInput = {
      ...baseInput,
      lastBuyerOfferMinor: KWD_580K,
      aiMessagesSent: 2,
      lastBuyerIntent: 'price_offer',
    };
    const a = decidePolicyMove(input);
    const b = decidePolicyMove(input);
    expect(a).toEqual(b);
  });

  it('no_floor_set precedence: handoff even with any valid offer', () => {
    const move = decidePolicyMove({
      ...baseInput,
      floorMinor: null,
      lastBuyerOfferMinor: KWD_620K,
      lastBuyerIntent: 'price_offer',
    });
    expect(move.kind).toBe('hand_to_human');
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('no_floor_set');
    }
  });

  it('turn cap fires BEFORE no_floor check (turn cap is highest priority)', () => {
    const move = decidePolicyMove({
      ...baseInput,
      floorMinor: null,
      aiMessagesSent: 6,
    });
    if (move.kind === 'hand_to_human') {
      expect(move.reason).toBe('turn_cap_reached');
    }
  });
});

// ---------------------------------------------------------------------------
// Invariants (property-based sanity)
// ---------------------------------------------------------------------------

describe('invariants', () => {
  it('accept_offer never fires when offer < floor', () => {
    for (const offerPct of [0.5, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99]) {
      const move = decidePolicyMove({
        ...baseInput,
        lastBuyerOfferMinor: Math.round(KWD_600K * offerPct),
        lastBuyerIntent: 'price_offer',
      });
      expect(move.kind).not.toBe('accept_offer');
    }
  });

  it('final_offer priceMinor is always >= floor', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_570K,
      aiMessagesSent: 4,
      lastBuyerIntent: 'price_offer',
    });
    if (move.kind === 'final_offer') {
      expect(move.priceMinor).toBeGreaterThanOrEqual(KWD_600K);
    }
  });

  it('concession counter is always < list price', () => {
    const move = decidePolicyMove({
      ...baseInput,
      lastBuyerOfferMinor: KWD_550K,
      lastBuyerIntent: 'price_offer',
    });
    if (move.kind === 'small_concession' || move.kind === 'mid_concession') {
      expect(move.counterPriceMinor).toBeLessThan(KWD_650K);
    }
  });

  it('small_concession counter > mid_concession counter (small is less generous)', () => {
    const small = Math.round(KWD_650K * 0.97);
    const mid = Math.round(KWD_650K * 0.92);
    expect(small).toBeGreaterThan(mid);
  });

  it('concession counters are ALWAYS above floor × 1.06 (defence-in-depth against floor-leak scanner)', () => {
    // Regression guard: the live smoke test (2026-04-21) revealed the
    // raw mid_concession landed INSIDE the floor ±5% band, tripping the
    // safety scanner. Policy now clamps counters to stay clear.
    const margin = Math.round(KWD_600K * 1.06);

    for (const offerFraction of [0.86, 0.9, 0.93, 0.96, 0.99]) {
      const move = decidePolicyMove({
        ...baseInput,
        lastBuyerOfferMinor: Math.round(KWD_600K * offerFraction),
        aiMessagesSent: 1,
        lastBuyerIntent: 'price_offer',
      });
      if (move.kind === 'small_concession' || move.kind === 'mid_concession') {
        expect(move.counterPriceMinor).toBeGreaterThanOrEqual(margin);
      }
    }
  });

  it('when list price is comfortably above floor, counters use the pct-off (no clamp)', () => {
    // List 1M, floor 600k → band upper bound 630k.
    // mid 8% off 1M = 920k, already well above 636k → no clamp.
    const move = decidePolicyMove({
      listPriceMinor: 1_000_000_000,
      floorMinor: 600_000_000,
      lastBuyerOfferMinor: 550_000_000, // below floor, concession zone
      messageCount: 2,
      aiMessagesSent: 1,
      lastBuyerIntent: 'price_offer',
    });
    if (move.kind === 'mid_concession') {
      expect(move.counterPriceMinor).toBe(Math.round(1_000_000_000 * 0.92));
    }
  });
});
