import { describe, it, expect } from 'vitest';
import { listingDetailHref, listingDetailHrefFromParent } from './route';

/**
 * Detail-page routing tests.
 *
 * This helper is the source of truth for "where does a listing open".
 * Bugs here silently strand listings on `/` (home) — which was the
 * pre-2026-04-21 behaviour for 57 of 80 sub-categories. Pin the
 * invariants.
 */

// ---------------------------------------------------------------------------
// listingDetailHref — routes from a sub-cat slug
// ---------------------------------------------------------------------------

describe('listingDetailHref — automotive subs', () => {
  it.each([
    'used-cars',
    'new-cars',
    'classic-cars',
    'junk-cars',
    'wanted-cars',
    'motorcycles',
    'watercraft',
    'cmvs',
    'auto-spare-parts',
    'auto-accessories',
    'auto-services',
  ])('%s → /rides', slug => {
    expect(listingDetailHref('ar', 'demo-slug', slug)).toBe('/ar/rides/demo-slug');
    expect(listingDetailHref('en', 42, slug)).toBe('/en/rides/42');
  });
});

describe('listingDetailHref — real-estate subs', () => {
  it.each([
    'property-for-rent',
    'property-for-sale',
    'rooms-for-rent',
    'land',
    'property-for-exchange',
    'international-property',
    'property-management',
    'realestate-offices',
  ])('%s → /properties', slug => {
    expect(listingDetailHref('ar', 'demo', slug)).toBe('/ar/properties/demo');
  });
});

describe('listingDetailHref — electronics subs', () => {
  it.each([
    'phones-tablets',
    'laptops-computers',
    'tvs-audio',
    'gaming',
    'smart-watches',
    'cameras',
  ])('%s → /tech', slug => {
    expect(listingDetailHref('ar', 'demo', slug)).toBe('/ar/tech/demo');
    expect(listingDetailHref('en', 42, slug)).toBe('/en/tech/42');
  });
});

describe('listingDetailHref — everything else → generic /listings', () => {
  it.each([
    'womens-clothing',
    'mens-clothing',
    'home-appliances',
    'furniture',
    'art-collectibles',
    'jobs',
    'services',
    // Unknown sub-cat names should still route generically, not fall off.
    'made-up-slug-for-future-vertical',
  ])('%s → /listings', slug => {
    expect(listingDetailHref('ar', 'thing', slug)).toBe('/ar/listings/thing');
  });

  it('null categorySlug → /listings (defensive)', () => {
    expect(listingDetailHref('en', 99, null)).toBe('/en/listings/99');
  });
});

describe('listingDetailHref — never routes to the locale root (the old bug)', () => {
  // 2026-04-21 supply-loop audit: the previous fallback for non-vertical
  // sub-cats was '/${locale}/' — a literal orphan state. Lock it OUT.
  it.each([null, 'some-new-category', 'mobile-phones', 'furniture'])(
    'slug=%s never returns a bare locale root',
    slug => {
      const url = listingDetailHref('ar', 'x', slug as string | null);
      expect(url).not.toBe('/ar/');
      expect(url).not.toBe('/en/');
    },
  );
});

// ---------------------------------------------------------------------------
// listingDetailHrefFromParent — routes from the parent slug
// ---------------------------------------------------------------------------

describe('listingDetailHrefFromParent', () => {
  it('automotive parent → /rides', () => {
    expect(listingDetailHrefFromParent('ar', 'slug-1', 'automotive')).toBe(
      '/ar/rides/slug-1',
    );
  });
  it('real-estate parent → /properties', () => {
    expect(listingDetailHrefFromParent('en', 5, 'real-estate')).toBe(
      '/en/properties/5',
    );
  });
  it('electronics parent → /tech', () => {
    expect(listingDetailHrefFromParent('ar', 'iphone-15', 'electronics')).toBe(
      '/ar/tech/iphone-15',
    );
  });
  it('fashion parent → /listings', () => {
    expect(listingDetailHrefFromParent('ar', 'x', 'fashion')).toBe('/ar/listings/x');
  });
  it('null parent → /listings', () => {
    expect(listingDetailHrefFromParent('ar', 'x', null)).toBe('/ar/listings/x');
  });
  it('undefined parent → /listings', () => {
    expect(listingDetailHrefFromParent('ar', 'x', undefined)).toBe(
      '/ar/listings/x',
    );
  });
});

// ---------------------------------------------------------------------------
// Locale handling
// ---------------------------------------------------------------------------

describe('locale handling', () => {
  it('preserves ar prefix', () => {
    expect(listingDetailHref('ar', 'x', 'used-cars')).toMatch(/^\/ar\//);
  });
  it('preserves en prefix', () => {
    expect(listingDetailHref('en', 'x', 'used-cars')).toMatch(/^\/en\//);
  });
});
