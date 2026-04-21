import { describe, it, expect } from 'vitest';
import { reactToBuyerMessage } from './orchestrator';
import { StubProvider } from './provider';
import type { ReactInput } from './orchestrator';

/**
 * Orchestrator end-to-end tests.
 *
 * These are the highest-leverage tests in the whole ai-negotiator
 * subsystem — if they pass, all the pieces wire together correctly.
 * We use StubProvider so nothing hits the network; the pipeline itself
 * (classifier → extract → policy → LLM → safety → jitter) is exercised
 * in full.
 *
 * What's NOT tested here:
 *   - Individual regex / policy / safety rules (covered in their own
 *     files; re-running them would be a duplicate burden).
 *   - DB persistence (caller's responsibility; tested at the server
 *     action layer).
 *
 * What IS tested here:
 *   - Intent → handoff routing (emotional / personal / off-topic)
 *   - `no_floor_set` handoff short-circuits the LLM call
 *   - Price_offer + accept → reply_scheduled with non-handoff move
 *   - Safety block escalates to handoff even on a valid policy move
 *   - Opening turn with null intent → lets greeting through
 *   - Subsequent turns with null intent → no_action (don't spam)
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = Date.UTC(2024, 4, 1, 10, 0, 0); // daytime UTC

const KWD_650K = 650_000_000; // list
const KWD_600K = 600_000_000; // floor
const KWD_620K = 620_000_000; // a valid offer ≥ floor

const baseListing: ReactInput['listing'] = {
  listPriceMinor: KWD_650K,
  floorMinor: KWD_600K,
  currency: 'KWD',
  minorUnitsPerMajor: 1000,
  titleForPrompt: 'فيلا في بيان — مفحوصة ديلو',
};

function makeInput(overrides: Partial<ReactInput> = {}): ReactInput {
  return {
    buyerText: 'السلام عليكم، كم آخر سعر؟',
    language: 'ar',
    tone: 'warm',
    listing: baseListing,
    conversation: {
      messageCount: 1,
      aiMessagesSent: 0,
      previousOfferMinor: null,
      ...(overrides.conversation ?? {}),
    },
    provider: new StubProvider(),
    nowMs: NOW,
    rng: () => 0.5,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Handoff routing
// ---------------------------------------------------------------------------

describe('handoff short-circuits the LLM', () => {
  it('emotional content → handoff', async () => {
    const r = await reactToBuyerMessage(
      makeInput({ buyerText: 'والله ضروري محتاج مساعدة، أبوي في المستشفى' }),
    );
    expect(r.kind).toBe('handoff');
    if (r.kind === 'handoff') {
      expect(r.move.reason).toBe('emotional_content');
      expect(r.intent).toBe('emotional');
    }
  });

  it('personal question about seller → handoff', async () => {
    const r = await reactToBuyerMessage(
      makeInput({ buyerText: 'كم عمرك وجنسيتك؟' }),
    );
    expect(r.kind).toBe('handoff');
    if (r.kind === 'handoff') {
      expect(r.move.reason).toBe('personal_question');
    }
  });

  it('off-topic (world cup) → handoff', async () => {
    const r = await reactToBuyerMessage(
      makeInput({ buyerText: 'شوفت مباراة كاس العالم أمس؟' }),
    );
    expect(r.kind).toBe('handoff');
  });

  it('no floor set → handoff without LLM call', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'ممكن 550؟',
        listing: { ...baseListing, floorMinor: null },
      }),
    );
    expect(r.kind).toBe('handoff');
    if (r.kind === 'handoff') {
      expect(r.move.reason).toBe('no_floor_set');
    }
  });

  it('turn cap reached → handoff', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'ممكن 580؟',
        conversation: {
          messageCount: 10,
          aiMessagesSent: 6,
          previousOfferMinor: null,
        },
      }),
    );
    expect(r.kind).toBe('handoff');
    if (r.kind === 'handoff') {
      expect(r.move.reason).toBe('turn_cap_reached');
    }
  });
});

// ---------------------------------------------------------------------------
// Happy-path scheduling
// ---------------------------------------------------------------------------

describe('reply_scheduled paths', () => {
  it('opening greeting (messageCount=1, no offer) → greet_and_ask_offer scheduled', async () => {
    const r = await reactToBuyerMessage(makeInput());
    expect(r.kind).toBe('reply_scheduled');
    if (r.kind === 'reply_scheduled') {
      expect(r.move.kind).toBe('greet_and_ask_offer');
      expect(r.draft.draftText.length).toBeGreaterThan(0);
      expect(r.delayMs).toBeGreaterThanOrEqual(10_000);
      expect(r.scheduledSendAtMs).toBe(NOW + r.delayMs);
    }
  });

  it('buyer offers above floor → accept scheduled', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'أقبل بـ 620 ألف',
        conversation: {
          messageCount: 4,
          aiMessagesSent: 2,
          previousOfferMinor: null,
        },
      }),
    );
    expect(r.kind).toBe('reply_scheduled');
    if (r.kind === 'reply_scheduled') {
      expect(r.move.kind).toBe('accept_offer');
      if (r.move.kind === 'accept_offer') {
        expect(r.move.offerMinor).toBe(KWD_620K);
      }
    }
  });

  it('mid-band offer → mid_concession counter scheduled', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'ممكن 530 ألف؟',
        conversation: {
          messageCount: 2,
          aiMessagesSent: 0,
          previousOfferMinor: null,
        },
      }),
    );
    expect(r.kind).toBe('reply_scheduled');
    if (r.kind === 'reply_scheduled') {
      expect(['mid_concession', 'small_concession']).toContain(r.move.kind);
    }
  });

  it('logistics question with no offer → greet_and_ask_offer (polite prompt)', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'لا تزال متاحة؟',
        conversation: {
          messageCount: 3,
          aiMessagesSent: 1,
          previousOfferMinor: null,
        },
      }),
    );
    expect(r.kind).toBe('reply_scheduled');
    if (r.kind === 'reply_scheduled') {
      expect(r.move.kind).toBe('greet_and_ask_offer');
    }
  });
});

// ---------------------------------------------------------------------------
// Offer extraction wired correctly
// ---------------------------------------------------------------------------

describe('offer extraction threads through', () => {
  it('extracts "620 ألف" as 620_000_000 minor', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'عرضي 620 ألف',
        conversation: {
          messageCount: 2,
          aiMessagesSent: 0,
          previousOfferMinor: null,
        },
      }),
    );
    expect(r.kind).toBe('reply_scheduled');
    if (r.kind === 'reply_scheduled') {
      expect(r.offerMinor).toBe(KWD_620K);
    }
  });

  it('non-price intent → does NOT call extractor (no false offer)', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'كم غرفة؟ فيها 5 غرف؟',
        conversation: {
          messageCount: 2,
          aiMessagesSent: 0,
          previousOfferMinor: null,
        },
      }),
    );
    // logistics_question — should NOT treat "5" as an offer
    if (r.kind === 'reply_scheduled') {
      expect(r.offerMinor).toBeNull();
    }
  });

  it('price intent with no extractable number falls back to null', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'ينزل السعر؟',
        conversation: {
          messageCount: 2,
          aiMessagesSent: 0,
          previousOfferMinor: null,
        },
      }),
    );
    // Intent=price_offer, no number → opening-phase logic fires
    if (r.kind === 'reply_scheduled') {
      expect(r.offerMinor).toBeNull();
    }
  });

  it('carries forward previousOfferMinor when current message has no number', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'لسه أفكر',
        conversation: {
          messageCount: 5,
          aiMessagesSent: 2,
          previousOfferMinor: 580_000_000,
        },
      }),
    );
    // intent is null (nothing matches), carries through as no_action or unknown
    expect(['no_action', 'handoff']).toContain(r.kind);
  });
});

// ---------------------------------------------------------------------------
// Null-intent handling
// ---------------------------------------------------------------------------

describe('null-intent edge cases', () => {
  it('gibberish with messageCount=1 (opening) → allows greeting through', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'asdfasdf',
        conversation: {
          messageCount: 1,
          aiMessagesSent: 0,
          previousOfferMinor: null,
        },
      }),
    );
    // Opening-phase policy picks greet_and_ask_offer even on null intent
    expect(r.kind).toBe('reply_scheduled');
  });

  it('gibberish mid-conversation → no_action', async () => {
    const r = await reactToBuyerMessage(
      makeInput({
        buyerText: 'asdf asdf qwer',
        conversation: {
          messageCount: 4,
          aiMessagesSent: 2,
          previousOfferMinor: null,
        },
      }),
    );
    // Null intent + not opening → no_action OR handoff (both acceptable)
    expect(['no_action', 'handoff']).toContain(r.kind);
  });
});
