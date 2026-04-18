import {
  ConditionEnum,
  DeliveryOptionEnum,
  PriceModeEnum,
  type Condition,
  type DeliveryOption,
  type PriceMode,
} from '@/lib/listings/validators';
import {
  DEFAULT_SORT,
  EMPTY_FILTERS,
  SORT_OPTIONS,
  type FilterState,
  type SortOption,
} from './types';

/**
 * Parse URL search params into a structured FilterState.
 *
 * Arrays are encoded as comma-separated values (e.g. `?conditions=new,like_new`)
 * for shorter + more readable URLs than repeated keys.
 *
 * All unknown / invalid values are silently dropped — filters degrade instead
 * of erroring, so a shared link with an old value still loads.
 */
export function parseFiltersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): FilterState {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const v = params[key];
    if (Array.isArray(v)) return v[0];
    return v ?? undefined;
  };

  const getAll = (key: string): string[] => {
    const v = get(key);
    if (!v) return [];
    return v.split(',').map(s => s.trim()).filter(Boolean);
  };

  const parseIntSafe = (v: string | undefined): number | undefined => {
    if (v == null) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const parseEnumArray = <T extends string>(
    key: string,
    allowed: readonly T[]
  ): T[] | undefined => {
    const values = getAll(key).filter((v): v is T => (allowed as readonly string[]).includes(v));
    return values.length > 0 ? values : undefined;
  };

  const parseBool = (v: string | undefined): boolean | undefined => {
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
    return undefined;
  };

  const sortRaw = get('sort');
  const sort: SortOption = (SORT_OPTIONS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as SortOption)
    : DEFAULT_SORT;

  const state: FilterState = {
    q: get('q') || undefined,
    priceMin: parseIntSafe(get('price_min')),
    priceMax: parseIntSafe(get('price_max')),
    cityId: parseIntSafe(get('city')),
    areaIds: getAll('areas').map(Number).filter(n => Number.isFinite(n) && n > 0),
    conditions: parseEnumArray<Condition>('conditions', ConditionEnum.options),
    priceModes: parseEnumArray<PriceMode>('modes', PriceModeEnum.options),
    deliveryOptions: parseEnumArray<DeliveryOption>('delivery', DeliveryOptionEnum.options),
    hasVideo: parseBool(get('video')),
    hasDocumentation: parseBool(get('docs')),
    sellerPhoneVerified: parseBool(get('verified')),
    sort,
    page: Math.max(1, parseIntSafe(get('page')) ?? 1),
  };

  if (state.areaIds && state.areaIds.length === 0) delete state.areaIds;
  return state;
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.priceMin != null) params.set('price_min', String(filters.priceMin));
  if (filters.priceMax != null) params.set('price_max', String(filters.priceMax));
  if (filters.cityId != null) params.set('city', String(filters.cityId));
  if (filters.areaIds?.length) params.set('areas', filters.areaIds.join(','));
  if (filters.conditions?.length) params.set('conditions', filters.conditions.join(','));
  if (filters.priceModes?.length) params.set('modes', filters.priceModes.join(','));
  if (filters.deliveryOptions?.length)
    params.set('delivery', filters.deliveryOptions.join(','));
  if (filters.hasVideo) params.set('video', '1');
  if (filters.hasDocumentation) params.set('docs', '1');
  if (filters.sellerPhoneVerified) params.set('verified', '1');
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** Number of active (non-default) filters — used to decorate the "Filters" button badge. */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.priceMin != null || filters.priceMax != null) count++;
  if (filters.cityId != null) count++;
  if (filters.areaIds?.length) count++;
  if (filters.conditions?.length) count++;
  if (filters.priceModes?.length) count++;
  if (filters.deliveryOptions?.length) count++;
  if (filters.hasVideo) count++;
  if (filters.hasDocumentation) count++;
  if (filters.sellerPhoneVerified) count++;
  return count;
}

export function clearFilters(preserveSort = true): FilterState {
  return preserveSort ? { ...EMPTY_FILTERS } : { ...EMPTY_FILTERS };
}
