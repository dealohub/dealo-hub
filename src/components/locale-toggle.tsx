'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

/**
 * LocaleToggle — floating AR/EN switcher.
 *
 * Sits next to the theme toggle. Preserves the current path + query
 * while swapping the locale prefix via next-intl's router.
 */
export default function LocaleToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next = locale === 'ar' ? 'en' : 'ar';
  const label = next.toUpperCase();

  return (
    <button
      type="button"
      aria-label={`Switch language to ${next}`}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.replace(pathname, { locale: next });
        });
      }}
      className="fixed bottom-4 end-16 z-50 hidden md:grid h-10 min-w-10 place-items-center rounded-full border border-border bg-background/80 px-3 text-xs font-semibold uppercase tracking-wider text-foreground shadow-lg backdrop-blur transition hover:bg-muted disabled:opacity-60"
    >
      {label}
    </button>
  );
}
