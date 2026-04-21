import { describe, it, expect } from 'vitest';
import { runSafetyPipeline } from './safety';

/**
 * Safety pipeline tests — the final gate before an AI draft is sent.
 *
 * Reuses the already-tested filter primitives (67 tests in
 * listings/validators.test.ts + 31 in floor-leak.test.ts), so this
 * suite focuses on the ORCHESTRATION:
 *   - Multiple filters run in series
 *   - Every violation is reported (not just the first)
 *   - Clean drafts pass
 *   - Per-filter toggles respected (counterfeit only for luxury)
 *   - allowFloorMatch bypass works
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KWD_650K = 650_000_000;
const KWD_600K = 600_000_000;

const baseInput = {
  floorMinor: KWD_600K,
  listPriceMinor: KWD_650K,
  currency: 'KWD' as const,
};

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('clean drafts pass', () => {
  it('polite Arabic draft with no issues → safe', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'السلام عليكم، شكراً على عرضك. أقدر أنزل للسعر 640,000 د.ك.',
    });
    expect(r.safe).toBe(true);
    if (r.safe) expect(r.filterActions).toEqual([]);
  });

  it('English draft mentioning list price only → safe', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'Thanks for your interest. The listed price is KWD 650,000.',
    });
    expect(r.safe).toBe(true);
  });

  it('draft with no floor set (floor=0) skips floor-leak → safe', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      floorMinor: 0,
      draftText: 'السعر 600,000 د.ك. آخر سعر',
    });
    expect(r.safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Single-filter violations
// ---------------------------------------------------------------------------

describe('single-filter violations', () => {
  it('Filter A — phone number → blocked', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'تواصل معي على 99887766 مباشرة.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.violations.map(v => v.filter)).toContain('phone');
    }
  });

  it('Filter C — discriminatory wording → blocked', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'The villa is available. Arabs only please.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.violations.map(v => v.filter)).toContain('discriminatory');
    }
  });

  it('Floor-leak → blocked with detected values', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'آخر سعر 600,000 د.ك.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      const leak = r.violations.find(v => v.filter === 'floor_leak');
      expect(leak).toBeDefined();
      if (leak && leak.filter === 'floor_leak') {
        expect(leak.detectedMinorUnits.length).toBeGreaterThan(0);
      }
    }
  });

  it('Filter B disabled by default → counterfeit text does NOT block', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'The bag is NOT a replica, it is genuine leather.',
    });
    // Even though "replica" fires Filter B, enforceCounterfeitFilter
    // defaults false, so it's ignored.
    expect(r.safe).toBe(true);
  });

  it('Filter B enabled (luxury) → counterfeit term blocks', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'This is a first copy — original is too expensive.',
      enforceCounterfeitFilter: true,
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.violations.map(v => v.filter)).toContain('counterfeit');
    }
  });
});

// ---------------------------------------------------------------------------
// Multi-filter violations — full picture for audit
// ---------------------------------------------------------------------------

describe('multi-filter violations reported together', () => {
  it('draft with phone + floor-leak → both reported', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'آخر سعر 600,000. اتصل على 99887766.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      const filters = r.violations.map(v => v.filter);
      expect(filters).toContain('phone');
      expect(filters).toContain('floor_leak');
    }
  });

  it('draft with phone + discriminatory → both reported', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'Arabs only. Call 99887766.',
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.violations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('filterActions mirrors violations (audit-log feed)', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'آخر سعر 600,000. اتصل 99887766.',
    });
    if (!r.safe) {
      expect(r.filterActions).toEqual(r.violations);
    }
  });
});

// ---------------------------------------------------------------------------
// allowFloorMatch bypass for final_offer
// ---------------------------------------------------------------------------

describe('allowFloorMatch bypass', () => {
  it('final_offer legitimate floor reference → safe with bypass', () => {
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'هذا آخر سعر — 600,000 د.ك.',
      allowFloorMatch: true,
    });
    expect(r.safe).toBe(true);
  });

  it('bypass does NOT disable other filters', () => {
    // Even if we're doing a final_offer, a phone still gets blocked.
    const r = runSafetyPipeline({
      ...baseInput,
      draftText: 'هذا آخر سعر — 600,000. اتصل 99887766.',
      allowFloorMatch: true,
    });
    expect(r.safe).toBe(false);
    if (!r.safe) {
      expect(r.violations.map(v => v.filter)).toContain('phone');
      expect(r.violations.map(v => v.filter)).not.toContain('floor_leak');
    }
  });
});

// ---------------------------------------------------------------------------
// Currency routing
// ---------------------------------------------------------------------------

describe('currency handling', () => {
  it('SAR floor handled correctly (2 decimals)', () => {
    const r = runSafetyPipeline({
      floorMinor: 60_000_000, // SAR 600,000 in halalas
      listPriceMinor: 65_000_000,
      currency: 'SAR',
      draftText: 'السعر 600,000 ريال',
    });
    expect(r.safe).toBe(false);
  });

  it('AED floor handled', () => {
    const r = runSafetyPipeline({
      floorMinor: 60_000_000, // AED 600,000 in fils
      listPriceMinor: 65_000_000,
      currency: 'AED',
      draftText: 'Final AED 600,000.',
    });
    expect(r.safe).toBe(false);
  });
});
