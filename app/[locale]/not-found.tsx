import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Home, Search, Compass } from 'lucide-react';

/**
 * 404 — branded, localized fallback when a route isn't found.
 *
 * Triggered by:
 *   - Explicit `notFound()` from a Server Component
 *   - Any path under /[locale]/ that has no matching file
 *
 * Keeps the navbar/footer intact (this is rendered inside the locale
 * layout tree), but replaces the main slot with a friendly branded
 * page giving the user three clear next actions.
 */
export default async function LocaleNotFound() {
  const locale = (await getLocale()) as 'ar' | 'en';
  const t = await getTranslations({ locale, namespace: 'errors.notFound' });

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-16">
      <main className="max-w-lg text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass size={28} aria-hidden />
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
          404
        </p>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          {t('title')}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-foreground/70">
          {t('body')}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href={`/${locale}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Home size={14} />
            {t('ctaHome')}
          </Link>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
          >
            <Search size={14} />
            {t('ctaSearch')}
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-foreground/50">
          <Link
            href={`/${locale}/rides`}
            className="transition hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('shortcutRides')}
          </Link>
          <Link
            href={`/${locale}/properties`}
            className="transition hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('shortcutProperties')}
          </Link>
          <Link
            href={`/${locale}/sell/category`}
            className="transition hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('shortcutSell')}
          </Link>
        </div>
      </main>
    </div>
  );
}
