import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, MapPin, Package, Calendar } from 'lucide-react';
import { getGenericListingBySlug } from '@/lib/listings/detail-queries';
import ContactSellerButton from '@/components/chat/contact-seller-button';
import { formatPrice } from '@/lib/format';

/**
 * Generic listing detail page — `/listings/[slug]`.
 *
 * This is the fallback detail surface for any listing whose category
 * doesn't live under a dedicated vertical (automotive → /rides,
 * real-estate → /properties). Without this page, 57 of the 80
 * sub-categories would have no buyer-facing detail UI — a supply-loop
 * break where you could publish a listing that no one could open.
 *
 * MVP scope (deliberate):
 *   • Hero gallery with position-sorted images.
 *   • Price + verification tier + condition + delivery options.
 *   • Description block, seller mini-card, stats strip.
 *   • Contact seller CTA (same component rides + properties use).
 *
 * NOT in scope for this MVP (adds risk without revenue):
 *   • Category-field JSONB rendering — the 8 non-vertical sub-cats have
 *     heterogeneous fields; a bespoke renderer per sub-cat would balloon
 *     the component count. Defer to later when we have signal on which
 *     sub-cats are actually used in production.
 *   • Similar-listings strip — needs a sub-cat-aware query; postpone.
 *   • Price-negotiable banner branches — no Make-offer variant here;
 *     single Contact-seller CTA keeps the page unambiguous.
 *
 * The design is intentionally plain. A global redesign is coming; a
 * functional detail page that unblocks the buyer loop is the point.
 *
 * ISR revalidate=60 — matches rides + properties.
 */

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const listing = await getGenericListingBySlug(params.slug, { locale: params.locale });
  if (!listing) {
    return { title: 'Listing · Dealo Hub', robots: { index: false, follow: false } };
  }
  const description = listing.description.slice(0, 160);
  const cover = listing.images[0]?.url;
  return {
    title: `${listing.title} · Dealo Hub`,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: 'website',
      images: cover ? [cover] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function GenericListingPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; slug: string }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'listingDetail',
  });
  const tCond = await getTranslations({
    locale: params.locale,
    namespace: 'sell.condition',
  });
  const tDelivery = await getTranslations({
    locale: params.locale,
    namespace: 'sell.delivery',
  });

  const listing = await getGenericListingBySlug(params.slug, {
    locale: params.locale,
  });
  if (!listing) notFound();

  const cover = listing.images[0]?.url ?? null;
  const gallery = listing.images.slice(1, 5);

  const createdDate = new Date(listing.createdAt).toLocaleDateString(
    params.locale === 'ar' ? 'ar-KW' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-10">
      {/* Breadcrumb */}
      <nav
        className="mb-3 flex items-center gap-1.5 text-xs text-foreground/60"
        aria-label="breadcrumb"
      >
        <Link href={`/${params.locale}/`} className="hover:text-foreground">
          {t('crumbHome')}
        </Link>
        <span className="text-foreground/30">/</span>
        <span className="uppercase tracking-wide">{listing.categoryName}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Cover */}
          {cover ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-foreground/5">
              <Image
                src={cover}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
              {listing.isFeatured && (
                <span className="absolute start-3 top-3 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  {t('featured')}
                </span>
              )}
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-foreground/[0.02] text-sm text-foreground/40">
              {t('noPhoto')}
            </div>
          )}

          {/* Gallery thumbnails */}
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map(img => (
                <div
                  key={img.url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-foreground/5"
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? listing.title}
                    fill
                    sizes="(max-width: 768px) 25vw, 15vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Title + header */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
              {listing.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground/60">
              {listing.verificationTier !== 'unverified' && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  {listing.verificationTier === 'dealo_inspected'
                    ? t('tierDealoInspected')
                    : t('tierAiVerified')}
                </span>
              )}
              {(listing.areaName || listing.cityName) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} />
                  {[listing.areaName, listing.cityName]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                {createdDate}
              </span>
            </div>

            {/* Condition + brand/model chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80">
                {tCond(`${listing.condition}.label` as any)}
              </span>
              {listing.brand && (
                <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80">
                  {listing.brand}
                </span>
              )}
              {listing.model && (
                <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80">
                  {listing.model}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              {t('descriptionTitle')}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {listing.description}
            </p>
          </section>

          {/* Delivery options */}
          {listing.deliveryOptions.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
                {t('deliveryTitle')}
              </h2>
              <ul className="flex flex-wrap gap-2 text-xs text-foreground/80">
                {listing.deliveryOptions.map(opt => (
                  <li
                    key={opt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5"
                  >
                    <Package size={12} />
                    {tDelivery(`${opt}.label` as any)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Stats strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/40 pt-4 text-[11px] text-foreground/55">
            <span>
              <strong className="text-foreground/80">
                {listing.viewCount.toLocaleString('en-US')}
              </strong>{' '}
              {t('statViews')}
            </span>
            <span>
              <strong className="text-foreground/80">
                {listing.saveCount.toLocaleString('en-US')}
              </strong>{' '}
              {t('statSaves')}
            </span>
            <span>
              <strong className="text-foreground/80">
                {listing.chatInitiationCount.toLocaleString('en-US')}
              </strong>{' '}
              {t('statInquiries')}
            </span>
            <span>
              <strong className="text-foreground/80">
                {listing.images.length}
              </strong>{' '}
              {t('statPhotos')}
            </span>
          </div>
        </div>

        {/* ── Right column (purchase panel) ── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background p-5 md:sticky md:top-20">
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                {t('priceLabel')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground md:text-3xl">
                  {formatPrice(
                    listing.priceMinorUnits,
                    listing.currencyCode,
                    params.locale,
                  )}
                </span>
                {listing.oldPriceMinorUnits && (
                  <span className="text-sm text-foreground/40 line-through">
                    {formatPrice(
                      listing.oldPriceMinorUnits,
                      listing.currencyCode,
                      params.locale,
                    )}
                  </span>
                )}
              </div>
              {listing.priceMode !== 'fixed' && (
                <span className="inline-block rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-400">
                  {t('negotiableBadge')}
                </span>
              )}
            </div>

            <div className="mt-5">
              <ContactSellerButton
                listingId={listing.id}
                locale={params.locale}
                variant="primary"
              />
            </div>

            {/* Seller mini-card */}
            <div className="mt-5 border-t border-border/40 pt-4">
              <Link
                href={
                  listing.seller.handle
                    ? `/${params.locale}/profile/${listing.seller.handle}`
                    : '#'
                }
                className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-foreground/[0.03]"
              >
                {listing.seller.avatarUrl ? (
                  <Image
                    src={listing.seller.avatarUrl}
                    alt={listing.seller.displayName}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold text-foreground/60">
                    {listing.seller.displayName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {listing.seller.isDealer && listing.seller.dealerName
                      ? listing.seller.dealerName
                      : listing.seller.displayName}
                  </p>
                  <p className="truncate text-[11px] text-foreground/55">
                    {listing.seller.isDealer
                      ? t('dealerSeller')
                      : t('privateSeller')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
