'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from '@/lib/browse/filters';
import type { FilterState } from '@/lib/browse/types';

/**
 * Read + write the filter state encoded in URL search params.
 *
 * Changes are pushed via `router.push` with `scroll: false` so the list
 * re-renders in place. Wrapped in startTransition for non-blocking updates
 * during React concurrent rendering.
 */
export function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters: FilterState = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const pushFilters = useCallback(
    (next: FilterState) => {
      const params = filtersToSearchParams(next);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router]
  );

  const patch = useCallback(
    (partial: Partial<FilterState>) => {
      pushFilters({ ...filters, ...partial, page: 1 });
    },
    [filters, pushFilters]
  );

  const reset = useCallback(() => {
    pushFilters({ sort: filters.sort, page: 1 });
  }, [filters.sort, pushFilters]);

  return { filters, patch, reset, isPending };
}
