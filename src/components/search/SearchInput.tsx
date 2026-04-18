'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  initialQuery?: string;
  className?: string;
  /** Visual variant — `nav` is compact, `hero` is larger (home / search page). */
  variant?: 'nav' | 'hero';
}

/**
 * Search bar with subtle ✨ AI indicator. Submits to /search?q=...
 * Semantic search is the default lane — no setting to toggle.
 */
export function SearchInput({ initialQuery = '', className, variant = 'nav' }: SearchInputProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const height = variant === 'hero' ? 'h-12' : 'h-10';
  const textSize = variant === 'hero' ? 'text-body' : 'text-body-small';

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn('relative flex-1 max-w-2xl', className)}
    >
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-steel"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        className={cn(
          'w-full rounded-xl ps-10 pe-10 font-medium',
          'border-[1.5px] border-ghost-border bg-pure-surface',
          'text-charcoal-ink placeholder:text-muted-steel',
          'focus:outline-none focus:border-warm-amber focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]',
          'transition-[border,box-shadow] duration-150',
          height,
          textSize
        )}
      />
      <Sparkles
        className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-warm-amber/70"
        aria-hidden="true"
      />
      <span className="sr-only">{t('aiEnabled')}</span>
    </form>
  );
}
