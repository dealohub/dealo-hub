'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();

  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className={cn(
          'inline-flex items-center gap-1.5',
          'h-9 px-3 rounded-md',
          'text-body-small text-muted-steel',
          'hover:bg-zinc-100 hover:text-charcoal-ink',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
          className
        )}
      >
        <LogOut className="size-4" />
        <span>{t('signOut')}</span>
      </button>
    </form>
  );
}
