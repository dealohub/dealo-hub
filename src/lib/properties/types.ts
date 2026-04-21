import type { PropertyFields } from './validators';

/**
 * App-facing types for the Properties vertical.
 *
 * Conventions mirror src/lib/rides/types.ts:
 *   - camelCase throughout (DB rows stay in src/types/database.ts)
 *   - No phone_e164 or email on public shapes (DECISIONS.md #2 —
 *     chat-only contact)
 *   - Nullable where the DB is nullable; Zod narrows on parse
 *
 * Architecture note: PropertyFields (the JSONB shape) lives in
 * validators.ts so the Zod source of truth is co-located with the
 * schema. This file imports the parsed (camelCase) type for use in
 * PropertyDetail + PropertyCard.
 */

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

/** One of the 8 sub-cats inserted by migration 0025. */
export type PropertyCategoryKey =
  | 'property-for-rent'
  | 'property-for-sale'
  | 'rooms-for-rent'
  | 'land'
  | 'property-for-exchange'
  | 'international-property'
  | 'property-management'
  | 'realestate-offices';

/** Listing purpose derived from sub-cat. Three public values. */
export type ListingPurpose = 'rent' | 'sale' | 'exchange';

export function purposeFromSubCat(
  subCat: PropertyCategoryKey,
): ListingPurpose {
  if (subCat === 'property-for-rent' || subCat === 'rooms-for-rent') return 'rent';
  if (subCat === 'property-for-exchange') return 'exchange';
  return 'sale'; // for-sale, land, international, management, offices
}

// ---------------------------------------------------------------------------
// Verification (Doctrine pillars P1 + P6)
// ---------------------------------------------------------------------------

/** Trust tier displayed as a badge on cards + detail pages. */
export type VerificationTier = 'unverified' | 'ai_verified' | 'dealo_inspected';

/** How the tier was awarded — rendered as a short label next to the badge. */
export type VerificationMethod = 'ai' | 'human' | 'inspection';

// ---------------------------------------------------------------------------
// Image categories
// ---------------------------------------------------------------------------

/**
 * Unified image category enum. First 5 values come from the automotive
 * vertical (Phase 3); the remaining 8 are added for Properties. All
 * values live as plain text in `listing_images.category` — no Postgres
 * enum fork (migration 0026 leaves the column as text).
 */
export type PropertyImageCategory =
  | 'building_exterior'
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'floor_plan'
  | 'view'
  | 'diwaniya_room'
  // Shared with automotive (not typically used by properties but legal):
  | 'exterior'
  | 'interior'
  | 'details';

export interface PropertyImage {
  url: string;
  position: number;
  category: PropertyImageCategory | null;
  altText: string | null;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// PropertyDetail — full shape for /properties/[slug] (Phase 4b)
// ---------------------------------------------------------------------------

export interface PropertyDetail {
  // Core
  id: number;
  slug: string;

  // Taxonomy
  subCat: PropertyCategoryKey;
  listingPurpose: ListingPurpose;

  // Bilingual text (nullable — UI falls back to the legacy `title` field
  // via the PropertyCard wrapper when the corresponding locale is null)
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;

  // Legacy/fallback (always populated, preserves backward compat)
  title: string;
  description: string;

  // Commercial
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  oldPriceMinorUnits: number | null;
  isPriceNegotiable: boolean;

  // Verification (P1 + P6)
  verificationTier: VerificationTier;
  verifiedAt: string | null;
  verifiedBy: VerificationMethod | null;

  // Flags
  isFeatured: boolean;
  isHot: boolean;

  // JSONB body — Zod-parsed, camelCase
  fields: PropertyFields;

  // Seller (mini-card)
  seller: {
    id: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
    isDealer: boolean;
    dealerName: string | null;
    dealerVerifiedAt: string | null;
    ratingAvg: number | null;
    ratingCount: number | null;
    createdAt: string;
  };

  // Location
  cityId: number;
  cityName: string; // locale-aware — picked from name_ar or name_en at query time
  areaId: number | null;
  areaName: string | null;

  // Images
  images: PropertyImage[];

  // Counters
  viewCount: number;
  saveCount: number;
  chatInitiationCount: number;

  // Lifecycle
  createdAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// PropertyCard — grid/hub card shape (subset of PropertyDetail)
// ---------------------------------------------------------------------------

export interface PropertyCard {
  id: number;
  slug: string;
  subCat: PropertyCategoryKey;
  listingPurpose: ListingPurpose;

  title: string; // locale-picked (ar or en), fallback to `listings.title`
  cover: string | null; // cover image url (listing_images position=0)

  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  oldPriceMinorUnits: number | null;
  isPriceNegotiable: boolean;

  verificationTier: VerificationTier;

  // Spec snapshot (from category_fields) — minimal set for cards
  propertyType: PropertyFields['propertyType'];
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  rentPeriod: PropertyFields['rentPeriod'] | null;
  chequesCount: PropertyFields['chequesCount'] | null;
  furnishedStatus: PropertyFields['furnishedStatus'] | null;

  cityName: string;
  areaName: string | null;

  isFeatured: boolean;
  createdAt: string;
}
