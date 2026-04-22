import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home, Flame, Sparkle, Repeat } from 'lucide-react';
import type { ElectronicsDetail } from '@/lib/electronics/types';
import PropertyVerificationBadge from './property-verification-badge';

/**
 * Electronics detail — header (centered hero).
 *
 * Mirrors property-detail-header: breadcrumb → badges strip → h1 →
 * meta row (device kind · brand model · city). Cross-vertical
 * verification badge reused from Properties (tier system is shared
 * via migration 0026).
 *
 * Doctrine surface:
 *   - Verification tier badge prominent (every listing declares its
 *     tier — "unverified" shows explicitly, per P2)
 *   - Cosmetic grade chip next to the tier so buyers see both
 *   - "Open to trade" badge (P8 — badal) when the seller opted in;
 *     the detail page's visible hook for the badal moat
 *   - Featured / hot flags as accent chips
 */

interface Props {
  listing: ElectronicsDetail;
  locale: 'ar' | 'en';
}

const GRADE_BADGE_COLOR: Record<ElectronicsDetail['fields']['cosmeticGrade'], string> = {
  premium: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  excellent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/20',
  good: 'bg-foreground/[0.06] text-foreground/80 ring-1 ring-inset ring-foreground/10',
  fair: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20',
};

export default function ElectronicsDetailHeader({ listing, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  const tSell = useTranslations('sell.step.electronics');
  const f = listing.fields;

  return (
    <header className="border-b border-border/50 bg-gradient-to-b from-background to-background/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1.5 text-xs text-foreground/60"
        >
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Home size={12} />
            {t('crumbHome')}
          </Link>
          <ChevronRight size={12} className="opacity-50 rtl:rotate-180" />
          <Link href={`/${locale}/tech`} className="hover:text-foreground">
            {t('crumbTech')}
          </Link>
          <ChevronRight size={12} className="opacity-50 rtl:rotate-180" />
          <span className="text-foreground/80">{tSell(`deviceKind.${f.deviceKind}` as any)}</span>
        </nav>

        {/* Badges strip */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PropertyVerificationBadge
            tier={listing.verificationTier}
            verifiedAt={listing.verifiedAt}
            verifiedBy={listing.verifiedBy}
            size="md"
          />
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${GRADE_BADGE_COLOR[f.cosmeticGrade]}`}
          >
            {t(`gradeBadge.${f.cosmeticGrade}` as any)}
          </span>
          {f.acceptsTrade && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
              <Repeat size={11} />
              {t('tradeBadge')}
            </span>
          )}
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20">
              <Sparkle size={11} />
              {t('featured')}
            </span>
          )}
          {listing.isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/20">
              <Flame size={11} />
              Hot
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {listing.title}
        </h1>

        {/* Meta row — device kind chip + brand/model + city */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-foreground/75">
          <span className="font-medium text-foreground">{f.brand}</span>
          <span className="text-foreground/80">{f.model}</span>
          {f.storageGb != null && (
            <>
              <span className="text-foreground/30">·</span>
              <span>{f.storageGb} GB</span>
            </>
          )}
          {(listing.areaName || listing.cityName) && (
            <>
              <span className="text-foreground/30">·</span>
              <span className="text-foreground/70">
                {[listing.areaName, listing.cityName].filter(Boolean).join(' · ')}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
