import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FilterBlockProps {
  labelKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent section wrapper for every filter block.
 * Supplies the uppercase label + spacing used by DESIGN.md Section 12.
 */
export function FilterBlock({ labelKey, children, className }: FilterBlockProps) {
  const t = useTranslations();
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-label uppercase tracking-wider text-muted-steel">{t(labelKey)}</h3>
      {children}
    </div>
  );
}
