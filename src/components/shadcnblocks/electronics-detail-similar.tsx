import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Repeat, ShieldCheck } from 'lucide-react';
import type { ElectronicsCard } from '@/lib/electronics/types';
import { formatPrice } from '@/lib/format';

/**
 * Electronics detail — Similar strip.
 *
 * Up to 4 cards: same sub-cat + same brand first, fallback to same
 * sub-cat only (enforced upstream by getSimilarElectronics).
 *
 * Each card carries the badal badge when accepts_trade is true —
 * small visual that surfaces the trade-in option at discovery time
 * (P8 moat).
 */

interface Props {
  listings: ElectronicsCard[];
  locale: 'ar' | 'en';
}

export default function ElectronicsDetailSimilar({ listings, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  if (listings.length === 0) return null;

  return (
    <section aria-label="Similar" className="space-y-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {t('similarTitle')}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map(card => (
          <Link
            key={card.id}
            href={`/${locale}/tech/${card.slug ?? card.id}`}
            className="group block overflow-hidden rounded-2xl border border-border/60 bg-background transition hover:border-border hover:shadow-sm"
          >
            {card.cover ? (
              <div className="relative aspect-[4/3] bg-foreground/[0.04]">
                <Image
                  src={card.cover}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {card.verificationTier !== 'unverified' && (
                  <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                    <ShieldCheck size={9} />
                    {card.verificationTier === 'dealo_inspected'
                      ? t('tierDealoInspected')
                      : t('tierAiVerified')}
                  </span>
                )}
                {card.acceptsTrade && (
                  <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    <Repeat size={9} />
                    {t('tradeBadge')}
                  </span>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-foreground/5" />
            )}
            <div className="space-y-1 p-3">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {card.title}
              </p>
              <p className="line-clamp-1 text-[11px] text-foreground/55">
                {card.brand} · {card.model}
                {card.storageGb ? ` · ${card.storageGb} GB` : ''}
                {card.batteryHealthPct != null ? ` · 🔋 ${card.batteryHealthPct}%` : ''}
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatPrice(card.priceMinorUnits, card.currencyCode, locale)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
