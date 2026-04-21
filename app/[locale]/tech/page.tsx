import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import {
  Smartphone,
  Laptop,
  Tv,
  Gamepad2,
  Watch,
  Camera,
  ShieldCheck,
  Battery,
  Globe,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import {
  getFeaturedElectronics,
  getElectronicsForGrid,
  getElectronicsSubCatCounts,
} from '@/lib/electronics/queries';
import { formatPrice } from '@/lib/format';
import type { ElectronicsCategoryKey } from '@/lib/electronics/types';

/**
 * /tech — Electronics vertical hub (Phase 7d).
 *
 * 5-section composition (mirrors /properties hub but tighter):
 *   1. Hero — title + sub + live stats (count + Dealo-Inspected count)
 *   2. Browse-by-type — 6 sub-cat tiles with icons + live counts
 *   3. Featured strip — top 6 by verification_tier + featured + recency
 *   4. Trust strip — 4 doctrine pillars named explicitly (P3, P4, P5, P6)
 *   5. Main grid — recent live listings (24)
 *
 * Visual: minimal, MVP-grade. Global redesign will polish — point
 * here is a functional discovery surface so buyers can browse
 * electronics by sub-cat instead of typing-search-only.
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
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsHub',
  });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

// ---------------------------------------------------------------------------
// Sub-cat tile metadata
// ---------------------------------------------------------------------------

// Lucide icons resolve as ForwardRefExoticComponent; loosely-type the
// container so the JSX call site doesn't have to import LucideProps.
type IconLike = (props: { size?: number; className?: string }) => JSX.Element;

const SUB_CAT_ICONS: Record<ElectronicsCategoryKey, IconLike> = {
  'phones-tablets': Smartphone as unknown as IconLike,
  'laptops-computers': Laptop as unknown as IconLike,
  'tvs-audio': Tv as unknown as IconLike,
  gaming: Gamepad2 as unknown as IconLike,
  'smart-watches': Watch as unknown as IconLike,
  cameras: Camera as unknown as IconLike,
};

const SUB_CATS: ElectronicsCategoryKey[] = [
  'phones-tablets',
  'laptops-computers',
  'tvs-audio',
  'gaming',
  'smart-watches',
  'cameras',
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ElectronicsHubPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsHub',
  });
  const tType = await getTranslations({
    locale: params.locale,
    namespace: 'electronicsHub.types',
  });

  const [featured, grid, counts] = await Promise.all([
    getFeaturedElectronics({ locale: params.locale, limit: 6 }),
    getElectronicsForGrid({ locale: params.locale, limit: 24 }),
    getElectronicsSubCatCounts(),
  ]);

  const totalLive = SUB_CATS.reduce((sum, k) => sum + counts[k], 0);
  const inspectedCount = featured.filter(
    f => f.verificationTier === 'dealo_inspected',
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-12">
      {/* ── 1. Hero ── */}
      <header className="mb-10 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
          {t('eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('headline')}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/65">
          {t('subline')}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-foreground/65">
          <span>
            <strong className="text-foreground/85">{totalLive}</strong>{' '}
            {t('statsListings')}
          </span>
          {inspectedCount > 0 && (
            <span>
              <strong className="text-foreground/85">{inspectedCount}</strong>{' '}
              {t('statsInspected')}
            </span>
          )}
          <span>
            <Link
              href={`/${params.locale}/sell/category`}
              className="font-medium text-primary hover:underline"
            >
              {t('sellCta')}
            </Link>
          </span>
        </div>
      </header>

      {/* ── 2. Browse by type ── */}
      <section className="mb-10 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t('typesTitle')}</h2>
          <p className="text-xs text-foreground/55">{t('typesSubline')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {SUB_CATS.map(slug => {
            const Icon = SUB_CAT_ICONS[slug];
            const c = counts[slug];
            const has = c > 0;
            return (
              <Link
                key={slug}
                href={`/${params.locale}/categories/${slug}`}
                className="group flex flex-col items-start gap-2.5 rounded-xl border border-border/60 bg-background p-4 transition hover:border-border hover:bg-foreground/[0.02]"
              >
                <span
                  className={
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg ' +
                    (has
                      ? 'bg-primary/10 text-primary'
                      : 'bg-foreground/5 text-foreground/45')
                  }
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {tType(slug as any)}
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

      {/* ── 3. Featured ── */}
      {featured.length > 0 && (
        <section className="mb-10 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {t('featuredTitle')}
            </h2>
            <p className="text-[11px] text-foreground/55">
              {t('featuredSubline')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(card => (
              <CardLink key={card.id} card={card} locale={params.locale} t={t} />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Trust strip ── */}
      <section className="mb-10 rounded-2xl border border-border/60 bg-foreground/[0.02] p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          {t('trustTitle')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TrustPillar
            icon={<ShieldCheck size={14} />}
            title={t('trust.imei.title')}
            body={t('trust.imei.body')}
          />
          <TrustPillar
            icon={<Battery size={14} />}
            title={t('trust.battery.title')}
            body={t('trust.battery.body')}
          />
          <TrustPillar
            icon={<Globe size={14} />}
            title={t('trust.region.title')}
            body={t('trust.region.body')}
          />
          <TrustPillar
            icon={<Receipt size={14} />}
            title={t('trust.warranty.title')}
            body={t('trust.warranty.body')}
          />
        </ul>
        <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] text-foreground/55">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          {t('trustFootnote')}
        </p>
      </section>

      {/* ── 5. Main grid ── */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">
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
        </div>
        {grid.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-foreground/[0.02] p-10 text-center">
            <h3 className="text-base font-semibold text-foreground">
              {t('emptyTitle')}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">{t('emptyBody')}</p>
            <Link
              href={`/${params.locale}/sell/category`}
              className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('emptyCta')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map(card => (
              <CardLink key={card.id} card={card} locale={params.locale} t={t} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

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
    <li className="space-y-1.5 rounded-xl bg-background p-3">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/75">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      <p className="text-xs leading-relaxed text-foreground/65">{body}</p>
    </li>
  );
}

function CardLink({
  card,
  locale,
  t,
}: {
  card: Awaited<ReturnType<typeof getFeaturedElectronics>>[number];
  locale: 'ar' | 'en';
  t: (key: any) => string;
}) {
  return (
    <Link
      href={`/${locale}/tech/${card.slug ?? card.id}`}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-background transition hover:border-border"
    >
      {card.cover && (
        <div className="relative aspect-[4/3] bg-foreground/5">
          <Image
            src={card.cover}
            alt={card.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {card.verificationTier !== 'unverified' && (
            <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
              <ShieldCheck size={10} />
              {card.verificationTier === 'dealo_inspected'
                ? t('badgeInspected')
                : t('badgeAi')}
            </span>
          )}
        </div>
      )}
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {card.title}
        </p>
        <p className="line-clamp-1 text-[11px] text-foreground/55">
          {card.brand} {card.model}
          {card.storageGb ? ` · ${card.storageGb} GB` : ''}
          {card.batteryHealthPct != null
            ? ` · ${card.batteryHealthPct}%`
            : ''}
        </p>
        <p className="text-base font-semibold text-foreground">
          {formatPrice(card.priceMinorUnits, card.currencyCode, locale)}
        </p>
      </div>
    </Link>
  );
}
