import type {
  Condition,
  DeliveryOption,
  PriceMode,
} from '@/lib/listings/validators';

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
