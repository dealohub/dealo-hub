'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

interface PaginationProps {
  current: number;
  total: number;
  className?: string;
}

export function Pagination({ current, total, className }: PaginationProps) {
  const t = useTranslations('browse.pagination');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useSearchParams();

  if (total <= 1) return null;

  function buildHref(page: number): string {
    const next = new URLSearchParams(params.toString());
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    const qs = next.toString();
    // Strip the /{locale} prefix for our locale-aware <Link>.
    const withoutLocale = pathname.replace(/^\/(ar|en)/, '');
    return qs ? `${withoutLocale}?${qs}` : withoutLocale || '/';
  }

  const prev = Math.max(1, current - 1);
  const next = Math.min(total, current + 1);
  const isRtl = locale === 'ar';
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label={t('label')}
      className={cn('flex items-center justify-center gap-2 mt-8', className)}
    >
      <Link
        href={buildHref(prev)}
        aria-disabled={current <= 1}
        className={cn(
          'inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-ghost-border bg-pure-surface text-body-small text-charcoal-ink',
          'hover:border-zinc-300 transition-colors',
          current <= 1 && 'pointer-events-none opacity-40'
        )}
      >
        <PrevIcon className="size-4" />
        <span>{t('prev')}</span>
      </Link>

      <span className="text-body-small text-muted-steel px-2 tabular-nums">
        {t('page', { current: formatCount(current, locale), total: formatCount(total, locale) })}
      </span>

      <Link
        href={buildHref(next)}
        aria-disabled={current >= total}
        className={cn(
          'inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-ghost-border bg-pure-surface text-body-small text-charcoal-ink',
          'hover:border-zinc-300 transition-colors',
          current >= total && 'pointer-events-none opacity-40'
        )}
      >
        <span>{t('next')}</span>
        <NextIcon className="size-4" />
      </Link>
    </nav>
  );
}
