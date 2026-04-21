/**
 * Listing → detail-page URL resolver.
 *
 * Central mapping from (category slug, listing id/slug) → the correct
 * detail-page route. Three destinations today:
 *
 *   • automotive subs        → /rides/[id]
 *   • real-estate subs       → /properties/[id]
 *   • everything else        → /listings/[id]   (generic detail page)
 *
 * The previous behaviour ("return `/{locale}/`" for non-vertical
 * categories) silently orphaned 57 of 80 sub-categories — buyers could
 * never open the listing, and sellers couldn't share a link after
 * publish. The generic fallback closes that gap.
 *
 * Pure function. No I/O. Used by:
 *   • publishListing() — the post-insert redirect target.
 *   • SearchResultCard — href computation for hit cards.
 *   • Future consumers (notifications, share-link builders) can
 *     import from here to stay consistent.
 */

const AUTOMOTIVE_SUBS = new Set([
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
]);

const REAL_ESTATE_SUBS = new Set([
  'property-for-rent',
  'property-for-sale',
  'rooms-for-rent',
  'land',
  'property-for-exchange',
  'international-property',
  'property-management',
  'realestate-offices',
]);

/**
 * Build the detail-page URL for a listing.
 *
 * @param locale        App locale prefix.
 * @param slugOrId      Stable identifier — slug preferred, id as fallback.
 * @param categorySlug  Sub-category slug (e.g. `used-cars`,
 *                      `property-for-rent`, `womens-clothing`, …).
 *                      Null → routes to the generic page.
 */
export function listingDetailHref(
  locale: 'ar' | 'en',
  slugOrId: string | number,
  categorySlug: string | null,
): string {
  if (categorySlug && AUTOMOTIVE_SUBS.has(categorySlug)) {
    return `/${locale}/rides/${slugOrId}`;
  }
  if (categorySlug && REAL_ESTATE_SUBS.has(categorySlug)) {
    return `/${locale}/properties/${slugOrId}`;
  }
  return `/${locale}/listings/${slugOrId}`;
}

/**
 * Parent-slug → detail-page prefix. Used by publishListing, which has
 * already resolved the parent while looking up the category row.
 * Passing the parent directly skips the sub-cat `Set.has()` lookup.
 */
export function listingDetailHrefFromParent(
  locale: 'ar' | 'en',
  slugOrId: string | number,
  parentSlug: string | null | undefined,
): string {
  if (parentSlug === 'automotive') return `/${locale}/rides/${slugOrId}`;
  if (parentSlug === 'real-estate') return `/${locale}/properties/${slugOrId}`;
  return `/${locale}/listings/${slugOrId}`;
}
