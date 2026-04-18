import { Link } from '@/i18n/routing';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ListingCardData } from '@/components/listings/ListingCard';
import { ListingCard } from '@/components/listings/ListingCard';
import type { Locale } from '@/i18n/routing';

interface FeaturedSectionProps {
  title: string;
  listings: ListingCardData[];
  savedIds?: Set<number>;
  seeMoreHref?: string;
  className?: string;
}

export function FeaturedSection({
  title,
  listings,
  savedIds,
  seeMoreHref,
  className,
}: FeaturedSectionProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('browse.featured');
  if (listings.length === 0) return null;

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-heading-1 font-semibold text-charcoal-ink">{title}</h2>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="inline-flex items-center gap-1 text-body-small font-medium text-charcoal-ink hover:text-warm-amber transition-colors shrink-0"
          >
            <span>{t('seeMore')}</span>
            <ArrowIcon className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing, idx) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            locale={locale}
            isSaved={savedIds?.has(listing.id) ?? false}
            priority={idx < 2}
          />
        ))}
      </div>
    </section>
  );
}
