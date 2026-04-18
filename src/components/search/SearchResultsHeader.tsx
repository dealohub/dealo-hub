import { useLocale, useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

interface SearchResultsHeaderProps {
  query: string;
  count: number;
  semanticUsed: boolean;
  className?: string;
}

export function SearchResultsHeader({
  query,
  count,
  semanticUsed,
  className,
}: SearchResultsHeaderProps) {
  const t = useTranslations('search.header');
  const locale = useLocale() as Locale;

  return (
    <header className={cn('flex flex-col gap-2 mb-6', className)}>
      <h1 className="text-heading-1 font-semibold text-charcoal-ink">
        {t('title', { query })}
      </h1>
      <div className="flex items-center gap-3 text-body-small text-muted-steel">
        <span className="tabular-nums">{t('resultCount', { count: formatCount(count, locale) })}</span>
        {semanticUsed && (
          <span className="inline-flex items-center gap-1.5 text-warm-amber-700">
            <Sparkles className="size-3.5" strokeWidth={2} />
            <span className="font-medium">{t('smartSearch')}</span>
          </span>
        )}
      </div>
    </header>
  );
}
