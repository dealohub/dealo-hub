import { describe, it, expect } from 'vitest';
import { verticalFromParentSlug, listingDetailPath } from './types';

/**
 * Tests for chat type helpers — particularly the parent-slug mapping
 * that was at the heart of the "nothing works" bug (see Phase 5e
 * post-mortem). A regression here would break the inbox vertical
 * routing again.
 */

describe('verticalFromParentSlug', () => {
  it('maps automotive → rides', () => {
    expect(verticalFromParentSlug('automotive')).toBe('rides');
  });

  it('maps real-estate → properties', () => {
    expect(verticalFromParentSlug('real-estate')).toBe('properties');
  });

  it.each([null, undefined, '', 'electronics', 'jobs-careers'])(
    '%s → other (safe fallback)',
    slug => {
      expect(verticalFromParentSlug(slug)).toBe('other');
    },
  );
});

describe('listingDetailPath', () => {
  const makeListing = (vertical: 'rides' | 'properties' | 'other', slug: string) => ({
    id: 1,
    slug,
    title: 'x',
    cover: null,
    priceMinorUnits: 0,
    currencyCode: 'KWD' as const,
    vertical,
  });

  it('rides listing → /[locale]/rides/[slug]', () => {
    expect(listingDetailPath('ar', makeListing('rides', 'bmw-m5-7'))).toBe(
      '/ar/rides/bmw-m5-7',
    );
  });

  it('properties listing → /[locale]/properties/[slug]', () => {
    expect(listingDetailPath('ar', makeListing('properties', 'bayan-18'))).toBe(
      '/ar/properties/bayan-18',
    );
  });

  it('unknown vertical falls back to locale root', () => {
    expect(listingDetailPath('ar', makeListing('other', 'x'))).toBe('/ar/');
  });

  it('respects English locale', () => {
    expect(listingDetailPath('en', makeListing('rides', 'bmw-m5-7'))).toBe(
      '/en/rides/bmw-m5-7',
    );
  });
});
