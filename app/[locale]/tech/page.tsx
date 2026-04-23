import type { Metadata } from 'next';
import * as React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Smartphone,
  Laptop,
  Tv,
  Gamepad2,
  Watch,
  Camera,
  Package,
  ShieldCheck,
  Battery,
  Fingerprint,
  Store,
  BadgeCheck,
  Sparkle,
} from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import ListingCardElectronics from '@/components/shadcnblocks/listing-card-electronics';
import ElectronicsLiveFeed from '@/components/shadcnblocks/electronics-live-feed';
import ElectronicsArticlesStrip from '@/components/shadcnblocks/electronics-articles-strip';
import {
  getFeaturedElectronics,
  getElectronicsForGrid,
  getElectronicsSubCatCounts,
  getRecentElectronicsActivity,
} from '@/lib/electronics/queries';
import type { ElectronicsCategoryKey } from '@/lib/electronics/types';

/**
 * /tech — Electronics vertical hub (Phase 7 v2).
 *
 * 5-section composition (deliberately tighter than /properties' 7 — we
 * dropped LiveFeed and Articles strip to keep the page focused):
 *
 *   1. Hero — eyebrow + headline + subline + live stats + sell CTA
 *   2. Browse by type — 6 sub-cat tiles with icons + per-tile counts
 *   3. Featured strip — top 6 by verification tier × featured × recency
 *   4. Trust strip — 4 doctrine pillars with evidence-grounded copy
 *      (catalog / imei / battery / provenance); footer notes the
 *      counterfeit blocklist
 *   5. Main grid — all live electronics (24 cards) with CTA to
 *      view everything in /categories/electronics when the grid
 *      overflows
 *
 * All sections read from `src/lib/electronics/queries.ts`. Page is
 * server-rendered with ISR revalidate=60; cards are RLS-respecting.
 */

export const revalidate = 60;

const SUB_CATS: ElectronicsCategoryKey[] = [
  'phones-tablets',
  'laptops-computers',
  'tvs-audio',
  'gaming',
  'smart-watches',
  'cameras',
];

type IconLike = (props: { size?: number; className?: string }) => React.JSX.Element;

