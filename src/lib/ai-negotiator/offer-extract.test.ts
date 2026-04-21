import { describe, it, expect } from 'vitest';
import { extractOffer } from './offer-extract';

/**
 * Offer extraction tests.
 *
 * The policy module needs a number; the buyer writes chat. This module
 * is the bridge. A wrong extraction has one of two failure modes:
 *
 *   1. False positive → AI treats a non-price number (bedroom count,
 *      phone fragment, reference code) as an offer and counters. Mild
 *      embarrassment, but recoverable — handoff kicks in.
 *   2. False negative → buyer's real number is missed; AI proceeds
 *      with `lastBuyerOfferMinor=null` (opening-phase logic). Not
 *      unsafe — just misses a negotiation opportunity.
 *
 * KWD minor-unit scale: 1 KWD = 1000 fils. Most tests below pin
 * `minorUnitsPerMajor=1000` so "550" → 550_000.
 */

const KWD = 1000; // fils per dinar
const AED = 100;

// ---------------------------------------------------------------------------
// k-suffix — most common Kuwait shorthand
// ---------------------------------------------------------------------------

describe('k-suffix ("550k")', () => {
  it.each([
    ['550k', 550_000],
    ['550K', 550_000],
    ['1.2k', 1_200],
    ['offer is 600k please', 600_000],
    ['أقدر أدفع 580k', 580_000],
  ])('"%s" → %d (KWD minor)', (text, expected) => {
    const r = extractOffer({ text, minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(expected * KWD);
    expect(r?.strategy).toBe('k_suffix');
  });
});

// ---------------------------------------------------------------------------
// Arabic thousand word
// ---------------------------------------------------------------------------

describe('Arabic thousand ("600 ألف")', () => {
  it.each([
    ['600 ألف', 600_000],
    ['عرضي 580 ألف', 580_000],
    ['بسعر 450 الف', 450_000], // unvoweled spelling
  ])('"%s" → %d', (text, expected) => {
    const r = extractOffer({ text, minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(expected * KWD);
    expect(r?.strategy).toBe('arabic_thousand');
  });
});

describe('Arabic-Indic digits (٠-٩)', () => {
  it('"٥٥٠ ألف" normalised to 550 ألف', () => {
    const r = extractOffer({ text: '٥٥٠ ألف', minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(550_000 * KWD);
  });
  it('"٦٠٠k" normalised to 600k', () => {
    const r = extractOffer({ text: '٦٠٠k', minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(600_000 * KWD);
  });
});

// ---------------------------------------------------------------------------
// Comma-grouped
// ---------------------------------------------------------------------------

describe('comma-grouped ("550,000")', () => {
  it.each([
    ['550,000', 550_000],
    ['1,200,000', 1_200_000],
    ['offer 550,000 KWD', 550_000],
  ])('"%s" → %d', (text, expected) => {
    const r = extractOffer({ text, minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(expected * KWD);
    expect(r?.strategy).toBe('comma_grouped');
  });
});

// ---------------------------------------------------------------------------
// Bare integer
// ---------------------------------------------------------------------------

describe('bare integer (fallback)', () => {
  it('"550" → 550_000 minor', () => {
    const r = extractOffer({ text: 'I offer 550', minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(550 * KWD);
    expect(r?.strategy).toBe('bare_integer');
  });
  it('"600 dinars" → 600_000', () => {
    const r = extractOffer({ text: '600 dinars', minorUnitsPerMajor: KWD });
    expect(r?.offerMinor).toBe(600 * KWD);
  });
});

// ---------------------------------------------------------------------------
// Currency-agnostic (AED)
// ---------------------------------------------------------------------------

describe('currency-agnostic minor-unit multiplier', () => {
  it('AED 550 → 55_000 fils-equivalent minor units', () => {
    const r = extractOffer({ text: 'AED 550', minorUnitsPerMajor: AED });
    // Bare 550 caught first — AED multiplier × 100
    expect(r?.offerMinor).toBe(550 * AED);
  });
});

// ---------------------------------------------------------------------------
// Negative tests — confusable shapes should NOT be offers
// ---------------------------------------------------------------------------

describe('should NOT extract', () => {
  it('empty string → null', () => {
    expect(extractOffer({ text: '', minorUnitsPerMajor: KWD })).toBeNull();
  });
  it('whitespace only → null', () => {
    expect(extractOffer({ text: '   \n  ', minorUnitsPerMajor: KWD })).toBeNull();
  });
  it('message with no digits → null', () => {
    expect(
      extractOffer({ text: 'is it still available?', minorUnitsPerMajor: KWD }),
    ).toBeNull();
  });
  it('2-digit bare number ("2 bedrooms") → null (below 3-digit bar)', () => {
    expect(
      extractOffer({ text: '2 bedrooms please', minorUnitsPerMajor: KWD }),
    ).toBeNull();
  });
  it('time reference "12:30" is skipped (colon prefix)', () => {
    expect(
      extractOffer({ text: 'meet at 12:30', minorUnitsPerMajor: KWD }),
    ).toBeNull();
  });
  it('url-style "/2024/05" is skipped (slash prefix)', () => {
    expect(
      extractOffer({ text: 'saw your listing /2024/05', minorUnitsPerMajor: KWD }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Strategy priority — more specific wins
// ---------------------------------------------------------------------------

describe('strategy priority', () => {
  it('"550k" matches k_suffix, not bare_integer', () => {
    const r = extractOffer({ text: '550k', minorUnitsPerMajor: KWD });
    expect(r?.strategy).toBe('k_suffix');
    expect(r?.offerMinor).toBe(550_000 * KWD);
  });
  it('"600 ألف" matches arabic_thousand, not bare_integer', () => {
    const r = extractOffer({ text: '600 ألف', minorUnitsPerMajor: KWD });
    expect(r?.strategy).toBe('arabic_thousand');
  });
  it('"550,000" matches comma_grouped, not bare_integer', () => {
    const r = extractOffer({ text: '550,000', minorUnitsPerMajor: KWD });
    expect(r?.strategy).toBe('comma_grouped');
  });
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

describe('audit fields', () => {
  it('returns matchedSpan for logging', () => {
    const r = extractOffer({
      text: 'my offer is 580 ألف please',
      minorUnitsPerMajor: KWD,
    });
    expect(r?.matchedSpan).toMatch(/580/);
  });
});
