import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Search as SearchIcon, Sparkles, Package } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import SearchInput from '@/components/search/search-input';
import SearchResultCard from '@/components/search/search-result-card';
import { searchListings } from '@/lib/search/queries';
import { parseFiltersFromSearchParams } from '@/lib/browse/filters';

/**
 * /search — hybrid keyword + semantic search results.
 *
 * Wraps `searchListings` (src/lib/search/queries.ts) which does the
 * 70% semantic / 30% keyword merge. "Smart search" badge shows when
 * the OpenAI embedding succeeded (semanticUsed=true); fail-open
 * behaviour means search still works on keyword-only even when the
 * LLM is down or not configured.
 */

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: 'ar' | 'en' };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'search' });
  const q = (searchParams.q as string | undefined)?.trim();
  return {
    title: q ? t('metaTitleWithQuery', { query: q }) : t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { locale: 'ar' | 'en' };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'search' });
  const q = ((searchParams.q as string | undefined) ?? '').trim();
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams(
      Object.entries(searchParams).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map(vv => [k, vv] as [string, string]) : v ? [[k, v]] : [],
      ),
    ),
  );

  const { result, semanticUsed } = await searchListings(q, filters, params.locale);

  return (
    <>
      <EcommerceNavbar1 />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Search bar */}
        <div className="mb-6">
          <SearchInput
            locale={params.locale}
            initialValue={q}
            autoFocus={!q}
            size="lg"
          />
          {semanticUsed && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
              <Sparkles size={10} />
              {t('aiEnabled')}
            </p>
          )}
        </div>

        {/* States */}
        {!q ? (
          <EmptyQuery
            title={t('emptyQueryTitle')}
            hint={t('emptyQueryHint')}
          />
        ) : result.total === 0 ? (
          <NoResults
            query={q}
            hint={t('noResultsHint', { query: q })}
            locale={params.locale}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h1 className="font-sans text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {t('header.title', { query: q })}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/60">
                  {t('header.resultCount', { count: result.total })}
                </span>
                {semanticUsed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                    <Sparkles size={9} />
                    {t('header.smartSearch')}
                  </span>
                )}
              </div>
            </div>

            {/* Results — vertical list (wider cards, easier scanning for search) */}
            <div className="space-y-3">
              {result.rows.map(r => (
                <SearchResultCard key={r.id} card={r} locale={params.locale} />
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}

function EmptyQuery({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
      <SearchIcon size={32} className="text-foreground/30" />
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-foreground/60">{hint}</p>
      </div>
    </div>
  );
}

function NoResults({
  query,
  hint,
  locale,
}: {
  query: string;
  hint: string;
  locale: 'ar' | 'en';
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
      <Package size={28} className="text-foreground/30" />
      <div>
        <p className="text-base font-semibold text-foreground">
          "{query}"
        </p>
        <p className="mt-1 max-w-md text-sm text-foreground/60">{hint}</p>
      </div>
      <div className="mt-2 flex gap-2">
        <Link
          href={`/${locale}/categories`}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          /categories
        </Link>
        <Link
          href={`/${locale}/rides`}
          className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
        >
          /rides
        </Link>
        <Link
          href={`/${locale}/properties`}
          className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
        >
          /properties
        </Link>
        <Link
          href={`/${locale}/tech`}
          className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
        >
          /tech
        </Link>
        <Link
          href={`/${locale}/services`}
          className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
        >
          /services
        </Link>
      </div>
    </div>
  );
}
