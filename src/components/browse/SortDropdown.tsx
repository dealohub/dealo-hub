'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SORT_OPTIONS, type SortOption } from '@/lib/browse/types';

export function SortDropdown({ current }: { current: SortOption }) {
  const t = useTranslations('browse.sort');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === 'newest') next.delete('sort');
    else next.set('sort', value);
    next.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-full sm:w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map(opt => (
          <SelectItem key={opt} value={opt}>
            {t(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
