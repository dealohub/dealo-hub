'use client';

import { useTranslations } from 'next-intl';
import type { ElectronicsDetail } from '@/lib/electronics/types';
import { formatPrice } from '@/lib/format';
import ContactSellerButton from '@/components/chat/contact-seller-button';

/**
 * Electronics detail — mobile sticky action bar.
 *
 * Shown only on <lg breakpoints; the sticky purchase panel sidebar
 * already lives in view on desktop. Compressed to the essentials:
 *
 *   [ price + negotiable dot ] [ Trade CTA (if acceptsTrade) ] [ Chat ]
 *
 * Chat-only invariant (DECISIONS.md #2) preserved. Trade CTA surfaces
 * P8 badal moat even on mobile — tap falls into the same chat-relay
 * flow as Contact Seller but with the offer variant, so the buyer
 * lands in the conversation with a trade pitch ready to fill.
 */

interface Props {
  listing: ElectronicsDetail;
  locale: 'ar' | 'en';
}

export default function ElectronicsDetailMobileActionBar({ listing, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  const f = listing.fields;
  const priceFormatted = formatPrice(
    listing.priceMinorUnits,
    listing.currencyCode,
    locale,
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">
            {t('priceLabel')}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {priceFormatted}
            </span>
            {listing.isPriceNegotiable && (
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-label="Negotiable" />
            )}
          </div>
        </div>
        {f.acceptsTrade && (
          <ContactSellerButton
            listingId={listing.id}
            locale={locale}
            variant="compact"
            labelOverride={t('tradeCta')}
            className="bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
          />
        )}
        <ContactSellerButton
          listingId={listing.id}
          locale={locale}
          variant="primary"
          labelOverride={t('contactCta')}
        />
      </div>
    </div>
  );
}
