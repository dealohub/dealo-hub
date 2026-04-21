'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';
import { captureError } from '@/lib/observability/capture';

/**
 * Locale-scoped error boundary — catches errors thrown anywhere inside
 * /{locale}/… segments during render.
 *
 * Unlike `app/global-error.tsx` this one still has:
 *   - The ThemeProvider + NextIntlClientProvider in the tree above it
 *   - The site's fonts, dir, and palette
 * So it can render a branded, localized page instead of the bare
 * fallback.
 *
 * Calls `captureError` which pushes to Sentry (if configured) or
 * server-side console otherwise — so the stack survives the
 * client-side crash.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.boundary');
  const locale = useLocale() as 'ar' | 'en';

  useEffect(() => {
    captureError(error, { scope: 'locale-error-boundary', digest: error.digest });
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-16">
      <main className="max-w-md text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertTriangle size={24} aria-hidden />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          {t('title')}
        </h1>
        <p className="mb-1.5 text-sm leading-relaxed text-foreground/70">
          {t('body')}
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-[11px] text-foreground/40">
            ref: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-6" />}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RotateCw size={14} />
            {t('retry')}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {t('home')}
          </Link>
        </div>
      </main>
    </div>
  );
}
