import { describe, it, expect } from 'vitest';
import { buildSitemap } from './sitemap';
import type {
  SitemapListingEntry,
} from './sitemap-queries';

/**
 * Sitemap composer tests.
 *
 * Three failure modes the suite locks down:
 *   1. A listing emitted under the wrong vertical prefix
 *      (e.g. a property under /rides) → broken canonical URL,
 *      Google will index the 404'ing path.
 *   2. Missing AR ↔ EN alternates → loses hreflang signals,
 *      Google may rank the wrong locale for a Gulf-English query.
 *   3. Top-level static routes accidentally dropped → home, hubs, or
 *      categories index disappear from the index.
 *
 * Tests inject `loadListings` + `loadCategories` so they run pure
 * (no Supabase). Time pinned via `nowMs` for deterministic snapshots.
 */

const FIXED_NOW = Date.UTC(2024, 4, 1, 12, 0, 0); // 2024-05-01T12:00:00Z

function makeBuild(
  listings: SitemapListingEntry[],
  categories: Array<{ slug: string; updatedAt: string }>,
) {
  return buildSitemap({
    nowMs: FIXED_NOW,
    loadListings: async () => listings,
    loadCategories: async () => categories,
  });
}

// ---------------------------------------------------------------------------
// Static top-level routes
// ---------------------------------------------------------------------------

