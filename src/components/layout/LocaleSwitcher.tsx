'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Language toggle ar ⇄ en.
 * Preserves current pathname when switching.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = locale === 'ar' ? 'en' : 'ar';
  const label = locale === 'ar' ? 'English' : 'العربية';

  function handleClick() {
    startTransition(() => {
      router.replace(pathname, { locale: switchTo });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
        'text-body-small text-muted-steel',
        'hover:bg-zinc-100 hover:text-charcoal-ink',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
        isPending && 'opacity-50 pointer-events-none'
      )}
      aria-label={`Switch to ${switchTo === 'ar' ? 'Arabic' : 'English'}`}
    >
      <Languages className="size-4" />
      <span>{label}</span>
    </button>
  );
}
