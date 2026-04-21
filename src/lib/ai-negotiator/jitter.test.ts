import { describe, it, expect } from 'vitest';
import { computeJitteredDelay } from './jitter';
import type { PolicyMove } from './policy';

/**
 * Latency-jitter tests.
 *
 * The jitter module is the "don't sound like a bot" layer. Two
 * failure modes worth locking:
 *   1. Too fast — reply fires in < 10 s. Breaks P14 ("sounds human").
 *   2. Too slow — reply is stale, seller+buyer both walk away.
 *
 * Tests pin RNG to 0.5 (midpoint) by default so assertions are stable.
 * We verify the base delay per-move, the clamp floor + ceiling, and
 * the night-stretch multiplier.
 *
 * Time convention: `nowMs` in UTC. Kuwait is UTC+3 year-round (no DST).
 *   • Day UTC hour (e.g. 12:00 → 15:00 Kuwait) → no stretch
 *   • Night UTC hour (e.g. 22:00 → 01:00 Kuwait next day) → stretched
 */

const mid = () => 0.5;
const low = () => 0.0;
const high = () => 0.9999;

// Daytime UTC: 2024-05-01 09:00 UTC = 12:00 Kuwait — well inside "awake" window.
const DAY_UTC = Date.UTC(2024, 4, 1, 9, 0, 0);
// Nighttime UTC: 2024-05-01 22:00 UTC = 01:00 Kuwait next day — inside sleep window.
const NIGHT_UTC = Date.UTC(2024, 4, 1, 22, 0, 0);

// ---------------------------------------------------------------------------
// Base delay per policy move
// ---------------------------------------------------------------------------

describe('base delay by move', () => {
  it('greet_and_ask_offer → ~30s at jitter midpoint', () => {
    const r = computeJitteredDelay({
      move: { kind: 'greet_and_ask_offer' },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.delayMs).toBe(30_000);
  });

  it('accept_offer → ~45s (fast, buyer wants the yes)', () => {
    const r = computeJitteredDelay({
      move: { kind: 'accept_offer', offerMinor: 1 },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.delayMs).toBe(45_000);
  });

  it('final_offer → ~4min (considered)', () => {
    const r = computeJitteredDelay({
      move: { kind: 'final_offer', priceMinor: 1 },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.delayMs).toBe(240_000);
  });

  it('hand_to_human → 0 (no send scheduled)', () => {
    const r = computeJitteredDelay({
      move: { kind: 'hand_to_human', reason: 'turn_cap_reached' },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.delayMs).toBe(0);
    expect(r.scheduledSendAtMs).toBe(DAY_UTC);
  });
});

// ---------------------------------------------------------------------------
// Jitter range
// ---------------------------------------------------------------------------

describe('jitter range', () => {
  const move: PolicyMove = { kind: 'greet_and_ask_offer' }; // base 30 000

  it('rng=0.0 → base * 0.6 = 18_000ms (low end)', () => {
    const r = computeJitteredDelay({ move, nowMs: DAY_UTC, rng: low });
    expect(r.delayMs).toBe(18_000);
  });

  it('rng=0.9999 → base * 1.4 = ~42_000ms (high end)', () => {
    const r = computeJitteredDelay({ move, nowMs: DAY_UTC, rng: high });
    expect(r.delayMs).toBeGreaterThanOrEqual(41_996);
    expect(r.delayMs).toBeLessThanOrEqual(42_000);
  });
});

// ---------------------------------------------------------------------------
// Absolute clamps
// ---------------------------------------------------------------------------

describe('absolute clamps', () => {
  it('greet_and_ask_offer at low jitter during DAY is NOT clamped (18s > 10s floor)', () => {
    const r = computeJitteredDelay({
      move: { kind: 'greet_and_ask_offer' },
      nowMs: DAY_UTC,
      rng: low,
    });
    expect(r.delayMs).toBe(18_000);
  });

  it('final_offer at NIGHT hits the 10min ceiling', () => {
    // 240 000 base × 1.4 (jitter high) × 2.5 (night) = 840 000ms = 14min — clamped to 10min
    const r = computeJitteredDelay({
      move: { kind: 'final_offer', priceMinor: 1 },
      nowMs: NIGHT_UTC,
      rng: high,
    });
    expect(r.delayMs).toBe(600_000);
    expect(r.nightStretched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Night stretch
// ---------------------------------------------------------------------------

describe('night stretch (Kuwait sleep window)', () => {
  it('daytime reply — nightStretched=false', () => {
    const r = computeJitteredDelay({
      move: { kind: 'greet_and_ask_offer' },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.nightStretched).toBe(false);
  });

  it('nighttime reply — nightStretched=true, delay ≥ 2× daytime', () => {
    const dayR = computeJitteredDelay({
      move: { kind: 'small_concession', counterPriceMinor: 1, pctOffList: 3 },
      nowMs: DAY_UTC,
      rng: mid,
    });
    const nightR = computeJitteredDelay({
      move: { kind: 'small_concession', counterPriceMinor: 1, pctOffList: 3 },
      nowMs: NIGHT_UTC,
      rng: mid,
    });
    expect(nightR.nightStretched).toBe(true);
    expect(nightR.delayMs).toBeGreaterThanOrEqual(dayR.delayMs * 2);
  });
});

// ---------------------------------------------------------------------------
// scheduledSendAtMs = nowMs + delayMs
// ---------------------------------------------------------------------------

describe('scheduledSendAtMs arithmetic', () => {
  it('= nowMs + delayMs exactly', () => {
    const r = computeJitteredDelay({
      move: { kind: 'mid_concession', counterPriceMinor: 1, pctOffList: 8 },
      nowMs: DAY_UTC,
      rng: mid,
    });
    expect(r.scheduledSendAtMs).toBe(DAY_UTC + r.delayMs);
  });
});