describe('static top-level routes', () => {
  it('always includes the home + key hub URLs in both locales', async () => {
    const entries = await makeBuild([], []);
    const urls = entries.map(e => e.url);

    for (const path of ['', '/categories', '/rides', '/properties', '/search', '/sell']) {
      for (const locale of ['ar', 'en'] as const) {
        const expected = `https://dealohub.com/${locale}${path}`;
        expect(urls).toContain(expected);
      }
    }
  });

  it('every static entry has both locale alternates + x-default', async () => {
    const entries = await makeBuild([], []);
    const home = entries.find(e => e.url === 'https://dealohub.com/ar');
    expect(home).toBeDefined();
    const langs = home!.alternates?.languages as Record<string, string>;
    expect(langs).toMatchObject({
      'ar-KW': 'https://dealohub.com/ar',
      'en-US': 'https://dealohub.com/en',
      'x-default': 'https://dealohub.com/en',
    });
  });

  it('home page has the highest priority (1.0)', async () => {
    const entries = await makeBuild([], []);
    const home = entries.find(e => e.url === 'https://dealohub.com/ar');
    expect(home?.priority).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

describe('per-category browse pages', () => {
  it('emits /categories/<slug> for every active parent (× 2 locales)', async () => {
    const entries = await makeBuild([], [
      { slug: 'electronics', updatedAt: '2024-01-01T00:00:00Z' },
      { slug: 'furniture', updatedAt: '2024-01-02T00:00:00Z' },
    ]);
    const urls = entries.map(e => e.url);
    expect(urls).toContain('https://dealohub.com/ar/categories/electronics');
    expect(urls).toContain('https://dealohub.com/en/categories/electronics');
    expect(urls).toContain('https://dealohub.com/ar/categories/furniture');
    expect(urls).toContain('https://dealohub.com/en/categories/furniture');
  });

  it('uses the category lastModified for category URLs', async () => {
    const entries = await makeBuild([], [
      { slug: 'electronics', updatedAt: '2024-01-15T00:00:00Z' },
    ]);
    const cat = entries.find(
      e => e.url === 'https://dealohub.com/ar/categories/electronics',
    );
    expect(cat?.lastModified).toBe('2024-01-15T00:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// Listings — vertical routing
// ---------------------------------------------------------------------------

describe('per-listing detail pages — vertical routing', () => {
  it('automotive parent → /rides URL', async () => {
    const entries = await makeBuild(
      [
        {
          slugOrId: 'bmw-m5-001',
          updatedAt: '2024-04-30T10:00:00Z',
          parentSlug: 'automotive',
        },
      ],
      [],
    );
    expect(entries.map(e => e.url)).toContain(
      'https://dealohub.com/ar/rides/bmw-m5-001',
    );
    expect(entries.map(e => e.url)).toContain(
      'https://dealohub.com/en/rides/bmw-m5-001',
    );
  });

  it('real-estate parent → /properties URL', async () => {
    const entries = await makeBuild(
      [
        {
          slugOrId: 'bayan-villa-18',
          updatedAt: '2024-04-30T10:00:00Z',
          parentSlug: 'real-estate',
        },
      ],
      [],
    );
    expect(entries.map(e => e.url)).toContain(
      'https://dealohub.com/ar/properties/bayan-villa-18',
    );
  });

  it('null parent (non-vertical) → /listings URL — never /', async () => {
    const entries = await makeBuild(
      [
        {
          slugOrId: 'iphone-15-blue',
          updatedAt: '2024-04-30T10:00:00Z',
          parentSlug: null,
        },
      ],
      [],
    );
    const urls = entries.map(e => e.url);
    expect(urls).toContain('https://dealohub.com/ar/listings/iphone-15-blue');
    expect(urls).toContain('https://dealohub.com/en/listings/iphone-15-blue');
    // The pre-Phase-5h orphan-to-/ bug must NEVER surface in sitemap either.
    expect(urls).not.toContain('https://dealohub.com/ar/');
    expect(urls).not.toContain('https://dealohub.com/en/');
    // Note: home root WITHOUT trailing slash is allowed — that's the
    // legitimate home URL emitted by static routes.
  });

  it('unknown parent slug routes generically → /listings', async () => {
    const entries = await makeBuild(
      [
        {
          slugOrId: 'thing-99',
          updatedAt: '2024-04-30T10:00:00Z',
          parentSlug: 'unknown-future-vertical',
        },
      ],
      [],
    );
    expect(entries.map(e => e.url)).toContain(
      'https://dealohub.com/ar/listings/thing-99',
    );
  });
});

// ---------------------------------------------------------------------------
// Listings — alternates
// ---------------------------------------------------------------------------

describe('listing language alternates', () => {
  it('each listing entry pairs AR ↔ EN via hreflang alternates', async () => {
    const entries = await makeBuild(
      [
        {
          slugOrId: 'bmw-m5-001',
          updatedAt: '2024-04-30T10:00:00Z',
          parentSlug: 'automotive',
        },
      ],
      [],
    );
    const arEntry = entries.find(
      e => e.url === 'https://dealohub.com/ar/rides/bmw-m5-001',
    );
    expect(arEntry?.alternates?.languages).toMatchObject({
      'ar-KW': 'https://dealohub.com/ar/rides/bmw-m5-001',
      'en-US': 'https://dealohub.com/en/rides/bmw-m5-001',
      'x-default': 'https://dealohub.com/en/rides/bmw-m5-001',
    });
  });
});

// ---------------------------------------------------------------------------
// Aggregate shape sanity
// ---------------------------------------------------------------------------

describe('aggregate sanity', () => {
  it('returns 12 static entries (6 routes × 2 locales) when no listings/categories', async () => {
    const entries = await makeBuild([], []);
    expect(entries).toHaveLength(12);
  });

  it('grows by (categories × 2) + (listings × 2)', async () => {
    const entries = await makeBuild(
      [
        { slugOrId: 'a', updatedAt: '2024-04-30T10:00:00Z', parentSlug: 'automotive' },
        { slugOrId: 'b', updatedAt: '2024-04-30T10:00:00Z', parentSlug: 'real-estate' },
      ],
      [
        { slug: 'electronics', updatedAt: '2024-01-01T00:00:00Z' },
        { slug: 'furniture', updatedAt: '2024-01-01T00:00:00Z' },
      ],
    );
    expect(entries).toHaveLength(12 + 4 + 4); // 20
  });

  it('every URL is absolute (starts with https://)', async () => {
    const entries = await makeBuild(
      [{ slugOrId: 'x', updatedAt: '2024-01-01T00:00:00Z', parentSlug: null }],
      [{ slug: 'electronics', updatedAt: '2024-01-01T00:00:00Z' }],
    );
    for (const e of entries) {
      expect(e.url).toMatch(/^https:\/\//);
    }
  });
});
