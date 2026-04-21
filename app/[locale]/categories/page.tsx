import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import * as Icons from 'lucide-react';
import { Package } from 'lucide-react';
import { getTopLevelCategoriesWithCounts } from '@/lib/browse/category-queries';

/**
 * /categories — top-level category index.
 *
 * The top-of-funnel browsing entry point. Lists every active top-level
 * category (12 today) as a tile with its live-listing count. Tiles
 * link to `/categories/[slug]`, which either:
 *   • Redirects to a dedicated vertical hub (Automotive → /rides,
 *     Real Estate → /properties), OR
 *   • Renders the generic per-category browse grid for everything else.
 *
 * Why this page exists:
 *   The navbar has a "Browse" entry point but until now had nowhere to
 *   send the user — `href="#"`. Sellers can publish to any of the 12
 *   categories; buyers had no scaffold to discover them outside of
 *   search or the editorial home strips. This is that scaffold.
 *
 * Visual: minimal grid of icon tiles. The global redesign will polish
 * — the goal here is to ship the route + navigation primitives so the
 * funnel is unbroken.
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
    namespace: 'browse.index',
  });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

// ---------------------------------------------------------------------------
// Icon resolver — categories.icon stores a Lucide name as a string
// ---------------------------------------------------------------------------

// Lucide icons are typed as ForwardRefExoticComponent which doesn't
// satisfy a plain ComponentType union — we cast through `any` here so
// the dynamic resolver is callable in JSX without per-icon typing.
type IconLike = (props: { size?: number; className?: string }) => JSX.Element;

function resolveIcon(name: string | null): IconLike {
  if (!name) return Package as unknown as IconLike;
  // Some entries are lowercase (e.g. 'home'); Lucide exports are
  // PascalCase. Try both.
  const direct = (Icons as any)[name];
  if (direct) return direct as IconLike;
  const pascal = name
    .split(/[-_\s]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
  return ((Icons as any)[pascal] ?? Package) as IconLike;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoriesIndexPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'browse.index',
  });
  const tBrowse = await getTranslations({
    locale: params.locale,
    namespace: 'browse.category',
  });

  const categories = await getTopLevelCategoriesWithCounts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="text-sm text-foreground/60">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map(cat => {
          const Icon = resolveIcon(cat.icon);
          const name = params.locale === 'ar' ? cat.nameAr : cat.nameEn;
          const href = `/${params.locale}/categories/${cat.slug}`;
          const hasListings = cat.liveCount > 0;

          return (
            <Link
              key={cat.id}
              href={href}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-background p-5 transition hover:border-border hover:bg-foreground/[0.02]"
            >
              <span
                className={
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl transition ' +
                  (hasListings
                    ? 'bg-primary/10 text-primary group-hover:bg-primary/15'
                    : 'bg-foreground/5 text-foreground/50')
                }
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">{name}</h2>
                <p className="text-[11px] text-foreground/55">
                  {hasListings
                    ? tBrowse('resultCount', { count: cat.liveCount })
                    : '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
