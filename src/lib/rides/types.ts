import type { Database } from '@/types/database';
import type { UsedCarFields } from './validators';

/**
 * App-facing types for the rides (automotive) vertical.
 *
 * Naming convention: camelCase (matches browse/types.ts precedent).
 * DB row types (snake_case) live in src/types/database.ts and are
 * only touched inside mappers in rides/queries.ts — never leaked
 * into the UI.
 *
 * Safety: phone_e164 and email MUST NEVER appear on these shapes
 * (Decision 2 — chat-only contact).
 */

type ListingRow = Database['public']['Tables']['listings']['Row'];

// ---------------------------------------------------------------------------
// Image categories (mirrors listing_images.category CHECK constraint)
// ---------------------------------------------------------------------------

export type ImageCategory =
  | 'exterior'
  | 'interior'
  | 'engine'
  | 'wheels'
  | 'details';

// ---------------------------------------------------------------------------
// RideDetail — the full shape consumed by /rides/[id]
// ---------------------------------------------------------------------------

export interface RideDetail {
  // Core
  id: number;
  slug: string;
  title: string;
  description: string;
  brand: string | null;
  model: string | null;
  color: string | null;

  // Pricing
  condition: ListingRow['condition'];
  priceMode: ListingRow['price_mode'];
  priceMinorUnits: number;
  currencyCode: string;
  minOfferMinorUnits: number | null;
  /** Previous price when the seller dropped it — null when no drop. */
  oldPriceMinorUnits: number | null;

  // Location
  countryCode: string;
  cityId: number;
  cityName: string;

  // Lifecycle
  status: ListingRow['status'];
  publishedAt: string | null;

  // Badges (generic across verticals)
  isFeatured: boolean;
  isHot: boolean;

  // Engagement counters (trigger-maintained on listings)
  viewCount: number;
  saveCount: number;
  chatInitiationCount: number;

  // Vertical-specific — Zod-parsed, camelCase
  specs: UsedCarFields;

  // Images, ordered by position ASC
  images: RideImage[];

  // Seller mini-profile
  seller: RideSeller;

  // Category crumbs
  category: {
    id: number;
    slug: string;
    nameAr: string;
    nameEn: string;
  };

  /**
   * Display tint derived from the category slug in the query mapper.
   * UI layer uses this for badges, accents, ambient glows.
   */
  catColor: string;
}

export interface RideImage {
  url: string;
  width: number;
  height: number;
  altText: string | null;
  position: number;
  /** Gallery filter bucket. NULL for verticals that don't categorise. */
  category: ImageCategory | null;
}

export interface RideSeller {
  id: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  isDealer: boolean;
  dealerName: string | null;
  dealerVerifiedAt: string | null;
  /** Full years between profiles.created_at and NOW() — for "N yrs on Dealo". */
  yearsActive: number;
}

// ---------------------------------------------------------------------------
// RideCard — shallow shape for grids + similar-vehicles carousels
// ---------------------------------------------------------------------------

export interface RideCard {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  priceMinorUnits: number;
  currencyCode: string;
  coverImage: string | null;
  cityName: string;

  /** Pulled shallowly from category_fields without full Zod parse. */
  year: number | null;
  bodyStyle: string | null;
  fuelType: string | null;
  mileageKm: number | null;

  /**
   * Sub-category slug (e.g. 'used-cars'). Used by the hub filter
   * chips to match the active tab — avoids a join in the consumer.
   */
  subCategorySlug: string;

  /** Same derivation rule as RideDetail.catColor. */
  catColor: string;
}
