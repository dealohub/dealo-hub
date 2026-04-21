/**
 * AI Negotiator — Latency jitter (Doctrine §P14).
 *
 * Humans don't reply instantly. A seller who fires back in 800 ms,
 * 24/7, reads as a bot — breaks the "sounds human" moat (§P3) and
 * tanks trust. Even worse, it trains buyers to treat the channel as a
 * slot machine ("spam offers, auto-counter in a second, rinse").
 *
 * Strategy (per §P14):
 *   1. Base delay = function of the policy move. A "greet & ask for
 *      offer" should feel quick (~15-45 s). A "final offer" should
 *      read as considered (~3-6 min). Accept feels quick again.
 *   2. Clamped jitter on top — ±40% of the base, bounded by absolute
 *      floor/ceiling so nothing fires in <10 s or >10 min.
 *   3. Time-of-day dampener — between 23:00 and 07:00 Kuwait time,
 *      stretch the delay by ×2.5 so replies look like "woke up to
 *      check phone" and not "bot at 3 AM". Cap still honoured.
 *
 * Pure function. No Date-now side effects — caller supplies `nowMs` so
 * tests can pin time. Returns millis until send.
 *
 * Reference: planning/PHASE-6A-AI-NEGOTIATOR.md §P14 (human-like cadence).
 */

import type { PolicyMove } from './policy';

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

/** Absolute floor — nothing goes out faster than this. */
const MIN_DELAY_MS = 10_000; // 10s

/** Absolute ceiling — nothing stalls beyond this. */
const MAX_DELAY_MS = 600_000; // 10min

/** Base delay table by policy move (milliseconds, median). */
const BASE_DELAY_BY_MOVE: Record<PolicyMove['kind'], number> = {
  // Quick "got your message" responses.
  greet_and_ask_offer: 30_000, // ~30s
  accept_offer: 45_000, // ~45s — buyer wants to hear this FAST
  polite_reject: 60_000, // ~1min
  // Considered counters — reads like someone actually thought about it.
  small_concession: 90_000, // ~1.5min
  mid_concession: 120_000, // ~2min
  final_offer: 240_000, // ~4min — "let me think about my best price"
  // Handoff doesn't send to buyer — used here for completeness / tests.
  hand_to_human: 0,
};

/** Jitter magnitude as a fraction of base. ±JITTER_PCT around base. */
const JITTER_PCT = 0.4;

/**
 * Kuwait-local "asleep" window. UTC+3 year-round; Kuwait doesn't do DST.
 * 23:00-07:00 local = 20:00-04:00 UTC. Delays stretch inside this range.
 */
const SLEEP_UTC_START_HOUR = 20;
const SLEEP_UTC_END_HOUR = 4;
const NIGHT_STRETCH_MULT = 2.5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface JitterInput {
  move: PolicyMove;
  /** Current timestamp in ms. Caller supplies (Date.now()) or pins in tests. */
  nowMs: number;
  /**
   * Deterministic RNG in [0, 1). Defaults to Math.random but tests can
   * inject a seeded value so assertions are stable.
   */
  rng?: () => number;
}

export interface JitterResult {
  /** Milliseconds to wait before sending. */
  delayMs: number;
  /** `nowMs + delayMs` — epoch-ms when send is due. */
  scheduledSendAtMs: number;
  /** Was the night-stretch multiplier applied? */
  nightStretched: boolean;
}

export function computeJitteredDelay(input: JitterInput): JitterResult {
  const rng = input.rng ?? Math.random;
  const base = BASE_DELAY_BY_MOVE[input.move.kind] ?? 60_000;

  // Handoffs have no "send" — return 0 so caller can skip scheduling.
  if (base === 0) {
    return {
      delayMs: 0,
      scheduledSendAtMs: input.nowMs,
      nightStretched: false,
    };
  }

  // Symmetric jitter in [base * (1 - JITTER_PCT), base * (1 + JITTER_PCT)].
  const jitterRange = base * JITTER_PCT;
  const jittered = base - jitterRange + rng() * (2 * jitterRange);

  // Night stretch — computed on `nowMs`, NOT on the scheduled time, so
  // stretch decisions are made at the moment of scheduling (stable +
  // testable). The stretch brings the cadence into "I just woke up"
  // territory without needing a real calendar.
  const utcHour = new Date(input.nowMs).getUTCHours();
  const isNight =
    utcHour >= SLEEP_UTC_START_HOUR || utcHour < SLEEP_UTC_END_HOUR;
  const stretched = isNight ? jittered * NIGHT_STRETCH_MULT : jittered;

  // Clamp to absolute floor/ceiling.
  const clamped = Math.max(MIN_DELAY_MS, Math.min(MAX_DELAY_MS, stretched));
  const delayMs = Math.round(clamped);

  return {
    delayMs,
    scheduledSendAtMs: input.nowMs + delayMs,
    nightStretched: isNight,
  };
}
