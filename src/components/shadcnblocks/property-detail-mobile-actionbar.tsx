'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle, Phone } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';
import { formatPrice } from '@/lib/format';

/**
 * Property detail — mobile sticky action bar.
 *
 * Shown only on <lg breakpoints — the purchase panel sidebar already
 * lives in view on desktop. Compressed to the essentials:
 *   [ price + period ] [ WhatsApp ] [ Chat ]
 *
 * Chat-only invariant (DECISIONS.md #2) preserved; no raw phone
 * reveal. WhatsApp deep-link is handled by the chat-relay flow in
 * Phase 4e (clicking before then falls through to the chat CTA).
 */

interface Props {
  listing: PropertyDetail;
  locale: 'ar' | 'en';
}

export default function PropertyDetailMobileActionBar({ listing, locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;
  const priceFormatted = formatPrice(listing.priceMinorUnits, listing.currencyCode, locale);
  const periodKey = f.rentPeriod
    ? {
        daily: 'periodDaily',
        weekly: 'periodWeekly',
        monthly: 'periodMonthly',
        yearly: 'periodYearly',
      }[f.rentPeriod]
    : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">
            {t('mobilePrice')}
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {priceFormatted}
            {periodKey && (
              <span className="ms-1 text-xs font-normal text-foreground/60">
                {t(periodKey as any)}
              </span>
            )}
          </div>
        </div>
        <button className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/15">
          <Phone size={14} />
          {t('panelCtaWhatsApp')}
        </button>
        <button className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
          <MessageCircle size={14} />
          {t('mobileChat')}
        </button>
      </div>
    </div>
  );
}
