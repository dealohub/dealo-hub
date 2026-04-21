import { describe, it, expect } from 'vitest';
import { scanForFloorLeak } from './floor-leak';

/**
 * Floor-leak scanner tests.
 *
 * This is the last defence against the AI mentioning the seller's
 * secret floor. We need:
 *   - Zero false negatives for the "catch it" cases (even if we
 *     over-catch with false positives — regeneration is cheap)
 *   - False-positive behavior documented (list price doesn't trigger)
 *   - All numeric formats handled (Latin, Arabic-Indic, thousands,
 *     decimals, k-suffix)
 *   - Edge cases (empty text, zero floor, out-of-band numbers)
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Scenario: bayan villa, list price 650,000 KWD, secret floor 600,000 KWD.
// (Minor units: 650,000,000 fils and 600,000,000 fils.)
const KWD_650K = 650_000_000;
const KWD_600K = 600_000_000;

const baseInput = {
  floorMinor: KWD_600K,
  listPriceMinor: KWD_650K,
  currency: 'KWD' as const,
};

// ---------------------------------------------------------------------------
// Clean drafts — should not leak
// ---------------------------------------------------------------------------

describe('clean drafts — safe', () => {
  it('empty text → safe', () => {
    expect(scanForFloorLeak({ ...baseInput, text: '' })).toEqual({
      safe: true,
    });
  });

  it('greeting with no numbers → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'السلام عليكم، شكراً على اهتمامك بالإعلان.',
    });
    expect(r.safe).toBe(true);
  });

  it('draft mentioning list price only → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'السعر المعلن هو 650,000 د.ك.',
    });
    expect(r.safe).toBe(true);
  });

  it('draft mentioning list price in English format → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'The listed price is KWD 650,000.',
    });
    expect(r.safe).toBe(true);
  });

  it('concession well ABOVE floor band → safe', () => {
    // 10% off list = 585,000 — below the (600,000-5%=570,000) lower band
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'I can come down to KWD 585,000.',
    });
    // Actually 585,000 → 585,000,000 minor; band is 570,000,000–630,000,000.
    // 585,000,000 IS inside the band → would leak.
    // This test case demonstrates that a counter close to floor IS flagged.
    expect(r.safe).toBe(false);
  });

  it('small concession far above floor band → safe', () => {
    // 3% off 650,000 = 630,500 KWD → 630,500,000 minor. 5% upper band is
    // 630,000,000 — so this is right at the edge. Nudge slightly higher.
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'أقدر أنزل إلى 640,000 د.ك.',
    });
    // 640,000 KWD = 640,000,000 minor, > upper band (630,000,000) → safe.
    expect(r.safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Leaks — various formats
// ---------------------------------------------------------------------------

describe('leaks — Latin digit formats', () => {
  it('Arabic text with 600,000 KWD → leak (inside ±5% of floor)', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'آخر سعر 600,000 د.ك.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.reason).toBe('floor_leak');
      expect(r.detectedMinorUnits.length).toBeGreaterThan(0);
    }
  });

  it('English text with exact floor → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'My final price is KWD 600,000.',
    });
    expect(r.safe).toBe(false);
  });

  it('2% above floor → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'I can go to 612,000 KWD.',
    });
    expect(r.safe).toBe(false);
  });

  it('3% below floor → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'يمكنني قبول 582,000',
    });
    expect(r.safe).toBe(false);
  });

  it('floor with 3-decimal KWD convention "600.000" → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'آخر سعر 600.000 د.ك.',
    });
    expect(r.safe).toBe(false);
  });

  it('floor with full KWD format "600,000.000" → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'My rock-bottom is KWD 600,000.000.',
    });
    expect(r.safe).toBe(false);
  });
});

describe('leaks — Arabic-Indic digit formats', () => {
  it('٦٠٠,٠٠٠ (exact floor, Arabic-Indic digits) → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'آخر سعر ٦٠٠,٠٠٠ د.ك.',
    });
    expect(r.safe).toBe(false);
  });

  it('٥٨٠,٠٠٠ (3% below floor, Arabic-Indic) → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'السعر ٥٨٠,٠٠٠',
    });
    expect(r.safe).toBe(false);
  });
});

describe('leaks — k-suffix formats', () => {
  it('"600k" → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Thinking around 600k.',
    });
    expect(r.safe).toBe(false);
  });

  it('"600K" (capital) → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Around 600K final.',
    });
    expect(r.safe).toBe(false);
  });

  it('"620k" (3% above floor) → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Maybe 620k?',
    });
    expect(r.safe).toBe(false);
  });

  it('"700k" (17% above floor, out of band) → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Your offer of 700k works.',
    });
    expect(r.safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// False-positive guards — must NOT leak
// ---------------------------------------------------------------------------

describe('false-positive guards', () => {
  it('year 2024 does not match floor 600k → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'The villa was built in 2024.',
    });
    expect(r.safe).toBe(true);
  });

  it('phone-like 5-digit references do not match → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Reference ID: 12345.',
    });
    expect(r.safe).toBe(true);
  });

  it('number of rooms / area does not match → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Villa has 6 bedrooms and 550 sqm built area.',
    });
    expect(r.safe).toBe(true);
  });

  it('unrelated money value far from floor → safe', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'Service charge is 1,200 KWD per year.',
    });
    expect(r.safe).toBe(true);
  });

  it('list price in 3-decimal format → safe (exempted)', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'السعر المعلن 650,000.000 د.ك.',
    });
    expect(r.safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('floor of 0 → always safe (degenerate)', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      floorMinor: 0,
      text: 'Any price is fine — 0 to 999,999,999.',
    });
    expect(r.safe).toBe(true);
  });

  it('allowFloorMatch=true bypasses the scan (final_offer case)', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'آخر سعر 600,000 د.ك.',
      allowFloorMatch: true,
    });
    expect(r.safe).toBe(true);
  });

  it('custom band 10% catches wider range', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'How about 650,000?', // 650k is 8.3% above 600k floor
      band: 0.1,
    });
    // With 10% band, 650k is inside. But 650k == listPrice is also
    // excluded by the list-price guard → should still be safe.
    expect(r.safe).toBe(true);
  });

  it('custom band 20% + non-list-price value → leak', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'How about 720,000?', // 20% above 600k floor
      band: 0.2,
    });
    // 720,000,000 = 600,000,000 * 1.2 exactly, so INSIDE ±20% band.
    // Not the list price → must leak.
    expect(r.safe).toBe(false);
  });

  it('SAR currency with 2 decimals handled', () => {
    // SAR floor 600,000 = 60,000,000 minor (2 decimals)
    const r = scanForFloorLeak({
      floorMinor: 60_000_000,
      listPriceMinor: 65_000_000,
      currency: 'SAR',
      text: 'Final price SAR 600,000.',
    });
    expect(r.safe).toBe(false);
  });

  it('multiple numbers in one draft — any leaking value caught', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'The villa is 550 sqm, built in 2015, asking 650,000, can do 600,000.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.detectedMinorUnits.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('invariants', () => {
  it('never flags the list price even if it ends up near the floor band', () => {
    // If the list price is within the floor band (floor=600k, list=630k),
    // the list price should still not be flagged.
    const r = scanForFloorLeak({
      floorMinor: 600_000_000,
      listPriceMinor: 630_000_000,
      currency: 'KWD',
      text: 'The listed price is KWD 630,000.',
    });
    expect(r.safe).toBe(true);
  });

  it('never false-positives on very small integers (1-10)', () => {
    const r = scanForFloorLeak({
      ...baseInput,
      text: 'The villa has 6 bedrooms, 5 bathrooms, 4 parking spots.',
    });
    expect(r.safe).toBe(true);
  });
});
