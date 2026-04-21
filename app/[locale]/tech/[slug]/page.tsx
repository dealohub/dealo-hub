import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  CheckCircle2,
  ShieldCheck,
  Battery,
  BatteryWarning,
  Smartphone,
  MapPin,
  Calendar,
  Package,
  Wrench,
  Globe,
  Receipt,
  Repeat,
  Cpu,
  HardDrive,
  Monitor,
} from 'lucide-react';
import {
  getElectronicsBySlug,
  getSimilarElectronics,
} from '@/lib/electronics/queries';
import { batteryHealthBand } from '@/lib/electronics/validators';
import ContactSellerButton from '@/components/chat/contact-seller-button';
import { formatPrice } from '@/lib/format';

/**
 * /tech/[slug] — electronics detail page (Phase 7c).
 *
 * Renders the 28-field ElectronicsFields shape grouped into the 5
 * doctrine-aligned sections from PHASE-7A:
 *   1. Identity        — device kind + brand + model + year
 *   2. Specs           — storage / RAM / CPU / GPU / screen / connectivity
 *   3. Trust panel (P6) — warranty + receipt + purchase country
 *   4. Battery health (P4) — colored bar (green/amber/red) + cycles for laptops
 *   5. Region & lock (P5) — region spec + carrier lock chips
 *
 * Plus an honest disclosure card listing repair history (P8) +
 * accessories included (P7) + box status (P7) + condition grade (P9)
 * + IMEI last-4 (P3 — buyer can verify against operator at handover).
 *
 * MVP single-file composition — global redesign will split this into
 * proper /components/electronics/* later. The point right now is a
 * functional surface so buyers can land on a tech listing.
 *
 * ISR revalidate=60.
 */

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en'; slug: string };
}): Promise<Metadata> {
  const listing = await getElectronicsBySlug(params.slug, { locale: params.locale });
  if (!listing) {
    return { title: 'Dealo Hub', robots: { index: false, follow: false } };
  }
  const description = listing.description.slice(0, 160);
  const cover = listing.images[0]?.url;
  return {
    title: listing.title,
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

export default async function ElectronicsDetailPage({
  params,
}: {
  params: { locale: 'ar' | 'en'; slug: string };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsDetail',
  });
  const tE = await getTranslations({
    locale: params.locale,
    namespace: 'sell.step.electronics',
  });

  const listing = await getElectronicsBySlug(params.slug, {
    locale: params.locale,
  });
  if (!listing) notFound();

  const similar = await getSimilarElectronics(listing.id, 4, {
    locale: params.locale,
  });

  const f = listing.fields;
  const cover = listing.images[0]?.url ?? null;
  const gallery = listing.images.slice(1, 5);
  const createdDate = new Date(listing.createdAt).toLocaleDateString(
    params.locale === 'ar' ? 'ar-KW' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  // Battery-health computed
  const batteryBand = batteryHealthBand(f.batteryHealthPct ?? null);
  const batteryFill =
    batteryBand === 'green'
      ? 'bg-emerald-500'
      : batteryBand === 'amber'
        ? 'bg-amber-500'
        : batteryBand === 'red'
          ? 'bg-rose-500'
          : 'bg-foreground/20';

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
        <Link
          href={`/${params.locale}/tech`}
          className="hover:text-foreground"
        >
          {t('crumbTech')}
        </Link>
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
              {listing.verificationTier !== 'unverified' && (
                <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  <ShieldCheck size={11} />
                  {listing.verificationTier === 'dealo_inspected'
                    ? t('tierDealoInspected')
                    : t('tierAiVerified')}
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

          {/* Title + meta */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground/60">
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 font-medium text-foreground/80">
                <Smartphone size={12} />
                {tE(`deviceKind.${f.deviceKind}` as any)}
              </span>
              <span className="font-medium text-foreground/80">
                {f.brand} {f.model}
                {f.yearOfRelease ? ` · ${f.yearOfRelease}` : ''}
              </span>
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

            {/* Condition grade chip */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ' +
                  (f.conditionGrade === 'mint'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : f.conditionGrade === 'excellent'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : f.conditionGrade === 'good'
                        ? 'bg-foreground/[0.08] text-foreground/80'
                        : f.conditionGrade === 'fair'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')
                }
              >
                {tE(`grade.${f.conditionGrade}` as any)}
              </span>
              {f.boxStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80">
                  <Package size={11} />
                  {tE(`box.${f.boxStatus}` as any)}
                </span>
              )}
              {f.originalParts && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={11} />
                  {t('originalPartsBadge')}
                </span>
              )}
              {f.acceptsTrade && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
                  <Repeat size={11} />
                  {t('tradeBadge')}
                </span>
              )}
            </div>
          </div>

          {/* ── Battery health (P4) ── */}
          {f.batteryHealthPct != null && (
            <section className="rounded-xl border border-border/60 p-4">
              <h2 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                <Battery size={14} />
                {t('batteryHealthTitle')}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {f.batteryHealthPct}%
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                  <div
                    className={`h-full transition-all ${batteryFill}`}
                    style={{ width: `${f.batteryHealthPct}%` }}
                  />
                </div>
              </div>
              {f.batteryCycles != null && (
                <p className="mt-2 text-xs text-foreground/55">
                  {t('batteryCyclesLine', { n: f.batteryCycles })}
                </p>
              )}
            </section>
          )}

          {f.batteryHealthPct == null &&
            (f.deviceKind === 'phone' ||
              f.deviceKind === 'tablet' ||
              f.deviceKind === 'laptop' ||
              f.deviceKind === 'smart_watch') && (
              <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="inline-flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <BatteryWarning size={14} className="mt-0.5 shrink-0" />
                  {t('batteryUndisclosed')}
                </p>
              </section>
            )}

          {/* ── Spec table ── */}
          <section className="space-y-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
              <Cpu size={14} />
              {t('specsTitle')}
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-xl border border-border/60 p-4 text-sm sm:grid-cols-2">
              {f.storageGb != null && (
                <SpecRow icon={<HardDrive size={11} />} label={tE('storageGbLabel')} value={`${f.storageGb} GB`} />
              )}
              {f.ramGb != null && (
                <SpecRow label={tE('ramGbLabel')} value={`${f.ramGb} GB`} />
              )}
              {f.cpu && <SpecRow label={tE('cpuLabel')} value={f.cpu} />}
              {f.gpu && <SpecRow label={tE('gpuLabel')} value={f.gpu} />}
              {f.storageType && (
                <SpecRow
                  label={tE('storageTypeLabel')}
                  value={tE(`storageType.${f.storageType}` as any)}
                />
              )}
              {f.screenSizeInches != null && (
                <SpecRow
                  icon={<Monitor size={11} />}
                  label={tE('screenSizeInchesLabel')}
                  value={`${f.screenSizeInches}"`}
                />
              )}
              {f.resolution && (
                <SpecRow
                  label={tE('resolutionLabel')}
                  value={tE(`resolution.${f.resolution}` as any)}
                />
              )}
              {f.lensMount && (
                <SpecRow
                  label={tE('lensMountLabel')}
                  value={tE(`lensMount.${f.lensMount}` as any)}
                />
              )}
              {f.connectivity.length > 0 && (
                <SpecRow
                  label={tE('connectivityLabel')}
                  value={f.connectivity
                    .map(c => tE(`connectivity.${c}` as any))
                    .join(', ')}
                />
              )}
            </dl>
          </section>

          {/* ── Region & lock (P5) ── */}
          {(f.regionSpec || f.carrierLock) && (
            <section className="space-y-2">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                <Globe size={14} />
                {t('regionLockTitle')}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {f.regionSpec && (
                  <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80">
                    {tE(`region.${f.regionSpec}` as any)}
                  </span>
                )}
                {f.carrierLock && (
                  <span
                    className={
                      'rounded-full px-3 py-1 text-[11px] font-medium ' +
                      (f.carrierLock === 'unlocked'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')
                    }
                  >
                    {tE(`carrier.${f.carrierLock}` as any)}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* ── IMEI last-4 (P3) ── */}
          {f.serialOrImeiLast4 && (
            <section className="rounded-xl border border-border/60 bg-foreground/[0.02] p-4">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                {t('imeiTitle')}
              </h2>
              <p className="text-sm text-foreground/85">
                {t('imeiLastDigits', { digits: f.serialOrImeiLast4 })}
              </p>
              <p className="mt-1 text-[11px] text-foreground/55">
                {t('imeiHelp')}
              </p>
            </section>
          )}

          {/* ── Trust panel: warranty + receipt (P6) ── */}
          {(f.warrantyStatus || f.purchaseCountry || f.hasOriginalReceipt) && (
            <section className="rounded-xl border border-border/60 p-4 space-y-2">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                <Receipt size={14} />
                {t('trustPanelTitle')}
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {f.warrantyStatus && (
                  <SpecRow
                    label={tE('warrantyStatusLabel')}
                    value={tE(`warranty.${f.warrantyStatus}` as any)}
                  />
                )}
                {f.warrantyExpiresAt && (
                  <SpecRow
                    label={tE('warrantyExpiresAtLabel')}
                    value={f.warrantyExpiresAt}
                  />
                )}
                {f.purchaseCountry && (
                  <SpecRow
                    label={tE('purchaseCountryLabel')}
                    value={tE(`country.${f.purchaseCountry}` as any)}
                  />
                )}
                {f.hasOriginalReceipt && (
                  <SpecRow
                    label={tE('hasOriginalReceiptLabel')}
                    value={t('yes')}
                  />
                )}
              </dl>
            </section>
          )}

          {/* ── Repair history (P8) + accessories (P7) ── */}
          {(f.repairHistory.length > 0 || f.accessoriesIncluded.length > 0) && (
            <section className="space-y-3">
              {f.repairHistory.length > 0 && (
                <div>
                  <h2 className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                    <Wrench size={14} />
                    {t('repairHistoryTitle')}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {f.repairHistory.map(r => (
                      <span
                        key={r}
                        className={
                          'rounded-full px-3 py-1 text-[11px] font-medium ' +
                          (r === 'none'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-foreground/[0.06] text-foreground/80')
                        }
                      >
                        {tE(`repair.${r}` as any)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {f.accessoriesIncluded.length > 0 && (
                <div>
                  <h2 className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground/70">
                    <Package size={14} />
                    {t('accessoriesTitle')}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {f.accessoriesIncluded.map(a => (
                      <span
                        key={a}
                        className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-foreground/80"
                      >
                        {tE(`accessory.${a}` as any)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Description ── */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              {t('descriptionTitle')}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {listing.description}
            </p>
          </section>

          {/* ── Trade badge (P11) ── */}
          {f.acceptsTrade && f.tradeForModels && (
            <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
              <h2 className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Repeat size={14} />
                {t('tradeAcceptedTitle')}
              </h2>
              <p className="text-sm text-foreground/85">{f.tradeForModels}</p>
            </section>
          )}

          {/* ── Stats strip ── */}
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
              <strong className="text-foreground/80">{listing.images.length}</strong>{' '}
              {t('statPhotos')}
            </span>
          </div>

          {/* ── Similar ── */}
          {similar.length > 0 && (
            <section className="space-y-3 border-t border-border/40 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
                {t('similarTitle')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {similar.map(card => (
                  <Link
                    key={card.id}
                    href={`/${params.locale}/tech/${card.slug ?? card.id}`}
                    className="group block overflow-hidden rounded-xl border border-border/60 bg-background transition hover:border-border"
                  >
                    {card.cover && (
                      <div className="relative aspect-[4/3] bg-foreground/5">
                        <Image
                          src={card.cover}
                          alt={card.title}
                          fill
                          sizes="25vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-1 text-xs font-semibold text-foreground">
                        {card.title}
                      </p>
                      <p className="text-[11px] text-foreground/55">
                        {card.brand} {card.model}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(
                          card.priceMinorUnits,
                          card.currencyCode,
                          params.locale,
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
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
              {listing.isPriceNegotiable && (
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

// ---------------------------------------------------------------------------
// Local helper — spec row
// ---------------------------------------------------------------------------

function SpecRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/30 py-1 last:border-b-0">
      <dt className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
        {icon}
        {label}
      </dt>
      <dd className="text-end text-sm text-foreground/85">{value}</dd>
    </div>
  );
}
