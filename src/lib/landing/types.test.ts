import { describe, it, expect } from 'vitest';
import { verticalPathForFeedCat, pickBalancedHero } from './types';
import type { FeedListing } from './types';

/**
 * Tests for verticalPathForFeedCat — the helper that routes a feed
 * listing to its correct vertical detail page. Introduced in Phase 5f
 * after hero scatters were wrongly all pointing at /rides regardless
 * of vertical. A regression here would re-break that — hence the
 * lock-down.
 */
describe('verticalPathForFeedCat', () => {
  it('routes cars to /rides', () => {
    expect(verticalPathForFeedCat('ar', 'cars', 'bmw-m5-7')).toBe(
      '/ar/rides/bmw-m5-7',
    );
  });

  it('routes property to /properties (note: cat key is singular)', () => {
    expect(verticalPathForFeedCat('ar', 'property', 'bayan-villa-18')).toBe(
      '/ar/properties/bayan-villa-18',
    );
  });

  it('routes tech to /tech (Phase 7 v2)', () => {
    expect(verticalPathForFeedCat('ar', 'tech', 'iphone-99')).toBe(
      '/ar/tech/iphone-99',
    );
    expect(verticalPathForFeedCat('en', 'tech', 'iphone-99')).toBe(
      '/en/tech/iphone-99',
    );
  });

  it('routes unknown categories to locale root (safe fallback)', () => {
    expect(verticalPathForFeedCat('ar', 'jobs', 'barista-12')).toBe('/ar/');
  });

  it('respects the English locale', () => {
    expect(verticalPathForFeedCat('en', 'cars', 'bmw-m5-7')).toBe(
      '/en/rides/bmw-m5-7',
    );
    expect(verticalPathForFeedCat('en', 'property', 'bayan-villa-18')).toBe(
      '/en/properties/bayan-villa-18',
    );
  });

  it('never returns a path with double slashes even on edge slugs', () => {
    expect(verticalPathForFeedCat('ar', 'cars', 'x')).toBe('/ar/rides/x');
  });
});

/**
 * Tests for pickBalancedHero — the hero-scatter bucket balancer.
 *
 * Introduced on 2026-04-22 after Phase 7 v2 Electronics seed landings
 * all sorted newer than every car + property seed, letting tech sweep
 * every slot of `feed.slice(0, 6)` on the Landing hero. Locking the
 * round-robin semantics here so a future seed-date skew can't reintroduce
 * the all-one-vertical regression.
 *
 * Pure function — no I/O, no side effects.
 */

function mkFeedItem(
  id: number,
  cat: FeedListing['cat'],
  ts = id,
): FeedListing {
  return {
    kind: 'listing',
    id,
    slug: `slug-${id}`,
    cat,
    title: `t-${id}`,
    price: '100',
    loc: '',
    dealer: '',
    image: `i-${id}`,
    ts,
  };
}

describe('pickBalancedHero', () => {
  it('round-robins across buckets when all verticals have items', () => {
    // Bucket precedence: cars, property, tech, jobs.
    const feed: FeedListing[] = [
      mkFeedItem(1, 'cars'),
      mkFeedItem(2, 'cars'),
      mkFeedItem(3, 'property'),
      mkFeedItem(4, 'property'),
      mkFeedItem(5, 'tech'),
      mkFeedItem(6, 'tech'),
      mkFeedItem(7, 'cars'),
      mkFeedItem(8, 'property'),
      mkFeedItem(9, 'tech'),
    ];
    const picks = pickBalancedHero(feed, 6).map((x) => x.id);
    // Round 1: cars=1, property=3, tech=5  |  Round 2: cars=2, property=4, tech=6
    expect(picks).toEqual([1, 3, 5, 2, 4, 6]);
  });

  it('preserves newest-first within each bucket', () => {
    const feed: FeedListing[] = [
      mkFeedItem(10, 'cars'),
      mkFeedItem(11, 'cars'),
      mkFeedItem(12, 'property'),
      mkFeedItem(13, 'cars'),
    ];
    const picks = pickBalancedHero(feed, 3).map((x) => x.id);
    // Round 1: cars=10, property=12  |  Round 2: cars=11
    expect(picks).toEqual([10, 12, 11]);
  });

  it('falls back to single-bucket newest-first when only one vertical has items', () => {
    const feed: FeedListing[] = [
      mkFeedItem(1, 'tech'),
      mkFeedItem(2, 'tech'),
      mkFeedItem(3, 'tech'),
      mkFeedItem(4, 'tech'),
    ];
    expect(pickBalancedHero(feed, 3).map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it('skips empty buckets without stalling', () => {
    const feed: FeedListing[] = [
      mkFeedItem(1, 'cars'),
      mkFeedItem(2, 'tech'), // property bucket empty
      mkFeedItem(3, 'cars'),
      mkFeedItem(4, 'tech'),
    ];
    expect(pickBalancedHero(feed, 4).map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it('returns fewer than n when pool is small', () => {
    const feed: FeedListing[] = [
      mkFeedItem(1, 'cars'),
      mkFeedItem(2, 'property'),
    ];
    expect(pickBalancedHero(feed, 6)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(pickBalancedHero([], 6)).toEqual([]);
  });

  it('returns empty array when n <= 0', () => {
    const feed: FeedListing[] = [
      mkFeedItem(1, 'cars'),
      mkFeedItem(2, 'property'),
    ];
    expect(pickBalancedHero(feed, 0)).toEqual([]);
    expect(pickBalancedHero(feed, -1)).toEqual([]);
  });

  it('caps a dominant vertical — the exact 2026-04-22 regression it prevents', () => {
    // 8 electronics newer than everything else, plus 2 older cars + 2 older properties.
    const feed: FeedListing[] = [
      ...Array.from({ length: 8 }, (_, i) =>
        mkFeedItem(i + 1, 'tech', 100 - i),
      ),
      mkFeedItem(10, 'cars', 50),
      mkFeedItem(11, 'cars', 49),
      mkFeedItem(12, 'property', 40),
      mkFeedItem(13, 'property', 39),
    ];
    const picks = pickBalancedHero(feed, 6);
    const buckets = new Set(picks.map((p) => p.cat));
    expect(buckets.has('cars')).toBe(true);
    expect(buckets.has('property')).toBe(true);
    expect(buckets.has('tech')).toBe(true);
    // Tech capped at 2 slots (ceil(6/3) since all 3 buckets present).
    expect(picks.filter((p) => p.cat === 'tech')).toHaveLength(2);
  });
});
