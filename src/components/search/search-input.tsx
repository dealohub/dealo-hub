'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';

/**
 * SearchInput — the main search field for /search and (later) the
 * navbar quick-search.
 *
 * On submit, navigates to /{locale}/search?q=<query>. If the user
 * clears + submits, drops the `q` param entirely (returns to empty
 * search landing).
 */

interface Props {
  locale: 'ar' | 'en';
  initialValue?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'lg';
}

export default function SearchInput({
  locale,
  initialValue = '',
  autoFocus = false,
  size = 'lg',
}: Props) {
  const t = useTranslations('search');
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = value.trim();
    startTransition(() => {
      if (!q) router.push(`/${locale}/search`);
      else router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
    });
  }

  const isLg = size === 'lg';

  return (
    <form
      onSubmit={submit}
      role="search"
      className={
        'relative flex items-stretch gap-2 rounded-xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/30 ' +
        (isLg ? 'h-12 border-border/60 p-1' : 'h-10 border-border/60')
      }
    >
      <div className="flex flex-1 items-center gap-2 ps-3">
        <SearchIcon size={isLg ? 18 : 14} className="text-foreground/50" />
        <input
          type="search"
          name="q"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('placeholder')}
          autoFocus={autoFocus}
          className={
            'w-full bg-transparent pe-2 text-foreground placeholder:text-foreground/40 focus:outline-none ' +
            (isLg ? 'text-base' : 'text-sm')
          }
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
            }}
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-foreground/50 transition hover:bg-foreground/5 hover:text-foreground"
            aria-label="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={
          'flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 ' +
          (isLg ? 'px-4 text-sm font-semibold' : 'px-3 text-xs font-semibold')
        }
      >
        {isPending ? (
          <Loader2 size={isLg ? 16 : 12} className="animate-spin" />
        ) : (
          <SearchIcon size={isLg ? 16 : 12} />
        )}
        {isLg && <span>{t('placeholder').split(' ')[0]}</span>}
      </button>
    </form>
  );
}
