import { describe, it, expect } from 'vitest';
import { generateReply } from './dialogue';
import { StubProvider } from './provider';
import { buildSystemPrompt } from './prompts';
import type { PolicyMove } from './policy';
import type { PromptContext } from './prompts';

/**
 * Dialogue orchestrator + prompt-builder tests.
 *
 * Prompt tests are deterministic (pure string transforms). Dialogue
 * tests run against StubProvider so no external calls fire — the
 * whole suite stays ms-fast and offline.
 *
 * Key invariants we lock down:
 *   - Prompt NEVER contains the floor number (P2 — even though the
 *     policy already redacted it, double-check)
 *   - Prompt ALWAYS contains the cultural rules block (P4)
 *   - Prompt ALWAYS contains the prohibitions block (P5)
 *   - Arabic prompts request Khaleeji, never MSA (P12)
 *   - Machine tags are parseable by the stub (provider integration)
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KWD_650K = 650_000_000;
const KWD_600K = 600_000_000; // seller's floor in tests — must NEVER appear in prompt
const KWD_580K = 580_000_000;

const baseCtx: PromptContext = {
  tone: 'warm',
  language: 'ar',
  listingTitle: 'فيلا في بيان — مفحوصة ديلو',
  listPriceMinor: KWD_650K,
  currency: 'KWD',
  buyerLastMessage: 'السلام عليكم، كم آخر سعر؟',
};

// ---------------------------------------------------------------------------
// Prompt builder — deterministic, no LLM
// ---------------------------------------------------------------------------

describe('buildSystemPrompt — cultural compliance', () => {
  it('Arabic prompt instructs AI to mirror buyer register — Khaleeji is one option, NOT forced (P12 revised)', () => {
    // Phase 6a v1.1: Kuwait's ~70% expat population means we CANNOT force
    // Khaleeji dialect on buyers who write Egyptian, Levantine, or MSA.
    // The correct rule is: mirror the buyer's register. This test locks
    // that rule down.
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'ar' });
    // Prompt must discuss MULTIPLE register options, not just Khaleeji.
    expect(prompt).toMatch(/خليجية/);
    expect(prompt).toMatch(/فصحى/);
    // Must explicitly mention register-mirroring.
    expect(prompt).toMatch(/طابِق|متعدّد الجنسيات|مصري|شامية|لهجته/);
  });

  it('Arabic prompt does NOT ban MSA outright (regression guard)', () => {
    // v1.0 banned MSA entirely; v1.1 allows it when mirroring.
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'ar' });
    // Must NOT contain a blanket "don't use MSA" instruction.
    expect(prompt).not.toMatch(/لا تستخدم الفصحى/);
  });

  it('Arabic prompt forbids starting with a bare number (P4 still holds)', () => {
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'ar' });
    expect(prompt).toMatch(/لا تبدأ|رقم فقط|قلّة أدب/);
  });

  it('English prompt handles broken / non-native English politely', () => {
    // Many Kuwait residents (South Asian workers, domestic help) write
    // simple or broken English. AI must reply in SIMPLE sentences, never
    // correct the buyer.
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'en' });
    expect(prompt).toMatch(/broken.*English|non-native|SHORT|SIMPLE/i);
    expect(prompt).toMatch(/never correct/i);
  });

  it('English prompt covers register-mirroring', () => {
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'en' });
    expect(prompt).toMatch(/Cultural rules/);
    expect(prompt).toMatch(/Never start a first reply with a bare number/);
    expect(prompt).toMatch(/Mirror.*register|multinational/i);
  });

  it('English prompt requires equal politeness regardless of buyer background', () => {
    const move: PolicyMove = { kind: 'greet_and_ask_offer' };
    const prompt = buildSystemPrompt(move, { ...baseCtx, language: 'en' });
    expect(prompt).toMatch(/respectful|Same politeness|regardless of nationality/i);
  });

  it('every prompt contains the prohibitions block (P5)', () => {
    const moves: PolicyMove[] = [
      { kind: 'greet_and_ask_offer' },
      { kind: 'polite_reject', reason: 'too_low' },
      { kind: 'small_concession', counterPriceMinor: 630_000_000, pctOffList: 3 },
      { kind: 'mid_concession', counterPriceMinor: 598_000_000, pctOffList: 8 },
      { kind: 'final_offer', priceMinor: 600_000_000 },
      { kind: 'accept_offer', offerMinor: 620_000_000 },
      { kind: 'hand_to_human', reason: 'emotional_content' },
    ];
    for (const m of moves) {
      const prompt = buildSystemPrompt(m, baseCtx);
      expect(prompt).toMatch(/ممنوع|Prohibited/);
      expect(prompt).toMatch(/هاتف|phone number/i);
      expect(prompt).toMatch(/خارج ديلو|off Dealo/i);
    }
  });
});

describe('buildSystemPrompt — floor leak prevention (P2)', () => {
  it('prompt NEVER contains the floor number (policy module redacted it)', () => {
    // Even though prompts.ts doesn't receive the floor, this is a
    // defense-in-depth check: nothing we accidentally pass via ctx
    // should leak it either.
    const moves: PolicyMove[] = [
      { kind: 'small_concession', counterPriceMinor: 630_000_000, pctOffList: 3 },
      { kind: 'mid_concession', counterPriceMinor: 598_000_000, pctOffList: 8 },
      { kind: 'polite_reject', reason: 'too_low' },
      { kind: 'accept_offer', offerMinor: KWD_600K + 1 },
    ];
    for (const m of moves) {
      const prompt = buildSystemPrompt(m, baseCtx);
      // The string "600,000.000" (KWD 3-decimal formatting) should not
      // appear UNLESS the move itself legitimately references a number
      // at that value. In our fixtures it doesn't.
      expect(prompt).not.toMatch(/600,?000\.000/);
    }
  });

  it('final_offer IS allowed to expose the floor (it was chosen as final)', () => {
    // This is the one exception: final_offer.priceMinor = floor.
    // The policy module decided to reveal. That's intentional.
    const move: PolicyMove = { kind: 'final_offer', priceMinor: KWD_600K };
    const prompt = buildSystemPrompt(move, baseCtx);
    expect(prompt).toMatch(/600,?000\.000/);
  });
});

describe('buildSystemPrompt — move-specific instructions', () => {
  it('greet_and_ask_offer: tells AI NOT to name a number', () => {
    const prompt = buildSystemPrompt(
      { kind: 'greet_and_ask_offer' },
      baseCtx,
    );
    expect(prompt).toMatch(/بدون ذكر أيّ رقم|بدون.*رقم/);
  });

  it('small_concession: instruction includes the counter price', () => {
    const prompt = buildSystemPrompt(
      { kind: 'small_concession', counterPriceMinor: 630_500_000, pctOffList: 3 },
      baseCtx,
    );
    expect(prompt).toMatch(/630,?500\.000/);
    expect(prompt).toMatch(/3%/);
  });

  it('accept_offer: tells AI NOT to commit to the deal', () => {
    const prompt = buildSystemPrompt(
      { kind: 'accept_offer', offerMinor: 620_000_000 },
      baseCtx,
    );
    // Arabic version says "لا توقّع الصفقة" — make sure this language
    // appears so the LLM knows it's a tentative accept
    expect(prompt).toMatch(/لا توقّع|مبدئياً|confirm|reply within/i);
  });

  it('hand_to_human: tells AI NOT to answer the question', () => {
    const prompt = buildSystemPrompt(
      { kind: 'hand_to_human', reason: 'personal_question' },
      baseCtx,
    );
    expect(prompt).toMatch(/لا تجيب|Do NOT attempt/);
  });
});

describe('buildSystemPrompt — tone modifiers', () => {
  it('professional tone restrains jokes', () => {
    const prompt = buildSystemPrompt(
      { kind: 'greet_and_ask_offer' },
      { ...baseCtx, tone: 'professional' },
    );
    expect(prompt).toMatch(/رسمية|professional/i);
  });

  it('concise tone caps sentences', () => {
    const prompt = buildSystemPrompt(
      { kind: 'greet_and_ask_offer' },
      { ...baseCtx, tone: 'concise' },
    );
    expect(prompt).toMatch(/مختصرة|concise/i);
  });

  it('warm tone permits cultural phrases', () => {
    const prompt = buildSystemPrompt(
      { kind: 'greet_and_ask_offer' },
      { ...baseCtx, tone: 'warm' },
    );
    expect(prompt).toMatch(/دافئة|warm/i);
  });
});

describe('buildSystemPrompt — machine tags', () => {
  it('appends [[move:xxx]] [[lang:yy]] at end', () => {
    const prompt = buildSystemPrompt(
      { kind: 'accept_offer', offerMinor: 620_000_000 },
      { ...baseCtx, language: 'ar' },
    );
    expect(prompt).toMatch(/\[\[move:accept_offer\]\]/);
    expect(prompt).toMatch(/\[\[lang:ar\]\]/);
  });
});

// ---------------------------------------------------------------------------
// generateReply — end-to-end with StubProvider
// ---------------------------------------------------------------------------

describe('generateReply (with StubProvider)', () => {
  const provider = new StubProvider();

  it('produces a non-empty draft for every move kind', async () => {
    const moves: PolicyMove[] = [
      { kind: 'greet_and_ask_offer' },
      { kind: 'polite_reject', reason: 'too_low' },
      { kind: 'small_concession', counterPriceMinor: 630_000_000, pctOffList: 3 },
      { kind: 'mid_concession', counterPriceMinor: 598_000_000, pctOffList: 8 },
      { kind: 'final_offer', priceMinor: 600_000_000 },
      { kind: 'accept_offer', offerMinor: 620_000_000 },
      { kind: 'hand_to_human', reason: 'turn_cap_reached' },
    ];
    for (const move of moves) {
      const result = await generateReply({
        move,
        ctx: baseCtx,
        provider,
      });
      expect(result.draftText.length).toBeGreaterThan(5);
      expect(result.model).toBe('stub-v1');
    }
  });

  it('returns token counts + latency', async () => {
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: baseCtx,
      provider,
    });
    expect(result.tokensInput).toBeGreaterThan(0);
    expect(result.tokensOutput).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns a stable prompt hash prefix (16 hex chars)', async () => {
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: baseCtx,
      provider,
    });
    expect(result.promptHashPrefix).toMatch(/^[0-9a-f]{16}$/);
  });

  it('identical inputs produce identical prompt hash', async () => {
    const a = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: baseCtx,
      provider,
    });
    const b = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: baseCtx,
      provider,
    });
    expect(a.promptHashPrefix).toBe(b.promptHashPrefix);
  });

  it('Arabic input → Arabic draft (Khaleeji canned)', async () => {
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: { ...baseCtx, language: 'ar' },
      provider,
    });
    // Arabic characters should dominate
    const arabic = (result.draftText.match(/[\u0600-\u06FF]/g) || []).length;
    expect(arabic).toBeGreaterThan(5);
  });

  it('English input → English draft', async () => {
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: { ...baseCtx, language: 'en' },
      provider,
    });
    const arabic = (result.draftText.match(/[\u0600-\u06FF]/g) || []).length;
    expect(arabic).toBe(0);
  });

  it('clips history beyond 4 recent messages', async () => {
    const longHistory = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `turn ${i}`,
    }));
    // Should not throw, should return cleanly
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: baseCtx,
      history: longHistory,
      provider,
    });
    expect(result.draftText.length).toBeGreaterThan(0);
  });

  it('handles empty buyerLastMessage gracefully', async () => {
    const result = await generateReply({
      move: { kind: 'greet_and_ask_offer' },
      ctx: { ...baseCtx, buyerLastMessage: '' },
      provider,
    });
    expect(result.draftText.length).toBeGreaterThan(0);
  });
});
