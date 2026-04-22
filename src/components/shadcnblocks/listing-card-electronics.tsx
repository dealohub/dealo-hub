import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Repeat,
  Battery,
  HardDrive,
  MapPin,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { ElectronicsCard } from '@/lib/electronics/types';
import { batteryHealthBand } from '@/lib/electronics/validators';

/**
 * Electronics card — used across the Phase 7 hub (featured +
 * main grid) and anywhere Electronics cards appear (search results,
 * similar strips, save lists).
 *
 * Doctrine surfaces on the card:
 *   - Verification tier badge when tier > unverified (top-right on cover)
 *   - Badal badge (Repeat icon) when seller opted in (top-left on cover)
 *     → the P8 moat shown at discovery time, not just on detail
 *   - Cosmetic grade pill below the title (4-tier, colored)
 *   - Battery health chip when set (green/amber/red — band derived
 *     from batteryHealthBand helper)
 *   - Storage chip when applicable (phones/laptops/consoles)
 *   - Price + negotiable badge + city
 *
 * Matches the density of listing-card-properties — two badges on the
 * cover, 2-3 signals in the body, price anchors everything.
 */

interface Props {
  card: ElectronicsCard;
  locale: 'ar' | 'en';
  priority?: boolean;
}

const GRADE_BADGE_COLOR: Record<ElectronicsCard['cosmeticGrade'], string> = {
  premium: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  excellent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/20',
  good: 'bg-foreground/[0.06] text-foreground/75 ring-1 ring-inset ring-foreground/10',
  fair: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20',
};

export default function ListingCardElectronics({ card, locale, priority }: Props) {
  const t = useTranslations('electronicsDetail');
  const tSell = useTranslations('sell.step.electronics');

  const band = batteryHealthBand(card.batteryHealthPct);
  const bandColor =
    band === 'green'
      ? 'text-emerald-600 dark:text-emerald-400'
      : band === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : band === 'red'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-foreground/45';

  return (
    <Link
      href={`/${locale}/tech/${card.slug ?? card.id}`}
      className="group relative block overflow-hidden rounded-xl border border-border/60 bg-background transition hover:border-border hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
        {card.cover ? (
          <Image
            src={card.cover}
            alt={card.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/30">
            <HardDrive size={28} />
          </div>
        )}

        {/* Badal badge (top-left) — pillar P8 surfaced at discovery */}
        {card.acceptsTrade && (
          <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Repeat size={9} />
            {t('tradeBadge')}
          </span>
        )}

        {/* Verification tier badge (top-right) */}
        {card.verificationTier !== 'unverified' && (
          <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
            <ShieldCheck size={9} />
            {card.verificationTier === 'dealo_inspected'
              ? t('tierDealoInspected')
              : t('tierAiVerified')}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2 p-3">
        {/* Title */}
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {card.title}
        </p>

        {/* Brand + model + kind line */}
        <p className="line-clamp-1 text-[11px] text-foreground/55">
          {card.brand} · {card.model}
          {card.storageGb != null ? ` · ${card.storageGb} GB` : ''}
        </p>

        {/* Signal row — cosmetic grade + battery + storage */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className={
              'inline-flex items-center rounded-full px-2 py-0.5 font-medium ' +
              GRADE_BADGE_COLOR[card.cosmeticGrade]
            }
          >
            {t(`gradeBadge.${card.cosmeticGrade}` as any)}
          </span>
          {card.batteryHealthPct != null && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${bandColor}`}>
              <Battery size={10} />
              {card.batteryHealthPct}%
            </span>
          )}
          {card.purchaseSource && (
            <span className="inline-flex items-center gap-0.5 text-foreground/55">
              <BadgeCheck size={10} />
              {tSell(`purchaseSource.${card.purchaseSource}` as any)}
            </span>
          )}
        </div>

        {/* Price + location */}
        <div className="flex items-baseline justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {formatPrice(card.priceMinorUnits, card.currencyCode, locale)}
            </p>
            {card.isPriceNegotiable && (
              <p className="text-[10px] font-medium text-sky-700 dark:text-sky-400">
                {t('negotiableBadge')}
              </p>
            )}
          </div>
          {(card.areaName || card.cityName) && (
            <p className="inline-flex items-center gap-0.5 truncate text-[11px] text-foreground/55">
              <MapPin size={10} />
              <span className="truncate">
                {[card.areaName, card.cityName].filter(Boolean).join(' · ')}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
