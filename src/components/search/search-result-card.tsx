import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Image as ImageIcon, Video } from 'lucide-react';
import type { ListingCardData } from '@/lib/browse/types';
import { formatPrice } from '@/lib/format';
import { listingDetailHref } from '@/lib/listings/route';

/**
 * SearchResultCard — card shape for /search results + future /browse
 * + /categories pages. Intentionally generic (ListingCardData shape)
 * so it works for any vertical.
 */

interface Props {
  card: ListingCardData;
  locale: 'ar' | 'en';
}

export default function SearchResultCard({ card, locale }: Props) {
  const href = listingDetailHref(locale, card.id, card.categorySlug);

  const priceMinor =
    typeof card.priceMinorUnits === 'bigint'
      ? Number(card.priceMinorUnits)
      : card.priceMinorUnits;

  return (
    <Link
      href={href}
      className="group flex gap-4 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition hover:border-border hover:shadow-sm"
    >
      {/* Cover */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-foreground/5 sm:h-32 sm:w-32">
        {card.coverUrl ? (
          <Image
            src={card.coverUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 128px, 112px"
            className="object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/30">
            <ImageIcon size={20} />
          </div>
        )}
        {/* Photo count + video badge */}
        <div className="absolute bottom-1 start-1 flex items-center gap-1">
          {card.imageCount > 1 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
              <ImageIcon size={8} />
              {card.imageCount}
            </span>
          )}
          {card.hasVideo && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
              <Video size={8} />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
            {card.title}
          </h3>
          {(card.cityName || card.areaName) && (
            <p className="inline-flex items-center gap-1 text-[11px] text-foreground/60">
              <MapPin size={10} />
              {[card.areaName, card.cityName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(priceMinor, card.currencyCode, locale)}
          </span>
          {card.saveCount > 0 && (
            <span className="text-[10px] text-foreground/50">
              ♥ {card.saveCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
