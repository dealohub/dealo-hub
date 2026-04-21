import { useTranslations } from 'next-intl';
import { MessageCircle, CalendarCheck2, Phone, Heart, Scale, Share2 } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';
import { formatPrice } from '@/lib/format';

/**
 * Property detail — purchase panel (right sidebar on lg+, inline on sm).
 *
 * Surface strategy:
 *   - Big price with period suffix (/mo, /yr, /night) derived from
 *     rent_period for rent listings; sale listings show just the price.
 *   - "قابل للتفاوض" badge (P3 — 60%+ of our seeded rent listings
 *     demonstrate this).
 *   - Cheques count row for yearly rent (P12).
 *   - Deposit + service charge rows where set.
 *   - CTA choice by listing_purpose:
 *       rent (chalet, daily)  → "Book now" (primary blue)
 *       rent (standard)       → "Contact seller"
 *       sale                  → "Make offer" + "Contact seller"
 *       exchange              → "Propose exchange"
 *   - Chat-first — phone is never displayed (DECISIONS.md #2).
 *   - WhatsApp secondary CTA for speed.
 *   - Quick-action row: Save · Compare · Share.
 */

interface Props {
  listing: PropertyDetail;
  locale: 'ar' | 'en';
}

function rentPeriodLabelKey(period: string | undefined): string {
  return (
    {
      daily: 'periodDaily',
      weekly: 'periodWeekly',
      monthly: 'periodMonthly',
      yearly: 'periodYearly',
    }[period ?? ''] ?? 'periodMonthly'
  );
}

export default function PropertyDetailPurchasePanel({ listing, locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;
  const isRent =
    listing.subCat === 'property-for-rent' || listing.subCat === 'rooms-for-rent';
  const isSale = listing.subCat === 'property-for-sale' || listing.subCat === 'land';
  const isChaletRent = isRent && f.propertyType === 'chalet';

  const priceFormatted = formatPrice(listing.priceMinorUnits, listing.currencyCode, locale);
  const oldPriceFormatted = listing.oldPriceMinorUnits
    ? formatPrice(listing.oldPriceMinorUnits, listing.currencyCode, locale)
    : null;

  const periodKey = f.rentPeriod ? rentPeriodLabelKey(f.rentPeriod) : null;

  // Seller mini
  const sellerBadgeKey = listing.seller.isDealer
    ? 'panelDealerSeller'
    : 'panelPrivateSeller';

  return (
    <aside className="sticky top-20 space-y-4 rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      {/* Price block */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-3xl font-semibold tracking-tight text-foreground">
            {priceFormatted}
          </span>
          {periodKey && (
            <span className="text-sm text-foreground/60">{t(periodKey as any)}</span>
          )}
        </div>
        {oldPriceFormatted && (
          <div className="mt-1 flex items-center gap-2 text-sm text-foreground/50">
            <s>{oldPriceFormatted}</s>
          </div>
        )}
        {listing.isPriceNegotiable && (
          <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t('panelNegotiableBadge')}
          </span>
        )}
      </div>

      {/* Commercial terms rows */}
      {(f.chequesCount != null ||
        f.depositMinorUnits != null ||
        f.serviceChargeKwd != null) && (
        <div className="space-y-1.5 rounded-xl bg-foreground/5 p-3 text-sm">
          {f.chequesCount != null && (
            <Row
              label={t('chequesLabel')}
              value={t('chequesShort', { n: f.chequesCount })}
            />
          )}
          {f.depositMinorUnits != null && (
            <Row
              label={t('panelDepositLabel')}
              value={formatPrice(f.depositMinorUnits, listing.currencyCode, locale)}
            />
          )}
          {f.serviceChargeKwd != null && (
            <Row
              label={t('panelServiceChargeLabel')}
              value={`${f.serviceChargeKwd.toLocaleString('en-US')} ${listing.currencyCode}`}
            />
          )}
        </div>
      )}

      {/* Primary CTA by purpose */}
      <div className="space-y-2">
        {isChaletRent ? (
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600">
            <CalendarCheck2 size={16} />
            {t('panelCtaBookNow')}
          </button>
        ) : isSale ? (
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <MessageCircle size={16} />
            {t('panelCtaMakeOffer')}
          </button>
        ) : (
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <MessageCircle size={16} />
            {t('panelCtaContactSeller')}
          </button>
        )}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/15">
          <Phone size={16} />
          {t('panelCtaWhatsApp')}
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 border-t border-border/40 pt-3">
        <QuickAction icon={<Heart size={14} />} label={t('panelSavedListing')} />
        <QuickAction icon={<Scale size={14} />} label={t('panelCompareListing')} />
        <QuickAction icon={<Share2 size={14} />} label={t('panelShareListing')} />
      </div>

      {/* Seller mini */}
      <div className="flex items-center gap-3 border-t border-border/40 pt-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {listing.seller.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {listing.seller.dealerName || listing.seller.displayName}
          </div>
          <div className="truncate text-xs text-foreground/60">{t(sellerBadgeKey as any)}</div>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-foreground/60">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground">
      {icon}
      <span>{label}</span>
    </button>
  );
}
