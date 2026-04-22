import { describe, it, expect } from 'vitest';
import { verticalPathForFeedCat } from './types';

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
