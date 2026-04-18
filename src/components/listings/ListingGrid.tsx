import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { ListingCard, type ListingCardData } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';

interface ListingGridProps {
  listings: ListingCardData[];
  locale: Locale;
  /** Listing IDs the current user has already favorited. */
  savedIds?: Set<number>;
  /** Render as skeletons instead of real cards. */
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}

/**
 * Responsive 1/2/3/4-column grid. First 4 cards get `priority` for LCP.
 */
export function ListingGrid({
  listings,
  locale,
  savedIds,
  loading,
  skeletonCount = 8,
  className,
}: ListingGridProps) {
  const gridClass = cn(
    'grid gap-3 sm:gap-4 lg:gap-5',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    className
  );

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {listings.map((listing, idx) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          locale={locale}
          isSaved={savedIds?.has(listing.id) ?? false}
          priority={idx < 4}
        />
      ))}
    </div>
  );
}
