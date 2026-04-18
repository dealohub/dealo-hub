import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Play, BadgeCheck, ImageIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import type { PriceMode } from '@/lib/listings/validators';
import { CoverImage } from './CoverImage';
import { PriceDisplay } from './PriceDisplay';
import { SaveButton } from './SaveButton';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';

export interface ListingCardData {
  id: number;
  title: string;
  priceMode: PriceMode;
  priceMinorUnits: bigint | number;
  currencyCode: string;
  minOfferMinorUnits?: bigint | number | null;
  coverUrl?: string | null;
  imageCount: number;
  hasVideo: boolean;
  areaName?: string | null;
  cityName?: string | null;
  createdAt: string;
  saveCount: number;
  categorySlug?: string | null;
  isLuxury?: boolean;
  isAuthenticityConfirmed?: boolean;
  seller: {
    id: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
    isPhoneVerified: boolean;
  };
}

interface ListingCardProps {
  listing: ListingCardData;
  locale: Locale;
  isSaved: boolean;
  /** First 4 cards in a grid should pass `priority` for LCP. */
  priority?: boolean;
  className?: string;
}

/**
 * ListingCard — the fundamental repeating unit of the marketplace.
 *
 * Reference: DESIGN.md Section 8 anatomy. Anti-patterns enforced:
 * - No phone number (Decision 2)
 * - No expiry/countdown
 * - No "was/now" strikethrough pricing
 * - Max 2 trust badges (phone verified + authenticity)
 */
export function ListingCard({ listing, locale, isSaved, priority, className }: ListingCardProps) {
  const t = useTranslations('listing.card');
  const sellerHref = listing.seller.handle
    ? `/profile/${listing.seller.handle}`
    : `/profile/u/${listing.seller.id}`;
  const locationLabel = [listing.areaName, listing.cityName].filter(Boolean).join(' · ');

  return (
    <article
      className={cn(
        'group relative flex flex-col',
        'bg-pure-surface border border-ghost-border rounded-2xl overflow-hidden',
        'shadow-card transition-all duration-200',
        'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-zinc-300',
        'focus-within:ring-2 focus-within:ring-warm-amber focus-within:ring-offset-2',
        className
      )}
    >
      <Link
        href={`/listings/${listing.id}`}
        className="relative block aspect-[4/3] bg-deep-layer overflow-hidden"
      >
        <CoverImage
          src={listing.coverUrl}
          alt={listing.title}
          priority={priority}
          className="group-hover:scale-[1.03]"
        />

        {listing.hasVideo && (
          <span
            className="
              absolute top-3 start-3
              inline-flex items-center gap-1.5 px-2 py-1 rounded-md
              bg-charcoal-ink/90 text-white text-label
              backdrop-blur-sm
            "
          >
            <Play className="size-3" fill="currentColor" strokeWidth={0} />
            {t('videoBadge')}
          </span>
        )}

        {listing.imageCount > 1 && (
          <span
            className="
              absolute bottom-3 end-3
              inline-flex items-center gap-1
              font-mono tabular-nums text-caption text-white
              bg-charcoal-ink/80 rounded-md px-2 py-0.5
              backdrop-blur-sm
            "
          >
            <ImageIcon className="size-3" strokeWidth={1.75} />
            {listing.imageCount}
          </span>
        )}

        {listing.isAuthenticityConfirmed && (
          <span
            className="
              absolute top-3 end-3
              inline-flex items-center gap-1 px-2 py-1 rounded-md
              bg-warm-amber/95 text-white text-label
              backdrop-blur-sm
            "
            title={t('authenticity')}
          >
            <ShieldCheck className="size-3" strokeWidth={2.25} />
            {t('authenticity')}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <Link href={`/listings/${listing.id}`} className="group/title">
          <h3 className="line-clamp-2 font-semibold text-heading-3 text-charcoal-ink group-hover/title:text-warm-amber transition-colors">
            {listing.title}
          </h3>
        </Link>

        {(locationLabel || listing.createdAt) && (
          <p className="text-body-small text-muted-steel">
            {[locationLabel, listing.createdAt ? formatTimeAgo(listing.createdAt, locale) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <PriceDisplay
          minorUnits={listing.priceMinorUnits}
          currency={listing.currencyCode}
          priceMode={listing.priceMode}
          minOfferMinor={listing.minOfferMinorUnits}
          locale={locale}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-whisper-divider">
        <Link
          href={sellerHref}
          className="flex items-center gap-2 min-w-0 group/seller"
        >
          <AvatarDisplay
            src={listing.seller.avatarUrl}
            name={listing.seller.displayName}
            size="sm"
          />
          <span className="text-body-small text-charcoal-ink truncate group-hover/seller:text-warm-amber transition-colors">
            {listing.seller.displayName}
          </span>
          {listing.seller.isPhoneVerified && (
            <BadgeCheck
              className="size-3.5 text-success-sage shrink-0"
              strokeWidth={2.25}
              aria-label={t('phoneVerified')}
            />
          )}
        </Link>

        <SaveButton
          listingId={listing.id}
          initialSaved={isSaved}
          count={listing.saveCount}
          locale={locale}
        />
      </div>
    </article>
  );
}
