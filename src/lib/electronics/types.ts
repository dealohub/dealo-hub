import type { ElectronicsFields } from './validators';

/**
 * App-facing types for the Electronics vertical.
 *
 * Conventions mirror src/lib/properties/types.ts:
 *   - camelCase throughout (DB rows live in src/types/database.ts)
 *   - No phone_e164 / email on public shapes (DECISIONS.md #2)
 *   - Nullable where the DB is nullable; Zod narrows on parse
 *
 * Architecture note: ElectronicsFields (the camelCase consumer shape)
 * lives in validators.ts so the Zod source of truth is co-located
 * with its conditional refinement logic.
 *
 * Reference: planning/PHASE-7A-ELECTRONICS.md §2 (taxonomy fit) + §3 (schema).
 */

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

/** One of the 6 sub-cats inserted by the original taxonomy seed under
 *  the `electronics` parent. Mirrors what `getCategoryBySlug('electronics')`
 *  returns under `subCategories`. */
export type ElectronicsCategoryKey =
  | 'phones-tablets'
  | 'laptops-computers'
  | 'tvs-audio'
  | 'gaming'
  | 'smart-watches'
  | 'cameras';

/**
 * `device_kind` is finer than the sub-cat — a single sub-cat (gaming)
 * may carry multiple device kinds (console, handheld_console,
 * accessory). Listed here so consumers can branch UI on it.
 */
export type DeviceKind =
  | 'phone'
  | 'tablet'
  | 'laptop'
  | 'desktop'
  | 'tv'
  | 'soundbar'
  | 'headphones'
  | 'speaker'
  | 'console'
  | 'handheld_console'
  | 'accessory'
  | 'smart_watch'
  | 'camera'
  | 'lens';

// ---------------------------------------------------------------------------
// Verification (cross-vertical — reuse Properties' types)
// ---------------------------------------------------------------------------

export type {
  VerificationTier,
  VerificationMethod,
} from '@/lib/properties/types';

// ---------------------------------------------------------------------------
// Image categories
// ---------------------------------------------------------------------------

/**
 * Electronics-specific image-category enum. Reuses 4 of the
 * automotive-shared values (exterior/interior/details — generic) and
 * adds 4 electronics-specific ones. All values live as plain text in
 * `listing_images.category` — listing_images.category CHECK was
 * extended in migration 0026 with property values; we extend it
 * again in 7a's optional companion migration if seeders need the
 * new categories. For Phase 7a alone we lean on the existing 'details'
 * value as the catch-all.
 */
export type ElectronicsImageCategory =
  | 'power_on_screen'
  | 'imei_screen'
  | 'battery_health_screen'
  | 'serial_label'
  // Generic photo categories already accepted by listing_images.category
  | 'exterior'
  | 'interior'
  | 'details';

export interface ElectronicsImage {
  url: string;
  position: number;
  category: ElectronicsImageCategory | null;
  altText: string | null;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// ElectronicsDetail — full shape for /tech/[slug]
// ---------------------------------------------------------------------------

export interface ElectronicsDetail {
  // Core
  id: number;
  slug: string;

  // Taxonomy
  subCat: ElectronicsCategoryKey;

  // Bilingual text (nullable — UI falls back to legacy `title` field)
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;

  // Legacy/fallback (always populated)
  title: string;
  description: string;

  // Commercial
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  oldPriceMinorUnits: number | null;
  isPriceNegotiable: boolean;

  // Verification (P10 — pillar)
  verificationTier: import('@/lib/properties/types').VerificationTier;
  verifiedAt: string | null;
  verifiedBy: import('@/lib/properties/types').VerificationMethod | null;

  // Flags
  isFeatured: boolean;
  isHot: boolean;

  // JSONB body — Zod-parsed, camelCase
  fields: ElectronicsFields;

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
  cityName: string;
  areaId: number | null;
  areaName: string | null;

  // Images
  images: ElectronicsImage[];

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
// ElectronicsCard — grid/hub card shape (subset of ElectronicsDetail)
// ---------------------------------------------------------------------------

export interface ElectronicsCard {
  id: number;
  slug: string;
  subCat: ElectronicsCategoryKey;

  title: string; // locale-picked
  cover: string | null;

  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  oldPriceMinorUnits: number | null;
  isPriceNegotiable: boolean;

  verificationTier: import('@/lib/properties/types').VerificationTier;

  // Spec snapshot for the card row — minimal set
  brand: string;
  model: string;
  deviceKind: DeviceKind;
  storageGb: number | null;
  conditionGrade: ElectronicsFields['conditionGrade'];
  batteryHealthPct: number | null;
  warrantyStatus: ElectronicsFields['warrantyStatus'];

  cityName: string;
  areaName: string | null;

  isFeatured: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers — locked sub-cat lists (consumed by route guards)
// ---------------------------------------------------------------------------

export const ELECTRONICS_SUB_CATS: ReadonlyArray<ElectronicsCategoryKey> = [
  'phones-tablets',
  'laptops-computers',
  'tvs-audio',
  'gaming',
  'smart-watches',
  'cameras',
];

export function isElectronicsSubCat(
  slug: string | null | undefined,
): slug is ElectronicsCategoryKey {
  if (!slug) return false;
  return (ELECTRONICS_SUB_CATS as ReadonlyArray<string>).includes(slug);
}

/**
 * Map a DeviceKind to its parent sub-cat. Used by the wizard's
 * "lock device_kind once sub-cat is chosen" UX so we don't allow a
 * `console` device under `phones-tablets`.
 */
export const DEVICE_KIND_BY_SUB_CAT: Record<
  ElectronicsCategoryKey,
  ReadonlyArray<DeviceKind>
> = {
  'phones-tablets': ['phone', 'tablet'],
  'laptops-computers': ['laptop', 'desktop'],
  'tvs-audio': ['tv', 'soundbar', 'headphones', 'speaker'],
  gaming: ['console', 'handheld_console', 'accessory'],
  'smart-watches': ['smart_watch', 'accessory'],
  cameras: ['camera', 'lens', 'accessory'],
};
