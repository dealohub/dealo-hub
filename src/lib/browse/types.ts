import type {
  Condition,
  DeliveryOption,
  PriceMode,
} from '@/lib/listings/validators';

/**
 * App-facing shape for a listing rendered in a browse/search grid card.
 *
 * Canonical location. Previously lived in `src/components/listings/ListingCard`
 * (removed during the UI reset). Moved here so the `src/lib/browse` layer
 * owns the shape it maps listings into; the UI layer re-exports or consumes
 * from here.
 *
 * Kept narrow for safety: `phone_e164` and `email` must NEVER be present
 * on this shape (Decision 2 — chat-only contact).
 */
export interface ListingCardData {
  id: number;
  title: string;
  priceMode: PriceMode;
  priceMinorUnits: bigint | number;
  currencyCode: string;
  minOfferMinorUnits: bigint | number | null;
  coverUrl: string | null;
  imageCount: number;
  hasVideo: boolean;
  areaName: string | null;
  cityName: string | null;
  createdAt: string;
  saveCount: number;
  categorySlug: string | null;
  isAuthenticityConfirmed: boolean;
  seller: {
    id: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
    isPhoneVerified: boolean;
  };
}

export type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'most_saved';

export const SORT_OPTIONS: readonly SortOption[] = [
  'newest',
  'price_asc',
  'price_desc',
  'most_saved',
] as const;

export const DEFAULT_SORT: SortOption = 'newest';
export const DEFAULT_PAGE_SIZE = 24;

export interface FilterState {
  categorySlug?: string;
  subCategorySlug?: string;
  /** Free-text query — set by search page only. */
  q?: string;
  priceMin?: number; // minor units
  priceMax?: number;
  cityId?: number;
  areaIds?: number[];
  conditions?: Condition[];
  priceModes?: PriceMode[];
  deliveryOptions?: DeliveryOption[];
  hasVideo?: boolean;
  hasDocumentation?: boolean;
  sellerPhoneVerified?: boolean;
  sort: SortOption;
  page: number; // 1-based
}

export const EMPTY_FILTERS: FilterState = {
  sort: DEFAULT_SORT,
  page: 1,
};
