import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Repeat } from 'lucide-react';
import type { ElectronicsDetail } from '@/lib/electronics/types';
import { formatPrice } from '@/lib/format';
import ContactSellerButton from '@/components/chat/contact-seller-button';

/**
 * Electronics detail — sticky purchase panel.
 *
 * Mirrors property-detail-purchase-panel layout: sticky on lg+,
 * shows price + old-price strike-through + negotiable chip + primary
 * Contact Seller CTA + optional Make Offer / Offer a Trade CTAs +
 * seller mini-card at the bottom.
 *
 * Badal support (P8): when listing.fields.acceptsTrade is true, show
 * a secondary "Offer a trade" CTA that pre-populates the chat with a
 * structured trade pitch (implementation of the structured message
 * lands alongside the chat integration — for now it routes to the
 * same startOrResumeConversation flow as Contact Seller but with a
 * trade variant prop).
 */

interface Props {
  listing: ElectronicsDetail;
  locale: 'ar' | 'en';
}

export default function ElectronicsDetailPurchasePanel({ listing, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  const f = listing.fields;
  const seller = listing.seller;

  const sellerName = seller.isDealer && seller.dealerName ? seller.dealerName : seller.displayName;

  return (
    <aside className="lg:sticky lg:top-20">
      <div className="space-y-4 rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
        {/* Price */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
            {t('priceLabel')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-foreground">
              {formatPrice(listing.priceMinorUnits, listing.currencyCode, locale)}
            </span>
            {listing.oldPriceMinorUnits != null && (
              <span className="text-sm text-foreground/40 line-through">
                {formatPrice(listing.oldPriceMinorUnits, listing.currencyCode, locale)}
              </span>
            )}
          </div>
          {listing.isPriceNegotiable && (
            <span className="inline-block rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-400 ring-1 ring-inset ring-sky-500/20">
              {t('negotiableBadge')}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="space-y-2">
          <ContactSellerButton
            listingId={listing.id}
            locale={locale}
            variant="primary"
            labelOverride={t('contactCta')}
          />
          {listing.isPriceNegotiable && (
            <ContactSellerButton
              listingId={listing.id}
              locale={locale}
              variant="offer"
              labelOverride={t('makeOfferCta')}
            />
          )}
          {f.acceptsTrade && (
            <ContactSellerButton
              listingId={listing.id}
              locale={locale}
              variant="offer"
              labelOverride={t('tradeCta')}
              className="bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-500/20"
            />
          )}
        </div>

        {/* Seller mini-card */}
        <div className="border-t border-border/40 pt-4">
          <Link
            href={seller.handle ? `/${locale}/profile/${seller.handle}` : '#'}
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-foreground/[0.03]"
          >
            {seller.avatarUrl ? (
              <Image
                src={seller.avatarUrl}
                alt={sellerName}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold text-foreground/60">
                {sellerName.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {sellerName}
              </p>
              <p className="inline-flex items-center gap-1 truncate text-[11px] text-foreground/55">
                {seller.isDealer ? (
                  <>
                    <BadgeCheck size={11} className="text-emerald-600 dark:text-emerald-400" />
                    {t('dealerSeller')}
                  </>
                ) : (
                  t('privateSeller')
                )}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Badal hint card — only when seller opted in, as a secondary explainer */}
      {f.acceptsTrade && (
        <div className="mt-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Repeat size={12} />
            {t('tradeAcceptedTitle')}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
            {f.tradeForModels
              ? t('tradeAcceptedBody', { models: f.tradeForModels })
              : t('tradeAcceptedGeneric')}
          </p>
        </div>
      )}
    </aside>
  );
}
