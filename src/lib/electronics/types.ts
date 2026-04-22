import type { ElectronicsFields } from './validators';

/**
 * Electronics vertical — app-facing types (v2).
 *
 * v1 (archived Phase 7 iteration) carried 28 fields including a
 * region_spec enum, carrier_lock enum, and installment tracking — all
 * dropped in v2 after user research showed ≥95% of GCC phones are
 * unlocked by default and region-spec is implicit in purchase_source
 * (imported → warranty warning; local retailer → GCC warranty).
 *
 * Conventions mirror src/lib/properties/types.ts:
 *   - camelCase throughout (DB stays snake_case)
 *   - No phone/email on public shapes (DECISIONS.md #2 — chat-only)
 *   - Nullable where DB is nullable; Zod narrows on parse
 *
 * v2 scope is GCC-wide (Kuwait · UAE · Saudi · Qatar · Bahrain · Oman) —
 * NOT Kuwait-only. Purchase-source enum covers retailers across the
 * region; voice stays professional, not dialect-specific.
 *
 * Reference: planning/PHASE-7A-ELECTRONICS-V2.md · planning/research-7a-v2/
 */

// ---------------------------------------------------------------------------
// Taxonomy — unchanged from v1 (6 sub-cats seeded in migration 0001)
// ---------------------------------------------------------------------------

export type ElectronicsCategoryKey =
  | 'phones-tablets'
  | 'laptops-computers'
  | 'tvs-audio'
  | 'gaming'
  | 'smart-watches'
  | 'cameras';

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

// ---------------------------------------------------------------------------
// Device kind — finer than sub-cat (a single sub-cat may host multiple kinds)
// ---------------------------------------------------------------------------

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

/** Sub-cat → allowed device-kinds map. Locks the wizard so a `console`
 *  can't be filed under `phones-tablets`, etc. */
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

// ---------------------------------------------------------------------------
// Verification (reuse cross-vertical types from Properties)
// ---------------------------------------------------------------------------

export type {
  VerificationTier,
  VerificationMethod,
} from '@/lib/properties/types';

// ---------------------------------------------------------------------------
// Image categories
// ---------------------------------------------------------------------------

export type ElectronicsImageCategory =
  | 'power_on_screen' // device on, home screen visible
  | 'imei_screen' // Settings → About with IMEI (IMEI itself redacted/blurred)
  | 'battery_health_screen' // Settings → Battery → Battery Health for iPhone
  | 'serial_label' // sticker on back of laptop/console/TV
  | 'exterior' // cross-vertical legacy values (extant in DB)
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

  // Verification (P2 — IMEI uniqueness / pre-publish check)
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

  // Location — GCC-wide
  cityId: number;
  cityName: string;
  areaId: number | null;
  areaName: string | null;
  countryCode: string; // 'KW' | 'AE' | 'SA' | 'QA' | 'BH' | 'OM'

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
// ElectronicsCard — grid/hub card shape
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
  cosmeticGrade: ElectronicsFields['cosmeticGrade'];
  batteryHealthPct: number | null;
  purchaseSource: ElectronicsFields['purchaseSource'];
  acceptsTrade: boolean;

  cityName: string;
  areaName: string | null;
  countryCode: string;

  isFeatured: boolean;
  createdAt: string;
}