const SUB_CAT_ICON: Record<ElectronicsCategoryKey, IconLike> = {
  'phones-tablets': Smartphone as unknown as IconLike,
  'laptops-computers': Laptop as unknown as IconLike,
  'tvs-audio': Tv as unknown as IconLike,
  gaming: Gamepad2 as unknown as IconLike,
  'smart-watches': Watch as unknown as IconLike,
  cameras: Camera as unknown as IconLike,
};

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsHub',
  });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ElectronicsHubPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsHub',
  });

  const [featured, grid, counts, activity] = await Promise.all([
    getFeaturedElectronics({ locale: params.locale, limit: 6 }),
    getElectronicsForGrid({ locale: params.locale, limit: 24 }),
    getElectronicsSubCatCounts(),
    getRecentElectronicsActivity({ locale: params.locale, limit: 12 }),
  ]);

  const totalLive = SUB_CATS.reduce((sum, k) => sum + counts[k], 0);
  const inspectedCount = featured.filter(
    c => c.verificationTier === 'dealo_inspected',
  ).length;

  return (
    <>
      <EcommerceNavbar1 />

      <main className="pb-16 pt-10">
        <div className="mx-auto max-w-7xl px-6">
        {/* ── 1. Hero ── */}
        <section className="mb-12 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkle size={11} />
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t('headline')}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/70">
              {t('subline')}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm text-foreground/70">
              <span>
                <strong className="tabular-nums text-foreground">{totalLive}</strong>{' '}
                {t('statsListings')}
              </span>
              {inspectedCount > 0 && (
                <span>
                  <strong className="tabular-nums text-foreground">
                    {inspectedCount}
                  </strong>{' '}
                  {t('statsInspected')}
                </span>
              )}
              <Link
                href={`/${params.locale}/sell/category`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {t('sellCta')}
              </Link>
            </div>
          </div>

          {/* Decorative hero panel — 3 trust chips stacked, no stock imagery */}
          <aside className="hidden rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-500/[0.04] via-background to-sky-500/[0.04] p-6 shadow-sm lg:block">
            <div className="space-y-3">
              <HeroChip
                icon={<Fingerprint size={14} />}
                title={t('trust.imei.title')}
                body={t('trust.imei.body')}
                tint="emerald"
              />
              <HeroChip
                icon={<Battery size={14} />}
                title={t('trust.battery.title')}
                body={t('trust.battery.body')}
                tint="sky"
              />
              <HeroChip
                icon={<Store size={14} />}
                title={t('trust.provenance.title')}
                body={t('trust.provenance.body')}
                tint="indigo"
              />
            </div>
          </aside>
        </section>
        </div>

        {/* ── 1.5 LiveFeed — full-width banner ── */}
        {activity.length > 0 && <ElectronicsLiveFeed items={activity} />}

        <div className="mx-auto max-w-7xl px-6 pt-12">
        {/* ── 2. Browse by type ── */}
        <section className="mb-12 space-y-4">
          <header>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t('typesTitle')}
            </h2>
            <p className="text-sm text-foreground/55">{t('typesSubline')}</p>
          </header>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {SUB_CATS.map(slug => {
              const Icon = SUB_CAT_ICON[slug];
              const c = counts[slug];
              const has = c > 0;
              return (
                <Link
                  key={slug}
                  href={`/${params.locale}/categories/${slug}`}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-border hover:bg-foreground/[0.02] hover:shadow-sm"
                >
                  <span
                    className={
                      'inline-flex h-10 w-10 items-center justify-center rounded-xl transition ' +
                      (has
                        ? 'bg-primary/10 text-primary group-hover:bg-primary/15'
                        : 'bg-foreground/[0.06] text-foreground/45')
                    }
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {t(`types.${slug}` as any)}
                    </p>
                    <p className="text-[11px] text-foreground/55">
                      {has ? `${c} ${t('listingsShort')}` : '—'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 3. Featured strip ── */}
        {featured.length > 0 && (
          <section className="mb-12 space-y-4">
            <header className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {t('featuredTitle')}
              </h2>
              <p className="text-[11px] text-foreground/55">{t('featuredSubline')}</p>
            </header>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((card, i) => (
                <ListingCardElectronics
                  key={card.id}
                  card={card}
                  locale={params.locale}
                  priority={i < 3}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Trust strip (doctrine pillars surfaced) ── */}
        <section className="mb-12 rounded-2xl border border-border/60 bg-foreground/[0.02] p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">
            {t('trustTitle')}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustPillar
              icon={<BadgeCheck size={14} />}
              title={t('trust.catalog.title')}
              body={t('trust.catalog.body')}
            />
            <TrustPillar
              icon={<Fingerprint size={14} />}
              title={t('trust.imei.title')}
              body={t('trust.imei.body')}
            />
            <TrustPillar
              icon={<Battery size={14} />}
              title={t('trust.battery.title')}
              body={t('trust.battery.body')}
            />
            <TrustPillar
              icon={<Store size={14} />}
              title={t('trust.provenance.title')}
              body={t('trust.provenance.body')}
            />
          </ul>
          <p className="mt-4 inline-flex items-start gap-1.5 text-[11px] text-foreground/55">
            <ShieldCheck size={11} className="mt-0.5 shrink-0 text-emerald-600" />
            {t('trustFootnote')}
          </p>
        </section>

        {/* ── 5. Main grid ── */}
        <section className="space-y-4">
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t('gridTitle')}
            </h2>
            {grid.length > 0 && (
              <Link
                href={`/${params.locale}/categories/electronics`}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('viewAll')}
              </Link>
            )}
          </header>
          {grid.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-foreground/[0.02] px-6 py-12 text-center">
              <Package size={32} className="mx-auto text-foreground/30" />
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {t('emptyTitle')}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-foreground/60">
                {t('emptyBody')}
              </p>
              <Link
                href={`/${params.locale}/sell/category`}
                className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t('emptyCta')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map(card => (
                <ListingCardElectronics
                  key={card.id}
                  card={card}
                  locale={params.locale}
                />
              ))}
            </div>
          )}
        </section>
        </div>

        {/* ── 6. Articles strip — full-width editorial banner ── */}
        <ElectronicsArticlesStrip />
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}

// ---------------------------------------------------------------------------
// Presentation primitives
// ---------------------------------------------------------------------------

function HeroChip({
  icon,
  title,
  body,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tint: 'emerald' | 'sky' | 'indigo';
}) {
  const bg =
    tint === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
      : tint === 'sky'
        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20'
        : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20';
  return (
    <div className="space-y-1.5 rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/50">
      <p className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${bg}`}>
        <span>{icon}</span>
        {title}
      </p>
      <p className="text-[13px] leading-relaxed text-foreground/70">{body}</p>
    </div>
  );
}

function TrustPillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="space-y-2 rounded-xl bg-background p-4 shadow-sm ring-1 ring-border/50">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      <p className="text-xs leading-relaxed text-foreground/65">{body}</p>
    </li>
  );
}
