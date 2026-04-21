import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  fromMinorUnits,
  formatPrice,
  formatPriceNumber,
  formatCount,
  formatCompact,
  formatPercent,
  CURRENCY_DECIMALS,
} from './format';

/**
 * Format tests.
 *
 * These utilities print prices, counts, and dates everywhere in the
 * app — every listing card, detail panel, inbox row. A silent regression
 * here (e.g. Arabic-Indic digits leaking past `numberingSystem: 'latn'`)
 * would immediately violate DECISIONS.md (Gulf users read Western digits).
 */

// ---------------------------------------------------------------------------
// minor-units math — BIGINT-safe rounding
// ---------------------------------------------------------------------------

describe('toMinorUnits', () => {
  it('KWD has 3 decimals: 125.5 → 125500n', () => {
    expect(toMinorUnits(125.5, 'KWD')).toBe(125500n);
  });

  it('AED has 2 decimals: 38.5 → 3850n', () => {
    expect(toMinorUnits(38.5, 'AED')).toBe(3850n);
  });

  it('BHD/OMR also 3 decimals', () => {
    expect(toMinorUnits(1.234, 'BHD')).toBe(1234n);
    expect(toMinorUnits(1.234, 'OMR')).toBe(1234n);
  });

  it('unknown currency falls back to 2 decimals', () => {
    expect(toMinorUnits(10, 'XYZ')).toBe(1000n);
  });

  it('handles zero', () => {
    expect(toMinorUnits(0, 'KWD')).toBe(0n);
  });

  it('rounds fractional minor unit (floating point safety)', () => {
    // 0.1 + 0.2 === 0.30000000000000004 — rounding must be sane
    expect(toMinorUnits(0.1 + 0.2, 'KWD')).toBe(300n);
  });
});

describe('fromMinorUnits', () => {
  it('125500n KWD → 125.5', () => {
    expect(fromMinorUnits(125500n, 'KWD')).toBe(125.5);
  });

  it('accepts number input (not just bigint)', () => {
    expect(fromMinorUnits(3850, 'AED')).toBe(38.5);
  });

  it('round-trip works', () => {
    expect(fromMinorUnits(toMinorUnits(650000, 'KWD'), 'KWD')).toBe(650000);
  });
});

// ---------------------------------------------------------------------------
// formatPrice — locale + currency rendering
// ---------------------------------------------------------------------------

describe('formatPrice', () => {
  it('KWD en uses Western digits + 3 decimals', () => {
    const out = formatPrice(650_000_000n, 'KWD', 'en');
    // English locale: "KWD 650,000.000" (allow NBSP or regular space)
    expect(out).toMatch(/650[,،]000\.000/);
    expect(out).toMatch(/KWD/i);
  });

  it('KWD ar keeps Western digits (per Gulf convention)', () => {
    const out = formatPrice(650_000_000n, 'KWD', 'ar');
    // Arabic locale must NOT use Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
    expect(out).not.toMatch(/[٠-٩]/);
    expect(out).toMatch(/650/);
    expect(out).toMatch(/000/);
  });

  it('AED uses 2 decimals', () => {
    const out = formatPrice(3850n, 'AED', 'en');
    expect(out).toMatch(/38\.50/);
    expect(out).not.toMatch(/38\.500/); // NOT 3 decimals
  });

  it('handles zero minor units', () => {
    const out = formatPrice(0n, 'KWD', 'en');
    expect(out).toMatch(/0\.000/);
  });
});

// ---------------------------------------------------------------------------
// formatPriceNumber — no currency symbol
// ---------------------------------------------------------------------------

describe('formatPriceNumber', () => {
  it('omits currency symbol but keeps decimals', () => {
    const out = formatPriceNumber(125500n, 'KWD', 'en');
    expect(out).toMatch(/125\.500/);
    expect(out).not.toMatch(/KWD/i);
    expect(out).not.toMatch(/د\.ك/);
  });

  it('Arabic keeps Western digits', () => {
    const out = formatPriceNumber(125500n, 'KWD', 'ar');
    expect(out).not.toMatch(/[٠-٩]/);
  });
});

// ---------------------------------------------------------------------------
// formatCount / formatCompact / formatPercent
// ---------------------------------------------------------------------------

describe('formatCount', () => {
  it('thousand separator in en', () => {
    const out = formatCount(12847, 'en');
    expect(out).toMatch(/12,847/);
  });

  it('Arabic uses Western digits', () => {
    const out = formatCount(12847, 'ar');
    expect(out).not.toMatch(/[٠-٩]/);
    expect(out).toMatch(/12/);
    expect(out).toMatch(/847/);
  });
});

describe('formatCompact', () => {
  it('1200 → 1.2K (en)', () => {
    const out = formatCompact(1200, 'en');
    // Intl compact notation: "1.2K" (or similar — allow locale variants)
    expect(out.toUpperCase()).toMatch(/1\.2/);
  });

  it('1_500_000 → 1.5M in en', () => {
    const out = formatCompact(1_500_000, 'en');
    expect(out.toUpperCase()).toMatch(/1\.5/);
    expect(out.toUpperCase()).toMatch(/M/);
  });
});

describe('formatPercent', () => {
  it('0.12 → 12% in en', () => {
    expect(formatPercent(0.12, 'en')).toMatch(/12/);
  });

  it('decimals parameter respected', () => {
    const out = formatPercent(0.1234, 'en', 2);
    expect(out).toMatch(/12\.34/);
  });

  it('Arabic keeps Western digits', () => {
    const out = formatPercent(0.12, 'ar');
    expect(out).not.toMatch(/[٠-٩]/);
  });
});

// ---------------------------------------------------------------------------
// CURRENCY_DECIMALS invariants — regression guard
// ---------------------------------------------------------------------------

describe('CURRENCY_DECIMALS invariants', () => {
  it('Kuwait/Bahrain/Oman dinar/rial are 3-decimal', () => {
    expect(CURRENCY_DECIMALS.KWD).toBe(3);
    expect(CURRENCY_DECIMALS.BHD).toBe(3);
    expect(CURRENCY_DECIMALS.OMR).toBe(3);
  });
  it('AED/SAR/QAR are 2-decimal', () => {
    expect(CURRENCY_DECIMALS.AED).toBe(2);
    expect(CURRENCY_DECIMALS.SAR).toBe(2);
    expect(CURRENCY_DECIMALS.QAR).toBe(2);
  });
});
